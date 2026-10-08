'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { runApriori, runClustering, runSentiment, getEntities } from '@/services/api';
import type { AprioriResponse, ClusteringResponse, SentimentResult, AssociationRule, FrequentItemset } from '@/types';

export default function DataMining() {
  const [activeTab, setActiveTab] = useState<'apriori' | 'clustering' | 'sentiment'>('apriori');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apriori state
  const [aprioriData, setAprioriData] = useState<AprioriResponse | null>(null);
  const [minSupport, setMinSupport] = useState(0.2);
  const [minConfidence, setMinConfidence] = useState(0.5);

  // Clustering state
  const [clusterData, setClusterData] = useState<ClusteringResponse | null>(null);
  const [k, setK] = useState(3);

  // Sentiment state
  const [sentimentData, setSentimentData] = useState<SentimentResult[] | null>(null);

  const fetchApriori = async () => {
    setLoading(true); setError('');
    try { setAprioriData(await runApriori(minSupport, minConfidence)); } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const fetchClustering = async () => {
    setLoading(true); setError('');
    try { setClusterData(await runClustering(k)); } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const fetchSentiment = async () => {
    setLoading(true); setError('');
    try { setSentimentData(await runSentiment()); } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const tabs = [
    { id: 'apriori' as const, label: 'Association Rules', icon: 'link' },
    { id: 'clustering' as const, label: 'Document Clusters', icon: 'bubble_chart' },
    { id: 'sentiment' as const, label: 'Sentiment Analysis', icon: 'sentiment_satisfied' },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="ml-[240px] flex-1">
        <main className="p-8 max-w-5xl">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-semibold text-[#111827] mb-1">Data Mining Lab</h1>
            <p className="text-sm text-[#6B7280] mb-8">Semester project — advanced data mining algorithms</p>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#F3F4F6] rounded-lg p-1 mb-8 w-fit">
              {tabs.map(t => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setError(''); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === t.id ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">{error}</div>
            )}

            {/* ── APRIORI ── */}
            {activeTab === 'apriori' && (
              <div className="space-y-6">
                <div className="flex items-end gap-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                  <div>
                    <label className="text-xs text-[#6B7280] block mb-1">Min Support</label>
                    <input type="number" step="0.05" min="0.05" max="1" value={minSupport}
                      onChange={e => setMinSupport(Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:ring-1 focus:ring-[#2563EB] outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-[#6B7280] block mb-1">Min Confidence</label>
                    <input type="number" step="0.05" min="0.1" max="1" value={minConfidence}
                      onChange={e => setMinConfidence(Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:ring-1 focus:ring-[#2563EB] outline-none" />
                  </div>
                  <button onClick={fetchApriori} disabled={loading}
                    className="px-5 py-2 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 transition-colors">
                    {loading ? 'Mining...' : 'Run Apriori'}
                  </button>
                </div>

                {aprioriData && (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                        <h3 className="text-sm font-semibold text-[#111827] mb-3">
                          Frequent Itemsets ({aprioriData.frequent_itemsets.length})
                        </h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {aprioriData.frequent_itemsets.length === 0 && (
                            <p className="text-xs text-[#6B7280]">No frequent itemsets found. Lower min_support.</p>
                          )}
                          {aprioriData.frequent_itemsets.slice(0, 15).map((fs, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-[#E5E7EB] text-xs">
                              <span className="font-medium text-[#111827]">{fs.items.join(', ')}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[#9CA3AF]">size {fs.size}</span>
                                <span className="font-mono text-[#2563EB]">s={fs.support.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                        <h3 className="text-sm font-semibold text-[#111827] mb-3">
                          Association Rules ({aprioriData.association_rules.length})
                        </h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {aprioriData.association_rules.length === 0 && (
                            <p className="text-xs text-[#6B7280]">No rules found. Lower min_confidence or min_support.</p>
                          )}
                          {aprioriData.association_rules.slice(0, 15).map((r, i) => (
                            <div key={i} className="p-3 bg-white rounded-lg border border-[#E5E7EB] text-xs">
                              <p className="font-medium text-[#111827] mb-1">
                                {r.antecedent.join(', ')} → {r.consequent.join(', ')}
                              </p>
                              <div className="flex gap-3 text-[#6B7280]">
                                <span>conf: <span className="font-mono text-[#2563EB]">{r.confidence.toFixed(2)}</span></span>
                                <span>lift: <span className="font-mono text-[#2563EB]">{r.lift.toFixed(2)}</span></span>
                                <span>supp: {r.support.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">Transactions analyzed: {aprioriData.n_transactions}</p>
                  </>
                )}
              </div>
            )}

            {/* ── CLUSTERING ── */}
            {activeTab === 'clustering' && (
              <div className="space-y-6">
                <div className="flex items-end gap-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                  <div>
                    <label className="text-xs text-[#6B7280] block mb-1">K (clusters)</label>
                    <input type="number" min="2" max="10" value={k}
                      onChange={e => setK(Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:ring-1 focus:ring-[#2563EB] outline-none" />
                  </div>
                  <button onClick={fetchClustering} disabled={loading}
                    className="px-5 py-2 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 transition-colors">
                    {loading ? 'Clustering...' : 'Run K-Means'}
                  </button>
                </div>

                {clusterData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {clusterData.clusters.map((c, i) => (
                        <div key={i} className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center mb-3">
                            <span className="text-white text-xs font-bold">C{i + 1}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#111827] mb-2">Cluster {i + 1}</h3>
                          <p className="text-xs text-[#6B7280] mb-3">{c.size} document{c.size > 1 ? 's' : ''}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {c.terms.slice(0, 5).map(t => (
                              <span key={t} className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] text-[#6B7280]">{t}</span>
                            ))}
                          </div>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {c.documents.map(d => (
                              <p key={d.index} className="text-[10px] text-[#9CA3AF] truncate">{d.name}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                      {clusterData.n_clusters} clusters formed · Cohesion score: {clusterData.score.toFixed(3)}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── SENTIMENT ── */}
            {activeTab === 'sentiment' && (
              <div className="space-y-6">
                <div className="flex items-end gap-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                  <button onClick={fetchSentiment} disabled={loading}
                    className="px-5 py-2 bg-[#111827] text-white text-sm font-medium rounded-lg hover:bg-[#1F2937] disabled:opacity-50 transition-colors">
                    {loading ? 'Analyzing...' : 'Run Sentiment Analysis'}
                  </button>
                </div>

                {sentimentData && (
                  <div className="space-y-4">
                    {sentimentData.map((s, i) => (
                      <div key={i} className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-[#111827]">{s.filename}</h3>
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium ${
                            s.sentiment === 'positive' ? 'bg-[#ECFDF5] text-[#059669]' :
                            s.sentiment === 'negative' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                            'bg-[#F3F4F6] text-[#6B7280]'
                          }`}>{s.sentiment}</span>
                        </div>
                        {/* Polarity bar */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs text-[#DC2626]">Neg</span>
                          <div className="flex-1 h-3 bg-[#E5E7EB] rounded-full overflow-hidden relative">
                            <div className="absolute left-0 top-0 h-full bg-[#DC2626] rounded-full transition-all"
                              style={{ width: `${Math.max(0, -s.polarity * 100)}%` }} />
                            <div className="absolute right-0 top-0 h-full bg-[#059669] rounded-full transition-all"
                              style={{ width: `${Math.max(0, s.polarity * 100)}%` }} />
                            <div className="absolute top-0 h-full w-0.5 bg-[#111827]"
                              style={{ left: '50%' }} />
                          </div>
                          <span className="text-xs text-[#059669]">Pos</span>
                        </div>
                        <div className="flex gap-4 text-xs text-[#6B7280]">
                          <span>Polarity: <span className="font-mono font-medium text-[#111827]">{s.polarity.toFixed(3)}</span></span>
                          <span>Confidence: <span className="font-mono font-medium text-[#111827]">{(s.confidence * 100).toFixed(0)}%</span></span>
                          <span>Words: {s.total_words}</span>
                          <span className="text-[#059669]">+{s.positive_words}</span>
                          <span className="text-[#DC2626]">-{s.negative_words}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
