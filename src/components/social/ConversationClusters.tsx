'use client';

import { useState, useEffect } from 'react';

interface ClusterMember {
  fid: number;
  username: string;
  pfpUrl: string | null;
}

interface Cluster {
  name: string;
  channelId: string;
  members: ClusterMember[];
  size: number;
}

interface Props {
  /** When a cluster is selected, emit its member FIDs so parent can filter */
  onFilterMembers?: (fids: number[] | null) => void;
}

export function ConversationClusters({ onFilterMembers }: Props) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/social/clusters', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setClusters(data.clusters || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Failed to load clusters');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => { controller.abort(); };
  }, []);

  function handleClusterClick(cluster: Cluster) {
    if (activeCluster === cluster.channelId) {
      setActiveCluster(null);
      onFilterMembers?.(null);
    } else {
      setActiveCluster(cluster.channelId);
      onFilterMembers?.(cluster.members.map((m) => m.fid));
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 h-24 bg-[#1a2a3a] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="px-4 py-3">
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  );
  if (clusters.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
        Channel Clusters
      </p>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {clusters.map((cluster) => {
          const isActive = activeCluster === cluster.channelId;
          return (
            <button
              key={cluster.channelId}
              onClick={() => handleClusterClick(cluster)}
              className={`flex-shrink-0 rounded-xl border p-3 text-left transition-all min-w-[140px] max-w-[180px] ${
                isActive
                  ? 'bg-[#f5a623]/10 border-[#f5a623]/40'
                  : 'bg-[#0d1b2a] border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium truncate ${isActive ? 'text-[#f5a623]' : 'text-white'}`}>
                  {cluster.name}
                </span>
                <span className="text-[10px] text-gray-500 ml-1.5">
                  {cluster.size}
                </span>
              </div>

              {/* Avatar row */}
              <div className="flex -space-x-2">
                {cluster.members.slice(0, 6).map((m) => (
                  <div
                    key={m.fid}
                    className="w-6 h-6 rounded-full border-2 border-[#0d1b2a] overflow-hidden bg-gray-700 flex-shrink-0"
                  >
                    {m.pfpUrl ? (
                      <img
                        src={m.pfpUrl}
                        alt={m.username}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600" />
                    )}
                  </div>
                ))}
                {cluster.size > 6 && (
                  <div className="w-6 h-6 rounded-full border-2 border-[#0d1b2a] bg-[#1a2a3a] flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-gray-400">+{cluster.size - 6}</span>
                  </div>
                )}
              </div>

              {/* Channel tag */}
              <p className="text-[9px] text-gray-600 mt-1.5 truncate">
                /{cluster.channelId}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ConversationClusters;
