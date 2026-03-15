'use client';

import { useState, useCallback, useRef } from 'react';
import { AllowlistTable } from '@/components/admin/AllowlistTable';
import { UsersTable } from '@/components/admin/UsersTable';
import { ZidManager } from '@/components/admin/ZidManager';
import { CsvUpload } from '@/components/admin/CsvUpload';
import { HiddenMessages } from '@/components/admin/HiddenMessages';
import Link from 'next/link';

type Tab = 'users' | 'zid' | 'members' | 'import' | 'moderation';

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
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#f5a623] tracking-wide">ZAO Admin</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage your community</p>
          </div>
          <Link
            href="/chat"
            className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Back to chat
          </Link>
        </div>
      </header>

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
      </div>
    </div>
  );
}
