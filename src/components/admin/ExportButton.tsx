'use client';

import { useState } from 'react';

const EXPORT_OPTIONS = [
  { label: 'Members', type: 'members' },
  { label: 'Fractal Scores', type: 'respect' },
  { label: 'Sessions', type: 'sessions' },
] as const;

export default function ExportButton() {
  const [open, setOpen] = useState(false);

  function handleExport(type: string, format: 'csv' | 'json') {
    window.open(`/api/admin/export?type=${type}&format=${format}`, '_blank');
    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-[#0d1b2a] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Export
      </button>

      {open && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-gray-700 bg-[#0d1b2a] py-1 shadow-xl">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              CSV
            </div>
            {EXPORT_OPTIONS.map((opt) => (
              <button
                key={`csv-${opt.type}`}
                onClick={() => handleExport(opt.type, 'csv')}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-white/5"
              >
                {opt.label}
              </button>
            ))}

            <div className="my-1 border-t border-gray-700" />

            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
              JSON
            </div>
            {EXPORT_OPTIONS.map((opt) => (
              <button
                key={`json-${opt.type}`}
                onClick={() => handleExport(opt.type, 'json')}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-white/5"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
