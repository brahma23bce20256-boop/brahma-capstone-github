# Enterprise RAG Knowledge Intelligence System

A centralized **Knowledge Intelligence** platform for organizations to ingest diverse data sources and interact with them using **Retrieval-Augmented Generation (RAG)** and **data mining**.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + TypeScript)                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │  Dashboard  │ │ Knowledge  │ │     AI     │ │   Insight   │ │
│  │            │ │    Hub     │ │  Workspace │ │    Miner    │ │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├──────────────┤ │
│  │   Graph    │ │  Settings  │ │   Landing  │ │              │ │
│  │  Explorer  │ │            │ │   (index)  │ │              │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
│                      Shared Components:                          │
│              Sidebar · TopNav · StatusFooter · API Service       │
└───────────────────────────┬──────────────────────────────────────┘
                            │ Next.js Rewrites Proxy (/api/*)
┌───────────────────────────▼──────────────────────────────────────┐
│                  FastAPI Backend (Port 8000)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐│
│  │    RAG   │ │Document  │ │  Config  │ │  Models / Endpoints  ││
│  │  Engine  │ │Processor │ │          │ │  (12 REST APIs)      ││
│  └────┬─────┘ └────┬─────┘ └──────────┘ └──────────────────────┘│
└───────┼─────────────┼────────────────────────────────────────────┘
        │             │
┌───────▼─────────────▼────────────────────────────────────────────┐
│                       External Services                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │ Pinecone │ │   Groq   │ │HuggingFace│ │  MongoDB / Appwrite │ │
│  │ Vector DB│ │   LLM    │ │Embeddings│ │  (opt. storage)     │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Intelligence Dashboard (`/dashboard`)
High-level overview of knowledge health, recent activity, and mined insights with interactive SVG charts and system metrics. Fetches live stats from `/api/stats`.

### 2. Knowledge Hub (`/knowledge-hub`)
Management of data sources (PDFs, spreadsheets, APIs). Real-time status of indexing and vectorization with pipeline monitoring. Ingestion management table with status badges.

### 3. AI Workspace (`/ai-workspace`)
Primary RAG Q&A interface featuring:
- Three-column layout (chat history + conversation + source citations)
- Source attribution with relevance scores [1][2][3]
- Generation controls (temperature, top-K sliders)
- Terminal-lite input with Enterprise Pro design

### 4. Insight Miner (`/insight-miner`)
Deep-dive analytics with bento-grid layout:
- Topic Modeling Clusters (SVG cluster visualization)
- Entity Distribution with progress bars
- Pattern Detection & Anomaly Scoring table
- RAG Assistant correlation insights

### 5. Entity & Graph Explorer (`/graph-explorer`)
Interactive knowledge graph (SVG) showing:
- Organization, Location, Event, Document nodes
- Relationship edges between entities
- Search overlay with category legend
- Entity detail panel with metrics

### 6. System Settings (`/settings`)
- API key management (OpenAI, Pinecone, Groq, HuggingFace)
- Vector storage health circular gauge (90%)
- Access controls table with user roles
- System preferences (theme, language, notifications)
- Danger Zone (re-index / reset)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
| Backend | Python FastAPI (11+ endpoints) |
| Vector DB | Pinecone |
| LLM | Groq (Llama 3.1 8B) |
| Embeddings | HuggingFace (all-MiniLM-L6-v2) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Icons | Material Symbols Outlined |

## Quick Start

### Prerequisites
- **Node.js** 18+ (for Next.js frontend)
- **Python** 3.10+ (for FastAPI backend)
- **Pinecone** account & index
- **Groq** API key

### 1. Environment Setup
Copy `.env` to project root with your API keys (template included).

### 2. Start Backend
```bash
cd "f:\UET LAHORE\6th Semester\Data_Mining\Knowledge_Based_RAG\Rag-Knowledge-Based-System"
.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8001
```
Backend starts on **http://localhost:8001** (≈30s startup for RAG engine init).

### 3. Start Frontend
```bash
cd frontend
npm install   # already done
npm run dev   # starts on http://localhost:3000
```

### 4. Open Application
Navigate to **[http://localhost:3000](http://localhost:3000)**

The Next.js dev server proxies `/api/*` requests to `http://localhost:8000/api/*`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | System statistics |
| POST | `/api/query` | RAG query with sources |
| POST | `/api/documents/upload` | Upload & ingest document |
| GET | `/api/documents` | List ingested documents |
| DELETE | `/api/documents/{id}` | Delete document & vectors |
| GET | `/api/conversations` | Conversation history |
| POST | `/api/conversations` | Save conversation |
| GET | `/api/patterns` | Pattern detections |
| GET | `/api/entities` | Top entities |
| GET | `/api/sources` | Data sources |
| POST | `/api/sources/connect` | Connect new source |
| GET | `/api/settings` | System settings |
| POST | `/api/settings/keys` | Update API key |

## Project Structure

```
├── backend/
│   ├── main.py                # FastAPI app (12 routes)
│   ├── config.py              # Env-based configuration
│   ├── models.py              # Pydantic request/response models
│   ├── rag_engine.py          # RAG pipeline (embed → retrieve → generate)
│   ├── document_processor.py  # PDF/DOCX/XLSX parsing & chunking
│   ├── requirements.txt       # Python dependencies
│   └── uploads/               # Uploaded document storage
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── globals.css            # Theme & custom styles
│   │   │   ├── dashboard/page.tsx     # Intelligence Dashboard
│   │   │   ├── knowledge-hub/page.tsx # Knowledge Hub
│   │   │   ├── ai-workspace/page.tsx  # AI Workspace (RAG Q&A)
│   │   │   ├── insight-miner/page.tsx # Insight Miner
│   │   │   ├── graph-explorer/page.tsx# Graph Explorer
│   │   │   └── settings/page.tsx      # System Settings
│   │   ├── components/
│   │   │   ├── Sidebar.tsx            # Persistent sidebar nav
│   │   │   ├── TopNav.tsx             # Top navigation bar
│   │   │   └── StatusFooter.tsx       # System status footer
│   │   ├── services/
│   │   │   └── api.ts                 # API client (fetch wrapper)
│   │   └── types/
│   │       └── index.ts               # TypeScript interfaces
│   ├── next.config.ts      # API proxy rewrites
│   ├── package.json
│   └── tsconfig.json
├── .env                    # Environment variables
└── README.md
```

## Design System

- **Style**: "Enterprise Pro" - clean, high-density, trustworthy
- **Colors**: Deep slate/navy (#0F172A), vibrant cyan (#57DFFE), neutral grays
- **Typography**: Inter (UI), JetBrains Mono (terminal/data)
- **Components**: Sidebar navigation, data tables, terminal-lite chat, chart cards
