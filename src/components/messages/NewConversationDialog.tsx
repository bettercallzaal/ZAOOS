'use client';

import { useState } from 'react';

interface NewConversationDialogProps {
  type: 'dm' | 'group';
  isOpen: boolean;
  onClose: () => void;
  onCreateDm: (address: `0x${string}`) => Promise<void>;
  onCreateGroup: (name: string, addresses: `0x${string}`[]) => Promise<void>;
}

export function NewConversationDialog({
  type,
  isOpen,
  onClose,
  onCreateDm,
  onCreateGroup,
}: NewConversationDialogProps) {
  const [address, setAddress] = useState('');
  const [groupName, setGroupName] = useState('');
  const [memberAddresses, setMemberAddresses] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    try {
      if (type === 'dm') {
        if (!address.startsWith('0x') || address.length !== 42) {
          setError('Enter a valid Ethereum address (0x...)');
          return;
        }
        await onCreateDm(address as `0x${string}`);
      } else {
        if (!groupName.trim()) {
          setError('Enter a group name');
          return;
        }
        const addrs = memberAddresses
          .split('\n')
          .map((a) => a.trim())
          .filter((a) => a.startsWith('0x') && a.length === 42);
        if (addrs.length === 0) {
          setError('Add at least one valid member address');
          return;
        }
        await onCreateGroup(groupName.trim(), addrs as `0x${string}`[]);
      }
      // Reset and close
      setAddress('');
      setGroupName('');
      setMemberAddresses('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0d1b2a] border border-gray-700 rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-base font-semibold text-white">
              {type === 'dm' ? 'New Direct Message' : 'New Group'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {type === 'dm' ? (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Wallet Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Enter the Ethereum address of the ZAO member you want to message
                </p>
              </div>
            ) : (
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
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Member Addresses (one per line)</label>
                  <textarea
                    value={memberAddresses}
                    onChange={(e) => setMemberAddresses(e.target.value)}
                    placeholder="0x...\n0x...\n0x..."
                    rows={4}
                    className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]/50 resize-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Add Ethereum addresses of members. Max 250 per group.
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
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
