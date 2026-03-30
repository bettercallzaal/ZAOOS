'use client';

import { useState, useEffect } from 'react';
import { useEscapeClose } from '@/hooks/useEscapeClose';

interface ScheduledCast {
  id: string;
  text: string;
  channel_id: string;
  scheduled_for: string;
  status: string;
  error_message?: string;
}

interface SchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  channel: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- channel reserved for future per-channel filtering
export function SchedulePanel({ isOpen, onClose, channel }: SchedulePanelProps) {
  const [scheduled, setScheduled] = useState<ScheduledCast[]>([]);
  const [loading, setLoading] = useState(false);
  useEscapeClose(onClose, isOpen);

   
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/chat/schedule')
      .then((r) => r.json())
      .then((d) => setScheduled(d.scheduled || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Also trigger processing of due casts
    fetch('/api/chat/schedule', { method: 'PATCH' }).catch(() => {});
  }, [isOpen]);
   

  const cancelCast = async (id: string) => {
    const res = await fetch(`/api/chat/schedule?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setScheduled((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-[380px] z-50 flex flex-col bg-[#0d1b2a] border-l border-gray-800 animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a1628]">
          <h3 className="text-sm font-semibold text-gray-300">Scheduled Posts</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1" aria-label="Close scheduled posts">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && scheduled.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-1">No scheduled posts</p>
              <p className="text-gray-600 text-xs">Use the clock icon in the compose bar to schedule a post</p>
            </div>
          )}

          {scheduled.map((cast) => (
            <div key={cast.id} className="px-4 py-3 border-b border-gray-800/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-[#f5a623]">
                  #{cast.channel_id} &middot; {formatTime(cast.scheduled_for)}
                </span>
                {cast.status === 'failed' && (
                  <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                    Failed
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-300 line-clamp-3 mb-2">{cast.text}</p>
              {cast.error_message && (
                <p className="text-xs text-red-400 mb-2">{cast.error_message}</p>
              )}
              <button
                onClick={() => cancelCast(cast.id)}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
