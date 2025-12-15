const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelStart = "gemini-2.0-flash"; // Updated model name
const embeddingModelName = "text-embedding-004";

async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: embeddingModelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation(operation, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (err) {
            // Check for 429 or 503
            if (i < retries - 1 && (err.status === 429 || err.status === 503 || err.message.includes('429'))) {
                console.warn(`Attempt ${i + 1} failed with 429. Retrying in ${delay}ms...`);
                await sleep(delay);
                delay *= 2; // Exponential backoff
                continue;
            }
            throw err;
        }
    }
}

async function generateChatResponse(history, query, contextChunks) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextText = contextChunks.map(c => c.content).join("\n\n");
    const augmentedQuery = `
    You are a "Second Brain" AI assistant.
    Use the provided CONTEXT to answer the user's question.
    If the answer is not in the context, say you don't know based on the documents.
    Always cite the source (e.g. [Document Title]) if possible.
    
    CONTEXT:
    ${contextText}
    
    USER QUESTION: 
    ${query}
    `;

    // Sanitize history 
    let validHistory = [...history];
    if (validHistory.length > 0 && validHistory[0].role === 'model') {
        validHistory.shift();
    }

    const chatSession = model.startChat({
        history: validHistory
    });

    return retryOperation(async () => {
        const result = await chatSession.sendMessage(augmentedQuery);
        return result.response.text();
    });
}

async function generateImageDescription(imageBuffer, mimeType) {
    const model = genAI.getGenerativeModel({ model: modelStart });
    const result = await model.generateContent([
        {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: mimeType
            }
        },
        { text: "Describe this image in detail for a searchable knowledge base." }
    ]);
    return result.response.text();
}

// Audio handling - Gemini can take audio blobs directly
async function transcribeAndAnalyzeAudio(audioBuffer, mimeType) {
    const model = genAI.getGenerativeModel({ model: modelStart });
    const result = await model.generateContent([
        {
            inlineData: {
                data: audioBuffer.toString("base64"),
                mimeType: mimeType
            }
        },
        { text: "Transcribe this audio and summarize the key points." }
    ]);
    return result.response.text();
}

module.exports = {
    getEmbedding,
    generateChatResponse,
    generateImageDescription,
    transcribeAndAnalyzeAudio
};
