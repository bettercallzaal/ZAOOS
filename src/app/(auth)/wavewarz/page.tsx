'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { PageHeader } from '@/components/navigation/PageHeader';
import { GeneratePostButton } from '@/components/wavewarz/GeneratePostButton';
import { communityConfig } from '@/../community.config';

const Leaderboard = dynamic(() => import('@/components/wavewarz/Leaderboard'), { ssr: false });
const BattleLog = dynamic(() => import('@/components/wavewarz/BattleLog'), { ssr: false });

const { wavewarz } = communityConfig;

type Tab = 'leaderboard' | 'battles' | 'arena';

export default function WaveWarzPage() {
  const [tab, setTab] = useState<Tab>('leaderboard');

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      {/* Header */}
      <PageHeader
        title="WaveWarZ"
        subtitle="Music prediction battles"
        backHref="/ecosystem"
        rightAction={
          <div className="flex items-center gap-3">
            {tab === 'arena' && (
              <a
                href={wavewarz.mainApp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-gray-500 hover:text-white transition-colors"
              >
                Open in tab
              </a>
            )}
            <div className="md:hidden"><NotificationBell /></div>
          </div>
        }
      />

      {/* Generate WaveWarZ Post */}
      <div className="px-3 py-2 bg-[#0d1b2a] border-b border-white/[0.08] flex-shrink-0">
        <GeneratePostButton />
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#0d1b2a] border-b border-white/[0.08] flex-shrink-0">
        {(['leaderboard', 'battles', 'arena'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
              tab === t
                ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30'
                : 'bg-[#0a1628] text-gray-500 border border-white/[0.08] hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tab === 'leaderboard' && <Leaderboard />}
        {tab === 'battles' && <BattleLog />}
        {tab === 'arena' && (
          <div className="rounded-xl overflow-hidden border border-white/[0.08] m-3" style={{ height: 'calc(100vh - 200px)' }}>
            <iframe
              src={wavewarz.mainApp}
              className="w-full h-full border-0"
              allow="fullscreen clipboard-write clipboard-read"
              title="WaveWarZ Arena"
            />
          </div>
        )}
      </div>
    </div>
  );
}
