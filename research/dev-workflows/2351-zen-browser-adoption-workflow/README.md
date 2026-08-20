---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: 796, 817
original-query: "/zao-research on what we at the zao can do with zen browser being opensource and help us with our workflow"
tier: STANDARD
---

# 2351 - Zen Browser adoption: what open source buys The ZAO, and where it fits the workflow

> **Goal:** Zaal installed Zen (2026-08-20) as his main browser. Decide what The ZAO can actually DO with Zen being open source, and define the human-browser / automation-browser split so the agent stack keeps working.

## Key Decisions

| Decision | Verdict | Reason |
|----------|---------|--------|
| Zen as Zaal's main HUMAN browser | USE (already installed via `brew install --cask zen`) | Doc 796's verdict holds and the two blockers it flagged are now resolved: the macOS memory leak (Issue #13494) was CLOSED 2026-07-19, and the project ships steadily - 1.21.15b released 2026-08-18, repo pushed the day of this research. 44,001 stars, MPL-2.0 (LICENSE file read, verbatim MPL 2.0 header). |
| Zen as the AUTOMATION browser Claude drives | NO - keep Arc/Chrome for that | Zen is Firefox/Gecko. The Claude-in-Chrome extension is Chromium-only, and the vendored gstack `/browse` skill imports cookies only from Chromium-family browsers (Comet, Chrome, Arc, Brave, Edge - per `.claude/skills/gstack/browse` cookie-import-browser). The split: Zen = Zaal's hands, Arc/Chrome = Claude's hands. |
| Fork/rebrand Zen into a ZAO browser | SKIP - unchanged from Doc 817 | MPL-2.0 legally allows it and `zen-browser/surfer` is the tool, but a browser is a multi-year security-tracking burden with zero ZAO demand. Parked capability, not a project. |
| Ship ZAO-branded Zen Mods (themes) instead of a fork | BUILD ONE - this is the cheap open-source win | Zen Mods are CSS/JS customizations distributed through zen-browser.app/mods (community registry, no gatekeeper). A "ZAO workspace" mod - navy `#0a1628` + gold `#f5a623` theme matching the ZAOOS dark theme in `.claude/rules/components.md` - is a build-in-public artifact that costs hours, not months, and puts ZAO branding in a 44k-star project's registry. |
| Structure Zaal's Zen with per-brand Workspaces | USE from day one | Zen Workspaces map 1:1 onto the ZAO brand-context problem (ZABAL / ZAOstock / Sparkz / research are separate tab universes). This is the concrete workflow win over Chrome; set up 4-5 workspaces before organic tab sprawl starts. |
| Trust Zen blindly because "open source" | NO - keep the Doc 796 posture | The 2025-03 "backdoor enabled by default" incident (HN 46 pts) was real: a debug remote-capability shipped on by default; patched same day it was raised (PR #927). Open source is why it was FOUND fast - it is not a guarantee nothing ships misconfigured. Telemetry caveats from Doc 796 still apply on a fresh profile. |

## What "open source" concretely buys The ZAO (MPL-2.0, verified in LICENSE file)

1. **Mods/themes distribution channel.** Anyone can publish to the Zen Mods registry (`zen-browser/theme-store` repo per Doc 817). A ZAO-branded mod is free distribution surface in front of Zen's user base - the same build-in-public muscle as skills/repos, near-zero maintenance.
2. **Fork rights, held in reserve.** MPL-2.0 = file-level copyleft; ZAO could ship a branded fork via `surfer` (Doc 817 mapped this). Verdict stays SKIP, but the option is real and legal - unlike freeware Arc, which is frozen AND closed.
3. **Auditable behavior.** The backdoor incident's lifecycle (community found it, PR merged same day) is the open-source safety loop working. For an org that runs credentialed sessions in its daily browser, being able to read what the browser phones home matters - Doc 796's `about:config` hardening list applies.
4. **No platform risk from a vendor freeze.** Arc froze Oct 2024 and its users had no recourse. Zen dying would leave the code + build tool public - the exit is a community fork, not a migration.
5. **Firefox extension ecosystem** - uBlock Origin proper, Sidebery, userChrome.css. HN dissent worth keeping honest: several commenters (130-pt thread, 2025-08) report vanilla Firefox + Sidebery + userChrome.css reaches "99% of Zen" - the value is curation, not exclusivity.

## Workflow fit (the reason Zaal installed it)

| Zen feature | ZAO workflow use |
|---|---|
| Workspaces | One per active brand: ZABAL finale, ZAOstock (Oct 3), Sparkz, research/build. Matches the brand-priority stack. |
| Split View (up to 4 panes) | Grill sessions: cowork board + Telegram Web + the PR under review side by side. |
| Compact Mode | Full-width reading of research docs / dashboards on the Air's 13-inch screen. |
| Glance | Peek at a link from a doc without losing the tab context. |
| Live Following (RSS + GitHub PRs as first-class, added ~2026-03, HN item 47277806) | Follow bettercallzaal/ZAOOS PRs + ZAO newsletter RSS natively - a lightweight standing view of the PR firehose without the GitHub tab pile. |
| Twilight channel | SKIP for the daily driver - RC builds; stability matters more than early features on the main machine. |

## The automation split (the operational rule this doc establishes)

- **Zen** = Zaal's human browser. Logins, reading, socials, brand work.
- **Arc or Chrome** = the automation browser. Claude-in-Chrome extension sessions, gstack `/browse` cookie imports (`cookie-import-browser Arc --domain ...`), QA runs. The pending ZAO-Vercel dig this session is exactly this path: Arc holds the login, Claude imports its cookies.
- Consequence: do NOT uninstall Arc/Chrome after moving to Zen. A Zen-only Mac would blind the browser-automation half of the agent stack.

## Numbers (current as of 2026-08-20)

- Repo `zen-browser/desktop`: 44,001 stars (+1,972 since Doc 796's 42,029 on 2026-06-04), 1,711 forks, 633 open issues, pushed 2026-08-20.
- Latest stable: **1.21.15b** (2026-08-18) - two minor versions past Doc 796's 1.19.13b.
- License: **MPL-2.0** - read from the LICENSE file itself per Hard Requirement 13, not the API classifier.
- Memory-leak Issue #13494: **closed 2026-07-19** (23 comments). Doc 796's "USE WITH CAUTION on 16 GB" caveat is downgraded, not deleted - watch Activity Monitor the first week.

## Also See

- [Doc 796](../796-zen-browser-firefox-fork-daily-driver/) - the daily-driver eval this doc updates (features table, shortcuts, privacy hardening list)
- [Doc 817](../817-zen-browser-org-repos-surfer/) - org repo map, surfer build tool, fork verdict
- `.claude/rules/components.md` - the ZAO dark-theme tokens a ZAO mod would ship
- CLAUDE.md gstack section - `/browse` is the sanctioned automation-browser path

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set up 4 brand Workspaces in Zen (ZABAL, ZAOstock, Sparkz, research) - done when they exist in the sidebar | @Zaal | Manual, 10 min | 2026-08-22 |
| Keep Arc installed + logged into Vercel/ZAO surfaces as the automation browser - done when the ZAO-Vercel cookie dig succeeds | @Zaal + Claude | Standing rule | 2026-08-22 |
| Build "ZAO" Zen Mod (navy/gold theme) + submit to zen-browser theme-store - done when the PR to theme-store is open | @Zaal (Claude drafts) | PR | 2026-09-05 |
| Apply Doc 796's about:config telemetry hardening to the new Zen profile - done when the pref list is applied | @Zaal | Manual | 2026-08-24 |

## Sources

- [zen-browser/desktop repo facts](https://github.com/zen-browser/desktop) - [FULL, `gh api` JSON: stars/forks/issues/license/pushed_at, 2026-08-20]
- [LICENSE file](https://github.com/zen-browser/desktop/blob/main/LICENSE) - [FULL, `gh api contents` + base64 decode, read verbatim MPL-2.0 header]
- [Release 1.21.15b](https://github.com/zen-browser/desktop/releases) - [FULL, `gh api releases/latest` JSON]
- [Issue #13494 memory leak](https://github.com/zen-browser/desktop/issues/13494) - [FULL, `gh api` JSON: state closed, updated 2026-07-19]
- [Issue #7000 telemetry](https://github.com/zen-browser/desktop/issues/7000) - [FULL, `gh api` JSON: state closed 2025-05-23]
- [HN: Why I'm all-in on Zen Browser (130 pts, 2025-08)](https://news.ycombinator.com/item?id=44951799) - [FULL, Algolia items API, top comments read incl. dissent]
- [HN: Zen browser had a backdoor enabled by default (46 pts, 2025-03)](https://news.ycombinator.com/item?id=43443494) - [FULL, Algolia items API; links PR #927, patched same day]
- [HN: Live Following RSS/GitHub PRs (2026-03)](https://news.ycombinator.com/item?id=47277806) - [PARTIAL - headline + date from Algolia search; feature page not fetched. Non-load-bearing: cited only as feature-exists signal]
- [zen-browser.app/mods](https://zen-browser.app/mods/) - [FULL, raw curl + HTML strip, 126 KB page]
