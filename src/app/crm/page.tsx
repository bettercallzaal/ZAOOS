import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { CrmContact } from '@/lib/crm/types';
import CrmAddForm from './CrmAddForm';

// Private CRM dashboard. Admin-only (iron-session isAdmin). Reads the full
// private tables via the service-role client - the app layer is the security
// boundary here (ZAOOS has no Supabase Auth). Doc 772.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'CRM - The ZAO', robots: { index: false } };

interface ContactWithCount extends CrmContact {
  interaction_count: number;
}

async function getContacts(): Promise<ContactWithCount[]> {
  const supabase = getSupabaseAdmin();
  const { data: contacts, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error || !contacts) return [];

  // Per-contact interaction counts (one grouped query).
  const { data: counts } = await supabase
    .from('crm_interactions')
    .select('contact_id');
  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = (row as { contact_id: string }).contact_id;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return (contacts as CrmContact[]).map((c) => ({
    ...c,
    interaction_count: countMap.get(c.id) ?? 0,
  }));
}

export default async function CrmPage() {
  const session = await getSessionData();
  if (!session?.fid || !session.isAdmin) {
    redirect('/');
  }

  const contacts = await getContacts();
  const publicCount = contacts.filter((c) => c.is_public).length;

  return (
    <main className="min-h-screen bg-[#0a1628] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl">CRM</h1>
          <p className="mt-1 text-sm text-white/60">
            {contacts.length} contacts - {publicCount} public on{' '}
            <Link href="/network" className="text-[#f5a623] hover:underline">
              /network
            </Link>
          </p>
        </header>

        <CrmAddForm />

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Contacts</h2>
          {contacts.length === 0 ? (
            <p className="text-sm text-white/50">No contacts yet - add one above.</p>
          ) : (
            <ul className="space-y-2">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{c.name}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <span
                        className={
                          c.is_public ? 'text-[#f5a623]' : 'text-white/30'
                        }
                      >
                        {c.is_public ? 'public' : 'private'}
                      </span>
                      <span className="text-white/40">
                        {c.interaction_count} log{c.interaction_count === 1 ? '' : 's'}
                      </span>
                    </span>
                  </div>
                  {(c.category || c.org) && (
                    <p className="mt-0.5 text-sm text-white/60">
                      {[c.category, c.org].filter(Boolean).join(' - ')}
                    </p>
                  )}
                  {c.tags && c.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-[#f5a623]/10 px-1.5 py-0.5 text-[10px] text-[#f5a623]/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/40">
                    {c.farcaster_handle && <span>@{c.farcaster_handle}</span>}
                    {c.email && <span>{c.email}</span>}
                    {c.location && <span>{c.location}</span>}
                    {c.relationship_strength != null && (
                      <span>strength {c.relationship_strength}/5</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
