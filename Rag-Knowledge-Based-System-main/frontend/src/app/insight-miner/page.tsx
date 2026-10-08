'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getPatterns, getEntities, getTopics, getKeywords } from '@/services/api';

export default function InsightMiner() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getPatterns(), getEntities(), getTopics(), getKeywords()])
      .then(([p, e, t, k]) => { setPatterns(p); setEntities(e); setTopics(t); setKeywords(k); })
      .catch(() => {});
  }, []);

  const cats = [
    { name: 'Organization', count: entities.filter(e => e.category === 'Organization').length, color: '#2563EB' },
    { name: 'Person', count: entities.filter(e => e.category === 'Person').length, color: '#059669' },
    { name: 'Location', count: entities.filter(e => e.category === 'Location').length, color: '#D97706' },
    { name: 'Event', count: entities.filter(e => e.category === 'Event').length, color: '#7C3AED' },
  ];
  const maxCat = Math.max(...cats.map(c => c.count), 1);
  const topKw = keywords.slice(0, 5);
  const maxKw = Math.max(...topKw.map((k: any) => k.frequency || 0), 1);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="ml-[240px] flex-1">
        <main className="p-8 max-w-4xl">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-semibold text-[#111827] mb-1">Insight Miner</h1>
            <p className="text-sm text-[#6B7280] mb-8">Entity extraction, pattern detection, and topic analysis</p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Entities', value: entities.length },
                { label: 'Patterns', value: patterns.length },
                { label: 'Topics', value: topics.length },
                { label: 'Keywords', value: keywords.length },
              ].map(s => (
                <div key={s.label} className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280] mb-1">{s.label}</p>
                  <p className="text-2xl font-semibold text-[#111827]">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-6">
                <h2 className="text-sm font-semibold text-[#111827] mb-5">Entity Distribution</h2>
                <div className="space-y-3">
                  {cats.map(c => (
                    <div key={c.name}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-[#6B7280]">{c.name}</span>
                        <span className="text-xs font-medium text-[#111827]">{c.count}</span>
                      </div>
                      <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(c.count / maxCat) * 100}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-6">
                <h2 className="text-sm font-semibold text-[#111827] mb-5">Top Keywords</h2>
                {topKw.length > 0 ? (
                  <div className="space-y-3">
                    {topKw.map((kw: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-[#6B7280]">{kw.word}</span>
                          <span className="text-xs font-medium text-[#111827]">{kw.frequency}</span>
                        </div>
                        <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width: `${((kw.frequency || 0) / maxKw) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-[#6B7280]">No keywords extracted yet</p>}
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-[#E5E7EB]"><h2 className="text-sm font-semibold text-[#111827]">Pattern Detection</h2></div>
              {patterns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-[#F3F4F6]">
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280]">Pattern ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280]">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280]">Velocity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280]">Anomaly</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280]">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {patterns.map((p, i) => (
                        <tr key={i}>
                          <td className="px-6 py-3.5 text-xs font-medium text-[#111827]">{p.pattern_id}</td>
                          <td className="px-6 py-3.5 text-xs text-[#6B7280]">{p.trend_source}</td>
                          <td className="px-6 py-3.5 text-xs text-[#111827]">{p.baseline_velocity}</td>
                          <td className="px-6 py-3.5 text-xs"><span className="font-mono text-[#2563EB]">{p.anomaly_score.toFixed(2)}</span></td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              p.status === 'critical' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                              p.status === 'monitoring' ? 'bg-[#FFFBEB] text-[#D97706]' :
                              'bg-[#ECFDF5] text-[#059669]'
                            }`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="p-10 text-center text-xs text-[#6B7280]">Upload documents to detect patterns</div>}
            </div>

            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="text-sm font-semibold text-[#111827] mb-5">Topics</h2>
              {topics.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {topics.slice(0, 6).map((t, i) => (
                    <div key={i} className="p-4 bg-white border border-[#E5E7EB] rounded-lg">
                      <p className="text-xs font-medium text-[#111827] mb-2">Topic {t.topic_id || i + 1}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(t.keywords || []).slice(0, 4).map((kw: string, j: number) => (
                          <span key={j} className="px-2 py-0.5 bg-[#F3F4F6] text-[#111827] text-[10px] rounded">{kw}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-[#6B7280] text-center py-6">Upload documents to identify topics</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
