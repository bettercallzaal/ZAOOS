'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SignerApprovalProps {
  onApproved: () => void;
}

export function SignerApproval({ onApproved }: SignerApprovalProps) {
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'error'>('loading');
  const [error, setError] = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1: Create signer and get approval URL
  useEffect(() => {
    async function createSigner() {
      try {
        const res = await fetch('/api/auth/signer', { method: 'POST' });
        const data = await res.json();

        if (data.status === 'approved') {
          setStatus('approved');
          onApproved();
          return;
        }

        if (data.approvalUrl) {
          setApprovalUrl(data.approvalUrl);
          setSignerUuid(data.signerUuid);
          setStatus('pending');
        } else {
          setStatus('error');
          setError(data.error || 'Failed to create signer');
        }
      } catch {
        setStatus('error');
        setError('Connection failed');
      }
    }
    createSigner();
  }, [onApproved]);

  // Step 2: Poll for approval
  useEffect(() => {
    if (status !== 'pending' || !signerUuid) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/signer/status?signer_uuid=${signerUuid}`);
        const data = await res.json();
        if (data.status === 'approved') {
          setStatus('approved');
          if (pollRef.current) clearInterval(pollRef.current);
          onApproved();
        }
      } catch {
        // Keep polling
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, signerUuid, onApproved]);

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Setting up your signer...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-[#f5a623] hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-green-400">Signer approved! Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-semibold text-white mb-2">Approve Signer</h2>
        <p className="text-gray-400 text-sm mb-6">
          To post messages, you need to approve ZAO OS as a signer on your Farcaster account. This is a one-time step.
        </p>
        {approvalUrl && (
          <a
            href={approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            Approve in Farcaster
          </a>
        )}
        <p className="text-gray-500 text-xs mt-4">
          Waiting for approval...
        </p>
      </div>
    </div>
  );
}
