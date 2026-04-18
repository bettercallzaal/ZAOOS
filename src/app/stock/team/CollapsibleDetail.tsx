'use client';

import { useState, ReactNode } from 'react';

interface Props {
  title: string;
  summary: ReactNode;
  children: ReactNode;
  expandedByDefault?: boolean;
}

export function CollapsibleDetail({ title, summary, children, expandedByDefault = false }: Props) {
  const [open, setOpen] = useState(expandedByDefault);

  return (
    <div className="space-y-4">
      <div className="bg-[#0d1b2a] rounded-xl border border-white/[0.08] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">At a glance</span>
        </div>
        {summary}
        <button
          onClick={() => setOpen(!open)}
          className="w-full bg-[#f5a623]/10 hover:bg-[#f5a623]/20 text-[#f5a623] font-bold rounded-lg px-3 py-2 text-sm transition-colors border border-[#f5a623]/30"
        >
          {open ? 'Hide full view' : 'Show everything (full tools, lists, board view)'}
        </button>
      </div>

      {open && <div className="pt-2">{children}</div>}
    </div>
  );
}
