'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SubmitForm from '@/components/library/SubmitForm';
import EntryFeed from '@/components/library/EntryFeed';
import DeepResearch from '@/components/library/DeepResearch';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/navigation/PageHeader';

function LibraryContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeSection = (searchParams.get('tab') === 'research' ? 'research' : 'submissions') as 'submissions' | 'research';

  const setActiveSection = (tab: 'submissions' | 'research') => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'submissions') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(`/library${query ? `?${query}` : ''}`, { scroll: false });
  };

  return (
    <div className="pb-20 md:pb-0">
      <PageHeader title="Library" subtitle="Submit links, topics, and resources" />
      <div className="mx-auto max-w-3xl px-4 py-4 space-y-6">

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Submit</h2>
        <SubmitForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      </section>

      <div className="flex gap-2 border-b border-gray-800 pb-1" role="tablist">
        <button
          role="tab"
          aria-selected={activeSection === 'submissions'}
          onClick={() => setActiveSection('submissions')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'submissions'
              ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Community Submissions
        </button>
        <button
          role="tab"
          aria-selected={activeSection === 'research'}
          onClick={() => setActiveSection('research')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'research'
              ? 'text-[#f5a623] border-b-2 border-[#f5a623]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Deep Research (130+ docs)
        </button>
      </div>

      {activeSection === 'submissions' ? (
        <EntryFeed refreshKey={refreshKey} isAdmin={user?.isAdmin} />
      ) : (
        <DeepResearch />
      )}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-6"><p className="text-gray-500">Loading...</p></div>}>
      <LibraryContent />
    </Suspense>
  );
}
