'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getStats } from '@/services/api';

const fmtNum = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : String(n);

export default function Dashboard() {
  const [stats, setStats] = useState({ total_documents: 0, total_entities: 0, total_chunks: 0, daily_queries: 0 });

  useEffect(() => { getStats().then(s => setStats(s)).catch(() => {}); }, []);

  const metrics = [
    { label: 'Documents', value: fmtNum(stats.total_documents), detail: 'Total ingested' },
    { label: 'Entities', value: fmtNum(stats.total_entities), detail: 'Extracted' },
    { label: 'Indexed', value: fmtNum(stats.total_chunks), detail: 'Chunks processed' },
    { label: 'Queries', value: fmtNum(stats.daily_queries), detail: 'Today' },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="ml-[240px] flex-1">
        <main className="p-8 max-w-4xl">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-semibold text-[#111827] mb-1">Dashboard</h1>
            <p className="text-sm text-[#6B7280] mb-8">System metrics and knowledge base overview</p>

            <div className="grid grid-cols-4 gap-4 mb-10">
              {metrics.map(m => (
                <div key={m.label} className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280] mb-1">{m.label}</p>
                  <p className="text-2xl font-semibold text-[#111827]">{m.value}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">{m.detail}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="text-sm font-semibold text-[#111827] mb-4">System Status</h2>
              <div className="space-y-3">
                {[
                  { label: 'API', status: 'Operational' },
                  { label: 'Vector Database', status: 'Connected' },
                  { label: 'LLM Service', status: 'Ready' },
                  { label: 'Document Processor', status: 'Active' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                    <span className="text-sm text-[#6B7280]">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#059669]" />
                      <span className="text-xs text-[#111827] font-medium">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
