'use client';

import { useState } from 'react';

export function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#0d1b2a] rounded-xl p-6 w-full max-w-md border border-white/[0.08]">
        <h3 className="text-sm font-semibold text-white mb-3">Cast to /zao channel</h3>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write your announcement..."
          className="w-full bg-[#0a1628] border border-white/[0.15] rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:border-[#f5a623] focus:outline-none resize-none h-32"
          maxLength={1024}
        />
        <p className="text-[10px] text-gray-600 mt-1">{text.length}/1024</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSending(true);
              try {
                await fetch('/api/admin/broadcast', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text }),
                });
              } catch { /* ignore */ }
              setSending(false);
              onClose();
            }}
            disabled={sending || !text.trim()}
            className="flex-1 py-2 text-sm text-[#0a1628] bg-[#f5a623] rounded-lg font-medium disabled:opacity-50 hover:bg-[#ffd700] transition-colors"
          >
            {sending ? 'Casting...' : 'Cast'}
          </button>
        </div>
      </div>
    </div>
  );
}
