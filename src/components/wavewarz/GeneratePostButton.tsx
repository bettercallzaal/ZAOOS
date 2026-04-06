'use client';

import { useState } from 'react';

interface RandomStatResponse {
  title: string;
  publish_text: string;
  stat_type: string;
}

export function GeneratePostButton() {
  const [stat, setStat] = useState<RandomStatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function generateStat() {
    setLoading(true);
    setError(null);
    setStat(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/wavewarz/random-stat');
      if (!res.ok) throw new Error('No stats available');
      const data = await res.json();
      setStat(data);
    } catch {
      setError('Could not generate stat. Try syncing data first.');
    } finally {
      setLoading(false);
    }
  }

  async function createProposal() {
    if (!stat) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: stat.title,
          description: `Generated WaveWarZ stat. Vote to publish to the /wavewarz Farcaster channel.`,
          category: 'wavewarz',
          publish_text: stat.publish_text,
          respect_threshold: 1000,
        }),
      });
      if (!res.ok) throw new Error('Failed to create proposal');
      setSuccess(true);
      setStat(null);
    } catch {
      setError('Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={generateStat}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate WaveWarZ Post'}
      </button>

      {stat && (
        <div className="mt-3 p-3 bg-[#0d1b2a] rounded-xl border border-white/[0.08]">
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          <p className="text-sm text-white font-medium mb-1">{stat.title}</p>
          <p className="text-xs text-gray-300 whitespace-pre-wrap">{stat.publish_text}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={createProposal}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f5a623] text-black hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Proposal'}
            </button>
            <button
              onClick={generateStat}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Try Another
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {success && <p className="mt-2 text-xs text-emerald-400">Proposal created! Check the governance tab.</p>}
    </div>
  );
}
