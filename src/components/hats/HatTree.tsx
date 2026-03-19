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

// Level-based colors for the tree
const LEVEL_COLORS = [
  { bg: 'bg-[#f5a623]/15', border: 'border-[#f5a623]/40', text: 'text-[#f5a623]', line: 'bg-[#f5a623]/30' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', line: 'bg-purple-500/20' },
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', line: 'bg-blue-500/20' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', line: 'bg-emerald-500/20' },
];

function getColors(level: number) {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
}

function HatNodeVisual({ node, depth = 0 }: { node: HatNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const colors = getColors(depth);
  const isTopHat = depth === 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`relative rounded-2xl border-2 transition-all ${colors.bg} ${colors.border} ${
          hasChildren ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
        } ${isTopHat ? 'px-6 py-4' : 'px-4 py-3'}`}
      >
        {/* Hat icon */}
        <div className="flex items-center gap-2">
          <span className={`${isTopHat ? 'text-2xl' : 'text-lg'}`}>
            {isTopHat ? '\uD83C\uDFA9' : depth === 1 ? '\u2699\uFE0F' : '\uD83E\uDDE2'}
          </span>
          <div className="text-left">
            <p className={`font-semibold ${colors.text} ${isTopHat ? 'text-base' : 'text-sm'}`}>
              {node.label}
            </p>
            {node.supply > 0 && (
              <p className="text-[10px] text-gray-400">
                {node.supply} wearer{node.supply !== 1 ? 's' : ''} / {node.maxSupply} max
              </p>
            )}
            {node.supply === 0 && (
              <p className="text-[10px] text-gray-600">
                {node.maxSupply > 0 ? `0 / ${node.maxSupply} max` : 'Empty'}
              </p>
            )}
          </div>
        </div>

        {/* Wearer count badge */}
        {node.supply > 0 && (
          <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
            {node.supply}
          </span>
        )}

        {/* Inactive indicator */}
        {!node.isActive && (
          <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
            !
          </span>
        )}

        {/* Expand indicator */}
        {hasChildren && (
          <div className={`mt-1.5 text-center text-[10px] ${colors.text} opacity-60`}>
            {expanded ? '\u25B2' : `\u25BC ${node.children.length}`}
          </div>
        )}
      </button>

      {/* Connecting line down */}
      {expanded && hasChildren && (
        <>
          <div className={`w-0.5 h-6 ${colors.line}`} />

          {/* Horizontal bar connecting children */}
          {node.children.length > 1 && (
            <div className="relative w-full flex justify-center">
              <div className={`h-0.5 ${getColors(depth + 1).line}`}
                style={{ width: `${Math.min(90, node.children.length * 30)}%` }}
              />
            </div>
          )}

          {/* Children */}
          <div className={`flex gap-3 overflow-x-auto pb-2 ${
            node.children.length > 3 ? 'flex-wrap justify-center' : 'justify-center'
          }`}>
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center flex-shrink-0">
                {/* Connecting line from horizontal bar to child */}
                <div className={`w-0.5 h-4 ${getColors(depth + 1).line}`} />
                <HatNodeVisual node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
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
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">ZAO Role Tree</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Tree {tree.treeId} on Optimism</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-white">{tree.totalHats}</p>
            <p className="text-[10px] text-gray-600">roles</p>
          </div>
          <a
            href="https://app.hatsprotocol.xyz/trees/10/226"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2 py-1 rounded-lg bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
          >
            View on Hats
          </a>
        </div>
      </div>

      {/* Visual tree */}
      <div className="overflow-x-auto">
        <div className="min-w-fit py-4">
          <HatNodeVisual node={tree.root} />
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Live on-chain data from Optimism. Tap a role to expand.
      </p>
    </div>
  );
}
