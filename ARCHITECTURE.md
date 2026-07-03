# Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        LP[Landing Page]
        DP[Dashboard]
        UP[Upload Page]
        CP[Chat Page]
        API[API Client]
    end

    subgraph Backend["Backend (FastAPI)"]
        R[API Routes]
        DP_SRV[Document Processor]
        VS[Vector Store<br/>ChromaDB]
        CS[Chat Service<br/>RAG Engine]
        ES[Embedding Service]
    end

    subgraph External["External"]
        OLLAMA[Ollama<br/>LLM + Embeddings]
        FS[File System<br/>Uploads]
        DB[(SQLite)]
    end

    UP --> R
    R --> DP_SRV
    DP_SRV --> FS
    DP_SRV --> ES
    ES --> OLLAMA
    ES --> VS
    CP --> API
    API --> R
    R --> CS
    CS --> VS
    CS --> OLLAMA
    R --> DB
```

## Request Flows

### Upload Flow
```
User Uploads File → Next.js → POST /api/upload → FastAPI → 
Validate File → Save to Disk → Extract Text → 
Chunk Text → Generate Embeddings → Store in ChromaDB
```

### Chat Flow
```
User Asks Question → Next.js → POST /api/chat → FastAPI →
Semantic Search in ChromaDB → Retrieve Top-K Chunks →
Format Context → Send to Ollama LLM → 
Stream Response Back → Parse References →
Render Markdown in Chat UI
```

## Data Flow

```
Documents ─→ Text Extraction ─→ Chunking ─→ Embeddings ─→ ChromaDB
                                                              ↑
Question ─────────────────────────────────────────────────────┘
                                                              ↓
                                                     Retrieve Context
                                                              ↓
                                              LLM (Ollama) + System Prompt
                                                              ↓
                                                    Answer + References
```
