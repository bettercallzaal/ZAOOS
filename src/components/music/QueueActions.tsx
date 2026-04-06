'use client';

import { useState, useRef, useEffect } from 'react';
import type { TrackMetadata } from '@/types/music';
import { useQueue } from '@/contexts/QueueContext';

interface QueueActionsProps {
  metadata: TrackMetadata;
  compact?: boolean;
  className?: string;
}

export function QueueActions({ metadata, compact = false, className = '' }: QueueActionsProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { addNext, addToQueue } = useQueue();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNext(metadata);
    setToast('Playing next');
    setOpen(false);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(metadata);
    setToast('Added to queue');
    setOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button — queue icon (list with lines) */}
      <button
        onClick={handleToggle}
        className={`flex items-center justify-center transition-colors ${
          compact
            ? 'p-1.5 text-gray-400 hover:text-white rounded'
            : 'p-1.5 text-gray-400 hover:text-[#f5a623] rounded-lg hover:bg-white/5'
        }`}
        aria-label="Queue actions"
        title="Add to queue"
      >
        <svg className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      </button>

      {/* Popover dropdown */}
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-44 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handlePlayNext}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
          >
            <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
            </svg>
            <span className="text-xs text-white">Play Next</span>
          </button>
          <button
            onClick={handleAddToQueue}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-t border-white/[0.08]"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-xs text-white">Add to Queue</span>
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#f5a623] text-[#0a1628] text-xs font-medium rounded-lg shadow-lg shadow-[#f5a623]/20 whitespace-nowrap animate-fade-in pointer-events-none z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
