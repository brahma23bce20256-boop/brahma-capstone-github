"""Document ingestion & indexing: parse PDFs, PPTs, Word, spreadsheets, emails, logs."""

import os
import re
import uuid
import logging
import email
from pathlib import Path
from email import policy
from typing import Optional

from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from openpyxl import load_workbook

logger = logging.getLogger(__name__)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split *text* into overlapping chunks of approximately *chunk_size* characters.
    Stops when no forward progress is made."""
    if not text:
        return []
    chunks = []
    start = 0
    len_text = len(text)
    while start < len_text:
        end = min(start + chunk_size, len_text)
        # Try to break at a natural separator only if not at the end
        if end < len_text:
            for sep in (". ", ".\n", "\n\n", "\n", " "):
                idx = text.rfind(sep, start, end)
                if idx != -1:
                    end = idx + len(sep)
                    break
        chunk_text_slice = text[start:end].strip()
        if chunk_text_slice:
            chunks.append(chunk_text_slice)
        # Advance start, ensuring strict forward progress
        next_start = end - overlap
        if next_start <= start:
            next_start = end  # No overlap possible, skip to end to finish
        start = next_start
    return chunks


def read_file_content(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    readers = {
        ".pdf": _read_pdf, ".docx": _read_docx, ".doc": _read_docx,
        ".xlsx": _read_xlsx, ".xls": _read_xlsx,
        ".pptx": _read_pptx, ".ppt": _read_pptx,
        ".eml": _read_email, ".msg": _read_email,
        ".log": _read_log, ".txt": _read_text, ".md": _read_text,
        ".csv": _read_text, ".json": _read_text, ".html": _read_text,
        ".xml": _read_text, ".yaml": _read_text, ".yml": _read_text,
        ".cfg": _read_text, ".conf": _read_text, ".ini": _read_text, ".env": _read_text,
    }
    reader = readers.get(ext)
    if reader:
        return reader(file_path)
    raise ValueError(f"Unsupported file type: {ext}")


def _read_pdf(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join(p.extract_text() or "" for p in reader.pages)


def _read_docx(path: str) -> str:
    doc = DocxDocument(path)
    return "\n".join(p.text for p in doc.paragraphs)


def _read_xlsx(path: str) -> str:
    wb = load_workbook(path, data_only=True, read_only=True)
    lines = []
    for sheet in wb.sheetnames:
        ws = wb[sheet]
        lines.append(f"[Sheet: {sheet}]")
        for row in ws.iter_rows(values_only=True):
            row_str = " | ".join(str(c) if c is not None else "" for c in row)
            if row_str.strip():
                lines.append(row_str)
    return "\n".join(lines)


def _read_pptx(path: str) -> str:
    try:
        from pptx import Presentation
        prs = Presentation(path)
        texts = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    texts.append(shape.text)
                if shape.has_table:
                    for row in shape.table.rows:
                        texts.append(" | ".join(cell.text for cell in row.cells))
        return "\n".join(texts)
    except ImportError:
        logger.warning("python-pptx not installed.")
        return "[PPTX content requires: pip install python-pptx]"


def _read_email(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            msg = email.message_from_file(f, policy=policy.default)
    except Exception:
        with open(path, "r", encoding="latin-1", errors="replace") as f:
            msg = email.message_from_file(f, policy=policy.default)
    parts = [
        f"From: {msg.get('From', '')}", f"To: {msg.get('To', '')}",
        f"Subject: {msg.get('Subject', '')}", f"Date: {msg.get('Date', '')}",
    ]
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body = part.get_content()
                break
    else:
        body = msg.get_content()
    if body:
        parts.append(f"Body:\n{body}")
    return "\n".join(parts)


def _read_log(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def classify_document(text: str, filename: str) -> dict:
    ext = Path(filename).suffix.lower()
    tl = text.lower()
    cats = {
        "financial": ["revenue", "profit", "loss", "earnings", "financial", "budget", "quarter"],
        "legal": ["contract", "agreement", "compliance", "regulation", "clause", "liability"],
        "technical": ["api", "architecture", "deployment", "server", "database", "microservice"],
        "hr": ["employee", "hiring", "payroll", "benefits", "onboarding", "performance"],
        "support": ["ticket", "customer", "issue", "bug", "support", "complaint"],
    }
    category = "general"
    max_score = 0
    for cat, kws in cats.items():
        score = sum(1 for kw in kws if kw in tl)
        if score > max_score:
            max_score = score
            category = cat
    return {
        "file_type": ext, "category": category,
        "char_count": len(text), "word_count": len(text.split()),
        "estimated_pages": max(1, len(text) // 3000),
    }


class DocumentProcessor:
    """Full document ingestion pipeline: read → classify → chunk → embed → index."""

    def __init__(self, rag_engine):
        self.rag = rag_engine

    def process(self, file_path: str, doc_id: Optional[str] = None, metadata: Optional[dict] = None) -> dict:
        if metadata is None:
            metadata = {}
        doc_id = doc_id or str(uuid.uuid4())
        filename = Path(file_path).name
        try:
            text = read_file_content(file_path)
            if not text.strip():
                return {"id": doc_id, "filename": filename, "status": "error", "chunks": 0, "error": "No extractable text"}
            doc_info = classify_document(text, filename)
            metadata.update(doc_info)
            metadata["filename"] = filename
            chunks = chunk_text(text)
            count, error = 0, ""
            try:
                count = self.rag.upsert_document_chunks(doc_id=doc_id, filename=filename, chunks=chunks, metadata=metadata)
            except Exception as e:
                error = str(e)
            return {
                "id": doc_id, "filename": filename, "status": "completed" if not error else "completed_no_index",
                "chunks": len(chunks), "vectors_indexed": count, "category": doc_info["category"],
                "word_count": doc_info["word_count"], "error": error,
            }
        except Exception as exc:
            logger.exception("Failed to process %s", filename)
            return {"id": doc_id, "filename": filename, "status": "error", "chunks": 0, "error": str(exc)}
