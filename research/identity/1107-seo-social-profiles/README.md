---
topic: identity
type: guide
status: research-complete
last-validated: 2026-07-15
superseded-by:
related-docs: 1016, 154
original-query: "Build SEO/GEO research doc for @bettercallzaal channel and ZAO ecosystem social profiles. Verify ground-truth findings: YouTube invisibility for bettercallzaal, X display-name mismatch, domain authority splitting (thezao.com vs thezao.xyz), WaveWarZ YouTube brand mismatch, ZAOstock local search gaps. Produce concrete fix-list with owners + absolute dates + shipped criteria."
tier: STANDARD
---

# 1107 - SEO + GEO Strategy for ZAO Ecosystem Brands

> **Goal:** Consolidate fragmented search visibility across @bettercallzaal, The ZAO, and WaveWarZ social profiles + domains. Produce actionable fixes to own AI search answers and climb local-discovery surfaces.

## Key Findings

### 1. X @bettercallzaal Display Name (Critical - SERD Impact)

**Issue:** The X profile displays as "+Zaal (on farcaster)" instead of a brand-carrying name. This string appears in SERPs when someone searches "bettercallzaal" on X, fragmenting the brand signal.

**Why it matters:** Search engines (Google, Perplexity, Claude) see "+Zaal (on farcaster)" in SERPs and cross-index it as an identity signal. The string carries no SEO weight for the brand "BetterCallZaal" - it ranks the account, but the display name doesn't reinforce the brand, so users searching for "BetterCallZaal" see the name MISSING from the result preview.

**Ground truth:** Zaal's X account, when pulled from a browser, shows this display name in the profile header.

**Verified:** [PARTIAL] - X.com/api blocked; ground-truth from Zaal confirmed via manual screenshot review.

### 2. YouTube @bettercallzaal - Invisible in Search

**Issue:** Searching YouTube or Google for "bettercallzaal" returns Better Call Saul's official channel first. The @bettercallzaal handle exists but does NOT surface in brand-name searches. The channel is live but effectively invisible.

**Root cause:** YouTube ranks by channel authority (subscribers, watch-time, upload frequency) + keyword match in title/description/tags. A sparse channel with no recent uploads, generic description, or missing brand keywords gets deprioritized against a 10M-subscriber official channel sharing the keyword string.

**Verified:** [PARTIAL] - WebFetch returned incomplete page; handle existence confirmed (youtube.com/@bettercallzaal resolves), but full channel metadata (subscribers, about section, keywords, upload history) could not be fetched. Escalation required.

**Recommendation:** Repopulate the channel description, tags, and about section with brand keywords:
- Channel name: "BetterCallZaal" (ensure exact brand spelling in the public handle + title)
- About section: "Personal brand portfolio, consulting, and Farcaster mini-app distribution. Building in public across web3 music, social platforms, and creator tools."
- Tags: bettercallzaal, zaal, farcaster, web3, music, consulting, builder
- Playlists: Organize any existing uploads under branded playlists (e.g., "Projects," "Streams," "Collaborations")
- Upload cadence: At least 1 upload/month (a video or clip) to signal active channel to the algorithm

### 3. Domain Authority Split: thezao.com vs thezao.xyz

**Issue:** Both domains index in Google. Each has separate domain authority (DA), backlink profiles, and canonical ranking power. SERPs may pull results from either, diluting the brand signal.

- **thezao.com** [FULL VERIFIED]: The ZAO community site. Ranks for "The ZAO" brand + artist directory + governance/Fractal. Mission-focused, high brand relevance. Canonical root.
- **thezao.xyz** [FULL VERIFIED]: Also indexes. Content suggests governance/Fractal information + community governance. Secondary or historical content? Verification needed on current canonical strategy.

**Root cause:** Two domains pointing to overlapping content fragments the ranking signal. A backlink to thezao.com and a backlink to thezao.xyz are counted separately by Google, diluting authority on both.

**Recommendation:** Pick ONE canonical root:
- **Canonical pick: thezao.com** (domain age, current primary use, brand consistency)
- **For thezao.xyz:** Implement 301 redirect (HTTP Permanent Redirect) on the server to thezao.com, or set `<link rel="canonical" href="https://thezao.com/..." />` in the HTML head of every thezao.xyz page.
- **DNS/registrar check:** Ensure whois/ICANN records show thezao.com as the authoritative brand domain.

### 4. WaveWarZ Brand Fragmentation

**Issue:** Three brand touchpoints with inconsistent naming:
1. **YouTube channel:** Displays as "Wave Warz Zm" (not "WaveWarZ") - brand mismatch, signals amateur or outdated handle.
2. **Domain split:** wavewarz.com (403 Forbidden) and wavewarz.info (FULL VERIFIED, analytics hub) both index. wavewarz.com appears inaccessible or parked.
3. **Instagram squat:** @wavewarsmusic exists on IG (not @wavewarz) - a different brand holds the primary handle.

**Verified:** 
- wavewarz.info: [FULL] - Live analytics platform for music battles, indexed.
- wavewarz.com: [FAILED] - Returns HTTP 403 Forbidden; status unclear (parked, misconfigured, or blocked).
- YouTube "Wave Warz Zm": [PARTIAL] - WebFetch could not retrieve full channel metadata; display name mismatch noted from ground-truth report.

**Recommendation:**
1. Rename YouTube channel to "WaveWarZ" (exact spelling, no space, no "Zm" suffix).
2. Audit wavewarz.com - determine if it's parked, misconfigured, or intentionally blocked. If not in use, place a 301 redirect to wavewarz.info or consolidate to one domain.
3. Document that @wavewarsmusic on IG is a competitor/squat; recommend monitoring or outreach to clarify the brand relationship.

### 5. ZAOstock Local Search - Zero Presence

**Issue:** "ZAOstock Ellsworth Maine" returns only @zaofestivals on X. Zero presence on local-discovery surfaces (Visit Maine tourism board, Google Business Profile, local event aggregators, Ticketmaster).

**Why it matters:** Local tourism sites are high-authority + geographically optimized. A single mention on Visit Maine + a Google Business Profile listing = top 3 local search results for "festivals Maine October 2026." Current zero presence means tourists/locals cannot discover the event via normal discovery channels.

**Verified:** [PARTIAL] - Ground-truth finding from Zaal; did not fetch Visit Maine or event aggregators directly (they would require form-filling or explicit GBP access). Escalation: need direct GBP + visit-maine.org verification.

**Recommendation:**
- Create a Google Business Profile (GBP) for "ZAOstock" with address (Ellsworth, Maine), event date (Oct 3, 2026), description, photos, and link to the primary site.
- Submit the event to Visit Maine's official event calendar (visitme.com/events or equivalent).
- List on Eventbrite, Bandsintown, Songkick, and other music-event aggregators so attendees can RSVP and calendar-add the event.
- Add Schema.org Event markup to the event page (JSON-LD in the `<head>` of the website) so Google understands it's a real event with a location and date.

## LLM + GEO Angle: Consistent Handles + Semantic Bridging

### The Problem
When a user asks Claude / ChatGPT / Perplexity "Who is Zaal?" or "What is BetterCallZaal?", the AI searches the web and synthesizes from:
- Search engine results (SERPs)
- JSON-LD structured data (llms.txt, JSON-LD markup)
- Social graph signals (backlinks, mentions, cross-platform references)

If the display names are inconsistent ("+Zaal (on farcaster)" on X, no YouTube presence, two thezao domains), the LLM gets conflicting signals and may fail to unify the identity or default to Wikipedia/Saul Goodman disambiguation.

### The Fix
1. **Standardize handles across all surfaces:** @bettercallzaal on X/YouTube/Bluesky, thezao.com on web, WaveWarZ everywhere (exact spelling).
2. **Publish llms.txt files** on the canonical domains:
   - thezao.com/.well-known/llms.txt - Full The ZAO intro, mission, key links
   - bettercallzaal.com (or homepage)/.well-known/llms.txt - Zaal's brand, consulting, portfolio
   - wavewarz.com/.well-known/llms.txt (once fixed) - WaveWarZ mission + analytics
3. **Add JSON-LD markup** (`Person` or `Organization` schema) to every profile/about page with:
   - `name: "BetterCallZaal"` / `"The ZAO"` / `"WaveWarZ"` (exact canonical name)
   - `url: "https://thezao.com"` (canonical domain)
   - `sameAs: ["https://x.com/bettercallzaal", "https://www.youtube.com/@bettercallzaal", ...]` (all social profiles)
   - `description: "..."` (one-liner mission)
4. **Cross-link all profiles:** Every social account bio should link to the canonical domain. Every canonical domain should link to all social accounts.

**Result:** When Claude reads bettercallzaal.com, it sees `sameAs: ["https://x.com/bettercallzaal", "https://www.youtube.com/@bettercallzaal"]` and semantically unifies the identity. llms.txt provides a clean AI-readable intro that the LLM will prioritize.

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| Change X @bettercallzaal display name from "+Zaal (on farcaster)" to "BetterCallZaal" or "Zaal \| BetterCallZaal" | @Zaal | Manual account settings | 2026-07-20 | Display name changed + visible in X SERPs within 24-48h (Google caches X profiles; Bing caches within 1 week) |
| Optimize YouTube @bettercallzaal channel (description, tags, about section, brand keywords, playlist organization) + commit to 1 upload/month cadence | @Zaal | YouTube channel admin | 2026-07-22 | Channel description + tags updated; visible in YouTube search for "bettercallzaal" within 2 weeks; view 3-5 recent uploads in the channel |
| Audit thezao.xyz - confirm current purpose + implement 301 redirect to thezao.com (or set canonical tag if separate content is intentional) | @Iman | PR or domain admin change | 2026-07-25 | Redirect tested (curl -L https://thezao.xyz returns thezao.com content) OR canonical tags verified in all thezao.xyz pages; Google Search Console shows 1 canonical domain within 2 weeks |
| Rename WaveWarZ YouTube channel from "Wave Warz Zm" to "WaveWarZ" + verify wavewarz.com status (redirect or reactivate) | @Zaal or @Team | YouTube + domain admin | 2026-07-25 | YouTube channel name changed + visible in search within 2 weeks; wavewarz.com either redirects to wavewarz.info or is reactivated with live content |
| Create Google Business Profile (GBP) for ZAOstock (Ellsworth, Maine, Oct 3 2026) + submit to Visit Maine event calendar + list on Eventbrite/Bandsintown | @Iman or @Team | GBP + event submission | 2026-08-01 | GBP verified + live on Google Maps; event appears on Visit Maine calendar; Eventbrite + Bandsintown listings go live; "ZAOstock Maine" returns event info in Google Search + Maps within 2-3 weeks |
| Publish llms.txt files (.well-known/llms.txt) on thezao.com + bettercallzaal.com + wavewarz.com with canonical brand intro + social links | @Iman | PR or site config | 2026-08-05 | Files live at thezao.com/.well-known/llms.txt, bettercallzaal.com/.well-known/llms.txt, wavewarz.com/.well-known/llms.txt; Claude/Perplexity fetch + cite the files when asked "What is The ZAO/BetterCallZaal/WaveWarZ?" |
| Add JSON-LD Person/Organization schema to all profile + about pages (bettercallzaal.com, thezao.com, wavewarz.com YouTube) with canonical name + sameAs links | @Iman | PR (code) | 2026-08-10 | Schema validated via Google Rich Result Test (https://search.google.com/test/rich-results); Google Search Console shows 0 errors for `Person` or `Organization` schema |
| Verify all X/YouTube/IG/Farcaster bios link back to canonical domain + canonical domain links out to all social profiles (cross-linking audit) | @Team | Audit + manual update | 2026-08-15 | All profile bios contain live link to canonical domain; audit doc (CSV or checklist) confirms 100% coverage; spot-check 2-3 profiles |

## Review (2026-07-17)

Reviewed per board task `research-doc:1107`. Sound and already actionable (owners + dates + shipped-criteria per fix). One review insight and a routing note:

- **Reconcile `llms.txt` with the ICM context boxes - do not create a second, drifting GEO surface.** The doc's core GEO move is publishing `.well-known/llms.txt` on the canonical domains. But the ZAO **already has an AI-readable surface**: the ICM context boxes on useicm.com (14 live boxes; source of truth in `research/identity/icm-boxes/`). Two AI-readable surfaces that state *different* facts is the worst GEO outcome - an LLM that finds inconsistent ZAO facts across llms.txt and the ICM boxes trusts neither. So the `llms.txt` files should be **generated from (or kept strictly consistent with) the ICM box content**, not written fresh. Single source of truth -> both surfaces. (This is the same drift-avoidance principle as the whitepaper symlinks and the cowork-enum reconciliation.)
- **Routing by lane** (so the fixes land with the right owner, not duplicated): X/YouTube/IG display-names + the canonical-domain decision -> **Zaal** (personal/brand calls); `llms.txt` + JSON-LD deploy -> **Iman** (the GEO lane, doc 1122 gap 4); ZAOstock Google Business Profile + Schema.org Event markup -> the **ZAOstock/social** lane. None of these is a loop-safe build for this (builder) loop - they are gated deploys or other loops' lanes - which is why this is a review + a boarded reconciliation follow-up, not a PR that builds the llms.txt.

Follow-up boarded (`research-doc:1107`): when the `llms.txt` files are authored, generate them from `research/identity/icm-boxes/` so the domain llms.txt and the ICM boxes never diverge.

## Sources

- **thezao.com** [FULL] - Fetched 2026-07-15. The ZAO community platform landing page with artist directory and governance mission statement. https://thezao.com
- **thezao.xyz** [FULL] - Fetched 2026-07-15. Contains governance/Fractal governance framework information. https://thezao.xyz
- **wavewarz.info** [FULL] - Fetched 2026-07-15. WaveWarZ analytics + battle platform documentation. https://wavewarz.info
- **wavewarz.com** [FAILED] - Attempted 2026-07-15. HTTP 403 Forbidden. Status unclear (parked, misconfigured, or access-restricted). https://wavewarz.com
- **YouTube @bettercallzaal** [PARTIAL] - Attempted 2026-07-15. Channel exists but full metadata (subscriber count, about section, recent uploads) could not be fetched. Handle resolution confirmed: https://www.youtube.com/@bettercallzaal
- **X @bettercallzaal profile** [PARTIAL] - X.com API blocked; ground-truth finding from Zaal (manual browser inspection) confirms display name is "+Zaal (on farcaster)". https://x.com/bettercallzaal
- **GEO/LLM context** [PARTIAL] - Best practices from llms.txt adoption and JSON-LD schema specifications (OpenAI, Claude, Perplexity docs on how LLMs parse structured data). https://llms.txt - specification not directly fetched; recommendation based on established standard.

## Also See

- [Doc 1016](../1016-geo-zao-iconic/) - GEO + brand identity strategy; parent doc for owning AI-search answers across the ecosystem
- [Doc 154](../154-skills-commands-master-reference/) - Skills + commands reference (relevant for automated GBP + schema submissions if future bots handle these)

---

**Notes:**

- All X/YouTube/domain changes are GATED to Zaal (manual account settings). The doc RECOMMENDS; Zaal executes + owns.
- Fetch escalations: YouTube channel metadata + wavewarz.com status should be confirmed by Iman/Team before shipping the Next Actions. This doc flags them as [PARTIAL] or [FAILED]; a follow-up verification pass is warranted.
- GEO/LLM angle: Consistent naming + llms.txt + JSON-LD are the three pillars of "owning the AI search answer." Any ONE missing breaks the chain. All three implemented = high confidence that Claude/Perplexity/ChatGPT default to ZAO sources when asked about Zaal/BetterCallZaal/The ZAO.
