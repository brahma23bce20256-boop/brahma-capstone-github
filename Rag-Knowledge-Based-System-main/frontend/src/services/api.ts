// ── API Service Layer ──
import type {
  QueryRequest, QueryResponse,
  DocumentListItem, DocumentIngest,
  Conversation, PatternDetection,
  EntityItem, SourceItem,
  SystemStats, ApiKeyUpdate,
  AprioriResponse, ClusteringResponse, SentimentResult,
  FullEvaluation,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

export const health = () => request<{ status: string }>("/health");
export const getStats = () => request<SystemStats>("/stats");

// ── RAG Query ──
export const queryRag = (body: QueryRequest) =>
  request<QueryResponse>("/query", { method: "POST", body: JSON.stringify(body) });

// ── Documents ──
export const listDocuments = () => request<DocumentListItem[]>("/documents");
export const deleteDocument = (id: string) =>
  request<{ status: string }>(`/documents/${id}`, { method: "DELETE" });

export const uploadDocument = async (file: File): Promise<DocumentIngest> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/documents/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
};

// ── Search ──
export const searchDocuments = (query: string, topK: number = 10) =>
  request<{ results: { id: string; filename: string; snippet: string; relevance: number; category: string }[]; total_results: number; processing_time_ms: number }>(
    `/search?q=${encodeURIComponent(query)}&top_k=${topK}`
  );

// ── Data Mining ──
export const getEntities = () => request<EntityItem[]>("/entities");
export const getPatterns = () => request<PatternDetection[]>("/patterns");
export const getTopics = () => request<{ topic_id: number; keywords: string[]; document_count: number; coherence: number }[]>("/topics");
export const getKeywords = () => request<{ word: string; frequency: number }[]>("/keywords");

// ── Conversations ──
export const listConversations = () => request<Conversation[]>("/conversations");
export const saveConversation = (conv: Conversation) =>
  request<Conversation>("/conversations", { method: "POST", body: JSON.stringify(conv) });
export const deleteConversation = (id: string) =>
  request<{ status: string }>(`/conversations/${id}`, { method: "DELETE" });

// ── Sources ──
export const getSources = () => request<SourceItem[]>("/sources");

// ── Settings ──
export const getSettings = () => request<Record<string, string>>("/settings");
export const updateApiKey = (update: ApiKeyUpdate) =>
  request<{ status: string; provider: string }>("/settings/keys", { method: "POST", body: JSON.stringify(update) });

// ── Advanced Data Mining ──
export const runApriori = (minSupport = 0.2, minConfidence = 0.5) =>
  request<AprioriResponse>(`/mining/apriori?min_support=${minSupport}&min_confidence=${minConfidence}`, { method: "POST" });

export const runClustering = (k = 3) =>
  request<ClusteringResponse>(`/mining/clusters?k=${k}`, { method: "POST" });

export const runSentiment = () =>
  request<SentimentResult[]>("/mining/sentiment", { method: "POST" });

// ── Evaluation / Efficiency Metrics ──
export const runFullEvaluation = () => request<FullEvaluation>("/evaluation/all");
