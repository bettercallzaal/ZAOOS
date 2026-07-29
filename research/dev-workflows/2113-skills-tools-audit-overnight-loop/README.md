---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-07-28
related-docs: 2103, 2104, 154
original-query: "Zaal: let's also look at all our skills and tool use over night in a loop."
tier: DEEP
---

# 2113 - Skills + tool-use audit (overnight loop) - the surface is healthy

> **Goal:** Audit the full skill + fleet-tool inventory for redundancy/staleness/gaps. Headline: the surface is large but healthy - and the audit itself became a live demonstration of why you verify agent findings before acting.

## The verified bottom line

ZAO has **~51 skills + ~45 fleet tools** - a large surface. But after verification, it is **well-documented and mostly non-redundant.** The real cleanup is tiny (2 missing descriptions, 1 incomplete skill, 1 archived tool - see below). There is **no consolidation project needed.** The feeling of "too many skills" is a *discoverability* problem (which `find-skills` / `audit-skill` already address), not a redundancy problem.

## The meta-lesson (the most valuable finding)

Pass 1 was a general-purpose agent inventorying every skill + tool. Its headline findings were **overstated, and verification cut them down hard** - exactly the discipline in doc 2103, applied to this loop's own output:

| Agent claimed | Verified reality |
|---|---|
| "24 skills missing descriptions" | **2** (`agenda`, `icm`) - off by 12x |
| "/ship has a blank description" | False - it has a full multi-line description |
| "zao-research is stale / references decommissioned surfaces" | It works fine (used all night); 6 mentions are in the excluded-repos list, not broken workflow |
| "browse and gstack are identical / possible dupe" | Plausible but unverified - left as "possible", not acted on |

Had I written fixes off the agent's report, I'd have "fixed" ~24 phantom problems. **This is the case for never shipping off an unverified agent audit** - it belongs in the anti-fabrication rules as a worked example.

## What's actually real (and mostly done)

- **2 skills lack a `description:` line:** `agenda`, `icm`. (Real, tiny - fill them.)
- **`learned` has no SKILL.md file** (dir exists, not wired as a skill); `zao-os` / `zao-stock` similarly incomplete. Complete or remove.
- **`zao-focus-terminal.sh` was retired-but-still-in-`~/bin/`** - **ARCHIVED this pass** to `~/.zao/retired/` (it triggered the macOS Automation prompt, feedback_osascript_terminal_focus_dead_end).
- **The `zao-ask*` cluster (6 tools: ask, ask-dm, ask-check, ask-wait, ask-bump, ask-chain)** is a coherent async-approval pipeline with poor discoverability - a thin `/zao-ask` wrapper skill would help. Nice-to-have, not urgent.

## What is NOT a problem (verified reassuring)

The skills that *look* redundant are complementary, not dupes:
- `qa` (test + fix) vs `qa-only` (report only) - intentional split.
- `plan-ceo-review` / `plan-eng-review` / `plan-design-review` - role-specific lenses.
- `reflect` (daily) vs `retro` (weekly) - different cadences.
- `morning` (kickoff) vs standup (public update) - different phases.

So the instinct to "consolidate the sprawl" would have *destroyed* useful distinctions. The breadth is a feature; the fix is discoverability, not deletion.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fill the 2 missing skill descriptions (`agenda`, `icm`) | @Zaal (ZOE) | PR | 2026-08-08 |
| Complete or remove the incomplete skill dirs (`learned`, `zao-os`, `zao-stock`) | @Zaal | Decision | 2026-08-08 |
| Add a worked "verify agent audits" example (this doc) to `.claude/rules/anti-fabrication.md` | @Zaal | PR | 2026-08-08 |
| (Optional) a thin `/zao-ask` wrapper skill over the 6 ask-* tools for discoverability | @Zaal | PR | wontfix (nice-to-have) |

## Also See

- [Doc 2103](../../agents/2103-grounding-beats-guessing/) - grounding beats guessing (this audit is a live instance)
- [Doc 2104](../../agents/2104-fleet-coordination-deep-audit/) - the fleet-tool half of the surface
- [Doc 154](../154-skills-commands-master-reference/) - the skills/commands master reference

## Sources

- First-party, verified live 2026-07-28: direct file checks on `~/.claude/skills/*/SKILL.md` (description-count: 2 missing, not 24), `~/bin/` (archived zao-focus-terminal.sh), `/ship` SKILL.md (has description), `zao-research` SKILL.md (works, 6 excluded-repo refs). Pass-1 agent inventory cross-checked, overstatements corrected. [FULL]
