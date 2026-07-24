---
topic: technology, zoe, operations, press
type: tracker-spec
status: ACTIVE — ZOE runs the monthly stat pull on the 1st of each month and logs to ~/.zao/zoe/milestone-snapshots.jsonl. Stats cited in press pitches, grant applications, OP RF evidence packages, and Bonfire episodes must come from this tracker. Never cite stale numbers.
last-validated: 2026-07-18
related-docs: 1651-zao-dao-case-study-jul2026, 1201-zao-canonical-facts-ledger, 1427-wavewarz-zao-public-api-docs, 1619-fractal-democracy-session-guide
action-owner: ZOE (monthly pull and log); Zaal (reviews monthly summary, approves milestone announcements); Hurricane (WaveWarZ API source)
---

# 1710 — ZAO H2 2026 Milestone Tracker

> **What this is:** The spec for ZOE's monthly living tracker of ZAO's key publicly-citable metrics. Stats cited in press pitches, grant applications, OP RF evidence packages, and Bonfire episodes must be sourced from the most recent snapshot in this tracker. This prevents stale numbers from appearing in external communications.
>
> **Sources of truth:** WaveWarZ API (`wavewarz.info/api/public/stats`), Supabase (ZABAL S2 participants/attendance), Paragraph (newsletter subscribers), Optimism Mainnet (ZOR holders, OG Respect), GitHub (ZAOOS doc count).
>
> **Update cadence:** 1st of each month (Aug 1, Sep 1, Oct 1, Nov 1, Dec 1). ZOE pulls all stats and logs a snapshot. Any press or grant submission must reference the most recent snapshot date.

---

## The Metrics Table

ZOE tracks and logs these metrics monthly:

| Metric | Source | How ZOE Pulls It | Citable As |
|--------|--------|-----------------|-----------|
| Total WaveWarZ battles | WW API `/api/public/stats` → `totalBattles` | `fetch('wavewarz.info/api/public/stats')` | "X battles on WaveWarZ since launch" |
| Total SOL wagered | WW API → `totalVolume` | same | "X SOL wagered" |
| Total SOL paid to artists (losers + winners) | WW API → `artistPayouts` | same | "X SOL paid to artists" |
| SOL paid to losing artists specifically | WW API → `loserPayouts` (if available) or `artistPayouts * 0.25` (estimate) | same or calculate | "X SOL to losing artists via loser-earns" |
| ZOR token holders | Optimism ERC-1155 contract `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Alchemy/Infura `ownerOf` or `balanceOf` scan | "X ZOR soulbound token holders on Optimism" |
| OG Respect holders | Optimism ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | ERC-20 `transfer` event scan → unique non-zero holders | "X OG Respect holders on Optimism" |
| Fractal Democracy consecutive sessions | ZOE running counter in `fractal-sessions.jsonl` | Count entries | "X consecutive weekly Fractal Democracy sessions" |
| ZAOOS research docs | GitHub API: `https://api.github.com/repos/bettercallzaal/ZAOOS/git/trees/main?recursive=1` → count README.md files in `research/` | GitHub API | "X ZAOOS research docs in the public knowledge base" |
| Newsletter subscribers | Paragraph API (if available) OR Zaal confirms | Zaal confirms monthly | "X newsletter subscribers (The ZAO Brief)" |
| ZABAL S2 active participants | Supabase `zabal_s2_participants` WHERE status = 'ACCEPTED' | Supabase query | "X builders and musicians in ZABAL S2" |
| ZABAL S2 sessions held | Supabase `zabal_s2_attendance` GROUP BY session_number | Supabase query | "X of 12 ZABAL S2 sessions held" |
| ZAOstock tickets sold | Eventbrite API OR Zaal confirms | Zaal confirms monthly | "X ZAOstock 2026 tickets sold" |
| COC Concertz shows | ZOE running counter (COC series doc 1256) | Count from doc 1256 + session log | "X consecutive COC Concertz shows" |

---

## ZOE Monthly Pull Protocol

**Trigger:** 1st of each month (Aug 1, Sep 1, Oct 1, Nov 1, Dec 1).

**ZOE action: Pull all metrics and log snapshot**

```javascript
// ZOE runs this monthly:
async function pullMilestoneSnapshot() {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 1. WaveWarZ API
  const wwStats = await fetch('https://wavewarz.info/api/public/stats').then(r => r.json());
  
  // 2. ZAOOS doc count via GitHub API
  const zaoos = await fetch('https://api.github.com/repos/bettercallzaal/ZAOOS/git/trees/main?recursive=1', {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  }).then(r => r.json());
  const docCount = zaoos.tree.filter(f => f.path.includes('research/') && f.path.endsWith('/README.md')).length;

  // 3. ZABAL S2 from Supabase
  const { data: s2Active } = await supabase
    .from('zabal_s2_participants')
    .select('count')
    .eq('status', 'ACCEPTED');
  
  // 4. Fractal sessions from local jsonl
  const fractalSessions = JSON.parse(readFileSync('~/.zao/zoe/fractal-sessions.jsonl').split('\n').length);

  const snapshot = {
    date: timestamp,
    ww_battles: wwStats.totalBattles,
    ww_sol_wagered: wwStats.totalVolume,
    ww_sol_to_artists: wwStats.artistPayouts,
    zaoos_docs: docCount,
    fractal_sessions: fractalSessions,
    zabal_s2_participants: s2Active?.[0]?.count ?? 0,
    // Newsletter + tickets: filled by Zaal via Telegram command (see below)
    newsletter_subscribers: null,
    zaostock_tickets: null,
    zor_holders: null, // requires Optimism chain query — ZOE runs if Alchemy key available
  };

  appendFileSync('~/.zao/zoe/milestone-snapshots.jsonl', JSON.stringify(snapshot) + '\n');
  return snapshot;
}
```

**After pulling:**

ZOE sends Zaal a Telegram:
```
Monthly milestone snapshot pulled — [DATE].

WaveWarZ: [N] battles | [X] SOL wagered | [Y] SOL to artists
ZAOOS docs: [N]
Fractal sessions: [N] consecutive
ZABAL S2: [N] active participants

Need from you:
- Newsletter subscribers: ?
- ZAOstock tickets sold: ?
- ZOR holders (if changed): ?

Reply: milestone-update: newsletter=[N] tickets=[N] zor=[N]
```

ZOE fills the null fields when Zaal replies.

---

## Citable Sentence Templates

When writing press pitches, grant applications, or Bonfire episodes, ZOE uses these templates filled with the most recent snapshot:

**WaveWarZ battle stats:**
> "WaveWarZ has hosted [N] on-chain music battles since launch, with [X] SOL wagered and [Y] SOL paid out to artists. The loser-earns mechanic means every losing artist earns a share of the pool automatically — no exceptions."

**Fractal governance:**
> "ZAO has run Fractal Democracy governance sessions weekly without interruption for [N] consecutive weeks, with decisions recorded on Optimism Mainnet."

**ZOR governance:**
> "ZAO has [N] ZOR soulbound token holders on Optimism — each holder earns ZOR through ZABAL cohort completion and Fractal Democracy participation, not purchase."

**ZAOOS knowledge base:**
> "The ZAO Operating System (ZAOOS) contains [N]+ research docs on music, governance, technology, and community — all CC-BY licensed and publicly accessible at github.com/bettercallzaal/ZAOOS."

**ZABAL:**
> "ZABAL Season 2 has [N] active participants building music and technology infrastructure across 12 weekly sessions (Sep–Nov 2026)."

**Combined ZAO summary (press pitch opener):**
> "The ZAO is a music DAO with [N] consecutive Fractal Democracy sessions, [M] WaveWarZ on-chain music battles, [P] SOL paid to losing artists, and [Q] ZOR soulbound token holders on Optimism. Our ZAOOS knowledge base has [R]+ public research docs."

---

## Milestone Announcement Triggers

ZOE monitors the monthly snapshots and sends Zaal a special alert when a milestone is hit:

| Milestone | Trigger | ZOE action |
|-----------|---------|-----------|
| 2,000 WaveWarZ battles | `ww_battles >= 2000` | DM Zaal: "2,000 battles hit. Post-worthy." + draft announcement cast |
| 1,000 SOL wagered | `ww_sol_wagered >= 1000` | Same pattern |
| 100 consecutive Fractal sessions | `fractal_sessions >= 100` | DM Zaal + draft /zao cast + suggest Bonfire episode |
| 1,700 ZAOOS docs | `zaoos_docs >= 1700` | DM Zaal: "ZAOOS hit 1,700 docs — notable for OP RF evidence." |
| 200 /wavewarz Farcaster followers | (from ZOL) | DM Zaal (doc 1675 target) |
| ZAOstock 100 RSVPs | `zaostock_tickets >= 100` | DM Zaal + trigger milestone suite from doc 1479 |

**Draft announcement cast format (ZOE prepares, Zaal approves before posting):**
```
ZAO milestone: [what happened].

[N] [battles / sessions / docs / participants].

[One sentence on why this matters — never hype, always factual].

On-chain. Since [launch date].
```

---

## H2 2026 Snapshot History

ZOE builds this table from `~/.zao/zoe/milestone-snapshots.jsonl` on request:

| Date | WW Battles | SOL Wagered | SOL to Artists | ZAOOS Docs | Fractal Sessions | ZABAL S2 |
|------|-----------|-------------|---------------|-----------|-----------------|---------|
| Jul 18 2026 | 1,245 | 523.991 | 9.0988 | ~1,710 | ~97 | Pre-launch |
| Jul 24 2026 | 1,289 | 878.30 | 13.39 | ~1,841 | ~103 | Pre-launch |
| Aug 1 2026 | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [N] accepted |
| Sep 1 2026 | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [N] Week 1 |
| Oct 1 2026 | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [N] Week 5 |
| Nov 1 2026 | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [N] Week 9 |
| Dec 1 2026 | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | [ZOE fills] | Post-graduation |

The Jul 18 baseline comes from doc 1651 (ZAO DAO case study). ZOE's Aug 1 pull is the first automated snapshot.

---

## What This Unlocks for ZAO

**OP RF evidence packages:** OP RF requires citable, time-stamped on-chain evidence. ZOE's monthly snapshots provide exactly this — dated JSON entries that prove ongoing activity.

**Press pitches:** Journalists want the most current number. Hypebot (doc 1701), Water & Music (1465), and Green Pill (1500) pitches should all cite the latest snapshot, not the Jul 2026 case study.

**Bonfire episodes:** Each monthly pull can generate a Bonfire episode: "ZAO milestone snapshot: [DATE]. [N] battles, [X] SOL." This keeps the knowledge graph current.

**Grant applications:** Fisher, MAC, FA fiscal sponsorship, and Gitcoin all want current stats. Never cite stats older than the last snapshot for an active grant application.

---

## Sources

- `research/community/1651-zao-dao-case-study-jul2026/` — Jul 18 2026 baseline stats (source for the first row of snapshot history)
- `research/governance/1201-zao-canonical-facts-ledger/` — canonical facts; this tracker feeds updates to 1201
- `research/technology/1427-wavewarz-zao-public-api-docs/` — WaveWarZ API spec (`/api/public/stats` endpoint)
- `research/governance/1619-fractal-democracy-session-guide/` — Fractal session contract addresses + session format
- `research/governance/1706-zoe-fractal-weekly-ops-guide/` — fractal-sessions.jsonl source (ZOE logs each session)
