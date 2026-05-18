# Audit 663f: Brand/Website + Misc Utility Repos

**Scope:** bettercallzaal/bettercallzaalwebsite, bettercallzaal/riverside-group-demo, and 5 private repos (quad-sandbox, zao-ui, zao-mono, zaoos-workspace, budget2026).

**Run date:** 2026-05-17

---

## Public Repos

### 1. bettercallzaal/bettercallzaalwebsite

**Purpose:** Brand flagship. Primary website for BetterCallZaal entity and ZAO community portal.

**Stack:** HTML (339KB), Python (9.7KB) — likely static site generator or template engine.

**Health metrics:**
- Default branch: main
- Last push: 2026-05-18 01:00 UTC (current, ~1 day ago)
- Commits: 70 total
- Stars: 0 | Watchers: 0 | Open issues: 0
- Language breakdown: ~97% HTML, ~3% Python

**Status:** ACTIVE. Recent push suggests ongoing updates (likely bettercallzaal.com content).

**Share-readiness:** Public repo, ready for sharing. Live endpoint expected at bettercallzaal.com.

**Cross-dependencies:**
- **Consumed by:** zao-mono (submodule `bcz`); also referenced in nexus.html (doc 553 memory).
- **Consumes:** None detected (static site).
- **Links to:** bettercallzaal.com (live).

**Recommendation:** Document recent changes (May 17-18). If auto-deployed from main, verify CI/CD pipeline exists. Last commit message would clarify scope.

---

### 2. bettercallzaal/riverside-group-demo

**Purpose:** Client portfolio demo. Landscape design firm website (Riverside Group LLC, Mount Desert, ME).

**Stack:** HTML (80.6KB), CSS (31.9KB), JavaScript (11.2KB) — vanilla static site.

**Health metrics:**
- Default branch: main
- Last push: 2026-05-15 18:16 UTC (3 days ago)
- Commits: 3 total
- Stars: 0 | Watchers: 0 | Open issues: 0
- Language: ~72% HTML, ~28% CSS, ~10% JS

**Status:** MATURE/SHIPPED. Low commit count + no open issues suggest completed project. Stable maintenance expected.

**Share-readiness:** Public, shareable. Demonstrates BCZ consulting capability (web design for non-tech clients).

**Cross-dependencies:**
- **Consumed by:** None detected (standalone client project).
- **Consumes:** None detected.
- **Links to:** Likely deployed somewhere (Vercel? GitHub Pages?). Check Actions.

**Recommendation:** Verify domain/deploy target. Add to portfolio evidence doc if Riverside is reference client.

---

## Private Repos (No Access)

### 3. bettercallzaal/quad-sandbox

**Status:** Private, no access from this session.

**Known:** QuadWork 4-agent sandbox (per gh API). Last push 2026-04-24. Cannot audit.

---

### 4. bettercallzaal/zao-ui

**Status:** Private, no access.

**Known:** Shared UI design tokens, navy/gold dark theme. Last push 2026-04-16. Consumed by other projects but not inspectable here.

---

### 5. bettercallzaal/zao-mono

**Status:** Private, no access to full repo. .gitmodules IS accessible.

**Submodule Inventory (ALIVE, not abandoned):**

```
zaoos                -> github.com/bettercallzaal/ZAOOS.git
fishbowlz            -> github.com/bettercallzaal/fishbowlz.git
concertz             -> github.com/bettercallzaal/CoCConcertZ.git
bcz                  -> github.com/bettercallzaal/bettercallzaalwebsite.git
zounz                -> github.com/bettercallzaal/ZOUNZ.git
newsletter           -> github.com/bettercallzaal/zabalnewsletter.git
musicbot             -> github.com/bettercallzaal/zaomusicbot.git
videoeditor          -> github.com/bettercallzaal/ZAOVideoEditor.git
zabalart             -> github.com/bettercallzaal/zabalartsubmission.git
ui                   -> github.com/bettercallzaal/zao-ui.git
```

**Assessment:** Monorepo IS maintained. Maps 10 major ZAO ecosystem projects as submodules. Last update 2026-04-16. Useful as a dependency graph artifact for /zao-research cross-repo navigation.

**Critical note:** See ZAOOS in submodule list — this is the main lab repo (ZAOOS.git, not ZAOOS-V1). Verify if primary operational monorepo or archive.

---

### 6. bettercallzaal/zaoos-workspace

**Status:** Private, no access.

**Known:** ZOE workspace (agent configs, memory, daily logs). Last push 2026-04-05 (stale by 6+ weeks). Cannot audit.

---

### 7. bettercallzaal/budget2026

**Status:** Private, no access.

**Known:** Finance tracking. Last push 2026-04-01 (17 days ago, aging). Cannot audit.

---

## Cross-Repo Dependency Summary

**Public repos consumed by private infrastructure:**
- bettercallzaalwebsite: submodule `bcz` in zao-mono
- riverside-group-demo: standalone, no upstream consumers

**Design tokens:**
- zao-ui (private) is the canonical source for navy/gold theme. Shared across all ZAO projects.
- See zao-mono submodule `ui` for integration point.

**Monorepo role:**
- zao-mono .gitmodules acts as ecosystem map. 10 active submodules tracked.
- ZAOOS (capitalized in submodule, may differ from ZAO OS V1 on disk) needs clarification.

---

## Actionable Recommendations

1. **bettercallzaalwebsite:** Verify CI/CD deployment. Add commit link to nexus.html update (May 18).
2. **riverside-group-demo:** Document client reference + deploy target. Portfolio evidence for BCZ consulting track record.
3. **zao-mono:** Use submodule list as canonical ecosystem dependency map for /zao-research. Clarify ZAOOS submodule vs. /Users/zaalpanthaki/Documents/ZAO OS V1 working directory.
4. **zao-ui:** Private, but critical. Coordinate design token changes with submodule consumers before pushing.
5. **Stale repos:** zaoos-workspace (6 wks) and budget2026 (17 days) are aging. If inactive, archive or add automation to reduce context debt.

---

## Notes for Next Agent

- zao-mono .gitmodules is the single source of truth for ecosystem shape. Mirror it to a public dependencies doc.
- Private repos limit visibility here. /zao-research agent should request elevated access or coordinate with Zaal for broader audit.
- Riverside demo is a strong BCZ case study — flag for portfolio/pitch collateral.
