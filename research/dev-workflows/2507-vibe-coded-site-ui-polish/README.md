---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-19
superseded-by:
related-docs: "2504"
original-query: "we shoudl updagrade this page to have more UI improvements, lets /zao-research for some time best practices when vibe coding website and improves we can make on small UI things that make the website smoother (Zaal, 2026-09-19, pasted https://zaostock.com/artist/acadia-rising and https://zaostock.com/artist)"
tier: STANDARD
---

# 2507 - ZAOstock artist pages: measured audit + vibe-coded-site polish checklist

> **Goal:** Audit the two live ZAOstock pages Zaal pasted (an artist profile, and the lineup index) as a first-time phone visitor would see them, research what actually goes wrong on AI-generated ("vibe coded") sites and how to fix it cheaply, and produce a ranked, effort-scored punch list for the 14 days before the 3 October 2026 festival.

**All figures in this doc are as of 2026-09-19.** ZAOstock is a free one-day festival, Saturday 3 October 2026, Franklin Street Parklet, Ellsworth, Maine, 14 days out at time of writing. The site is `ZAODEVZ/ZAOstock`, read read-only from `origin/main` at local clone `~/Documents/zaostock`; nothing in that repo was checked out, edited, or committed for this doc.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Ship the top-5 fixes before 3 Oct | USE | All five are single-file, CSS/copy/metadata-only changes with no new dependency; each is measured broken or embarrassing today, not a taste call. |
| Redesign the artist page or lineup index | SKIP before 3 Oct | Lighthouse measures performance 96, accessibility 100, best-practices 100, SEO 100 on both pages (2026-09-19, headless). The page is not underperforming or inaccessible; it has specific, fixable rough edges, not a structural problem. |
| Add an animation library or new UI dependency | SKIP before 3 Oct | `prefers-reduced-motion: reduce` is already implemented in `src/app/globals.css` (two media-query blocks, read 2026-09-19); CLS measures 0 on both pages. Nothing here needs new motion tooling, and a new dependency 14 days out is exactly the kind of risk doc `dev-workflows/2504-vibecoding-stack-thread` flagged against zaostock's shipping window. |
| Fix the empty-photo state with a CSS-only redesign, not real photos | USE | Real photos depend on artists sending them; the claim-link/contributor-path flow already asks for this (`ArtistProfileView.tsx`, "Add my logo (next step)"). A same-day, zero-dependency fix is changing how the placeholder *looks*, which is in scope regardless of whether photos arrive. |
| Move the RSVP link out of the mobile hamburger | USE, scoped narrowly | The header's `RSVP` pill sits inside `hidden sm:flex` in `src/components/poster/Header.tsx`, which is the same wrapper that hides the six nav links on mobile - so on a phone, the site's one conversion action is one extra tap deep on every page, including both audited pages. The fix is moving one `<Link>` outside that wrapper, not restructuring the header. |

## Findings

### Part 1: What a first-time phone visitor measures today

Both pages were fetched with `curl` using a desktop UA (Safari/macOS) and a mobile UA (Safari/iOS); the two responses are **byte-identical** (`diff` = 0 lines) on both pages, confirming server-rendered markup with no UA branching, styling handled entirely by CSS. Screenshots were taken with a local headless Chromium (`playwright-core` from the ZAOOS repo's own `node_modules`, since the Playwright MCP browser-extension bridge was not connected) at 390x844 and 1440x900, full-page, for both pages. Lighthouse (`npx lighthouse`, headless Chrome, performance+accessibility+best-practices+seo) ran successfully against both live URLs.

**Zaal's second pasted URL, `https://zaostock.com/artist`, returns HTTP 404** ("Not found | ZAOstock") - measured via `curl -I`, confirmed against source (`git show origin/main:src/app/artists/page.tsx` exists at the plural `/artists`; nothing in the header, footer, or artist page links to the singular `/artist`). The lineup index that is actually live is `/artists` (HTTP 200), and that is what this audit covers as "the lineup index." This is not a site defect - nothing internally links to `/artist` - but it means the exact URL pasted into this research request is dead.

#### Above the fold, phone (390x844), `/artist/acadia-rising`

Header (66px, sticky), then straight into a bordered card: a circular avatar (initials "AR" in a thin outline, no fill), "ACT 4 OF 8," the artist name at 2xl bold, then Bio, Genre/City, Links, and the italic "To edit this profile you need the claim link from your artist signup confirmation" line - **shown to every visitor, not just the artist**, confirmed in source (`ArtistProfileView.tsx`, the `{!canEdit && (...)}` block at the foot of the component) and in the screenshot. This is the exact "reads as internal" example Zaal flagged, and it is present today on all 8 artist pages regardless of who is viewing.

#### The empty-photo state, measured (not recalled)

Fetched all 8 artist pages (`curl` + grep for the photo `<img>` class vs the initials-tile markup). **4 of 8 acts have no photo today: `the-crown-vics`, `open-x`, `grass-rug`, `acadia-rising`.** The other 4 (`michael-anderson`, `dcoop`, `lyonsden`, `tom-fellenz`) have one. This matches the number Zaal cited from memory exactly. The placeholder (`ArtistProfileView.tsx`): a `w-24 h-24` circle, `bg-paper-200` (cream) on `border-ink-950/60`, holding two-letter initials in `text-ink-muted`. Screenshot (mobile and desktop) confirms it reads as an unloaded avatar - a near-invisible outline on a near-identical cream background - not a deliberate design choice.

#### Links, measured

`ArtistProfileView.tsx` renders the artist's socials field as `<p className="text-xs text-ink-muted break-words">{socials}</p>` - **plain text, not an `<a>` tag, not a button, not even a raw clickable link.** Confirmed in the fetched HTML and in both screenshots: Acadia Rising's page shows the literal string `https://facebook.com/AcadiaRising https://instagram.com/acadia.rising` in the site's small muted-grey type, un-underlined, not tappable. This is the field is free text (placeholder: `"x.com/..., farcaster.xyz/..., spotify, soundcloud, website"`), so today it is also un-parsed - one flat string per artist, not individual URLs. Measured 2026-09-19: of 8 artists, only 3 (`acadia-rising`, `dcoop`, `tom-fellenz`) have anything in this field at all yet, so the defect is currently visible on 3 pages and will affect more as artists fill it in before the 3rd.

By contrast, the **site-wide footer** (`Footer.tsx`) does the same kind of thing correctly: labelled `<a>` tags with `aria-label`, one per platform (X, Instagram, YouTube, Facebook, Facebook Event, Discord, Telegram) - proving the pattern already exists in the codebase, just not on the artist bio.

#### Heading structure, tap targets, focus

- Artist page: one `h1` (artist name) inside a card; the "About ZAOstock" card next to it uses no heading tag increment issue - both cards are siblings, not nested, so structure is flat and correct.
- Buttons (`primitives.tsx` `Button`): `sm` size is `px-[18px] py-[9px]` on 14px text, computing to roughly 38px tall - **above WCAG 2.2's 24x24px minimum (SC 2.5.8) but below the 44px "comfortable" target** cited in Vercel's Web Interface Guidelines for mobile. Not a failure, a size that could be more generous.
- Focus states exist and are systematic: `focus-visible:[box-shadow:var(--shadow-focus)]` on every `Button`, `Card` (interactive), and form control in `primitives.tsx`; `--shadow-focus: 0 0 0 3px rgba(223, 162, 60, 0.5)` under the `.site` scope (`globals.css`). This is a real, working focus-ring system, not absent.
- Colour contrast (WCAG relative-luminance formula, computed against the exact hex values in `src/content/design-kit.ts` and the `.site`-scoped tokens in `globals.css`): body text (`ink-950` on `paper-100`) is 12.72:1; muted text (`ink-muted` on `paper-100`/`paper-200`) is 5.54:1/6.21:1; the secondary button's `red-700` text on cream is 5.90:1 - all comfortably pass AA. **One combination does not**: the primary button's gradient runs from `fireside` (#C1662C) to `ember` (#8F3E1E), with `onfill` (#FFF8EC) text; at the fireside (top) end the ratio is **3.82:1**, under the 4.5:1 AA threshold for the button's 14px bold label (which is smaller than the ~18.7px bold "large text" exemption). The ember (bottom) end alone is 6.92:1 - fine. The failure is specific to where the label sits on the gradient.
- A Lighthouse/axe audit flagged one accessibility issue on both pages: `label-content-name-mismatch` (WCAG 2.1 SC 2.5.3) on the footer's "FACEBOOK EVENT" link - its `aria-label="ZAOstock event on Facebook"` does not contain the visible text "FACEBOOK EVENT" verbatim, which is a real, site-wide (not page-specific) accessible-name mismatch.

#### Meta title, description, OG image, JSON-LD - measured across all 8 artist pages

- **Title**: correct and artist-specific (`{artist.name} | ZAOstock Artist`), using `title: { absolute: ... }` specifically to dodge the root layout's `%s | ZAOstock` template - a comment in `page.tsx` notes this was fixed 2026-09-17 after a live double-suffix bug (`"Tom Fellenz | ZAOstock Artist | ZAOstock"`). Good, and already fixed.
- **Description**: `artist.bio.slice(0, 160)` - a hard character cut with no word-boundary trim. Measured on all 8 live pages: it cuts mid-word on at least 6 of 8 ("...expressive **flu**" for Acadia Rising, "...**Amer**" for The Crown Vics, "...**stad**" for OPEN X, "...**Mit**" for Grass Rug, "...hip hop with **R**" for DCoop, "...reggae grit, **bl**" for LyonsDen).
- **og:image / twitter:image**: set correctly when a photo exists (`artist.photo_url`), e.g. DCoop's page carries `og:image` and `twitter:image` pointing at `/artists/dcoop.webp`. **For the 4 photo-less artists, `openGraph.images` resolves to an empty array and no `og:image` (or `twitter:image`) meta tag is rendered at all** - confirmed by grepping the raw HTML of `acadia-rising`'s page for `og:image`, zero matches. A share of Acadia Rising's page on Facebook, iMessage, or SMS - the exact channels the brief names - will show no preview image.
- **Twitter card, all 8 pages**: `twitter:card` is `summary_large_image` (inherited from the root layout), but the artist page's `generateMetadata` never sets a `twitter` object of its own, so `twitter:title`/`twitter:description` fall through to the root layout's static, festival-generic strings ("ZAOstock 2026" / the one-line festival blurb) on **every** artist page, confirmed on both a photo-having artist (DCoop) and a photo-less one (Acadia Rising). `twitter:image` only appears when `openGraph.images` is non-empty (Next.js derives it from there), so the photo-less 4 get a large-image card type with no image at all.
- **JSON-LD**: one `MusicEvent` schema, identical on every page (root layout), describing the whole festival plus its evening sub-event at Black Moon Public House. No per-artist structured data (no `MusicGroup`/`PerformingGroup`, no `performer` entry inside the event). Not broken, just generic - same JSON-LD on the lineup index, the homepage, and all 8 artist pages.

#### The path back to the lineup, to the next artist, and to RSVP

- **Lineup -> artist**: works, one tap, but the link text ("View artist profile ->") is styled `text-fire-600 hover:text-fire-700` - **and neither class exists anywhere in the compiled CSS** (`grep -c fire-600` against the live `/_next/static/.../2i5zuzquniav0.css` returns 0; the theme only defines `--color-fireside`, not a `fire-600`/`fire-700` scale). The link therefore renders in whatever color it inherits, with no hover state at all - confirmed visually in the mobile screenshot, where the "VIEW ARTIST PROFILE" links look like plain body text, not the brand-accented tappable link the class names intended.
- **Artist -> lineup / next artist**: no explicit link. The artist page's two buttons go to `/` ("Festival info") and `/program`; the only way back to the lineup is the header's "Artists" nav item, which is not contextual to where the visitor is. Compared against real festival sites (measured 2026-09-19): Unison Festival's artist page (`unisonfest.com/artist/tufa/`) closes with an explicit **"Back to the full lineup!"** link plus swipe-based next/previous; NXNE's artist page lists Spotify/Apple Music/YouTube as individually labelled link chips, not raw text.
- **Artist -> RSVP**: the header's `RSVP` pill is present and sticky (`top-0`) on desktop, but on mobile it lives inside the same `hidden sm:flex` wrapper as the six nav links (`Header.tsx`), which only render once the hamburger is tapped open. On a phone - the device the brief says most visitors use - the site's single conversion action is one extra tap behind a menu, on every page, not just these two.

#### Loading and image handling

- `export const dynamic = 'force-dynamic'` on the artist page (a live Supabase query per request via `getRosterArtists`, react-`cache()`'d so the page and its metadata share one fetch); there is no `loading.tsx` under `src/app/artist/[slug]/` or `src/app/artists/`, so a slow database round-trip shows a blank tab, not a skeleton. Measured CLS is 0 on both pages today (Lighthouse), so this is a perceived-speed gap, not a layout-shift bug.
- The artist photo and logo in `ArtistProfileView.tsx` are plain `<img>` tags (`eslint-disable-next-line @next/next/no-img-element`, with an `onError` fallback to the initials tile) - **not `next/image`**, unlike the Header/Footer logo, which correctly uses `next/image` with `priority`. Per Next.js's own docs (fetched via context7, `/vercel/next.js`): `next/image` provides "size optimization... automatically serving correctly sized images... using modern image formats like WebP," "visual stability," and native lazy loading - none of which the artist photo gets today. Since the containers are fixed-size (`w-24 h-24`), this is not currently a CLS problem; it is an unoptimized-download problem for whatever an artist uploads.

#### Lighthouse scores, both pages, measured 2026-09-19

`npx lighthouse <url> --only-categories=performance,accessibility,best-practices,seo --output=json --chrome-flags="--headless"`, run to completion for both URLs.

| Page | Performance | Accessibility | Best Practices | SEO | Top failing audits |
|---|---|---|---|---|---|
| `/artist/acadia-rising` | 96 | 100 | 100 | 100 | `label-content-name-mismatch` (footer, score 0); `unused-javascript` (29 KiB est. savings); `render-blocking-insight` (260ms est. savings); Speed Index 4.0s (score 0.80); LCP 2.3s (score 0.93) |
| `/artists` | 96 | 100 | 100 | 100 | `label-content-name-mismatch` (footer, score 0); `network-dependency-tree-insight`; `render-blocking-insight` (130ms est. savings); `unused-javascript` (28 KiB, score 0.5); LCP 2.7s (score 0.84) |

CLS is 0 and TBT is 50ms on the artist page - both excellent. The category scores say this is not a performance or accessibility emergency; the failing audits are small, mechanical, and the same `label-content-name-mismatch` issue recurs because it is a site-wide footer component, not a per-page defect.

### Part 2: What the research says about vibe-coded UI, and what applies here

1. **The generic-AI-design "tells" catalog does not describe ZAOstock's actual problem.** The most substantial source found - a Hacker News-linked blog post that scored 1,590 Show HN landing pages for 16 deterministic AI-design patterns (Inter-everywhere hero fonts, colored left borders, badge-above-H1, icon-topped feature-card grids, gradient/glassmorphism, shadcn/ui defaults) - found 22% of sites triggering 4+ patterns [FULL, method: curl + HTML strip, `adriankrebs.ch/blog/design-slop/`; HN discussion 333 points/72 comments, `hn.algolia.com` item 47864393]. **ZAOstock triggers essentially none of these**: its type system (Oswald/Rubik/Space Mono), palette (fireside/pine/sun, all named and documented in `design-kit.ts`), and layout are Candy's bespoke design system, not LLM defaults. The site's actual problems - measured in Part 1 - are mechanical and content-layer (broken share metadata, an unstyled link, a plain-text field, a truncated description), not "looks like every other AI site." This matters for scoping: no amount of re-theming fixes any of the top-5 items below.

2. **The community's own advice converges on the same three things this audit already found by hand.** Two Reddit threads fetched in full via Arctic Shift (`~/bin/zao-fetch-reddit.sh`, per the skill's current working route as of 2026-09-19): `r/VibeCodersNest` "5 things that actually made my vibe coded projects not look like vibe coded projects" (26 points; top comment expands the list into a full audit rubric: empty states, error states, loading states, form validation, information hierarchy, accessibility, microcopy, performance perception) [FULL, method: Arctic Shift]; and `r/vibecoding` "AI-generated websites always look generic. How do you fix this?" (1 point, thin but on-topic; consensus: lock a small, explicit design system up front rather than re-prompting) [FULL, method: Arctic Shift]. The top comment on the first thread is close to a checklist by itself and is the basis for Part 3's reusable checklist below.

3. **Vercel's Web Interface Guidelines name several of this audit's findings by their generic pattern, independent of ZAOstock** [FULL, method: curl, `raw.githubusercontent.com/vercel-labs/web-interface-guidelines`]: "Links are links. Use `<a>` or `<Link>`... Never substitute with `<button>` or `<div>`" (the socials field); "All states designed. Empty, sparse, dense, & error states" (the photo tile); "No dead ends. Every screen offers a next step or recovery path" (no next-artist/back-to-lineup link); "Stable skeletons. Skeletons mirror final content exactly to avoid layout shift" (no `loading.tsx`); "Redundant status cues. Don't rely on color alone; include text labels" (already followed by the site's badges); "Match visual & hit targets... on mobile, the minimum size is 44px."

4. **Core Web Vitals thresholds, fetched from the source** [FULL, method: curl, `web.dev/articles/cls`, `/lcp`, `/inp`]: good CLS is <=0.1 (measured 0 here); good LCP is under ~2.5s at the 75th percentile (measured 2.3-2.7s here, in the "needs improvement" band, not failing); INP measures responsiveness of interactions after load, not fetched as a Lighthouse audit here since it requires field data, not a lab run.

5. **WCAG 2.2's two new/relevant success criteria, fetched from the W3C source** [FULL, method: curl, `w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`, `/focus-appearance.html`]: SC 2.5.8 Target Size (Minimum, Level AA) requires 24x24 CSS px targets (ZAOstock's buttons pass at ~38px computed height); SC 2.4.13 Focus Appearance (Level AAA, so not a compliance requirement but a quality bar) asks for a focus ring at least as large as a 2px perimeter with 3:1 contrast against the unfocused state - ZAOstock's `--shadow-focus` ring meets this in spirit (a 3px gold ring at 0.5 alpha) but was not independently contrast-measured against every focusable background in this pass.

6. **Refactoring UI's "Finishing Touches" chapter lists "Don't overlook empty states" as its own numbered tactic**, alongside "Use fewer borders" and "Add color with accent borders" [PARTIAL - the book itself is paywalled; the publisher's landing page gives the chapter's table of contents and one full tactic verbatim, method: curl, `refactoringui.com`; a third-party chapter-by-chapter summary was cross-checked for the specific tactics cited here, method: curl, `sglavoie.com/posts/book-summary-refactoring-ui/`]. The book's own framing - "design with tactics, not talent" - is the same posture this doc takes: every fix below is a specific, mechanical change, not a taste call.

7. **Real festival artist pages, measured directly** [FULL, method: curl, `unisonfest.com/artist/tufa/` and `nxne.com/2026-artists/blondish`]: both close with an explicit way back to the full roster or a labelled row of platform links (Spotify, Apple Music, YouTube, Instagram as individual `<a>` chips, never a pasted URL string) - direct, load-bearing evidence for two of this doc's top findings (raw-text socials, no back-to-lineup link).

## Part 3: Ranked punch list (12-20 items)

Legend: **Fix** = broken or embarrassing today. **Polish** = works, could be smoother. **Later** = after the festival. Effort: **S** (under an hour, one file), **M** (a few hours, may touch 2-3 files or need new logic), **L** (a design pass or cross-page change). "Safe before 3 Oct" answers whether this is low-risk to ship in the current sprint.

### Top 5 for the next 14 days

| # | What visitors see now (measured) | Change | Why (source) | File | Effort | Safe before 3 Oct |
|---|---|---|---|---|---|---|
| 1 | 3 of 8 artists' socials render as one un-tappable plain-text string (`ArtistProfileView.tsx`, confirmed in HTML + screenshot) | Split on comma/whitespace, detect the platform from the hostname, render each as a labelled `Button variant="ghost"` or pill with `target="_blank"` | Vercel guidelines: "Links are links... never substitute"; measured against Unison Festival/NXNE's labelled platform-link pattern | `src/app/artist/[slug]/ArtistProfileView.tsx` | M | Yes - additive, no schema change |
| 2 | 4 of 8 artists (the photo-less ones) share with **no image at all** on Facebook/iMessage/SMS - the exact channels the brief names | Set `openGraph.images` (and a matching `twitter.images`) to a branded fallback OG card (e.g. the moose mark on night, or a generated card with the artist's name) when `photo_url` is empty, instead of `[]` | Measured: `og:image` tag is entirely absent today for Acadia Rising et al.; web.dev/Core Web Vitals aside, this is a discovery-channel defect for exactly the acts most likely to be shared before photos land | `src/app/artist/[slug]/page.tsx` (`generateMetadata`) | S | Yes |
| 3 | The empty-photo tile is a near-invisible cream-on-cream outline circle that reads as an unloaded broken image, not a design choice | Fill the circle with a solid brand tone (e.g. `bg-denim-400`/pine, the same tone used for the kicker label) and `onfill` initials, so all 4 placeholder avatars look like a deliberate monogram badge, not a loading failure | Refactoring UI: "Don't overlook empty states"; Vercel guidelines: "All states designed" | `src/app/artist/[slug]/ArtistProfileView.tsx` | S | Yes - CSS/class only |
| 4 | On mobile, the RSVP button is inside the collapsed hamburger menu on every page, one extra tap from the conversion action | Move the `RSVP` `<Link>` outside the `hidden sm:flex` wrapper so it is always visible next to the hamburger, sized to fit the 66px bar | Measured: brief states most visitors are on phones; the header's own code comment already documents the 66px height is load-bearing for the homepage CSS var (`--header-h`), so keep that height | `src/components/poster/Header.tsx` | M (touches every page - test at 375px and 320px widths) | Yes if scoped to just the one link move; needs a real-device check since it is global |
| 5 | Meta description cuts off mid-word for at least 6 of 8 artists ("...expressive flu", "...Amer", "...stad") | Trim `bio` to the last whole word before 160 chars (e.g. `bio.slice(0,160).replace(/\s+\S*$/, '')`) instead of a hard character cut | Measured across all 8 live pages; costs nothing, one line | `src/app/artist/[slug]/page.tsx` (`generateMetadata`) | S | Yes |

### Remaining Fix items (broken or embarrassing)

| # | What visitors see now | Change | Why | File | Effort | Safe before 3 Oct |
|---|---|---|---|---|---|---|
| 6 | The "VIEW ARTIST PROFILE ->" link on all 8 lineup cards uses `text-fire-600 hover:text-fire-700`, which does not exist in the compiled CSS (grep count 0) - the link has no brand color or hover state | Replace with a real token, e.g. `text-red-600 hover:text-red-700` (the tokens that do exist in `globals.css`) | Measured against the live stylesheet, not assumed from source | `src/app/artists/page.tsx` | S | Yes |
| 7 | Twitter cards for all 8 artist pages show the generic "ZAOstock 2026" title/description, not the artist's name, because `generateMetadata` never sets its own `twitter` object | Add an explicit `twitter: { title, description, images }` block mirroring the `openGraph` one in the same function | Measured on both a photo-having (DCoop) and photo-less (Acadia Rising) page | `src/app/artist/[slug]/page.tsx` | S | Yes |
| 8 | Footer's "FACEBOOK EVENT" link has an `aria-label` that does not contain its own visible text, flagged by Lighthouse/axe on both pages (`label-content-name-mismatch`, WCAG 2.5.3) | Change the `aria-label` to include the visible label verbatim, or drop the custom `aria-label` since "Facebook Event" is already unambiguous | Lighthouse audit, measured 2026-09-19, both pages | `src/components/poster/Footer.tsx` or `src/content/site.ts` (`SOCIALS`) | S | Yes |
| 9 | "To edit this profile you need the claim link from your artist signup confirmation" is shown to every public visitor on every artist page, not just the artist | Either remove this line for `!canEdit` visitors (it serves no purpose for the public) or reword to something that doesn't imply the page is unfinished, e.g. drop it entirely | This is the exact example Zaal already flagged as reading internal/unfinished | `src/app/artist/[slug]/ArtistProfileView.tsx` | XS | Yes |
| 10 | `https://zaostock.com/artist` (singular, no slug) 404s | Add a redirect from `/artist` to `/artists` in `next.config` (low priority - nothing internal links here, but the URL is now on record in this research request) | Measured via `curl -I`; not a site bug, just a dead URL worth not leaving dead | `next.config.ts` (redirects) | XS | Yes, and optional |

### Polish items (works, could be smoother)

| # | What visitors see now | Change | Why | File | Effort | Safe before 3 Oct |
|---|---|---|---|---|---|---|
| 11 | No way to get to the next artist or explicitly "back to the lineup" from an artist page - only the header's generic "Artists" nav item | Add a small "<- Back to the lineup" link plus "Next act ->" (wrapping at act 8) below the artist card | Measured against real festival sites (Unison Festival: "Back to the full lineup!"); Vercel guidelines: "No dead ends" | `src/app/artist/[slug]/page.tsx` | M | Yes - additive |
| 12 | The primary button's gradient dips to 3.82:1 contrast for its label text at the fireside (top) end, under the 4.5:1 AA threshold for 14px bold text | Darken the gradient's top stop slightly, or bump the label to the size/weight that qualifies for the "large text" exemption (18.7px bold) | Computed via the WCAG relative-luminance formula against `design-kit.ts` hex values | `src/app/globals.css` (`.site` `--color-fireside` or the button gradient) | S | Yes - needs a contrast recheck after the change |
| 13 | Artist photo/logo use raw `<img>`, not `next/image`; unlike the header/footer logo | Swap to `next/image` with explicit `width`/`height` (the containers are already fixed-size) and keep the existing `onError` fallback logic | Next.js docs (context7): automatic WebP/AVIF, responsive sizing, native lazy loading | `src/app/artist/[slug]/ArtistProfileView.tsx` | M (client component; `onError` handling for `next/image` differs slightly from a plain `<img>`) | Yes, but test the broken-image fallback path specifically |
| 14 | On a 1440px desktop, the artist card is capped at `max-w-[760px]`, leaving roughly half the screen as flat cream with no content | Add a lightweight right-hand element at desktop widths only (e.g. a compact "Act order" rail listing all 8 with the current one highlighted) | Measured in the 1440x900 screenshot; a specific, scoped addition, not a layout redesign | `src/app/artist/[slug]/page.tsx` | M | Yes if scoped to desktop-only, additive markup |
| 15 | Some genre badges on `/artists` wrap to 2 lines (e.g. DCoop's "HIP-HOP, REGGAE, ROCK, PUNK, TRIBAL, COUNTRY, EDM AND R&B"), pushing that card's layout out of rhythm with its neighbors | Truncate the genre badge with an ellipsis at a fixed max-width, or move the full genre string into the card body instead of the badge | Measured in the mobile screenshot | `src/app/artists/page.tsx` | S | Yes |
| 16 | No `loading.tsx` under `src/app/artist/[slug]/` or `src/app/artists/`; a slow Supabase round-trip shows a blank tab | Add a `loading.tsx` skeleton matching the card's final shape (Vercel guidelines: "Stable skeletons... mirror final content exactly") | Measured: `dynamic = 'force-dynamic'` with no loading state today; CLS is 0 so this is a perceived-speed change, not a shift fix | `src/app/artist/[slug]/loading.tsx`, `src/app/artists/loading.tsx` | S | Yes - additive, cannot make anything worse |

### Later items (after the festival)

| # | What visitors see now | Change | Why | File | Effort |
|---|---|---|---|---|---|
| 17 | JSON-LD is one site-wide `MusicEvent`, identical on every page; no per-artist structured data | Add a `performer` array to the event schema, or a `MusicGroup`/`PerformingGroup` entity per artist | Richer Google rich-result eligibility; not urgent since the event-level schema already works | `src/app/layout.tsx` or per-artist `generateMetadata` | M |
| 18 | Navigating lineup -> artist -> lineup is a hard page load with no transition | Consider the View Transitions API (`prefers-reduced-motion`-respecting) between the lineup grid and an artist page | web.dev; Vercel guidelines already require `prefers-reduced-motion` support, which the site has | `src/app/artists/page.tsx`, `src/app/artist/[slug]/page.tsx` | M |
| 19 | ~28-29 KiB unused JS and 130-260ms of render-blocking requests flagged by Lighthouse on both pages | Audit and code-split/defer the flagged bundles | Lighthouse `unused-javascript`/`render-blocking-insight`, measured 2026-09-19; performance is already 96, so this is diminishing returns, not urgent | build config | M-L |

### What NOT to do before 3 October

- **No redesign** of the artist page or the lineup index. Lighthouse says the pages are not broken; the fixes above are all narrow and additive.
- **No new animation library or dependency.** `prefers-reduced-motion` support already exists; adding a motion library 14 days out is new-dependency risk for a cosmetic want, not a measured need.
- **No View Transitions API work before the festival** - it is a real, scoped idea (item 18) but is a "later," not a "next 14 days," item; test it after 3 Oct.
- **No structural change to the Header's six-link nav** beyond moving the RSVP link (item 4). The nav itself is fine; touching more of it raises the regression surface on a component that renders on every page.
- **No public set-time content anywhere**, including in any example copy drafted from this doc - the site does not publish clock times on public pages (`no-public-set-times.test.ts`, confirmed in the codebase), and nothing in this list proposes changing that.

## Reusable checklist: audit any model-generated page before it ships

Mechanical where possible - a command or a specific file to open, not "review the design."

1. `curl -s <url> | grep -oE '<meta[^>]*(og:image|twitter:image)[^>]*>'` on every dynamic-content variant of the page (not just the happy path) - confirm a share preview exists even when the "ideal" data (a photo, a filled field) is missing.
2. `curl -s <url> | grep -oE 'name="description" content="[^"]*"'` - read the last 10 characters. If it ends mid-word, the truncation is a character slice, not a word-boundary trim.
3. Grep the compiled CSS for every Tailwind class used in the component (`grep -c '\.the-exact-class' <built-css>`) - a class that returns 0 is dead and the element is unstyled, not just "using a default."
4. Fetch every dynamic-content permutation the real data produces (empty string, empty array, null, the longest real value) and look at each one - not just the record used while building it. An "empty state" only counts as designed if you have looked at it.
5. Search the component tree for any string a developer or ops person would recognize but a stranger would not ("claim link," "admin," "TODO," "debug") - `grep -rniE "claim link|admin only|todo|debug|internal use"` across the changed files.
6. Compute contrast for every text-on-fill combination that is not plain body-on-background, especially gradients (check both ends) and any color that is not in the design system's named text-safe list.
7. Confirm every link that looks like a link is an `<a>`/`<Link>`, and every link that is not styled as a link is not the only way to reach that destination.
8. Confirm a `loading.tsx`/skeleton exists for every `dynamic = 'force-dynamic'` or otherwise-slow route, and that the skeleton's shape matches the final content's shape (no shift when it resolves).
9. Confirm `prefers-reduced-motion: reduce` is honored somewhere in global CSS before adding any new animation.
10. Run `npx lighthouse <url> --only-categories=performance,accessibility,best-practices,seo --output=json --chrome-flags="--headless"` on both the "full data" and "empty/sparse data" version of the page; read the failing audits list, not just the four headline scores.
11. Check every focusable element's focus ring is visible against the specific background it sits on (not just the page background) - tab through the page once with a keyboard.
12. Confirm the page has an explicit way back to wherever it was reached from, and to whatever the "next" item is if the content is part of a set (Vercel guidelines: "no dead ends").
13. Diff the desktop and mobile HTML (`curl` with two user agents) - they should be identical unless there is a specific reason for server-side branching.

## Also See

- [dev-workflows/2504-vibecoding-stack-thread](../2504-vibecoding-stack-thread/) - same week, same site: the r/vibecoding "stack I use daily" thread read against ZAO's own stack; its Playwright-testing recommendation for zaostock's checkout is a companion action to this doc's UI punch list.
- [dev-workflows/728-zabal-voting-ux-overhaul](../728-zabal-voting-ux-overhaul/) - prior ZAO precedent for "link fixes + optimistic UI + perceived speed," the same three-tier framing (fix/polish/later) applied to a different ZAO surface.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Ship top-5 fixes (items 1-5): parseable social links, OG-image fallback for photo-less artists, redesigned empty-photo tile, mobile-visible RSVP, word-boundary meta description; PR merged | @Zaal via the zaostock lane | PR | 2026-09-26 |
| Ship remaining Fix items 6-10 (dead CSS class, Twitter card fields, footer aria-label, public claim-link copy, /artist redirect); PR merged | @Zaal via the zaostock lane | PR | 2026-09-30 |
| Ship Polish items 11, 12, 15, 16 (back-to-lineup link, button contrast fix, badge wrapping, loading skeletons) - lower risk, can ride with the Fix PRs or follow immediately after | @Zaal via the zaostock lane | PR | 2026-09-30 |
| Decide on Polish items 13-14 (next/image swap, desktop right-column) - both need a visual QA pass on a real device before merging this close to the festival | @Zaal | Review/decision | 2026-09-26 |
| Re-run `npx lighthouse` on both pages after the top-5 fixes land, confirm scores did not regress | @zj seat | Verification | 2026-09-27 |
| File Later items 17-19 (per-artist JSON-LD, View Transitions, unused-JS cleanup) as post-festival backlog, not before 3 Oct | @Zaal | Backlog note | 2026-10-10 |

## Sources

- [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) - [FULL, method: curl raw.githubusercontent.com, read 2026-09-19]
- [Scoring Show HN submissions for AI design patterns, Adrian Krebs](https://www.adriankrebs.ch/blog/design-slop/) - [FULL, method: curl + HTML strip, read 2026-09-19; HN discussion 333 points/72 comments at `hn.algolia.com/api/v1/items/47864393`, method: HN Algolia API, FULL]
- [5 things that actually made my vibe coded projects not look like vibe coded projects, r/VibeCodersNest](https://www.reddit.com/r/VibeCodersNest/comments/1rtp6eg/5_things_that_actually_made_my_vibe_coded/) - [FULL, method: `zao-fetch-reddit.sh` via Arctic Shift, post body + 9 comments with scores, read 2026-09-19]
- [AI-generated websites always look generic. How do you fix this?, r/vibecoding](https://www.reddit.com/r/vibecoding/comments/1r5zx6j/aigenerated_websites_always_look_generic_how_do/) - [FULL, method: `zao-fetch-reddit.sh` via Arctic Shift, post body + 8 comments, read 2026-09-19; thin thread (1 point) but on-topic]
- [Cumulative Layout Shift (CLS), web.dev](https://web.dev/articles/cls) - [FULL, method: curl + HTML strip, read 2026-09-19]
- [Largest Contentful Paint (LCP), web.dev](https://web.dev/articles/lcp) - [FULL, method: curl + HTML strip, read 2026-09-19]
- [Interaction to Next Paint (INP), web.dev](https://web.dev/articles/inp) - [FULL, method: curl + HTML strip, read 2026-09-19]
- [WCAG 2.2 Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) - [FULL, method: curl + HTML strip, read 2026-09-19]
- [WCAG 2.2 Understanding SC 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) - [FULL, method: curl + HTML strip, read 2026-09-19]
- [Next.js Image component docs (context7, /vercel/next.js)](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/02-components/image.mdx) - [FULL, method: context7 `query-docs`, read 2026-09-19]
- [Refactoring UI, book landing page](https://refactoringui.com/) - [PARTIAL - book itself paywalled; landing page gives full chapter TOC + one verbatim tactic, method: curl, read 2026-09-19]
- [Book summary: Refactoring UI, Sébastien Lavoie](https://www.sglavoie.com/posts/book-summary-refactoring-ui/) - [FULL, method: curl + HTML strip, read 2026-09-19; used to cross-check specific tactics cited (spacing scale, empty states, fewer borders) against the paywalled book's actual content]
- [TUFA, Unison Festival](https://unisonfest.com/artist/tufa/) - [FULL, method: curl + HTML strip, read 2026-09-19]
- [BLOND:ISH, NXNE Music Festival](https://www.nxne.com/2026-artists/blondish) - [FULL, method: curl, read 2026-09-19]
- ZAOstock live pages, `curl` (desktop + mobile UA) and Lighthouse (headless), both pages - [FULL, method: curl + `npx lighthouse`, read 2026-09-19]
- ZAOstock source, `git show origin/main:<path>` at `~/Documents/zaostock` - [FULL, local read-only git show, read 2026-09-19; files: `src/app/artist/[slug]/page.tsx`, `src/app/artist/[slug]/ArtistProfileView.tsx`, `src/app/artists/page.tsx`, `src/components/poster/{Header,Footer,SiteShell,primitives}.tsx`, `src/content/{site,design-kit,festival}.ts`, `src/lib/artists.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/tickets/page.tsx`]
- [dev-workflows/2504-vibecoding-stack-thread](../2504-vibecoding-stack-thread/) - [FULL, library, resolved via `zao-research-health --resolve 2504`]
