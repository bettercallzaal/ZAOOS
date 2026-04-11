'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PageHeader } from '@/components/navigation/PageHeader';
import { BroadcastModal } from '@/components/admin/BroadcastModal';
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
const SpacesManager = dynamic(() => import('@/components/admin/SpacesManager').then(m => ({ default: m.SpacesManager })), { ssr: false });
const AgentDashboard = dynamic(() => import('@/components/admin/agents/AgentDashboard'), { ssr: false });
const RolodexDashboard = dynamic(() => import('@/components/admin/rolodex/RolodexDashboard').then(m => ({ default: m.RolodexDashboard })), { ssr: false });
const NexusLinksManager = dynamic(() => import('@/components/admin/NexusLinksManager').then(m => ({ default: m.NexusLinksManager })), { ssr: false });

type Tab = 'users' | 'zid' | 'members' | 'import' | 'moderation' | 'respect' | 'polls' | 'discord' | 'engagement' | 'audit' | 'funnel' | 'dormant' | 'spaces' | 'agents' | 'rolodex' | 'nexus';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const tableRef = useRef<{ refetch?: () => void }>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const handleUploaded = useCallback(() => {
    setActiveTab('members');
    window.location.reload();
  }, []);

  const tabGroups: { label: string; tabs: { id: Tab; label: string; icon: string }[] }[] = [
    {
      label: 'People',
      tabs: [
        { id: 'users', label: 'Users', icon: '👤' },
        { id: 'zid', label: 'ZIDs', icon: '🏷' },
        { id: 'members', label: 'Allowlist', icon: '👥' },
        { id: 'import', label: 'Import', icon: '📄' },
      ],
    },
    {
      label: 'Analytics',
      tabs: [
        { id: 'respect', label: 'Respect', icon: '🏅' },
        { id: 'engagement', label: 'Engagement', icon: '📊' },
        { id: 'funnel', label: 'Funnel', icon: '📈' },
        { id: 'dormant', label: 'Dormant', icon: '💤' },
        { id: 'audit', label: 'Audit', icon: '📋' },
      ],
    },
    {
      label: 'Config',
      tabs: [
        { id: 'moderation', label: 'Moderation', icon: '🛡' },
        { id: 'polls', label: 'Polls', icon: '🗳' },
        { id: 'discord', label: 'Discord', icon: '💬' },
        { id: 'spaces', label: 'Spaces', icon: '🎙' },
        { id: 'nexus' as Tab, label: 'Nexus', icon: '🔗' },
      ],
    },
    {
      label: 'Agents',
      tabs: [
        { id: 'agents' as Tab, label: '🤖 Squad', icon: '' },
        { id: 'rolodex' as Tab, label: '📇 Rolodex', icon: '' },
      ],
    },
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
              CRM
            </Link>
            <button onClick={() => setBroadcastOpen(true)} className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
              Broadcast
            </button>
            <ExportButton />
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex -mb-px overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {tabGroups.map((group, gi) => (
              <div key={group.label} className="flex items-center shrink-0">
                {gi > 0 && <div className="w-px h-5 bg-gray-700 mx-1.5 shrink-0" />}
                {group.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === tab.id
                        ? 'border-[#f5a623] text-[#f5a623]'
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
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
        {activeTab === 'spaces' && <SpacesManager />}
        {activeTab === 'nexus' && <NexusLinksManager />}
        {activeTab === 'agents' && <AgentDashboard />}
        {activeTab === 'rolodex' && <RolodexDashboard />}
      </div>

      {broadcastOpen && <BroadcastModal onClose={() => setBroadcastOpen(false)} />}
    </div>
  );
}
