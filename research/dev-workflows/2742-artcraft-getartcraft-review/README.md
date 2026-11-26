---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-11-26
superseded-by:
related-docs: ""
original-query: "https://getartcraft.com/ review this /zao-research"
tier: STANDARD
---

# 2742 - ArtCraft (getartcraft.com): SKIP as a dependency, optional public-content trial

> **Goal:** Decide whether The ZAO should depend on, integrate or recommend ArtCraft, a free open-source set of Rust creative tools with hosted AI model access.

Source page: private Notion research page "Research: ArtCraft (getartcraft.com), 26 Nov, STANDARD tier, verdict SKIP", written 2026-11-26 by one read-only worker (WebFetch summaries plus search, so quotes are summaries, not raw text). Four load-bearing claims were re-checked with raw curl or by reading files on 2026-11-26; they are marked CHECKED.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SKIP ArtCraft as a ZAO dependency or integration.** | No onchain, social or community layer. The music side is a feature built on hosted Suno credits. Its own DAW, SoundCraft (v0.20.1), is marked In development. |
| 2 | **OPTIONAL: one member trial of SoundCraft or ArtCraft Studio, public or throwaway content only.** Do it only if a member asks. | /terms and /privacy return 404 (CHECKED 2026-11-26 by curl; /terms-of-service also 404 per the research worker, not re-checked), so output ownership and training-on-content language are unknown. Do not put member or unreleased audio through it. |
| 3 | **DO NOT contact the ArtCraft team on our own.** Outbound to hello@storyteller.ai is Zaal's call, and only if a member wants to use it. | Terms and output ownership are the open question, and only the owner of the relationship should ask. |

## What it is

- Free open-source creative tools in Rust: 17 "Craft Apps" plus ArtCraft Studio, a generative app that composes scenes and renders them with hosted image and video models (Midjourney, Flux, Nano Banana, GPT Image, Kling, Seedance 2.0, Sora 2, Veo 3.1).
- Maker: "the ArtCraft team", GitHub org storytold. No individual is named on the pages read.
- Stack: Rust desktop apps for macOS, Windows and Linux, many also as WebAssembly. Automation through a CLI, a JSON control channel or an MCP server.
- Music and sound: five Suno or Seed Audio models listed in the README. SoundCraft is a separate free DAW (multitrack audio and MIDI, CLAP plugins).
- Web3: no mention of minting, NFTs or onchain anything on the pages read (UNVERIFIED beyond those pages).
- Liveness: the home page https://getartcraft.com returned HTTP 200 in this doc author's own check on 2026-11-26. The source Notion page itself recorded a 200 only for /pricing.

## Pricing (getartcraft.com/pricing, CHECKED 2026-11-26, HTTP 200)

The app is free. Optional yearly plans: Basic 1,000 credits a month for $96 a year, Pro 3,750 for $336, Max 6,600 for $576, Enterprise custom. Credits do not expire; failed generations are refunded.

## Licence (CHECKED by reading files)

The README says dual-licensed MIT or Apache-2.0, and the LICENSE-MIT file opens "MIT License, Copyright (c) 2026 ArtCraft Team and the ArtCraft contributors" (read 2026-11-26). A third-party review says the NOTICE file lists material the team does not own (including Nintendo sound effects and meme images) that is still to be replaced, and that the backend repo artcraft-services shows no recognized licence. The client code would pass the standing licence rule (MIT or Apache-2.0) with credit; the NOTICE caveat applies. The rule lives at `.claude/rules/credit-attribution.md`.

Credit line (required if any code is ever adopted): storytold/artcraft, MIT or Apache-2.0 (LICENSE-MIT read 26 Nov 2026); its NOTICE lists third-party assets.

## Terms and data (the weak spot)

/terms and /privacy both return 404 (CHECKED, curl, 2026-11-26). The worker also found /terms-of-service 404 and no terms or privacy page in sitemap.xml (46 URLs). The FAQ does not cover ownership, data or privacy. Output ownership and any training-on-user-content language: UNVERIFIED. The third-party review says prompts and images go to whichever provider renders them, so that provider's terms apply.

## Community and health

- Product Hunt: 68 upvotes, ranked #70 on launch day, no reviews yet. No Reddit or Hacker News thread found (one search, not exhaustive).
- GitHub API (CHECKED 2026-11-26): 42,406 stars, 807 open issues, created_at 2022-03-31. The third-party review gave 343 open issues and 31,078 or 42,389 stars, so its numbers are soft. It also says the git history was reset in September 2026 and the client moved from fair source to MIT or Apache-2.0 on 10 Oct 2026 (PR #2043). Heavy AI assistance in the code and "vaporware until shown otherwise" skepticism are the review's words, not verified.

## Comparison

| Tool | One line |
|---|---|
| ComfyUI | Modular diffusion GUI, API and backend with a node graph; GPL-3.0; 148.7k stars. The local, no-account AI image route. |
| Ardour | Open-source DAW; 5.5k stars on the mirror repo; licence not extracted. The established audio route versus SoundCraft. |
| Krita | Free-software painting tool; licence and cost not fetched (PARTIAL). For hand-drawn art. |
| ArtCraft | One launcher plus hosted model access; pre-1.0; no onchain layer. |

## Risks

- No terms page, so output ownership is unknown.
- Default generation is hosted and paid, so it depends on ArtCraft's servers and third-party providers (Suno, Midjourney, Sora).
- Unlicensed third-party assets in NOTICE.
- Pre-1.0 and fast-changing with thin provenance.
- Any code adoption needs a credit line under the credit-attribution rule.

## Sources (fetched 2026-11-26)

- [FULL] https://getartcraft.com/sitemap.xml, https://getartcraft.com/pricing, https://getartcraft.com/faq/models-supported, https://getartcraft.com/apps/soundcraft
- [PARTIAL - summary only] https://getartcraft.com home
- [PARTIAL - index only] https://getartcraft.com/faq
- [PARTIAL - repo page and raw README read via summary] https://github.com/storytold/artcraft
- [PARTIAL - community source, no reviews yet] https://www.producthunt.com/products/artcraft/reviews
- [PARTIAL - third-party review, summary only] andrew.ooo review of ArtCraft
- [PARTIAL - repo page only] ComfyUI repo page, Ardour repo page
- [PARTIAL - licence and cost not fetched] https://krita.org/en/about
- [FAILED - 404] https://getartcraft.com/terms, https://getartcraft.com/terms-of-service, https://getartcraft.com/privacy
- Search snippet only, not fetched: https://sourcepulse.org/projects/23303774
- Not covered: the other 15 app pages, news pages, exact launch date.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Merge this doc: done when the PR is merged to main after an evaluator verdict | Desktop coordinator | PR | 2026-12-03 |
| Ask the ArtCraft team for terms and output ownership: done when Zaal has sent or declined the email to hello@storyteller.ai. Only if a member wants to use it. | Zaal | Other | wontfix unless a member asks |
| Optional member trial of SoundCraft or ArtCraft Studio, public content only: done when a member reports back or the item is closed | Zaal | Todo | wontfix unless a member asks |
| Re-validate this doc if a terms page appears: done when /terms returns 200 and ownership is read | Desktop coordinator | Todo | 2026-12-26 |

## Also See

- Credit rule: `.claude/rules/credit-attribution.md`
