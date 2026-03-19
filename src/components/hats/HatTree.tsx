'use client';

import { useEffect, useState, useMemo } from 'react';

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

// Level-based accent colors
const LEVEL_STYLES = [
  { accent: 'text-[#f5a623]', bg: 'bg-[#f5a623]/10', border: 'border-[#f5a623]/30', dot: 'bg-[#f5a623]' },
  { accent: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  { accent: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  { accent: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
];

function getStyle(depth: number) {
  return LEVEL_STYLES[Math.min(depth, LEVEL_STYLES.length - 1)];
}

function countNodes(node: HatNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

function countActiveWearers(node: HatNode): number {
  return node.supply + node.children.reduce((sum, c) => sum + countActiveWearers(c), 0);
}

function matchesSearch(node: HatNode, query: string): boolean {
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.wearers.some((w) => w.toLowerCase().includes(q))) return true;
  return node.children.some((c) => matchesSearch(c, q));
}

/** Format a wallet address for display */
function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Supply indicator with color coding */
function SupplyBadge({ supply, max }: { supply: number; max: number }) {
  const color =
    supply >= max
      ? 'text-red-400 bg-red-500/10'
      : supply > 0
        ? 'text-[#f5a623] bg-[#f5a623]/10'
        : 'text-gray-500 bg-white/5';

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      {supply}/{max}
    </span>
  );
}

function TreeNode({
  node,
  depth = 0,
  isLast = true,
  parentLines = [],
  hideEmpty,
  searchQuery,
}: {
  node: HatNode;
  depth?: number;
  isLast?: boolean;
  parentLines?: boolean[];
  hideEmpty: boolean;
  searchQuery: string;
}) {
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const [showWearers, setShowWearers] = useState(false);
  const style = getStyle(depth);
  const isTopHat = depth === 0;

  // Filter children based on settings
  const visibleChildren = useMemo(() => {
    let kids = node.children;
    if (hideEmpty) {
      kids = kids.filter((c) => c.supply > 0 || c.children.some((gc) => gc.supply > 0));
    }
    if (searchQuery) {
      kids = kids.filter((c) => matchesSearch(c, searchQuery));
    }
    return kids;
  }, [node.children, hideEmpty, searchQuery]);

  const hasVisibleChildren = visibleChildren.length > 0;

  // When searching, force expand nodes with matches; otherwise use manual or default
  const expanded = searchQuery
    ? hasVisibleChildren
    : manualExpanded ?? depth < 2;

  const toggleExpanded = () => setManualExpanded(expanded ? false : true);

  return (
    <div className={isTopHat ? '' : 'ml-1'}>
      {/* Node row */}
      <div className="flex items-start gap-0 group">
        {/* Tree guide lines */}
        {!isTopHat && (
          <div className="flex items-start flex-shrink-0 select-none" aria-hidden>
            {parentLines.map((showLine, i) => (
              <span key={i} className="w-5 flex-shrink-0 inline-block h-full relative">
                {showLine && (
                  <span className="absolute left-2 top-0 bottom-0 w-px bg-gray-700/60" />
                )}
              </span>
            ))}
            <span className="w-5 flex-shrink-0 inline-flex items-start h-8 relative">
              {/* Vertical line from parent */}
              <span className={`absolute left-2 top-0 w-px bg-gray-700/60 ${isLast ? 'h-4' : 'h-full'}`} />
              {/* Horizontal connector */}
              <span className="absolute left-2 top-4 w-3 h-px bg-gray-700/60" />
            </span>
          </div>
        )}

        {/* Node content */}
        <button
          onClick={() => hasVisibleChildren && toggleExpanded()}
          className={`flex items-center gap-2 min-w-0 flex-1 rounded-lg px-2.5 py-2 transition-colors text-left ${
            hasVisibleChildren ? 'cursor-pointer hover:bg-white/[0.03]' : 'cursor-default'
          } ${isTopHat ? 'py-3' : ''}`}
        >
          {/* Expand/collapse indicator */}
          {hasVisibleChildren ? (
            <span className={`text-[10px] w-4 flex-shrink-0 text-center ${style.accent} opacity-70`}>
              {expanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot} opacity-60 ml-1 mr-1`} />
          )}

          {/* Hat label */}
          <span className={`font-medium truncate ${style.accent} ${isTopHat ? 'text-base' : 'text-sm'}`}>
            {node.label}
          </span>

          {/* Inactive badge */}
          {!node.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 flex-shrink-0">
              inactive
            </span>
          )}

          {/* Supply badge */}
          <span className="flex-shrink-0 ml-auto">
            <SupplyBadge supply={node.supply} max={node.maxSupply} />
          </span>
        </button>
      </div>

      {/* Wearer list (expandable) */}
      {node.wearers.length > 0 && (
        <div className={`${isTopHat ? 'ml-6' : ''}`} style={!isTopHat ? { marginLeft: `${(parentLines.length + 1) * 20 + 36}px` } : undefined}>
          <button
            onClick={() => setShowWearers(!showWearers)}
            className="text-[10px] text-gray-500 hover:text-gray-400 transition-colors px-1 -mt-1 mb-0.5"
          >
            {showWearers ? 'hide wearers' : `${node.wearers.length} wearer${node.wearers.length !== 1 ? 's' : ''}`}
          </button>
          {showWearers && (
            <div className="flex flex-wrap gap-1 mb-1 px-1">
              {node.wearers.map((addr) => (
                <span
                  key={addr}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${style.bg} ${style.accent}`}
                  title={addr}
                >
                  {shortAddr(addr)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Children */}
      {expanded && hasVisibleChildren && (
        <div>
          {visibleChildren.map((child, i) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={i === visibleChildren.length - 1}
              parentLines={isTopHat ? [] : [...parentLines, !isLast]}
              hideEmpty={hideEmpty}
              searchQuery={searchQuery}
            />
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
  const [searchQuery, setSearchQuery] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false);

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

  const stats = useMemo(() => {
    if (!tree?.root) return null;
    return {
      totalRoles: countNodes(tree.root),
      totalWearers: countActiveWearers(tree.root),
    };
  }, [tree]);

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
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">ZAO Role Tree</p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            Tree {tree.treeId} on Optimism &middot; {stats?.totalRoles} roles &middot; {stats?.totalWearers} wearers
          </p>
        </div>
        <a
          href="https://app.hatsprotocol.xyz/trees/10/226"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-2 py-1 rounded-lg bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors flex-shrink-0"
        >
          View on Hats
        </a>
      </div>

      {/* Search + filter controls */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search roles or addresses..."
          className="flex-1 bg-[#0d1b2a] text-white text-xs rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-800 focus:outline-none focus:border-[#f5a623]/40"
        />
        <button
          onClick={() => setHideEmpty(!hideEmpty)}
          className={`text-[10px] px-2.5 py-2 rounded-lg border transition-colors flex-shrink-0 ${
            hideEmpty
              ? 'bg-[#f5a623]/10 border-[#f5a623]/30 text-[#f5a623]'
              : 'bg-[#0d1b2a] border-gray-800 text-gray-500 hover:text-gray-400'
          }`}
          title={hideEmpty ? 'Showing active roles only' : 'Show all roles'}
        >
          {hideEmpty ? 'Active only' : 'Show all'}
        </button>
      </div>

      {/* Tree */}
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 px-3 py-3 overflow-hidden">
        <TreeNode
          node={tree.root}
          hideEmpty={hideEmpty}
          searchQuery={searchQuery}
        />
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Live on-chain data from Optimism. Tap a role to expand. Click wearer count to see addresses.
      </p>
    </div>
  );
}
