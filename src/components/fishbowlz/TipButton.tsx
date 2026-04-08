'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const TIP_AMOUNTS = [
  { label: '0.001', value: '0.001', emoji: '☕' },
  { label: '0.005', value: '0.005', emoji: '🔥' },
  { label: '0.01', value: '0.01', emoji: '💎' },
];

interface TipButtonProps {
  speakerFid: number;
  speakerUsername: string;
  roomId: string;
}

export function TipButton({ speakerFid, speakerUsername, roomId }: TipButtonProps) {
  const { user } = useAuth();
  const [showAmounts, setShowAmounts] = useState(false);
  const [tipped, setTipped] = useState(false);
  const [sending, setSending] = useState(false);

  const sendTip = async (amount: string) => {
    if (!user || sending) return;
    setSending(true);
    try {
      // Log tip event to Supabase (wallet transfer will be added when Privy wallets are wired)
      await fetch('/api/fishbowlz/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'tip.sent',
          eventData: {
            fromFid: user.fid,
            fromUsername: user.username,
            toFid: speakerFid,
            toUsername: speakerUsername,
            amount,
            currency: 'ETH',
            roomId,
          },
          roomId,
          actorFid: user.fid,
          actorType: 'human',
        }),
      });
      setTipped(true);
      setShowAmounts(false);
      setTimeout(() => setTipped(false), 3000);
    } finally {
      setSending(false);
    }
  };

  if (!user || user.fid === speakerFid) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowAmounts(!showAmounts)}
        className={`text-xs px-2 py-1 min-h-[32px] rounded transition-colors ${
          tipped
            ? 'text-green-400'
            : 'text-gray-500 hover:text-[#f5a623]'
        }`}
        aria-label={tipped ? `Tipped ${speakerUsername}` : `Tip ${speakerUsername}`}
        title={`Tip @${speakerUsername}`}
      >
        {tipped ? '✓ Tipped' : '💰 Tip'}
      </button>

      {showAmounts && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowAmounts(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 bg-[#1a2a4a] border border-white/10 rounded-lg p-2 shadow-xl">
            <div className="flex gap-1">
              {TIP_AMOUNTS.map((tip) => (
                <button
                  key={tip.value}
                  onClick={() => sendTip(tip.value)}
                  disabled={sending}
                  className="flex flex-col items-center px-2 py-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm">{tip.emoji}</span>
                  <span className="text-[9px] text-gray-400">{tip.label} ETH</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
