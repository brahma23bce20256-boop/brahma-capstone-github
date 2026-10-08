"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Knowledge Hub", href: "/knowledge-hub", icon: "upload_file" },
  { label: "AI Workspace", href: "/ai-workspace", icon: "chat" },
  { label: "Insight Miner", href: "/insight-miner", icon: "analytics" },
  { label: "Data Mining", href: "/data-mining", icon: "psychology" },
  { label: "Graph Explorer", href: "/graph-explorer", icon: "hub" },
  { label: "Evaluation", href: "/evaluation", icon: "monitoring" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[#F9FAFB] flex flex-col z-50 border-r border-[#E5E7EB]">
      <Link href="/" className="px-5 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center">
          <span className="text-white text-sm font-bold">R</span>
        </div>
        <div>
          <span className="text-base font-semibold text-[#111827]">RAG Intel</span>
          <span className="text-[10px] text-[#9CA3AF] block leading-tight">Knowledge System</span>
        </div>
      </Link>
      <nav className="flex-1 flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-[#111827] shadow-sm border border-[#E5E7EB]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-white/60"
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${active ? "text-[#2563EB]" : ""}`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-1">
          <div className="w-6 h-6 rounded-md bg-[#111827] flex items-center justify-center text-[10px] font-bold text-white">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#111827] truncate">Admin</p>
            <p className="text-[10px] text-[#9CA3AF]">Enterprise</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
