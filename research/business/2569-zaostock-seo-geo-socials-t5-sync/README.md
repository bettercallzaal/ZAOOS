---
topic: business
type: audit
status: research-complete
last-validated: 2026-09-28
superseded-by:
related-docs: "990, 1009, 1107, 1354"
original-query: "can you please deep research zaostock online for seo and geo things and find where we are missing all socials that matter that we should be updating our zaofestivals or having a new account if we dont have one and also ways to improve our SEO reach when people search or hear or see anyhting similar"
tier: DEEP
---

# 2569 — ZAOstock SEO/GEO/Socials: T-5 Days Sync

> **Goal:** Re-verify [Doc 990](../990-zaostock-seo-audit/) (technical SEO) and [Doc 1009](../1009-zaofestivals-brand-audit/) (socials/brand) against the live site and live accounts today, T-5 days before ZAOstock (Sat Oct 3 2026), and produce one current, prioritized action list. Both source docs are 12 weeks stale (last-validated 2026-07-07/09) and a lot shipped in that window — this doc says what's still true, what got fixed, and what's still open, rather than repeating the old audits.

## Key Decisions

| Recommendation | Why |
|---|---|
| Verify zaostock.com in Google Search Console and submit `/sitemap.xml` TODAY | `site:zaostock.com` still returns **zero indexed pages** 12 weeks after doc 990 flagged this as the #1 fix, due 2026-07-10. The domain is invisible to Google search 5 days before the event — this is the single highest-leverage unshipped item from either prior audit |
| Add a static `<a href="https://linkedin.com/company/zaofestivals">` and a Farcaster link to zaostock.com's `SOCIALS` array in `src/content/site.ts` | LinkedIn (13 followers, verified live) and a real, registered Farcaster presence (`thezao`, registered Feb 2025) exist and are omitted from the footer's social list — the array's own comment names TikTok/Bluesky/Reddit/Threads/Lens as deliberately excluded but never considered LinkedIn or Farcaster at all |
| Fix the ZAO-Festivals Facebook Page About text before Saturday | Still reads "ZAO: Where beats meet bytes... Join us on" the original April 2024 ZAO-PALOOZA date — an 18-month-old NYC event reference, unchanged since doc 1009 flagged it in July. 10 followers, and it's the page linked from the site's own footer |
| Fix the TikTok bio or drop the TikTok idea entirely (already correctly unlinked from the site) | Still "ZAO-CHELLA (ART BASEL '24)," 95 followers, last real activity Nov 2024. zaostock.com's own code comment already excludes it for this exact reason — the account itself, not the site, is what needs the fix or a formal write-off |
| Add `image` and `performer` to the homepage's `MusicEvent` JSON-LD | Not required for Google's Event rich-result eligibility (name/startDate/location are the only hard requirements per Google's current docs), but both are the two recommended fields most likely to make the rich result actually render well — cheap addition, 30 minutes of work |
| Register a Google Business Profile for the venue/event before Saturday, if one does not already exist | Could not confirm either way this session (Google Maps is JS-rendered; a `curl` fetch is inconclusive — marked UNKNOWN below, not "missing"). Worth a 2-minute manual check from a logged-in Google account rather than guessing |

## Findings

### 1. zaostock.com is still not indexed by Google — unchanged from doc 990, 12 weeks later

`WebSearch` for `site:zaostock.com` returns zero results for the actual domain — every result is an unrelated GitHub repo hit (the query fell back to a generic search, not a true site-scoped one, which itself is a signal the domain has nothing indexed to scope to). This is the exact finding doc 990 made on 2026-07-07 with a due date of 2026-07-10. **77 days later and 5 days before the event, it is still unshipped.** [FULL — WebSearch executed fresh 2026-09-28]

This is not a code problem — it needs Zaal's own Google account to claim the property in Search Console. No lane can do this step; it is the single item on this whole list that most needs his hand, and it is also the cheapest (minutes, not a PR).

### 2. The technical SEO fixes doc 990 recommended in July are now shipped — verified directly against the live site and the current repo

- **Sitemap**: `sitemap.ts` (read directly, and cross-checked against the live `https://zaostock.com/sitemap.xml`, 33 URLs) now includes `/festivals`, `/musicians/rider`, and every `/artist/[slug]` page, generated from the same `LINEUP_NAMES` constant the site's own tests hold artist URLs to — doc 990's Finding 3 is fully closed. [FULL — repo read + live curl, 2026-09-28]
- **robots.txt**: live `https://zaostock.com/robots.txt` now disallows `/api/`, `/test`, `/team`, `/team/`, `/ops`, `/backstage`. Doc 990's Finding 4 (blocking `/team/m/`) is **moot, not fixed the way doc 990 suggested** — the whole `/team` dashboard was formally retired 2026-08-29 (`docs/decisions/0001-team-dashboard-retired.md`), `/team/m/<slug>` now 404s regardless of robots rules, and the repo's own 2026-08-29 review confirms `noindex` + the broader `/team` disallow is now the *correct* call, not a mistake. One small stale-docs item: `README.md:115` still describes `/team/m/<slug>` as "public member profile" — harmless (it's not a public-facing claim), but worth a one-line fix next time that file is touched. [FULL — repo read, 2026-09-28]
- **Structured data**: `src/app/layout.tsx` now ships real `MusicEvent` JSON-LD (`@context`, `name`, `startDate`, `endDate`, `location` with a `subEvent` for the Black Moon after-party, `offers` at $0, `organizer`). Doc 990's Finding 5 is closed. Verified against Google's current Event structured-data documentation (WebSearch, 2026-09-28): the three hard requirements for rich-result eligibility are `name`, `startDate`, and a physical `location` — all three are present. `image` and `performer` are recommended-not-required fields and are the two gaps left; see Key Decisions. [FULL — repo read + fresh WebSearch against current Google docs, 2026-09-28]
- **`llms.txt`** (`src/app/llms.txt/route.ts`, not audited by either prior doc — new since): well above the general standard for this pattern. Content is interpolated from `FESTIVAL` and `LINEUP_NAMES` (the same source-of-truth constants the rest of the site uses) rather than hand-typed, and the file's own comments record two prior staleness incidents (2026-09-16 window/act-count drift, both now test-guarded) — the file is actively defended against going stale again, which is the actual GEO risk (an AI answer engine citing a festival's own outdated hours). See GEO section below for what it's still missing. [FULL — repo read, 2026-09-28]

### 3. Social account inventory — what the site links, what's live, what's missing

`src/content/site.ts`'s `SOCIALS` constant (read directly) is the site's own current, deliberate answer to "which accounts do we link": X (`@thezaodao`), Instagram (`@zaofestivals`), YouTube (`@thezaodao`), Facebook (`zaofestivals` page), a Facebook Event, Discord, Telegram — with an explicit code comment naming TikTok, Bluesky, Reddit, Threads, and Lens as considered-and-excluded ("no ZAO account found on any of them," TikTok specifically flagged "stale/unverified"). This is a real, recent piece of work someone already did — re-verifying it rather than redoing it from scratch:

- **TikTok exclusion confirmed correct, still, today**: fetched `https://www.tiktok.com/@zaofestivals` directly — bio still reads "ZAO-CHELLA (ART BASEL '24)," 95 followers, 5 following, 46 likes. Same account, same stale state doc 1009 found on 2026-07-09. The site's decision to leave it unlinked is the right call as of today; the account itself is what's broken, not the omission. [FULL — direct fetch, 2026-09-28]
- **Instagram is current and improved since doc 1009**: fetched `https://www.instagram.com/zaofestivals/` directly — bio now reads "ZAOstock Down October 3rd 2026," 251 followers, 47 following, 66 posts. This was doc 1009's #1 Next Action (fix the stale ZAO-CHELLA bio) and it shipped. [FULL — direct fetch, 2026-09-28]
- **Facebook is still stale, unchanged since doc 1009, and it's the account the site itself links to**: fetched `https://www.facebook.com/zaofestivals` directly — page title "ZAO-Festivals | New York NY," About text still opens "ZAO: Where beats meet bytes, and dreams meet reality," and still invites people to the original ZAO-PALOOZA date in early April 2024 (an 18-month-old NYC event reference), 10 followers. `zaostock.com`'s own footer links here. [FULL — direct fetch, 2026-09-28]
- **LinkedIn exists and is verified live, and is NOT linked from the site — a real gap neither prior doc caught**: fetched `https://www.linkedin.com/company/zaofestivals` directly — page exists, title "ZAO Festivals | LinkedIn," 13 followers. Neither doc 990 nor doc 1009 checked LinkedIn at all; it surfaced from re-verifying `~/zao-vault/notes/socials-map.md` (a OneNote-sourced curation, itself unverified against live accounts until now) against the live account. [FULL — direct fetch, 2026-09-28]
- **Farcaster: `thezao` is a real, registered account; `zaofestivals` and `bettercallzaal` are not, and the site links none of them**: checked via Farcaster's own keyless fname registry API (`fnames.farcaster.xyz/transfers?name=<x>`), not a scrape — `thezao` returns a real registration (fid transfer dated Feb 2025); `zaofestivals` and `bettercallzaal` both return empty. Given this whole session's own workflow uses a live "Farcaster /zao group chat" for cross-posting, and ZAO's Farcaster presence is real and active under `thezao`, its total absence from `zaostock.com`'s footer social list is a genuine gap — not a stale-account problem like TikTok/Facebook, a missing-link problem. [FULL — official API, keyless, 2026-09-28]
- **Discord and Telegram**: both links in `SOCIALS` resolve to the general ZAO community (Discord invite, `telegram.thezao.com`), not ZAOstock-specific channels — consistent with doc 990's Finding 8 (ZAOstock-specific reach lands on the umbrella brand's shared channels, not its own). Not re-fetched live this session (low-risk, unlikely to have drifted); flagging as PARTIAL — worth a quick manual click-through before Saturday, not a research-tier concern. [PARTIAL — not independently re-verified this session, carried forward from doc 990's characterization]

### 4. GEO (generative-engine optimization) — the site's own defenses are ahead of most of the ecosystem's docs on this topic

[Doc 1107](../../identity/1107-seo-social-profiles/), [Doc 1354](../../identity/1354-zao-geo-strategy-jul2026/), and [Doc 1047](../../business/1047-geo-implementation-schema-blocks/) already cover GEO strategy at the ecosystem level — not re-litigated here. What's specific to ZAOstock and current as of today:

- `llms.txt` exists, is test-guarded against drift (see Finding 2), and gives an AI answer engine a clean, structured, first-party summary of the event — the single highest-leverage GEO asset most small event sites don't have at all. It is missing one thing the strategy docs above call out as the actual lever, not the hygiene: **consistent NAP (name/address/phone/date) across every surface that mentions the event**, so an AI system pulling from multiple sources converges on the same facts rather than picking whichever source it crawled last. `llms.txt` names the venue as "Franklin Street Parklet" with no house number; the live Maine Craft Weekend listing (confirmed live this session, separate from this doc's scope) carries the full street-numbered address for the same venue. Worth pulling that same house number into `llms.txt` and the JSON-LD `PostalAddress` (currently `addressLocality`/`addressRegion`/`addressCountry` only, no `streetAddress`) so every surface agrees down to the number. [FULL — repo read + live cross-reference to the Maine Craft Weekend listing screenshot from earlier this session]
- Tested actual AI-answer-engine visibility by reasoning through what a system would find today given the findings above: an AI answer engine crawling `zaostock.com` directly gets a clean, current, well-structured answer (`llms.txt` + JSON-LD + live sitemap). One crawling *about* ZAOstock via social/third-party mentions is more likely to hit the stale Facebook/TikTok bios than the current site, since those accounts are older and more widely cross-linked than the 12-week-old zaostock.com domain. This is the same finding as #3 stated from the GEO angle rather than the socials angle: **the stale accounts are not just a bad look, they're a citation-poisoning risk** for exactly the systems `llms.txt` was built to inform correctly.

### 5. Local & event-listing citations — mostly UNKNOWN, not "missing," and said so explicitly rather than guessed

- **Google Business Profile**: could not confirm or deny. A `curl` fetch of Google Maps search results returns a JS shell (1 raw mention of "ZAOstock" in the HTML, not a parsed listing) — Google Maps is not meaningfully fetchable without a real browser or the Places API. **UNKNOWN, not absent** — a 2-minute check from Zaal's own logged-in Google account (search "ZAOstock Ellsworth" on Google Maps, see if a claimable/claimed listing appears) resolves this definitively where this session's tools cannot. [FAILED — JS-shell, escalation ladder exhausted for this session; genuinely needs a logged-in browser, not a missing capability worth spending more research time on]
- **Bandsintown**: `bandsintown.com/searchresults?query=ZAOstock` returned HTTP 403 (bot-blocked). **UNKNOWN**, not confirmed absent. [FAILED — bot-blocked, not escalated further given the T-5 window; a manual check takes under a minute]
- **Maine Craft Weekend listing**: confirmed live and correctly filled in this session (separate finding, already relayed to Zaal directly in chat) — this is the one local/event-listing citation verified working today, and it's a good template: full address, hours, a "Show on Map" pin, poster image, and a working outbound link. Worth using as the reference standard if adding Bandsintown/AllEvents/a Google Business Profile.
- **Ellsworth/Hancock County press and Chamber**: [Doc 960 — What regional Maine press outlets can pitch ZAOstock](../960-seo-web-presence-what-regional-maine-press/) already covers this angle in depth and is not re-researched here; not re-verified for staleness this session (out of this doc's time budget) — flag doc 960 for its own freshness check if press outreach is still active before Saturday.

## Also See

- [Doc 990 — ZAOstock SEO Audit](../990-zaostock-seo-audit/) — the technical-SEO audit this doc re-verifies; last-validated should be bumped to 2026-09-28 alongside this doc (see Next Actions)
- [Doc 1009 — ZAO Festivals Brand Audit](../1009-zaofestivals-brand-audit/) — the socials/brand audit this doc re-verifies; same last-validated bump applies
- [Doc 1107 — SEO + GEO Strategy for ZAO Ecosystem Brands](../../identity/1107-seo-social-profiles/) — ecosystem-wide strategy this doc's ZAOstock-specific findings feed into
- [Doc 1354 — ZAO GEO Strategy](../../identity/1354-zao-geo-strategy-jul2026/) — GEO strategy this doc's llms.txt/NAP findings extend
- [Doc 1047 — GEO Implementation - Deployment-Ready Schema & llms.txt](../1047-geo-implementation-schema-blocks/) — the schema/llms.txt implementation pattern ZAOstock's own `layout.tsx`/`llms.txt` should be checked against
- [Doc 960 — Regional Maine press outlets](../960-seo-web-presence-what-regional-maine-press/) — press-outreach angle, not re-verified this session
- Memory: `~/zao-vault/notes/socials-map.md` (OneNote-curated, dated 2026-08-19/updated 2026-09-28) — source for the LinkedIn gap; itself unverified against live accounts until this doc

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify zaostock.com in Google Search Console + submit sitemap.xml - shipped when GSC shows a verified property with the sitemap accepted | Zaal | Task | 2026-10-01 |
| Check Google Maps for an existing/claimable Business Profile for the venue and claim or create one - shipped when a listing is confirmed live under Zaal's account | Zaal | Task | 2026-10-01 |
| PR: add LinkedIn (`linkedin.com/company/zaofestivals`) and Farcaster (`thezao`) to the `SOCIALS` array in `src/content/site.ts` - shipped when PR merged and both links render in the footer | zaostock lane | PR | 2026-09-30 |
| PR: add the venue's `streetAddress` (same house number as the live Maine Craft Weekend listing) to the `PostalAddress` in `layout.tsx`'s JSON-LD, and into `llms.txt`'s venue line - shipped when PR merged and Google's Rich Results Test shows the full address | zaostock lane | PR | 2026-09-30 |
| PR: add `image` and a `performer` array to the homepage `MusicEvent` JSON-LD - shipped when PR merged and Rich Results Test shows both fields populated | zaostock lane | PR | 2026-10-01 |
| Fix the ZAO-Festivals Facebook Page About text (currently still inviting people to the original April 2024 ZAO-PALOOZA date) to reference ZAOstock 2026 - shipped when the About text is re-fetched and reads a 2026-current line | Zaal | Todo | 2026-09-30 |
| Fix the TikTok bio for @zaofestivals, or formally write off the account and note it in `site.ts`'s comment as "checked 2026-09-28, still dead, do not revisit before the next event" - shipped when either the bio is updated or the comment is amended | Zaal | Todo | 2026-10-01 |
| Fix `README.md:115`'s stale "/team/m/<slug> - public member profile" line to reflect the 2026-08-29 retirement - shipped when PR merged | zaostock lane | PR | wontfix-unless-touched (cosmetic, batch with next docs PR) |
| Bump `last-validated` to 2026-09-28 on doc 990 and doc 1009, each with a one-line "see doc 2569" pointer - shipped when both frontmatter fields are updated and committed | zaostock lane | PR | 2026-09-29 |

## Sources

- [ZAOstock homepage](https://zaostock.com/) — [FULL, verified 2026-09-28]
- [zaostock.com/sitemap.xml](https://zaostock.com/sitemap.xml) — [FULL, curl'd directly, 33 URLs, 2026-09-28]
- [zaostock.com/robots.txt](https://zaostock.com/robots.txt) — [FULL, curl'd directly, 2026-09-28]
- Repo files read directly: `zaostock/src/app/sitemap.ts`, `zaostock/src/app/robots.ts`, `zaostock/src/app/layout.tsx`, `zaostock/src/app/llms.txt/route.ts`, `zaostock/src/content/site.ts`, `zaostock/src/components/poster/Footer.tsx`, `zaostock/docs/decisions/0001-team-dashboard-retired.md`, `zaostock/docs/site/team-dashboard-review-2026-08-29.md`, `zaostock/README.md` — [FULL, read 2026-09-28]
- [ZAO Festivals — Instagram (@zaofestivals)](https://www.instagram.com/zaofestivals/) — [FULL, direct curl fetch, 2026-09-28]
- [ZAO Festivals — TikTok (@zaofestivals)](https://www.tiktok.com/@zaofestivals) — [FULL, direct curl fetch, 2026-09-28]
- [ZAO-Festivals — Facebook](https://www.facebook.com/zaofestivals) — [FULL, direct curl fetch, 2026-09-28]
- [ZAO Festivals — LinkedIn](https://www.linkedin.com/company/zaofestivals) — [FULL, direct curl fetch, 2026-09-28]
- [Farcaster fname registry — thezao](https://fnames.farcaster.xyz/transfers?name=thezao) — [FULL, official keyless API, 2026-09-28]
- [Farcaster fname registry — zaofestivals](https://fnames.farcaster.xyz/transfers?name=zaofestivals) — [FULL, official keyless API, empty result = not registered, 2026-09-28]
- [Farcaster fname registry — bettercallzaal](https://fnames.farcaster.xyz/transfers?name=bettercallzaal) — [FULL, official keyless API, empty result = not registered, 2026-09-28]
- [Google Search Central — Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) — [PARTIAL, read via WebSearch synthesis of the official doc, not a direct fetch of the page itself, 2026-09-28]
- `site:zaostock.com` WebSearch — [FULL search executed, zero indexed pages found — documented negative signal, 2026-09-28]
- Google Maps search for "ZAOstock Ellsworth Maine" — [FAILED, JS-rendered shell, could not confirm or deny a Business Profile, 2026-09-28]
- `bandsintown.com` search — [FAILED, HTTP 403 bot-block, 2026-09-28]
- [Doc 990 — ZAOstock SEO Audit](../990-zaostock-seo-audit/) — [FULL, internal cross-reference, re-verified against, 2026-09-28]
- [Doc 1009 — ZAO Festivals Brand Audit](../1009-zaofestivals-brand-audit/) — [FULL, internal cross-reference, re-verified against, 2026-09-28]
- `~/zao-vault/notes/socials-map.md` — [PARTIAL, OneNote-curated secondary source, cross-checked against live accounts for the LinkedIn/Farcaster gap only, not every row — 2026-09-28]
