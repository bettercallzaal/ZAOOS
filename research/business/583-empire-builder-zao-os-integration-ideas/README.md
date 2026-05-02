---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-01
related-docs: 582, 361, 165
tier: STANDARD
---

# 583 - Empire Builder x ZAO OS: Integration Idea Surface

> **Goal:** Generate a concrete idea surface for what ZAO OS can build now that Empire Builder V3 is live (doc 582). Anchor every idea to a real V3 endpoint or a write endpoint Adrian gates separately. Used as input to the next brainstorm/design step for the ZABAL-channel integration.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| MVP scope (read-only, no key) | SHIP ideas 1 + 4 + 11 first. They surface live ZABAL data inside the `/zabal` channel and ecosystem page using only public V3 read endpoints. Difficulty 2-4 each. |
| Phase 2 (read + cross-post, polling) | SHIP ideas 3 + 13 + 14 once MVP is live. Adds distribution feed + auto-cast + stake-to-earn forecast. Polling, no webhook needed. Difficulty 4-6. |
| Phase 3 (write API, gated) | DEFER ideas 7 + 8 + 9 until Adrian confirms write endpoints (`distribute`, `burn`, `airdrop`) and rate limits + whitelisting. Difficulty 6-8. |
| API key handling | The user-mentioned API key is NOT needed for V3 public reads (no auth on documented endpoints per doc 582). If Adrian issued a key, it is for write/whitelisted endpoints only. Store in `.env.local` as `EMPIRE_BUILDER_API_KEY`, server-only, never exposed to client. |
| ZABAL token address | USE `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` (per doc 361). Discovery call returns slot UUIDs needed for all leaderboard fetches. |
| Where to surface in app | USE `src/components/chat/ChatRoom.tsx` side panel slot (next to RespectPanel) for in-channel reads. USE `src/app/(auth)/ecosystem/page.tsx` to replace iframe with native hero. |
| First file to create | USE `src/lib/empire-builder/client.ts` (Zod + fetch wrapper, server-side only, baseURL `https://empirebuilder.world/api`). All endpoints proxied through `src/app/api/empire-builder/*` to avoid CORS until confirmed. |

## Idea Surface (15 concepts, ranked by phase)

| # | Idea | Endpoints used | Where in app | API key needed | Difficulty (1-10) | Phase |
|---|------|----------------|---------------|-----------------|-------------------|-------|
| 1 | EB ZABAL panel in `/zabal` channel | `/api/leaderboards?tokenAddress=`, `/api/leaderboards/<uuid>`, `/api/leaderboards/<uuid>/address/<wallet>` | New `src/components/chat/EmpirePanel.tsx`, mounted next to `RespectPanel` when channel = zabal | No | 4 | MVP |
| 2 | Inline empireMultiplier badge on chat messages | per-address stats batched | `src/components/chat/Message.tsx` | No | 5 | MVP-stretch |
| 3 | Live distribution feed in `/zabal` | `/api/empire-rewards/<id>/distribute`, `/api/rewards/recipients/<txHash>` | EmpirePanel "Distributions" tab + cron poller | No | 4 | Phase 2 |
| 4 | Burn ticker | `/api/empire-rewards/<id>/burned` | `EcosystemPanel.tsx` hero stat | No | 2 | MVP |
| 5 | Boosters dashboard (how to earn more) | `/api/boosters/<id>`, per-address `boosters[].qualified` | EmpirePanel "Boosters" tab | No | 4 | Phase 2 |
| 6 | "My Empires" page per user | `/api/empires/owner/<wallet>`, then per-empire stats | New `src/app/(auth)/empires/page.tsx` | No | 5 | Phase 2 |
| 7 | Cross-empire respect amplifier (RESPECT-weighted EB scoring) | Read EB + write back via Adrian's API | Cron + write endpoint | Yes (write) | 7 | Phase 3 |
| 8 | Auto-distribute via BANKER agent (weekly top 50 raiders) | Adrian's `distribute` write endpoint | `src/lib/agents/banker/` weekly cron | Yes (write) | 8 | Phase 3 |
| 9 | Webhook receiver for distribute / burn events | `/api/empire-builder/webhook` route (we provide URL) | New API route | No (but Adrian has to wire send-side) | 6 | Phase 3 |
| 10 | Cast embed: when an EB URL is pasted in chat, render live leaderboard preview | `/api/leaderboards/...` | `src/components/chat/Message.tsx` URL preview | No | 3 | MVP-stretch |
| 11 | Per-channel EB widget (replace RespectPanel with ChannelEmpirePanel inside `/zabal`) | Same as 1 | `src/components/chat/Sidebar.tsx` panel switch | No | 3 | MVP |
| 12 | Empire-gated chat features (top-100 ZABAL holders get colored names + GM bonus) | `/api/leaderboards/<uuid>` | `src/components/chat/Message.tsx` style + `src/lib/auth/session.ts` flag | No | 5 | Phase 2 |
| 13 | Auto-cast EB distributions to `/zabal` Farcaster channel | `/api/empire-rewards/<id>/distribute` + existing `src/lib/publish/` | New cron `src/app/api/cron/empire-builder-distributions/route.ts` | No | 4 | Phase 2 |
| 14 | Stake-to-earn forecast | Distribution history + booster multiplier + user's stake | New page or panel section | No | 6 | Phase 2 |
| 15 | Native ecosystem hero (replace EB iframe) | All read endpoints aggregated | `src/app/(auth)/ecosystem/page.tsx` | No | 4 | MVP |

## MVP Build (recommended now)

Three pieces, all in one PR after the brainstorm/design lands.

| Piece | What it does | File |
|-------|--------------|------|
| 1. `src/lib/empire-builder/client.ts` | Server-side Zod-validated wrapper for all 7 read endpoints. baseURL constant. Optional `EMPIRE_BUILDER_API_KEY` header for future write endpoints (no-op now). | New file |
| 2. `src/app/api/empire-builder/[...path]/route.ts` | Thin proxy. Browser hits ZAOOS, ZAOOS hits EB. Avoids CORS until Adrian confirms. Cache 60s. | New file |
| 3. `src/components/chat/EmpirePanel.tsx` + Sidebar swap | Mount in `/zabal` channel. Tabs: Leaderboard, You, Distributions. Pulls via `/api/empire-builder/...`. | New file + edit `Sidebar.tsx` |

3 specific numbers anchoring the MVP:
- 7 EB read endpoints already documented in doc 582
- 1 ZABAL token address `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`
- 60-second proxy cache TTL (matches `src/lib/respect/leaderboard.ts:26` `CACHE_TTL` divided by 5; tune later)

## Phase 2 Build (after Adrian Q&A on Sunday 2026-05-04)

| Piece | What it does |
|-------|--------------|
| Cron `/api/cron/empire-builder-distributions` | Polls `/api/empire-rewards/<id>/distribute` every 10 min, dedupes by tx hash, posts to `/zabal` Farcaster channel via existing `src/lib/publish/` |
| Boosters tab in EmpirePanel | Shows all boosters + per-user qualification |
| Stake-to-earn forecast widget | Combines distribution history with user's empireMultiplier |

## Phase 3 Build (blocked on Adrian write API)

| Piece | Why blocked |
|-------|-------------|
| BANKER auto-distribute | Need write endpoint + whitelisted caller for ZABAL contract |
| Webhook receiver | Need Adrian to wire send-side from EB |
| Cross-empire respect amplifier | Need write endpoint to update boosters or scores |

## Risks + Open Questions

| Risk / Question | Mitigation |
|------------------|-------------|
| CORS not confirmed for `zaoos.com` browser fetches | Always proxy server-side via `/api/empire-builder/*`. No browser-direct calls. |
| Rate limits unknown | Start with 60s cache + low-fan-out endpoints. Move to 30s after Adrian confirms. |
| Leaderboard UUIDs change | Discovery call cached 24h; refresh on miss. |
| `points` vs `score` semantics drift | Only render the field name EB returns; do not derive multiplier ourselves. |
| Write API timeline unknown | All write-dependent ideas are Phase 3, not blocking MVP. |
| User mentioned an API key | Store as `EMPIRE_BUILDER_API_KEY` server-only; pass as `Authorization: Bearer <key>` once Adrian confirms header name. Ignore in MVP. |
| `RaidSharks PR #165` V3 todos | Read-side ideas (3, 13) cover the same value as the original distribute todo until write API opens. |

## Why this isn't ten different products

All 15 ideas share four primitives:

1. **Read leaderboard for ZABAL** (entries + per-address)
2. **Read rewards for ZABAL** (distribute, burned, airdrop)
3. **Read boosters for ZABAL**
4. **Write to EB** (distribute / burn / airdrop) - gated

The MVP builds primitives 1 + 2 + 3 once. Every Phase 2 idea is a new surface on the same client.

## Sources

- Internal: `research/business/582-empire-builder-v3-live-launch/README.md` - V3 endpoint surface
- Internal: `research/business/361-empire-builder-deep-dive-v3-integration/README.md` - V2 baseline + ZABAL token address
- Internal: `community.config.ts:36` - confirms `/zabal` is one of 4 channels in ZAOOS
- Internal: `src/components/chat/ChatRoom.tsx`, `src/components/chat/Sidebar.tsx`, `src/components/chat/RespectPanel.tsx` - chat panel pattern to follow
- Internal: `src/app/(auth)/ecosystem/page.tsx:78` - current iframe surface to replace
- Internal: `src/lib/portal/destinations.ts`, `src/lib/respect/leaderboard.ts` - existing leaderboard pattern (different system, same shape)
- External docs (already verified in doc 582 on 2026-05-01):
  - [Empire Builder API index](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public)
  - [Get Leaderboard By Empire](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-leaderboard-by-empire)
  - [Get Empire Rewards](https://empire-builder.gitbook.io/empire-builder-docs/empire-builder-docs/api/public/get-empire-rewards)
  - [Empire Builder home](https://www.empirebuilder.world/)

## Also See

- [Doc 582](../582-empire-builder-v3-live-launch/) - V3 launch + endpoint surface (this doc's primary source)
- [Doc 361](../361-empire-builder-deep-dive-v3-integration/) - V2 deep dive + RaidSharks pipeline context
- Memory: `project_raidsharks_empire_builder.md` - PR #165 ties into ideas 3, 8, 13

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pick MVP scope (ideas 1 + 4 + 11 vs add 15) and confirm with Zaal in brainstorm | @Zaal | Decision | Same session |
| Resume `superpowers:brainstorming` with this idea surface as input; produce design doc at `docs/superpowers/specs/2026-05-01-empire-builder-zabal-integration-design.md` | @Claude | Skill flow | Same session |
| Confirm CORS, rate limits, and API key purpose with Adrian | @Zaal | Telegram DM | Before Sunday 2026-05-04 |
| Add `EMPIRE_BUILDER_API_KEY` to `.env.example` (commented, no value) | @Claude | PR (in MVP build) | When MVP lands |
| Test on `https://www.empirebuilder.world/` before PR | @Zaal | Smoke test | Before MVP merge |
| Once MVP lands, link this doc to the implementation PR + close idea-by-idea | @Claude | PR description | When MVP merges |

## Staleness Notes

- Idea ranking assumes V3 public docs as of 2026-05-01. If Adrian publishes write endpoints before Sunday, re-rank Phase 3 into Phase 2.
- Difficulty scores are 1-10 per project rule (memory `feedback_no_time_estimates.md`), not hours.
