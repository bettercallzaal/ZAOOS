'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { communityConfig } from '@/../community.config';

/* ── Helpers ───────────────────────────────────────────────────── */

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SPACE = communityConfig.snapshot.space;
const FALLBACK_CHOICES = [...communityConfig.snapshot.weeklyPollChoices];
const HUB = communityConfig.snapshot.hub;

/* ── Component ─────────────────────────────────────────────────── */

export function CreateWeeklyPoll({ isAdmin }: { isAdmin: boolean }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [showPreview, setShowPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [choices, setChoices] = useState<string[]>(FALLBACK_CHOICES);
  const [durationDays, setDurationDays] = useState(7);

  // Fetch poll config from DB (admin-managed choices)
  useEffect(() => {
    fetch('/api/admin/poll-config')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.choices && Array.isArray(data.choices) && data.choices.length >= 2) {
          setChoices(data.choices);
        }
        if (data.votingDurationDays) {
          setDurationDays(data.votingDurationDays);
        }
        // Apply title/body templates if present
        if (data.pollTitleTemplate) {
          const dateStr = formatDateShort(getNextMonday());
          setTitle(data.pollTitleTemplate.replace('{date}', dateStr));
        }
        if (data.pollBodyTemplate) {
          setBody(data.pollBodyTemplate);
        }
      })
      .catch(() => {
        // Silently fall back to community.config.ts defaults
      });
  }, []);

  // Editable fields
  const nextMonday = useMemo(() => getNextMonday(), []);
  const defaultTitle = `ZAO Weekly Priority Vote — Week of ${formatDateShort(nextMonday)}`;
  const defaultBody = `Vote on what ZAO should prioritize this week. This is an approval vote — select ALL choices you support. The top priorities will guide community efforts.\n\nVoting is gasless via Snapshot. Results are advisory and inform the weekly fractal meeting.`;

  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);

  if (!isAdmin) return null;

  const startTime = nextMonday;
  const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const proposalJson = {
    space: SPACE,
    type: 'approval',
    title,
    body,
    choices: [...choices],
    start: Math.floor(startTime.getTime() / 1000),
    end: Math.floor(endTime.getTime() / 1000),
  };

  const handleCopyAndOpen = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(proposalJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      window.open(`https://snapshot.box/#/s:${SPACE}/create`, '_blank');
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCreateWithWallet = async () => {
    if (!walletClient || !address) {
      setError('Connect your wallet first');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Dynamic import to keep bundle size down and avoid SSR issues
      const snapshotJs = await import('@snapshot-labs/snapshot.js');
      const client = new snapshotJs.default.Client712(HUB);

      // snapshot.js Client712.proposal() expects an ethers-like signer object.
      // viem's walletClient can be adapted with a minimal shim.
      const ethersLikeSigner = {
        getAddress: async () => address,
        _signTypedData: async (domain: Record<string, unknown>, types: Record<string, unknown[]>, value: Record<string, unknown>) => {
          return walletClient.signTypedData({
            account: address,
            domain: domain as Record<string, unknown>,
            types: types as Record<string, unknown[]>,
            primaryType: Object.keys(types).find(k => k !== 'EIP712Domain') ?? 'Proposal',
            message: value,
          } as Parameters<typeof walletClient.signTypedData>[0]);
        },
      };

      // Get a recent block number for the snapshot
      const blockNumber = await walletClient.request({ method: 'eth_blockNumber' } as { method: 'eth_blockNumber' });

      const receipt = await (client as { proposal: (...args: unknown[]) => Promise<{ id: string }> }).proposal(
        ethersLikeSigner,
        address,
        {
          space: SPACE,
          type: 'approval',
          title,
          body,
          choices: [...choices],
          start: Math.floor(startTime.getTime() / 1000),
          end: Math.floor(endTime.getTime() / 1000),
          snapshot: parseInt(blockNumber as string, 16),
          plugins: JSON.stringify({}),
          app: 'zao-os',
          discussion: '',
        }
      );

      setSuccess(`Poll created! ID: ${receipt.id}`);
      setShowPreview(false);
    } catch (err) {
      console.error('[CreateWeeklyPoll] Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to create poll';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      {!showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-[#f5a623]/10 border border-[#f5a623]/30 hover:bg-[#f5a623]/20 text-[#f5a623] text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create This Week&apos;s Poll
        </button>
      )}

      {/* Preview + create */}
      {showPreview && (
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-[#f5a623]/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#f5a623]">Weekly Poll Preview</h3>
            <button
              onClick={() => { setShowPreview(false); setError(null); setSuccess(null); }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>

          {/* Editable title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
          />

          {/* Editable body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none resize-none"
          />

          {/* Choices preview */}
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Choices ({choices.length})</p>
            <div className="grid gap-1">
              {choices.map((choice, i) => (
                <div key={i} className="text-xs text-gray-400 bg-[#0a1628] rounded-lg px-3 py-1.5 border border-gray-800">
                  {choice}
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>Start: {formatDateShort(startTime)}</span>
            <span>&rarr;</span>
            <span>End: {formatDateShort(endTime)}</span>
            <span className="text-gray-600">({durationDays} days)</span>
          </div>

          {/* Error / Success */}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && (
            <p className="text-xs text-green-400">{success}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {isConnected && walletClient ? (
              <button
                onClick={handleCreateWithWallet}
                disabled={creating || !title.trim()}
                className="flex-1 bg-[#f5a623] text-black rounded-lg py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-[#ffd700] transition-colors"
              >
                {creating ? 'Creating...' : 'Create on Snapshot'}
              </button>
            ) : (
              <p className="flex-1 text-xs text-gray-500 self-center">
                Connect wallet to create directly
              </p>
            )}
            <button
              onClick={handleCopyAndOpen}
              className="px-4 bg-gray-800 text-gray-300 rounded-lg py-2.5 text-sm hover:text-white transition-colors border border-gray-700"
            >
              {copied ? 'Copied!' : 'Copy & Open Snapshot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
