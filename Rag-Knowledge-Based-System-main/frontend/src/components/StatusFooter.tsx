export default function StatusFooter() {
  return (
    <footer className="mt-auto px-6 py-4 bg-white border-t border-[#E2E8F0] flex justify-between items-center text-[#45464d]">
      <div className="flex gap-6 text-[10px] font-bold tracking-[0.05em] uppercase">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          NODE_01: ONLINE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          NODE_02: ONLINE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          VECTOR_REINDEX: 12%
        </span>
      </div>
      <div className="flex gap-3 items-center">
        <button className="material-symbols-outlined text-[18px] text-[#45464d]">terminal</button>
        <button className="material-symbols-outlined text-[18px] text-[#45464d]">bug_report</button>
        <span className="text-[10px] font-bold tracking-[0.05em] uppercase">v1.2.0-STABLE</span>
      </div>
    </footer>
  );
}
