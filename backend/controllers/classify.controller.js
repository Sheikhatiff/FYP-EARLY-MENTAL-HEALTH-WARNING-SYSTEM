import fetch from 'node-fetch';

const DEFAULT_PY_BASE =  'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 15000; // 15s

/**
 * Helper: POST JSON to python service with timeout and error handling
 * @param {string} path - e.g. '/classify'
 * @param {object} body - JSON body
 * @param {number} timeoutMs
 */
async function callPython(path, body = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = `${DEFAULT_PY_BASE}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(id);

        // If the python service responds with non-OK, try to parse its JSON error
        if (!resp.ok) {
            let payload;
            try {
                payload = await resp.json();
            } catch (e) {
                payload = { error: `Non-OK response from python service: ${resp.status} ${resp.statusText}` };
            }
            const err = new Error(payload.error || `Python service error (${resp.status})`);
            err.status = 502; // Bad Gateway - upstream error
            err.details = payload;
            throw err;
        }

        // parse and return JSON
        const data = await resp.json();
        return data;
    } catch (err) {
        // Convert AbortError to a timed-out error
        if (err.name === 'AbortError') {
            const e = new Error(`Request to Python service timed out after ${timeoutMs}ms`);
            e.status = 504; // Gateway Timeout
            throw e;
        }
        // rethrow other errors but annotate if unreachable
        if (!err.status) {
            const e = new Error(`Python service unreachable: ${err.message}`);
            e.status = 502;
            throw e;
        }
        throw err;
    }
}

export const classify = async(text = "Hello") => await callPython('/classify', { text, top_k: 5 });


/**
 * Controller: POST /classify
 * Body: { text: string, top_k?: number }
 */
export async function classifyController(req, res) {
    try {
        const { text, top_k = 5 } = req.body ?? {};

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: "text" (non-empty string) is required.'
            });
        }

        const payload = { text, top_k };
        const result = await callPython('/classify', payload);

        return res.json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('classifyController error:', err);
        const status = err.status && Number.isInteger(err.status) ? err.status : 500;
        return res.status(status).json({
            success: false,
            error: err.message,
            details: err.details ?? undefined
        });
    }
}

/**
 * Controller: POST /batch
 * Body: { texts: string[], top_k?: number }
 * Performs parallel requests (Promise.all). If you prefer sequential, change accordingly.
 */
export async function batchClassifyController(req, res) {
    try {
        const { texts, top_k = 5 } = req.body ?? {};

        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: "texts" (non-empty array of strings) is required.'
            });
        }

        // Validate each item is a string
        for (const t of texts) {
            if (typeof t !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request: every entry in "texts" must be a string.'
                });
            }
        }

        // Run requests in parallel. If Python service cannot handle parallel load,
        // change to sequential processing (for loop + await).
        const jobs = texts.map(t => callPython('/classify', { text: t, top_k }));
        const results = await Promise.allSettled(jobs);

        // format results: fulfilled => data, rejected => error summary for that item
        const formatted = results.map((r, idx) => {
            if (r.status === 'fulfilled') {
                return { success: true, input: texts[idx], data: r.value };
            } else {
                return {
                    success: false,
                    input: texts[idx],
                    error: r.reason?.message || 'Unknown error',
                    status: r.reason?.status || 502
                };
            }
        });

        return res.json({ success: true, results: formatted });
    } catch (err) {
        console.error('batchClassifyController error:', err);
        const status = err.status && Number.isInteger(err.status) ? err.status : 500;
        return res.status(status).json({
            success: false,
            error: err.message
        });
    }
}

/**
 * Controller: GET /health
 * Simple ping to python /health (GET)
 */
export async function healthController(req, res) {
    try {
        // Because callPython is POST helper, do a simple GET with timeout here
        const url = `${DEFAULT_PY_BASE}/health`;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

        const resp = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(id);

        if (!resp.ok) {
            return res.status(502).json({
                success: false,
                error: `Python health check returned non-OK status: ${resp.status}`
            });
        }

        const payload = await resp.json();
        return res.json({ success: true, data: payload });
    } catch (err) {
        console.error('healthController error:', err);
        if (err.name === 'AbortError') {
            return res.status(504).json({ success: false, error: 'Health check timed out' });
        }
        return res.status(502).json({ success: false, error: `Python service unreachable: ${err.message}` });
    }
}
