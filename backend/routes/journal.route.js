import express from "express";
import {
  createJournal,
  deleteJournal,
  getJournalById,
  getJournals,
  updateJournal,
} from "../controllers/journal.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { translateText } from "../utils/translate.js";
import { classify } from "../controllers/classify.controller.js";
import { getDeviation } from "../controllers/baseline_deviation.controller.js";

const journalRouter = express.Router();

journalRouter.post("/test", async (req, res) => {
  try {
    const { text } = req.body;
    const translated = await translateText(text);
    res.status(200).json({ text: text, translatedText: translated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Translation Error", error: error.message });
  }
});

journalRouter.use(verifyToken);

journalRouter.get("/deviation",getDeviation)

journalRouter.post("/",classifyMiddleware, createJournal);

journalRouter.get("/", getJournals);

journalRouter.get("/:_id", getJournalById);

journalRouter.patch("/:_id", updateJournal);

journalRouter.delete("/:_id", deleteJournal);

//middleware for classify
async function classifyMiddleware (req, res, next) {
  if (req.body?.content) { 
    try {
      const translatedContent = await translateText(req.body.content);    
      req.result = await classify(translatedContent);
      console.log(translatedContent);
      next();
    } catch (error) {
      console.error("Classification Error:", error);
      res .status(500).json({ message: "Classification Error", error: error.message });
    }
  } else {
    next(); 
  } 
}

export default journalRouter;
