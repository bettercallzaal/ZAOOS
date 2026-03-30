'use client';

import { useState, useEffect } from 'react';

interface PublishLogRef {
  cast_hash: string | null;
  platform_url: string | null;
  text: string | null;
  published_by_fid: number | null;
  created_at: string | null;
}

interface MetricRow {
  id: string;
  publish_log_id: string;
  platform: string;
  platform_post_id: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  clicks: number;
  fetched_at: string;
  publish_log: PublishLogRef | null;
}

interface AggregateStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalReplies: number;
  totalReposts: number;
  avgEngagement: number;
}

function computeStats(metrics: MetricRow[]): AggregateStats {
  // Dedupe by platform_post_id — keep latest snapshot per post
  const latest = new Map<string, MetricRow>();
  for (const m of metrics) {
    const existing = latest.get(m.platform_post_id);
    if (!existing || new Date(m.fetched_at) > new Date(existing.fetched_at)) {
      latest.set(m.platform_post_id, m);
    }
  }

  const posts = Array.from(latest.values());
  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalReplies = posts.reduce((s, p) => s + p.replies, 0);
  const totalReposts = posts.reduce((s, p) => s + p.reposts, 0);
  const totalEngagement = totalLikes + totalReplies + totalReposts;
  const avgEngagement = posts.length > 0
    ? Math.round((totalEngagement / posts.length) * 10) / 10
    : 0;

  return {
    totalPosts: posts.length,
    totalViews,
    totalLikes,
    totalReplies,
    totalReposts,
    avgEngagement,
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function truncateText(text: string | null, max = 60): string {
  if (!text) return '-';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export function EngagementOverview() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collecting, setCollecting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/publish/engagement?platform=threads&limit=100');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMetrics(data.metrics || []);
      setError('');
    } catch {
      setError('Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCollect() {
    setCollecting(true);
    try {
      const res = await fetch('/api/cron/engagement-collect');
      if (!res.ok) throw new Error('Collection failed');
      const data = await res.json();
      alert(`Collected metrics for ${data.collected}/${data.total} posts`);
      await load();
    } catch {
      alert('Failed to collect engagement metrics');
    } finally {
      setCollecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        Loading engagement data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-red-400">
        {error}
      </div>
    );
  }

  const stats = computeStats(metrics);

  // Dedupe for table display — latest snapshot per post
  const latestMap = new Map<string, MetricRow>();
  for (const m of metrics) {
    const existing = latestMap.get(m.platform_post_id);
    if (!existing || new Date(m.fetched_at) > new Date(existing.fetched_at)) {
      latestMap.set(m.platform_post_id, m);
    }
  }
  const tableRows = Array.from(latestMap.values()).sort(
    (a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Threads Engagement
        </h2>
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="text-sm bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {collecting ? 'Collecting...' : 'Refresh Metrics'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Posts', value: formatNumber(stats.totalPosts) },
          { label: 'Views', value: formatNumber(stats.totalViews) },
          { label: 'Likes', value: formatNumber(stats.totalLikes) },
          { label: 'Replies', value: formatNumber(stats.totalReplies) },
          { label: 'Reposts', value: formatNumber(stats.totalReposts) },
          { label: 'Avg Engagement', value: stats.avgEngagement.toString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0d1f3c] border border-gray-800 rounded-lg p-3 text-center"
          >
            <div className="text-xl font-bold text-[#f5a623]">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {tableRows.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No engagement data yet. Click &quot;Refresh Metrics&quot; to collect from Threads.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="py-2 pr-3">Post</th>
                <th className="py-2 px-3 text-right">Views</th>
                <th className="py-2 px-3 text-right">Likes</th>
                <th className="py-2 px-3 text-right">Replies</th>
                <th className="py-2 px-3 text-right">Reposts</th>
                <th className="py-2 px-3 text-right">Quotes</th>
                <th className="py-2 pl-3 text-right">Fetched</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.platform_post_id}
                  className="border-b border-gray-800/50 hover:bg-[#0d1f3c]/50"
                >
                  <td className="py-2 pr-3">
                    {row.publish_log?.platform_url ? (
                      <a
                        href={row.publish_log.platform_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f5a623] hover:underline"
                      >
                        {truncateText(row.publish_log.text)}
                      </a>
                    ) : (
                      <span className="text-gray-300">
                        {truncateText(row.platform_post_id, 20)}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">
                    {formatNumber(row.views)}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">
                    {formatNumber(row.likes)}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">
                    {formatNumber(row.replies)}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">
                    {formatNumber(row.reposts)}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300">
                    {formatNumber(row.quotes)}
                  </td>
                  <td className="py-2 pl-3 text-right text-gray-400 text-xs">
                    {new Date(row.fetched_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
