"use client";

import { useCallback, useEffect, useState } from "react";

interface ModerationItem {
  id: string;
  cast_hash: string;
  fid: number;
  text_preview: string | null;
  flagged: boolean;
  categories: string[];
  scores: Record<string, number>;
  action: string;
  created_at: string;
}

const SCORE_COLORS: Record<string, { bg: string; fill: string }> = {
  TOXICITY: { bg: "bg-yellow-900/30", fill: "bg-yellow-500" },
  SEVERE_TOXICITY: { bg: "bg-red-900/30", fill: "bg-red-500" },
  IDENTITY_ATTACK: { bg: "bg-purple-900/30", fill: "bg-purple-500" },
  INSULT: { bg: "bg-orange-900/30", fill: "bg-orange-500" },
  THREAT: { bg: "bg-rose-900/30", fill: "bg-rose-500" },
};

function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const colors = SCORE_COLORS[label] ?? {
    bg: "bg-gray-700",
    fill: "bg-gray-400",
  };
  const pct = Math.round(score * 100);
  const isHigh = score > 0.8;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 truncate text-gray-400">
        {label.replace(/_/g, " ")}
      </span>
      <div className={`h-2 flex-1 rounded-full ${colors.bg}`}>
        <div
          className={`h-2 rounded-full transition-all ${colors.fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-10 text-right font-mono ${
          isHigh ? "text-red-400 font-bold" : "text-gray-500"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function ModerationQueue() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/moderation/queue");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to fetch"
        );
      }
      const data = (await res.json()) as { items: ModerationItem[] };
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleReview = async (id: string, action: "allow" | "hide") => {
    setReviewing(id);
    try {
      const res = await fetch("/api/moderation/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Review failed"
        );
      }

      // Remove reviewed item from list
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setReviewing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        Loading moderation queue...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Moderation Queue
          {items.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
              {items.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => {
            setLoading(true);
            fetchQueue();
          }}
          className="rounded-lg bg-[#1a2a3a] px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-[#243a4f]"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {items.length === 0 && !error && (
        <div className="rounded-lg bg-[#0d1b2a] p-8 text-center text-gray-500">
          No flagged messages pending review.
        </div>
      )}

      {/* Queue items */}
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-red-500/20 bg-[#0d1b2a] p-4 space-y-3"
        >
          {/* Meta */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>FID: {item.fid}</span>
                <span className="text-gray-700">|</span>
                <span>
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-200 break-words">
                {item.text_preview || "[no text]"}
              </p>
            </div>
          </div>

          {/* Flagged categories */}
          {item.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400"
                >
                  {cat.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {/* Score bars */}
          <div className="space-y-1.5">
            {Object.entries(item.scores).map(([label, score]) => (
              <ScoreBar key={label} label={label} score={score} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleReview(item.id, "allow")}
              disabled={reviewing === item.id}
              className="rounded-lg bg-green-600/20 px-4 py-1.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30 disabled:opacity-50"
            >
              {reviewing === item.id ? "..." : "Allow"}
            </button>
            <button
              onClick={() => handleReview(item.id, "hide")}
              disabled={reviewing === item.id}
              className="rounded-lg bg-red-600/20 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
            >
              {reviewing === item.id ? "..." : "Hide"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
