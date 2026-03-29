'use client';

export function CrossPostingSection() {
  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Cross-Posting Channels</p>
        <span className="text-[10px] text-gray-600">Community broadcasts</span>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800/50">

        {/* Telegram */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">Telegram</p>
              <span className="px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-medium">Channel</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Community posts are automatically shared to the ZAO Telegram channel</p>
          </div>
          <a
            href="https://t.me/thezao"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors flex-shrink-0"
          >
            Join
          </a>
        </div>

        {/* Discord */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">Discord</p>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">Server</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Community posts are automatically shared to the ZAO Discord</p>
          </div>
          <a
            href="https://discord.gg/thezao"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors flex-shrink-0"
          >
            Join
          </a>
        </div>

        {/* Farcaster — already connected */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.24 2.4H5.76C3.84 2.4 2.4 3.84 2.4 5.76v12.48c0 1.92 1.44 3.36 3.36 3.36h12.48c1.92 0 3.36-1.44 3.36-3.36V5.76c0-1.92-1.44-3.36-3.36-3.36zM12 17.28c-2.928 0-5.28-2.352-5.28-5.28S9.072 6.72 12 6.72s5.28 2.352 5.28 5.28-2.352 5.28-5.28 5.28z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">Farcaster</p>
              <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium">Connected</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">All approved proposals auto-publish to Farcaster</p>
          </div>
        </div>

        {/* Admin hint */}
        <div className="px-5 py-3">
          <p className="text-[10px] text-gray-600">
            Approved community proposals with 1000+ Respect automatically cross-post to all connected platforms.
            Admins: configure <span className="font-mono text-gray-500">TELEGRAM_BOT_TOKEN</span>, <span className="font-mono text-gray-500">TELEGRAM_CHAT_ID</span>, and <span className="font-mono text-gray-500">DISCORD_WEBHOOK_URL</span> in env vars.
          </p>
        </div>
      </div>
    </section>
  );
}
