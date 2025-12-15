const { getEmbedding } = require('./src/utils/gemini');

async function test() {
    try {
        console.log("Testing Embedding...");
        const res = await getEmbedding("Hello world");
        console.log("Embedding success, length:", res.length);
    } catch (e) {
        console.error("Embedding Failed:", e);
    }
}
test();
