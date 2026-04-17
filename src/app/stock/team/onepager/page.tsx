import { Metadata } from 'next';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { redirect } from 'next/navigation';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = {
  title: 'ZAOstock Team — One-Pager Handout',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const CODES: Array<{ name: string; code: string; scope: string }> = [
  { name: 'Zaal', code: 'ZAAL', scope: 'Ops Lead' },
  { name: 'Candy', code: 'CAND', scope: 'Ops 2nd' },
  { name: 'FailOften', code: 'FAIL', scope: 'Ops' },
  { name: 'Hurric4n3Ike', code: 'HURR', scope: 'Ops' },
  { name: 'Swarthy Hatter', code: 'SWAR', scope: 'Ops' },
  { name: 'DaNici', code: 'DANI', scope: 'Design Lead' },
  { name: 'Shawn', code: 'SHAW', scope: 'Design' },
  { name: 'DCoop', code: 'DCOO', scope: 'Music 2nd' },
  { name: 'AttaBotty', code: 'ATTA', scope: 'Music' },
  { name: 'Tyler Stambaugh', code: 'TYLE', scope: 'Finance' },
  { name: 'Ohnahji B', code: 'OHNA', scope: 'Finance' },
  { name: 'DFresh', code: 'DFRE', scope: 'Finance' },
  { name: 'Craig G', code: 'CRAI', scope: 'Finance' },
  { name: 'Maceo', code: 'MACE', scope: 'Finance' },
];

export default async function OnePagerPage() {
  const member = await getStockTeamMember();
  if (!member) redirect('/stock/team');

  return (
    <div className="min-h-[100dvh] bg-white text-black print:bg-white print:text-black">
      <style>{`
        @media print {
          @page { size: letter; margin: 0.5in; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-[8.5in] mx-auto p-8 print:p-0">
        <div className="no-print mb-6 flex items-center justify-between bg-[#0a1628] -mx-8 -mt-8 px-8 py-3 text-white">
          <p className="text-sm">ZAOstock Team — One-Pager</p>
          <PrintButton />
        </div>

        <header className="border-b-4 border-black pb-4 mb-6">
          <h1 className="text-4xl font-black tracking-tight">ZAOstock</h1>
          <p className="text-lg mt-1">Community Music Festival · Oct 3, 2026 · Ellsworth, ME</p>
        </header>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Welcome to the team.</h2>
          <p className="text-sm leading-relaxed">
            You&apos;re officially on the ZAOstock crew. This sheet has your login code + the 4 things to do on first login.
            Keep it safe until Tuesday&apos;s meeting, then let&apos;s go build.
          </p>
        </section>

        <section className="mb-6 border-2 border-black p-4 rounded">
          <p className="text-xs uppercase tracking-wider font-bold mb-2">Login</p>
          <p className="text-base mb-3">
            1. Go to <span className="font-mono font-bold">zaoos.com/stock/team</span>
          </p>
          <p className="text-base">
            2. Enter your 4-letter code (case-insensitive)
          </p>
        </section>

        <section className="mb-6">
          <p className="text-xs uppercase tracking-wider font-bold mb-2">4 Things To Do First Login</p>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Read your <strong>Home tab</strong> — shows your tasks, sponsors, artists, milestones</li>
            <li>Click the <strong>Next Action</strong> card — it points at your most urgent item</li>
            <li>Go to <strong>Meeting Notes</strong> tab → add 3 bullets: moved-forward / blockers / top-ask</li>
            <li>Skim <strong>Dig Deeper → Research Library</strong> at the bottom of your Home tab</li>
          </ol>
        </section>

        <section className="mb-6">
          <p className="text-xs uppercase tracking-wider font-bold mb-2">Your Code (find your name)</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-1.5 font-bold">Name</th>
                <th className="text-left py-1.5 font-bold">Role</th>
                <th className="text-left py-1.5 font-bold font-mono">Code</th>
              </tr>
            </thead>
            <tbody>
              {CODES.map((c) => (
                <tr key={c.code} className="border-b border-gray-300">
                  <td className="py-1.5">{c.name}</td>
                  <td className="py-1.5 text-gray-600">{c.scope}</td>
                  <td className="py-1.5 font-mono font-bold tracking-widest">{c.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-6 bg-black text-white p-4 rounded">
          <p className="text-xs uppercase tracking-wider font-bold mb-2">Keep These In Mind</p>
          <ul className="text-sm space-y-1">
            <li>· ZAOstock operates at <strong>break-even</strong>. Every dollar goes to artists + production.</li>
            <li>· Event is <strong>BYOB, dog &amp; kid friendly</strong>. Community first.</li>
            <li>· 10 artists · 1 stage · all day · Franklin Street Parklet.</li>
            <li>· Part of the 9th Annual Art of Ellsworth.</li>
          </ul>
        </section>

        <footer className="border-t-2 border-black pt-3 text-xs text-gray-600 flex justify-between">
          <span>Questions? Ask Zaal in the team channel.</span>
          <span>zaoos.com/stock · Apr 2026</span>
        </footer>
      </div>
    </div>
  );
}
