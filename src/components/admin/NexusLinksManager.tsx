'use client';

import { useState, useEffect, useCallback } from 'react';

interface NexusLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  category: string;
  subcategory: string;
  portal_group: string | null;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  is_gated: boolean;
  tags: string[];
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

const PORTAL_GROUPS = ['MUSIC', 'SOCIAL', 'BUILD', 'EARN', 'GOVERN', 'VIP'] as const;

const EMPTY_LINK = {
  title: '',
  url: '',
  description: '',
  icon: '',
  category: '',
  subcategory: '',
  portal_group: '' as string,
  sort_order: 0,
  is_featured: false,
  is_active: true,
  is_gated: false,
  tags: [] as string[],
};

export function NexusLinksManager() {
  const [links, setLinks] = useState<NexusLink[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<NexusLink>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState(EMPTY_LINK);
  const [saving, setSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/nexus');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLinks(data.links);
      setCategories(data.categories || []);
    } catch {
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const filteredLinks = links.filter(link => {
    if (filterCategory && link.category !== filterCategory) return false;
    if (filterSubcategory && link.subcategory !== filterSubcategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return link.title.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q) ||
        (link.description || '').toLowerCase().includes(q) ||
        link.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const subcategories = [...new Set(
    links
      .filter(l => !filterCategory || l.category === filterCategory)
      .map(l => l.subcategory)
  )].sort();

  const handleAdd = async () => {
    if (!newLink.title || !newLink.url || !newLink.category || !newLink.subcategory) {
      setError('Title, URL, category, and subcategory are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/nexus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLink,
          portal_group: newLink.portal_group || undefined,
          tags: newLink.tags.length > 0 ? newLink.tags : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add');
      }
      setNewLink(EMPTY_LINK);
      setShowAddForm(false);
      await fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add link');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/nexus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditingId(null);
      setEditForm({});
      await fetchLinks();
    } catch {
      setError('Failed to update link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/nexus', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchLinks();
    } catch {
      setError('Failed to delete link');
    }
  };

  const handleToggle = async (id: string, field: 'is_active' | 'is_featured' | 'is_gated', value: boolean) => {
    try {
      const res = await fetch('/api/admin/nexus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: !value }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      await fetchLinks();
    } catch {
      setError('Failed to toggle');
    }
  };

  const startEdit = (link: NexusLink) => {
    setEditingId(link.id);
    setEditForm({
      title: link.title,
      url: link.url,
      description: link.description || '',
      category: link.category,
      subcategory: link.subcategory,
      portal_group: link.portal_group,
      sort_order: link.sort_order,
      tags: link.tags,
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading nexus links...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {links.length} total links | {links.filter(l => l.is_active).length} active | {links.filter(l => l.is_featured).length} featured
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 text-sm font-medium bg-[#f5a623] text-[#0a1628] rounded-lg hover:bg-[#ffd700] transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Link'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 hover:text-white">x</button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#1a2a3a] rounded-lg p-4 border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-[#f5a623]">Add New Link</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Title *"
              value={newLink.title}
              onChange={e => setNewLink({ ...newLink, title: e.target.value })}
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="URL *"
              value={newLink.url}
              onChange={e => setNewLink({ ...newLink, url: e.target.value })}
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Category *"
              value={newLink.category}
              onChange={e => setNewLink({ ...newLink, category: e.target.value })}
              list="categories-list"
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Subcategory *"
              value={newLink.subcategory}
              onChange={e => setNewLink({ ...newLink, subcategory: e.target.value })}
              list="subcategories-list"
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <select
              value={newLink.portal_group}
              onChange={e => setNewLink({ ...newLink, portal_group: e.target.value })}
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white"
            >
              <option value="">Portal Group (optional)</option>
              {PORTAL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input
              placeholder="Tags (comma separated)"
              value={newLink.tags.join(', ')}
              onChange={e => setNewLink({ ...newLink, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
            />
            <input
              placeholder="Description"
              value={newLink.description}
              onChange={e => setNewLink({ ...newLink, description: e.target.value })}
              className="bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 sm:col-span-2"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={newLink.is_featured} onChange={e => setNewLink({ ...newLink, is_featured: e.target.checked })} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" checked={newLink.is_gated} onChange={e => setNewLink({ ...newLink, is_gated: e.target.checked })} />
              Token-gated
            </label>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="ml-auto px-4 py-1.5 text-sm font-medium bg-[#f5a623] text-[#0a1628] rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Adding...' : 'Add Link'}
            </button>
          </div>
          <datalist id="categories-list">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
          <datalist id="subcategories-list">
            {subcategories.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Search links..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 flex-1 min-w-[200px]"
        />
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory(''); }}
          className="bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterSubcategory}
          onChange={e => setFilterSubcategory(e.target.value)}
          className="bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="">All Subcategories</option>
          {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Links Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1a2a3a] text-gray-400 text-left">
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Category</th>
              <th className="px-3 py-2 font-medium hidden md:table-cell">Portal</th>
              <th className="px-3 py-2 font-medium text-center">Active</th>
              <th className="px-3 py-2 font-medium text-center hidden sm:table-cell">Star</th>
              <th className="px-3 py-2 font-medium text-center hidden sm:table-cell">Gated</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map(link => (
              <tr key={link.id} className={`border-t border-white/5 hover:bg-white/5 transition-colors ${!link.is_active ? 'opacity-50' : ''}`}>
                {editingId === link.id ? (
                  <>
                    <td className="px-3 py-2" colSpan={7}>
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={editForm.title || ''}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-sm text-white"
                            placeholder="Title"
                          />
                          <input
                            value={editForm.url || ''}
                            onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                            className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-sm text-white"
                            placeholder="URL"
                          />
                          <input
                            value={editForm.category || ''}
                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                            className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-sm text-white"
                            placeholder="Category"
                          />
                          <input
                            value={editForm.subcategory || ''}
                            onChange={e => setEditForm({ ...editForm, subcategory: e.target.value })}
                            className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-sm text-white"
                            placeholder="Subcategory"
                          />
                          <select
                            value={editForm.portal_group || ''}
                            onChange={e => setEditForm({ ...editForm, portal_group: e.target.value || null })}
                            className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-sm text-white"
                          >
                            <option value="">No portal group</option>
                            {PORTAL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <input
                            value={(editForm.tags || []).join(', ')}
                            onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                            className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-sm text-white"
                            placeholder="Tags (comma separated)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(link.id)}
                            disabled={saving}
                            className="px-3 py-1 text-xs bg-[#f5a623] text-[#0a1628] rounded hover:bg-[#ffd700] disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditForm({}); }}
                            className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">
                      <div>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#f5a623] transition-colors">
                          {link.title}
                        </a>
                        <div className="text-xs text-gray-500 truncate max-w-[250px]">{link.url}</div>
                        {link.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {link.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                            {link.tags.length > 3 && <span className="text-[10px] text-gray-500">+{link.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400 hidden sm:table-cell">
                      <div className="text-xs">{link.category}</div>
                      <div className="text-xs text-gray-500">{link.subcategory}</div>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      {link.portal_group && (
                        <span className="text-xs bg-[#f5a623]/10 text-[#f5a623] px-2 py-0.5 rounded">{link.portal_group}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleToggle(link.id, 'is_active', link.is_active)} className="text-lg">
                        {link.is_active ? '✅' : '❌'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center hidden sm:table-cell">
                      <button onClick={() => handleToggle(link.id, 'is_featured', link.is_featured)} className="text-lg">
                        {link.is_featured ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center hidden sm:table-cell">
                      <button onClick={() => handleToggle(link.id, 'is_gated', link.is_gated)} className="text-lg">
                        {link.is_gated ? '🔒' : '🔓'}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(link)}
                          className="px-2 py-1 text-xs bg-white/5 text-gray-300 rounded hover:bg-white/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(link.id, link.title)}
                          className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLinks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchQuery || filterCategory ? 'No links match your filters' : 'No links yet. Add one above!'}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Showing {filteredLinks.length} of {links.length} links
      </div>
    </div>
  );
}
