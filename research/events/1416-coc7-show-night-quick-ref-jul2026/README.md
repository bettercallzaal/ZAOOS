---
topic: events/coc-concertz
type: quick-ref
status: SHOW DAY
show-date: 2026-07-18T20:00:00Z
related-docs: 1284 (show brief), 1414 (social kit), 1371 (reusable playbook)
---

# 1416 — COC #7 Show-Night Quick Reference (July 18, 2026)

> **One-pager for Zaal during the live show.** Copy commands, open links, post socials. Full runbook: CoCConcertZ repo PR #30 `docs/coc7-show-night-runbook.md`. Social kit: ZAOOS doc 1414.

---

## Critical Links

| What | URL |
|------|-----|
| Venue | Spatial.io — "Dope Stilo Music Club" |
| Ticket / Entry | https://ticket.cocconcertz.com |
| Twitch stream | https://twitch.tv/bettercallzaal |
| Admin panel | https://www.cocconcertz.com/admin |
| Live metrics | https://www.cocconcertz.com/api/metrics/coc7 |
| WaveWarZ | https://wavewarz.info |

---

## Pre-Show Blockers (clear before 4PM EST)

- [ ] **Cloudinary key**: Cloudinary console -> Settings -> Access Keys -> re-enable or generate new key -> update `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` in Vercel -> redeploy. Gallery uploads will fail until this is done.
- [ ] **Wallet gate OFF**: Vercel dashboard -> cocconcertz -> Env Vars -> set `NEXT_PUBLIC_WALLET_GATE_ENABLED=false` -> redeploy. Without this, archive uploads require 100M ZABAL.
- [ ] **PR #50 merged** (peak viewer tracking). If not merged: Vercel rate limit is the blocker — upgrade plan or manually merge.

---

## Battle Commands (terminal in coc/ with `.env.local`)

```bash
# Start a battle
npx tsx scripts/manage-battle.ts create "Battle Title" "Artist/Song A" "Artist/Song B"

# Check live vote counts
npx tsx scripts/manage-battle.ts status

# Close battle and see winner
npx tsx scripts/manage-battle.ts close
```

**Timing**: `create` opens the vote. Post the T+30 social WHEN you run `create`. Close after 15-20 min.

---

## Show Timing Cheat Sheet

| EST | Action |
|-----|--------|
| 3:00 PM | T-1h: final social push (Telegram + X) |
| 3:30 PM | T-30: countdown post (all platforms) |
| 4:00 PM | GO LIVE: go-live post, open venue stream |
| ~4:15 | T+15: post viewer count from /api/metrics/coc7 → concurrentViewers |
| ~4:30 | T+30: `manage-battle.ts create` → post battle vote activation |
| ~5:00 | T+60: mid-show energy post |
| ~5:30 | T+90: close battle + post wrap with peak viewer count |
| After | Run `npx tsx scripts/generate-pilot-report.ts` Saturday morning |

Social copy: ZAOOS doc 1414 (research/events/1414-coc7-show-day-social-kit-jul2026/).

---

## Metrics During Show

```
GET https://www.cocconcertz.com/api/metrics/coc7
```

Key fields:
- `concurrentViewers` — live count (use at T+15 post)
- `peakViewers` — highest concurrent so far (use at wrap post; requires PR #50 merged)
- `fanGalleryUploads` — gallery count
- `archiveUploads.total` — Arweave archive

---

## WaveWarZ Numbers to Drop During Show

| Stat | Number |
|------|--------|
| Total battles | 1,245 |
| Total volume | 524 SOL (~$39,000) |
| Artist payouts | 9.07 SOL (~$680) |
| Charity raised | $1,497 (2 HuRya rounds) |
| Artist payout rate | ~1.73% of every trade |

---

## Post-Show (Saturday Morning)

```bash
# In coc/ with .env.local
npx tsx scripts/generate-pilot-report.ts
```

Compare output to doc 1393 (gate matrix). Decision: which gate level? -> Lock COC #8 date Monday July 21.

---

## Emergency Escalation

- Fire admin issue: admin panel at /admin
- Cloudinary 500: check key permissions (not just the env var update — permissions must be enabled in Cloudinary console)
- Battle stuck: `manage-battle.ts close` always works, even if UI looks stuck
- Viewer count 0: if PR #50 missed, concurrent count still shows — peak just won't be tracked
