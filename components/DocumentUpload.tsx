'use client';

import { useState, useRef } from 'react';

interface DocumentUploadProps {
  onUploadSuccess: (fileName: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export default function DocumentUpload({
  onUploadSuccess,
  isProcessing,
  setIsProcessing,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      alert(
        `✅ Document uploaded successfully!\nPages: ${data.pages}\nChunks: ${data.chunks}`
      );
      onUploadSuccess(data.fileName);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="relative group/upload">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover/upload:opacity-50 transition duration-1000 group-hover/upload:duration-200"></div>
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-900/20'
            : 'border-slate-600 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-500'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="space-y-4 py-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <p className="text-cyan-300 font-medium tracking-wide animate-pulse">Processing PDF...</p>
              <p className="text-xs text-slate-400">Extracting and indexing text</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300 shadow-lg shadow-black/20">
              <svg
                className="h-8 w-8 text-cyan-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-slate-200 font-medium">
                Drag & drop your PDF here
              </p>
              <p className="text-sm text-slate-400">or click to browse files</p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-800 text-xs text-slate-300 rounded-full border border-slate-700">
                PDF format only
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

