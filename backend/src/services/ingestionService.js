const fs = require('fs');
const pdf = require('pdf-parse');
const cheerio = require('cheerio');
const axios = require('axios');
const { getEmbedding, transcribeAndAnalyzeAudio, generateImageDescription } = require('../utils/gemini');
const { insertDocument, insertChunk } = require('../db/queries');

async function processFile(file, type) {
    let textContent = "";
    let title = file.originalname;

    if (type === 'pdf') {
        const dataBuffer = fs.readFileSync(file.path);
        const data = await pdf(dataBuffer);
        textContent = data.text;
    } else if (type === 'audio') {
        const dataBuffer = fs.readFileSync(file.path);
        // Mime type detection is basic here, assume mp3/m4a
        const mimeType = file.mimetype;
        textContent = await transcribeAndAnalyzeAudio(dataBuffer, mimeType);
        // textContent here is the transcription + summary.
    } else if (type === 'image') {
        const dataBuffer = fs.readFileSync(file.path);
        textContent = await generateImageDescription(dataBuffer, file.mimetype);
    } else if (type === 'text' || type === 'md') {
        textContent = fs.readFileSync(file.path, 'utf8');
    }

    // Chunking
    const chunks = splitTextIntoChunks(textContent, 1000, 100);

    // Save Document
    const docId = await insertDocument(title, type, file.path);

    // Process Chunks
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const embedding = await getEmbedding(chunkText);
        await insertChunk(docId, chunkText, embedding, i);
    }

    return docId;
}

async function processUrl(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Simple extraction: Remove scripts, styles, verify text
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();

    const title = $('title').text() || url;
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    const chunks = splitTextIntoChunks(textContent, 1000, 100);
    const docId = await insertDocument(title, 'web', url);

    for (let i = 0; i < chunks.length; i++) {
        const embedding = await getEmbedding(chunks[i]);
        await insertChunk(docId, chunks[i], embedding, i);
    }

    return docId;
}

function splitTextIntoChunks(text, maxSize, overlap) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = start + maxSize;
        if (end > text.length) end = text.length;

        chunks.push(text.slice(start, end));

        start += (maxSize - overlap);
    }
    return chunks;
}

module.exports = {
    processFile,
    processUrl
};
