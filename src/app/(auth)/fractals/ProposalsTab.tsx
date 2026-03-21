'use client';

import { useState, useEffect } from 'react';

interface Proposal {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  proposer?: string;
  createTime?: number;
  voteCount?: number;
}

export function ProposalsTab() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [source, setSource] = useState<'ornode' | 'unavailable' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fractals/proposals')
      .then((r) => r.json())
      .then((d) => {
        setProposals(d.proposals ?? []);
        setSource(d.source);
      })
      .catch(() => setSource('unavailable'))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    executed: 'text-blue-400 bg-blue-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
  };

  return (
    <div className="pt-2 space-y-4">
      <a
        href="https://of.frapps.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between w-full bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-xl px-4 py-3 hover:bg-[#f5a623]/20 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-[#f5a623]">ORDAO Governance</p>
          <p className="text-xs text-gray-400">Create proposals, vote, view results</p>
        </div>
        <svg className="w-5 h-5 text-[#f5a623]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      <div className="bg-[#0d1b2a] rounded-xl p-3 space-y-1">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">On-Chain Contracts (Optimism)</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">OREC</span>
          <a
            href="https://optimistic.etherscan.io/address/0xcB05F9254765CA521F7698e61E0A6CA6456Be532"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
          >
            0xcB05...e532
          </a>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">ZOR (Respect1155)</span>
          <a
            href="https://optimistic.etherscan.io/address/0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
          >
            0x9885...45c
          </a>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-[#0d1b2a] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && source === 'unavailable' && (
        <div className="text-center py-6 bg-[#0d1b2a] rounded-xl">
          <p className="text-gray-500 text-sm">Proposal data unavailable right now.</p>
          <p className="text-xs text-gray-600 mt-1">View proposals directly on ORDAO above.</p>
        </div>
      )}

      {!loading && source === 'ornode' && proposals.length === 0 && (
        <div className="text-center py-6 bg-[#0d1b2a] rounded-xl">
          <p className="text-gray-400 text-sm">No active proposals.</p>
          <p className="text-xs text-gray-600 mt-1">Create one on ORDAO above.</p>
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Recent Proposals</p>
          {proposals.map((p) => {
            const statusKey = (p.status ?? '').toLowerCase();
            const colorClass = STATUS_COLORS[statusKey] ?? 'text-gray-400 bg-gray-400/10';
            return (
              <div key={p.id} className="bg-[#0d1b2a] rounded-xl px-4 py-3 border border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white flex-1 line-clamp-2">
                    {p.title || p.description || `Proposal ${p.id}`}
                  </p>
                  {p.status && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
                      {p.status}
                    </span>
                  )}
                </div>
                {p.createTime && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    {new Date(p.createTime * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
