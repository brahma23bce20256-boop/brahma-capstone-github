"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend folder
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    """Central settings for the RAG Knowledge Intelligence System."""

    # ── MongoDB ──────────────────────────────────────────────
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "rag_knowledge_system")

    # ── Pinecone ─────────────────────────────────────────────
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "rag-knowledge-index")
    PINECONE_HOST: str = os.getenv("PINECONE_HOST", "")
    PINECONE_NAMESPACE: str = os.getenv("PINECONE_NAMESPACE", "default")

    # ── Groq (LLM) ───────────────────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    # ── HuggingFace (Embeddings) ─────────────────────────────
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    HUGGINGFACE_EMBED_MODEL: str = os.getenv(
        "HUGGINGFACE_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    # ── Appwrite ─────────────────────────────────────────────
    APPWRITE_ENDPOINT: str = os.getenv("APPWRITE_ENDPOINT", "https://fra.cloud.appwrite.io/v1")
    APPWRITE_PROJECT_ID: str = os.getenv("APPWRITE_PROJECT_ID", "")
    APPWRITE_DATABASE_ID: str = os.getenv("APPWRITE_DATABASE_ID", "")
    APPWRITE_BUCKET_ID: str = os.getenv("APPWRITE_BUCKET_ID", "")
    APPWRITE_COLLECTION_DOCUMENTS: str = os.getenv(
        "APPWRITE_COLLECTION_DOCUMENTS", "rag_documents"
    )
    APPWRITE_COLLECTION_CONVERSATIONS: str = os.getenv(
        "APPWRITE_COLLECTION_CONVERSATIONS", "rag_conversations"
    )

    # ── Server ───────────────────────────────────────────────
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    UPLOAD_DIR: str = str(Path(__file__).resolve().parent / "uploads")


settings = Settings()
