import Link from 'next/link';
import { Metadata } from 'next';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { listOnePagers } from '@/lib/stock/onepagers';

export const metadata: Metadata = {
  title: 'ZAOstock One-Pagers',
  description: 'Briefing docs for sponsors, partners, venues, and city contacts.',
};

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-200',
  review: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  final: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  sent: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  archived: 'bg-slate-800 text-slate-500',
};

export default async function OnePagersPage() {
  const session = await getStockTeamMember();
  const all = listOnePagers();
  const visible = all.filter((p) => p.visibility === 'public' || session !== null);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-400">One-Pagers</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Briefing docs for sponsors, partners, venues, and city contacts. Each is a single page meant to be printed, emailed, or shared. Edit the markdown source in <code className="rounded bg-slate-900 px-1 py-0.5 text-xs">ZAO-STOCK/onepagers/</code>.
        </p>
      </header>

      {!session && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          You're viewing as a guest - only public one-pagers are listed. <a href="/stock/team" className="underline">Sign in</a> to see internal drafts.
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
          No one-pagers yet. Add a markdown file to <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">ZAO-STOCK/onepagers/your-slug.md</code> with frontmatter (title, audience, purpose, status, visibility) and it'll show up here.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <Link
              key={p.slug}
              href={`/stock/onepagers/${p.slug}`}
              className="group block rounded-xl border border-white/10 bg-slate-900/40 p-5 transition hover:border-amber-500/40 hover:bg-slate-900/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white group-hover:text-amber-300">{p.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">For: {p.audience}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{p.purpose}</p>
                  {p.meeting_date && (
                    <p className="mt-2 text-xs text-amber-300">
                      Meeting: {p.meeting_date}
                      {p.meeting_location ? ` · ${p.meeting_location}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_COLOR[p.status] ?? STATUS_COLOR.draft
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="text-[10px] text-slate-500">v{p.version}</span>
                  {p.visibility === 'public' && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      public
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
