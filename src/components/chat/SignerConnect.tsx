'use client';

import { useEffect, useCallback } from 'react';
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
  const handleSuccess = useCallback(async (data: { signer_uuid: string; fid: string }) => {
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
        onSuccess();
      } else {
        console.error('Failed to save signer');
      }
    } catch (error) {
      console.error('Signer save error:', error);
    }
  }, [onSuccess]);

  useEffect(() => {
    window.onSIWNSuccess = handleSuccess;
    return () => {
      delete window.onSIWNSuccess;
    };
  }, [handleSuccess]);

  return (
    <div className="flex flex-col items-center gap-2 py-3 px-4 border-t border-gray-800 bg-[#0d1b2a]">
      <Script
        src="https://neynarxyz.github.io/siwn/raw/1.2.0/index.js"
        strategy="lazyOnload"
      />
      <p className="text-xs text-gray-400">Connect write access to post directly</p>
      <div>
        <div
          className="neynar_signin"
          data-client_id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
          data-success-callback="onSIWNSuccess"
          data-theme="dark"
        />
      </div>
    </div>
  );
}
