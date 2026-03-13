'use client';

import { useCallback, useRef } from 'react';
import { AllowlistTable } from '@/components/admin/AllowlistTable';
import { CsvUpload } from '@/components/admin/CsvUpload';
import { HiddenMessages } from '@/components/admin/HiddenMessages';
import Link from 'next/link';

export function AdminPanel() {
  const tableRef = useRef<{ refetch?: () => void }>(null);

  const handleUploaded = useCallback(() => {
    // Trigger table refresh after CSV upload
    window.location.reload();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#f5a623]">Admin Panel</h1>
        <Link href="/chat" className="text-sm text-gray-400 hover:text-white">
          &larr; Back to chat
        </Link>
      </header>
      <div className="max-w-4xl mx-auto p-6">
        <AllowlistTable />
        <CsvUpload onUploaded={handleUploaded} />
        <HiddenMessages />
      </div>
    </div>
  );
}
