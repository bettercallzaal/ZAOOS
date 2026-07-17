---
topic: brand
type: decision-brief
status: design-complete
last-validated: 2026-07-17
related-docs: 868 (brand weakness audit), 722 (ZAO canonical URLs), 842 (org chart + brand hierarchy)
original-query: "Consolidate the front door + kill dead thezao.com in bios — board task 311b2dbc"
tier: STANDARD
---

# 1238 — ZAO Front Door Consolidation

> **Purpose:** Doc 868 named "three competing entry points, no clear where do I go" as the #1 brand acquisition leak. This doc maps every live surface where thezao.com appears in code/docs, documents the live entry point landscape, and gives Zaal a decision-ready checklist to pick ONE canonical URL and fix all references in one PR batch.

---

## Current Entry Point Landscape

| URL | Status | What it is | Visitor experience |
|---|---|---|---|
| `thezao.com` | **DEAD** | Root domain, never deployed (doc 722) | Blank/dead page — worst first impression in web3 |
| `zaoos.com` | **LIVE** | ZAOOS main app | Public landing: "Where music artists build onchain" + Login button + /portal link |
| `zaoos.com/portal` | **LIVE** | PortalHub component | Public-facing, no login required |
| `thezao.xyz` | **LIVE** | ZAOcowork board | Internal task board — not a public intro surface |
| `thezao.xyz/papers` | **LIVE** | ZAO Papers / whitepapers | Research papers — good for curious builders, not general first impression |
| `discord.thezao.com` | **UNKNOWN** | DNS redirect to Discord invite | Subdomain — may still resolve. Separate from thezao.com root. |
| `zuke.thezao.com` | **UNKNOWN** | Zuke audio app on Vercel | Subdomain — may still resolve. Separate from thezao.com root. |
| `info@thezao.com` | **UNKNOWN** | Email address | MX records may still route mail even if root domain is dead/parked |

**Key distinction:** `thezao.com` the ROOT domain is dead, but `discord.thezao.com` and `zuke.thezao.com` are separate DNS entries (CNAMEs) that likely still route. Do not confuse them — fixing the root does not break the subdomains.

---

## Recommendation: zaoos.com as the One Canonical URL

### Why zaoos.com wins

1. **Has a public landing page.** Unauthenticated visitors see: "Where music artists build onchain" + four feature pills (Community, Music, Encrypted, Governance) + Login button + "Explore the Portal" link. A newcomer can understand what The ZAO is without logging in.
2. **Primary production deploy.** zaoos.com is the main app. Using it as the bio URL avoids the mismatch of linking to a side project (the cowork board or papers site).
3. **Already in README footers.** ZAOOS/README.md and zabalgames already use zaoos.com as the organization URL in most contexts.
4. **Scalable.** If a dedicated marketing landing page is built later (e.g. thezao.com brought back), a DNS swap is one change — no bio updates needed again.

### What zaoos.com is NOT good for

- It requires Farcaster to unlock the app. The landing page is good, but non-crypto people may bounce at the "Sign In With Farcaster" CTA.
- If the goal is music-fan-first onboarding (not crypto-native), a simpler landing page (bettercallzaal.com/nexus or a future thezao.com) would convert better.

### Decision for Zaal

Pick one:
- **A) zaoos.com** — use immediately, no new work, best for crypto-native first impression. (Recommended.)
- **B) Bring thezao.com back** — register/redeploy a simple landing page at thezao.com, then update all bios to that. (More work, better for non-crypto audience.)
- **C) thezao.xyz/portal** — not viable as a bio URL; the cowork board is internal tooling.

Once Zaal picks A or B, the file changes below are the full PR scope.

---

## File Changes Needed (PR Scope)

### Category 1: `thezao.com` root → canonical URL (e.g. zaoos.com)

These are references to the dead root domain that should change to whichever canonical URL is picked:

| File | Line | Current | Replace with |
|---|---|---|---|
| `zabalgames/index.html` | 61 | `"url": "https://thezao.com"` | `"url": "https://zaoos.com"` |
| `zabalgames/docs/magnetiq-mementos-zao-brands-2026-05-28.md` | 66 | `thezao.com (about)` | `zaoos.com` |
| `zabalgames/docs/magnetiq-mementos-zao-brands-2026-05-28.md` | 182 | `thezao.com/zabal` | `zaoos.com/zabal` |
| `zabalgames/docs/magnetiq-mementos-zao-brands-2026-05-28.md` | 303 | `thezao.com/festivals` | `zaoos.com/festivals` or remove if path does not exist |

### Category 2: `info@thezao.com` email — verify before changing

Before changing these, confirm with Zaal whether `info@thezao.com` still receives mail (MX records can work even if the web root is dead). If live: keep. If dead: replace with Zaal's Farcaster DM or a new email.

| File | Context |
|---|---|
| `zabalgames/info.html` | Prize pool sponsor contact |
| `zabalgames/winners.html` | Prize pool sponsor contact |
| `zabalgames/docs/sponsor-outreach-v1-pool.md` | Multiple references |
| `zabalgames/docs/sponsor-outreach-2026-05-26.md` | Multiple references |
| `zabalgames/docs/README.md` | Table row note |

### Category 3: `discord.thezao.com` — leave alone unless it's broken

These are in ZAOOS documentation. If `discord.thezao.com` still resolves (DNS redirect to Discord invite), leave it. Only change if Zaal confirms it is broken:

| File | Line |
|---|---|
| `ZAOOS/README.md` | 14, 719 |
| `ZAOOS/CONTRIBUTING.md` | 116 |

### Category 4: External bio surfaces (Zaal action only)

These cannot be changed by PR — they require logging into the platform:

| Platform | Where |
|---|---|
| Farcaster (@zaal) | Bio link field |
| X/Twitter (@bettercallzaal) | Bio link field (note: also has deadline Jul 20 for display name fix — batch both changes) |
| GitHub (bettercallzaal) | Profile website field |
| Instagram (@bettercallzaal or @wavewarz) | Bio link field |
| Any other social bios referencing thezao.com | Audit manually |

---

## Action Checklist (Decision-Ready)

| Step | Owner | Gated | Notes |
|---|---|---|---|
| 1. Confirm whether `info@thezao.com` receives mail | Zaal | No — just check inbox | If live, keep email refs as-is |
| 2. Pick A (zaoos.com) or B (bring thezao.com back) | Zaal | DECISION NEEDED | Doc recommends A |
| 3. PR: update zabalgames/index.html JSON-LD url field | coc loop | No | 1-line change, safe |
| 4. PR: update zabalgames/docs/ thezao.com root refs | coc loop | No | 4 files, doc-only |
| 5. Update external bio links (Farcaster, X, GitHub) | Zaal | Yes — platform access | Batch with Jul 20 X display name fix |
| 6. Decide on discord.thezao.com subdomain (leave or redirect) | Zaal | No | Only if confirmed broken |

---

## Sources

- Doc 868 — Brand Weakness Audit (2026-06-17): ranks "three competing entry points" as #1 acquisition leak
- Doc 722 — ZAO canonical URL audit: `thezao.com` confirmed dead, `zaoos.com` confirmed live
- Board task `311b2dbc` — "Consolidate the front door + kill dead thezao.com in bios"
- `zaoos.com/src/app/page.tsx` — verified public landing page (unauthenticated experience: hero + login + /portal)
- `ZAOOS/README.md` line 727 — already uses zaoos.com in footer
