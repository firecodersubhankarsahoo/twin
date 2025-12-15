# System Design Document: "Second Brain" AI Companion

## 1. System Overview
The "Second Brain" is a personal AI companion capable of ingesting various data modalities (text, audio, web), indexing them for semantic and temporal retrieval, and engaging in natural language conversations with the user. The system leverages Large Language Models (LLMs) for reasoning and synthesis, backed by a vector-enabled relational database for long-term memory.

## 2. Architecture
The system follows a typical 3-tier architecture:
- **Presentation Layer**: React-based Single Page Application (SPA).
- **Application Layer**: Node.js/Express REST API handling ingestion, processing, and orchestration.
- **Data Layer**: PostgreSQL database for structured data (metadata, chat history) and vector embeddings (semantic memory).

### High-Level Data Flow
1.  **Ingestion**: User uploads file/URL -> Backend processes content -> LLM/Libraries extract text & metadata -> Embeddings generated -> Stored in DB.
2.  **Query**: User asks question -> Backend embeds query -> Vector Search finds relevant context -> Context + Query sent to LLM -> Answer generated -> Sent to Frontend.

## 3. Detailed Design

### 1.1 Multi-Modal Data Ingestion Pipeline
We tackle each modality by converting it into a common text/metadata format before embedding.

*   **Audio (.mp3, .m4a)**:
    *   **Processing**: Use Google Gemini 1.5 Flash/Pro (which supports native audio understanding) or OpenAI Whisper for transcription.
    *   **Strategy**: For this prototype, we will use **Gemini API's native multi-modal capabilities** or a transcription library (like `fluent-ffmpeg` or specialized APIs) to convert speech to text. The text is then chunked.
*   **Documents (.pdf, .md)**:
    *   **Processing**:
        *   **PDF**: Use `pdf-parse` to extract raw text.
        *   **Markdown/Text**: Read directly.
    *   **Metadata Extraction**: File creation date, author (if available), and title.
*   **Web Content (URLs)**:
    *   **Processing**: Use `cheerio` or `puppeteer` to fetch HTML and extract readable content (main article body), removing navigation/ads.
*   **Images**:
    *   **Processing**: Use a Multimodal LLM (Gemini 1.5 Flash) to generate a detailed textual description of the image.
    *   **Storage**: Store the image description as text and embed it. This allows "search by description".

### 1.2 Information Retrieval & Querying Strategy
We will use a **Hybrid Retrieval Strategy** prioritizing Semantic Search.

*   **Primary: Semantic Search (Vector Embeddings)**:
    *   Convert user queries and stored chunks into high-dimensional vectors (using Gemini Text Embedding model).
    *   Perform Cosine Similarity search to find conceptually related chunks, even if keywords don't match exactly.
*   **Secondary: Temporal Filtering**:
    *   Apply SQL `WHERE` clauses to filter results by timestamp before/during vector ranking.
*   **Justification**: Semantic search allows the "brain" to understand intent (e.g., "that meeting regarding marketing" matches "marketing weekly sync notes").

### 1.3 Data Indexing & Storage Model
*   **Chunking**:
    *   Text is split into chunks of ~500-1000 tokens with a slight overlap (e.g., 100 tokens) to preserve context across boundaries.
*   **Indexing**:
    *   We use **PostgreSQL** with the `pgvector` extension (if available) or simulate vector storage with array columns for the prototype.
    *   **Schema**:
        *   `documents`: Stores source files/URLs (id, type, source_path, created_at).
        *   `chunks`: Stores the actual text segments and embeddings (id, document_id, content, embedding, created_at).
        *   `chats`: Stores conversation history.
*   **Database Schema (SQL)**:
    ```sql
    CREATE TABLE documents (
        id SERIAL PRIMARY KEY,
        source_type VARCHAR(50), -- 'pdf', 'audio', 'web', 'text'
        source_url_or_path TEXT,
        title TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE chunks (
        id SERIAL PRIMARY KEY,
        document_id INT REFERENCES documents(id),
        content TEXT,
        embedding VECTOR(768), -- Assuming Gemini embedding dimension
        chunk_index INT,
        created_at TIMESTAMP -- Inherited from document for temporal search
    );
    ```

### 1.4 Temporal Querying Support
*   Every ingested document preserves its original `created_at` timestamp (if available from filesystem) or ingestion time.
*   Queries like "What did I work on last week?" will first pass through an LLM to extract the time range (e.g., `start_date`, `end_date`).
*   The SQL query will filter: `SELECT * FROM chunks WHERE created_at BETWEEN $1 AND $2 ORDER BY embedding <=> query_vector LIMIT 5`.

### 1.5 Scalability and Privacy
*   **Scalability**: Postgres is highly robust. For thousands of docs, B-tree indexes on time and IVFFlat indexes on vectors ensure sub-second queries.
*   **Privacy**:
    *   **Local-First Potential**: Using local embeddings and local LLMs (like Ollama) would offer 100% privacy but requires heavy client resources.
    *   **Cloud (Current)**: We use Gemini API. Data is sent to Google for processing. We encrypt data at rest in Postgres.

## 4. Part 2: Backend Implementation Plan
*   **Stack**: Node.js (Express), Postgres (`pg`), `google-generative-ai`.
*   **Endpoints**:
    *   `POST /api/ingest/upload`: Handle file uploads.
    *   `POST /api/ingest/url`: Handle URL scraping.
    *   `POST /api/chat`: Handle Q&A.

## 5. Part 3: Frontend Implementation Plan
*   **Stack**: React (Vite), CSS (Modules or plain).
*   **UI Reference**: Modern, dark-mode, "Apple-like" aesthetic. Glassmorphism for containers.
*   **Features**:
    *   Sidebar for history (optional/MVP).
    *   Main Chat area with "Streaming" text effect.
    *   Upload Modal/Drag-and-drop zone.
