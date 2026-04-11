'use client';

import { useState, useEffect } from 'react';
import { matchInterest, QUICK_OPTIONS, CONCIERGE_PROMPTS } from '@/lib/portal/routing';

interface PortalConciergeProps {
  onRecommend: (portalId: string) => void;
}

export function PortalConcierge({ onRecommend }: PortalConciergeProps) {
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has a stored preference
    const stored = localStorage.getItem('zao-portal-preference');
    if (stored) {
      setHasInteracted(true);
    }

    // Show concierge after 2 seconds
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickPick = (value: string) => {
    setHasInteracted(true);
    localStorage.setItem('zao-portal-preference', value);

    const match = matchInterest(value);
    if (match) {
      setMessage(`Head to the ${match.title} portal!`);
      onRecommend(match.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setHasInteracted(true);
    const match = matchInterest(input);
    if (match) {
      setMessage(`Sounds like ${match.title} is your vibe!`);
      onRecommend(match.id);
      localStorage.setItem('zao-portal-preference', match.id);
    } else {
      setMessage("Try checking out MUSIC or SOCIAL to start!");
      onRecommend('music');
    }
    setInput('');
  };

  if (!visible) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-[#0d1b2a] border border-[#f5a623]/30 flex items-center justify-center shadow-lg shadow-[#f5a623]/10 hover:border-[#f5a623]/50 transition-colors"
        aria-label="Open concierge"
      >
        <span className="text-xl">🤖</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-30 w-72 concierge-bubble">
      <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <span className="text-sm font-medium text-white">ZOE</span>
              <span className="text-[10px] text-gray-500 ml-1.5">concierge</span>
            </div>
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Minimize"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
        </div>

        {/* Chat body */}
        <div className="px-4 py-3">
          {/* ZOE's prompt */}
          <p className="text-sm text-gray-300 mb-3">
            {message || CONCIERGE_PROMPTS[0]}
          </p>

          {/* Quick pick buttons */}
          {!hasInteracted && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleQuickPick(opt.value)}
                  className="px-2.5 py-1 rounded-full text-xs bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-[#f5a623]/10 hover:border-[#f5a623]/30 hover:text-[#f5a623] transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Text input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Or tell me what you're into..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-sm hover:bg-[#f5a623]/20 transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
