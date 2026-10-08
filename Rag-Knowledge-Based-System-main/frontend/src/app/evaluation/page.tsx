'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { runFullEvaluation } from '@/services/api';
import type { FullEvaluation } from '@/types';

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: string | number; hint?: string; good?: boolean }> = ({ label, value, hint, good }) => (
  <div className="flex-1 min-w-[140px]">
    <div className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium">{label}</div>
    <div className={`text-2xl font-semibold mt-1 ${good === true ? 'text-emerald-600' : good === false ? 'text-rose-600' : 'text-[#111827]'}`}>
      {value}
    </div>
    {hint && <div className="text-xs text-[#6B7280] mt-0.5">{hint}</div>}
  </div>
);

const pct = (n: number | undefined | null) => (n === undefined || n === null) ? '—' : `${(n * 100).toFixed(1)}%`;
const num = (n: number | undefined | null, d = 3) => (n === undefined || n === null) ? '—' : n.toFixed(d);
const ms = (n: number | undefined | null) => (n === undefined || n === null) ? '—' : `${n.toFixed(1)} ms`;

export default function EvaluationPage() {
  const [data, setData] = useState<FullEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runFullEvaluation();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      <Sidebar />
      <div className="ml-[240px] flex-1">
        <main className="p-8 max-w-6xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#111827] mb-1">System Efficiency Evaluation</h1>
              <p className="text-sm text-[#6B7280]">Real metrics computed on your uploaded documents against a gold-standard test set.</p>
            </div>
            <div className="flex gap-2">
              {data && (
                <button onClick={downloadJson} className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#111827] text-sm font-medium hover:bg-[#F9FAFB]">
                  Export JSON
                </button>
              )}
              <button onClick={run} disabled={loading} className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] disabled:opacity-50">
                {loading ? 'Running…' : data ? 'Re-run Evaluation' : 'Run Full Evaluation'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 mb-6">{error}</div>
          )}

          {!data && !loading && (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center">
              <span className="material-symbols-outlined text-[#9CA3AF] text-5xl">monitoring</span>
              <h3 className="text-base font-semibold text-[#111827] mt-3">Ready to measure efficiency</h3>
              <p className="text-sm text-[#6B7280] mt-1 max-w-md mx-auto">
                Upload the sample docs in Knowledge Hub (amazon_q4_report.txt, hr_survey.txt, support_tickets.txt, …), then click Run Full Evaluation.
              </p>
              <p className="text-xs text-[#9CA3AF] mt-3">Metrics include: Precision@K, MRR, F1, Silhouette, cluster purity, latency p95, vector-space separation.</p>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#111827] border-t-transparent"></div>
              <p className="text-sm text-[#6B7280] mt-3">Running retrieval, classification, clustering, sentiment, latency, and vector-space evaluations…</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Overall score */}
              <div className="rounded-xl bg-gradient-to-br from-[#111827] to-[#1F2937] text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/60 font-medium">Overall Efficiency Score</div>
                    <div className="text-5xl font-bold mt-1">{data.overall_efficiency_score.toFixed(1)}<span className="text-2xl text-white/60">/100</span></div>
                    <div className="text-xs text-white/60 mt-2">Weighted blend of retrieval, classification, clustering, sentiment, and vector-space quality.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-white/60 font-medium">Evaluation runtime</div>
                    <div className="text-2xl font-semibold mt-1">{data.total_evaluation_time_ms} ms</div>
                  </div>
                </div>
              </div>

              {/* Retrieval */}
              <Card title="1. Retrieval Accuracy (RAG)" subtitle={`${data.retrieval.n_queries} gold queries from a hand-labeled test set`}>
                {data.retrieval.note ? (
                  <p className="text-sm text-[#6B7280]">{data.retrieval.note}</p>
                ) : (
                  <>
                    <div className="flex gap-6 flex-wrap mb-4">
                      <Stat label="Precision@1" value={pct(data.retrieval.precision_at_1)} hint="Top result is correct" good={data.retrieval.precision_at_1 >= 0.6} />
                      <Stat label="Precision@3" value={pct(data.retrieval.precision_at_3)} hint="Correct doc in top 3" good={data.retrieval.precision_at_3 >= 0.7} />
                      <Stat label="Precision@5" value={pct(data.retrieval.precision_at_5)} hint="Correct doc in top 5" good={data.retrieval.precision_at_5 >= 0.8} />
                      <Stat label="MRR" value={num(data.retrieval.mrr)} hint="Mean Reciprocal Rank" good={data.retrieval.mrr >= 0.6} />
                      <Stat label="Avg Relevance" value={num(data.retrieval.avg_top1_relevance)} hint="Top-1 cosine score" />
                    </div>
                    {data.retrieval.per_query && data.retrieval.per_query.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-[#2563EB] text-xs font-medium">Per-query breakdown ({data.retrieval.per_query.length})</summary>
                        <table className="w-full mt-3 text-xs border border-[#E5E7EB] rounded-lg overflow-hidden">
                          <thead className="bg-[#F9FAFB] text-[#6B7280]">
                            <tr><th className="text-left px-3 py-2">Query</th><th className="text-left px-3 py-2">Expected</th><th className="text-left px-3 py-2">Rank</th></tr>
                          </thead>
                          <tbody>
                            {data.retrieval.per_query.map((q, i) => (
                              <tr key={i} className="border-t border-[#E5E7EB]">
                                <td className="px-3 py-2 text-[#111827]">{q.query}</td>
                                <td className="px-3 py-2 text-[#6B7280] font-mono text-[11px]">{q.expected}</td>
                                <td className={`px-3 py-2 font-semibold ${q.found_at_rank === null ? 'text-rose-600' : q.found_at_rank === 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {q.found_at_rank ?? 'miss'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    )}
                  </>
                )}
              </Card>

              {/* Classification */}
              <Card title="2. Classification Accuracy" subtitle="Auto-classified category vs gold labels">
                {data.classification.note ? (
                  <p className="text-sm text-[#6B7280]">{data.classification.note}</p>
                ) : (
                  <>
                    <div className="flex gap-6 flex-wrap mb-4">
                      <Stat label="Accuracy" value={pct(data.classification.accuracy)} good={data.classification.accuracy >= 0.7} />
                      <Stat label="Macro F1" value={num(data.classification.macro_f1)} good={(data.classification.macro_f1 ?? 0) >= 0.6} />
                      <Stat label="Documents" value={data.classification.n_docs} />
                    </div>

                    {data.classification.per_class && (
                      <table className="w-full text-xs border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <thead className="bg-[#F9FAFB] text-[#6B7280]">
                          <tr>
                            <th className="text-left px-3 py-2">Class</th>
                            <th className="text-left px-3 py-2">Precision</th>
                            <th className="text-left px-3 py-2">Recall</th>
                            <th className="text-left px-3 py-2">F1</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.classification.per_class.map((c) => (
                            <tr key={c.label} className="border-t border-[#E5E7EB]">
                              <td className="px-3 py-2 font-mono text-[#111827]">{c.label}</td>
                              <td className="px-3 py-2">{num(c.precision)}</td>
                              <td className="px-3 py-2">{num(c.recall)}</td>
                              <td className="px-3 py-2">{num(c.f1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {data.classification.confusion_matrix && data.classification.labels && (
                      <details className="mt-4 text-sm">
                        <summary className="cursor-pointer text-[#2563EB] text-xs font-medium">Confusion matrix</summary>
                        <div className="mt-3 overflow-x-auto">
                          <table className="text-xs border border-[#E5E7EB] rounded-lg">
                            <thead className="bg-[#F9FAFB]">
                              <tr>
                                <th className="px-3 py-2 text-[#6B7280] text-left">Actual \ Predicted</th>
                                {data.classification.labels.map((l) => <th key={l} className="px-3 py-2 text-[#6B7280]">{l}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {data.classification.confusion_matrix.map((row, i) => (
                                <tr key={i} className="border-t border-[#E5E7EB]">
                                  <td className="px-3 py-2 font-medium text-[#111827]">{data.classification.labels![i]}</td>
                                  {row.map((v, j) => (
                                    <td key={j} className={`px-3 py-2 text-center ${i === j && v > 0 ? 'bg-emerald-50 text-emerald-700 font-semibold' : v > 0 ? 'bg-rose-50 text-rose-700' : 'text-[#9CA3AF]'}`}>{v}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </>
                )}
              </Card>

              {/* Clustering */}
              <Card title="3. Clustering Quality" subtitle="K-Means + TF-IDF, evaluated against gold topic groups">
                {data.clustering.note ? (
                  <p className="text-sm text-[#6B7280]">{data.clustering.note}</p>
                ) : (
                  <div className="flex gap-6 flex-wrap">
                    <Stat label="Silhouette" value={num(data.clustering.silhouette_score)} hint="−1 to 1 — higher is better" good={(data.clustering.silhouette_score ?? 0) > 0.1} />
                    <Stat label="Purity" value={pct(data.clustering.purity)} hint="Vs gold topic groups" good={(data.clustering.purity ?? 0) >= 0.7} />
                    <Stat label="Inertia" value={num(data.clustering.inertia, 2)} hint="Within-cluster SSE (lower = tighter)" />
                    <Stat label="Clusters" value={data.clustering.n_clusters ?? 0} hint={`${data.clustering.n_docs} docs`} />
                  </div>
                )}
              </Card>

              {/* Sentiment */}
              <Card title="4. Sentiment Accuracy" subtitle="Predicted sentiment vs gold labels">
                {data.sentiment.note ? (
                  <p className="text-sm text-[#6B7280]">{data.sentiment.note}</p>
                ) : (
                  <>
                    <div className="flex gap-6 flex-wrap mb-3">
                      <Stat label="Accuracy" value={pct(data.sentiment.accuracy)} good={data.sentiment.accuracy >= 0.6} />
                      <Stat label="Labeled docs" value={data.sentiment.n_docs} />
                    </div>
                    {data.sentiment.details && (
                      <table className="w-full text-xs border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <thead className="bg-[#F9FAFB] text-[#6B7280]">
                          <tr><th className="text-left px-3 py-2">Document</th><th className="text-left px-3 py-2">Expected</th><th className="text-left px-3 py-2">Predicted</th><th className="text-left px-3 py-2">Polarity</th><th className="text-left px-3 py-2">Correct</th></tr>
                        </thead>
                        <tbody>
                          {data.sentiment.details.map((d, i) => (
                            <tr key={i} className="border-t border-[#E5E7EB]">
                              <td className="px-3 py-2 font-mono text-[11px]">{d.filename}</td>
                              <td className="px-3 py-2">{d.expected}</td>
                              <td className="px-3 py-2">{d.predicted}</td>
                              <td className="px-3 py-2">{num(d.polarity)}</td>
                              <td className={`px-3 py-2 font-medium ${d.correct ? 'text-emerald-600' : 'text-rose-600'}`}>{d.correct ? '✓' : '✗'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </Card>

              {/* Performance */}
              <Card title="5. System Performance" subtitle="Latency distribution across 20 samples per operation">
                <div className="grid md:grid-cols-3 gap-6">
                  {(['embedding', 'retrieval', 'chunking'] as const).map((key) => {
                    const s = data.performance[key];
                    return (
                      <div key={key} className="rounded-lg border border-[#E5E7EB] p-4">
                        <div className="text-xs uppercase tracking-wider text-[#9CA3AF] font-medium mb-3">{key}</div>
                        {s.note ? (
                          <p className="text-xs text-[#6B7280]">{s.note}</p>
                        ) : (
                          <>
                            <div className="text-2xl font-semibold text-[#111827]">{ms(s.mean_ms)}</div>
                            <div className="text-xs text-[#6B7280] mt-0.5">mean</div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                              <div><div className="text-[#9CA3AF]">p50</div><div className="font-mono text-[#111827]">{ms(s.p50_ms)}</div></div>
                              <div><div className="text-[#9CA3AF]">p95</div><div className="font-mono text-[#111827]">{ms(s.p95_ms)}</div></div>
                              <div><div className="text-[#9CA3AF]">p99</div><div className="font-mono text-[#111827]">{ms(s.p99_ms)}</div></div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[#E5E7EB] text-xs">
                              <span className="text-[#9CA3AF]">Throughput: </span>
                              <span className="font-mono text-[#111827]">{s.throughput_qps} ops/s</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Vector space */}
              <Card title="6. Vector Space Quality" subtitle="Semantic separation between topic groups">
                {data.vector_space.note ? (
                  <p className="text-sm text-[#6B7280]">{data.vector_space.note}</p>
                ) : (
                  <div className="flex gap-6 flex-wrap">
                    <Stat label="Intra-topic sim." value={num(data.vector_space.avg_intra_topic_similarity)} hint={`${data.vector_space.n_intra_pairs} pairs — same topic`} />
                    <Stat label="Inter-topic sim." value={num(data.vector_space.avg_inter_topic_similarity)} hint={`${data.vector_space.n_inter_pairs} pairs — different topics`} />
                    <Stat label="Separation" value={num(data.vector_space.separation)} hint="Intra − Inter (higher = better)" good={(data.vector_space.separation ?? 0) > 0.05} />
                    <Stat label="Quality" value={data.vector_space.quality ?? '—'} good={data.vector_space.quality === 'good'} />
                  </div>
                )}
              </Card>

              {/* Mining */}
              <Card title="7. Data Mining Output" subtitle="Apriori association rule quality">
                {data.mining.note ? (
                  <p className="text-sm text-[#6B7280]">{data.mining.note}</p>
                ) : (
                  <div className="flex gap-6 flex-wrap">
                    <Stat label="Frequent itemsets" value={data.mining.n_frequent_itemsets ?? 0} />
                    <Stat label="Association rules" value={data.mining.n_association_rules ?? 0} />
                    <Stat label="Avg confidence" value={pct(data.mining.avg_rule_confidence)} good={(data.mining.avg_rule_confidence ?? 0) >= 0.7} />
                    <Stat label="Avg lift" value={num(data.mining.avg_rule_lift)} hint=">1 means positive correlation" good={(data.mining.avg_rule_lift ?? 0) > 1} />
                    <Stat label="Max itemset size" value={data.mining.max_itemset_size ?? 0} />
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
