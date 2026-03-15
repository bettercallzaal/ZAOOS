'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { createSiweMessage } from 'viem/siwe';
import { useRouter } from 'next/navigation';

type Step = 'idle' | 'connecting' | 'signing' | 'verifying' | 'error';

export function WalletLoginButton() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { connectors } = useConnect();

  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signingStarted, setSigningStarted] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!address) return;

    setStep('signing');
    setError(null);

    try {
      // Get nonce from server
      const nonceRes = await fetch('/api/auth/siwe');
      const { nonce } = await nonceRes.json();

      // Create SIWE message
      const message = createSiweMessage({
        address,
        chainId: 1,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: '1',
        statement: 'Sign in to ZAO OS',
      });

      // Sign with wallet
      const signature = await signMessageAsync({ message });

      // Verify on server
      setStep('verifying');
      const verifyRes = await fetch('/api/auth/siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });

      const data = await verifyRes.json();

      if (data.redirect) {
        router.push(data.redirect);
      } else if (data.error) {
        setStep('error');
        setError(data.error);
        disconnect();
      }
    } catch (err) {
      setStep('error');
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      // User rejected signature
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Signature rejected. Try again.');
      } else {
        setError(msg);
      }
      disconnect();
    }
  }, [address, signMessageAsync, router, disconnect]);

  // When wallet connects, auto-trigger SIWE signing
  useEffect(() => {
    if (isConnected && address && !signingStarted && step === 'connecting') {
      setSigningStarted(true);
      handleSignIn();
    }
  }, [isConnected, address, signingStarted, step, handleSignIn]);

  const handleClick = () => {
    setError(null);
    setSigningStarted(false);

    if (isConnected && address) {
      // Already connected — go straight to signing
      handleSignIn();
    } else {
      // Open RainbowKit wallet picker
      setStep('connecting');
      openConnectModal?.();
    }
  };

  // Check if any injected wallet available (MetaMask, Coinbase, etc.)
  const hasInjected = connectors.some((c) => c.type === 'injected');

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={step === 'signing' || step === 'verifying'}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-base
          bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628]
          hover:from-[#ffd700] hover:to-[#f5a623] active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all duration-200 min-h-[56px]
          shadow-lg shadow-[#f5a623]/20"
      >
        {step === 'connecting' && (
          <>
            <Spinner />
            Connecting...
          </>
        )}
        {step === 'signing' && (
          <>
            <Spinner />
            Sign message in wallet...
          </>
        )}
        {step === 'verifying' && (
          <>
            <Spinner />
            Verifying...
          </>
        )}
        {(step === 'idle' || step === 'error') && (
          <>
            <WalletIcon />
            Connect Wallet
          </>
        )}
      </button>

      {/* Hint text */}
      {step === 'idle' && (
        <p className="text-xs text-gray-600 text-center mt-2">
          {hasInjected ? 'MetaMask, Coinbase, WalletConnect & more' : 'WalletConnect, Coinbase & more'}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 text-center mt-2">{error}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
  );
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008A2.25 2.25 0 0018 2.25h-1.5a6 6 0 00-6 6v.75H4.5A2.25 2.25 0 002.25 11.25v7.5A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-6.75z" />
    </svg>
  );
}
