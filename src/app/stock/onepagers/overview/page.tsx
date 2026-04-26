import Link from 'next/link';
import { Metadata } from 'next';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getOnePager } from '@/lib/stock/onepagers';
import { getStockCounts, getPublicMembers } from '@/lib/stock/members';
import { CopyButton } from '../[slug]/CopyButton';
import { PrintButton } from '../[slug]/PrintButton';

export const dynamic = 'force-dynamic';

const FESTIVAL_DATE = '2026-10-03T12:00:00-04:00';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'ZAOstock 2026 — Overview',
    description:
      'ZAO Festivals presents ZAOstock — a one-day artist-built music festival in Ellsworth, Maine. October 3, 2026.',
    openGraph: {
      title: 'ZAOstock 2026 — Overview',
      description:
        'ZAO Festivals presents ZAOstock — October 3, 2026 at the Franklin Street Parklet, Ellsworth, Maine.',
      images: ['/images/festivals/zao-stock-logo.jpeg'],
    },
  };
}

interface Stat {
  value: string;
  label: string;
  sub?: string;
}

interface Pillar {
  number: string;
  title: string;
  body: string;
}

interface Partner {
  name: string;
  role: string;
  confirmed: boolean;
}

const PILLARS: Pillar[] = [
  {
    number: '01',
    title: 'Music first',
    body:
      'Independent artists at the center. The lineup is open-call, peer-curated, and built around what serves the room — not what serves a sponsor brief.',
  },
  {
    number: '02',
    title: 'Community second',
    body:
      'The ZAO is 188 members across 30+ countries. ZAOstock is the global community showing up for one local town: Ellsworth, Maine. Year 1 is about relationship.',
  },
  {
    number: '03',
    title: 'Technology third',
    body:
      'We use crypto, Farcaster, and decentralized tools because they make the work easier — not because they ARE the work. Tech serves the music. Always that order.',
  },
];

const PARTNERS: Partner[] = [
  { name: 'Town of Ellsworth', role: 'Venue partner — Franklin St Parklet', confirmed: true },
  { name: 'Heart of Ellsworth', role: 'Local promotion + Maine cultural ties', confirmed: true },
  { name: 'Fractured Atlas', role: '501(c)(3) fiscal sponsor', confirmed: true },
  { name: 'Wallace Events', role: 'Tents + weather backup', confirmed: false },
  { name: 'Black Moon Public House', role: 'After-party venue', confirmed: false },
];

const SPONSOR_TIERS = [
  {
    tier: 'Main Stage Partner',
    range: '$10K-25K',
    perks: [
      'Named credit on stage banner + signage',
      'On-site booth or table space',
      'Welcome bag inclusion',
      'Live verbal credit during the event',
      'Co-presented in all printed materials',
    ],
  },
  {
    tier: 'Broadcast Partner',
    range: '$5K-10K',
    perks: [
      'Named credit on festival website',
      'Livestream overlay credit',
      'Sponsored segment + interview feature',
      'Cross-platform social campaign (Farcaster, X, Bluesky)',
      'Newsletter credit (400+ editions)',
    ],
  },
  {
    tier: 'Year-Round Partner',
    range: '$2.5K-5K',
    perks: [
      'Post-event thank-you feature + recap',
      'Advisory seat for Year 2 planning',
      'Priority placement in 2027',
      'Tax-deductible via Fractured Atlas',
    ],
  },
];

const HOW_TO = [
  {
    role: 'Artists',
    detail:
      'Submit through the open call. Cutoff is roughly one month before the event. Independent + ZAO-vetted.',
    cta: { label: 'Suggest an artist', href: '/stock/suggest' },
  },
  {
    role: 'Sponsors',
    detail:
      '$2.5K-25K range across 3 tiers. Local + national both welcome. Tax-deductible via Fractured Atlas.',
    cta: { label: 'Partner deck', href: '/stock/sponsor/deck' },
  },
  {
    role: 'Volunteers',
    detail: 'Day-of crew, hospitality, setup, breakdown. Fed and credited.',
    cta: { label: 'Sign up', href: '/stock/apply' },
  },
  {
    role: 'Press + media',
    detail: 'Briefings, interviews, photo passes. Email zaal@thezao.com or browse our briefings.',
    cta: { label: 'Briefings', href: '/stock/onepagers' },
  },
];

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default async function OverviewOnePager() {
  const [pager, counts, members, session] = await Promise.all([
    getOnePager('overview'),
    getStockCounts().catch(() => null),
    getPublicMembers().catch(() => []),
    getStockTeamMember().catch(() => null),
  ]);

  const days = daysUntil(FESTIVAL_DATE);
  const teamCount = (members ?? []).length;
  const sponsorAmount = counts?.sponsorsCommittedAmount ?? 0;
  const sponsorCount = counts?.sponsorsCommitted ?? 0;
  const volunteerCount = counts?.volunteers ?? 0;

  const stats: Stat[] = [
    { value: 'Oct 3', label: '2026', sub: '12pm — late' },
    { value: 'Ellsworth', label: 'Maine', sub: 'Franklin St Parklet' },
    { value: `${days}`, label: 'days to go', sub: 'as of today' },
    { value: `${teamCount}`, label: 'team members', sub: '8 circles' },
  ];

  return (
    <main className="min-h-screen bg-[#0a1628] text-slate-100 print:bg-white print:text-slate-900">
      {/* Top bar */}
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 print:hidden">
        <Link href="/stock" className="text-sm text-amber-400 hover:underline">
          &larr; ZAOstock home
        </Link>
        <div className="flex items-center gap-2">
          {session && (
            <Link
              href="/stock/onepagers"
              className="text-xs text-slate-400 hover:text-amber-400 underline"
            >
              All briefings
            </Link>
          )}
          {pager && <CopyButton text={pager.body} />}
          <PrintButton />
        </div>
      </div>

      {/* HERO */}
      <header className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-12 print:py-6">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
            ZAO Festivals presents
          </div>
          <h1 className="mt-2 text-5xl font-black leading-none text-white sm:text-6xl print:text-slate-900 print:text-4xl">
            ZAOstock
            <span className="ml-3 align-top text-2xl font-bold text-amber-400 print:text-amber-700">
              2026
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 print:text-slate-700">
            A one-day, artist-built music festival in downtown Ellsworth, Maine. Run by{' '}
            <strong className="text-white print:text-slate-900">The ZAO</strong> — a global,
            decentralized music community. Year 1: relationship over scale.
          </p>
        </div>
      </header>

      {/* STATS GRID */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-px bg-white/5 sm:grid-cols-4 print:bg-slate-200">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#0a1628] px-4 py-6 print:bg-white"
            >
              <div className="text-2xl font-black text-white print:text-slate-900">{s.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-400 print:text-amber-700">
                {s.label}
              </div>
              {s.sub && (
                <div className="mt-1 text-xs text-slate-400 print:text-slate-600">{s.sub}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            Order of priorities
          </h2>
          <div className="mt-2 text-2xl font-bold text-white print:text-slate-900">
            Music first. Community second. Technology third.
          </div>
          <p className="mt-2 text-sm text-slate-400 print:text-slate-600">
            That order matters. Most music tech inverts it. We&rsquo;re music people who use
            crypto, not crypto people who like music.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.number}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4 print:border-slate-300 print:bg-slate-50"
              >
                <div className="text-xs font-mono text-amber-400 print:text-amber-700">
                  {p.number}
                </div>
                <div className="mt-1 text-base font-bold text-white print:text-slate-900">
                  {p.title}
                </div>
                <p className="mt-2 text-sm text-slate-300 print:text-slate-700">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            What it is
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-base font-bold text-white print:text-slate-900">
                The festival
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-slate-700">
                One-day outdoor festival at the Franklin Street Parklet in downtown Ellsworth.
                Independent + ZAO-vetted artists, multiple acts, day-into-evening. Programmed
                end-to-end by The ZAO community.
              </p>
            </div>
            <div>
              <div className="text-base font-bold text-white print:text-slate-900">
                The umbrella
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-slate-700">
                <strong className="text-white print:text-slate-900">ZAO Festivals</strong> is our
                event arm. ZAOstock is the flagship. Future events inherit the equity, mailing
                list, and trust we build this year.
              </p>
            </div>
            <div>
              <div className="text-base font-bold text-white print:text-slate-900">
                The brand
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-slate-700">
                <strong className="text-white print:text-slate-900">The ZAO</strong> (ZTalent
                Artist Organization) is a decentralized music community: 188 members, 30+
                countries, organized around fractals (weekly peer-ranked contribution rounds) and
                a shared treasury.
              </p>
            </div>
            <div>
              <div className="text-base font-bold text-white print:text-slate-900">
                The lineup
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 print:text-slate-700">
                Open-call. Submission-based. Cutoff roughly one month before the event. Curated
                by the Music circle (DCoop + Shawn) with peer input.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHERE WE ARE */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            Where we are
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/[0.04] p-4 print:bg-slate-50">
              <div className="text-xs uppercase tracking-wider text-slate-400 print:text-slate-600">
                Sponsors
              </div>
              <div className="mt-1 text-2xl font-bold text-white print:text-slate-900">
                ${sponsorAmount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">
                {sponsorCount} committed
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-4 print:bg-slate-50">
              <div className="text-xs uppercase tracking-wider text-slate-400 print:text-slate-600">
                Team
              </div>
              <div className="mt-1 text-2xl font-bold text-white print:text-slate-900">
                {teamCount}
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">8 circles</div>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-4 print:bg-slate-50">
              <div className="text-xs uppercase tracking-wider text-slate-400 print:text-slate-600">
                Volunteers
              </div>
              <div className="mt-1 text-2xl font-bold text-white print:text-slate-900">
                {volunteerCount}
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">signed up</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-base font-bold text-white print:text-slate-900">Partners</div>
            <ul className="mt-2 divide-y divide-white/5 print:divide-slate-200">
              {PARTNERS.map((p) => (
                <li key={p.name} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-semibold text-white print:text-slate-900">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400 print:text-slate-600">{p.role}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.confirmed
                        ? 'bg-emerald-500/15 text-emerald-300 print:bg-emerald-100 print:text-emerald-800'
                        : 'bg-slate-700/50 text-slate-300 print:bg-slate-200 print:text-slate-700'
                    }`}
                  >
                    {p.confirmed ? 'Confirmed' : 'In conversation'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SPONSORSHIP TIERS */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            Sponsorship
          </h2>
          <p className="mt-2 text-sm text-slate-400 print:text-slate-600">
            Tax-deductible via Fractured Atlas. Direct-deal with The ZAO.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {SPONSOR_TIERS.map((t) => (
              <div
                key={t.tier}
                className="rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-4 print:border-amber-700/40 print:bg-amber-50"
              >
                <div className="text-base font-bold text-white print:text-slate-900">{t.tier}</div>
                <div className="text-sm font-semibold text-amber-400 print:text-amber-700">
                  {t.range}
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-300 print:text-slate-700">
                  {t.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <span className="text-amber-400 print:text-amber-700">·</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO BE INVOLVED */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            How to be involved
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {HOW_TO.map((row) => (
              <div
                key={row.role}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4 print:border-slate-300 print:bg-white"
              >
                <div className="text-base font-bold text-white print:text-slate-900">
                  {row.role}
                </div>
                <p className="mt-1 text-sm text-slate-300 print:text-slate-700">{row.detail}</p>
                <Link
                  href={row.cta.href}
                  className="mt-3 inline-block text-sm font-semibold text-amber-400 hover:underline print:text-amber-700"
                >
                  {row.cta.label} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YEAR 1 COMMITMENTS */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            Year 1 commitments
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              'Show up locally. Meet the city, the venue, the music scene. Roddy at City Hall, Steve Peer in the basement, Black Moon out back.',
              'Take care of the artists. Fair pay, real promo, real community. Open-call lineup, peer curation.',
              'Document everything. Public log. Build in public. Newsletter every Friday.',
              "Don't overscale. Capacity the venue + city are happy with. Year 2 earns the right to grow.",
            ].map((c, i) => (
              <li key={c} className="flex gap-3">
                <span className="flex-shrink-0 text-2xl font-black text-amber-400 print:text-amber-700">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300 print:text-slate-700">{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CONTACT */}
      <section className="border-b border-white/10 print:border-slate-300">
        <div className="mx-auto max-w-4xl px-4 py-10 print:py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 print:text-amber-700">
            Contact
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-slate-400 print:text-slate-600">For everything</div>
              <a
                href="mailto:zaal@thezao.com"
                className="mt-1 block text-xl font-bold text-amber-400 hover:underline print:text-amber-700"
              >
                zaal@thezao.com
              </a>
              <div className="mt-1 text-xs text-slate-500 print:text-slate-600">
                Zaal — ZAOstock organizer, The ZAO founder
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 print:text-slate-600">Online</div>
              <ul className="mt-1 space-y-1 text-sm text-slate-300 print:text-slate-700">
                <li>
                  Site:{' '}
                  <Link href="/stock" className="text-amber-400 hover:underline print:text-amber-700">
                    zaoos.com/stock
                  </Link>
                </li>
                <li>Newsletter: paragraph.com/@thezao</li>
                <li>Farcaster: /thezao</li>
                <li>X: @thezao_</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD-EDITED LONG-FORM (renders only if pager body has content) */}
      {pager?.body && pager.body.trim().length > 0 && (
        <section className="border-b border-white/10 print:hidden">
          <div className="mx-auto max-w-4xl px-4 py-10">
            <details className="group rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-amber-400 hover:underline">
                + Long-form briefing (last edited via dashboard)
              </summary>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{pager.body}</pre>
            </details>
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-4xl px-4 py-8 text-xs text-slate-500 print:text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            ZAO Festivals presents ZAOstock 2026 ·{' '}
            {pager?.updated_at && (
              <span className="text-slate-600">v{pager.version} · updated {pager.updated_at.slice(0, 10)}</span>
            )}
          </div>
          <div className="text-right">
            zaoos.com/stock/onepagers/overview
          </div>
        </div>
      </footer>
    </main>
  );
}
