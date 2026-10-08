'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { queryRag } from '@/services/api';
import type { QueryResponse } from '@/types';

export default function AiWorkspace() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; sources?: { id: string; name: string; snippet: string; relevance: number }[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;
    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);
    try {
      const result: QueryResponse = await queryRag({ query: userQuery, top_k: 5, temperature: 0.7 });
      const sources = result.sources.map((s, i) => ({
        id: `[${i + 1}]`, name: s.filename,
        snippet: s.content.length > 150 ? s.content.substring(0, 150) + '...' : s.content,
        relevance: s.relevance,
      }));
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer, sources }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const suggestions = ['Summarize key financial trends', 'Find compliance regulations', 'List all Tesla mentions', 'Analyze Q4 revenue growth'];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="ml-[240px] flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-[#E5E7EB] flex items-center px-5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">AI</span>
            </div>
            <span className="text-sm font-semibold text-[#111827]">AI Workspace</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center max-w-lg w-full">
                <h2 className="text-2xl font-semibold text-[#111827] mb-2">What can I help with?</h2>
                <p className="text-sm text-[#6B7280] mb-8">Ask questions about your enterprise documents. I search your knowledge base and generate answers with citations.</p>
                <div className="grid grid-cols-2 gap-3">
                  {suggestions.map((sg, i) => (
                    <button key={i} onClick={() => { setQuery(sg); setTimeout(() => handleSubmit(), 0); }}
                      className="p-4 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-all text-left text-sm text-[#6B7280]">
                      {sg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">AI</span>
                    </div>
                  )}
                  <div className={`${msg.role === 'user' ? 'max-w-[75%]' : 'flex-1 max-w-[85%]'}`}>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-[#F3F4F6] text-[#111827]' : 'text-[#111827] prose-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2">
                        <button onClick={() => setExpandedMsg(expandedMsg === i ? null : i)}
                          className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#2563EB] transition-colors">
                          <span className="material-symbols-outlined text-[16px]">{expandedMsg === i ? 'expand_less' : 'description'}</span>
                          {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                        </button>
                        {expandedMsg === i && (
                          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                            {msg.sources.map(s => (
                              <div key={s.id} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2.5 text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-[#111827]">{s.name}</span>
                                  <span className="text-[#2563EB] font-mono">{(s.relevance * 100).toFixed(0)}%</span>
                                </div>
                                <p className="text-[#6B7280] line-clamp-2">{s.snippet}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">U</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#111827] flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">AI</span>
                  </div>
                  <div className="flex gap-1.5 items-center py-3">
                    <span className="w-2 h-2 bg-[#D1D5DB] rounded-full" style={{ animation: 'typing 1.4s ease-in-out infinite' }} />
                    <span className="w-2 h-2 bg-[#D1D5DB] rounded-full" style={{ animation: 'typing 1.4s ease-in-out 0.2s infinite' }} />
                    <span className="w-2 h-2 bg-[#D1D5DB] rounded-full" style={{ animation: 'typing 1.4s ease-in-out 0.4s infinite' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-[#E5E7EB] bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]/20 transition-all">
              <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask anything about your documents..." rows={1}
                className="flex-1 bg-transparent text-sm text-[#111827] placeholder-[#9CA3AF] resize-none outline-none py-2" />
              <button onClick={handleSubmit} disabled={!query.trim() || isLoading}
                className="shrink-0 w-8 h-8 rounded-lg bg-[#111827] hover:bg-[#1F2937] disabled:bg-[#E5E7EB] disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-white text-[18px]">arrow_upward</span>
              </button>
            </div>
            <p className="text-[11px] text-[#9CA3AF] text-center mt-2">RAG Intelligence may produce inaccurate answers. Verify important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
