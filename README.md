# Second Brain AI Companion

## Overview
A personal AI companion that ingests audio, documents, and web content to answer questions using a "Second Brain" architecture.
Built with Node.js, Express, PostgreSQL (with Vector/JSON search), Google Gemini 1.5 Flash/Pro, and React.

## Prerequisites
- Node.js (v20+)
- PostgreSQL (v14+)
- Google Gemini API Key

## Setup & Run

### 1. Database Setup
Ensure PostgreSQL is running on standard port 5432.
The application will automatically create the `twin` database and tables on first run.

### 2. Backend
Navigate to `backend` folder:
```bash
cd backend
npm install
# Set your API key in .env if not already set
node src/db/setup.js  # Initialize DB
node src/index.js     # Start server (Port 3000)
```

### 3. Frontend
Navigate to `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## Features
- **Multi-modal Ingestion**: Upload PDF, Audio (mp3), Images, or paste URLs.
- **Semantic Search**: Retrieval Augmented Generation (RAG) using embeddings.
- **Temporal Querying**: Ask questions about specific timeframes ("last week").
- **Clean UI**: Dark mode, responsive design.

## Architecture
See `DESIGN.md` for the full System Design Document.



<img width="1934" height="996" alt="Screenshot 2025-12-15 231133" src="https://github.com/user-attachments/assets/6845ad9f-4941-4a8b-a87e-45dd6065c744" />




