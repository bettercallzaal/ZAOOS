import { Metadata } from 'next';
import { CirclesView } from './CirclesView';

export const metadata: Metadata = {
  title: 'ZAOstock Circles',
  description: 'Eight circles for the Oct 3 festival. Anyone can join. Zaal coordinates by default until someone volunteers.',
};

export const dynamic = 'force-dynamic';

export default function CirclesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-400">Circles</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Eight circles for ZAOstock Oct 3. Pick what you want to work on. Multiple is fine. Zero is fine. Coordinators rotate when someone volunteers - no schedule, no rules.
        </p>
      </header>
      <CirclesView />
    </main>
  );
}
