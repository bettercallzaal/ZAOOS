---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: 796
original-query: "https://github.com/orgs/zen-browser/repositories"
tier: STANDARD
---

# 817 - Zen Browser org repo map: surfer (Firefox-fork build tool) + what is reusable for ZAO

> **Goal:** Map the zen-browser GitHub org (16 repos) and decide what, if anything, in it is reusable for the ZAO ecosystem. Companion to Doc 796 (which evaluated Zen as a daily-driver). This doc is the code/build-tooling angle, not the "should I use the browser" angle.

## Key Decisions

| Decision | Verdict | Reason |
|----------|---------|--------|
| Build a ZAO-branded Firefox fork using surfer | SKIP for now - no doc, no demand | Surfer (`@zen-browser/surfer`) makes Firefox forks buildable, but ZAO has zero browser surface and zero browser tasks in flight. A browser is a multi-year maintenance burden (Zen tracks every Firefox security release, see Doc 796). No project pulls toward it. Per CLAUDE.md "no new bots/surfaces without a doc + Zaal approval" - same bar applies to a browser. Park the capability; do not start. |
| Note surfer as the canonical "build-your-own-Firefox-fork" tool | YES - file it | If ZAO ever wants a hardened/branded browser (e.g. a locked-down kiosk browser for an event, or a ZAO-themed research browser), surfer is the entry point, not patching Firefox by hand. It is the live successor to gluon/melon and is what ships Zen's 43k-star desktop build. |
| Reuse zen-browser's docs/theme-store/www patterns | LOW priority - they are generic | `www` is Astro, `docs` is MDX, `theme-store` is a CSS-theme registry. All are standard static-site / community-registry patterns ZAO already has equivalents for. Nothing org-specific worth lifting. |
| Treat any zen repo as a dependency in ZAO code | NO | Nothing here is a library ZAO would `npm install` into ZAOOS. Surfer is a build CLI for a desktop app, not a web dep. |

## The org at a glance (16 repos, verified 2026-06-08)

| Repo | What | Lang | Stars | ZAO relevance |
|------|------|------|-------|---------------|
| **desktop** | The Zen Browser app (Firefox fork) | JavaScript | ~43k | Reference only (see Doc 796) |
| **surfer** | "Simplifying building firefox forks" - the build CLI | TypeScript (94.3%) | 147 | The one genuinely interesting tool here |
| **www** | Homepage | Astro | ~1.3k | Generic static-site pattern |
| **theme-store** | Community theme registry | CSS | 373 | Generic registry pattern |
| **docs** | Docs for Zen's core principles | MDX | 183 | Generic |
| **flatpak** | Official Linux Flatpak packaging | Shell | 52 | Linux packaging only |
| **updates-server** | Resource server for Firefox auto-update | Shell | 21 | Infra for the fork's updater |
| **release-utils** | Release-workflow automation scripts | TypeScript | 12 | Internal release tooling |
| **plugin** | Plugin-library interface for TS projects | (unlisted) | 8 | Internal |
| **windows-binaries** | Windows build/signing packages | (unlisted) | 8 | Internal |
| **windows / .github** | Org GitHub profile page | (unlisted) | 11 | Internal |
| **pdf.js** | Fork of Mozilla's PDF reader | JavaScript | 10 | Upstream fork, not original |
| **prettier** | Fork of the formatter | JavaScript | 2 | Upstream fork |
| **l10n-packs** (archived) | Localization | - | - | Dead |
| **branding-archive** (archived) | Brand assets | - | - | Dead |
| **theme-components / zen** (archived) | Theme + flatpak-validation utils | - | - | Dead |

Pattern: one big repo (`desktop`), one reusable tool (`surfer`), and a constellation of small internal/packaging/archived repos. Standard shape for a single-product open-source org.

## surfer - the only piece worth a deep look

`@zen-browser/surfer` is a **TypeScript CLI that downloads, patches, and builds a Firefox fork**, abstracting away the painful parts of compiling Gecko with your own branding and source patches.

Lineage (verified across the org page, npm, and the gluon repo):

```
melon (Dot Browser's build tool, MPL-2.0)
  -> gluon (pulse-browser/gluon, extracted from melon)
    -> surfer (zen-browser/surfer, fork of gluon; gluon's author went inactive)
```

Facts:
- License **MPL-2.0**, same as Zen and Firefox.
- npm: `npm install @zen-browser/surfer`.
- 709 commits to main, **still labeled prerelease/prototype - no published npm release yet** as of 2026-06-08. So it is "what Zen uses internally" more than "a stable product you can pin."
- Docs still point at `docs.gluon.dev` (the gluon-era domain), reflecting the fork heritage.
- The CLI surface mirrors gluon's: `download` (fetch the Firefox source), `bootstrap`, `build`, `package`, `run`, and `import`/`export` patches (apply/extract your source modifications as a patch set). [PARTIAL - exact surfer command names not individually re-verified against the surfer docs; mirrored from gluon's documented CLI given surfer is a direct fork. Confirm against `docs.gluon.dev` before any real build.]
- What it does NOT remove: building a Firefox fork still means compiling Gecko (C++), tracking upstream Firefox security releases, and shipping signed binaries per-platform (hence the separate `flatpak`, `windows-binaries`, `updates-server` repos). Surfer reduces the patch-management pain; it does not make a browser cheap to maintain.

## ZAO grounding (codebase check)

Grepped ZAOOS `src/` for `firefox|gecko|browser fork|surfer`: **zero real hits.** The two matches (`src/components/music/WaveformPlayer.tsx`, `src/hooks/useLiveTranscript.ts`) are coincidental matches on the substring "browser" in unrelated code. `community.config.ts` has no browser references.

Negative signal, stated plainly: ZAO has no browser surface, no browser tooling, and no in-flight browser task. There is no integration point for anything in this org. The value of this doc is purely "know the tool exists if the need ever appears."

## When surfer would actually matter for ZAO

Only in narrow, currently-hypothetical cases:

1. **Event kiosk browser** - a locked-down ZAO-branded browser for a ZAOstock / COC Concertz install (no address bar, pinned to ZAO surfaces). Surfer + a thin patch set could produce this. Still a maintenance tail.
2. **Hardened research browser** - a privacy-pre-configured Firefox build for the team (the `about:config` hardening from Doc 796 baked in at build time instead of applied by hand). Cheaper alternative: ship a Firefox/LibreWolf profile, no fork needed.
3. **Never** for the web app - ZAOOS is a Next.js web product; nothing here touches it.

For all three, the cheaper move (profile + extension + theme) beats a fork until proven otherwise. Do not start a fork on a hunch.

## Also See

- [Doc 796](../796-zen-browser-firefox-fork-daily-driver/) - Zen as a daily-driver browser (UX, privacy caveats, macOS memory leak). The "should I use it" companion to this "what is in the org" doc.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| File surfer as the canonical "build-a-Firefox-fork" tool in dev-workflows knowledge; do NOT start a fork | @Zaal | Note | Done (this doc) |
| If a ZAO event ever needs a kiosk browser, evaluate Firefox profile/extension FIRST, surfer fork only if that fails | @Zaal | Decision gate | When/if event need arises |
| Re-validate surfer release status (still prerelease? stable npm release yet?) before any real build | @Zaal | Re-research | Only if fork is greenlit |

## Sources

- [zen-browser org repositories](https://github.com/orgs/zen-browser/repositories) [FULL - org repo list, names, descriptions, languages, stars read 2026-06-08]
- [zen-browser/surfer](https://github.com/zen-browser/surfer) [FULL - README, lineage, license, npm name, prerelease status read 2026-06-08]
- [@zen-browser/surfer on npm](https://www.npmjs.com/package/@zen-browser/surfer) [PARTIAL - install command confirmed; published-version status read as no release via repo, npm page not separately rendered]
- [pulse-browser/gluon](https://github.com/pulse-browser/gluon) [FULL via search - confirmed gluon = surfer's parent, melon = grandparent, "build firefox forks with ease"]
- [Zen Browser - Wikipedia](https://en.wikipedia.org/wiki/Zen_Browser) [FULL via search - corroborates fork lineage and Firefox-base claim]
- [Zen Browser on Lobsters](https://lobste.rs/s/jhdd1r/zen_browser_open_source_browser_based_on) [PARTIAL - community thread surfaced via search, comment tree not walked; used only to confirm Zen-is-Firefox-fork sentiment]
- ZAOOS codebase grep (`src/`, `community.config.ts`) for `firefox|gecko|browser fork|surfer` [FULL - zero real hits, negative signal]
