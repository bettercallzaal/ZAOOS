'use client';

import { useState, useEffect } from 'react';
import { HiddenMessage } from '@/types';

export function HiddenMessages() {
  const [messages, setMessages] = useState<HiddenMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const res = await globalThis.fetch('/api/admin/hidden');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[#f5a623] mb-2">Hidden Messages ({messages.length})</h3>
      {messages.length === 0 ? (
        <p className="text-gray-500 text-sm">No hidden messages</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-[#1a2a3a] rounded p-3 text-sm">
              <p className="text-gray-400 font-mono text-xs">{msg.cast_hash.slice(0, 10)}...</p>
              {msg.reason && <p className="text-gray-300 mt-1">{msg.reason}</p>}
              <p className="text-gray-500 text-xs mt-1">
                Hidden {new Date(msg.hidden_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
