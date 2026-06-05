---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-06-04
superseded-by:
related-docs:
original-query: "https://zen-browser.app/"
tier: STANDARD
---

# 796 - Zen Browser: Firefox-fork daily driver eval (Arc successor)

> **Goal:** Decide whether Zen Browser is worth adopting as a ZAO/BCZ dev daily driver, and flag the privacy + memory caveats that the marketing hides.

## Key Decisions

| Decision | Verdict | Reason |
|----------|---------|--------|
| Adopt Zen as primary daily-driver browser | USE for the tab-heavy build-in-public workflow | Vertical tabs + Workspaces + 4-pane Split View beat Chrome/Firefox stock for 30+ tab research sessions; it is the strongest Arc replacement (86/100 at doolpa) and the only credible non-Chromium Arc successor after Arc went into feature freeze Oct 2024. |
| Trust the "privacy-focused" marketing label | DO NOT trust at face value | Zen still phones `incoming.telemetry.mozilla.org` + ~20 Mozilla/third-party endpoints on a fresh profile (Issues #5947, #7000, #10560, open as of 2026-03-18). It is more private than Chrome, but NOT the clean-room privacy browser the homepage implies. For real privacy hardening use LibreWolf / IronFox / Phoenix, or apply the `about:config` prefs from Issue #7000. |
| Run Zen on a 16 GB Mac with session restore | USE WITH CAUTION | Documented macOS memory leak (Issue #13494, Apr 2026): main process balloons 500 MB to 3.7 GB+ unpredictably, total footprint up to 12 GB, triggers Jetsam killing background apps. Workaround = Cmd+Q relaunch. Partially mitigated by recent Firefox 150 base. |
| Treat Zen as a hard fork you can rely on long-term | NO - it is "Firefox with a skin" | No meaningful Gecko-internals divergence; it tracks Firefox releases for security fixes (Discussion #3391). If Mozilla's funding/quality degrades, Zen inherits it. Bet on Zen the UX layer, not Zen the independent engine. |
| Use for streaming / DRM (Widevine) | KEEP Chrome around | DRM (Widevine) support is limited (Linux-only per Issue #7000 discussion); Netflix/Spotify-tier Widevine services still want Chrome. |

## What it is

Zen is a **Firefox fork** (Gecko engine, NOT Chromium) that bolts Arc-style workflow UX onto Firefox's privacy + extension ecosystem. Free, open source, **MPL-2.0**. Positioned explicitly as the spiritual successor to Arc after The Browser Company froze Arc in Oct 2024 and absorbed a large share of Arc refugees.

Repo facts (`github.com/zen-browser/desktop`, verified 2026-06-04):
- **42,029 stars**, 1,498 forks, **210 contributors**, created 2024-03-28
- Languages: JavaScript 36.5%, Fluent 27.7% (localization), C++ 27.1%, CSS 5.1%
- **Latest stable: 1.19.13b on Firefox 150.0.3** (released 2026-05-14), 167 releases total
- **Two channels:** Release (stable Firefox base) + **Twilight** (RC/pre-release; ships Boosts feature - color tint/fonts/element-zap/force-dark - ahead of stable)
- 529 open issues

## Features (the reason to switch)

| Feature | What | Shortcut (Mac) |
|---------|------|----------------|
| **Workspaces** | Isolated tab sets per project/client; each bindable to a Firefox Container (separate cookie jar). Arc Spaces equivalent. | - |
| **Compact Mode** | Sidebar collapses to favicon strip; near-fullscreen reading view. | Cmd+Alt+C |
| **Split View** | Up to **4 tabs** tiled in a grid (binary-tree layout). Chrome's built-in split is 2-pane only - Zen's 4-pane grid is unique among mainstream Mac browsers in 2026. | Cmd+Alt+V |
| **Glance** | Alt+click floating link preview (Arc's Little Arc equivalent). | Alt+click |
| **Container Tabs** | Firefox Multi-Account Containers, surfaced more prominently. Two Google accounts isolated in one window. | - |
| **Essentials + Pinned Tabs** | Always-available large-icon app tiles at top of sidebar. | - |
| **Mods** | Customization layer at `zen-browser.app/mods` extending each feature. | - |
| **Firefox Sync** | E2E-encrypted cross-device sync (tabs, bookmarks, passwords, addons, Workspaces, Mods enabled-list). Mozilla holds no decryption key. Cookies/sessions intentionally do NOT sync. | - |

All work out of the box without `userChrome.css` hacks. Full Firefox extension + addon compatibility.

## Findings (the caveats the homepage buries)

### 1. The privacy story is weaker than the marketing

The homepage core value is "Private and always up-to-date." Reality, per multiple still-open GitHub issues:

- On a **fresh profile with no extensions**, Zen makes DNS queries to `incoming.telemetry.mozilla.org`, `location.services.mozilla.com`, `firefox.settings.services.mozilla.com`, `merino.services.mozilla.com`, `detectportal.firefox.com`, and ~15 more (Issues #5947, #7000). Confirmed via pihole/AdGuard/opensnitch by multiple reporters, still present on 1.19.3b (Firefox 147) as of 2026-03-18.
- A reported **remote-debugging backdoor**: remote debugging enabled by default while connection prompts disabled - a remote-code-execution attack vector (Issue #5947). Maintainers closed the discussion; a Reddit PSA on r/zen_browser was removed (maintainers claim Reddit's anti-bot auto-removal).
- Maintainers have shipped fixes (bundled startup favicons locally via private CDN, stripped some pings) but the metadata-leakage critique (IP + user-agent + timing exposure on every Mozilla connection) remains.

Net: Zen is more private than Chrome and ships Enhanced Tracking Protection on by default, but is **not** the clean privacy browser the label claims. Treat "privacy-focused" as marketing, not a guarantee.

### 2. macOS memory leak (active, 2026)

Issue #13494 (Apr 2026): main Zen process grows from ~500 MB at launch to **3.7 GB+** with no workload correlation; total footprint (main + WebExtensions + GPU + content) peaks ~**12 GB on a 16 GB machine**, triggering macOS memory-pressure warnings and Jetsam killing background apps. Confirmed by multiple users (M2 Macs, Windows too). Only reclaimed by full quit + relaunch. Recent updates (Firefox 150 base) reportedly reduce frequency but do not eliminate it. Multiple commenters switched back to Chrome/Arc over this.

### 3. "Firefox with a skin"

Discussion #3391: Zen makes no meaningful Gecko-internals changes - it is config optimization + UI patches on Firefox. It is a **soft fork** that must track Firefox releases for critical security updates; it lacks the resources to maintain an independent engine. Anything Firefox breaks, Zen inherits. Dissent in the same thread: some users find every Zen update gets gradually worse / "in your face about updates" and considered reverting to Firefox; others report stability picking up as the team focuses on polish.

### 4. Migration friction

Imports everything from Chrome **except autofill data and saved passwords** - those need a CSV export/import (Issue: XDA report). DRM/Widevine limited to Linux per maintainer discussion, so keep Chrome for streaming.

## Relevance to ZAO / BCZ

- No hit in `research/` or `src/` for "zen browser" (verified 2026-06-04 dedup grep) - this is the first eval. Valid negative signal: not referenced anywhere in ZAOOS.
- Ties to the dev-surface decision in memory `project_cc_cloud_container_default.md`: default CC dev surface is the claude.com cloud container, Mac terminal is fallback. The **local browser** for dogfooding ZAOOS (the `/browse`, `/qa`, `setup-browser-cookies` skills) is separate from Zen - those skills drive a headless Chromium, so Zen adoption does NOT affect QA tooling. Zen would be Zaal's *human* daily driver, not the automation browser.
- Build-in-public angle: Zen's Workspaces map cleanly to ZAO's multi-project reality (ZAOOS / ZAOstock / WaveWarZ / BCZ / ZABAL Games all as separate Workspaces with Container isolation for the many Google/X/Farcaster logins).

## Also See

- Memory `project_cc_cloud_container_default.md` - default dev surface (cloud container > Mac terminal)
- `.claude/skills/browse/` + `/qa` + `setup-browser-cookies` - headless Chromium automation (unaffected by Zen)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Trial Zen 1.19.13b as daily driver for 1 week; set up Workspaces per project (ZAOOS/ZAOstock/WaveWarZ/BCZ) each Container-bound | @Zaal | Trial | Optional, this week |
| If trialing: apply Issue #7000 `about:config` privacy prefs (disable telemetry endpoints, OpenH264, captive-portal checks, Merino) | @Zaal | Config | After install |
| If on 16 GB Mac: watch Activity Monitor for the #13494 leak; Cmd+Q relaunch if main process > 3 GB | @Zaal | Monitor | During trial |
| Keep Chrome installed for Widevine/streaming + as the React-only-site fallback | @Zaal | Note | Standing |
| Re-validate this doc when Zen hits a stable 1.20+ (Boosts in stable, leak fixes) | @Zaal | Re-research | ~30 days |

## Sources

- [Zen Browser homepage](https://zen-browser.app/) - [FULL] official feature copy + core values, fetched via exa web_fetch
- [zen-browser/desktop GitHub](https://github.com/zen-browser/desktop) - [FULL] stars/forks/contributors/license/version, fetched via exa web_fetch
- [Issue #5947 - Telemetry and privacy issues + remote-debug backdoor](https://github.com/zen-browser/desktop/issues/5947) - [PARTIAL - exa highlights of the issue thread; full comment tree not walked, but the substantive maintainer/reporter exchange is captured]
- [Issue #7000 - Unwanted Connections, Transparency, Default Search Engine](https://github.com/zen-browser/desktop/issues/7000) - [PARTIAL - exa highlights including the full Phoenix/IronFox about:config hardening prefs list]
- [Issue #10560 - Connection to incoming.telemetry.mozilla.org on startup](https://github.com/zen-browser/desktop/issues/10560) - [PARTIAL - exa highlights confirming issue still present 2026-03-18 on 1.18.10b]
- [Issue #13494 - macOS memory leak 500MB to 3.7GB+](https://github.com/zen-browser/desktop/issues/13494) - [PARTIAL - exa highlights of repro steps + multi-user confirmation]
- [Discussion #3391 - Firefox state / is Zen a real fork](https://github.com/zen-browser/desktop/discussions/3391) - [PARTIAL - exa highlights of the "Firefox with a skin" critique + dissent]
- [Doolpa - Zen Browser Review 2026 (86/100)](https://doolpa.com/article/zen-browser) - [PARTIAL - exa highlights, full review body not fetched]
- [SupaSidebar - Zen Browser Features Guide 2026](https://supasidebar.com/blog/zen-browser-features-guide-2026) - [PARTIAL - exa highlights, detailed feature/shortcut breakdown captured]
- [XDA - This Firefox fork fixed every complaint I had with Mozilla](https://www.xda-developers.com/this-firefox-fork-fixed-every-complaint-i-had-with-mozilla/) - [PARTIAL - exa highlights]
- [XDA - This niche browser handles 100+ tabs better than Chrome](https://www.xda-developers.com/niche-browser-handles-100-tabs-better-than-chrome/) - [PARTIAL - exa highlights]
