CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50),
    source_url_or_path TEXT,
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT,
    embedding FLOAT8[], -- Fallback to native array
    chunk_index INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
