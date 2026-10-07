import type { Metadata } from 'next';
import Link from 'next/link';
import AgentDashboard from '@/components/admin/agents/AgentDashboard';

export const metadata: Metadata = {
  title: 'Agent Fleet | ZAO OS',
  description: 'Autonomous machine execution plane & ZOE community orchestrator',
};

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white px-4 py-6 sm:px-8 max-w-7xl mx-auto">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/os"
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Back to OS"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">ZOE & Agent Fleet</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1 pl-10">
            Autonomous machine execution plane and community orchestration squad
          </p>
        </div>

        <div className="flex items-center gap-2 pl-10 sm:pl-0">
          <Link
            href="/assistant"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
          >
            Chat with Assistant
          </Link>
          <Link
            href="/admin?tab=agents"
            className="px-3 py-1.5 text-xs font-semibold text-[#0a1628] bg-[#f5a623] hover:bg-[#ffd700] rounded-lg transition-colors"
          >
            Admin Controls
          </Link>
        </div>
      </div>

      {/* Main Agent Dashboard */}
      <AgentDashboard />
    </div>
  );
}
