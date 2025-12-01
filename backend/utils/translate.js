import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const translateText = async (text) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
    You are a professional translator and spell checker.
    1. Translate the following text from English, Urdu, Roman English to English.
    2. Correct any spelling for example kool to cool.
    3. Keep formatting intact.
    4. just return the translated text, do not add any extra information.
    Text: ${text}
  `,
    });
    return response.text || text;
  } catch (error) {
    console.warn("Translation failed, using original text:", error.message);
    return text;
  }
};
