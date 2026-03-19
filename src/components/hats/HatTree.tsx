'use client';

import { useEffect, useState } from 'react';

interface HatNode {
  id: string;
  prettyId: string;
  label: string;
  imageUri: string;
  maxSupply: number;
  supply: number;
  isActive: boolean;
  isMutable: boolean;
  children: HatNode[];
  level: number;
  wearers: string[];
}

interface HatTreeResult {
  treeId: number;
  root: HatNode | null;
  totalHats: number;
  timestamp: number;
}

function HatNodeCard({ node, depth = 0 }: { node: HatNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-gray-800 pl-4' : ''}>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`w-full text-left rounded-xl p-3 border transition-colors ${
          depth === 0
            ? 'bg-[#f5a623]/10 border-[#f5a623]/30'
            : node.supply > 0
              ? 'bg-[#0d1b2a] border-gray-700 hover:border-gray-600'
              : 'bg-[#0d1b2a]/50 border-gray-800 hover:border-gray-700'
        } ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {expanded ? '\u25BC' : '\u25B6'}
              </span>
            )}
            <span className={`text-sm font-medium truncate ${
              depth === 0 ? 'text-[#f5a623]' : node.supply > 0 ? 'text-white' : 'text-gray-500'
            }`}>
              {node.label}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {node.supply > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] font-medium">
                {node.supply}/{node.maxSupply}
              </span>
            )}
            {!node.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                inactive
              </span>
            )}
          </div>
        </div>
        {node.supply === 0 && node.maxSupply > 0 && (
          <p className="text-[10px] text-gray-600 mt-1">
            No wearers ({node.maxSupply} max)
          </p>
        )}
      </button>

      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <HatNodeCard key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HatTree() {
  const [tree, setTree] = useState<HatTreeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/hats/tree')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setTree)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading hat tree from Optimism...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!tree?.root) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No hat tree data found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500">Tree ID</p>
          <p className="text-xl font-bold text-white">{tree.treeId}</p>
          <p className="text-[10px] text-gray-600 mt-1">Optimism</p>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500">Total Hats</p>
          <p className="text-xl font-bold text-white">{tree.totalHats}</p>
          <p className="text-[10px] text-gray-600 mt-1">On-chain roles</p>
        </div>
      </div>

      {/* Tree */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Role Hierarchy</p>
        <div className="space-y-2">
          <HatNodeCard node={tree.root} />
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Live on-chain data from Optimism. Refreshes every 5 minutes.
      </p>
    </div>
  );
}
