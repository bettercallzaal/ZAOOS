---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: "What's the canonical ZABAL/ZAO brand kit page? How is it structured and maintained? (reconstructed)"
related-docs: 547, 661, 663, 665
tier: STANDARD
---

# 666 — ZABAL Brand Kit Page (bettercallzaal.com/kit.html)

> **Goal:** Cross-reference doc for the master brand kit page shipped at bettercallzaal.com/kit.html ([PR #5](https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5)). Captures what's there, where the canonical machine-readable manifest lives, and how to extend it as the ZAO ecosystem evolves.

## What Shipped

| Artifact | URL | What |
|---|---|---|
| Page | https://bettercallzaal.com/kit.html | 25 brands, 8 categories, status badges, "How to plug in" CTAs by role per brand |
| Manifest | https://bettercallzaal.com/brands.json | Machine-readable source of truth — agents read this, page renders from it |
| Repo | https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5 | The shipping PR |

## Why This Doc Exists

bettercallzaal.com/nexus.html got built earlier as an ecosystem-link directory, but:
1. It's redirected via `vercel.json` to `nexus.thezao.com` which is stuck on a loader (per Doc 663 post-merge health check).
2. It doesn't have the "entrepreneurial layer" — no per-brand "Sponsor / Collab / Customer / Contribute" CTAs.
3. It's not machine-readable — agents can't easily render answers from it.

Doc 666 captures the new `/kit.html` page that addresses all three. The page is a parallel, never-fails surface that coexists with nexus.html; future PRs can fix nexus or migrate it.

## The 25 Brands (by Category)

| Category | Brands |
|---|---|
| **Core** | The ZAO · ZAO OS · $ZABAL |
| **Festivals** | ZAO Festivals · ZAOstock · NextZAOville · COC Concertz |
| **Music + Audio** | WaveWarZ · FISHBOWLZ · SongJam ($SANG) · Aurdour |
| **Agency + Personal** | BetterCallZaal (BCZ Strategies LLC) |
| **Shows** | BCZ YapZ · Let's Talk About ETH (with Maceo) · Year of the ZABAL |
| **Agents + Bots** | ZOE · Hermes · ZAO Devz · ZAOcoworkingBot |
| **Infrastructure** | ZABAL Bonfire · POIDH (ZAO bounties) · ZABAL Games |
| **Tools + Snaps** | Zlank · zao-101 · ZAOVideoEditor |

## Each Brand Card Surfaces

| Field | Why it matters |
|---|---|
| **Name + tag** | Quick identity ("ZAOstock · Festival · 2026 Flagship") |
| **Status badge** (active / building / paused / graduated / experimenting) | Outside reader instantly knows what stage it's in. Status colors match the doc 661 graduation-readiness vocabulary. |
| **Blurb** | One paragraph: what it is, who runs it, where it is |
| **Founded · Audience · Monetization** | The entrepreneurial fundamentals at a glance |
| **Public links** | Sites, repos, socials — every reachable surface |
| **"How to plug in"** | Role-tagged CTAs: Sponsor / Collab / Customer / Contribute. Each is an actionable link (mailto, repo URL, ticket page, DM). Plus a contact line. |

The "How to plug in" section is the differentiator vs. nexus.html. Anyone landing on the kit can immediately self-route by role.

## How To Extend (Adding a New Brand)

When a new ZAO ecosystem brand launches:

1. Open `/tmp/bcz-site/brands.json` (or the production `brands.json` via a PR to bettercallzaalwebsite)
2. Add an object to the `brands` array with this shape:

```json
{
  "id": "kebab-case-id",
  "name": "Brand Name",
  "tag": "Category · Tagline",
  "tagColor": "orange | cyan | gold | pink | muted",
  "status": "active | building | paused | graduated | experimenting",
  "category": "core | festivals | music | agency | agents | infra | shows | tools",
  "blurb": "1-2 sentence what it is.",
  "founded": "YYYY",
  "audience": "Who it serves",
  "monetization": "How it makes money or 'OSS, no direct revenue' etc",
  "links": [
    { "label": "Site", "url": "https://..." }
  ],
  "plugIn": {
    "sponsor": { "label": "...", "url": "..." },
    "collab": { "label": "...", "url": "..." },
    "customer": { "label": "...", "url": "..." },
    "contributor": { "label": "...", "url": "..." },
    "contact": "email@..."
  }
}
```

3. Commit + PR. The page auto-renders the new card.

## How Agents Read It

ZOE / Hermes / ZAOcoworkingBot can fetch `brands.json` directly to answer questions like:
- "What brands are in the ZAO ecosystem?"
- "Who do I email to sponsor ZAOstock?"
- "Which repos are OSS and need contributors?"

Sample fetch:
```bash
curl -s https://bettercallzaal.com/brands.json | jq '.brands[] | select(.status == "active") | .name'
```

Returns the names of all active brands. Trivially composable.

## Design Reuse

The page reuses the existing nexus.html design system verbatim:
- Dark `#070709` background
- Outfit (body) + Syne (headings) Google Fonts
- Orange `#ff6b35` + Cyan `#00e5ff` + Gold `#f5c842` + Pink `#ff3d6e` palette
- Gradient hero title
- Radial fade backgrounds + subtle noise overlay

This means the kit visually belongs to the same family as bettercallzaal.com/nexus.html and the per-brand pages already in the site. Zero design-system fragmentation.

## What This Doc Doesn't Cover (Out Of Scope)

- Per-brand deep-dive subpages (still need to be built — current per-brand pages at `/zao/`, `/zaostock/`, `/wavewarz/`, `/bczyapz/` are inconsistent in depth)
- OG-image generation per brand for shareable previews
- Print / export PDF view of the kit
- Versioning / changelog of `brands.json` (currently `version: 1.0.0` in the manifest header)
- Visual mockups of brand logos / wordmarks (the current page is text-only — could later add per-brand iconography)
- A "submit your brand" form for community-incubated projects

These are all follow-up PRs.

## Hard Numbers

- 25 brands listed.
- 8 categories.
- 5 statuses with color codes.
- 14 brands currently `active`.
- 6 brands currently `building`.
- 2 brands `graduated` (COC Concertz + BCZ YapZ).
- ~25 KB JSON manifest, ~19 KB HTML page — total < 50 KB for the full kit.
- 0 external JS dependencies beyond Google Fonts (HTML + CSS + vanilla JS).
- 1 PR shipped: bettercallzaal/bettercallzaalwebsite#5.

## Cross-References

- [Doc 547](../../community/547-zaostock-master-strategy/) — Cassie's "infrastructure IS the product" framing, applied at ecosystem scale here
- [Doc 661](../../dev-workflows/661-zaoos-codebase-audit-may-2026/) — graduation-readiness audit (661h) informed which brands got "graduated" status
- [Doc 663](../../dev-workflows/663-zao-research-meta-audit-2026-05-17/) — 30+ repo inventory was the basis for this brand list
- [Doc 665](../../agents/665-bonfires-deep-dive-zao-integration/) — Bonfires brand entry on the kit
- `project_zao_brand_legal_architecture.md` memory — BCZ Strategies LLC as the legal hub for all the brands; informed the "Agency + Personal" category
- `project_zao_vs_zabal_projects.md` memory — taxonomy of ZAO vs ZABAL projects; informed the category split
- `project_nexus_hub_live.md` memory — prior nexus directory at 14 brands; this kit extends to 25 with the entrepreneurial layer

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Review + merge [bettercallzaalwebsite #5](https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5) | @Zaal | PR review | This week |
| After merge: vercel preview lights up at `bettercallzaal.com/kit.html` automatically | (auto) | Deploy | Auto |
| Add `/kit.html` to footer nav site-wide | @Zaal | Follow-up PR | Next sprint |
| Decide whether `vercel.json` should ALSO redirect `/nexus.html` → `/kit.html`, or keep both | @Zaal | Decision | Next sprint |
| Build OG images per brand for shareable previews | @Zaal | Future PR | Optional |
| Add a "submit your brand" form for community-incubated projects | @Zaal | Future PR | Optional |
| When a new brand launches, follow the "How To Extend" section above | @Zaal | Recurring | As needed |

## Sources

- [PR #5 — bettercallzaal/bettercallzaalwebsite](https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5) — the shipping PR
- Existing nexus.html design system (reused verbatim)
- Doc 661 graduation-readiness audit (661h status vocabulary)
- Doc 663 ecosystem inventory (30+ repo list)
- Memory files: `project_zao_brand_legal_architecture.md`, `project_zao_vs_zabal_projects.md`, `project_nexus_hub_live.md`, `project_bonfires_zao_integration.md`, `project_bz_builds_show.md`, `project_bcz_strategies_llc.md`
