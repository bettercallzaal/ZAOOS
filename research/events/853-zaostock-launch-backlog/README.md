---
topic: events
type: audit
status: research-complete
last-validated: 2026-06-13
superseded-by:
related-docs: 224, 364, 369, 839
original-query: "whats next to do on the zao-stock event site - prioritized backlog of remaining work to make it launch-ready for the Oct 3 Ellsworth event (musician submission flow, volunteer signup, RSVP, lineup, schedule, content gaps)"
tier: STANDARD
---

# 853 - ZAOstock Event Site: Brand Audit + Launch Backlog (canonical repo)

> **Goal:** Audit the REAL ZAOstock event site for Fellenz brand compliance and remaining launch work, and record the repo consolidation. Corrected 2026-06-13: the canonical site is the mature `ZAODEVZ/ZAOstock` repo, not the thin `bettercallzaal/zao-stock` skeleton this doc was first (wrongly) written against.

## Correction note (2026-06-13)

The first version of this doc audited `bettercallzaal/zao-stock` (a 4-page skeleton) believing it was the event site. It is not. The canonical site is a mature 22-page / 27-API-route app that already absorbed most of the Fellenz critique. This rewrite reflects the real repo and the consolidation that happened.

## Repo consolidation (done this session)

Three repos existed; now one canonical home:

| Repo | Was | Now |
|------|-----|-----|
| `ZAODEVZ/ZAOstock` | did not exist | **CANONICAL** - full history migrated from `bettercallzaal/zaostock` (30 branches, all tags, `main` HEAD `3b7a2b3` verified identical) |
| `bettercallzaal/zaostock` (no hyphen) | the real mature site | README points to new home, **archived** (read-only) |
| `bettercallzaal/zao-stock` (hyphen) | thin skeleton; got a brand-cleanup PR (#1, merged) | README points to new home, **archived** (read-only) |

Pending (owner: Zaal): point `zaostock.com` domain + Vercel project at `ZAODEVZ/ZAOstock`; move the 5 env vars (see Infra below).

## Key Decisions (read first)

| # | Decision | Why |
|---|----------|-----|
| D1 | **Canonical repo = `ZAODEVZ/ZAOstock`.** All new work happens there. | Migration done + verified; old repos archived. |
| D2 | **The site is already ~90% Fellenz-brand-correct.** Do NOT re-do the brand cleanup; only apply the 2 remaining correction sets below. | Spelling, parent framing, fiscal-sponsor wording, donate paths, entry doors, "digital creators", member-count rule all already pass. |
| D3 | **COC Concertz is framed as owned/portfolio on public pages - correct to partnership.** Reframe to "ZAO Festivals + COC Concertz" and add "(framing pending COC confirmation)" wherever a relationship is asserted. | Standing rule: COC is a community partnership, never a sub-brand owned by The ZAO. |
| D4 | **Strip ZABAL + raw crypto jargon from public copy.** "Year of the ZABAL", VibesGrid "ZABAL" tags, "435 SOL / Solana" on the public sponsor page. | Standing rules: ZABAL never leads public copy; public copy uses digital-creator positioning, not crypto/web3/token jargon. |

## Brand Audit (Fellenz rules) - canonical repo

### PASS (already correct)
| Rule | Evidence |
|------|----------|
| Canonical spelling "ZAOstock" | No "ZAO Stock"/"ZAO-STOCK" anywhere in `src`/`public`. |
| The ZAO is parent | `layout.tsx` "Run by The ZAO"; `page.tsx` "ZAOstock is The ZAO's flagship IRL music festival"; footer + CTAs link `thezao.com`. |
| ZAO Festivals as the arm | "under the ZAO Festivals umbrella"; sponsor Ecosystem track "Year-round ZAO Festivals partnership". |
| Fiscal sponsor wording | sponsor `page.tsx`: "Eligible support administered through New Media Commons, a fiscally sponsored project of Fractured Atlas" - matches the approved phrasing. |
| Donate = 2 paths | `donate/page.tsx`: PayPal (fiat) + Giveth (crypto), exactly the approved structure. |
| No specific member count | Uses "90+", "400+", "19 Team Members + Advisors". |
| Digital-creator positioning | sponsor Virtual track: "Digital creator brands and digital-native companies"; "digital attendance collectible" not "NFT". |
| Entry doors exist | nav + "How To Plug In - Pick a door": `/musicians`, `/artists`, `/event-organizers`; volunteer -> `/apply`; ticket -> `ticket.zaostock.com`. |

### CORRECT (the 2 remaining sets)
| # | Where | Current | Fix |
|---|-------|---------|-----|
| C1 | `src/app/sponsor/page.tsx:23` | stat "5 COC Concertz Events" listed as a ZAO credibility number | Frame as partnership; or label "COC Concertz (partner) events" + pending-confirmation note |
| C2 | `src/app/sponsor/page.tsx:51,62` | "Featured in COC Concertz monthly virtual events", "Logo in COC Concertz monthly metaverse concerts" | "via our COC Concertz partnership (framing pending COC confirmation)" |
| C3 | `src/app/sponsor/page.tsx:58` | Ecosystem subtitle "(Stock, Ville, WaveWarZ, COC)" | "(Stock, Ville, WaveWarZ) + COC Concertz partnership" |
| C4 | `src/app/sponsor/page.tsx` PAST_PROOF | "COC Concertz - 5 monthly metaverse concerts" as ZAO proof | Mark as partner proof, not owned event |
| C5 | `src/app/llms.txt/route.ts:41` | "Iman ... leading COC Concertz #6" | "Iman ... helps run COC Concertz #6 (community partnership)" |
| C6 | `src/app/sponsor/page.tsx:52` | "Mentioned in 400+ edition daily newsletter (Year of the ZABAL)" | Drop "(Year of the ZABAL)" - ZABAL must not surface in public copy |
| C7 | `src/components/festival/VibesGrid.tsx:26-29` | public tags/captions "ZABAL", "ZABAL energy across the day", "ZABAL geometric art" | Re-caption without leading ZABAL |
| C8 | `src/app/sponsor/page.tsx` PAST_PROOF (WaveWarZ) | "435 SOL ($37K+) volume, artists paid instantly via Solana" | Soften crypto jargon for the public sponsor audience (keep $ figure, drop SOL/Solana or move behind digital-creator framing) |

Note: "Web3Metal" appears on home + pitch - that is a partner's proper name, not editable jargon. Leave.

## Launch Backlog (what actually remains)

Most of the original backlog is ALREADY BUILT (musician submit, RSVP, donate, sponsor, team dashboard all exist). Real remaining gaps:

| Pri | Item | Detail |
|-----|------|--------|
| P0 | Domain + Vercel cutover | Point `zaostock.com` + Vercel project at `ZAODEVZ/ZAOstock`; migrate the 5 env vars (Infra below). Owner: Zaal. |
| P1 | Apply C1-C8 brand corrections | One PR on `ZAODEVZ/ZAOstock`. |
| P2 | Lineup confirmation | Verify which artists are locked vs TBA on `/artists` + home lineup; confirmed-only public grid. |
| P2 | Program / run-of-show | `/program` page exists - confirm it has the public-safe noon-6pm schedule + Black Moon after-party. |
| P3 | Verify musician deliverable cutoff messaging | Sep 3 cutoff (one month before event) surfaced on `/musicians/submit`. |

## Infra: env var move (the 5 that matter)

Pulled from Vercel project `zaostock` (scope `bettercallzaals-projects`) to a local gitignored file this session. The 5 app vars:

| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (secret) |
| `SESSION_SECRET` | iron-session secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | `https://zaostock.com` |

(All documented in repo `.env.example`.) Two cutover paths:
- **Re-point (simplest):** change the existing `zaostock` Vercel project's connected Git repo to `ZAODEVZ/ZAOstock`. Envs + domain stay put - nothing to move.
- **New project:** create a Vercel project for `ZAODEVZ/ZAOstock`, then push the 5 vars in and reassign the domain.

## Also See

- [Doc 839 - Fellenz brand + org strategy](../839-fellenz-brand-org-strategy/)
- [Doc 364 - ZAO Festivals deep research](../364-zao-festivals-deep-research/)
- [Doc 369 - DreamEvent gap analysis](../369-dreamevent-framework-gap-analysis/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Re-point Vercel `zaostock` project + domain to `ZAODEVZ/ZAOstock` | @Zaal | Infra | This week |
| Apply C1-C8 brand corrections | @Zaal | PR on ZAODEVZ/ZAOstock | After approval |
| Confirm COC Concertz public framing with COC | @Zaal | Decision | Before C1-C5 ship |
| Confirm locked lineup; filter public grid to confirmed | @Zaal | PR | Before public push |

## Sources

- [FULL] `ZAODEVZ/ZAOstock` repo (cloned this session) - full audit of all 22 pages, 27 API routes, components, metadata.
- [FULL] `src/app/sponsor/page.tsx` - COC + ZABAL + fiscal-sponsor + crypto findings (line-cited above).
- [FULL] `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/donate/page.tsx` - parent framing, entry doors, donate paths.
- [FULL] `src/app/llms.txt/route.ts`, `src/components/festival/VibesGrid.tsx` - COC + ZABAL public mentions.
- [FULL] `.env.example` + Vercel `zaostock` project env list - the 5 vars to migrate.
- Note: internal product audit grounded in primary repo + infra sources (all FULL); no external community source applies.
