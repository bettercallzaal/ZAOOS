'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface SignerConnectProps {
  onSuccess: () => void;
}

declare global {
  interface Window {
    onSIWNSuccess?: (data: { signer_uuid: string; fid: string; user: Record<string, unknown> }) => void;
  }
}

const SIWN_SCRIPT_URL = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js';

export function SignerConnect({ onSuccess }: SignerConnectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Load the Neynar SIWN script AFTER the div is in the DOM
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // If script was already loaded globally, re-inject it to re-scan the DOM
    const existingScript = document.querySelector(`script[src="${SIWN_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = SIWN_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      // Script loaded and scanned the DOM — the div is already present
    };
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 py-3 px-4 border-t border-purple-500/40 bg-[#0d1b2a]">
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
        <p className="text-sm text-gray-200 font-medium">Give Access to posting using ZAO OS with Neynar (Optional)</p>
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
      ) : (
        <div ref={containerRef}>
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
