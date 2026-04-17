'use client';

interface Sponsor {
  status: 'lead' | 'contacted' | 'in_talks' | 'committed' | 'paid' | 'declined';
  amount_committed: number;
}

interface Artist {
  status: 'wishlist' | 'contacted' | 'interested' | 'confirmed' | 'declined' | 'travel_booked';
}

interface Milestone {
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
}

const FESTIVAL_DATE = new Date('2026-10-03T12:00:00-04:00');
const ARTIST_TARGET = 10;
const SPONSOR_TARGET = 15750;

function daysUntil(target: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function FestivalProgress({
  sponsors,
  artists,
  milestones,
}: {
  sponsors: Sponsor[];
  artists: Artist[];
  milestones: Milestone[];
}) {
  const days = daysUntil(FESTIVAL_DATE);

  const artistsLocked = artists.filter((a) => a.status === 'confirmed' || a.status === 'travel_booked').length;
  const artistPct = Math.min(100, Math.round((artistsLocked / ARTIST_TARGET) * 100));

  const sponsorsCommitted = sponsors
    .filter((s) => s.status === 'committed' || s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.amount_committed || 0), 0);
  const sponsorPct = Math.min(100, Math.round((sponsorsCommitted / SPONSOR_TARGET) * 100));

  const milestonesDone = milestones.filter((m) => m.status === 'done').length;
  const milestonePct = milestones.length > 0 ? Math.round((milestonesDone / milestones.length) * 100) : 0;

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#f5a623] uppercase tracking-wider">Festival Progress</p>
        <p className="text-[10px] text-gray-500">{days} days to Oct 3</p>
      </div>

      <ProgressBar
        label="Artists locked"
        current={`${artistsLocked} / ${ARTIST_TARGET}`}
        pct={artistPct}
        color="bg-purple-500"
      />
      <ProgressBar
        label="Sponsor $ committed"
        current={`$${sponsorsCommitted.toLocaleString()} / $${SPONSOR_TARGET.toLocaleString()}`}
        pct={sponsorPct}
        color="bg-emerald-500"
      />
      <ProgressBar
        label="Milestones done"
        current={`${milestonesDone} / ${milestones.length}`}
        pct={milestonePct}
        color="bg-[#f5a623]"
      />
    </div>
  );
}

function ProgressBar({ label, current, pct, color }: { label: string; current: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{current}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
