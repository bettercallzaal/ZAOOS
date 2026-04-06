'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  url: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ url, title, description, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToFarcaster = () => {
    const text = encodeURIComponent(title);
    const embed = encodeURIComponent(url);
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${embed}`, '_blank');
  };

  const shareToX = () => {
    const text = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: description || title, url });
    } catch {
      // User cancelled or not supported
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#1a2a4a] rounded-t-xl sm:rounded-xl p-5 w-full sm:max-w-sm border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Share</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Native share — mobile primary */}
        {canNativeShare && (
          <button
            onClick={nativeShare}
            className="w-full bg-[#f5a623] text-[#0a1628] font-semibold py-3 rounded-lg hover:bg-[#d4941f] transition-colors mb-3 min-h-[44px]"
          >
            📤 Share...
          </button>
        )}

        {/* Share options grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={shareToFarcaster}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>🟣</span>
            <span>Farcaster</span>
          </button>

          <button
            onClick={shareToX}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>𝕏</span>
            <span>Post to X</span>
          </button>

          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>📱</span>
            <span>QR Code</span>
          </button>
        </div>

        {/* QR Code — shown on toggle */}
        {showQR && (
          <div className="mt-3 flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={url} size={180} />
          </div>
        )}
      </div>
    </div>
  );
}
