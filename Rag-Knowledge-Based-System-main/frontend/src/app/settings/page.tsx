'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getSettings } from '@/services/api';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getSettings().then(d => { if (d && Object.keys(d).length) setSettings(d); }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="ml-[240px] flex-1">
        <main className="p-8 max-w-3xl">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-semibold text-[#111827] mb-1">Settings</h1>
            <p className="text-sm text-[#6B7280] mb-8">Manage API keys and system configuration</p>

            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] mb-6">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">API Keys</h2>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {[
                  { name: 'Pinecone', key: 'pcsk-****...****dZBAX' },
                  { name: 'Groq', key: 'gsk-****...****XQmJ' },
                  { name: 'HuggingFace', key: 'hf-****...****tnxxi' },
                ].map(api => (
                  <div key={api.name} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{api.name}</p>
                      <p className="text-xs text-[#9CA3AF] font-mono">{api.key}</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors">Edit</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="text-sm font-semibold text-[#111827] mb-4">System Info</h2>
              <div className="space-y-3">
                {[
                  ['Groq Model', settings.groq_model || 'llama-3.1-8b-instant'],
                  ['Embed Model', settings.embed_model || 'all-MiniLM-L6-v2'],
                  ['Pinecone Index', settings.pinecone_index || 'rag-knowledge-index'],
                  ['Supported Formats', '22 file types'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                    <span className="text-sm text-[#6B7280]">{k}</span>
                    <span className="text-sm font-medium text-[#111827]">{v}</span>
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