'use client';

import { useState, useRef } from 'react';

export function CsvUpload({ onUploaded }: { onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ imported?: number; errors?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file?: File) => {
    const uploadFile = file || fileRef.current?.files?.[0];
    if (!uploadFile) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ imported: data.imported, errors: data.errors });
        onUploaded();
        if (fileRef.current) fileRef.current.value = '';
      } else {
        setResult({ errors: [data.error] });
      }
    } catch {
      setResult({ errors: ['Upload failed'] });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleUpload(file);
    }
  };

  return (
    <div>
      <div className="bg-[#1a2a3a] rounded-xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-white mb-1">Bulk Import</h3>
        <p className="text-xs text-gray-500 mb-4">
          Upload a CSV file with format: <code className="text-gray-400">name, wallet_address</code> (one per line, no header)
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver
              ? 'border-[#f5a623] bg-[#f5a623]/5'
              : 'border-white/[0.08] hover:border-gray-600'
          }`}
        >
          <svg className="w-8 h-8 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-400 mb-2">Drag & drop your CSV here</p>
          <p className="text-xs text-gray-600 mb-3">or</p>
          <label className="inline-block cursor-pointer">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={() => handleUpload()}
              className="hidden"
            />
            <span className="bg-[#f5a623] text-[#0a1628] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#ffd700] transition-colors">
              {uploading ? 'Uploading...' : 'Choose File'}
            </span>
          </label>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-4 text-sm ${
          result.imported && !result.errors?.length
            ? 'bg-green-500/10 border border-green-500/20'
            : result.errors?.length
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-[#1a2a3a]'
        }`}>
          {result.imported !== undefined && result.imported > 0 && (
            <p className="text-green-400 font-medium">Successfully imported {result.imported} members</p>
          )}
          {result.errors?.map((e, i) => (
            <p key={i} className="text-red-400">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}
