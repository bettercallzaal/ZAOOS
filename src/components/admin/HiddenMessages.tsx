'use client';

import { useState, useEffect } from 'react';
import { HiddenMessage } from '@/types';

export function HiddenMessages() {
  const [messages, setMessages] = useState<HiddenMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await globalThis.fetch('/api/admin/hidden');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="bg-[#1a2a3a] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{messages.length}</p>
            <p className="text-xs text-gray-400 mt-1">Hidden Messages</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </div>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-[#1a2a3a] rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No hidden messages — all clear</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-[#1a2a3a] rounded-xl p-4 hover:bg-[#1e3048] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 font-mono text-xs">
                    {msg.cast_hash.slice(0, 10)}...{msg.cast_hash.slice(-6)}
                  </p>
                  {msg.reason && (
                    <p className="text-gray-300 text-sm mt-1">{msg.reason}</p>
                  )}
                </div>
                <p className="text-gray-600 text-xs whitespace-nowrap">
                  {new Date(msg.hidden_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
