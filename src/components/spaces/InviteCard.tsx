'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface InviteCardProps {
  /** Room title shown in the headline and pre-filled into the cast text. */
  roomTitle: string;
  /** Fully-qualified room URL (https://zaoos.com/spaces/…). */
  roomUrl: string;
  /** When true, the card is small enough to sit as a panel inside the room. */
  compact?: boolean;
}

/**
 * Shown to the host (and any solo participant) when a Video Room has no
 * other people yet. Three primary actions: copy the link, cast it to /zao,
 * scan a QR with a phone. The card hides itself once others join.
 *
 * Renders nothing if SSR — the room URL is built client-side from
 * `window.location` to avoid leaking dev hostnames into the deployed bundle.
 */
export function InviteCard({ roomTitle, roomUrl, compact = false }: InviteCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
    } catch {
      /* clipboard may be blocked - the user can still copy from the input below */
    }
  };

  const castText = encodeURIComponent(`Live in a ZAO Video Room: ${roomTitle}\n\nCome through, mic + cam + screen share are open.`);
  const castUrl = `https://warpcast.com/~/compose?text=${castText}&embeds[]=${encodeURIComponent(roomUrl)}&channelKey=zao`;

  const xText = encodeURIComponent(`Live in a ZAO Video Room: ${roomTitle}\n\nJoin: ${roomUrl}`);
  const xUrl = `https://twitter.com/intent/tweet?text=${xText}`;

  return (
    <div
      className={`bg-[#0d1b2a] border border-white/[0.08] rounded-2xl ${
        compact ? 'p-4' : 'p-6 sm:p-8'
      } w-full max-w-md mx-auto`}
    >
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] text-xs font-semibold tracking-wider uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse" />
          Live - waiting for people
        </div>
        <h2 className={`text-white font-bold ${compact ? 'text-base' : 'text-lg sm:text-xl'} mb-1`}>
          Invite people in
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
          The room is open. Share the link or scan the code to bring others.
        </p>
      </div>

      {/* Copy link */}
      <div className="flex items-center gap-2 bg-[#0a1628] border border-white/[0.08] rounded-xl px-3 py-2 mb-3">
        <input
          type="text"
          readOnly
          value={roomUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 bg-transparent text-gray-300 text-xs sm:text-sm font-mono truncate focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
            copied
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628]'
          }`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <a
          href={castUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#855dcd]/40 bg-[#855dcd]/10 text-[#a78bfa] text-xs sm:text-sm font-semibold hover:bg-[#855dcd]/20 transition-colors"
        >
          Cast to /zao
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.12] bg-[#1a2a3a] text-gray-300 text-xs sm:text-sm font-semibold hover:bg-[#22364a] transition-colors"
        >
          Post on X
        </a>
      </div>

      {/* QR */}
      {!compact && (
        <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/[0.06]">
          <div className="p-3 rounded-xl bg-white">
            <QRCodeSVG
              value={roomUrl}
              size={132}
              level="M"
              marginSize={0}
              fgColor="#0a1628"
              bgColor="#ffffff"
            />
          </div>
          <span className="text-gray-500 text-xs">Scan with your phone to join</span>
        </div>
      )}
    </div>
  );
}
