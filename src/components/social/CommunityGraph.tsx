'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import force graph — cast to bypass complex generic mismatches
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then((mod) => mod.default) as Promise<React.ComponentType<Record<string, unknown>>>,
  { ssr: false, loading: () => null }
) as React.ComponentType<Record<string, unknown>>;

/* ---------- Error Boundary ---------- */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GraphErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* ---------- Types ---------- */

interface MemberNode {
  fid: number;
  displayName: string;
  username: string;
  pfpUrl: string | null;
  zid: number | null;
  followerCount: number;
  followingCount: number;
  communityFollowers: number;
  communityFollowing: number;
  mutuals: number;
}

interface Connection {
  from: number;
  to: number;
}

interface GraphStats {
  totalMembers: number;
  totalConnections: number;
  density: number;
  mostConnected: { fid: number; displayName: string; mutuals: number }[];
  disconnectedCount: number;
}

interface GraphNode {
  id: number;
  name: string;
  username: string;
  pfpUrl: string | null;
  zid: number | null;
  followerCount: number;
  mutuals: number;
  engagement: number;
  val: number; // node size
}

interface GraphLink {
  source: number;
  target: number;
}

/* ---------- Helpers ---------- */

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/* ---------- Component ---------- */

export function CommunityGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  const [members, setMembers] = useState<MemberNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [engagementMap, setEngagementMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [forceGraphFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodeId, setHighlightedNodeId] = useState<number | null>(null);

  // Image cache for canvas node rendering
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(400, entry.contentRect.height),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch community graph data
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/social/community-graph', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setMembers(data.members || []);
        setConnections(data.connections || []);
        setStats(data.stats || null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError('Failed to load community graph');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => { controller.abort(); };
  }, []);

  // Fetch engagement scores once members load
  useEffect(() => {
    if (members.length === 0) return;
    const fids = members.map((m) => m.fid);
    // Batch in groups of 100
    const batches: number[][] = [];
    for (let i = 0; i < fids.length; i += 100) {
      batches.push(fids.slice(i, i + 100));
    }
    Promise.allSettled(
      batches.map((batch) =>
        fetch(`/api/social/engagement?fids=${batch.join(',')}`).then((r) =>
          r.ok ? r.json() : null
        )
      )
    ).then((results) => {
      const merged: Record<string, number> = {};
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value?.scores) {
          for (const [fid, data] of Object.entries(result.value.scores)) {
            merged[fid] = (data as { global: number }).global || 0;
          }
        }
      }
      setEngagementMap(merged);
    });
  }, [members]);

  // Build graph data
  const graphData = useMemo(() => {
    const maxEngagement = Math.max(
      1,
      ...Object.values(engagementMap).map((v) => v || 0)
    );

    const nodes: GraphNode[] = members.map((m) => {
      const eng = engagementMap[String(m.fid)] || 0;
      const normalizedEng = eng / maxEngagement;
      return {
        id: m.fid,
        name: m.displayName || m.username,
        username: m.username,
        pfpUrl: m.pfpUrl,
        zid: m.zid,
        followerCount: m.followerCount,
        mutuals: m.mutuals,
        engagement: eng,
        val: clamp(4 + normalizedEng * 16, 4, 20),
      };
    });

    const links: GraphLink[] = connections.map((c) => ({
      source: c.from,
      target: c.to,
    }));

    return { nodes, links };
  }, [members, connections, engagementMap]);

  // Set of neighbor IDs for the hovered node
  const neighborSet = useMemo(() => {
    if (!hoveredNode) return null;
    const set = new Set<number>();
    set.add(hoveredNode.id);
    for (const link of graphData.links) {
      const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
      const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
      if (src === hoveredNode.id) set.add(tgt);
      if (tgt === hoveredNode.id) set.add(src);
    }
    return set;
  }, [hoveredNode, graphData.links]);

  // Search: find matching node
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedNodeId(null);
      return;
    }
    const q = searchQuery.toLowerCase();
    const match = graphData.nodes.find(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.username.toLowerCase().includes(q)
    );
    setHighlightedNodeId(match ? match.id : null);
  }, [searchQuery, graphData.nodes]);

  // Average connections
  const avgConnections = useMemo(() => {
    if (graphData.nodes.length === 0) return 0;
    const totalMutuals = graphData.nodes.reduce((sum, n) => sum + n.mutuals, 0);
    return (totalMutuals / graphData.nodes.length).toFixed(1);
  }, [graphData.nodes]);

  // Canvas node rendering with images
  const nodeCanvasObject = useCallback(
    (node: GraphNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isHighlighted = highlightedNodeId === node.id;
      const radius = isHighlighted ? (node.val || 6) * 1.5 : (node.val || 6);
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      // Dim non-neighbors on hover, or dim non-matching on search
      const dimmedByHover = neighborSet && !neighborSet.has(node.id);
      const dimmedBySearch = highlightedNodeId !== null && !isHighlighted;
      const dimmed = dimmedByHover || dimmedBySearch;
      ctx.globalAlpha = dimmed ? 0.15 : 1;

      // Gold ring for highlighted (search) node
      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f5a623';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Draw circle
      const color = node.zid ? '#f5a623' : '#6b7280';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw avatar if available and scale is large enough
      if (node.pfpUrl && globalScale > 0.6) {
        const cached = imageCache.current.get(node.pfpUrl);
        if (cached && cached.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius - 1, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(cached, x - radius + 1, y - radius + 1, (radius - 1) * 2, (radius - 1) * 2);
          ctx.restore();
        } else if (!cached) {
          // Cap cache at 100 entries to prevent memory leaks
          if (imageCache.current.size >= 100) {
            const firstKey = imageCache.current.keys().next().value;
            if (firstKey) imageCache.current.delete(firstKey);
          }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = node.pfpUrl;
          imageCache.current.set(node.pfpUrl, img);
        }
      }

      // Draw label at sufficient zoom
      if (globalScale > 1.2) {
        const label = node.name;
        const fontSize = Math.max(10 / globalScale, 2);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = dimmed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)';
        ctx.fillText(label, x, y + radius + 2);
      }

      ctx.globalAlpha = 1;
    },
    [neighborSet, highlightedNodeId]
  );

  const nodePointerAreaPaint = useCallback(
    (node: GraphNode & { x?: number; y?: number }, color: string, ctx: CanvasRenderingContext2D) => {
      const radius = node.val || 6;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, radius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode, event: MouseEvent) => {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node));
      setTooltipPos({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const linkColor = useCallback(
    (link: Record<string, unknown>) => {
      if (!neighborSet) return 'rgba(245,166,35,0.12)';
      const src = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source as number;
      const tgt = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target as number;
      if (neighborSet.has(src) && neighborSet.has(tgt)) return 'rgba(245,166,35,0.5)';
      return 'rgba(245,166,35,0.04)';
    },
    [neighborSet]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Building community graph...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      {stats && (
        <div className="flex items-center gap-4 px-4 text-xs text-gray-400">
          <span>
            <span className="text-white font-medium">{stats.totalMembers}</span> members
          </span>
          <span>
            <span className="text-[#f5a623] font-medium">{stats.totalConnections}</span> connections
          </span>
          <span>
            <span className="text-white font-medium">{stats.density}%</span> density
          </span>
          <span>
            <span className="text-white font-medium">{avgConnections}</span> avg connections
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623] inline-block" />
          ZAO member
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block" />
          Other
        </span>
        <span>Size = engagement</span>
      </div>

      {/* Search input */}
      <div className="px-4">
        <div className="relative max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623]/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
            >
              X
            </button>
          )}
        </div>
        {searchQuery && highlightedNodeId === null && (
          <p className="text-xs text-gray-500 mt-1">No matching member found</p>
        )}
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="relative w-full bg-[#0a1628] rounded-xl overflow-hidden border border-gray-800"
        style={{ height: 500 }}
      >
        <GraphErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Graph visualization encountered an error. Please refresh the page.
            </div>
          }
        >
        {!forceGraphFailed ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="#0a1628"
            nodeId="id"
            nodeVal="val"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            linkColor={linkColor}
            linkWidth={0.5}
            linkDirectionalParticles={0}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            enableNodeDrag={true}
            onEngineStop={() => {
              // Zoom to fit after initial layout
              graphRef.current?.zoomToFit?.(400, 40);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Graph visualization unavailable
          </div>
        )}
        </GraphErrorBoundary>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-40">
          <button
            onClick={() => graphRef.current?.zoom?.(graphRef.current.zoom() * 1.4, 300)}
            className="w-8 h-8 bg-[#0d1b2a]/90 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-[#f5a623]/50 flex items-center justify-center text-sm font-bold transition-colors"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => graphRef.current?.zoom?.(graphRef.current.zoom() * 0.6, 300)}
            className="w-8 h-8 bg-[#0d1b2a]/90 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-[#f5a623]/50 flex items-center justify-center text-sm font-bold transition-colors"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={() => graphRef.current?.zoomToFit?.(400, 40)}
            className="w-8 h-8 bg-[#0d1b2a]/90 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-[#f5a623]/50 flex items-center justify-center text-xs transition-colors"
            title="Reset / fit all"
          >
            &#x27F3;
          </button>
        </div>

        {/* Click tooltip / popup */}
        {selectedNode && (
          <div
            className="absolute z-50 bg-[#0d1b2a] border border-[#f5a623]/30 rounded-xl p-4 shadow-lg w-72"
            style={{
              left: Math.min(
                tooltipPos.x - (containerRef.current?.getBoundingClientRect().left ?? 0),
                dimensions.width - 290
              ),
              top: Math.min(
                tooltipPos.y - (containerRef.current?.getBoundingClientRect().top ?? 0) + 10,
                dimensions.height - 260
              ),
            }}
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-gray-700/50 text-sm transition-colors"
              aria-label="Close"
            >
              X
            </button>
            <div className="flex items-center gap-3 mb-3">
              {selectedNode.pfpUrl ? (
                <img
                  src={selectedNode.pfpUrl}
                  alt={selectedNode.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#f5a623]/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-700 ring-2 ring-gray-600" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{selectedNode.name}</p>
                <p className="text-xs text-gray-500">@{selectedNode.username}</p>
                {selectedNode.zid && (
                  <span className="inline-block mt-0.5 text-[10px] font-medium text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
                    ZID #{selectedNode.zid}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div className="bg-[#0a1628] rounded-lg py-1.5">
                <p className="font-bold text-white">{selectedNode.followerCount.toLocaleString()}</p>
                <p className="text-gray-500">Followers</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg py-1.5">
                <p className="font-bold text-green-400">{selectedNode.mutuals}</p>
                <p className="text-gray-500">Mutuals</p>
              </div>
              <div className="bg-[#0a1628] rounded-lg py-1.5">
                <p className="font-bold text-[#f5a623]">{selectedNode.engagement.toFixed(4)}</p>
                <p className="text-gray-500">Engagement</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`/members/${selectedNode.username}`}
                className="flex-1 block text-center text-xs font-medium bg-[#f5a623] text-[#0a1628] hover:bg-[#f5a623]/90 rounded-lg py-2 transition-colors"
              >
                View Profile
              </a>
              <a
                href={`https://warpcast.com/${selectedNode.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 block text-center text-xs font-medium bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 rounded-lg py-2 transition-colors"
              >
                View on Farcaster
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
