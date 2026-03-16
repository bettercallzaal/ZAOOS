'use client';

import { useEffect, useCallback, useState } from 'react';
import Script from 'next/script';

interface SignerConnectProps {
  onSuccess: () => void;
}

declare global {
  interface Window {
    onSIWNSuccess?: (data: { signer_uuid: string; fid: string; user: Record<string, unknown> }) => void;
  }
}

export function SignerConnect({ onSuccess }: SignerConnectProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSuccess = useCallback(async (data: { signer_uuid: string; fid: string }) => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/signer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerUuid: data.signer_uuid,
          fid: parseInt(data.fid),
        }),
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => onSuccess(), 1200);
      } else {
        setStatus('error');
        setErrorMsg('Failed to save signer. Please try again.');
      }
    } catch (error) {
      console.error('Signer save error:', error);
      setStatus('error');
      setErrorMsg('Network error saving signer. Please try again.');
    }
  }, [onSuccess]);

  useEffect(() => {
    window.onSIWNSuccess = handleSuccess;
    return () => {
      delete window.onSIWNSuccess;
    };
  }, [handleSuccess]);

  return (
    <div className="flex flex-col items-center gap-2 py-3 px-4 border-t border-purple-500/40 bg-[#0d1b2a]">
      <Script
        src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setScriptError(true)}
      />

      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
        <p className="text-sm text-gray-200 font-medium">Connect write access to post on Farcaster</p>
      </div>

      {status === 'success' && (
        <p className="text-sm text-green-400 font-medium">Connected! Redirecting...</p>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}

      {status === 'saving' && (
        <p className="text-sm text-gray-300 animate-pulse">Saving signer...</p>
      )}

      {scriptError ? (
        <p className="text-sm text-red-400">Failed to load signer script. Please refresh the page.</p>
      ) : !scriptLoaded ? (
        <div className="h-10 w-48 rounded-lg bg-gray-700/50 animate-pulse" />
      ) : (
        <div>
          <div
            className="neynar_signin"
            data-client_id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
            data-success-callback="onSIWNSuccess"
            data-theme="dark"
          />
        </div>
      )}
    </div>
  );
}
