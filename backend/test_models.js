const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // There isn't a direct listModels in newer high-level SDK, 
        // but we can try a basic generation to see if it works or use the model manager if exposed.
        // Actually, the SDK wraps it. Let's try to just use 'gemini-pro' and see.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro works:", result.response.text());
    } catch (e) {
        console.error("gemini-pro failed:", e.message);
    }
}

listModels();
