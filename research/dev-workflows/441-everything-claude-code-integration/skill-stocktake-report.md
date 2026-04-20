# Skill Stocktake Audit — ZAO OS + Global Skills

**Date:** April 20, 2026  
**Scope:** 24 top-level SKILL.md files (7 global + 17 project), plus bundled references and artifacts  
**Total Unique Skills Evaluated:** 24

---

## Summary Table

| # | Skill | Scope | Verdict | Reason |
|---|-------|-------|---------|--------|
| 1 | autoresearch | Global + Project | Keep | Core loop engine with comprehensive subcommands; heavily documented |
| 2 | zao-research | Global + Project | Keep | Specialized research workflow for ZAO ecosystem; complements autoresearch |
| 3 | gstack | Global | Keep | Browser QA + workflow routing; foundational tooling |
| 4 | graphify | Global | Keep | Knowledge graph pipeline; unique capability |
| 5 | clipboard | Global | Keep | Targeted for copy/share tasks; lightweight |
| 6 | socials | Global + Project | Keep | Platform-specific post generation; active use |
| 7 | big-win | Project | Keep | ZAO-specific win documentation; quarterly-driven |
| 8 | worksession | Project | Keep | Session isolation + git hygiene; essential for branch discipline |
| 9 | morning | Project | Keep | Kickoff ritual with `/z` integration |
| 10 | z | Project | Keep | Status dashboard; complements morning |
| 11 | newsletter | Project | Keep | Daily newsletter in Zaal's voice; active use |
| 12 | catchup | Project | Keep | Context recovery; high value for session resets |
| 13 | check-env | Project | Keep | Env validation before deploy; narrow scope |
| 14 | design-steal | Project | Improve | Incomplete description + no visible implementation guidance |
| 15 | fishbowlz | Project | Improve | Marked deprecated in memory; should be retired or updated |
| 16 | fix-issue | Project | Keep | GitHub issue workflow; narrow, well-defined |
| 17 | inbox | Project | Keep | ZOE email forwarding processor; specialized |
| 18 | lean | Project | Keep | Waste audit skill; unique capability |
| 19 | reflect | Project | Keep | End-of-day journal; complements morning |
| 20 | standup | Project | Keep | Build-in-public update generation |
| 21 | vps | Project | Keep | Agent squad management (ZOE, ZOEY, WALLET) |
| 22 | new-component | Project | Keep | React component scaffolding; narrow scope |
| 23 | new-route | Project | Keep | API route scaffolding; narrow scope |
| 24 | gitnexus (4 skills) | Project | Merge | Redundant wrapper layer; consolidate to 1 entry skill |

---

## Detailed Verdicts

### IMPROVE

#### 14. design-steal

**Path:** `~/Documents/ZAO OS V1/.claude/skills/design-steal/SKILL.md`  
**Issue:** Description reads "|\|" (placeholder); no body content beyond frontmatter  
**Action:** Either document the skill's actual purpose/workflow, or delete it  
**Alternative:** If the intent is visual design inspiration, consider merging into `big-win` or creating proper documentation

---

#### 15. fishbowlz

**Path:** `~/Documents/ZAO OS V1/.claude/skills/fishbowlz/SKILL.md`  
**Status in Memory:** Marked DEPRECATED (Apr 16, 2026 — "paused mid-brainstorm, partnering with Juke (nickysap) Farcaster audio client instead")  
**Issue:** Skill file still exists and is callable, but project is paused. Creates confusion about active status.  
**Action:** Either:
1. **Delete** the skill entirely if FISHBOWLZ is truly paused long-term
2. **Update** the SKILL.md with a deprecation notice + pointer to Juke partnership  
3. **Rename** to `fishbowlz-archive` if reference value exists but it's not active

---

### MERGE

#### 4 gitnexus Skills → 1

**Paths:**
- `~/Documents/ZAO OS V1/.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- `~/Documents/ZAO OS V1/.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`
- `~/Documents/ZAO OS V1/.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`
- `~/Documents/ZAO OS V1/.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
- `~/Documents/ZAO OS V1/.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
- `~/Documents/ZAO OS V1/.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`

**Overlap:** Each is a subskill (like autoresearch:debug, autoresearch:fix). They wrap GitNexus MCP capabilities with intent-routing.  
**Issue:** Users should invoke `/gitnexus` once with intent, not choose between 6 separate commands.  
**Action:**
1. Create a **master `/gitnexus` SKILL.md** at the parent directory level
2. Move intent detection logic from each subskill into the master
3. Each subcommand becomes a flag or inline config: `/gitnexus --mode debug` or inline `Mode: debugging`
4. Delete the 6 subskill files
5. Consolidate descriptions into single master skill

**Consolidation example:**
```
/gitnexus [--mode cli|debug|explore|guide|impact|refactor]
/gitnexus --mode debug
  Why does X fail?
```

---

## Overlap Analysis

### Conceptual Overlaps (Not Critical)

| Skill 1 | Skill 2 | Overlap | Verdict |
|---------|---------|---------|---------|
| `autoresearch` (global) | `zao-research` (global + project) | Both iterative loops; `zao-research` is ZAO-specific filtering + library focus | Keep both — complementary scopes |
| `morning` + `z` + `catchup` | Session startup trio | Each has distinct purpose (kickoff / status / recovery) | Keep all — different entry points |
| `socials` + `newsletter` | Content distribution | `newsletter` is daily journal; `socials` multiplexes to platforms | Keep both — different workflows |
| `big-win` | Quarterly win tracking | Standalone; no real overlap | Keep |
| `new-component` + `new-route` | Scaffolding pair | Narrow, distinct scopes (UI vs. API) | Keep both |
| `design-steal` | Brand guidance (brand-voice.md in skills/zao-os/) | Potential overlap if design-steal exists; unclear from empty SKILL.md | Requires clarification (see IMPROVE) |
| `gitnexus-*` (6 skills) | Each other | Massive redundancy — wrapper layer over same tool | Merge to 1 (see above) |

### Overlap with CLAUDE.md / Rules / Memory

**No problematic duplication found.** Skills appropriately layer on top of project rules:
- `.claude/rules/api-routes.md` + `/new-route` = complementary (rules are constraints, skill scaffolds)
- `.claude/rules/components.md` + `/new-component` = complementary
- Global `CLAUDE.md` + project skills = integrated, not redundant

---

## Freshness Check

| Skill | Last Modified | Tech Ref Status | Notes |
|-------|---------------|-----------------|-------|
| autoresearch | Apr 13, 2026 | Current | v1.7.3; references Karpathy pattern, ScheduleWakeup, Monitor |
| zao-research | Mar 28, 2026 | Current | Targets 319+ docs in research/; paths are absolute |
| gstack | Mar 20, 2026 | Current | Playwright + browser automation; version checks in preamble |
| graphify | Apr 8, 2026 | Current | Python graphify package; references pip install |
| clipboard | Apr 14, 2026 | Current | Browser-based; HTML template is modern |
| socials | Apr 14–Apr 19, 2026 | Current | Firefly + Paragraph integration; platform list up to date |
| newsletter | Apr 11, 2026 | Current | Paragraph (@thezao); Year of the ZABAL = 2026 context |
| zao-research (project) | Mar 28, 2026 | Current | Synced with global version; same paths |
| fishbowlz | Apr 5, 2026 | Stale | Last update 2 weeks ago; status changed to paused Apr 16 |
| gitnexus-* | Apr 11, 2026 | Current | GitNexus MCP; no version drift detected |
| worksession | Apr 16, 2026 | Current | Git worktree pattern; EnterWorktree tool references fresh |
| morning + z + reflect | Apr 2–Apr 7, 2026 | Current | Bash commands + gh CLI; patterns align |

**No critical staleness.** Most active last 2 weeks. fishbowlz is only concern (paused project state).

---

## Usage Frequency

**Note:** Scan output shows `use_7d: 0` and `use_30d: 0` across all skills (stocktake is fresh, no historical data). Treating 0 as "unknown" per instructions. Relative freshness of SKILL.md mtime files suggests:

- **High activity:** socials (Apr 19), worksession (Apr 16), newsletter (Apr 11), zao-research + gitnexus (Apr 11)
- **Moderate:** graphify (Apr 8), clipboard (Apr 14), gstack (Mar 20 — but has preamble auto-checks)
- **Low:** design-steal (Apr 5 — empty placeholder), fishbowlz (Apr 5 — paused)

---

## Verdict Counts

| Verdict | Count | Skills |
|---------|-------|--------|
| **Keep** | 20 | autoresearch, zao-research, gstack, graphify, clipboard, socials, big-win, worksession, morning, z, newsletter, catchup, check-env, fix-issue, inbox, lean, reflect, standup, vps, new-component, new-route |
| **Improve** | 2 | design-steal (empty), fishbowlz (paused status unclear) |
| **Update** | 0 | All tech refs are current |
| **Retire** | 0 | None recommend deletion outright |
| **Merge** | 1 | gitnexus (4 subskills → 1 master) |
| **Total** | 24 | — |

---

## Recommendations

### Immediate (This Week)

1. **design-steal:** Document the skill or delete the file. Current state (empty frontmatter) is confusing.
2. **fishbowlz:** Update SKILL.md with deprecation notice linking to memory doc (project_fishbowlz_deprecated.md), OR delete if truly abandoned.
3. **gitnexus:** Consolidate 4+ subskills into 1 master `/gitnexus` with `--mode` flag or inline config.

### Longer-Term (Next Month)

- Monitor `fishbowlz` partnership with Juke. If it ships, may want a separate skill for integration.
- Consider whether `design-steal` should be "design inspiration" and integrate with `/big-win` workflow (wins often inspire design directions).
- Periodically audit for new skills creeping in without context — 24 is sustainable; 40+ becomes noisy.

---

## Notes for the User

- **Overall health: Excellent.** 83% of skills are active, current, and well-scoped.
- **No critical overlaps.** Global and project skills layer cleanly.
- **Consolidation opportunity:** gitnexus subskills are a clear case for simplification.
- **Paused projects:** Deprecation notices (not deletion) are better for historical reference.
- **Empty placeholders:** design-steal should be either implemented or removed to reduce cognitive load.

The skill suite is mature and purpose-driven. With 3 small hygiene fixes, it's ready for another 6 months of active use.
