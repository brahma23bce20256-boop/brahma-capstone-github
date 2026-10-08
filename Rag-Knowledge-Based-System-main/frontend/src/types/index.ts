// ── Shared Types for RAG Knowledge Intelligence System ──

export interface QueryRequest {
  query: string;
  top_k?: number;
  temperature?: number;
}

export interface SourceDocument {
  id: string;
  filename: string;
  content: string;
  relevance: number;
  metadata: Record<string, unknown>;
}

export interface QueryResponse {
  answer: string;
  sources: SourceDocument[];
  confidence: number;
  processing_time_ms: number;
}

export interface DocumentIngest {
  id: string;
  filename: string;
  status: "processing" | "completed" | "error";
  chunks: number;
  vector_id?: string;
  error?: string;
}

export interface DocumentListItem {
  id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  status: string;
  chunks: number;
  vector_sync: number;
  category: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationTurn {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface Conversation {
  id?: string;
  title: string;
  turns: ConversationTurn[];
  created_at?: string;
  updated_at?: string;
}

export interface PatternDetection {
  pattern_id: string;
  trend_source: string;
  baseline_velocity: string;
  anomaly_score: number;
  status: "critical" | "monitoring" | "nominal";
}

export interface EntityItem {
  name: string;
  category: "Organization" | "Location" | "Person" | "Event";
  count: number;
}

export interface SourceItem {
  id?: string;
  name: string;
  source_type: "folder" | "api" | "database" | "s3";
  status: "active" | "syncing" | "error" | "archived";
  vector_sync_pct?: number;
  doc_count?: number;
  last_updated?: string;
}

export interface ApiKeyUpdate {
  provider: string;
  key: string;
}

export interface SystemStats {
  total_documents: number;
  total_entities: number;
  total_chunks: number;
  vector_space_health: number;
  daily_queries: number;
  active_clusters: number;
  avg_confidence: number;
  storage_used_gb: number;
  storage_total_gb: number;
  total_vectors: number;
  nodes_online: number;
  active_pipelines: number;
}

// ═════════════════════════════════════════════════════
// Data Mining Types (Semester Project)
// ═════════════════════════════════════════════════════

export interface FrequentItemset {
  items: string[];
  size: number;
  support: number;
  count: number;
}

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface AprioriResponse {
  frequent_itemsets: FrequentItemset[];
  association_rules: AssociationRule[];
  n_transactions: number;
}

export interface ClusterDocument {
  name: string;
  index: number;
}

export interface ClusterGroup {
  documents: ClusterDocument[];
  terms: string[];
  size: number;
}

export interface ClusteringResponse {
  clusters: ClusterGroup[];
  n_clusters: number;
  score: number;
}

export interface SentimentResult {
  filename: string;
  polarity: number;
  sentiment: string;
  confidence: number;
  positive_words: number;
  negative_words: number;
  total_words: number;
}

// ═════════════════════════════════════════════════════
// Evaluation / Efficiency Metrics
// ═════════════════════════════════════════════════════

export interface RetrievalEval {
  n_queries: number;
  precision_at_1: number;
  precision_at_3: number;
  precision_at_5: number;
  mrr: number;
  avg_top1_relevance: number;
  per_query?: { query: string; expected: string; retrieved_top3: string[]; found_at_rank: number | null }[];
  note?: string;
}

export interface ClassificationEval {
  n_docs: number;
  accuracy: number;
  macro_f1?: number;
  labels?: string[];
  confusion_matrix?: number[][];
  per_class?: { label: string; precision: number; recall: number; f1: number }[];
  per_doc?: { filename: string; expected: string; predicted: string; correct: boolean }[];
  note?: string;
}

export interface ClusteringEval {
  n_docs: number;
  n_clusters?: number;
  silhouette_score?: number | null;
  inertia?: number;
  purity?: number | null;
  assignments?: { filename: string; cluster: number; gold_group: string | null }[];
  note?: string;
}

export interface SentimentEval {
  n_docs: number;
  accuracy: number;
  details?: { filename: string; expected: string; predicted: string; polarity: number; correct: boolean }[];
  note?: string;
}

export interface LatencyStats {
  n: number;
  errors?: number;
  mean_ms?: number;
  median_ms?: number;
  p50_ms?: number;
  p95_ms?: number;
  p99_ms?: number;
  min_ms?: number;
  max_ms?: number;
  throughput_qps?: number;
  note?: string;
}

export interface PerformanceEval {
  embedding: LatencyStats;
  retrieval: LatencyStats;
  chunking: LatencyStats;
}

export interface VectorSpaceEval {
  n_docs?: number;
  n_intra_pairs?: number;
  n_inter_pairs?: number;
  avg_intra_topic_similarity?: number;
  avg_inter_topic_similarity?: number;
  separation?: number;
  quality?: "good" | "marginal" | "poor";
  note?: string;
}

export interface MiningEval {
  n_frequent_itemsets?: number;
  n_association_rules?: number;
  avg_rule_confidence?: number;
  avg_rule_lift?: number;
  max_itemset_size?: number;
  note?: string;
}

export interface FullEvaluation {
  retrieval: RetrievalEval;
  classification: ClassificationEval;
  clustering: ClusteringEval;
  sentiment: SentimentEval;
  performance: PerformanceEval;
  vector_space: VectorSpaceEval;
  mining: MiningEval;
  total_evaluation_time_ms: number;
  overall_efficiency_score: number;
}
