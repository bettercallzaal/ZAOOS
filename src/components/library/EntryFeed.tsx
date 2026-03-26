'use client';

import { useState, useEffect, useCallback } from 'react';
import EntryCard from './EntryCard';
import { LIBRARY_TAGS } from '@/lib/validation/library-schemas';

interface Entry {
  id: string;
  fid: number;
  url: string | null;
  topic: string;
  note: string | null;
  tags: string[];
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  ai_summary: string | null;
  ai_status: 'pending' | 'complete' | 'failed';
  upvote_count: number;
  comment_count: number;
  created_at: string;
}

interface EntryFeedProps {
  refreshKey: number;
  isAdmin?: boolean;
}

export default function EntryFeed({ refreshKey, isAdmin }: EntryFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort] = useState<'newest' | 'upvoted'>('newest');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEntries = useCallback(async (reset = false) => {
    const offset = reset ? 0 : entries.length;
    const params = new URLSearchParams({
      offset: String(offset),
      limit: '50',
      sort,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(activeTag && { tag: activeTag }),
    });

    try {
      const res = await fetch(`/api/library/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setEntries(data.entries ?? []);
        } else {
          setEntries((prev) => [...prev, ...(data.entries ?? [])]);
        }
        if (reset) {
          setUserVotes(data.userVotes ?? []);
        } else {
          setUserVotes((prev) => [...new Set([...prev, ...(data.userVotes ?? [])])]);
        }
        setHasMore((data.entries ?? []).length === 50);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTag, sort, entries.length]);

  useEffect(() => {
    setLoading(true);
    fetchEntries(true);
  }, [debouncedSearch, activeTag, sort, refreshKey]);

  const handleVote = async (entryId: string) => {
    try {
      const res = await fetch('/api/library/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserVotes((prev) =>
          data.voted ? [...prev, entryId] : prev.filter((id) => id !== entryId),
        );
      }
    } catch {
      // silent fail
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch('/api/library/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch {
      // silent fail
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search submissions..."
          className="flex-1 rounded-lg bg-[#1a2a3a] px-4 py-2 text-sm text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSort(sort === 'newest' ? 'upvoted' : 'newest')}
            className="rounded-lg bg-[#1a2a3a] px-3 py-2 text-sm text-gray-300 hover:bg-[#243447]"
          >
            {sort === 'newest' ? 'Newest' : 'Top'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTag('')}
          className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
            !activeTag ? 'bg-[#f5a623] text-[#0a1628]' : 'bg-[#1a2a3a] text-gray-400 hover:bg-[#243447]'
          }`}
        >
          All
        </button>
        {LIBRARY_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              activeTag === tag ? 'bg-[#f5a623] text-[#0a1628]' : 'bg-[#1a2a3a] text-gray-400 hover:bg-[#243447]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No submissions yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              voted={userVotes.includes(entry.id)}
              onVote={handleVote}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchEntries(false)}
              className="w-full rounded-lg bg-[#1a2a3a] py-3 text-sm text-gray-300 hover:bg-[#243447]"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
