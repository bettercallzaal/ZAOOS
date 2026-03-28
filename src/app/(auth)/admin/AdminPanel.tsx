'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PageHeader } from '@/components/navigation/PageHeader';
import { SyncRespectButton } from '@/components/admin/SyncRespectButton';
import { ImportRespectButton } from '@/components/admin/ImportRespectButton';

const AllowlistTable = dynamic(() => import('@/components/admin/AllowlistTable').then(m => ({ default: m.AllowlistTable })), { ssr: false });
const UsersTable = dynamic(() => import('@/components/admin/UsersTable').then(m => ({ default: m.UsersTable })), { ssr: false });
const ZidManager = dynamic(() => import('@/components/admin/ZidManager').then(m => ({ default: m.ZidManager })), { ssr: false });
const CsvUpload = dynamic(() => import('@/components/admin/CsvUpload').then(m => ({ default: m.CsvUpload })), { ssr: false });
const HiddenMessages = dynamic(() => import('@/components/admin/HiddenMessages').then(m => ({ default: m.HiddenMessages })), { ssr: false });
const RespectOverview = dynamic(() => import('@/components/admin/RespectOverview').then(m => ({ default: m.RespectOverview })), { ssr: false });
const PollConfigEditor = dynamic(() => import('@/components/admin/PollConfigEditor').then(m => ({ default: m.PollConfigEditor })), { ssr: false });
const DiscordLinkManager = dynamic(() => import('@/components/admin/DiscordLinkManager').then(m => ({ default: m.DiscordLinkManager })), { ssr: false });

type Tab = 'users' | 'zid' | 'members' | 'import' | 'moderation' | 'respect' | 'polls' | 'discord';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const tableRef = useRef<{ refetch?: () => void }>(null);

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
        {activeTab === 'users' && <UsersTable />}
        {activeTab === 'zid' && <ZidManager />}
        {activeTab === 'members' && <AllowlistTable ref={tableRef} />}
        {activeTab === 'import' && <CsvUpload onUploaded={handleUploaded} />}
        {activeTab === 'moderation' && <HiddenMessages />}
        {activeTab === 'respect' && <RespectOverview />}
        {activeTab === 'polls' && <PollConfigEditor />}
        {activeTab === 'discord' && <DiscordLinkManager />}
      </div>
    </div>
  );
}
