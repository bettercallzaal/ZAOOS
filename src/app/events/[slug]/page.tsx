import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventBySlug } from '@/lib/unlock/events';
import { EventTicket } from '@/components/events/EventTicket';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Event not found' };
  return {
    title: `${event.title} - The ZAO`,
    description: event.description ?? undefined,
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event || !event.is_published) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0a1628] py-8">
      <EventTicket event={event} />
    </main>
  );
}
