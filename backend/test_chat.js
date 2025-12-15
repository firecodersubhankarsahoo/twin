const axios = require('axios');

async function testChat() {
    try {
        const res = await axios.post('http://localhost:3000/api/chat', {
            message: "Hello",
            previousHistory: [
                { role: "model", parts: [{ text: "Hello world" }] }
            ]
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.error("Error Status:", err.response?.status);
        console.error("Error Data:", err.response?.data);
    }
}

testChat();
