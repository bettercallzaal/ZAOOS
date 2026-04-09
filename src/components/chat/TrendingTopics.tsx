'use client';

import { useState, useEffect } from 'react';

interface Topic {
  topic: string;
  cast_count: number;
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/trending-topics?limit=8')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setTopics(data.topics || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">Trending Topics</p>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <span
            key={t.topic}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors cursor-pointer"
          >
            {t.topic}
            <span className="text-[10px] text-gray-500">{t.cast_count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
