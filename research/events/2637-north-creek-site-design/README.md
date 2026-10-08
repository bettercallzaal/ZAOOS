---
topic: events
type: guide
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: 2635, 2629
original-query: "DJ Aquavantes is differetn than Oven Baked Beats add diff lines we also gotta relly research website design and go all night on research then spend the rest of the time building it and improving its abiltiyes"
tier: DISPATCH
---

# 2637 - North Creek site: visual design, type, color and abilities

> **Goal:** Decide the visual design system and the next abilities for northcreek.art (repo bettercallzaal/north-creek, `site/`), a static two-page band site with almost no band-supplied content. Doc 2635 already covered the feature checklist and the members record; this doc is the design and build layer on top of it.

**Read this first.** Four research agents ran in parallel on 2026-10-07 (exemplar sites, type/color/layout, static abilities, community sentiment). No agent could render a page: the Playwright bridge timed out, so every exemplar-site claim comes from markup, not pixels. Fonts were identified from raw HTML; where none appeared the font is UNKNOWN. Hex colors of exemplar sites are UNKNOWN throughout.

**Follow-through, 2026-10-08 05:22 EDT:** the rendering gap is now partly closed. Headless Chrome (the Chrome app on this Mac, `--headless=new`, 1280x900, 8 second virtual time budget) rendered 14 exemplar homepages on 2026-10-08; see Finding 7. The redesign built from this doc (north-creek PR #9) was audited with Lighthouse 12.8.2; see Finding 8.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | USE one characterful display face for the band name and headings, self-hosted woff2: Anton (12,004 bytes latin) as default | Type carries personality on the best low-asset band sites (Gregory Alan Isakov uses IM Fell English, Big Thief uses Unbounded, Alcest uses Domaine Text). Anton is the closest free match to the condensed black lettering on the only band art on record, the after-party flyer |
| 2 | SELF-HOST fonts from `site/fonts/` with each font's OFL.txt alongside; SKIP the Google Fonts CDN | Munich Regional Court I, Jan 2022: a Google-hosted font disclosed visitor IPs, damages awarded. Chrome partitions its HTTP cache since v86, so the shared-CDN speed argument is gone. OFL 1.1 requires the licence to travel with redistributed font files |
| 3 | RE-DERIVE the palette from the flyer: ink, cream paper, one coral accent; drop the mint-on-dark-green | Measured flyer pixels: black #090808 (33%), white #fdfdfd (42%), cream #f3dfc9 (6%), coral #e56653 (3.7%). The current palette (`site/style.css` `--accent:#7fc4a4`) shares nothing with it. Caveat: the flyer is Black Moon's art, not a band identity; Zaal or the band can veto |
| 4 | USE coral only for big shapes and large display on light backgrounds; USE a deeper coral #b23a28 for links and small text on cream | Coral #e56653 on cream measures 2.55:1, which fails WCAG 1.4.3 even for large text; #b23a28 on cream measures 4.59:1 |
| 5 | ADD fluid type with rem-anchored clamp() (Utopia method), gentle slopes, and test at 200% zoom | Roselli shows vw-heavy clamp can fail WCAG 1.4.4 (64px to 68px at 200% zoom in his example) |
| 6 | ADD cross-document view transitions, text-wrap balance on headings, and a reduced-motion guard, all as progressive enhancement | Zero JS. @view-transition: Chrome 126, Safari 18.2, about 86% global; Firefox navigates normally. prefers-reduced-motion is 96.45% global |
| 7 | SHIP 404.html, sitemap.xml, robots.txt now | All three were 404 on northcreek.art on 2026-10-07. Opened as north-creek PR #8 |
| 8 | HOLD security headers in `vercel.json` until Zaal rules whether "dont ever do stuff with vercel" covers that repo file | Orchestrator instruction 2026-10-07; draft is in Finding 5 below, not in any PR |
| 9 | REPLACE the empty "Next show / None announced yet" block with a plain line plus where to follow the band, once the band gives a follow link | Exemplar anti-pattern: a Tour heading with no dates (Sierra Hull) or a past gig under "Upcoming" (The Twang Bangers) |
| 10 | The site's job is bookers and press first, fans second; contact and one live video outrank decoration | Talent buyer Scott Cooper: a good site "implies the band takes their shit seriously"; live video and a working booking email are the most-agreed booker asks. Dissent recorded in Finding 4 |
| 11 | SKIP Web Share, PWA manifest, RSS, speculation rules, llms.txt for now | Each costs little but does nothing for two pages and one past show (Finding 5 verdict table) |
| 12 | LATER: .ics add-to-calendar, Event JSON-LD per show, auto past/upcoming script, lite embeds, EPK page | Each waits on band content: a confirmed future show, music links, bio, photos or contact. None may be invented |

## Findings

### 1. The site today (read 2026-10-07)

| Check | Result | Surface |
|---|---|---|
| Pages | home and `/afterparty`, one CSS file of 1,804 bytes | `site/index.html`, `site/afterparty/index.html`, `site/style.css` on north-creek main |
| Type | Georgia body, system-ui labels, h1 `clamp(44px,11vw,84px)` | `site/style.css` |
| Palette | dark green #0e1411, mint accent #7fc4a4, light mode cream #f5f3ee | `site/style.css` |
| Share card | Georgia wordmark, "Live at Black Moon", 26,567 bytes | `site/og.jpg` |
| Flyer | 356,547 byte JPEG; WebP 132,350 and 79,466 (750w) | `site/afterparty/` |
| robots.txt, sitemap.xml, 404 | all missing (404) | curl of northcreek.art, 21:20 EDT |
| Lineup | Oven Baked Beats and DJ Aquavantes are two acts; all five acts played | north-creek PR #6 (merged) and #7; Zaal, 7 Oct |

### 2. Exemplar sites and the patterns they share

| Site | What carries it | Transfers to North Creek |
|---|---|---|
| gregoryalanisakov.com | IM Fell English, one artwork, plain text menu | A single old-style serif gives folk warmth with no photos |
| bigthief.net | Unbounded + Space Grotesk, tiny nav, Mailing List as a nav item | A famous band runs a tiny nav-led site |
| waxahatchee.com | Alice serif; hero, 4 video tiles, tour, Substack signup | Short repeatable stack |
| mjlenderman.com | Poppins; same stack (both on the ANTI- label template) | Label-template pattern |
| thebeths.com | Small illustrated icon row between sections | An icon or type motif can stand in for photos |
| alcestmusic.com | Domaine Text + Inter; plain tour list | Serif display plus clean sans body |
| sierrahull.com | One-paragraph bio on home; Tour heading with no dates | Bio on home is good; empty Tour is the anti-pattern |
| arresteddevelopmentmusic.com | Three-button hero: Tour Dates, Subscribe, Listen; JSON-LD lists 4 members, page shows 11 | Three verb buttons; keep data and page in agreement |
| inherited.band | Letter-spaced wordmark; contact panel split Inquiries / Collaborations / Booking | Contact split by purpose, once there is one |
| sylvanesso.com | Hand-animated headings | Personality without photos, but heavy |
| khruangbin.com | One-image "enter" gate | Adds a click; skip |
| paulkalkbrenner.net (Awwwards SOTD 2 Sep 2026) | Persistent now-playing bar, giant wordmark | Mini-player later, once a track exists |
| thetwangbangers.com (Bandzoogle, local scale) | Upcoming table holding a past gig | Closest scale; the stale table is the warning |
| creatureandthewoods.com | Cited by Bandzoogle in 2019; now serves gambling spam | Keep northcreek.art renewed |

Recurring patterns: 4 to 6 text-only nav items; one hero then a short stack (hero, releases or videos, shows, signup, footer); two or three verb buttons in the hero; type carries the personality; music is outbound links, not embedded players; shows as plain date, city, venue, link rows; newsletter as one box near the footer.

Anti-patterns: empty or stale show headings; placeholder copy left live; structured data that disagrees with the page; entrance gates; animation as the whole design; lapsed domains.

### 3. Type, color and layout

**Fonts** (latin woff2 as served by the Google Fonts CSS API on 2026-10-07; all SIL OFL 1.1, OFL.txt read from google/fonts main):

| Font | Role | Bytes | Fit |
|---|---|---|---|
| Anton | condensed display | 12,004 | Closest to the flyer lettering. DEFAULT |
| Bebas Neue | caps display | 8,596 | Smaller, more overused |
| Instrument Serif | condensed display serif | 15,040 | Elegant alternative |
| Young Serif | warm display serif | 18,520 | Folk-leaning alternative or body |
| Big Shoulders Display (variable) | condensed display | 35,520 | Industrial |
| Fraunces (variable) | soft serif | 67,388 | Warmer, heavier |
| Archivo (wght + wdth) | one family, condensed to normal | 90,096 | Heavy because of two axes |
| Newsreader / Source Serif 4 | text serif | 131,848 / 122,168 | Too heavy for this site |

Pairing A, recommended: Anton for h1, h2 and nav; system serif (`ui-serif, Georgia`) for body. 12 KB of font total. Preload only Anton, with `crossorigin`. Use a metric-matched fallback `@font-face` (size-adjust and overrides computed with fontTools, not copied: the Chrome fallback article's own Poppins example fails its formula, 1050/(1000x0.6085) = 172.6%, not 164.34%).

Support, from web-features data.json and caniuse features-json on 2026-10-07: woff2 97.02%; variable fonts 96.54%; font-display 96.47%; oklch 94.27%; color-mix Baseline high since 2025-11-09; light-dark() Chrome 123, Firefox 120, Safari 17.5; container queries 94.79%; :has() 94.82%; subgrid 93.48%; text-wrap balance 87.92%; same-document view transitions 91.75%; cross-document 85.97%; scroll-driven animations not Baseline (no Firefox).

**Palette** (OKLCH from sampled hex; WCAG ratios computed locally, unrounded):

| Token | Value | Contrast |
|---|---|---|
| ink | #0b0a0a | on cream 15.26:1 |
| paper | #f3dfc9 | |
| coral (shapes only on light) | #e56653 | on ink 5.99:1; on cream 2.55:1 FAIL |
| coral-deep (text on light) | #b23a28 | on cream 4.59:1 |
| dark surface | #161212 | |
| coral-soft (text on dark) | #ee7a66 | on #161212 6.74:1 |

**Fluid scale** (17px at 320px to 20px at 1240px, ratio 1.2 to 1.333), computed by the agent from the Utopia formula: `--step-0:clamp(1.0625rem,0.9973rem + 0.3261vw,1.25rem)` up to `--step-5:clamp(2.6438rem,1.7336rem + 4.5514vw,5.2609rem)`. Poster h1 may jump harder (`clamp(4rem,2rem + 14vw,12rem)`) with the minimum kept at 4rem so zoom still enlarges it.

**Poster art direction in plain CSS**: cream paper ground, black ink slab sections, tight uppercase Anton at line-height 0.85, wide-tracked small-caps labels (echoing the flyer's "B L A C K  M O O N"), hard 3px borders with offset shadow instead of soft rounded cards, optional SVG feTurbulence grain tile (307 bytes as a data URI; render cost UNKNOWN, test on a mid Android phone before shipping).

### 4. What visitors want (community and booker sources)

| Claim | Who | Strength |
|---|---|---|
| A site signals seriousness to bookers more than it draws fans | r/Music 2025 (top comments 13 and 8 pts); r/WeAreTheMusicMakers 2018; talent buyer Scott Cooper, IndieOnTheMove 2019 | Repeated |
| One recent live video beats polish; rough is fine if the room looks full | Cooper; Joel Eckels (The Hotel Cafe); John LaRue (Deep Ellum Art Co.) | Repeated across bookers |
| Play history and honest draw matter more than the music | Mohawk, Schubas, Middle East Downstairs, Motorco bookers (Hypebot 2018) | Repeated |
| A working booking email, findable without hunting | Dana Sims (El Corazon), Laurie Koster (Evening Muse) | Repeated |
| Fans mostly do not visit band sites | HN, Portugal. The Man thread (583 pts, 2023); r/Music Jan 2026 | Dissent |
| Small band sites get tiny traffic: 30 to 60 visitors a week | one r/musicmarketing commenter, Dec 2025 | Anecdote |
| Own the domain and list; platforms change | r/Music 2025 (23 pts), r/WeAreTheMusicMakers 2015 and 2018 | Repeated |

Contradictions, not reconciled: whether a band needs a site at all (both views in the same threads); one booker (Glenn Boothe, Motorco) prefers a single social or ReverbNation page over a band site; most "what bookers want" checklists come from EPK software vendors. Proxy data only: 65% of 500 US respondents find events via social posts (Loopyah/Pollfish, Nov 2025, vendor-run); cultural-organisation sites see 69.5% mobile sessions (Substrakt 2025). Band-site-specific traffic splits are UNKNOWN.

What this means for the design: mobile first, contact and video slots designed now and filled when the band supplies them, honest show list, nothing that slows a phone.

### 5. Abilities verdicts

| Ability | Verdict | Cost | Reason |
|---|---|---|---|
| 404.html, sitemap.xml, robots.txt | USE, PR #8 | about 1 KB | Vercel serves `404.html` from the output directory for unmatched routes |
| Accessibility checks (axe-core, Lighthouse) before each merge | USE | 0 bytes shipped | axe-core finds about 57% of WCAG issues automatically, by its own claim |
| Security headers in vercel.json | HOLD for Zaal | 0 bytes | Draft below |
| Poster archive, one WebP flyer per show | USE as shows accrue | 20 to 40 KB each (estimate) | Cheapest delight; uses real art |
| Auto past/upcoming via external `/shows.js` | USE at first upcoming show | about 0.4 KB | External file keeps a strict CSP possible; static labels stay correct with JS off |
| .ics add-to-calendar | LATER | about 0.6 KB per show | Only for a confirmed future show; write DTSTART in UTC (`20261003T230000Z` form) to avoid VTIMEZONE; CRLF line ends |
| Event JSON-LD per show | LATER | about 0.5 KB | Google requires name, startDate, location with address (Google docs, updated 2026-09-08) |
| Lite click-to-load embeds | LATER | YouTube iframe about 0.9 to 1.3 MB vs about 100 KB lite (snippet figures, not measured) | No music links exist |
| Newsletter form | LATER | plain HTML form about 0.5 KB | Needs a band decision on who owns the list |
| EPK / press page | LATER | about 2 KB | Needs bio, members, photos, contact |
| QR code for flyers | LATER | 2 to 4 KB SVG (estimate) | Print-side, generated offline |
| Web Share API | SKIP | | No Firefox desktop support; 90.3% global |
| PWA manifest | SKIP | | Installability adds nothing; apple-touch-icon already covers iOS |
| RSS | SKIP | | One show |
| Speculation rules | SKIP | | 75.32% global, two pages |
| llms.txt | SKIP for now | | No provider page confirms it is read |

Draft security headers (NOT in any PR; held for Zaal per Decision 8):

```json
"headers": [
  { "source": "/(.*)", "headers": [
    { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ] }
]
```

Inline JSON-LD is a data block, not executed script, so `script-src 'self'` does not block it. `site/` has no inline `style=` attributes (grep, 2026-10-07), so `style-src 'self'` holds.

### 7. Exemplar sites, rendered (2026-10-08)

Screenshots of the first 1280x900 viewport, headless Chrome, 2026-10-08 around 05:20 EDT. One viewport per site; nothing below the fold was scrolled.

| Site | What the first screen shows | Note for North Creek |
|---|---|---|
| gregoryalanisakov.com | Cream paper ground, small serif title, a collage of vintage photos whose pieces are the nav (lyrics, tour, music, contact) | Cream paper plus serif reads as folk; the same ground as #9's light mode |
| bigthief.net | Full-bleed band photo, hand-drawn logo top right, hamburger menu only | Needs a band photo; none exists |
| waxahatchee.com | Full-bleed photo, thin wide wordmark over it, two buttons (purchase, stream), cookie banner | Photo-led |
| mjlenderman.com | Full-bleed photo with a subscribe modal over it on first load, plus a cookie banner | Anti-pattern: a modal before the visitor sees anything |
| thebeths.com | Dark ground, hand-made illustrated logo and album title, two buttons, a row of illustrated icons | Illustration carries the page without photos |
| alcestmusic.com | Black screen, tiny "Alcest" loader; nothing else rendered in 8 seconds | FAILED render: a loader gate hides the site from a quick visit |
| sierrahull.com | Script logo, full-bleed portrait, two-row nav | Photo-led |
| paulkalkbrenner.net | White page, giant black grotesque wordmark, tiny nav, "Now playing" and "Sound OFF" at the foot | The one type-only hero in the set; closest to #9's approach |
| sylvanesso.com | Cream ground, orange blob shapes, black outline illustration, "out now" headline | Cream, orange-red and black: the same family as the flyer palette in #9 |
| arresteddevelopmentmusic.com | Live photo grid, consent dialog covering half the screen | Consent dialogs are the norm on label sites; North Creek has no tracking, so needs none |
| inherited.band | Near-black red photo, nav text barely visible | Anti-pattern: very low contrast |
| thetwangbangers.com | Logo on black left, AI-style render right, small nav | Closest scale to North Creek |
| wilcoworld.com | A domain-for-sale parking page | Lapsed or moved domain observed 2026-10-08; whether Wilco moved elsewhere was not checked |
| fleetfoxes.com | Muted sea photo, plain serif nav, "There are no upcoming events." and a "Follow Fleet Foxes" button | A famous band shows the empty state honestly and pairs it with one follow action. That is Decision 9's pattern |

What changed versus the markup-only read in Finding 2: 11 of the 14 first screens are photo-led or illustration-led; the 3 that are not are paulkalkbrenner.net (type only), the alcestmusic.com loader and the wilcoworld.com parking page. Type-only heroes are rare. North Creek has no photos on record, so a type-led page (#9) is the honest choice now, and a band photo is the highest-value asset to ask for. Two of the 14 (fleetfoxes.com, wilcoworld.com) confirm the empty-state and lapsed-domain findings visually.

### 8. Audit of the redesign, north-creek PR #9 (2026-10-08)

Lighthouse 12.8.2 (`npx`), mobile form factor, headless Chrome, against `python3 -m http.server` serving `site/` at PR #9 head aa96d7e.

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | Weight |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 22 KiB |
| `/afterparty` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 102 KiB |

Flags that come from the local test server, not the site: no text compression, short cache TTL, and a trailing-slash redirect on `/afterparty` (Python's server adds it; Vercel with `cleanUrls` does not). Lighthouse could not score the 404 page locally because the Python server does not serve `404.html`; the live 404 was checked by curl on 2026-10-07 (Finding 5).

Not covered by Lighthouse. Zoom figures are computed from the `clamp()` values in `site/style.css`, not measured in a zoomed browser:
- Zoom: body text at 200% browser zoom on a 1280px window renders at about 1.9x its unzoomed size, because the fluid step shrinks as the CSS viewport narrows; at 300% it passes 2x. The h1 grows about 1.5x at 200%, which Roselli's guidance accepts for decorative display type with a rem minimum.
- Target size: nav links are about 29px tall, above the 24px WCAG 2.5.8 minimum.
- Font fallback: the metric override targets Impact, which macOS and Windows ship; Android does not, so Android falls back to sans-serif without the override. Lighthouse emulated mobile on macOS, so CLS 0 does not prove Android. UNKNOWN until checked on an Android device.

### 6. Build order

1. PR #8: 404, sitemap, robots (open).
2. Design system PR: self-hosted Anton + OFL.txt, flyer palette tokens with light and dark, fluid scale, poster cards, text-wrap, view transitions, reduced-motion. theme-color meta updated.
3. Share card and icons redrawn in the new palette.
4. Show-list markup with `<time>` elements and status labels, ready for a second show.
5. Waiting on the band: contact line, live video slot, music links, bio, photos, newsletter.

## Also See

- [Doc 2635 - North Creek site and members](../2635-north-creek-site-and-members/)
- [Doc 2629 - North Creek band record](../2629-north-creek-band-record/)
- `zao-research-index "band website"` on 2026-10-07 returned no prior design doc

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Review and merge north-creek PR #8 (404, sitemap, robots) | reviewer, then merge terminal | PR | Next review pass |
| Design system PR (Decisions 1 to 6) | north-creek lane | PR | After #8 |
| Rule whether `vercel.json` headers count as "stuff with vercel" | Zaal | Decision | Open |
| Confirm the flyer-derived palette, or name band colors | Zaal or the band | Decision | Before the design PR merges |
| Ask the band for contact, one live video, music links, bio, photos | Zaal via eties | Ask | Open since doc 2635 |
| After each merge, view a bad URL to confirm the 404 page is served | anyone, viewing only | Check | DONE 2026-10-07 21:26 EDT: 404 with the custom page |
| Ask the band for one photo before any other asset (Finding 7) | Zaal via eties | Ask | Open |
| Check #9 on an Android phone for font-swap layout shift (Finding 8) | anyone with Android | Check | Before #9 merges |

## Sources

Exemplar sites (all band sites fetched as markup via WebFetch and curl, no rendering):
1. [awwwards.com/websites/music](https://www.awwwards.com/websites/music/) [PARTIAL - page 1 of 5, names and badges only]
2. [siteinspire music category](https://www.siteinspire.com/websites/categories/music) [PARTIAL - names and URLs only]
3. [Colorlib, musician websites, 25 Sep 2026](https://colorlib.com/wp/musician-websites/) [FULL]
4. [Hypebot, 10 great band and musician websites, 20 Dec 2024](https://www.hypebot.com/10-great-band-and-musician-websites/) [FULL]
5. [htmlburger, band website examples, 27 Feb 2024](https://htmlburger.com/blog/band-websites-examples/) [FULL]
6. [Bandzoogle, best rock band websites, updated Sep 2019](https://bandzoogle.com/blog/website-design-inspiration-best-rock-band-websites) [FULL - old]
7. [gregoryalanisakov.com](https://gregoryalanisakov.com) [PARTIAL - markup only]
8. [bigthief.net](https://bigthief.net) [PARTIAL - markup only]
9. [waxahatchee.com](https://waxahatchee.com) [PARTIAL - markup only]
10. [alcestmusic.com](https://alcestmusic.com) [PARTIAL - markup only]
11. [sierrahull.com](https://sierrahull.com) [PARTIAL - markup only]
12. [paulkalkbrenner.net](https://paulkalkbrenner.net) [PARTIAL - markup only]
13. [thetwangbangers.com](https://thetwangbangers.com) [PARTIAL - markup only]
14. wilcoworld.com, fleetfoxes.com, tylerchilders.com, wetleg.com, charleycrockett.com [FAILED - empty shells or no response via WebFetch and curl; Playwright timed out]

Type, color, layout:
15. [OFL 1.1 official text](https://openfontlicense.org/open-font-license-official-text/) [FULL]
16. google/fonts OFL.txt for Anton, Bebas Neue, Instrument Serif, Young Serif and 7 more [PARTIAL - header lines and RFN grep only]
17. Google Fonts CSS API and fonts.gstatic.com woff2 downloads [FULL - byte counts measured]
18. [Utopia, clamp](https://utopia.fyi/blog/clamp/) [FULL]
19. [Adrian Roselli, responsive type and zoom, Oct 2025 update](https://adrianroselli.com/2019/12/responsive-type-and-zoom.html) [FULL]
20. [The Register, Munich Google Fonts ruling, 31 Jan 2022](https://www.theregister.com/2022/01/31/website_fine_google_fonts_gdpr/) [FULL - court text not read]
21. [fonts.google.com/faq](https://fonts.google.com/faq) [FAILED - title only; privacy FAQ redirects there]
22. [web.dev optimize CLS](https://web.dev/articles/optimize-cls) [FULL]
23. [Chrome, font fallbacks](https://developer.chrome.com/blog/font-fallbacks) [FULL - contains an arithmetic error, noted]
24. [Chrome, HTTP cache partitioning](https://developer.chrome.com/blog/http-cache-partitioning) [PARTIAL - truncated at 3,500 chars]
25. [WCAG 2.2 Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) [FULL]
26. [WCAG 3.0 WD 10 Sep 2026](https://www.w3.org/TR/wcag-3.0/) [PARTIAL - first 100,000 of 373,369 chars]
27. [Chrome, text-wrap pretty](https://developer.chrome.com/blog/css-text-wrap-pretty) [FULL]
28. [MDN @view-transition](https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition) [PARTIAL - no version table]
29. [Chrome, cross-document view transitions](https://developer.chrome.com/docs/css-ui/view-transitions/cross-document) [FAILED - HTTP 404]
30. [CSS-Tricks, grainy gradients](https://css-tricks.com/grainy-gradients/) [FULL - technique, little perf data]
31. [web-features data.json](https://unpkg.com/web-features@latest/data.json) [FULL - parsed locally; package version UNKNOWN]
32. [caniuse features-json](https://github.com/Fyrd/caniuse/tree/main/features-json) [FULL for 15 files; snapshot date UNKNOWN]

Abilities:
33. [Vercel project configuration, updated 2026-08-25](https://vercel.com/docs/project-configuration) [FULL]
34. [Vercel, custom 404 page](https://vercel.com/guides/custom-404-page) [PARTIAL - one sentence returned]
35. [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) [PARTIAL - 200k of 378k chars; PRODID and VERSION sections not read]
36. [caniuse Web Share](https://caniuse.com/web-share) [FULL]
37. [caniuse speculation rules](https://caniuse.com/mdn-html_elements_script_type_speculationrules) [FULL]
38. [MDN, making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) [FULL]
39. [MDN CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) [FULL]
40. [Google, build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) [FULL]
41. [Google, Event structured data, updated 2026-09-08](https://developers.google.com/search/docs/appearance/structured-data/event) [FULL]
42. [llmstxt.org](https://llmstxt.org/) [FULL]
43. [axe-core](https://github.com/dequelabs/axe-core) [PARTIAL - no version info]
44. [lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed) [PARTIAL - no byte figure on page]
45. Buttondown docs, Bandcamp help, Spotify embed docs [FAILED - 404, redirect loops or not fetched]

Community and bookers:
46. [r/Music, do musicians still need their own website, 2 Sep 2025](https://www.reddit.com/r/Music/comments/1n6op4h/do_musicians_still_need_their_own_website_or_is/) [FULL - via exa; direct Reddit returned 403]
47. [HN, Portugal. The Man site is a Google Sheet, 583 pts, 2023](https://news.ycombinator.com/item?id=38136607) [FULL - top two comment levels]
48. [r/coverbands, band website, 29 Dec 2025](https://www.reddit.com/r/coverbands/comments/1pyp6u4/what_do_you_use_for_your_bands_website/) [FULL]
49. [r/musicmarketing, benefits of an artist website, 29 Dec 2025](https://www.reddit.com/r/musicmarketing/comments/1pymyt3/benefits_of_having_an_artist_website/) [PARTIAL - 19 of 27 comments]
50. [r/WeAreTheMusicMakers, standalone band website in 2018](https://www.reddit.com/r/WeAreTheMusicMakers/comments/8raf4q/how_much_sense_does_it_make_to_have_a_standalone/) [PARTIAL - 17 of 27 comments]
51. [IndieOnTheMove, Scott Cooper, 28 May 2019](https://www.indieonthemove.com/blog/2019/5/what-to-include-in-an-email-to-a-talent-buyer) [FULL]
52. [Hypebot, tips from talent buyers, 13 Jul 2018](https://www.hypebot.com/independent-venue-week-comes-to-the-us-booking-performing-tips/) [PARTIAL - excerpts via search]
53. [Sonicbids, impress a talent buyer, 9 Feb 2016](https://blog.sonicbids.com/9-ways-to-convince-a-venue-to-book-you-if-you-cant-pack-the-house) [PARTIAL - excerpts via search]
54. [Loopyah event attendee report 2025/2026](https://loopyah.com/reports/event-attendee-us-2025-2026) [FULL - vendor-run, n=500]
55. [HN, Ask HN Linktree, 2023](https://news.ycombinator.com/item?id=37947577) [FULL - 3 comments]

PARTIAL and FAILED sources were escalated through WebFetch, exa web_fetch and Playwright (which timed out). The largest gap: no rendered view of any exemplar site, so layout claims rest on section order in markup.
