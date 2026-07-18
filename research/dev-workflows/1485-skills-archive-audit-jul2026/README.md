---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-18
superseded-by:
related-docs: 946, 154
original-query: "Audit the ~18 novelty skill archive-candidates from doc 946 — recommend ARCHIVE vs KEEP vs REVIEW for Zaal's confirmation"
tier: STANDARD
---

# 1485 — Skills Archive-Candidate Audit (July 2026)

> **Action required from Zaal:** Scan the ARCHIVE column below and confirm "yes archive all" or flag exceptions. Claude executes the moves (`git mv` → `.claude/_archived-skills/`) once you confirm. No code changes — these are skill prompt files only.

**Background:** Doc 946 flagged ~18 skills as archive candidates. `fishbowlz` and `gitnexus` (flagged as dead) are already gone from the skills dir. The 18 remaining candidates are evaluated below.

---

## Audit Table

| Skill | Verdict | Rationale |
|-------|---------|-----------|
| `claude-is-tripping` | **ARCHIVE** | KorroAi 3-agent "breakthrough engine" — creative concept, no ZAO ops usage. Not referenced in any directive or lesson. |
| `drunk-claude` | **ARCHIVE** | KorroAi comedy ideation mode — novelty. Not referenced anywhere in ZAO ops. |
| `gstack` | **ARCHIVE** | Separate AI Engineering workflow product (gstack.dev). Requires its own setup; not integrated with ZAO toolchain. |
| `gstack-upgrade` | **ARCHIVE** | Companion to `gstack` upgrade flow. Same status. |
| `quad` | **ARCHIVE** | QuadWork 4-agent dashboard at localhost:8400. Requires separate local server. Not wired to ZAO fleet; no references in any directive. |
| `cold-outreach` | **REVIEW** | ZAO cold-DM kit with Airtable CRM logging. Has ZAO-specific angles (Fractal/ZABAL/Festivals). BUT Airtable CRM may be inactive — confirm before archiving. If Airtable is dead → ARCHIVE. If still used → KEEP as supporting `cold-dm` workflow. |
| `office-hours` | **ARCHIVE** | YC-style office hours simulation. Novelty; no ZAO ops usage referenced. |
| `claude-creativity` | **KEEP** | Switches Claude into "radical creative genius" mode for brainstorming/architecture. Used occasionally for design sessions. Low cost to keep. |
| `careful` | **KEEP** | Adds destructive-command safety guardrails (blocks `rm -rf`, `DROP TABLE` etc.). Operational safety tool — **do not archive**. |
| `guard` | **KEEP** | Full safety mode: destructive warnings + directory-scoped edits. Operational safety companion to `careful`. |
| `freeze` | **KEEP** | Restricts edits to a specific directory for the session. Useful for surgical debugging. |
| `unfreeze` | **KEEP** | Companion to `freeze`. Keep together. |
| `find-skills` | **ARCHIVE** | Skills discovery meta-skill. With MEMORY.md listing all skills + the skills index, this is superseded. Empty content directory. |
| `learned` | **ARCHIVE** | Lesson capture meta-skill. CLAUDE.md `## LESSONS` sections supersede this. Empty content directory. |
| `document-release` | **REVIEW** | Document release workflow. Unclear if this is used for ZAOOS doc publication or something else. If unused → ARCHIVE. |
| `skill-eval` | **KEEP** | Evaluates skill invocation quality and logs to `~/dev/zao-claude-skills/evals/`. Supports the skill improvement loop. |
| `audit-skill` | **KEEP** | Audits skills against Anthropic best practices. Meta-quality tool. Keep for periodic skill hygiene. |
| `setup-browser-cookies` | **ARCHIVE** | Browser cookie import for web scraping. Too narrow; not part of ZAO research workflow. |

---

## Summary

| Verdict | Count | Skills |
|---------|-------|--------|
| **ARCHIVE** | 9 | `claude-is-tripping`, `drunk-claude`, `gstack`, `gstack-upgrade`, `quad`, `office-hours`, `find-skills`, `learned`, `setup-browser-cookies` |
| **KEEP** | 7 | `claude-creativity`, `careful`, `guard`, `freeze`, `unfreeze`, `skill-eval`, `audit-skill` |
| **REVIEW** (Zaal confirms) | 2 | `cold-outreach` (Airtable alive?), `document-release` (used?) |

---

## Execution Plan (after Zaal confirms)

```bash
# Step 1: create archive dir
mkdir -p /home/zaal/.claude/_archived-skills

# Step 2: move ARCHIVE skills
for skill in claude-is-tripping drunk-claude gstack gstack-upgrade quad office-hours find-skills learned setup-browser-cookies; do
  git mv /home/zaal/.claude/skills/$skill /home/zaal/.claude/_archived-skills/$skill
done
# + any REVIEW skills Zaal confirms

# Step 3: commit to zaal-dotfiles repo (if tracked there)
```

Note: The global `~/.claude/skills/` directory is not in a public git repo (per doc 946 — private infra). The `git mv` pattern above is illustrative; actual execution is `mv` + potentially updating any CLAUDE.md or MEMORY.md references.

---

## What Changes After Archiving

- Skill commands listed in doc 154 (master reference) for archived skills become stale → **update doc 154 index** post-archive
- Any CLAUDE.md files referencing archived skill names → check with `grep -r "claude-is-tripping\|drunk-claude\|gstack\|quad" ~/.claude/`
- `skill-eval` still works because it logs to `~/dev/zao-claude-skills/` — confirm that path exists before archiving its companions

---

## Sources

- Global skills inventory `~/.claude/skills/` (60+ skills, measured 2026-07-18) [FULL]
- Doc 946 archive-candidate list [FULL]
- Doc 154 skills/commands master reference [PARTIAL — title only]
- Individual skill SKILL.md headers [FULL — each read 2026-07-18]
