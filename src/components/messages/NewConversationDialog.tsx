'use client';

import { useState, useRef, useCallback } from 'react';

interface SearchUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verified_addresses: string[];
  ens: Record<string, string>;
}

interface NewConversationDialogProps {
  type: 'dm' | 'group';
  isOpen: boolean;
  onClose: () => void;
  onCreateDm: (address: `0x${string}`) => Promise<void>;
  onCreateGroup: (name: string, addresses: `0x${string}`[]) => Promise<void>;
}

const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export function NewConversationDialog({
  type,
  isOpen,
  onClose,
  onCreateDm,
  onCreateGroup,
}: NewConversationDialogProps) {
  // DM state
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  // Group state
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<{ user: SearchUser; address: string }[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupResults, setGroupResults] = useState<SearchUser[]>([]);
  const [groupSearching, setGroupSearching] = useState(false);

  // Shared
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchUsers = useCallback(async (q: string, setRes: (u: SearchUser[]) => void, setLoading: (b: boolean) => void) => {
    if (q.length < 1) {
      setRes([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        // Enrich with wallet data via the user endpoint
        const enriched = await Promise.all(
          users.slice(0, 6).map(async (u: Record<string, unknown>) => {
            try {
              const profileRes = await fetch(`/api/users/${u.fid}`);
              if (profileRes.ok) {
                const profile = await profileRes.json();
                return {
                  fid: profile.fid,
                  username: profile.username,
                  display_name: profile.display_name,
                  pfp_url: profile.pfp_url,
                  custody_address: profile.custody_address || '',
                  verified_addresses: profile.verified_addresses?.eth_addresses || [],
                  ens: {},
                };
              }
            } catch { /* fall through */ }
            return {
              fid: u.fid as number,
              username: (u.username as string) || '',
              display_name: (u.display_name as string) || '',
              pfp_url: (u.pfp_url as string) || '',
              custody_address: '',
              verified_addresses: [],
              ens: {},
            };
          })
        );
        setRes(enriched);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedUser(null);
    setSelectedAddress('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val, setResults, setSearching), 400);
  };

  const handleGroupSearchChange = (val: string) => {
    setGroupSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(val, setGroupResults, setGroupSearching), 400);
  };

  const selectUser = (user: SearchUser) => {
    setSelectedUser(user);
    // Auto-select first available address
    const addr = user.verified_addresses[0] || user.custody_address || '';
    setSelectedAddress(addr);
    setResults([]);
    setSearch('');
  };

  const addGroupMember = (user: SearchUser) => {
    if (groupMembers.some((m) => m.user.fid === user.fid)) return;
    const addr = user.verified_addresses[0] || user.custody_address || '';
    if (!addr) return;
    setGroupMembers((prev) => [...prev, { user, address: addr }]);
    setGroupResults([]);
    setGroupSearch('');
  };

  const removeGroupMember = (fid: number) => {
    setGroupMembers((prev) => prev.filter((m) => m.user.fid !== fid));
  };

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    try {
      if (type === 'dm') {
        if (!selectedAddress || !selectedAddress.startsWith('0x')) {
          setError('Select a user with a wallet address');
          return;
        }
        await onCreateDm(selectedAddress as `0x${string}`);
      } else {
        if (!groupName.trim()) {
          setError('Enter a group name');
          return;
        }
        if (groupMembers.length === 0) {
          setError('Add at least one member');
          return;
        }
        const addrs = groupMembers.map((m) => m.address as `0x${string}`);
        await onCreateGroup(groupName.trim(), addrs);
      }
      // Reset and close
      resetState();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };

  const resetState = () => {
    setSearch('');
    setResults([]);
    setSelectedUser(null);
    setSelectedAddress('');
    setGroupName('');
    setGroupMembers([]);
    setGroupSearch('');
    setGroupResults([]);
    setError('');
  };

  if (!isOpen) return null;

  const allAddresses = selectedUser
    ? [
        ...(selectedUser.custody_address ? [{ addr: selectedUser.custody_address, label: 'Farcaster', color: 'blue' }] : []),
        ...selectedUser.verified_addresses.map((a) => ({ addr: a, label: 'Verified', color: 'green' })),
      ]
    : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0d1b2a] border border-gray-700 rounded-xl w-full max-w-md shadow-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
            <h3 className="text-base font-semibold text-white">
              {type === 'dm' ? 'New Message' : 'New Group'}
            </h3>
            <button onClick={() => { resetState(); onClose(); }} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {type === 'dm' ? (
              <>
                {/* Selected user card */}
                {selectedUser ? (
                  <div className="rounded-lg bg-[#1a2a3a] border border-gray-700 p-3">
                    <div className="flex items-center gap-3">
                      {selectedUser.pfp_url ? (
                        <img src={selectedUser.pfp_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white">{selectedUser.display_name || selectedUser.username}</span>
                        <span className="text-xs text-gray-500 ml-2">@{selectedUser.username}</span>
                        <p className="text-[10px] text-gray-600 font-mono mt-0.5">FID:{selectedUser.fid}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedUser(null); setSelectedAddress(''); }}
                        className="text-gray-500 hover:text-white"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Wallet picker */}
                    {allAddresses.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Send to wallet</p>
                        {allAddresses.map(({ addr, label, color }) => (
                          <button
                            key={addr}
                            onClick={() => setSelectedAddress(addr)}
                            className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left transition-colors ${
                              selectedAddress === addr
                                ? 'bg-[#f5a623]/10 border border-[#f5a623]/30'
                                : 'bg-[#0a1628] border border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                            }`}>
                              {label}
                            </span>
                            <span className="text-xs text-gray-300 font-mono flex-1">{shortAddr(addr)}</span>
                            {selectedAddress === addr && (
                              <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {allAddresses.length === 0 && (
                      <p className="text-xs text-red-400 mt-2">No wallet addresses found for this user</p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Search input */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Search Farcaster user</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Type a username..."
                          autoFocus
                          className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50"
                        />
                      </div>
                    </div>

                    {/* Search results */}
                    {searching && (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {!searching && results.length > 0 && (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {results.map((user) => (
                          <button
                            key={user.fid}
                            onClick={() => selectUser(user)}
                            className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-[#1a2a3a] hover:bg-white/5 transition-colors text-left"
                          >
                            {user.pfp_url ? (
                              <img src={user.pfp_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-white truncate">{user.display_name || user.username}</span>
                                <span className="text-xs text-gray-500">@{user.username}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-600 font-mono">FID:{user.fid}</span>
                                {user.custody_address && (
                                  <span className="text-[10px] text-gray-600 font-mono">{shortAddr(user.custody_address)}</span>
                                )}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}

                    {!searching && search.length >= 1 && results.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-3">No users found</p>
                    )}
                  </>
                )}
              </>
            ) : (
              /* ── Group creation ────────────────────────────────────────── */
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Group Name</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. ZAO Producers"
                    className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50"
                  />
                </div>

                {/* Added members */}
                {groupMembers.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">{groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {groupMembers.map((m) => (
                        <span
                          key={m.user.fid}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#1a2a3a] border border-gray-700 text-xs"
                        >
                          {m.user.pfp_url && (
                            <img src={m.user.pfp_url} alt="" className="w-4 h-4 rounded-full" />
                          )}
                          <span className="text-white">{m.user.display_name || m.user.username}</span>
                          <button onClick={() => removeGroupMember(m.user.fid)} className="text-gray-500 hover:text-red-400">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Member search */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Add members</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={groupSearch}
                      onChange={(e) => handleGroupSearchChange(e.target.value)}
                      placeholder="Search by username..."
                      className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50"
                    />
                  </div>
                </div>

                {groupSearching && (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-5 h-5 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!groupSearching && groupResults.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {groupResults.map((user) => {
                      const alreadyAdded = groupMembers.some((m) => m.user.fid === user.fid);
                      const hasAddr = user.verified_addresses.length > 0 || !!user.custody_address;
                      return (
                        <button
                          key={user.fid}
                          onClick={() => addGroupMember(user)}
                          disabled={alreadyAdded || !hasAddr}
                          className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-[#1a2a3a] hover:bg-white/5 transition-colors text-left disabled:opacity-40"
                        >
                          {user.pfp_url ? (
                            <img src={user.pfp_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white truncate">{user.display_name || user.username}</span>
                            <span className="text-xs text-gray-500 ml-1.5">@{user.username}</span>
                          </div>
                          <span className={`text-xs ${alreadyAdded ? 'text-green-400' : 'text-gray-500'}`}>
                            {alreadyAdded ? 'Added' : hasAddr ? '+ Add' : 'No wallet'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800 flex-shrink-0">
            <button
              onClick={() => { resetState(); onClose(); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || (type === 'dm' ? !selectedAddress : groupMembers.length === 0 || !groupName.trim())}
              className="px-4 py-2 text-sm font-medium bg-[#f5a623] text-black rounded-lg hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : type === 'dm' ? 'Start Chat' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
