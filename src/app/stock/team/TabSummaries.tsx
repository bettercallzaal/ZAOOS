'use client';

interface Sponsor {
  status: 'lead' | 'contacted' | 'in_talks' | 'committed' | 'paid' | 'declined';
  amount_committed: number;
}

interface Artist {
  status: 'wishlist' | 'contacted' | 'interested' | 'confirmed' | 'declined' | 'travel_booked';
  needs_travel: boolean;
  travel_from: string;
  cypher_interested?: boolean;
}

interface Milestone {
  due_date: string;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
}

function daysToDue(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(date + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function SponsorSummary({ sponsors }: { sponsors: Sponsor[] }) {
  const committed = sponsors.filter((s) => s.status === 'committed' || s.status === 'paid').length;
  const inPipeline = sponsors.filter((s) => s.status === 'in_talks' || s.status === 'contacted').length;
  const totalDollars = sponsors
    .filter((s) => s.status === 'committed' || s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.amount_committed || 0), 0);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile label="Committed" value={String(committed)} color="text-emerald-400" />
      <Tile label="In pipeline" value={String(inPipeline)} color="text-amber-400" />
      <Tile label="Raised" value={`$${totalDollars.toLocaleString()}`} color="text-[#f5a623]" />
    </div>
  );
}

export function ArtistSummary({ artists }: { artists: Artist[] }) {
  const confirmed = artists.filter((a) => a.status === 'confirmed' || a.status === 'travel_booked').length;
  const contacted = artists.filter((a) => a.status === 'contacted' || a.status === 'interested').length;
  const cypher = artists.filter((a) => a.cypher_interested).length;
  const needsTravel = artists.filter((a) => a.status === 'confirmed' && a.needs_travel && !a.travel_from).length;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Confirmed" value={`${confirmed} / 10`} color="text-emerald-400" />
        <Tile label="In pipeline" value={String(contacted)} color="text-amber-400" />
        <Tile label="Cypher signups" value={String(cypher)} color="text-rose-400" />
      </div>
      {needsTravel > 0 && (
        <p className="text-[11px] text-amber-400 px-1">
          {needsTravel} confirmed artist{needsTravel === 1 ? '' : 's'} still need{needsTravel === 1 ? 's' : ''} travel origin set.
        </p>
      )}
    </div>
  );
}

export function TimelineSummary({ milestones }: { milestones: Milestone[] }) {
  const overdue = milestones.filter((m) => m.status !== 'done' && daysToDue(m.due_date) < 0).length;
  const upcoming7 = milestones.filter((m) => {
    if (m.status === 'done') return false;
    const d = daysToDue(m.due_date);
    return d >= 0 && d <= 7;
  }).length;
  const done = milestones.filter((m) => m.status === 'done').length;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile label="Overdue" value={String(overdue)} color={overdue > 0 ? 'text-red-400' : 'text-gray-500'} />
      <Tile label="Due in 7 days" value={String(upcoming7)} color="text-amber-400" />
      <Tile label="Done" value={String(done)} color="text-emerald-400" />
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a1628] rounded-lg p-3 border border-white/[0.06] text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
