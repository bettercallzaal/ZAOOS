'use client';

import { useState } from 'react';
import SubmitForm from '@/components/library/SubmitForm';
import EntryFeed from '@/components/library/EntryFeed';
import DeepResearch from '@/components/library/DeepResearch';
import { useAuth } from '@/hooks/useAuth';

export default function LibraryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'submissions' | 'research'>('submissions');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <p className="text-sm text-gray-400 mt-1">
          Submit links, topics, and resources. AI analyzes how they fit into ZAO.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Submit</h2>
        <SubmitForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      </section>

      <div className="flex gap-2 border-b border-gray-800 pb-1">
        <button
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
  );
}
