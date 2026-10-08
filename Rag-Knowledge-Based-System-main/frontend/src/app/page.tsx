import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="ml-[240px] flex-1">
        <section className="px-8 py-24 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-[#111827] mb-4 tracking-tight">Enterprise RAG Knowledge Intelligence</h1>
          <p className="text-base text-[#6B7280] mb-10 max-w-xl mx-auto leading-relaxed">
            Unlock insights from your documents with AI-powered ingestion, semantic search, data mining, and RAG-based Q&A.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/ai-workspace" className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-medium hover:bg-[#1F2937] transition-colors">
              Start Querying
            </Link>
            <Link href="/knowledge-hub" className="px-6 py-2.5 rounded-lg border border-[#E5E7EB] text-[#111827] text-sm font-medium hover:bg-[#F9FAFB] transition-colors">
              Upload Documents
            </Link>
          </div>
        </section>

        <footer className="px-8 py-6 border-t border-[#E5E7EB] text-center text-xs text-[#9CA3AF]">
          RAG Knowledge Intelligence System
        </footer>
      </div>
    </div>
  );
}
