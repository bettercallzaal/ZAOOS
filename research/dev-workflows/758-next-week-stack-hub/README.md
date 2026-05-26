---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-26
related-docs: "758a, 758b, 758c, 758d, 758e, 743, 752, 754, 757"
original-query: "all of these things i have next to do and also look into the best ways to edit the coworking github"
tier: DISPATCH
---

# 758 - Next-week stack hub (5 sub-agents, DISPATCH-tier)

> **Goal:** One synthesized hub that answers "what do I ship next week" across the 5 in-flight tracks: cowork-edit safety, neko-install, /claim bot, Discord radio, mentor handbook. Each sub-doc is a standalone playbook; this hub ties them.

## Why this hub exists

The 2026-05-26 session arc ended with a 13-item decision burst (see handoff bundle `session-2026-05-26-agentic-outreach-kit-shipped/README.md`). Most decisions were confirm-questions, not research questions. But 5 of them ARE genuine technical decisions worth research-grade answers:

1. **(a) Coworking github** - Zaal complains edits break the 4-user app. What's the right safety net for solo-dev?
2. **(b) m1k1o/neko** - Leeward's Jun 2 kickoff hinges on neko install. What's the canonical 2026 path?
3. **(c) Telegram /claim bot** - ZABAL Games Q1=A mentor mechanics need a first-write-wins claim bot. Build new or extend Hermes?
4. **(d) Discord 24/7 radio** - Leeward task F. Can we build it without getting YouTube-killed?
5. **(e) Mentor handbook** - ZABAL Games Q4=A says "ship the handbook before mentors say yes." What does a great one contain?

DISPATCH-tier (5 parallel sub-agents) because each dimension has 8-10 independent considerations. ~70 sec wall-time. Total: 28+ FULL sources across 5 docs.

## Sub-doc map (read in this order)

| Sub-doc | Topic | Folder | Headline decision | Build time |
|---------|-------|--------|-------------------|-----------|
| [758a](../758a-coworking-github-edit-playbook/) | Coworking github edit playbook | `dev-workflows/` | CI-only branch protection + Vercel preview as QA gate + `supabase migrate new` discipline | ~50 min sprint |
| [758b](../../agents/758b-nurdism-neko-install-rtmp-forward/) | m1k1o/neko install + RTMP forward | `agents/` | v3.1.0 native Broadcast pipeline; 480p@25 + shm 2gb + NAT1TO1 IP | ~2 hr install + 72hr soak |
| [758c](../../agents/758c-telegram-claim-bot-pattern/) | Telegram /claim bot pattern | `agents/` | grammY + extend Hermes + Supabase UNIQUE constraint for atomicity | ~1 afternoon |
| [758d](../../agents/758d-discord-247-radio-bot/) | Discord 24/7 ZAO radio bot | `agents/` | Fork bongodevs/lavamusic + Lavalink v4.2+ + Arweave HTTP source; NO YouTube | weekend sprint |
| [758e](../../community/758e-mentor-handbook-patterns/) | Mentor handbook patterns (for ZABAL Games) | `community/` | 1-page web doc; lead with culture not legal; pre-program COI intake; transparent comp | 20 min draft (outline ready) |

## Cross-cutting themes

### Theme 1: Solo-dev safety nets that aren't friction

Two sub-docs (758a + 758c) converge on the same insight: when you're the only developer, the false choice is "skip safety because nobody reviews" vs "add code-review gates that block you." Both wrong.

The right pattern in both contexts:
- **(a) Cowork repo:** CI checks (typecheck + lint) gate the merge, no human review required. Vercel preview turns the 3 non-dev users into QA.
- **(c) Hermes /claim:** Database-level UNIQUE constraint is the atomic gate. App-code SELECT-then-INSERT is the trap. Let PostgreSQL be the firewall.

**Common pattern:** push safety INTO the substrate (CI / database) so the developer doesn't have to remember to add it.

### Theme 2: Don't depend on platforms that killed prior bots

Two sub-docs (758b + 758d) hit the same constraint shaped differently:
- **(b) Neko + DRM:** Spotify Web / Apple Music Web are blocked by EME sandbox. Use Bandcamp / YouTube Music / self-hosted.
- **(d) Discord radio + YouTube:** Groovy/Rythm/Hydra all died for YouTube TOS violations. Don't route YT through the bot.

**Common pattern:** the legal/TOS perimeter is the load-bearing decision. Build on member-owned content (Arweave / Bandcamp) not third-party catalogs.

### Theme 3: Distributed teams need handbook-as-contract

(758e) for mentors. Reapplies to:
- ZABAL Games builders (also need a "builder handbook" eventually)
- Leeward composite-stream collab (could be an MOU)
- Future ZABAL mentor cohorts

**Common pattern:** 1-page culture-first docs read before commitment. >5 pages = unread.

### Theme 4: Reuse Hermes infra

(c) extends Hermes for /claim. (d)'s Discord radio bot is a NEW bot (different runtime - Discord not TG - so the reuse argument breaks). But the SHAPE is the same: small bot, single concern, deployed via systemd on existing VPS, secret-hygiene via `~/.zao/zao.env`.

**Common pattern:** the Hermes pattern is the ZAO bot deployment template. Don't reinvent infra. Per `project_hermes_canonical.md`.

## Master Next Actions (consolidated across all 5 sub-docs, by week)

### Week 1: 2026-05-26 to 2026-06-01

| Action | Sub-doc | Owner | Type |
|--------|---------|-------|------|
| Add GH branch protection on cowork main + CI workflow + Husky | 758a | @Zaal | infra |
| Draft 1-page mentor handbook from outline | 758e | @Zaal | docs |
| Create Supabase `mentor_claims` table + RLS | 758c | @Zaal | migration |
| Verify UDP firewall on VPS 31.97.148.88; pull m1k1o/neko v3.1.0 | 758b | @Zaal | infra |
| Build mentor intake form + spin up private TG mentor group | 758e | @Zaal | ops |

### Week 2: 2026-06-02 to 2026-06-08

| Action | Sub-doc | Owner | Type |
|--------|---------|-------|------|
| Leeward kickoff for composite-stream + neko deployed via Cloudflare Tunnel | 758b | @Zaal | meeting |
| Add /claim grammY middleware to Hermes + race-condition test + deploy | 758c | @Zaal | PR (bot) |
| Deploy Lavalink v4.2.2 on Iman's VPS + Arweave gateway audio test | 758d | @Zaal/@Iman | infra |
| Fork bongodevs/lavamusic; strip YouTube plugin; bot joins ZAO Radio VC | 758d | @Zaal | PR (new repo) |
| Add Playwright smoke test to cowork CI | 758a | @Zaal | PR |
| First mentor call (Thu 7pm EST kickoff + group norms) | 758e | @Zaal | cal |

### Week 3+: ongoing

| Action | Sub-doc | Owner | Type |
|--------|---------|-------|------|
| Document Supabase migration workflow in cowork README | 758a | @Zaal | docs |
| Now-playing embed + 24/7 mode + Supabase session persist | 758d | @Zaal | PR |
| Pre-wire Hats Protocol Champion NFT (manual mint, per Q5=C) | 758e | @Zaal | infra (deferred to Aug) |
| Document /claim in Hermes README + mentor handbook | 758c/758e | @Zaal | docs |
| Curated playlist setup (Bandcamp/YT Music) for neko | 758b | @Zaal | content |

## What this hub DOESN'T cover (intentional gaps)

- **zaofractal.vercel.app review** (10 pages + ANNOUNCE.md) - manual review task, not researchable. Sequential walk-through pending Zaal's confirmation.
- **PR merge cadence** (12 open PRs from session arc) - operational, not researchable.
- **Vlad/Singularity 30-day park** - decision, not research.
- **Tyler Vercel magic link** - blocked on Zaal action, not researchable.
- **Cold outreach send-time decision** - covered by doc 743 already.

## Also See

- Doc 743 - Agentic cold outreach workflow (the OTHER DISPATCH-tier hub from this session arc)
- Doc 752 - Leeward x Zaal WebRTC + Pion + LiveKit handoff (source for sub-doc b)
- Doc 757 - ZAO skill iteration system (parallel-session ship)
- Doc 717 - Hermes architecture upstream
- Handoff bundle `session-2026-05-26-agentic-outreach-kit-shipped/README.md` - parent context for the 13-item decision burst

## Sources

This hub doesn't have unique sources - it synthesizes the 5 sub-docs. See each sub-doc's Sources section. Combined source count: 50+ unique URLs across the 5 sub-docs, 38 FULL / 12 PARTIAL / 0 FAILED.
