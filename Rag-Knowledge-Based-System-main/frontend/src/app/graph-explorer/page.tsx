'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getEntities } from '@/services/api';

const getColor = (cat: string) => {
  switch (cat) {
    case 'Organization': return '#2563EB';
    case 'Location': return '#059669';
    case 'Event': return '#D97706';
    case 'Person': return '#7C3AED';
    default: return '#6B7280';
  }
};

export default function GraphExplorer() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    getEntities().then(d => { if (d?.length) setEntities(d); }).catch(() => {});
  }, []);

  const nodes = entities.slice(0, 10).map((e, i) => {
    const angle = (i / Math.min(entities.length, 10)) * Math.PI * 2 - Math.PI / 2;
    return { ...e, x: 400 + 200 * Math.cos(angle), y: 260 + 200 * Math.sin(angle), r: e.category === 'Organization' ? 30 : e.category === 'Location' ? 24 : 18 };
  });
  const edges: { s: number; t: number }[] = [];
  for (let i = 1; i < nodes.length; i++) edges.push({ s: i, t: Math.floor(Math.random() * i) });

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="ml-[240px] flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h1 className="text-lg font-semibold text-[#111827]">Graph Explorer</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">{nodes.length} nodes · {edges.length} edges</p>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative bg-[#F9FAFB] overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 520">
              {edges.map((e, i) => (
                <line key={i} x1={nodes[e.s]?.x} y1={nodes[e.s]?.y} x2={nodes[e.t]?.x} y2={nodes[e.t]?.y}
                  stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
              ))}
              {nodes.map((n, i) => (
                <g key={i} onClick={() => setSelected(n)} className="cursor-pointer">
                  <circle cx={n.x} cy={n.y} r={n.r} fill={getColor(n.category)}
                    fillOpacity={selected?.name === n.name ? 0.35 : 0.2}
                    stroke={getColor(n.category)} strokeWidth={selected?.name === n.name ? 2.5 : 1.5} />
                  <text x={n.x} y={n.y + 1} textAnchor="middle" className="text-[9px] font-medium pointer-events-none"
                    fill={getColor(n.category)}>
                    {n.name?.length > 12 ? n.name.substring(0, 12) + '...' : n.name}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute top-4 left-4 bg-white/90 rounded-lg border border-[#E5E7EB] px-4 py-3 shadow-sm text-xs">
              <p className="font-medium text-[#111827] mb-2">Legend</p>
              {[{ l: 'Organization', c: '#2563EB' }, { l: 'Location', c: '#059669' }, { l: 'Event', c: '#D97706' }, { l: 'Person', c: '#7C3AED' }].map(x => (
                <div key={x.l} className="flex items-center gap-2 py-0.5 text-[#6B7280]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: x.c }} />{x.l}
                </div>
              ))}
            </div>
          </div>
          <aside className="w-72 border-l border-[#E5E7EB] bg-white p-5 overflow-y-auto">
            <h3 className="text-xs font-semibold text-[#111827] mb-4">Entity Details</h3>
            {selected ? (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: getColor(selected.category) + '15' }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: getColor(selected.category) }}>business</span>
                  </div>
                  <div><p className="text-sm font-medium text-[#111827]">{selected.name}</p><p className="text-xs text-[#6B7280]">{selected.category}</p></div>
                </div>
                <div className="space-y-2">
                  {[['Mentions', selected.count?.toLocaleString() || '—'], ['Category', selected.category], ['First Seen', '2023-01-15']].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-[#F3F4F6]">
                      <span className="text-xs text-[#6B7280]">{k}</span>
                      <span className="text-xs font-medium text-[#111827]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-3xl text-[#D1D5DB] mb-2">touch_app</span>
                <p className="text-xs text-[#9CA3AF]">Click a node to see details</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}