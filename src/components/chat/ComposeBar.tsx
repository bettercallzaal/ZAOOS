'use client';

import { useState } from 'react';

export function ComposeBar() {
  const [text, setText] = useState('');

  const openCompose = () => {
    const encoded = encodeURIComponent(text.trim());
    const url = `https://warpcast.com/~/compose?text=${encoded}&channelKey=zao`;
    window.open(url, '_blank');
    setText('');
  };

  return (
    <div className="border-t border-gray-800 p-3 bg-[#0d1b2a]">
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) openCompose();
            }
          }}
          placeholder="Type a message, post via Farcaster..."
          rows={1}
          maxLength={1024}
          className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-4 py-2.5 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
        />
        <button
          onClick={openCompose}
          disabled={!text.trim()}
          className="bg-[#f5a623] text-[#0a1628] font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Post
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-1.5">Opens in Farcaster to post to /zao channel</p>
    </div>
  );
}
