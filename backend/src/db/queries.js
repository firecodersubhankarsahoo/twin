const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

// Helper for single connection or pool. We'll use a pool in real app, but here direct client for simplicity or use 'pg' Pool.
const { Pool } = require('pg');
const pool = new Pool(dbConfig);

function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function insertDocument(title, sourceType, sourcePath) {
    const res = await pool.query(
        `INSERT INTO documents (title, source_type, source_url_or_path) VALUES ($1, $2, $3) RETURNING id`,
        [title, sourceType, sourcePath]
    );
    return res.rows[0].id;
}

async function insertChunk(docId, content, embedding, index) {
    await pool.query(
        `INSERT INTO chunks (document_id, content, embedding, chunk_index) VALUES ($1, $2, $3, $4)`,
        [docId, content, embedding, index]
    );
}

async function searchChunks(queryEmbedding, limit = 5) {
    // 1. Fetch all chunks (Prototype only! In prod use pgvector)
    const res = await pool.query(`SELECT id, content, embedding, document_id, created_at FROM chunks`);
    const allChunks = res.rows;

    // 2. Calculate Similarity
    const scored = allChunks.map(chunk => {
        return {
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
        };
    });

    // 3. Sort and slice
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
}

// Temporal search support
async function searchChunksWithTime(queryEmbedding, startDate, endDate, limit = 5) {
    // 1. Fetch filtered chunks (DB side filtering is fast)
    let query = `SELECT id, content, embedding, document_id, created_at FROM chunks WHERE 1=1`;
    const params = [];
    if (startDate) {
        params.push(startDate);
        query += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
        params.push(endDate);
        query += ` AND created_at <= $${params.length}`;
    }

    const res = await pool.query(query, params);
    const candidates = res.rows;

    // 2. Calculate Similarity
    const scored = candidates.map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
}

module.exports = {
    pool,
    insertDocument,
    insertChunk,
    searchChunks,
    searchChunksWithTime
};
