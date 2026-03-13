'use client';

import { useState, useRef } from 'react';

export function CsvUpload({ onUploaded }: { onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported?: number; errors?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

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

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[#f5a623] mb-2">CSV Import</h3>
      <p className="text-xs text-gray-500 mb-2">Format: name, wallet_address (one per line, no header)</p>
      <div className="flex gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="text-sm text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#1a2a3a] file:text-gray-300 hover:file:bg-[#243040]"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-[#f5a623] text-[#0a1628] text-sm font-medium px-4 py-1.5 rounded hover:bg-[#ffd700] disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {result && (
        <div className="mt-2 text-sm">
          {result.imported && <p className="text-green-400">Imported {result.imported} entries</p>}
          {result.errors?.map((e, i) => (
            <p key={i} className="text-red-400">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}
