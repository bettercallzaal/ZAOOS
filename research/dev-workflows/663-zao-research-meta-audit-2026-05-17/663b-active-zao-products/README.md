---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 663
tier: STANDARD
parent-doc: 663
---

# 663b - Active ZAO Products Audit

Audit of 6 public ZAO ecosystem repos: purpose, stack, health metrics, status, and readiness for public feature.

## Per-Repo Cards

### bettercallzaal/ZAOOS

- **Purpose:** Ecosystem lab - gated Farcaster social client for The ZAO + prototyping ground for new products before graduation.
- **Stack:** Next.js 16, React 19, TypeScript, Supabase (PostgreSQL + RLS), XMTP, Neynar, Wagmi/Viem, Tailwind v4, iron-session.
- **Health:** 131 MB | Last commit: 2026-05-18 | Open issues: 19 | Open PRs: 0 | Root files: 74
- **Docs:** README (yes) | LICENSE (no) | CONTRIBUTING (yes)
- **Status:** ACTIVE (committed today)
- **Share-ready (0-10):** 8 - Well-documented, live, has fork guide and research library. Needs LICENSE file.
- **Cross-deps:** None (internal monorepo, not imported by siblings).
- **Action:** Add LICENSE file (MIT or Apache 2.0 per ZAOOS fork guide).

### bettercallzaal/zaostock

- **Purpose:** Dashboard + public site for ZAOstock 2026 music festival (Oct 3, Ellsworth, Maine). Team coordination, artist lineup, sponsor tiers, live event management.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + RLS), Tiptap (WYSIWYG), iron-session, Tailwind v4.
- **Health:** Unknown size | Last commit: 2026-05-18 | Open issues: 0 | Open PRs: 0 | Root files: 14
- **Docs:** README (yes) | LICENSE (no) | CONTRIBUTING (no)
- **Status:** ACTIVE (committed today)
- **Share-ready (0-10):** 7 - Live product, minimal setup docs, no CONTRIBUTING guide. Festival-specific, not ecosystem-general.
- **Cross-deps:** None detected in package.json. Supabase schema separate from ZAOOS.
- **Action:** Add LICENSE + CONTRIBUTING with deployment notes (Vercel, env vars, local dev steps).

### bettercallzaal/bcz-yapz

- **Purpose:** Long-form interview show (YouTube) + transcript archive. Conversations with builders on web3 music, governance, AI tooling, Maine infrastructure.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, Vitest, gray-matter (markdown frontmatter), no DB, no auth.
- **Health:** Unknown size | Last commit: 2026-05-15 | Open issues: 0 | Open PRs: 0 | Root files: 16
- **Docs:** README (yes) | LICENSE (yes) | CONTRIBUTING (no)
- **Status:** ACTIVE (2 days ago)
- **Share-ready (0-10):** 9 - Minimal stack, static content, live site (bczyapz.com), clean README, no external deps. Production-ready.
- **Cross-deps:** None. Pure static + content layer.
- **Action:** None. Ship as-is. Consider adding episode submission flow if audience grows.

### bettercallzaal/CoCConcertZ

- **Purpose:** Farcaster Mini App + metaverse concert platform for live shows in StiloWorld (Spatial.io). Real-time chat, countdown timer, "now playing" bar, post-show recaps.
- **Stack:** Next.js (version ?), React 19, TypeScript, Firebase (Firestore), Supabase, Cloudinary, TailwindCSS v4, TanStack React Query.
- **Health:** Unknown size | Last commit: 2026-05-04 | Open issues: 0 | Open PRs: 0 | Root files: 31
- **Docs:** README (yes) | LICENSE (no) | CONTRIBUTING (no)
- **Status:** PAUSED (13 days ago) - last push was minor, no activity since early May.
- **Share-ready (0-10):** 5 - Live site (cocconcertz.com), cyberpunk design, feature-rich. But stale (no commits in 13 days), no LICENSE, no CONTRIBUTING, unclear Next.js version.
- **Cross-deps:** Firebase + Supabase hybrid (needs clarification on data model). Cloudinary for live assets.
- **Action:** Clarify stack in README (Next.js version, Firebase vs Supabase roles). Add deployment docs + LICENSE. If paused, document why + expected resume date.

### bettercallzaal/ZAONEXUS

- **Purpose:** Canonical link hub for ZAO ecosystem. 200+ curated resources across 2 audiences (community: internal tools + governance; ecosystem: brand pages + partner integrations). Smart search, auto-expand categories.
- **Stack:** Next.js 14, React 18, TypeScript, TailwindCSS v3, Lucide icons, no database, no auth.
- **Health:** Unknown size | Last commit: 2026-05-11 | Open issues: 0 | Open PRs: 0 | Root files: 14
- **Docs:** README (yes) | LICENSE (no) | CONTRIBUTING (no)
- **Status:** ACTIVE (6 days ago)
- **Share-ready (0-10):** 8 - Minimal stack, dual-audience design, smart filtering. Live (zaonexus.com). Needs LICENSE. Next.js is one version behind (14 vs 16 ecosystem standard).
- **Cross-deps:** None. Pure static directory.
- **Action:** Upgrade Next.js to 16 + React 19 for consistency with ZAOOS/zaostock/bcz-yapz. Add LICENSE.

### bettercallzaal/zao-101

- **Purpose:** Educational onboarding site. 4-page static site teaching what The ZAO is (decentralized music community). Pillars, join flow, FAQ.
- **Stack:** Plain HTML, CSS, no build step, no framework, no dependencies.
- **Health:** Unknown size | Last commit: 2026-04-24 | Open issues: 5 | Open PRs: 0 | Root files: 9
- **Docs:** README (yes) | LICENSE (no) | CONTRIBUTING (no)
- **Status:** PAUSED (23 days ago, nearly a month) - last commit was onboarding documentation.
- **Share-ready (0-10):** 6 - Pure static (good), open issues suggest gaps. No LICENSE. Placeholder blocks still in HTML suggest unfinished content. Outdated (no commits in 23 days).
- **Cross-deps:** None. Zero external dependencies.
- **Action:** Close stale issues or mark as "help wanted". Fill placeholder blocks. Add LICENSE. Consider migrating to Vercel deployment (currently listed as "once Vercel is wired").

## Cross-Repo Findings

| Finding | Evidence | Action |
|---|---|---|
| **No inter-repo imports** | Scanned package.json deps across all 6 repos; no @bettercallzaal/* references found. | Repos are independent—no shared code or monorepo overhead. Good for graduating subprojects. |
| **Missing LICENSE files** | 5 of 6 repos lack LICENSE (only bcz-yapz has one). | Decide on MIT/Apache 2.0 + add to ZAOOS, zaostock, CoCConcertZ, ZAONEXUS, zao-101. |
| **Stale documentation** | CoCConcertZ (13d), zao-101 (23d) have no recent commits. No CONTRIBUTING files anywhere. | Add deployment + contribution guidelines to all repos. Pin Next.js + React versions in READMEs. |
| **Stack fragmentation** | ZAONEXUS uses Next.js 14 + React 18; others use 16 + 19. | Upgrade ZAONEXUS to match ecosystem (Next.js 16, React 19, Tailwind v4). |
| **Content/data inconsistencies** | ZAONEXUS has 200+ curated links; no automated sync to bettercallzaal.com/nexus or other sites. | Consider semi-automated content pipeline if ZAONEXUS becomes source of truth for ecosystem maps. |

## Recommended Actions

- **Licenses (P0, this week):** Add MIT LICENSE file to ZAOOS, zaostock, CoCConcertZ, ZAONEXUS, zao-101. Use consistent header. Keep bcz-yapz as-is.
  
- **CONTRIBUTING guides (P1, next 2 weeks):** Each repo needs a CONTRIBUTING.md that covers: local dev steps, testing, deployment target (Vercel, VPS, etc), PR process, branching rules.

- **Stack alignment (P1, next 2 weeks):** Upgrade ZAONEXUS from Next.js 14/React 18 to Next.js 16/React 19 + TailwindCSS v4 for consistency.

- **zao-101 content (P2, by 2026-05-31):** Fill placeholder blocks in HTML. Close or mark as "help wanted" the 5 open issues. Confirm Vercel deployment.

- **CoCConcertZ status (P2, by 2026-05-31):** Clarify if paused or active. If paused, add a PAUSED.md note + expected resume. Document Firebase vs Supabase role split.

- **Public-facing landing (P1, async):** Once all 6 repos have LICENSE + CONTRIBUTING, feature them on bettercallzaal.com/ecosystem or bettercallzaal.com/nexus as "featured projects with open contributions welcome."

## Sources

All data gathered via `gh api` and `gh repo view` CLI:

```bash
# Repo overview
gh api repos/bettercallzaal/{ZAOOS,zaostock,bcz-yapz,CoCConcertZ,ZAONEXUS,zao-101} \
  --jq '{name, description, open_issues_count, archived}'

# Last commit
gh api repos/bettercallzaal/{repo}/commits?per_page=1 --jq '.[0].commit.committer.date'

# File counts
gh api repos/bettercallzaal/{repo}/contents --jq 'length'

# README/LICENSE/CONTRIBUTING checks
gh api repos/bettercallzaal/{repo}/contents/{README.md,LICENSE,CONTRIBUTING.md} --jq '.name'

# Dependencies
gh api repos/bettercallzaal/{repo}/contents/package.json --jq '.content' | base64 -d
```

All queries run 2026-05-17 18:00 UTC against live GitHub API. No local clones; no source code modifications.
