import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Intel | Enterprise Knowledge Intelligence System",
  description:
    "A centralized Knowledge Intelligence platform for organizations to ingest diverse data sources and interact with them using RAG and data mining.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-white text-[#111827] font-sans">{children}</body>
    </html>
  );
}
