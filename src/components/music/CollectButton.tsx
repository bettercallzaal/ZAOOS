'use client';

import { useState } from 'react';

interface CollectButtonProps {
  assetTxId: string;
  collectedCount: number;
  bazarUrl: string;
  compact?: boolean;
}

export default function CollectButton({ assetTxId, collectedCount, bazarUrl, compact }: CollectButtonProps) {
  const [collected, setCollected] = useState(false);
  const [count, setCount] = useState(collectedCount);
  const [collecting, setCollecting] = useState(false);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/music/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetTxId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollected(true);
        setCount(data.collectedCount);
      }
    } finally {
      setCollecting(false);
    }
  };

  if (collected) {
    return (
      <a
        href={bazarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 transition-colors hover:bg-green-500/20 ${
          compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <span>Collected</span>
        <span className="opacity-60">{count}</span>
      </a>
    );
  }

  return (
    <button
      onClick={handleCollect}
      disabled={collecting}
      className={`inline-flex items-center gap-1 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623] transition-colors hover:bg-[#f5a623]/20 disabled:opacity-50 ${
        compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
      }`}
    >
      <span>{collecting ? '...' : 'Collect'}</span>
      {count > 0 && <span className="opacity-60">{count}</span>}
    </button>
  );
}
