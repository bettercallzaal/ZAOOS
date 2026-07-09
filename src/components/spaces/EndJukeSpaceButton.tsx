'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EndJukeSpaceButtonProps {
  spaceId: string;
}

type EndState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'ending' }
  | { status: 'ended'; via: 'juke' | 'fallback' }
  | { status: 'error'; message: string };

/**
 * Host/admin-only "End space" button. Calls `/api/juke/admin/end-space` which
 * proxies to Juke's developer end endpoint (PR #174 on their side). If Juke
 * 404s the endpoint (not shipped yet), our server falls back to a local
 * mark-ended write so /spaces stops showing the row as Live.
 *
 * Rendering is gated by the server (we only render this for session.fid
 * matching `created_by_fid`, or admin). We do not re-check that here - the
 * server endpoint enforces it again with a 403.
 *
 * Two-step confirm pattern (single button morphs into "Confirm? / Cancel")
 * prevents fat-finger ends mid-broadcast.
 */
export function EndJukeSpaceButton({ spaceId }: EndJukeSpaceButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<EndState>({ status: 'idle' });

  async function doEnd() {
    setState({ status: 'ending' });
    try {
      const res = await fetch('/api/juke/admin/end-space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fallback?: string;
      };
      if (!res.ok && !body.ok) {
        setState({
          status: 'error',
          message: body.error ?? `End-space failed (${res.status})`,
        });
        return;
      }
      const via = body.fallback === 'mark-ended' ? 'fallback' : 'juke';
      setState({ status: 'ended', via });
      // Refresh the SSR page so the iframe collapses into the "ended" view.
      // 800ms grace lets the toast read first.
      setTimeout(() => router.refresh(), 800);
    } catch (err: unknown) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  if (state.status === 'ended') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300">
        Space ended{state.via === 'fallback' ? ' (local-only - Juke endpoint not shipped yet)' : ''}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          {state.message}
        </div>
        <button
          type="button"
          onClick={() => setState({ status: 'idle' })}
          className="text-[11px] text-gray-400 underline hover:text-gray-200"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state.status === 'confirming') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300">End the space for everyone?</span>
        <button
          type="button"
          onClick={doEnd}
          className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/25"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setState({ status: 'idle' })}
          className="rounded-xl border border-white/[0.12] bg-[#1a2a3a] px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:bg-[#22364a]"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (state.status === 'ending') {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#1a2a3a] px-4 py-2.5 text-xs font-semibold text-gray-400">
        Ending space...
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState({ status: 'confirming' })}
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
    >
      End space (host)
    </button>
  );
}
