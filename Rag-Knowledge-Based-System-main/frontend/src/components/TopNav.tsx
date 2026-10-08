"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 h-16 bg-white/70 backdrop-blur-xl border-b border-[#E2E8F0] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <span className="material-symbols-outlined text-[18px] text-[#06B6D4]">psychology</span>
          <span className="font-medium text-[#0F172A]">Knowledge Intelligence</span>
        </div>
        <div className="h-4 w-px bg-[#E2E8F0]" />
        <nav className="hidden md:flex items-center gap-1">
          {["Sources", "Models", "Indices"].map((item) => (
            <Link key={item} href="#" className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-all">
              {item}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all">
          <span className="material-symbols-outlined text-[20px]">history</span>
        </button>
        <div className="h-6 w-px bg-[#E2E8F0] mx-1" />
        <button className="bg-[#0F172A] text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-[#1E293B] transition-all shadow-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">add_link</span>
          Connect Data
        </button>
      </div>
    </header>
  );
}
