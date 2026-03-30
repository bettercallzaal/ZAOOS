'use client';

import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { base } from 'viem/chains';

interface TipButtonProps {
  recipientAddress: string;
  recipientName: string;
  roomId?: string;
}

const PRESETS = [
  { label: '0.001 ETH', value: '0.001' },
  { label: '0.005 ETH', value: '0.005' },
  { label: '0.01 ETH', value: '0.01' },
];

export function TipButton({ recipientAddress, recipientName, roomId }: TipButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [logged, setLogged] = useState(false);

  const { sendTransaction, data: txHash, isPending, error, reset } = useSendTransaction();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleSend = (val: string) => {
    setAmount(val);
    setLogged(false);
    reset();
    sendTransaction({
      to: recipientAddress as `0x${string}`,
      value: parseEther(val),
      chainId: base.id,
    });
  };

  // Fire-and-forget tip log — run in useEffect to avoid setState during render
  useEffect(() => {
    if (isSuccess && txHash && !logged) {
      setLogged(true);
      fetch('/api/spaces/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          amount,
          txHash,
          chain: 'base',
        }),
      }).catch(() => {});
    }
  }, [isSuccess, txHash, logged, roomId, amount]);

  const handleClose = () => {
    setOpen(false);
    setAmount('');
    setCustomMode(false);
    reset();
    setLogged(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors"
        title={`Tip ${recipientName}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1b2a] border border-gray-800 rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm">
                Tip {recipientName}
              </h3>
              <button
                onClick={handleClose}
                className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-400 text-xs mb-4">
              Send ETH on Base to{' '}
              <span className="text-gray-300 font-mono text-[11px]">
                {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
              </span>
            </p>

            {/* Status messages */}
            {isPending && (
              <div className="flex items-center gap-2 text-[#f5a623] text-xs mb-3 bg-[#f5a623]/10 px-3 py-2 rounded-lg">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirm in your wallet...
              </div>
            )}
            {confirming && (
              <div className="flex items-center gap-2 text-blue-400 text-xs mb-3 bg-blue-500/10 px-3 py-2 rounded-lg">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirming on Base...
              </div>
            )}
            {isSuccess && (
              <div className="flex items-center gap-2 text-green-400 text-xs mb-3 bg-green-500/10 px-3 py-2 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tip sent! {amount} ETH
              </div>
            )}
            {error && (
              <div className="text-red-400 text-xs mb-3 bg-red-500/10 px-3 py-2 rounded-lg">
                {error.message?.includes('rejected') ? 'Transaction rejected' : 'Transaction failed'}
              </div>
            )}

            {/* Preset amounts */}
            {!isSuccess && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => handleSend(p.value)}
                      disabled={isPending || confirming}
                      className="px-3 py-2.5 bg-[#0a1628] border border-gray-700 rounded-xl text-white text-xs font-medium hover:border-[#f5a623] hover:text-[#f5a623] transition-colors disabled:opacity-40"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {!customMode ? (
                  <button
                    onClick={() => setCustomMode(true)}
                    className="w-full text-center text-gray-500 text-xs hover:text-gray-300 transition-colors py-1"
                  >
                    Custom amount
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0.0001"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-[#0a1628] border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:border-[#f5a623] focus:outline-none"
                    />
                    <button
                      onClick={() => amount && handleSend(amount)}
                      disabled={!amount || isPending || confirming}
                      className="px-4 py-2 bg-[#f5a623] text-[#0a1628] rounded-xl text-xs font-bold hover:bg-[#ffd700] transition-colors disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
