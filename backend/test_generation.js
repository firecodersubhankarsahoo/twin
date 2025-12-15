const { generateChatResponse } = require('./src/utils/gemini');

async function test() {
    try {
        console.log("Testing Generation...");
        // Pass empty history, query, empty context
        const res = await generateChatResponse([], "Hello", []);
        console.log("Generation success:", res);
    } catch (e) {
        console.error("Generation Failed:", e);
    }
}
test();
