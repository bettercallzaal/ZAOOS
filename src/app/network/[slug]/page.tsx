import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseAnon } from '@/lib/db/supabase';
import type { CrmContactPublic, CrmInteractionPublic } from '@/lib/crm/types';

// Public per-contact detail page. Reads only the *_public views (safe columns,
// is_public=true) via the ANON client (C-H3) so RLS + the granted view is the
// enforced boundary, not service-role. Server-rendered, no auth. Doc 772.
export const revalidate = 300;
export const dynamicParams = true; // allow on-demand render for new public contacts

async function getContact(slug: string): Promise<CrmContactPublic | null> {
  const { data, error } = await getSupabaseAnon()
    .from('crm_contacts_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as CrmContactPublic;
}

async function getInteractions(contactId: string): Promise<CrmInteractionPublic[]> {
  const { data, error } = await getSupabaseAnon()
    .from('crm_interactions_public')
    .select('*')
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false })
    .limit(100);
  if (error) return [];
  return (data ?? []) as CrmInteractionPublic[];
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { data } = await getSupabaseAnon()
    .from('crm_contacts_public')
    .select('slug')
    .not('slug', 'is', null)
    .limit(200);
  return (data ?? [])
    .map((r) => r.slug as string | null)
    .filter((s): s is string => Boolean(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contact = await getContact(slug);
  if (!contact) return { title: 'Not found - The ZAO Network' };
  const desc = contact.public_summary || contact.how_we_met || `${contact.name} in the ZAO orbit.`;
  return {
    title: `${contact.name} - The ZAO Network`,
    description: desc.slice(0, 160),
  };
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

interface HandleLink {
  label: string;
  href: string;
}

function handleLinks(c: CrmContactPublic): HandleLink[] {
  const links: HandleLink[] = [];
  if (c.farcaster_handle) links.push({ label: `@${c.farcaster_handle}`, href: `https://farcaster.xyz/${c.farcaster_handle}` });
  if (c.x_handle) links.push({ label: `@${c.x_handle} (X)`, href: `https://x.com/${c.x_handle}` });
  if (c.github_handle) links.push({ label: `${c.github_handle} (GitHub)`, href: `https://github.com/${c.github_handle}` });
  return links;
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contact = await getContact(slug);
  if (!contact) notFound();

  const interactions = await getInteractions(contact.id);
  const links = handleLinks(contact);

  return (
    <main className="min-h-screen bg-[#0a1628] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/network" className="text-sm text-[#f5a623] hover:underline">
          &larr; Network
        </Link>

        <header className="mt-4 border-b border-white/10 pb-5">
          <h1 className="text-2xl font-bold sm:text-3xl">{contact.name}</h1>
          {(contact.role || contact.org) && (
            <p className="mt-1 text-white/70">
              {[contact.role, contact.org].filter(Boolean).join(' - ')}
            </p>
          )}
          {links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#f5a623] hover:underline"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
          {contact.how_we_met && (
            <p className="mt-3 text-sm text-white/50">
              <span className="text-white/40">How we met:</span> {contact.how_we_met}
            </p>
          )}
          {contact.public_summary && (
            <p className="mt-3 text-white/80">{contact.public_summary}</p>
          )}
        </header>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Interactions</h2>
          {interactions.length === 0 ? (
            <p className="text-sm text-white/50">No public interactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {interactions.map((i) => (
                <li
                  key={i.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-white">
                      {i.title || i.type}
                    </span>
                    <span className="shrink-0 text-xs text-white/40">
                      {fmtDate(i.occurred_at)}
                    </span>
                  </div>
                  {i.public_summary && (
                    <p className="mt-1 text-sm text-white/70">{i.public_summary}</p>
                  )}
                  <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-[#f5a623]/70">
                    {i.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
