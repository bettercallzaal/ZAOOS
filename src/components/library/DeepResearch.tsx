'use client';

import { useState, useEffect } from 'react';

interface ResearchDoc {
  id: number;
  title: string;
  category: string;
  path: string;
  github_url: string;
}

const CATEGORIES = [
  'Farcaster Protocol & Ecosystem',
  'Music, Curation & Artist Revenue',
  'Community, Social & Growth',
  'Identity, Governance & Tokens',
  'AI Agent & Intelligence',
  'Cross-Platform Publishing',
  'Technical Infrastructure',
  'APIs & External Services',
  'Security & Code Quality',
  'Development Workflows',
];

export default function DeepResearch() {
  const [docs, setDocs] = useState<ResearchDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/library/docs');
      if (res.ok) {
        const data = await res.json();
        setDocs(data.docs);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : docs;

  const grouped = CATEGORIES.reduce<Record<string, ResearchDoc[]>>((acc, cat) => {
    const matching = filtered.filter((d) => d.category === cat);
    if (matching.length > 0) acc[cat] = matching;
    return acc;
  }, {});

  const uncategorized = filtered.filter(
    (d) => !CATEGORIES.includes(d.category),
  );
  if (uncategorized.length > 0) grouped['Other'] = uncategorized;

  if (loading) {
    return <p className="text-gray-500">Loading research library...</p>;
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search research docs..."
        className="w-full rounded-lg bg-[#1a2a3a] px-4 py-2 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
      />

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500 text-center py-4">No docs found</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([category, categoryDocs]) => (
            <div key={category} className="rounded-lg ring-1 ring-gray-800 overflow-hidden">
              <button
                onClick={() => setOpenCategory(openCategory === category ? null : category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0d1b2a] text-left hover:bg-[#1a2a3a] transition-colors"
              >
                <span className="text-sm font-medium text-white">{category}</span>
                <span className="text-xs text-gray-400">
                  {categoryDocs.length} doc{categoryDocs.length !== 1 ? 's' : ''}
                  {' '}{openCategory === category ? '▼' : '▶'}
                </span>
              </button>
              {openCategory === category && (
                <div className="bg-[#0a1628] divide-y divide-gray-800">
                  {categoryDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[#1a2a3a] transition-colors"
                    >
                      <span className="text-xs text-gray-500 w-8 text-right">#{doc.id}</span>
                      <span className="text-sm text-gray-300">{doc.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
