'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface SearchUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface MentionAutocompleteProps {
  query: string; // text after @ symbol
  onSelect: (username: string) => void;
  onClose: () => void;
  position: { bottom: number; left: number };
}

export function MentionAutocomplete({ query, onSelect, onClose, position }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    if (q.length < 1) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setSelectedIndex(0);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchUsers]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + users.length) % users.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onSelect(users[selectedIndex].username);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [users, selectedIndex, onSelect, onClose]);

  if (users.length === 0 && !loading) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-[#1a2a3a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-[240px] w-[280px]"
      style={{ bottom: position.bottom, left: position.left }}
    >
      {loading && users.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
      ) : (
        <div className="py-1">
          {users.map((user, i) => (
            <button
              key={user.fid}
              onClick={() => onSelect(user.username)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                i === selectedIndex ? 'bg-[#f5a623]/10' : 'hover:bg-white/5'
              }`}
            >
              {user.pfp_url ? (
                <div className="w-7 h-7 relative flex-shrink-0">
                  <Image
                    src={user.pfp_url}
                    alt={user.username}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-gray-400 truncate">@{user.username}</p>
              </div>
              {i === selectedIndex && (
                <span className="text-xs text-gray-500 flex-shrink-0">↵</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
