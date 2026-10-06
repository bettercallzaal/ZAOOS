'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SignerConnectProps {
  onSuccess: () => void;
  compact?: boolean;
}

type SignerState = 'idle' | 'creating' | 'pending_approval' | 'approved' | 'error';

export function SignerConnect({ onSuccess, compact = false }: SignerConnectProps) {
  const [state, setState] = useState<SignerState>('idle');
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [_signerUuid, setSignerUuid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupPolling;
  }, [cleanupPolling]);

  // Start polling signer approval status
  const startPolling = useCallback(
    (uuid: string) => {
      cleanupPolling();
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/auth/signer/status?signer_uuid=${encodeURIComponent(uuid)}`,
          );
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === 'approved') {
            cleanupPolling();
            setState('approved');
            setTimeout(() => {
              onSuccess();
            }, 1000);
          }
        } catch (err) {
          console.error('[SignerConnect] poll error:', err);
        }
      }, 2000);
    },
    [cleanupPolling, onSuccess],
  );

  const handleCreateSigner = async () => {
    setState('creating');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/signer', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create signer');
      }

      if (data.status === 'approved') {
        // Signer was already approved
        setState('approved');
        setTimeout(() => onSuccess(), 800);
        return;
      }

      if (data.signerUuid && data.approvalUrl) {
        setSignerUuid(data.signerUuid);
        setApprovalUrl(data.approvalUrl);
        setState('pending_approval');
        startPolling(data.signerUuid);
      } else {
        throw new Error('Missing signer approval URL from server');
      }
    } catch (err) {
      cleanupPolling();
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not initialize signer');
    }
  };

  const handleCancel = () => {
    cleanupPolling();
    setState('idle');
    setApprovalUrl(null);
    setSignerUuid(null);
    setErrorMsg(null);
  };

  if (state === 'approved') {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
        <svg
          aria-hidden="true"
          className="w-4 h-4 text-green-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span>Farcaster signer connected! Unlocking posting...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-3 py-3 px-4 border-t border-purple-500/30 bg-[#0d1b2a] ${compact ? 'text-xs' : 'text-sm'}`}
    >
      {state === 'idle' && (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-gray-300">
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-purple-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
            <span className="font-medium">
              Connect Farcaster Signer to post casts and messages directly
            </span>
          </div>

          <button
            type="button"
            onClick={handleCreateSigner}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shrink-0 shadow-sm"
          >
            Authorize Posting
          </button>
        </div>
      )}

      {state === 'creating' && (
        <div className="flex items-center gap-2 text-purple-300 py-1">
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Generating Farcaster signer request...</span>
        </div>
      )}

      {state === 'pending_approval' && approvalUrl && (
        <div className="w-full flex flex-col items-center gap-3 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
          <div className="text-center">
            <p className="font-semibold text-white">Approve Posting on Farcaster</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Scan with your phone camera or click below to open Warpcast and authorize this signer.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg shadow-md">
            <QRCodeSVG
              value={approvalUrl}
              size={140}
              bgColor="#ffffff"
              fgColor="#0a1628"
              level="M"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full max-w-xs justify-center">
            <a
              href={approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow"
            >
              Open Warpcast App
            </a>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-purple-300">
            <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span>Waiting for approval in Warpcast...</span>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <span>{errorMsg || 'Failed to initialize signer.'}</span>
          <button
            type="button"
            onClick={handleCreateSigner}
            className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
