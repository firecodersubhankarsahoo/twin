const { getEmbedding, generateChatResponse } = require('../utils/gemini');
const { searchChunks, searchChunksWithTime } = require('../db/queries');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper to extract dates
async function extractMetadata(query) {
    // Determine if query has temporal aspect
    // We can use a fast LLM call for this.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze the user query: "${query}". 
    Extract any temporal/time constraints. Return JSON with keys: 
    "hasTimeConstraint" (boolean), 
    "startDate" (ISO string or null), 
    "endDate" (ISO string or null).
    If "last week", calculate dates based on current date: ${new Date().toISOString()}.
    `;

    try {
        const result = await model.generateContent(prompt);
        const json = JSON.parse(result.response.text());
        return json;
    } catch (e) {
        console.warn("Date extraction failed", e);
        return { hasTimeConstraint: false };
    }
}

exports.handleChat = async (req, res) => {
    try {
        const { message, previousHistory } = req.body;
        // previousHistory could be passed from frontend

        // 1. Extract Temporal Constraints
        const timeMeta = await extractMetadata(message);

        // 2. Embed Query
        const queryEmbedding = await getEmbedding(message);

        // 3. Search
        let contextChunks;
        if (timeMeta.hasTimeConstraint) {
            contextChunks = await searchChunksWithTime(queryEmbedding, timeMeta.startDate, timeMeta.endDate);
        } else {
            contextChunks = await searchChunks(queryEmbedding);
        }

        // 4. Generate Answer
        const formattedHistory = previousHistory || [];
        const response = await generateChatResponse(formattedHistory, message, contextChunks);

        res.json({
            response: response,
            sources: contextChunks.map(c => ({ id: c.document_id, score: c.score }))
        });

    } catch (error) {
        console.error("Chat Error:", error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return res.status(429).json({
                error: "The AI Brain is thinking too hard (Rate Limit Exceeded). Please try again in a minute.",
                response: "System is busy. Please wait a moment."
            });
        }
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};
