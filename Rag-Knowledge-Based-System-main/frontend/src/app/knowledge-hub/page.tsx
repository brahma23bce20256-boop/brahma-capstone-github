'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { listDocuments, deleteDocument } from '@/services/api';
import type { DocumentListItem } from '@/types';

const supportedTypes = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'EML', 'LOG', 'TXT', 'MD', 'CSV', 'JSON', 'HTML', 'XML'];

export default function KnowledgeHub() {
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listDocuments().then(setDocs).catch(() => {}); }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadError('');
    setNotification(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

    try {
      // Use XMLHttpRequest for real progress tracking
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append('file', file);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 60);
            setUploadProgress(pct);
          }
        });

        xhr.addEventListener('readystatechange', () => {
          if (xhr.readyState === 2) setUploadProgress(65); // Headers received
          if (xhr.readyState === 3) setUploadProgress(75);  // Loading response
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.statusText || `Upload failed (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', `${API_BASE}/documents/upload`);
        xhr.send(form);
      });

      setUploadProgress(85);
      setUploadStatus('processing');

      // Short delay to show "Indexing chunks..."
      await new Promise(r => setTimeout(r, 600));
      setUploadProgress(100);
      setUploadStatus('done');
      setNotification({ type: 'success', message: `"${file.name}" uploaded successfully!` });

      const updated = await listDocuments();
      setDocs(updated);
    } catch (e: any) {
      setUploadStatus('error');
      setUploadError(e.message || 'Upload failed');
      setNotification({ type: 'error', message: e.message || 'Upload failed' });
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    try { await deleteDocument(id); setDocs(prev => prev.filter(d => d.id !== id)); setNotification({ type: 'success', message: 'Document deleted' }); } catch (e) { console.error(e); }
  };

  const extColors: Record<string, string> = {
    pdf: 'bg-[#EF4444]/10 text-[#EF4444]', docx: 'bg-[#3B82F6]/10 text-[#3B82F6]',
    pptx: 'bg-[#F59E0B]/10 text-[#F59E0B]', xlsx: 'bg-[#10B981]/10 text-[#10B981]',
    eml: 'bg-[#8B5CF6]/10 text-[#8B5CF6]', log: 'bg-[#64748B]/10 text-[#64748B]',
    txt: 'bg-[#06B6D4]/10 text-[#06B6D4]',
  };

  const progressLabel = () => {
    if (uploadStatus === 'uploading') return `Uploading... ${uploadProgress}%`;
    if (uploadStatus === 'processing') return 'Indexing chunks...';
    if (uploadStatus === 'done') return 'Complete!';
    if (uploadStatus === 'error') return 'Upload failed';
    return 'Drop your files here';
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="ml-[260px] flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="animate-fade-in max-w-5xl">
            <h1 className="text-3xl font-bold text-[#0F172A] mb-1">Knowledge Hub</h1>
            <p className="text-sm text-[#64748B] mb-8">Upload, manage, and index your enterprise documents</p>

            {/* Notification Toast */}
            {notification && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all ${notification.type === 'success' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                <span className="material-symbols-outlined text-[18px]">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
                {notification.message}
              </div>
            )}

            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <span className="material-symbols-outlined text-white text-[28px]">cloud_upload</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">Upload Documents</h2>
                    <p className="text-sm text-[#64748B]">Drag & drop or click to browse</p>
                  </div>
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${dragOver ? 'border-[#06B6D4] bg-[#06B6D4]/5' : 'border-[#E2E8F0] hover:border-[#06B6D4] hover:bg-[#F8FAFC]'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                  {!uploading ? (
                    <>
                      <span className="material-symbols-outlined text-4xl text-[#06B6D4] mb-3">cloud_upload</span>
                      <p className="text-sm text-[#0F172A] font-medium mb-1">Drop your files here</p>
                      <p className="text-xs text-[#64748B]">Supports PDF, DOCX, PPTX, XLSX, EML, LOG, TXT</p>
                    </>
                  ) : (
                    <div className="max-w-sm mx-auto">
                      {uploadStatus === 'error' ? (
                        <>
                          <span className="material-symbols-outlined text-4xl text-[#EF4444] mb-3">error</span>
                          <p className="text-sm text-[#EF4444] font-medium mb-2">{uploadError}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-2xl text-[#06B6D4] animate-spin">progress_activity</span>
                            <p className="text-sm text-[#0F172A] font-medium">{progressLabel()}</p>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ease-out ${uploadProgress >= 100 ? 'bg-[#10B981]' : 'bg-gradient-to-r from-[#06B6D4] to-[#3B82F6]'}`}
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-[#64748B] mt-2">{uploadProgress}%</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {supportedTypes.map(t => (
                    <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${extColors[t.toLowerCase()] || 'bg-[#F1F5F9] text-[#64748B]'}`}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#0F172A]">Documents ({docs.length})</h2>
                <button className="text-xs font-medium text-[#06B6D4] hover:text-[#0891B2]" onClick={() => listDocuments().then(setDocs)}>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">refresh</span> Refresh</span>
                </button>
              </div>

              {docs.length === 0 ? (
                <div className="p-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-[#94A3B8] mb-4">inventory_2</span>
                  <p className="text-sm text-[#64748B]">No documents ingested yet</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Upload documents above to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-[#F8FAFC]">
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Chunks</th>
                      <th className="px-6 py-3 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {docs.map(d => (
                        <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-3.5 text-sm font-medium text-[#0F172A]">{d.filename}</td>
                          <td className="px-6 py-3.5"><span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${extColors[d.file_type?.replace('.','')] || 'bg-[#F1F5F9] text-[#64748B]'}`}>{d.file_type?.toUpperCase()}</span></td>
                          <td className="px-6 py-3.5 text-sm text-[#64748B]">{d.category || '—'}</td>
                          <td className="px-6 py-3.5 text-sm text-[#64748B]">{d.chunks || 0}</td>
                          <td className="px-6 py-3.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${d.status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>{d.status}</span></td>
                          <td className="px-6 py-3.5 text-right">
                            <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
