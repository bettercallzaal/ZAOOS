# Fractals Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `/fractals` page into a full transparency dashboard showing all ZAO Respect data across both eras (OG + ORDAO), with analytics, member profiles, session history, and on-chain verification links.

**Architecture:** CSV import script loads historical Airtable + ORDAO awards data into existing Supabase tables. New analytics API route aggregates stats. Dashboard UI adds an Analytics tab with stat cards, participation charts, and member drill-down. All data traceable to source (Airtable row or Optimism tx hash).

**Tech Stack:** Next.js 16 App Router, Supabase (existing tables), Node.js CSV parsing (papaparse), Tailwind CSS v4, viem for on-chain reads.

---

## File Map

**Create:**
- `scripts/import-fractal-history.ts` — CLI script to import Airtable CSVs + awards CSVs into Supabase
- `src/app/api/fractals/analytics/route.ts` — GET: aggregated stats for dashboard
- `src/app/api/fractals/member/[wallet]/route.ts` — GET: individual member profile + history
- `src/app/(auth)/fractals/AnalyticsTab.tsx` — new tab with stat cards + charts + member drill-down

**Modify:**
- `src/app/(auth)/fractals/FractalsClient.tsx` — add Analytics tab
- `src/app/(auth)/fractals/SessionsTab.tsx` — add on-chain tx links, era badges

---

## Phase 1: Data Import Script

### Task 1: CSV Import Script

**Files:**
- Create: `scripts/import-fractal-history.ts`

This script reads the 6 Airtable CSVs + 3 awards CSVs, reconciles them, and upserts into Supabase `fractal_sessions`, `fractal_scores`, and `respect_members` tables. Run once to bootstrap, then re-runnable for updates.

- [ ] **Step 1: Install papaparse**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npm install papaparse && npm install -D @types/papaparse
```

- [ ] **Step 2: Create the import script**

```typescript
// scripts/import-fractal-history.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_DIR = path.join(__dirname, '..', 'csv import');
const AWARDS_DIR = path.join(process.env.HOME!, 'Downloads');

// Fibonacci scoring by era
const FIBONACCI_1X = [55, 34, 21, 13, 8, 5]; // level 6 down to 1
const FIBONACCI_2X = [110, 68, 42, 26, 16, 10];

// --- Parse Airtable CSVs ---

interface SummaryRow {
  Name: string;
  'ETH WALLET (from Wallet Data 2)': string;
  'Total Points': string;
  'actual ZAO onchain': string;
  'ZRespect Sum': string;
  'Form/Intros Sum': string;
  'Fractal Host sum': string;
  'ZAO Festivals sum': string;
}

interface RespectRow {
  Name: string;
  'Total Points from Summary': string;
  'SUM of Fractals': string;
  [key: string]: string;
}

interface AwardsRow {
  recipient: string;
  denomination: string;
  mintType: string;
  periodNumber: string;
  meetingNumber: string;
  groupNum: string;
  level: string;
  title: string;
  reason: string;
  tokenId: string;
  mintTs: string;
  mintTxHash: string;
}

function parseCSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse<T>(content, { header: true, skipEmptyLines: true });
  return result.data;
}

async function importMembers() {
  console.log('--- Importing members from Summary CSV ---');
  const rows = parseCSV<SummaryRow>(path.join(CSV_DIR, 'Summary-Grid view.csv'));
  let imported = 0;

  for (const row of rows) {
    const name = row.Name?.trim();
    const wallet = row['ETH WALLET (from Wallet Data 2)']?.trim()?.toLowerCase();
    if (!name) continue;

    const { error } = await supabase.from('respect_members').upsert({
      name,
      wallet_address: wallet || null,
      total_respect: Number(row['Total Points']) || 0,
      fractal_respect: Number(row['ZRespect Sum']) || 0,
      event_respect: Number(row['Form/Intros Sum']) || 0,
      hosting_respect: Number(row['Fractal Host sum']) || 0,
      bonus_respect: Number(row['ZAO Festivals sum']) || 0,
      onchain_og: Number(row['actual ZAO onchain']) || 0,
    }, { onConflict: 'name' });

    if (error) console.error(`  Failed: ${name}`, error.message);
    else imported++;
  }
  console.log(`  Imported ${imported}/${rows.length} members`);
}

async function importOGSessions() {
  console.log('--- Importing OG era sessions (Fractals 1-73) ---');
  const rows = parseCSV<RespectRow>(path.join(CSV_DIR, 'Respect-Grid view.csv'));
  const walletRows = parseCSV<{ Name: string; 'ETH WALLET': string }>(
    path.join(CSV_DIR, 'Wallet Data-Grid view.csv')
  );
  const walletMap = new Map<string, string>();
  for (const w of walletRows) {
    if (w.Name && w['ETH WALLET']) walletMap.set(w.Name.trim(), w['ETH WALLET'].trim().toLowerCase());
  }

  // Extract fractal numbers from column headers
  const headers = Object.keys(rows[0] || {});
  const fractalCols = headers.filter(h =>
    /^ZAO (Fractal|Fractactal|Fractctal|Respect|FRACTAL) (\d+\.?\d*)( Respect)?$/i.test(h.replace(' #', ' '))
  );

  let sessionsCreated = 0;
  let scoresCreated = 0;

  for (const colName of fractalCols) {
    // Extract fractal number
    const match = colName.match(/(\d+\.?\d*)/);
    if (!match) continue;
    const fractalNum = match[1];
    const fractalNumFloat = parseFloat(fractalNum);

    // Skip ORDAO era (74+) — those come from awards.csv
    if (fractalNumFloat >= 74) continue;

    // Determine scoring era
    const scoringEra = fractalNumFloat <= 52 ? '1x' : '2x';

    // Collect non-zero scores for this fractal
    const scores: { name: string; wallet: string | null; score: number }[] = [];
    for (const row of rows) {
      const val = Number(row[colName]);
      if (val > 0) {
        scores.push({
          name: row.Name?.trim(),
          wallet: walletMap.get(row.Name?.trim()) || null,
          score: val,
        });
      }
    }

    if (scores.length === 0) continue;

    // Sort by score descending to assign ranks
    scores.sort((a, b) => b.score - a.score);

    // Create session
    const { data: session, error: sessionErr } = await supabase
      .from('fractal_sessions')
      .upsert({
        name: `ZAO Fractal ${fractalNum}`,
        session_date: null, // dates not in CSV
        scoring_era: scoringEra,
        participant_count: scores.length,
        notes: `OG era — imported from Airtable CSV`,
      }, { onConflict: 'name' })
      .select('id')
      .single();

    if (sessionErr || !session) {
      // Try insert instead (upsert may not work without unique constraint on name)
      const { data: inserted, error: insertErr } = await supabase
        .from('fractal_sessions')
        .insert({
          name: `ZAO Fractal ${fractalNum}`,
          session_date: null,
          scoring_era: scoringEra,
          participant_count: scores.length,
          notes: `OG era — imported from Airtable CSV`,
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error(`  Session ${fractalNum} failed:`, insertErr.message);
        continue;
      }
      if (!inserted) continue;

      sessionsCreated++;
      const sessionId = inserted.id;

      // Insert scores
      for (let i = 0; i < scores.length; i++) {
        const { error: scoreErr } = await supabase.from('fractal_scores').insert({
          session_id: sessionId,
          member_name: scores[i].name,
          wallet_address: scores[i].wallet,
          rank: i + 1,
          score: scores[i].score,
        });
        if (!scoreErr) scoresCreated++;
      }
    } else {
      sessionsCreated++;
      const sessionId = session.id;

      for (let i = 0; i < scores.length; i++) {
        const { error: scoreErr } = await supabase.from('fractal_scores').insert({
          session_id: sessionId,
          member_name: scores[i].name,
          wallet_address: scores[i].wallet,
          rank: i + 1,
          score: scores[i].score,
        });
        if (!scoreErr) scoresCreated++;
      }
    }
  }

  console.log(`  Created ${sessionsCreated} sessions, ${scoresCreated} scores`);
}

async function importOrdaoAwards() {
  console.log('--- Importing ORDAO era awards (Meetings 74-90+) ---');
  const files = ['awards.csv', 'awards (2).csv', 'awards (3).csv'];
  const allAwards: AwardsRow[] = [];

  for (const file of files) {
    const filePath = path.join(AWARDS_DIR, file);
    if (fs.existsSync(filePath)) {
      const rows = parseCSV<AwardsRow>(filePath);
      allAwards.push(...rows);
      console.log(`  Loaded ${rows.length} awards from ${file}`);
    }
  }

  // Group by meeting + group
  const groups = new Map<string, AwardsRow[]>();
  for (const award of allAwards) {
    const key = `${award.meetingNumber}-${award.groupNum}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(award);
  }

  let sessionsCreated = 0;
  let scoresCreated = 0;

  for (const [key, awards] of groups) {
    const [meetingNum, groupNum] = key.split('-');
    const sessionName = `ZAO Fractal ${meetingNum} - Group ${groupNum}`;

    // Get timestamp from first award for the date
    const ts = awards[0]?.mintTs ? new Date(Number(awards[0].mintTs) * 1000) : null;
    const sessionDate = ts ? ts.toISOString().split('T')[0] : null;

    const { data: session, error: sessionErr } = await supabase
      .from('fractal_sessions')
      .insert({
        name: sessionName,
        session_date: sessionDate,
        scoring_era: '2x',
        participant_count: awards.length,
        notes: `ORDAO era — on-chain verified. Tx: ${awards[0]?.mintTxHash || 'unknown'}`,
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      console.error(`  Session ${sessionName} failed:`, sessionErr?.message);
      continue;
    }

    sessionsCreated++;

    for (const award of awards) {
      const { error: scoreErr } = await supabase.from('fractal_scores').insert({
        session_id: session.id,
        member_name: award.recipient.toLowerCase(), // wallet as name for now
        wallet_address: award.recipient.toLowerCase(),
        rank: 7 - Number(award.level), // level 6 = rank 1, level 1 = rank 6
        score: Number(award.denomination),
      });
      if (!scoreErr) scoresCreated++;
    }
  }

  console.log(`  Created ${sessionsCreated} sessions, ${scoresCreated} scores`);
}

async function main() {
  console.log('=== ZAO Fractal History Import ===\n');
  await importMembers();
  await importOGSessions();
  await importOrdaoAwards();
  console.log('\n=== Import complete ===');
}

main().catch(console.error);
```

- [ ] **Step 3: Run the import**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npx tsx scripts/import-fractal-history.ts
```

Expected: Members imported, OG sessions created, ORDAO awards imported. Check Supabase for data.

- [ ] **Step 4: Commit**

```bash
git add scripts/import-fractal-history.ts package.json package-lock.json
git commit -m "feat(fractals): add historical data import script (Airtable + ORDAO awards)"
```

---

## Phase 2: Analytics API

### Task 2: Analytics API Route

**Files:**
- Create: `src/app/api/fractals/analytics/route.ts`

Returns aggregated stats for the dashboard: totals, per-session participation, era breakdown, top contributors.

- [ ] **Step 1: Create the analytics route**

```typescript
// src/app/api/fractals/analytics/route.ts
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parallel queries for all analytics data
    const [
      membersResult,
      sessionsResult,
      scoresResult,
      topByFractalResult,
      recentSessionsResult,
    ] = await Promise.all([
      // Total members + respect stats
      supabaseAdmin
        .from('respect_members')
        .select('name, wallet_address, total_respect, fractal_respect, onchain_og, onchain_zor, fractal_count, event_respect, hosting_respect, bonus_respect, first_respect_at')
        .order('total_respect', { ascending: false }),

      // All sessions for timeline
      supabaseAdmin
        .from('fractal_sessions')
        .select('id, name, session_date, scoring_era, participant_count, notes, created_at')
        .order('name', { ascending: true }),

      // Score distribution
      supabaseAdmin
        .from('fractal_scores')
        .select('score, rank, wallet_address'),

      // Top by fractal respect
      supabaseAdmin
        .from('respect_members')
        .select('name, wallet_address, fractal_respect, fractal_count')
        .gt('fractal_respect', 0)
        .order('fractal_respect', { ascending: false })
        .limit(20),

      // Recent sessions with scores
      supabaseAdmin
        .from('fractal_sessions')
        .select(`
          id, name, session_date, scoring_era, participant_count, notes,
          fractal_scores ( member_name, wallet_address, rank, score )
        `)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const members = membersResult.data ?? [];
    const sessions = sessionsResult.data ?? [];
    const scores = scoresResult.data ?? [];

    // Compute aggregated stats
    const totalRespect = members.reduce((sum, m) => sum + Number(m.total_respect), 0);
    const totalFractalRespect = members.reduce((sum, m) => sum + Number(m.fractal_respect), 0);
    const totalOGOnchain = members.reduce((sum, m) => sum + Number(m.onchain_og), 0);
    const totalZOROnchain = members.reduce((sum, m) => sum + Number(m.onchain_zor), 0);
    const totalSessions = sessions.length;
    const totalParticipations = scores.length;
    const uniqueParticipants = new Set(scores.map(s => s.wallet_address).filter(Boolean)).size;
    const membersWithRespect = members.filter(m => Number(m.total_respect) > 0).length;

    // Era breakdown
    const ogSessions = sessions.filter(s => s.scoring_era === '1x').length;
    const ordaoSessions = sessions.filter(s => s.scoring_era === '2x').length;

    // Participation per session (for chart)
    const participationTimeline = sessions.map(s => ({
      name: s.name,
      date: s.session_date,
      era: s.scoring_era,
      participants: s.participant_count,
    }));

    // Score distribution (how many people got each score level)
    const scoreDistribution: Record<number, number> = {};
    for (const s of scores) {
      const score = Number(s.score);
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
    }

    // Respect distribution curve (top N members' share)
    const respectCurve = members
      .filter(m => Number(m.total_respect) > 0)
      .map(m => ({
        name: m.name,
        total: Number(m.total_respect),
        fractal: Number(m.fractal_respect),
        og: Number(m.onchain_og),
        zor: Number(m.onchain_zor),
        events: Number(m.event_respect),
        hosting: Number(m.hosting_respect),
        bonus: Number(m.bonus_respect),
        sessions: m.fractal_count ?? 0,
      }));

    // Category leaders
    const topHosters = members
      .filter(m => Number(m.hosting_respect) > 0)
      .sort((a, b) => Number(b.hosting_respect) - Number(a.hosting_respect))
      .slice(0, 10)
      .map(m => ({ name: m.name, value: Number(m.hosting_respect) }));

    return NextResponse.json({
      overview: {
        totalRespect,
        totalFractalRespect,
        totalOGOnchain,
        totalZOROnchain,
        totalSessions,
        totalParticipations,
        uniqueParticipants,
        membersWithRespect,
        totalMembers: members.length,
        ogSessions,
        ordaoSessions,
      },
      participationTimeline,
      scoreDistribution,
      respectCurve,
      topByFractal: topByFractalResult.data ?? [],
      topHosters,
      recentSessions: recentSessionsResult.data ?? [],
    });
  } catch (err) {
    console.error('Fractals analytics error:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/fractals/analytics/route.ts
git commit -m "feat(fractals): add GET /api/fractals/analytics for dashboard stats"
```

---

### Task 3: Member Profile API Route

**Files:**
- Create: `src/app/api/fractals/member/[wallet]/route.ts`

Returns a single member's full history — every fractal attended, rank, score, era, and on-chain tx links.

- [ ] **Step 1: Create the member route**

```typescript
// src/app/api/fractals/member/[wallet]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { wallet } = await params;
  const walletLower = wallet.toLowerCase();

  try {
    // Get member record
    const { data: member } = await supabaseAdmin
      .from('respect_members')
      .select('*')
      .eq('wallet_address', walletLower)
      .maybeSingle();

    if (!member) {
      // Try by name
      const { data: byName } = await supabaseAdmin
        .from('respect_members')
        .select('*')
        .eq('name', wallet)
        .maybeSingle();

      if (!byName) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
    }

    const memberData = member;
    const lookupWallet = memberData?.wallet_address || walletLower;
    const lookupName = memberData?.name || wallet;

    // Get all fractal scores for this member (by wallet or name)
    const { data: scores } = await supabaseAdmin
      .from('fractal_scores')
      .select(`
        rank,
        score,
        wallet_address,
        member_name,
        fractal_sessions (
          id, name, session_date, scoring_era, participant_count, notes
        )
      `)
      .or(`wallet_address.eq.${lookupWallet},member_name.eq.${lookupName}`)
      .order('created_at', { ascending: false });

    // Compute member stats
    const history = (scores ?? []).map(s => {
      const sess = Array.isArray(s.fractal_sessions) ? s.fractal_sessions[0] : s.fractal_sessions;
      const isOrdao = sess?.notes?.includes('ORDAO') || sess?.notes?.includes('on-chain');
      const txMatch = sess?.notes?.match(/Tx: (0x[a-fA-F0-9]+)/);
      return {
        sessionName: sess?.name ?? 'Unknown',
        sessionDate: sess?.session_date,
        era: sess?.scoring_era ?? '2x',
        rank: s.rank,
        score: s.score,
        participants: sess?.participant_count ?? 0,
        source: isOrdao ? 'ordao' : 'og',
        txHash: txMatch ? txMatch[1] : null,
      };
    });

    const totalFractalRespect = history.reduce((sum, h) => sum + h.score, 0);
    const firstPlace = history.filter(h => h.rank === 1).length;
    const avgRank = history.length > 0
      ? Math.round((history.reduce((sum, h) => sum + h.rank, 0) / history.length) * 10) / 10
      : 0;

    return NextResponse.json({
      member: memberData,
      history,
      stats: {
        totalSessions: history.length,
        totalFractalRespect,
        firstPlace,
        avgRank,
        ogSessions: history.filter(h => h.source === 'og').length,
        ordaoSessions: history.filter(h => h.source === 'ordao').length,
      },
    });
  } catch (err) {
    console.error('Member profile error:', err);
    return NextResponse.json({ error: 'Failed to load member profile' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/fractals/member/[wallet]/route.ts"
git commit -m "feat(fractals): add GET /api/fractals/member/[wallet] for member profiles"
```

---

## Phase 3: Dashboard UI

### Task 4: Analytics Tab Component

**Files:**
- Create: `src/app/(auth)/fractals/AnalyticsTab.tsx`

The main analytics dashboard with stat cards, participation chart, respect distribution, top contributors, and member drill-down.

- [ ] **Step 1: Create AnalyticsTab**

```typescript
// src/app/(auth)/fractals/AnalyticsTab.tsx
'use client';

import { useState, useEffect } from 'react';

interface Overview {
  totalRespect: number;
  totalFractalRespect: number;
  totalOGOnchain: number;
  totalZOROnchain: number;
  totalSessions: number;
  totalParticipations: number;
  uniqueParticipants: number;
  membersWithRespect: number;
  totalMembers: number;
  ogSessions: number;
  ordaoSessions: number;
}

interface TimelineEntry {
  name: string;
  date: string | null;
  era: string;
  participants: number;
}

interface RespectEntry {
  name: string;
  total: number;
  fractal: number;
  og: number;
  zor: number;
  events: number;
  hosting: number;
  bonus: number;
  sessions: number;
}

interface MemberHistory {
  sessionName: string;
  sessionDate: string | null;
  era: string;
  rank: number;
  score: number;
  participants: number;
  source: 'og' | 'ordao';
  txHash: string | null;
}

interface MemberProfile {
  member: Record<string, unknown>;
  history: MemberHistory[];
  stats: {
    totalSessions: number;
    totalFractalRespect: number;
    firstPlace: number;
    avgRank: number;
    ogSessions: number;
    ordaoSessions: number;
  };
}

interface AnalyticsData {
  overview: Overview;
  participationTimeline: TimelineEntry[];
  respectCurve: RespectEntry[];
  topByFractal: { name: string; fractal_respect: number; fractal_count: number }[];
  topHosters: { name: string; value: number }[];
}

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    fetch('/api/fractals/analytics')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMember = (walletOrName: string) => {
    setSelectedMember(walletOrName);
    setMemberLoading(true);
    fetch(`/api/fractals/member/${encodeURIComponent(walletOrName)}`)
      .then(r => r.json())
      .then(d => setMemberProfile(d))
      .catch(console.error)
      .finally(() => setMemberLoading(false));
  };

  if (loading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-8">Failed to load analytics.</p>;
  }

  const { overview, participationTimeline, respectCurve, topByFractal, topHosters } = data;

  // Participation chart: simple bar visualization
  const maxParticipants = Math.max(...participationTimeline.map(t => t.participants), 1);

  return (
    <div className="pt-2 space-y-5">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Total Respect', value: overview.totalRespect.toLocaleString(), sub: 'All sources combined' },
          { label: 'Sessions', value: overview.totalSessions.toString(), sub: `${overview.ogSessions} OG + ${overview.ordaoSessions} ORDAO` },
          { label: 'Participants', value: overview.uniqueParticipants.toString(), sub: `${overview.totalMembers} total members` },
          { label: 'On-Chain', value: `${overview.totalOGOnchain.toLocaleString()} OG`, sub: `${overview.totalZOROnchain.toLocaleString()} ZOR` },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1b2a] rounded-xl p-3">
            <p className="text-lg font-bold text-[#f5a623]">{stat.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-[10px] text-gray-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Era Comparison */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Era Comparison</h3>
        <div className="flex gap-3">
          <div className="flex-1 bg-[#0a1628] rounded-lg p-3 border border-gray-800">
            <p className="text-xs text-gray-400">OG Era (1-73)</p>
            <p className="text-lg font-bold text-white">{overview.ogSessions}</p>
            <p className="text-[10px] text-gray-600">sessions, 1x/2x Fibonacci, ERC-20</p>
          </div>
          <div className="flex-1 bg-[#0a1628] rounded-lg p-3 border border-[#f5a623]/20">
            <p className="text-xs text-[#f5a623]">ORDAO Era (74+)</p>
            <p className="text-lg font-bold text-white">{overview.ordaoSessions}</p>
            <p className="text-[10px] text-gray-600">sessions, 2x Fibonacci, ERC-1155</p>
          </div>
        </div>
      </div>

      {/* Participation Timeline */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Participation Over Time ({participationTimeline.length} sessions)
        </h3>
        <div className="flex items-end gap-px h-24 overflow-x-auto">
          {participationTimeline.map((entry, i) => {
            const height = (entry.participants / maxParticipants) * 100;
            const isOrdao = entry.era === '2x' && i >= participationTimeline.length - overview.ordaoSessions;
            return (
              <div
                key={`${entry.name}-${i}`}
                className="group relative flex-shrink-0"
                style={{ width: Math.max(4, 300 / participationTimeline.length) }}
              >
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    isOrdao ? 'bg-[#f5a623]' : 'bg-[#f5a623]/40'
                  } hover:bg-[#ffd700]`}
                  style={{ height: `${height}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[#0a1628] border border-gray-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                  {entry.name}: {entry.participants} members
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-600">Fractal 1</span>
          <span className="text-[10px] text-gray-600">Latest</span>
        </div>
      </div>

      {/* Respect Distribution */}
      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Respect Distribution (Top 20)
        </h3>
        <div className="space-y-1.5">
          {respectCurve.slice(0, 20).map((member, i) => {
            const maxTotal = respectCurve[0]?.total || 1;
            const pct = (member.total / maxTotal) * 100;
            return (
              <button
                key={member.name}
                onClick={() => loadMember(member.name)}
                className="w-full flex items-center gap-2 text-left hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors"
              >
                <span className="w-5 text-[10px] text-gray-600 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white truncate">{member.name}</span>
                    <span className="text-[10px] text-gray-500">{member.sessions}s</span>
                  </div>
                  <div className="h-1.5 bg-[#0a1628] rounded-full mt-0.5 overflow-hidden">
                    <div className="h-full rounded-full flex">
                      <div className="bg-[#f5a623]" style={{ width: `${(member.fractal / maxTotal) * 100}%` }} />
                      <div className="bg-[#f5a623]/40" style={{ width: `${(member.events / maxTotal) * 100}%` }} />
                      <div className="bg-[#f5a623]/20" style={{ width: `${((member.hosting + member.bonus) / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#f5a623] shrink-0">{member.total.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623]" /> Fractal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623]/40" /> Events</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f5a623]/20" /> Hosting/Bonus</span>
        </div>
      </div>

      {/* Top Hosts */}
      {topHosters.length > 0 && (
        <div className="bg-[#0d1b2a] rounded-xl p-4">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Top Fractal Hosts</h3>
          <div className="space-y-1">
            {topHosters.slice(0, 5).map((h, i) => (
              <div key={h.name} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-gray-600 text-right">{i + 1}</span>
                <span className="flex-1 text-gray-300 truncate">{h.name}</span>
                <span className="font-mono text-[#f5a623]">{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Drill-Down Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0d1b2a] w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto border border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-[#0d1b2a] z-10">
              <h3 className="text-sm font-semibold text-white">{selectedMember}</h3>
              <button
                onClick={() => { setSelectedMember(null); setMemberProfile(null); }}
                className="text-gray-500 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {memberLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-[#0a1628] rounded animate-pulse" />)}
              </div>
            ) : memberProfile ? (
              <div className="p-4 space-y-4">
                {/* Member stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-[#f5a623]">{memberProfile.stats.totalSessions}</p>
                    <p className="text-[10px] text-gray-500">Sessions</p>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-[#f5a623]">{memberProfile.stats.totalFractalRespect}</p>
                    <p className="text-[10px] text-gray-500">Fractal R</p>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{memberProfile.stats.avgRank}</p>
                    <p className="text-[10px] text-gray-500">Avg Rank</p>
                  </div>
                </div>

                {/* Era breakdown */}
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-[#f5a623]/10 text-[#f5a623]">
                    {memberProfile.stats.ogSessions} OG sessions
                  </span>
                  <span className="px-2 py-1 rounded bg-[#f5a623]/20 text-[#f5a623]">
                    {memberProfile.stats.ordaoSessions} ORDAO sessions
                  </span>
                  <span className="px-2 py-1 rounded bg-white/10 text-white">
                    {memberProfile.stats.firstPlace} first place
                  </span>
                </div>

                {/* Full history */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Session History</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {memberProfile.history.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 bg-[#0a1628] rounded">
                        <span className={`w-6 font-bold ${
                          h.rank === 1 ? 'text-yellow-400' :
                          h.rank === 2 ? 'text-gray-300' :
                          h.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          #{h.rank}
                        </span>
                        <span className="flex-1 text-gray-300 truncate">{h.sessionName}</span>
                        <span className="font-mono text-[#f5a623]">{h.score}</span>
                        {h.source === 'ordao' && (
                          <span className="text-[10px] px-1 rounded bg-[#f5a623]/10 text-[#f5a623]">on-chain</span>
                        )}
                        {h.txHash && (
                          <a
                            href={`https://optimistic.etherscan.io/tx/${h.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] text-[#f5a623]/50 hover:text-[#f5a623]"
                          >
                            tx
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-4 text-gray-500 text-sm">Member not found.</p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-gray-600 text-center">
        Data from Airtable (OG era) + ORDAO on-chain (Optimism). All on-chain data verifiable.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(auth)/fractals/AnalyticsTab.tsx"
git commit -m "feat(fractals): add AnalyticsTab with stats, charts, member drill-down"
```

---

### Task 5: Wire Up the Analytics Tab

**Files:**
- Modify: `src/app/(auth)/fractals/FractalsClient.tsx`

Add the Analytics tab to the tab bar and import the component.

- [ ] **Step 1: Update FractalsClient**

In `FractalsClient.tsx`, add the import and tab:

Add import:
```typescript
import { AnalyticsTab } from './AnalyticsTab';
```

Change the Tab type:
```typescript
type Tab = 'sessions' | 'leaderboard' | 'analytics' | 'proposals' | 'about';
```

Update the TABS array:
```typescript
  const TABS: { id: Tab; label: string }[] = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'proposals', label: 'Proposals' },
    { id: 'about', label: 'About' },
  ];
```

Add the tab content:
```typescript
        {activeTab === 'analytics' && <AnalyticsTab />}
```

- [ ] **Step 2: Build check**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npm run build 2>&1 | head -60
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/fractals/FractalsClient.tsx"
git commit -m "feat(fractals): add Analytics tab to /fractals page"
```

---

### Task 6: Enhance Sessions Tab with On-Chain Links

**Files:**
- Modify: `src/app/(auth)/fractals/SessionsTab.tsx`

Add era badge and on-chain verification link to each session.

- [ ] **Step 1: Update SessionsTab**

In the session button area, after the scoring era span, add an on-chain badge when notes contain a tx hash:

```typescript
// After the era span, add:
{session.notes?.includes('Tx:') && (
  <a
    href={`https://optimistic.etherscan.io/tx/${session.notes.match(/Tx: (0x[a-fA-F0-9]+)/)?.[1]}`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={e => e.stopPropagation()}
    className="text-[10px] text-[#f5a623]/50 hover:text-[#f5a623] ml-1"
  >
    [verify]
  </a>
)}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(auth)/fractals/SessionsTab.tsx"
git commit -m "feat(fractals): add on-chain verification links to session history"
```

---

### Task 7: Final Build + Commit

- [ ] **Step 1: Full build check**

```bash
cd "/Users/zaalpanthaki/Documents/ZAO OS V1" && npm run build 2>&1 | head -60
```

- [ ] **Step 2: Fix any TypeScript errors**

Common issues: missing `'use client'`, type mismatches, unused imports.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(fractals): complete analytics dashboard — import, API, UI, member profiles"
```

---

## Testing Checklist

- [ ] Run `npx tsx scripts/import-fractal-history.ts` — data appears in Supabase
- [ ] `/api/fractals/analytics` returns overview stats
- [ ] `/api/fractals/member/0x7234...` returns Zaal's profile
- [ ] `/fractals` Analytics tab shows stat cards
- [ ] Participation timeline chart renders with bars
- [ ] Respect distribution shows top 20 with segmented bars
- [ ] Clicking a member name opens drill-down modal
- [ ] ORDAO sessions show "on-chain" badge and tx link
- [ ] Tx links open correct Optimism Etherscan page
- [ ] Mobile layout works at 375px width

---

## Out of Scope (Phase 2)

- Real-time participation charts (recharts/d3)
- Wallet-connected on-chain submission from /fractals page
- Bot webhook integration for live session updates
- Weekly eligibility tracker
- OG Respect one-time distribution UI
- Decay mechanics
- Fractal DJ / music game types
