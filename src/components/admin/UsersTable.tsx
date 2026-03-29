'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface User {
  id: string;
  primary_wallet: string;
  fid: number | null;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  bio: string | null;
  custody_address: string | null;
  verified_addresses: string[] | null;
  ens_name: string | null;
  respect_wallet: string | null;
  zid: number | null;
  role: 'beta' | 'member' | 'admin';
  real_name: string | null;
  ign: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  signer_uuid: string | null;
}

const ROLE_COLORS = {
  beta: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  member: 'bg-green-500/10 text-green-400 border-green-500/30',
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

const ROLE_LABELS = {
  beta: 'Beta',
  member: 'Member',
  admin: 'Admin',
};

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); }, []);

  // Add user state
  const [showAdd, setShowAdd] = useState(false);
  const [addInput, setAddInput] = useState(''); // wallet, FID, or @username
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // Expanded user
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      showFeedback('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter by search
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.primary_wallet?.toLowerCase().includes(q) ||
      u.real_name?.toLowerCase().includes(q) ||
      u.ign?.toLowerCase().includes(q) ||
      u.ens_name?.toLowerCase().includes(q) ||
      String(u.fid).includes(q)
    );
  });

  // Stats
  const betaCount = users.filter((u) => u.role === 'beta').length;
  const memberCount = users.filter((u) => u.role === 'member').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  // ── Import from Allowlist ──
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/users/import', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message);
        fetchUsers();
      } else {
        showFeedback('error', data.error || 'Import failed');
      }
    } catch {
      showFeedback('error', 'Import request failed');
    } finally {
      setImporting(false);
    }
  };

  // ── Add User ──
  const handleAdd = async () => {
    const input = addInput.trim();
    if (!input) {
      showFeedback('error', 'Enter a wallet address, FID, or @username');
      return;
    }

    // Determine what the input is
    const isWallet = /^0x[a-fA-F0-9]{40}$/i.test(input);
    const isFid = /^\d+$/.test(input);
    const isUsername = !isWallet && !isFid; // treat anything else as username

    if (isWallet) {
      // validate format already passed
    } else if (!isFid && !isUsername) {
      showFeedback('error', 'Enter a valid wallet (0x...), FID number, or @username');
      return;
    }

    setAdding(true);
    try {
      const body: Record<string, unknown> = { real_name: addName || undefined };
      if (isWallet) body.primary_wallet = input;
      else if (isFid) body.fid = parseInt(input);
      else body.username = input.replace(/^@/, '');

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', `Added ${data.user?.display_name || data.user?.username || input}`);
        setAddInput('');
        setAddName('');
        setShowAdd(false);
        fetchUsers();
      } else {
        showFeedback('error', data.error || 'Failed to add');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setAdding(false);
    }
  };

  // ── Assign ZID ──
  const [assigningZid, setAssigningZid] = useState<string | null>(null);

  const handleAssignZid = async (user: User) => {
    if (user.zid) {
      showFeedback('error', `Already has ZID #${user.zid}`);
      return;
    }
    setAssigningZid(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, assign_zid: true }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', `Assigned ZID #${data.user?.zid}`);
        fetchUsers();
      } else {
        showFeedback('error', data.error || 'Failed to assign ZID');
      }
    } catch {
      showFeedback('error', 'Network error');
    } finally {
      setAssigningZid(null);
    }
  };

  // ── Edit User ──
  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      display_name: user.display_name || '',
      username: user.username || '',
      real_name: user.real_name || '',
      ign: user.ign || '',
      bio: user.bio || '',
      role: user.role,
      fid: user.fid ? String(user.fid) : '',
      respect_wallet: user.respect_wallet || '',
      notes: user.notes || '',
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const updates: Record<string, unknown> = { id: editingUser.id };

      if (editForm.display_name !== (editingUser.display_name || '')) updates.display_name = editForm.display_name || null;
      if (editForm.username !== (editingUser.username || '')) updates.username = editForm.username || null;
      if (editForm.real_name !== (editingUser.real_name || '')) updates.real_name = editForm.real_name || null;
      if (editForm.ign !== (editingUser.ign || '')) updates.ign = editForm.ign || null;
      if (editForm.bio !== (editingUser.bio || '')) updates.bio = editForm.bio || null;
      if (editForm.role !== editingUser.role) updates.role = editForm.role;
      if (editForm.respect_wallet !== (editingUser.respect_wallet || '')) updates.respect_wallet = editForm.respect_wallet || null;
      if (editForm.notes !== (editingUser.notes || '')) updates.notes = editForm.notes || null;

      // FID linking/unlinking
      const newFid = editForm.fid ? parseInt(editForm.fid) : null;
      if (newFid !== editingUser.fid) {
        updates.fid = newFid;
      }

      if (Object.keys(updates).length <= 1) {
        setEditingUser(null);
        return; // No changes
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', 'User updated');
        setEditingUser(null);
        fetchUsers();
      } else {
        showFeedback('error', data.error || 'Failed to update');
      }
    } catch {
      showFeedback('error', 'Network error');
    }
  };

  // ── Deactivate ──
  const handleDeactivate = async (user: User) => {
    if (!confirm(`Deactivate ${user.display_name || user.primary_wallet}?`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    if (res.ok) {
      showFeedback('success', 'User deactivated');
      fetchUsers();
    } else {
      showFeedback('error', 'Failed to deactivate');
    }
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Feedback */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-[70] px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
          feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Users</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">{betaCount}</p>
          <p className="text-xs text-gray-400 mt-1">Beta (wallet)</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">{memberCount}</p>
          <p className="text-xs text-gray-400 mt-1">Members (FID)</p>
        </div>
        <div className="bg-[#1a2a3a] rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-400">{adminCount}</p>
          <p className="text-xs text-gray-400 mt-1">Admins</p>
        </div>
      </div>

      {/* Import from Allowlist */}
      <button
        onClick={handleImport}
        disabled={importing}
        className={`mb-4 w-full flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
          users.length === 0
            ? 'py-3 bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] hover:bg-[#f5a623]/20'
            : 'py-2 bg-white/5 border border-gray-700 text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        {importing ? (
          <>
            <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            Importing from allowlist...
          </>
        ) : (
          <>
            {users.length === 0 ? 'Import existing allowlist members into Users table' : 'Sync from allowlist (imports new entries)'}
          </>
        )}
      </button>

      {/* Search + Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 border-0 focus:ring-1 focus:ring-[#f5a623]"
        >
          <option value="">All roles</option>
          <option value="beta">Beta</option>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
            showAdd ? 'bg-gray-700 text-gray-300' : 'bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700]'
          }`}
        >
          {showAdd ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Add User Panel */}
      {showAdd && (
        <div className="bg-[#1a2a3a] rounded-xl p-4 mb-4 border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3">Add New User</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              placeholder="@username, FID, or 0x wallet"
              autoFocus
              className="bg-[#0a1628] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
              onKeyDown={(e) => { if (e.key === 'Enter' && addInput.trim()) handleAdd(); }}
            />
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Name (optional)"
              className="bg-[#0a1628] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
            />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Type a Farcaster @username, FID number, or 0x wallet. Username/FID auto-populates profile + wallet.
          </p>
          <button
            onClick={handleAdd}
            disabled={adding || !addInput.trim()}
            className="bg-[#f5a623] text-[#0a1628] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
          >
            {adding ? 'Adding...' : 'Add User'}
          </button>
        </div>
      )}

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-500 mb-2">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* User Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[#1a2a3a] rounded-xl py-8 text-center text-gray-500">
            {search ? 'No users match' : 'No users yet — add one above'}
          </div>
        ) : (
          filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              expanded={expandedId === user.id}
              onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
              onEdit={() => startEdit(user)}
              onDeactivate={() => handleDeactivate(user)}
              onAssignZid={() => handleAssignZid(user)}
              assigningZid={assigningZid === user.id}
              shortAddr={shortAddr}
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          form={editForm}
          setForm={setEditForm}
          onSave={handleSave}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

// ── User Card ──
function UserCard({
  user,
  expanded,
  onToggle,
  onEdit,
  onDeactivate,
  onAssignZid,
  assigningZid,
  shortAddr,
}: {
  user: User;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onAssignZid: () => void;
  assigningZid: boolean;
  shortAddr: (a: string) => string;
}) {
  const name = user.display_name || user.ign || user.real_name || shortAddr(user.primary_wallet);

  return (
    <div className="bg-[#1a2a3a] rounded-xl overflow-hidden border border-gray-800/50">
      {/* Main row */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
        {/* Avatar */}
        {user.pfp_url ? (
          <Image src={user.pfp_url} alt={`${name} avatar`} width={36} height={36} className="rounded-full flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-mono">
            {user.primary_wallet.slice(2, 4)}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{name}</span>
            {user.username && <span className="text-xs text-gray-500">@{user.username}</span>}
            {user.zid && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 font-medium">
                ZID #{user.zid}
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${ROLE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-600 font-mono">{shortAddr(user.primary_wallet)}</span>
            {user.fid && <span className="text-[10px] text-gray-600">FID:{user.fid}</span>}
            {user.ens_name && <span className="text-[10px] text-purple-400">{user.ens_name}</span>}
            {!user.fid && <span className="text-[10px] text-yellow-500/60">No FID</span>}
          </div>
        </div>

        {/* Chevron */}
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/50">
          <div className="mt-3 space-y-2 text-xs">
            {/* Wallets */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium w-16 text-center">Primary</span>
              <span className="text-gray-300 font-mono flex-1 truncate">{user.primary_wallet}</span>
            </div>
            {user.custody_address && user.custody_address !== user.primary_wallet && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium w-16 text-center">Custody</span>
                <span className="text-gray-300 font-mono flex-1 truncate">{user.custody_address}</span>
              </div>
            )}
            {user.verified_addresses && user.verified_addresses.length > 0 && user.verified_addresses.map((addr) => (
              <div key={addr} className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium w-16 text-center">Verified</span>
                <span className="text-gray-300 font-mono flex-1 truncate">{addr}</span>
              </div>
            ))}

            {/* Respect Wallet */}
            {user.respect_wallet && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium w-16 text-center">Respect</span>
                <span className="text-gray-300 font-mono flex-1 truncate">{user.respect_wallet}</span>
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-400 mt-2 italic">&ldquo;{user.bio}&rdquo;</p>
            )}

            {/* Notes */}
            {user.notes && (
              <p className="text-gray-500 mt-1">Notes: {user.notes}</p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-[10px] text-gray-600 mt-2">
              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              {user.last_login_at && <span>Last login {new Date(user.last_login_at).toLocaleDateString()}</span>}
              {user.signer_uuid && <span className="text-green-500/60">Has signer</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800/50">
            <button
              onClick={onEdit}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
            >
              Edit
            </button>
            {!user.fid && (
              <button
                onClick={onEdit}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                Link FID
              </button>
            )}
            {!user.zid && (
              <button
                onClick={onAssignZid}
                disabled={assigningZid}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                {assigningZid ? 'Assigning...' : 'Assign ZID'}
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={onDeactivate}
                className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Modal ──
function EditUserModal({
  user,
  form,
  setForm,
  onSave,
  onClose,
}: {
  user: User;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const update = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-[#0f1d2e] rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Edit User</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Wallet (read-only) */}
          <label className="block text-xs text-gray-500 mb-1">Primary Wallet</label>
          <p className="text-sm text-gray-300 font-mono mb-4 bg-[#1a2a3a] rounded-lg px-3 py-2">{user.primary_wallet}</p>

          {/* FID */}
          <label className="block text-xs text-gray-500 mb-1">
            Farcaster ID (FID)
            {!user.fid && <span className="text-yellow-400 ml-1">— Link to upgrade from Beta</span>}
          </label>
          <input
            value={form.fid}
            onChange={(e) => update('fid', e.target.value)}
            placeholder="Enter FID to link Farcaster account"
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />

          {/* Display Name */}
          <label className="block text-xs text-gray-500 mb-1">Display Name</label>
          <input
            value={form.display_name}
            onChange={(e) => update('display_name', e.target.value)}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />

          {/* Username */}
          <label className="block text-xs text-gray-500 mb-1">Username</label>
          <input
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />

          {/* Real Name */}
          <label className="block text-xs text-gray-500 mb-1">Real Name</label>
          <input
            value={form.real_name}
            onChange={(e) => update('real_name', e.target.value)}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />

          {/* IGN */}
          <label className="block text-xs text-gray-500 mb-1">In-Game Name</label>
          <input
            value={form.ign}
            onChange={(e) => update('ign', e.target.value)}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
          />

          {/* Bio */}
          <label className="block text-xs text-gray-500 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            rows={2}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] resize-none"
          />

          {/* Role */}
          <label className="block text-xs text-gray-500 mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 border-0 focus:ring-1 focus:ring-[#f5a623]"
          >
            <option value="beta">Beta (wallet-only, limited)</option>
            <option value="member">Member (full features)</option>
            <option value="admin">Admin (full + admin panel)</option>
          </select>

          {/* Respect Wallet */}
          <label className="block text-xs text-gray-500 mb-1">
            Respect Wallet
            <span className="text-gray-600 ml-1">— On-chain address for ZID/respect tokens</span>
          </label>
          <input
            value={form.respect_wallet}
            onChange={(e) => update('respect_wallet', e.target.value)}
            placeholder="0x... (defaults to primary wallet if empty)"
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] font-mono"
          />

          {/* Notes */}
          <label className="block text-xs text-gray-500 mb-1">Admin Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 mb-4 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] resize-none"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onSave}
              className="flex-1 bg-[#f5a623] text-[#0a1628] text-sm font-semibold py-2.5 rounded-lg hover:bg-[#ffd700] transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
