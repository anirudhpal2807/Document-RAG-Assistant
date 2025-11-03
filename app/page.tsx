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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Document RAG Assistant
          </h1>
          <p className="text-gray-600">
            Upload documents and ask questions powered by AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Upload Document
              </h2>
              <DocumentUpload
                onUploadSuccess={handleUploadSuccess}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
              
              {uploadedDocuments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Uploaded Documents:
                  </h3>
                  <ul className="space-y-1">
                    {uploadedDocuments.map((doc, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        ✓ {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 h-[calc(100vh-200px)] flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Ask Questions
              </h2>
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

