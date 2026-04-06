'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ContactRow } from './ContactRow';
import { ContactFilters, SortOption } from './ContactFilters';

interface Contact {
  id: string;
  name: string;
  handle: string | null;
  category: string | null;
  met_at: string | null;
  organization: string | null;
  location: string | null;
  location_2: string | null;
  notes: string | null;
  can_support: string | null;
  background: string | null;
  extra: string | null;
  score: number;
  checked: boolean;
  first_met: string | null;
  last_interaction: string | null;
  source: string | null;
  fid: number | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  contacts: Contact[];
  total: number;
}

const PAGE_SIZE = 50;

const EMPTY_ADD_FORM = {
  name: '',
  notes: '',
  met_at: '',
  score: '',
};

export function RolodexDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const hasMore = contacts.length < total;

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortOption>('score');

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Track last fetch params so refresh works correctly
  const lastParamsRef = useRef({ search, category, sort });

  const buildUrl = useCallback(
    (s: string, cat: string, srt: SortOption, off: number) => {
      const p = new URLSearchParams();
      if (s) p.set('q', s);
      if (cat) p.set('category', cat);
      p.set('sort', srt);
      p.set('limit', String(PAGE_SIZE));
      p.set('offset', String(off));
      return `/api/admin/contacts?${p.toString()}`;
    },
    [],
  );

  const fetchContacts = useCallback(
    async (s: string, cat: string, srt: SortOption, replace: boolean) => {
      const off = replace ? 0 : offset;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await fetch(buildUrl(s, cat, srt, off));
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? 'Failed to fetch');
        }
        const j: ApiResponse = await res.json();
        if (replace) {
          setContacts(j.contacts);
          setOffset(j.contacts.length);
        } else {
          setContacts(prev => [...prev, ...j.contacts]);
          setOffset(prev => prev + j.contacts.length);
        }
        setTotal(j.total);
        lastParamsRef.current = { search: s, category: cat, sort: srt };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl, offset],
  );

  // Initial load + filter changes reset list
  useEffect(() => {
    setOffset(0);
    fetchContacts(search, category, sort, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort]);

  const handleRefresh = useCallback(() => {
    const { search: s, category: cat, sort: srt } = lastParamsRef.current;
    setOffset(0);
    fetchContacts(s, cat, srt, true);
  }, [fetchContacts]);

  const handleLoadMore = useCallback(() => {
    fetchContacts(search, category, sort, false);
  }, [fetchContacts, search, category, sort]);

  const handleContactUpdate = useCallback((updated: Contact) => {
    setContacts(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  }, []);

  // Derive unique categories from loaded contacts
  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const c of contacts) {
      if (c.category) seen.add(c.category);
    }
    return Array.from(seen).sort();
  }, [contacts]);

  // Add contact
  const handleAddSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!addForm.name.trim()) {
        setAddError('Name is required');
        return;
      }
      setAdding(true);
      setAddError(null);
      try {
        const payload: Record<string, unknown> = {
          name: addForm.name.trim(),
        };
        if (addForm.notes.trim()) payload.notes = addForm.notes.trim();
        if (addForm.met_at.trim()) payload.met_at = addForm.met_at.trim();
        const scoreNum = parseFloat(addForm.score);
        if (!isNaN(scoreNum)) payload.score = scoreNum;

        const res = await fetch('/api/admin/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? 'Failed to add contact');
        }
        const j = await res.json() as { contact: Contact };
        setContacts(prev => [j.contact, ...prev]);
        setTotal(prev => prev + 1);
        setShowAdd(false);
        setAddForm(EMPTY_ADD_FORM);
      } catch (err) {
        setAddError(err instanceof Error ? err.message : 'Failed to add contact');
      } finally {
        setAdding(false);
      }
    },
    [addForm],
  );

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Rolodex</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {total > 0 ? `${total} contact${total !== 1 ? 's' : ''}` : 'No contacts yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 disabled:opacity-40 transition-colors"
            aria-label="Refresh contacts"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setShowAdd(true); setAddError(null); setAddForm(EMPTY_ADD_FORM); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        categories={categories}
      />

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Contact list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-[#1a2a4a] animate-pulse"
              style={{ opacity: 1 - i * 0.12 }}
            />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">
          {search || category ? 'No contacts match your filters.' : 'No contacts yet. Add one to get started.'}
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <ContactRow
              key={contact.id}
              contact={contact}
              onUpdate={handleContactUpdate}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-5 py-2 rounded-lg bg-[#1a2a4a] border border-white/10 text-sm text-white/60 hover:text-white/80 hover:border-white/20 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? 'Loading…' : `Load more (${total - contacts.length} remaining)`}
          </button>
        </div>
      )}

      {/* Add Contact modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
        >
          <div className="w-full max-w-md bg-[#1a2a4a] border border-white/10 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Add Contact</h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="px-5 py-4 space-y-3">
              {addError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs text-white/40 mb-1">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  required
                  autoFocus
                  className="w-full bg-[#0a1628] border border-white/15 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1">Met At</label>
                <input
                  type="text"
                  value={addForm.met_at}
                  onChange={e => setAddForm(f => ({ ...f, met_at: e.target.value }))}
                  placeholder="Event, conference, city…"
                  className="w-full bg-[#0a1628] border border-white/15 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1">Score</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={addForm.score}
                  onChange={e => setAddForm(f => ({ ...f, score: e.target.value }))}
                  placeholder="0–10"
                  className="w-full bg-[#0a1628] border border-white/15 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1">Notes</label>
                <textarea
                  value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Quick notes about this contact…"
                  className="w-full bg-[#0a1628] border border-white/15 rounded px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 resize-y"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-semibold hover:bg-[#f5a623]/90 disabled:opacity-50 transition-colors"
                >
                  {adding ? 'Adding…' : 'Add Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  disabled={adding}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
