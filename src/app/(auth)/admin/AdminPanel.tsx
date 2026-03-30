'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PageHeader } from '@/components/navigation/PageHeader';
import { SyncRespectButton } from '@/components/admin/SyncRespectButton';
import { ImportRespectButton } from '@/components/admin/ImportRespectButton';

const ExportButton = dynamic(() => import('@/components/admin/ExportButton'), { ssr: false });

const AllowlistTable = dynamic(() => import('@/components/admin/AllowlistTable').then(m => ({ default: m.AllowlistTable })), { ssr: false });
const UsersTable = dynamic(() => import('@/components/admin/UsersTable').then(m => ({ default: m.UsersTable })), { ssr: false });
const ZidManager = dynamic(() => import('@/components/admin/ZidManager').then(m => ({ default: m.ZidManager })), { ssr: false });
const CsvUpload = dynamic(() => import('@/components/admin/CsvUpload').then(m => ({ default: m.CsvUpload })), { ssr: false });
const HiddenMessages = dynamic(() => import('@/components/admin/HiddenMessages').then(m => ({ default: m.HiddenMessages })), { ssr: false });
const RespectOverview = dynamic(() => import('@/components/admin/RespectOverview').then(m => ({ default: m.RespectOverview })), { ssr: false });
const PollConfigEditor = dynamic(() => import('@/components/admin/PollConfigEditor').then(m => ({ default: m.PollConfigEditor })), { ssr: false });
const DiscordLinkManager = dynamic(() => import('@/components/admin/DiscordLinkManager').then(m => ({ default: m.DiscordLinkManager })), { ssr: false });
const EngagementOverview = dynamic(() => import('@/components/admin/EngagementOverview').then(m => ({ default: m.EngagementOverview })), { ssr: false });
const AuditLog = dynamic(() => import('@/components/admin/AuditLog'), { ssr: false });
const QuickStats = dynamic(() => import('@/components/admin/QuickStats'), { ssr: false });
const OnboardingFunnel = dynamic(() => import('@/components/admin/OnboardingFunnel'), { ssr: false });
const DormantMembers = dynamic(() => import('@/components/admin/DormantMembers').then(m => ({ default: m.DormantMembers })), { ssr: false });

type Tab = 'users' | 'zid' | 'members' | 'import' | 'moderation' | 'respect' | 'polls' | 'discord' | 'engagement' | 'audit' | 'funnel' | 'dormant';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const tableRef = useRef<{ refetch?: () => void }>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleUploaded = useCallback(() => {
    setActiveTab('members');
    window.location.reload();
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'users', label: 'Users', icon: '👤' },
    { id: 'zid', label: 'ZIDs', icon: '🏷' },
    { id: 'members', label: 'Allowlist', icon: '👥' },
    { id: 'import', label: 'Import', icon: '📄' },
    { id: 'moderation', label: 'Moderation', icon: '🛡' },
    { id: 'respect', label: 'Respect', icon: '🏅' },
    { id: 'polls', label: 'Polls', icon: '🗳' },
    { id: 'discord', label: 'Discord', icon: '💬' },
    { id: 'engagement', label: 'Engagement', icon: '📊' },
    { id: 'audit', label: 'Audit', icon: '📋' },
    { id: 'funnel', label: 'Funnel', icon: '📈' },
    { id: 'dormant', label: 'Dormant', icon: '💤' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header */}
      <PageHeader
        title="ZAO Admin"
        subtitle="Manage your community"
        rightAction={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/members"
              className="text-sm text-[#f5a623] hover:text-[#ffd700] bg-[#f5a623]/10 hover:bg-[#f5a623]/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Member CRM
            </Link>
            <button onClick={() => setBroadcastOpen(true)} className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Broadcast
            </button>
            <ExportButton />
            <ImportRespectButton />
            <SyncRespectButton />
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#f5a623] text-[#f5a623]'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <QuickStats />
        {activeTab === 'users' && <UsersTable />}
        {activeTab === 'zid' && <ZidManager />}
        {activeTab === 'members' && <AllowlistTable ref={tableRef} />}
        {activeTab === 'import' && <CsvUpload onUploaded={handleUploaded} />}
        {activeTab === 'moderation' && <HiddenMessages />}
        {activeTab === 'respect' && <RespectOverview />}
        {activeTab === 'polls' && <PollConfigEditor />}
        {activeTab === 'discord' && <DiscordLinkManager />}
        {activeTab === 'engagement' && <EngagementOverview />}
        {activeTab === 'audit' && <AuditLog />}
        {activeTab === 'funnel' && <OnboardingFunnel />}
        {activeTab === 'dormant' && <DormantMembers />}
      </div>

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0d1b2a] rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-3">Cast to /zao channel</h3>
            <textarea
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              placeholder="Write your announcement..."
              className="w-full bg-[#0a1628] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none resize-none h-32"
              maxLength={1024}
            />
            <p className="text-[10px] text-gray-600 mt-1">{broadcastText.length}/1024</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setBroadcastOpen(false); setBroadcastText(''); }} className="flex-1 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">Cancel</button>
              <button
                onClick={async () => {
                  setBroadcasting(true);
                  try {
                    await fetch('/api/admin/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: broadcastText }) });
                  } catch { /* ignore */ }
                  setBroadcasting(false);
                  setBroadcastOpen(false);
                  setBroadcastText('');
                }}
                disabled={broadcasting || !broadcastText.trim()}
                className="flex-1 py-2 text-sm text-black bg-[#f5a623] rounded-lg font-medium disabled:opacity-50 hover:bg-[#ffd700] transition-colors"
              >
                {broadcasting ? 'Casting...' : 'Cast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
