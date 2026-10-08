"""Pydantic models for request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class QueryRequest(BaseModel):
    query: str = Field(..., description="Natural language query")
    top_k: int = Field(default=5, ge=1, le=50)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class SourceDocument(BaseModel):
    id: str
    filename: str
    content: str
    relevance: float = Field(ge=0.0, le=1.0)
    metadata: dict = {}


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceDocument] = []
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    processing_time_ms: int = 0


class DocumentIngest(BaseModel):
    id: str
    filename: str
    status: str
    chunks: int = 0
    vectors_indexed: int = 0
    category: str = ""
    word_count: int = 0
    error: str = ""


class DocumentListItem(BaseModel):
    id: str
    filename: str
    file_type: str
    size_bytes: int
    status: str
    chunks: int = 0
    vector_sync: float = 0.0
    category: str = ""
    word_count: int = 0
    created_at: str
    updated_at: str


class SearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    id: str
    filename: str
    snippet: str
    relevance: float
    category: str = ""


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total_results: int
    processing_time_ms: int


class ConversationTurn(BaseModel):
    id: str = ""
    role: str
    content: str
    timestamp: str = ""


class Conversation(BaseModel):
    id: str = ""
    title: str = "Untitled"
    turns: list[ConversationTurn] = []
    created_at: str = ""
    updated_at: str = ""


class PatternDetection(BaseModel):
    pattern_id: str
    trend_source: str
    baseline_velocity: str
    anomaly_score: float
    status: str


class EntityItem(BaseModel):
    name: str
    category: str
    count: int = 1


class TopicCluster(BaseModel):
    topic_id: int
    keywords: list[str]
    document_count: int
    coherence: float


class SourceItem(BaseModel):
    id: str = ""
    name: str
    source_type: str
    status: str
    vector_sync_pct: float = 0.0
    doc_count: int = 0
    last_updated: str = ""


class ApiKeyUpdate(BaseModel):
    provider: str
    key: str


class SystemStats(BaseModel):
    total_documents: int = 0
    total_entities: int = 0
    total_chunks: int = 0
    vector_space_health: float = 100.0
    daily_queries: int = 0
    active_clusters: int = 0
    avg_confidence: float = 0.0
    storage_used_gb: float = 0.0
    storage_total_gb: float = 20.0
    total_vectors: int = 0
    nodes_online: int = 2
    active_pipelines: int = 3
    documents_by_category: dict = {}
    top_keywords: list = []


# ═══════════════════════════════════════════════════════════════
# Data Mining Models (Semester Project)
# ═══════════════════════════════════════════════════════════════

class FrequentItemset(BaseModel):
    items: list[str]
    size: int
    support: float
    count: int


class AssociationRule(BaseModel):
    antecedent: list[str]
    consequent: list[str]
    support: float
    confidence: float
    lift: float


class AprioriResponse(BaseModel):
    frequent_itemsets: list[FrequentItemset] = []
    association_rules: list[AssociationRule] = []
    n_transactions: int = 0


class ClusterDocument(BaseModel):
    name: str
    index: int


class ClusterGroup(BaseModel):
    documents: list[ClusterDocument] = []
    terms: list[str] = []
    size: int = 0


class ClusteringResponse(BaseModel):
    clusters: list[ClusterGroup] = []
    n_clusters: int = 0
    score: float = 0.0


class SentimentResult(BaseModel):
    filename: str = ""
    polarity: float = 0.0
    sentiment: str = "neutral"
    confidence: float = 0.5
    positive_words: int = 0
    negative_words: int = 0
    total_words: int = 0
