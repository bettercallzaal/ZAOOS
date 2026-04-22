import { Metadata } from 'next';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { SuggestForm } from './SuggestForm';

export const metadata: Metadata = {
  title: 'Suggestions | ZAOstock',
  description: 'Drop a suggestion for ZAOstock. Anyone can submit. We credit the contributors.',
};

export const dynamic = 'force-dynamic';

async function getPublic() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('stock_suggestions')
    .select('id, name, suggestion, status, created_at')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(80);
  return data || [];
}

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  reviewing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  actioned: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  wontfix: 'bg-red-500/10 text-red-400 border-red-500/30',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function SuggestPage() {
  const suggestions = await getPublic();

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock" className="text-xs text-gray-400 hover:text-[#f5a623]">
            &larr; ZAOstock
          </Link>
          <span className="text-xs text-gray-500">Suggestion Box</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="inline-block rounded-full bg-[#f5a623]/10 px-3 py-1 text-xs text-[#f5a623] font-medium border border-[#f5a623]/30">
            Drop an idea
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Suggestion Box</h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Anyone can submit. Great ideas get credited and actioned. The team reviews every entry.
          </p>
        </div>

        <SuggestForm />

        <section className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Recent submissions</p>
          {suggestions.length === 0 ? (
            <div className="bg-[#0d1b2a] rounded-xl p-6 border border-white/[0.08] text-center">
              <p className="text-sm text-gray-500">No suggestions yet. Be the first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${STATUS_COLOR[s.status] || STATUS_COLOR.new}`}>
                      {s.status}
                    </span>
                    <span className="text-[10px] text-gray-500">{formatDate(s.created_at)}</span>
                    {s.name && (
                      <span className="text-[10px] text-[#f5a623]">by {s.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{s.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center">
          <Link href="/stock" className="text-sm text-[#f5a623] hover:text-[#ffd700]">
            Back to ZAOstock
          </Link>
        </div>
      </div>
    </div>
  );
}
