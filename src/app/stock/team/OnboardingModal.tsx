'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'zaostock-onboarding-seen-v1';

export function OnboardingModal({ memberName }: { memberName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // localStorage blocked or unavailable, skip
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-[#0d1b2a] border border-[#f5a623]/40 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Welcome to ZAOstock</p>
          <h2 id="onboarding-title" className="text-2xl font-bold text-white mt-1">
            Hey {memberName}.
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            You are on the ZAOstock team. This dashboard is where we build the festival together. Quick tour:
          </p>
        </div>

        <ol className="space-y-3">
          <Step num={1} title="Check your Home tab">
            Shows the work assigned to you: tasks, sponsors, artists, milestones. If something looks wrong or empty, ask Zaal.
          </Step>
          <Step num={2} title="Click your Next Action card">
            The orange card points at the single most urgent thing you have. Start there.
          </Step>
          <Step num={3} title="Drop a status report in Meeting Notes">
            Open the Notes tab, click the Tuesday meeting entry. Add three lines: what you moved forward, blockers, top ask.
          </Step>
          <Step num={4} title="Dig deeper at the bottom of Home">
            Research library links at the bottom of your Home tab. Core reads plus scope-specific for your team.
          </Step>
        </ol>

        <div className="bg-[#0a1628] border border-white/[0.06] rounded-lg p-3">
          <p className="text-[11px] text-gray-500">
            ZAOstock operates at break-even. Every dollar goes to artists and production. Oct 3 2026, Franklin Street Parklet, Ellsworth ME.
          </p>
        </div>

        <button
          onClick={dismiss}
          className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-3 text-sm transition-colors"
        >
          Got it, take me to my dashboard
        </button>
      </div>
    </div>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f5a623]/15 text-[#f5a623] text-xs font-bold flex items-center justify-center">
        {num}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{children}</p>
      </div>
    </li>
  );
}
