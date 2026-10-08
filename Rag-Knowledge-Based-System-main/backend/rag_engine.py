"""RAG Engine: embedding, retrieval, and LLM-based answer generation."""

import time
import logging
from typing import Optional

from backend.config import settings

logger = logging.getLogger(__name__)


class RAGEngine:
    """Retrieval-Augmented Generation engine.

    Handles embedding generation, vector search (Pinecone), and
    LLM-based answer synthesis (Groq). Falls back to local
    keyword-based retrieval when embedding model is unavailable.
    """

    def __init__(self):
        self.embed_model = None
        self.pinecone_index = None
        self.groq_client = None
        self._initialized = False
        # Local fallback storage: doc_id -> {chunks: [{text, metadata}], filename, ...}
        self.local_store: dict[str, dict] = {}

    def initialize(self):
        """Lazy initialisation of heavy dependencies."""
        if self._initialized:
            return

        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading embedding model: %s", settings.HUGGINGFACE_EMBED_MODEL)
            self.embed_model = SentenceTransformer(settings.HUGGINGFACE_EMBED_MODEL)
        except Exception as exc:
            logger.warning("Embedding model load failed (using mock): %s", exc)
            self.embed_model = None

        try:
            from pinecone import Pinecone, ServerlessSpec
            logger.info("Connecting to Pinecone index: %s", settings.PINECONE_INDEX_NAME)
            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            if settings.PINECONE_INDEX_NAME not in pc.list_indexes().names():
                logger.info("Creating new Pinecone index: %s", settings.PINECONE_INDEX_NAME)
                pc.create_index(
                    name=settings.PINECONE_INDEX_NAME,
                    dimension=384,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                )
            self.pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
        except Exception as exc:
            logger.warning("Pinecone connection failed (using mock): %s", exc)

        try:
            from groq import Groq
            logger.info("Initialising Groq client (model: %s)", settings.GROQ_MODEL)
            self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        except Exception as exc:
            logger.warning("Groq client init failed (using mock): %s", exc)

        self._initialized = True
        logger.info("RAGEngine initialised")

    # ── Embedding ────────────────────────────────────────────

    def embed(self, text: str) -> list[float]:
        """Return dense vector for *text*."""
        if not self.embed_model:
            self.initialize()
        if self.embed_model is None:
            raise RuntimeError("Embedding model not available")
        return self.embed_model.encode(text).tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Return dense vectors for a batch of texts."""
        if not self.embed_model:
            self.initialize()
        return self.embed_model.encode(texts).tolist()

    # ── Retrieval ────────────────────────────────────────────

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        """Search Pinecone and return top-k matches with metadata.
        Falls back to local keyword search when unavailable."""
        if not self._initialized:
            self.initialize()

        # Try Pinecone first
        if self.embed_model is not None and self.pinecone_index is not None:
            try:
                query_vec = self.embed(query)
                results = self.pinecone_index.query(
                    namespace=settings.PINECONE_NAMESPACE,
                    vector=query_vec,
                    top_k=top_k,
                    include_metadata=True,
                )
                docs = []
                for match in results.get("matches", []):
                    docs.append({
                        "id": match["id"],
                        "score": match["score"],
                        "metadata": match.get("metadata", {}),
                    })
                return docs
            except Exception as exc:
                logger.warning("Pinecone query failed, using local fallback: %s", exc)

        # Local fallback: keyword scoring over stored chunks
        if not self.local_store:
            return []

        query_lower = query.lower()
        query_words = query_lower.split()

        # Build a list of scored (chunk_entry, score) for each document's chunks
        scored = []
        for doc_id, doc_data in self.local_store.items():
            chunks = doc_data.get("chunks", [])
            if not chunks:
                continue
            # Also build full text for broader matching
            full_text = " ".join(ch.get("text", "") for ch in chunks).lower()
            fname = doc_data.get("filename", "").lower()

            for ci, chunk_entry in enumerate(chunks):
                text = chunk_entry.get("text", "")
                text_lower = text.lower()

                score = 0.0
                matched = 0
                for w in query_words:
                    # Substring match (lenient)
                    if w in text_lower or w in fname:
                        score += 0.15
                        matched += 1
                    # Partial match against full text
                    elif w in full_text:
                        score += 0.08
                        matched += 1
                    # Single word match for longer words (stem-like)
                    elif len(w) > 4:
                        for tw in text_lower.split():
                            if w in tw or tw in w:
                                score += 0.06
                                matched += 1
                                break

                # Exact phrase bonus
                if query_lower in text_lower or query_lower in full_text:
                    score += 0.5

                # Filename bonus
                if query_lower in fname or any(w in fname for w in query_words):
                    score += 0.3

                if score > 0:
                    scored.append((score, {
                        "id": f"{doc_id}_chunk_{ci:04d}",
                        "score": min(score, 1.0),
                        "metadata": chunk_entry.get("metadata", {}),
                    }))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [s[1] for s in scored[:top_k]]

    # ── Generation ───────────────────────────────────────────

    def generate(self, query: str, context_docs: list[dict], temperature: float = 0.7) -> str:
        """Build a prompt from context and query the LLM."""
        if not self.groq_client:
            self.initialize()

        # Build context string
        context_parts = []
        for i, doc in enumerate(context_docs, 1):
            content = doc.get("metadata", {}).get("content", "")
            source = doc.get("metadata", {}).get("filename", f"doc_{i}")
            context_parts.append(f"[{i}] Source: {source}\n{content[:2000]}")

        context_str = "\n\n".join(context_parts)

        system_prompt = (
            "You are an expert enterprise knowledge intelligence assistant. "
            "Answer the user's question based **only** on the provided context. "
            "If the context does not contain enough information, say so clearly. "
            "Cite sources using [1], [2], etc. Be concise, accurate, and professional."
        )

        user_prompt = (
            f"Context:\n{context_str}\n\n"
            f"Question: {query}\n\n"
            "Provide a thorough, well-structured answer with source citations."
        )

        response = self.groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=1024,
        )

        return response.choices[0].message.content

    # ── Full pipeline ────────────────────────────────────────

    def query(self, query_text: str, top_k: int = 5, temperature: float = 0.7) -> dict:
        """End-to-end RAG: retrieve → generate → return answer + sources."""
        t0 = time.perf_counter()

        retrieved = self.retrieve(query_text, top_k=top_k)

        if not retrieved:
            answer = (
                "I could not find any relevant documents in the knowledge base "
                "to answer your question. Please try a different query or ingest "
                "related documents first."
            )
            elapsed = int((time.perf_counter() - t0) * 1000)
            return {"answer": answer, "sources": [], "confidence": 0.0, "processing_time_ms": elapsed}

        answer = self.generate(query_text, retrieved, temperature=temperature)

        sources = []
        for doc in retrieved:
            sources.append({
                "id": doc["id"],
                "filename": doc.get("metadata", {}).get("filename", "unknown"),
                "content": doc.get("metadata", {}).get("content", "")[:300],
                "relevance": round(doc["score"], 4),
                "metadata": doc.get("metadata", {}),
            })

        # Approximate confidence based on top score
        confidence = round(max(d["score"] for d in retrieved), 4) if retrieved else 0.0
        elapsed = int((time.perf_counter() - t0) * 1000)

        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "processing_time_ms": elapsed,
        }

    def upsert_document_chunks(
        self, doc_id: str, filename: str, chunks: list[str], metadata: dict = None
    ) -> int:
        """Embed and upsert chunks into Pinecone. Falls back to local storage.
        Returns number of chunks stored."""
        if not self._initialized:
            self.initialize()

        if metadata is None:
            metadata = {}

        # Build chunk entries
        chunk_entries = []
        for i, chunk in enumerate(chunks):
            chunk_entries.append({
                "text": chunk,
                "metadata": {
                    "content": chunk,
                    "filename": filename,
                    "doc_id": doc_id,
                    "chunk_index": i,
                    **metadata,
                },
            })

        # Try Pinecone upsert
        if self.embed_model is not None and self.pinecone_index is not None:
            try:
                vectors = []
                for i, chunk in enumerate(chunks):
                    vec = self.embed(chunk)
                    vectors.append({
                        "id": f"{doc_id}_chunk_{i:04d}",
                        "values": vec,
                        "metadata": chunk_entries[i]["metadata"],
                    })
                self.pinecone_index.upsert(
                    vectors=vectors,
                    namespace=settings.PINECONE_NAMESPACE,
                )
                logger.info("Upserted %d vectors to Pinecone for %s", len(chunks), filename)
            except Exception as exc:
                logger.warning("Pinecone upsert failed, storing locally: %s", exc)

        # Always store locally as fallback
        self.local_store[doc_id] = {
            "filename": filename,
            "chunks": chunk_entries,
            "metadata": metadata,
        }
        logger.info("Stored %d chunks locally for %s", len(chunks), filename)
        return len(chunks)

    def delete_document_vectors(self, doc_id: str):
        """Delete all vectors belonging to a document from Pinecone and local store."""
        if not self._initialized:
            self.initialize()
        # Delete from local store
        self.local_store.pop(doc_id, None)
        # Delete from Pinecone if available
        if self.pinecone_index is not None:
            try:
                self.pinecone_index.delete(
                    filter={"doc_id": {"$eq": doc_id}},
                    namespace=settings.PINECONE_NAMESPACE,
                )
            except Exception as exc:
                logger.warning("Pinecone delete failed: %s", exc)
