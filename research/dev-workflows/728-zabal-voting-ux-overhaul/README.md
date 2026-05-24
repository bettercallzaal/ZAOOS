---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-24
related-docs: 665, 707, 708, 710
tier: STANDARD
---

# 728 — zabal.art voting UX overhaul: link fixes + optimistic UI + perceived speed

> **Goal:** Audit the live zabal.art hub for the bugs Zaal reported ("voting UI is really bad and slow, some links are wrong"). Identify each specific issue. Land a prioritized PR-ready spec to fix link first, then perceived speed (optimistic UI), then polish.

> **TL;DR:** One confirmed broken link (zaofestivals.com is dead - returns connection-error). Voting feels slow because: (a) the click waits for a POST round-trip BEFORE updating the UI, (b) it then makes a SECOND fetch for totals after the POST, (c) all buttons disable during the wait, (d) no Suspense streaming on initial load so TTFB is gated on 3 Supabase RPCs serialized into the server component. Fix order: kill the dead link, add `useOptimistic` for the vote cards, remove the second fetch, add Suspense skeletons on the leaderboard. Polish (motion, pulse, confetti) last.

## Key Decisions / Recommendations

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Dead link** | REMOVE or replace the `zaofestivals.com` portal card - the domain doesn't respond (HTTP 000, connection-error). Either pull the card entirely OR point at an interim URL (`thezao.com/festivals`, or just `https://x.com/ZAOFestivals` as a placeholder until the site comes back) |
| 2 | **Voting feels slow** | Use **React 19 `useOptimistic`** so the tapped mode visually locks in + percentages update INSTANTLY on click. Server confirmation reconciles in background. Eliminate the post-vote `/api/week-totals` fetch entirely - the optimistic state is the source of truth until the next page revalidate |
| 3 | **Disabled-all-while-pending** | DROP the `disabled={isPending}` on the whole grid. Only disable the SPECIFIC mode that was just tapped, for the ~200ms the transition takes. Lets users re-aim if they tap wrong |
| 4 | **Initial TTFB slow** | Wrap the leaderboard table + week totals in `<Suspense fallback={<Skeleton/>}>` so the hero + vote cards stream first. Leaderboard slides in when ready. React 19 + Next.js 16 supports this natively |
| 5 | **No motion** | Add a 300ms ease on the percentage-bar `width` transition (already in /demo client, missing in the live one). Pulse animation on the "live" status indicator. Optional confetti on first vote of the week (per `ItsMyScreen` pattern) |
| 6 | **Polish phase** | After speed is fixed: skeleton loaders during initial load, "live" badge with pulsing dot, vote-power tooltip explaining the formula, smooth fade-in on leaderboard rows |
| 7 | **Don't refetch on success** | The post-vote `await fetch('/api/week-totals')` adds 200-800ms to the perceived vote time. Drop it. The optimistic update IS the new state; the next user-triggered render will fetch fresh totals via the server component |

## Part 1 — Live audit (current state)

Code read from `/Users/zaalpanthaki/Documents/ZABAL/src/app/_components/ZabalVoteClient.tsx` and `ZabalHub.tsx`, 2026-05-24.

### Voting flow today

```ts
// ZabalVoteClient.castVote() - current implementation
function castVote(mode) {
  if (!fid || !votePower) return setStatus(...);
  setStatus('Submitting...');                       // <- user sees "Submitting..."
  startTransition(async () => {
    const res = await fetch('/api/vote', { POST }); // <- WAIT: round-trip 1
    // ...handle response
    setCurrentMode(data.new_mode);                  // <- NOW the card highlights
    setStatus('Locked in ' + data.new_mode);
    const tot = await fetch('/api/week-totals');    // <- WAIT: round-trip 2
    setTotals(d.totals);                            // <- NOW the % bars move
  });
}
```

Timeline a user actually feels (Warpcast in-app browser, ~150ms RTT):
- 0ms: tap
- ~10ms: button disables, "Submitting..." appears
- ~150-400ms: POST /api/vote returns -> card highlights (still in pending state, all buttons disabled)
- ~300-800ms: GET /api/week-totals returns -> % bars finally update

Total perceived: 300-800ms of "frozen" UI before anything changes. With the disabled-everything-during-pending, this reads as "broken."

### Initial page load today

`src/app/page.tsx`:

```ts
export const dynamic = 'force-dynamic';

export default async function ZabalPage() {
  const [totals, leaders, topWinner] = await Promise.all([
    getWeekTotals(),    // Supabase RPC #1
    getLeaderboard(),   // Supabase RPC #2
    getTopWinner(),     // Supabase RPC #3
  ]);
  return (<main>...</main>);
}
```

The whole page TTFB is gated on the slowest of the 3 RPCs. No streaming. Even though the hero/vote-cards don't NEED the leaderboard data, they wait for it.

### Link audit (all 8 ecosystem cards verified 2026-05-24)

| Card | URL | HTTP |
|------|-----|------|
| The ZAO | `thezao.com` | 200 |
| **ZAO Festivals** | `zaofestivals.com` | **000 (DEAD)** |
| WaveWarZ | `www.wavewarz.com` | 200 |
| ZAO OS | `zaoos.com` | 200 |
| BCZ YapZ | `bczyapz.com` | 200 |
| ZAO Nexus | `www.thezao.com/nexus` | 200 |
| Empire Builder | `empirebuilder.world` | 200 |
| BetterCallZaal | `bettercallzaal.com` | 200 |

ONE broken card. The rest resolve.

## Part 2 — Best practices (2026)

### Optimistic UI (React 19 + Next.js 16)

Three recent reference implementations confirm the pattern:
- [Optimistic UI Patterns - iloveblogs.blog](https://www.iloveblogs.blog/guides/nextjs-supabase-optimistic-ui-patterns) - canonical `useOptimistic` + Supabase Realtime pattern
- [Picksy](https://github.com/amitmishrg/picksy) - 2-choice voting app, "Optimistic UI - results appear instantly before the server confirms" (Next.js 16 + Prisma + react-query)
- [ItsMyScreen](https://github.com/SriramDivi1/ItsMyScreen) - real-time polling app, "Optimistic UI - Instant feedback when you vote; state updates before server response" (Next.js 16 + Supabase Realtime)

**The rule:** if being wrong for 200ms wouldn't confuse or harm the user, update the UI immediately and reconcile after. Voting on a 4-mode weekly poll is exactly that case.

**Pattern for our `castVote`:**

```ts
// New: useOptimistic over totals + current mode
const [optimisticTotals, addOptimisticVote] = useOptimistic(
  totals,
  (state, action: { mode: Mode; prevMode: Mode | null; power: number }) => {
    const next = state.map((t) => ({ ...t }));
    // Remove from previous mode if switching
    if (action.prevMode) {
      const prev = next.find((t) => t.mode === action.prevMode);
      if (prev) prev.total_power = Math.max(0, prev.total_power - action.power);
    }
    // Add to new mode
    const tgt = next.find((t) => t.mode === action.mode);
    if (tgt) tgt.total_power = Number(tgt.total_power) + action.power;
    else next.push({ mode: action.mode, vote_count: 1, total_power: action.power });
    return next;
  },
);

function castVote(mode: Mode) {
  if (!fid || !votePower) return setStatus(...);
  const prev = currentMode;
  startTransition(async () => {
    addOptimisticVote({ mode, prevMode: prev, power: votePower.power }); // INSTANT
    setCurrentMode(mode);                                                 // INSTANT
    setStatus(prev && prev !== mode ? `Switched to ${mode}` : `Locked in ${mode}`);
    try {
      await fetch('/api/vote', { method: 'POST', ... });
      // No second fetch - optimistic state holds. revalidatePath on the
      // server action will hydrate fresh totals on next navigation.
    } catch {
      setStatus('Vote failed - try again'); // optimistic auto-rolls back
    }
  });
}
```

Timeline new:
- 0ms: tap
- ~5ms: card highlights, percentages animate to new values, status flips to "Locked in"
- background: POST /api/vote runs in parallel; on failure, optimistic state reverts + error shows

Perceived speed: **instant**.

### Suspense streaming (initial load)

```tsx
// src/app/page.tsx
export default function ZabalPage() {
  return (
    <main>
      <ZabalNav />
      <Hero />
      <Suspense fallback={<VoteCardsSkeleton />}>
        <VoteSection />   {/* awaits getWeekTotals */}
      </Suspense>
      <ZabalTokenPanel />     {/* static, no data */}
      <ZabalEcosystem />      {/* static */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardSection />  {/* awaits getLeaderboard */}
      </Suspense>
      <Suspense fallback={null}>
        <SpotlightSummary />    {/* awaits getTopWinner */}
      </Suspense>
      <ZabalAbout />
    </main>
  );
}
```

Hero + token + ecosystem render immediately. Vote cards arrive in ~150ms. Leaderboard streams in last. No more "blank page for 600ms then everything at once."

### Per-mode pending state, not whole-grid

```tsx
const [pendingMode, setPendingMode] = useState<Mode | null>(null);

<button
  disabled={pendingMode === m.id}
  style={{ opacity: pendingMode === m.id ? 0.7 : 1, transition: 'opacity 0.15s' }}
>
```

Only the tapped card dims for the ~200ms the transition takes. Other modes stay clickable.

### Motion polish

```css
/* Percentage bar */
transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Status badge - live dot */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}
```

Both standard. The pct-bar transition is already in the demo client (`/demo`) but missing from the live one - easy port.

## Part 3 — Comparison: what good voting UIs do

| App | Vote feel | Visual feedback | Mistake-recovery |
|-----|-----------|-----------------|------------------|
| **Snapshot (snapshot.org)** | Wait for tx confirmation (web3-native, expected) | Vote weight + your address shown; submitted state explicit | None - vote is onchain |
| **Tally** | Same as Snapshot - wait for chain | Bar chart updates; user's vote highlighted | None (onchain) |
| **Picksy** | INSTANT via optimistic | Animated split bar with spring transitions; "you're in the majority/minority" badge | One change allowed before locking |
| **ItsMyScreen** | INSTANT via optimistic + Supabase Realtime | Live percentage bars; "live" pulsing badge; confetti on first vote | "Change vote" button stays available |
| **ZABAL today** | Wait for POST + second fetch | Card highlights AFTER server confirms; whole grid disabled | Can switch but full wait again |
| **ZABAL after fix** | INSTANT via optimistic | Card highlights + bars animate on tap; only tapped card dims briefly | Can switch any time |

The right peers are Picksy + ItsMyScreen - off-chain Web2-feel polls. Snapshot/Tally feels are wrong for us (we're not an onchain vote, the Empire Builder distribution is the onchain part - happens later async).

## Part 4 — Prioritized fix plan (PR-ready)

### P0 (~10 min, this PR)
- [ ] Remove or replace the `ZAO Festivals` card in `ZabalHub.tsx` (URL is dead). Recommend: keep the card, swap URL to `https://x.com/ZAOFestivals` (their X account, live), update blurb to "ZAOstock + ZAO-PALOOZA + ZAO CHELLA (site rebuild WIP)".
- [ ] Add the missing 300ms width transition on the percentage bar in `ZabalVoteClient.tsx`.

### P1 (~30 min, next PR)
- [ ] Refactor `castVote` to use `useOptimistic` (totals + currentMode). Delete the post-vote `/api/week-totals` fetch.
- [ ] Replace `disabled={isPending}` (whole grid) with per-mode `disabled={pendingMode === m.id}`.
- [ ] Same refactor on `ZabalSpotlightClient.tsx` for the spotlight vote button.

### P2 (~45 min, polish PR)
- [ ] Wrap `<VoteSection>`, `<LeaderboardSection>`, `<SpotlightSummary>` in `<Suspense fallback={<Skeleton/>}>` in `src/app/page.tsx`.
- [ ] Build `VoteCardsSkeleton` + `LeaderboardSkeleton` (Tailwind / inline-style gradient pulse).
- [ ] Add "live" pulsing-dot badge near the "Week power" indicator.
- [ ] Add a tiny confetti burst on first vote of the week (use `canvas-confetti` or pure CSS).

### P3 (later, optional)
- [ ] Supabase Realtime channel on `zabal_votes` so OTHER users' votes also stream in live without refresh.
- [ ] Vote-power tooltip explaining the formula on hover.
- [ ] "You're with the majority / minority" badge after voting (per Picksy).

## Specific Numbers

| Metric | Value |
|--------|-------|
| Ecosystem cards audited | 8 |
| Broken links | 1 (zaofestivals.com → 000) |
| Round-trips per vote today | 2 (POST /api/vote + GET /api/week-totals) |
| Perceived vote latency today | 300-800ms |
| Perceived vote latency after `useOptimistic` | ~5ms (one paint) |
| RPCs blocking initial TTFB | 3 (get_this_zabal_weeks_votes, get_zabal_leaderboard, get_zabal_spotlight_leaderboard) |
| React 19 `useOptimistic` stable since | Next.js 15 (Nov 2024); current ZAOOS is Next.js 16 - already supported |
| P0 fix size | ~10 lines |
| P1 fix size | ~60 lines |
| P2 fix size | ~120 lines (mostly skeletons) |

## Comparison — fix-order options

| Order | Why it works | Why it doesn't |
|-------|--------------|----------------|
| **P0 -> P1 -> P2 (recommended)** | Ship the link fix in minutes (visible win); follow with the speed fix (the user's #1 complaint); finish with polish | None - this is the right order |
| P1 first | Speed fix is biggest impact | Holds up the visible link bug for ~30 min |
| All-in-one | Single PR | Bigger diff, harder to review, link bug stays broken longer |

## Sources

- [Optimistic UI Patterns with Next.js Server Actions and Supabase Realtime](https://www.iloveblogs.blog/guides/nextjs-supabase-optimistic-ui-patterns) - the canonical 2026 useOptimistic + Supabase pattern (verified 2026-05-24)
- [Optimistic Updates in Next.js 14 - DEV Community](https://dev.to/whoffagents/optimistic-updates-in-nextjs-14-useoptimistic-server-actions-and-automatic-rollback-5hbl) - LikeButton + CommentSection + automatic rollback example
- [React 19 useOptimistic - DEV Community](https://dev.to/whoffagents/react-19-useoptimistic-instant-ui-updates-without-complexity-2h24) - pending-vs-confirmed state pattern, when NOT to use it (payments, irreversible ops)
- [Picksy on GitHub](https://github.com/amitmishrg/picksy) - 2-choice voting app reference implementation, Next.js 16 + Prisma, optimistic results
- [ItsMyScreen on GitHub](https://github.com/SriramDivi1/ItsMyScreen) - real-time polling app, Next.js 16 + Supabase Realtime, optimistic + confetti
- Code: `/Users/zaalpanthaki/Documents/ZABAL/src/app/_components/ZabalVoteClient.tsx` (current), `ZabalHub.tsx` (link audit)
- Live link checks via `curl -L --max-time 5` (2026-05-24)

All URLs verified 2026-05-24.

## Also See

- [Doc 665 - ZABAL haatz + rollup](../../infrastructure/665-zabal-haatz-voting-rollup-decision/)
- [Doc 707 - mini app conformance](../../farcaster/707-zabal-miniapp-conformance/)
- [Doc 708 - ZABAL hub architecture](../../business/708-zabal-hub-landing-page/)
- [Doc 710 - mini app registration + deep-linking](../../farcaster/710-miniapp-registration-deeplinking/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| P0 PR - fix ZAO Festivals dead link + add 300ms pct-bar transition | @Zaal / Claude | Code PR | Today |
| P1 PR - useOptimistic refactor of castVote + per-mode disabled state + drop post-vote /week-totals fetch | @Zaal / Claude | Code PR | Today/tomorrow |
| P2 PR - Suspense streaming + skeleton loaders + live dot + confetti | @Zaal / Claude | Code PR | This week |
| Decide on Supabase Realtime for cross-user live updates (P3) | @Zaal | Decision | After P2 lands |
| Re-validate the 8 ecosystem links | @Zaal | Cron / scripted check | Monthly |
