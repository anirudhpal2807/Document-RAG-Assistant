'use client';

import { useState } from 'react';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadSuccess = (fileName: string) => {
    setUploadedDocuments((prev) => [...prev, fileName]);
  };

  return (
    <main className="min-h-screen bg-animated flex flex-col font-sans">
      <div className="container mx-auto px-4 py-12 max-w-7xl flex-1 flex flex-col">
        <header className="text-center mb-12 animate-message">
          <div className="inline-block px-4 py-1.5 rounded-full glass-panel mb-4 text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            Next-Gen RAG System
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Document <span className="text-gradient">AI Assistant</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Seamlessly chat with your documents using state-of-the-art vector search and Gemini AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
          {/* Upload Section */}
          <div className="lg:col-span-4 flex flex-col gap-6 animate-message" style={{ animationDelay: '0.1s' }}>
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Document
              </h2>
              <div className="relative z-10">
                <DocumentUpload
                  onUploadSuccess={handleUploadSuccess}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </div>
            </div>

            {uploadedDocuments.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 animate-message" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Indexed Documents
                </h3>
                <ul className="space-y-2">
                  {uploadedDocuments.map((doc, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-slate-200 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3 transition-colors hover:bg-white/10"
                    >
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-8 h-[650px] animate-message" style={{ animationDelay: '0.3s' }}>
            <div className="glass-panel rounded-3xl p-1 h-full shadow-2xl flex flex-col relative overflow-hidden">
              {/* Subtle top glow */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
              
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Interactive Query
                </h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium tracking-wide">System Online</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <ChatInterface uploadedDocuments={uploadedDocuments} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

