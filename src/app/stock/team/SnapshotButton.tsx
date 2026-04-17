'use client';

interface Sponsor {
  name: string;
  track: string;
  status: string;
  amount_committed: number;
  amount_paid: number;
  owner: { id: string; name: string } | null;
}

interface Artist {
  name: string;
  status: string;
  genre: string;
  outreach: { id: string; name: string } | null;
}

interface Milestone {
  title: string;
  due_date: string;
  status: string;
  category: string;
  owner: { id: string; name: string } | null;
}

interface BudgetEntry {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  status: string;
}

interface Props {
  sponsors: Sponsor[];
  artists: Artist[];
  milestones: Milestone[];
  budget: BudgetEntry[];
}

const FESTIVAL_DATE = new Date('2026-10-03T12:00:00-04:00');

function daysUntil(target: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysToDue(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(date + 'T00:00:00').getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function buildMarkdown({ sponsors, artists, milestones, budget }: Props): string {
  const today = new Date().toISOString().slice(0, 10);
  const days = daysUntil(FESTIVAL_DATE);

  const artistsLocked = artists.filter((a) => a.status === 'confirmed' || a.status === 'travel_booked').length;
  const sponsorsCommitted = sponsors
    .filter((s) => s.status === 'committed' || s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.amount_committed || 0), 0);
  const milestonesDone = milestones.filter((m) => m.status === 'done').length;
  const overdueMilestones = milestones.filter((m) => m.status !== 'done' && daysToDue(m.due_date) < 0);

  const incomeTotal = budget
    .filter((b) => b.type === 'income')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const expenseTotal = budget
    .filter((b) => b.type === 'expense')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const lines: string[] = [];
  lines.push(`# ZAOstock Snapshot - ${today}`);
  lines.push('');
  lines.push(`${days} days until Oct 3, 2026.`);
  lines.push('');
  lines.push('## Festival Health');
  lines.push('');
  lines.push(`- Artists locked: **${artistsLocked} of 10**`);
  lines.push(`- Sponsor dollars committed: **$${sponsorsCommitted.toLocaleString()} of $15,750 target**`);
  lines.push(`- Milestones done: **${milestonesDone} of ${milestones.length}**`);
  lines.push(`- Overdue milestones: **${overdueMilestones.length}**`);
  lines.push(`- Budget: **$${incomeTotal.toLocaleString()} income vs $${expenseTotal.toLocaleString()} expenses**`);
  lines.push('');

  lines.push('## Sponsor Pipeline');
  lines.push('');
  const sponsorGroups: Record<string, Sponsor[]> = {};
  for (const s of sponsors) {
    if (!sponsorGroups[s.status]) sponsorGroups[s.status] = [];
    sponsorGroups[s.status].push(s);
  }
  const sponsorOrder = ['paid', 'committed', 'in_talks', 'contacted', 'lead', 'declined'];
  for (const status of sponsorOrder) {
    const list = sponsorGroups[status];
    if (!list || list.length === 0) continue;
    lines.push(`### ${status.toUpperCase().replace('_', ' ')} (${list.length})`);
    for (const s of list) {
      const dollars = Number(s.amount_committed) > 0 ? ` - $${Number(s.amount_committed).toLocaleString()}` : '';
      const owner = s.owner ? ` [${s.owner.name}]` : '';
      lines.push(`- ${s.name} (${s.track})${dollars}${owner}`);
    }
    lines.push('');
  }

  lines.push('## Artist Pipeline');
  lines.push('');
  const artistGroups: Record<string, Artist[]> = {};
  for (const a of artists) {
    if (!artistGroups[a.status]) artistGroups[a.status] = [];
    artistGroups[a.status].push(a);
  }
  const artistOrder = ['travel_booked', 'confirmed', 'interested', 'contacted', 'wishlist', 'declined'];
  for (const status of artistOrder) {
    const list = artistGroups[status];
    if (!list || list.length === 0) continue;
    lines.push(`### ${status.replace('_', ' ').toUpperCase()} (${list.length})`);
    for (const a of list) {
      const genre = a.genre ? ` - ${a.genre}` : '';
      const outreach = a.outreach ? ` [${a.outreach.name}]` : '';
      lines.push(`- ${a.name}${genre}${outreach}`);
    }
    lines.push('');
  }

  if (overdueMilestones.length > 0) {
    lines.push('## Overdue Milestones');
    lines.push('');
    for (const m of overdueMilestones) {
      const owner = m.owner ? ` [${m.owner.name}]` : '';
      lines.push(`- ${m.title} (due ${m.due_date}, ${Math.abs(daysToDue(m.due_date))}d overdue)${owner}`);
    }
    lines.push('');
  }

  lines.push('## Upcoming Milestones (next 14 days)');
  lines.push('');
  const upcoming = milestones
    .filter((m) => m.status !== 'done')
    .filter((m) => {
      const d = daysToDue(m.due_date);
      return d >= 0 && d <= 14;
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  if (upcoming.length === 0) {
    lines.push('- None in next 14 days.');
  } else {
    for (const m of upcoming) {
      const owner = m.owner ? ` [${m.owner.name}]` : '';
      lines.push(`- ${m.due_date}: ${m.title} (${m.category})${owner}`);
    }
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('Generated by ZAOstock dashboard');

  return lines.join('\n');
}

export function SnapshotButton(props: Props) {
  function exportSnapshot() {
    const md = buildMarkdown(props);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zaostock-snapshot-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard() {
    const md = buildMarkdown(props);
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // fallback: open in new tab
      const w = window.open('', '_blank');
      if (w) {
        w.document.body.style.whiteSpace = 'pre-wrap';
        w.document.body.style.fontFamily = 'monospace';
        w.document.body.textContent = md;
      }
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportSnapshot}
        className="text-[10px] text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded px-2 py-1 transition-colors"
        title="Download snapshot as markdown file"
      >
        Download snapshot
      </button>
      <button
        onClick={copyToClipboard}
        className="text-[10px] text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded px-2 py-1 transition-colors"
        title="Copy snapshot to clipboard"
      >
        Copy
      </button>
    </div>
  );
}
