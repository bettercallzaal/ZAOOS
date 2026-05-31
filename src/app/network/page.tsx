import Link from 'next/link';
import { getSupabaseAnon } from '@/lib/db/supabase';
import type { CrmContactPublic } from '@/lib/crm/types';

// Public "who I've met" feed. Reads only the crm_contacts_public view (safe
// columns, is_public=true) via the ANON client (C-H3) so RLS + the granted view
// is the enforced boundary, not service-role. Server-rendered, no auth. Doc 772.
export const revalidate = 300; // ISR: refresh every 5 min

export const metadata = {
  title: 'Network - The ZAO',
  description: 'People in the ZAO orbit - who we have met and what we are building together.',
};

async function getPublicContacts(): Promise<CrmContactPublic[]> {
  const { data, error } = await getSupabaseAnon()
    .from('crm_contacts_public')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return [];
  return (data ?? []) as CrmContactPublic[];
}

function handleLine(c: CrmContactPublic): string | null {
  if (c.farcaster_handle) return `@${c.farcaster_handle}`;
  if (c.x_handle) return `@${c.x_handle}`;
  if (c.github_handle) return c.github_handle;
  return c.handle;
}

export default async function NetworkPage() {
  const contacts = await getPublicContacts();

  return (
    <main className="min-h-screen bg-[#0a1628] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Network</h1>
          <p className="mt-2 text-sm text-white/60">
            People in the ZAO orbit - who we have met and what we are building together.
          </p>
        </header>

        {contacts.length === 0 ? (
          <p className="text-white/50">No public contacts yet.</p>
        ) : (
          <ul className="space-y-3">
            {contacts.map((c) => {
              const handle = handleLine(c);
              const card = (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#f5a623]/40">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-semibold text-white">{c.name}</h2>
                    {handle && (
                      <span className="shrink-0 text-xs text-[#f5a623]">{handle}</span>
                    )}
                  </div>
                  {(c.role || c.org) && (
                    <p className="mt-1 text-sm text-white/70">
                      {[c.role, c.org].filter(Boolean).join(' - ')}
                    </p>
                  )}
                  {c.how_we_met && (
                    <p className="mt-2 text-sm text-white/50">
                      <span className="text-white/40">How we met:</span> {c.how_we_met}
                    </p>
                  )}
                  {c.public_summary && (
                    <p className="mt-2 text-sm text-white/70">{c.public_summary}</p>
                  )}
                </div>
              );
              return (
                <li key={c.id}>
                  {c.slug ? (
                    <Link href={`/network/${c.slug}`} className="block">
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
