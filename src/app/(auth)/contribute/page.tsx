import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import { IssueSubmitForm } from '@/components/community/IssueSubmitForm';

export default function ContributePage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-36">
      <PageHeader title="Contribute" subtitle="Help build ZAO OS" rightAction={<div className="md:hidden"><NotificationBell /></div>} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Open Source Banner */}
        <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#ffd700]/5 rounded-xl p-5 border border-[#f5a623]/30">
          <p className="text-lg font-bold text-white">ZAO OS is Open Source</p>
          <p className="text-sm text-gray-400 mt-1">
            Fork it, build on it, make it yours. Every community deserves its own operating system.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Get Involved</p>

          <a
            href="https://github.com/bettercallzaal/zaoos"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors"
          >
            <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-white">GitHub Repository</p>
              <p className="text-xs text-gray-500">Browse code, open issues, submit PRs</p>
            </div>
            <svg className="w-4 h-4 text-gray-600 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          <a
            href="https://github.com/bettercallzaal/zaoos/issues?q=is%3Aissue+is%3Aopen+label%3Abounty"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors block"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Bounties</p>
                <p className="text-xs text-gray-500">View open bounties on GitHub</p>
              </div>
            </div>
          </a>

          <a
            href="https://github.com/bettercallzaal/zaoos/tree/main/research"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors block"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Documentation</p>
                <p className="text-xs text-gray-500">71 research docs + project guides</p>
              </div>
            </div>
          </a>

          <a
            href="https://github.com/bettercallzaal/zaoos#forking"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] hover:border-[#f5a623]/30 transition-colors block"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Fork Guide</p>
                <p className="text-xs text-gray-500">Launch ZAO OS for your community</p>
              </div>
            </div>
          </a>
        </div>

        {/* Submit Issue */}
        <div className="bg-[#0d1b2a]/50 rounded-xl p-5 border border-white/[0.08]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Submit an Issue</p>
          <p className="text-sm text-gray-400 mb-4">
            Report bugs, request features, or suggest improvements. Issues go directly to the ZAO AI team for triage.
          </p>
          <IssueSubmitForm />
        </div>

        {/* Build in Public */}
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Build in Public</p>
          <p className="text-sm text-gray-400">
            ZAO OS is built transparently. Every decision, every line of code, documented and shared.
            74 research docs and counting.
          </p>
        </div>
      </div>
    </div>
  );
}
