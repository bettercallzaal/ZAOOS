# 170 — Autoresearch 10x: Binary Eval Checklists for ZAO OS Skills

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Deep dive into Ole Lehmann's autoresearch method, compare with ZAO's installed autoresearch skill, design ready-to-use eval checklists for ZAO's top 5 skills

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Don't switch repos** | Keep `uditgoenka/autoresearch` v1.7.3 (8 subcommands, guard mechanism, crash recovery). Lehmann's is simpler (2 files) but lacks subcommands we already use. |
| **Steal the eval-guide** | Copy Lehmann's `eval-guide.md` into `.claude/skills/autoresearch/references/` — it's the best standalone resource for designing binary evals. |
| **Steal the dashboard** | Lehmann's `dashboard.html` (Chart.js + auto-refresh) is a nice addition for visibility. Our TSV logging already supports this — just needs the HTML wrapper. |
| **Write eval checklists NOW** | This doc includes ready-to-use eval checklists for 5 ZAO skills. Run `/autoresearch` on each to get measurable improvement. |
| **First target** | `/zao-research` — most-used, highest ROI, already has a manual 8-item checklist that can be converted to binary evals. |

---

## What's Different: Lehmann vs ZAO's Installed Autoresearch

### Repo Comparison

| Feature | `uditgoenka/autoresearch` (ZAO's) | `olelehmann100kMRR/autoresearch-skill` |
|---------|-----------------------------------|-----------------------------------------|
| **Version** | v1.7.3 → v1.8.2 available | v1.0 (single commit) |
| **Stars** | 2,600 | 747 |
| **License** | MIT | Not specified |
| **Files** | SKILL.md + 11 reference docs | SKILL.md + eval-guide.md |
| **Subcommands** | 8 (plan, debug, fix, security, ship, scenario, predict, learn) | 0 (just the core loop) |
| **Guard mechanism** | Yes (dual verify + guard) | No |
| **Crash recovery** | Yes (syntax → fix, runtime → 3 retries, hang → revert) | No |
| **Dashboard** | TSV results logging (no HTML) | **dashboard.html** (Chart.js, auto-refresh 10s) |
| **Eval guide** | Embedded in core-principles.md | **Standalone eval-guide.md** |
| **Changelog** | In results log | **Separate changelog.md** with mutation reasoning |
| **Output folder** | Results in working directory | `autoresearch-[skill-name]/` subfolder |

### What Lehmann Adds That We Should Adopt

1. **`eval-guide.md`** — Standalone resource for designing binary evals. Better organized than our core-principles.md section. Copy it.

2. **`dashboard.html`** — Self-contained HTML with Chart.js that reads from `results.json` and auto-refreshes every 10 seconds. Shows: score over time, pass/fail per eval, mutation log. Our TSV logs have the data — we just need the display layer.

3. **`changelog.md`** — Separate file documenting every mutation attempt with: what was changed, why, whether it improved things, and what was reverted. More readable than a TSV row.

4. **Output folder convention** — `autoresearch-[skill-name]/` keeps all artifacts organized per skill. Prevents results from different skills mixing together.

### What We Already Have That's Better

1. **8 subcommands** — Lehmann's skill only does the core loop. Ours has debug, fix, security, ship, scenario, predict. Keep these.
2. **Guard mechanism** — Prevents regressions by running a second verification check. Critical for skills that touch the research library.
3. **Crash recovery** — Automatic handling of syntax errors, runtime failures, and hangs.
4. **Git integration** — Full Phase 0 precondition checks, experiment commits, automatic rollback.

---

## The Eval Guide: Core Patterns (from Lehmann + MindStudio + Community)

### The 3 Rules of Binary Evals

| Rule | Why |
|------|-----|
| **1. Every eval is yes/no** | Eliminates scoring variance. Different models score identically. |
| **2. 3-6 evals per skill** | Below 3: agent finds loopholes. Above 6: agent games the checklist. |
| **3. Include at least 1 negative check** | "Is it free of X?" catches the most common failure modes. |

### Good vs Bad Evals

| Bad (subjective, vague) | Good (binary, specific) |
|------------------------|------------------------|
| "Is the output high quality?" | "Does the output include a specific number or metric?" |
| "Rate professionalism 1-10" | "Is the output free of buzzwords from this list: [list]?" |
| "Does it look good?" | "Does the output start with an actionable recommendation?" |
| "Is it engaging?" | "Is the total output under 200 words?" |

### Validation: 3 Questions Before Finalizing an Eval

1. **Would different agents score identically?** → If no, the eval is too subjective.
2. **Can the skill game it without improving?** → If yes, the eval is too narrow.
3. **Does it matter to actual outcomes?** → If no, remove it — it's noise.

---

## Ready-to-Use Eval Checklists for ZAO OS Skills

### 1. `/zao-research` — Research Skill

**Test inputs:** "Research WebRTC audio rooms for ZAO", "Research ENS subnames for community naming", "Research AI moderation tools"

| # | Eval Question | Catches |
|---|--------------|---------|
| 1 | Are recommendations/key decisions in the first section of the output? | Buried insights |
| 2 | Does the doc reference at least one specific ZAO OS file path (e.g., `src/app/api/...`)? | Generic research |
| 3 | Does the doc include at least 3 specific numbers (versions, prices, dates, stats)? | Vague claims |
| 4 | Does the doc include a Sources section with at least 2 URLs? | Unsourced assertions |
| 5 | Does the doc include a comparison table with 3+ options? | Missing alternatives |
| 6 | Is the doc free of phrases like "consider using", "it might be worth", "you could explore"? | Vague recommendations |

**Baseline estimate:** ~65% (the skill is already good but occasionally produces generic research or buries recommendations).

### 2. `/new-component` — Component Scaffolding

**Test inputs:** "music/TrackCard", "governance/ProposalVote", "social/MemberBadge"

| # | Eval Question | Catches |
|---|--------------|---------|
| 1 | Does the output include `"use client"` directive? | Missing client directive |
| 2 | Does the output use `bg-[#0a1628]` or reference the dark theme colors? | Wrong theme |
| 3 | Does the output use `@/` import alias (not relative paths)? | Wrong import style |
| 4 | Does the output include a TypeScript interface for props? | Missing type safety |
| 5 | Does the output include at least one Tailwind responsive prefix (`sm:`, `md:`, or `lg:`)? | Not mobile-first |

**Baseline estimate:** ~80% (template is solid but responsive prefixes and theme colors sometimes drift).

### 3. `/new-route` — API Route Scaffolding

**Test inputs:** "music/favorites", "governance/vote", "admin/settings"

| # | Eval Question | Catches |
|---|--------------|---------|
| 1 | Does the output import and use `z` from `zod` with `safeParse`? | Missing validation |
| 2 | Does the output check `session?.fid` and return 401 if missing? | Missing auth |
| 3 | Does the output wrap the handler body in try/catch? | Missing error handling |
| 4 | Does the output use `NextResponse.json()` for all responses? | Wrong response type |
| 5 | Is the output free of any env var values (no hardcoded keys/secrets)? | Security violation |

**Baseline estimate:** ~90% (template is very structured, but edge cases like GET routes sometimes skip auth).

### 4. `/standup` — Build-in-Public Notes

**Test inputs:** Run on 3 different days with different recent commit histories.

| # | Eval Question | Catches |
|---|--------------|---------|
| 1 | Does the output reference specific features or files from recent commits? | Generic updates |
| 2 | Is the output under 280 characters (tweetable)? | Too long for social |
| 3 | Does the output include at least one specific metric (commits, files changed, etc.)? | No concrete details |
| 4 | Is the output free of technical jargon that a non-developer wouldn't understand? | Not audience-appropriate |

**Baseline estimate:** ~60% (standup notes tend to be too technical and too long for social posting).

### 5. `/catchup` — Session Context Restore

**Test inputs:** Run at start of 3 different sessions with varying git states.

| # | Eval Question | Catches |
|---|--------------|---------|
| 1 | Does the output list specific files that were recently modified? | Missing context |
| 2 | Does the output mention the current git branch? | Missing branch context |
| 3 | Does the output surface any in-progress work or TODOs? | Missed continuity |
| 4 | Is the output under 500 words? | Too verbose for a quick catchup |

**Baseline estimate:** ~70% (sometimes misses in-progress work or is too verbose).

---

## How to Run Autoresearch on a ZAO Skill

### Quick Start (using our installed autoresearch)

```
/autoresearch
Goal: Improve the /zao-research skill to pass all 6 eval criteria consistently
Scope: .claude/skills/zao-research/SKILL.md
Metric: % of evals passing across 5 test runs
Direction: Analyze failing evals, make one targeted mutation per iteration
Verify: Run skill on 3 test inputs, score against the 6 binary evals
```

### Expected Timeline

| Skill | Est. Baseline | Target | Est. Iterations |
|-------|--------------|--------|-----------------|
| `/zao-research` | 65% | 90%+ | 4-6 |
| `/new-component` | 80% | 95%+ | 2-3 |
| `/new-route` | 90% | 98%+ | 1-2 |
| `/standup` | 60% | 85%+ | 4-6 |
| `/catchup` | 70% | 90%+ | 3-4 |

### Cost Estimate

Each iteration: ~5 skill runs × ~$0.02-0.05/run = $0.10-0.25/iteration. Total for all 5 skills: ~$5-15 in API costs.

---

## Upgrade Path: What to Update in ZAO's Autoresearch

### Priority 1: Add eval-guide.md (copy from Lehmann)

```bash
# Save as reference file alongside our existing references
cp eval-guide.md .claude/skills/autoresearch/references/eval-guide.md
```

This gives a standalone resource for designing evals without reading the full SKILL.md.

### Priority 2: Add dashboard output

Modify the results-logging reference to also emit a `dashboard.html` file. The pattern (from Lehmann's skill):

```
Output files in autoresearch-[skill-name]/:
├── dashboard.html    ← Chart.js line chart, auto-refreshes from results.json
├── results.json      ← Machine-readable experiment data
├── results.tsv       ← Human-readable score log (already exists in our version)
├── changelog.md      ← Mutation reasoning (new)
└── SKILL.md.baseline ← Original skill backup (already exists in our version)
```

### Priority 3: Update version

Our installed version is v1.7.3. Latest `uditgoenka/autoresearch` is v1.8.2 with `/autoresearch:learn` (documentation engine). Update when convenient:

```bash
# Backup current
cp -r .claude/skills/autoresearch/ .claude/skills/autoresearch.bak/

# Update from latest
git clone https://github.com/uditgoenka/autoresearch.git /tmp/autoresearch-update
cp -r /tmp/autoresearch-update/claude-plugin/skills/autoresearch/ .claude/skills/autoresearch/
rm -rf /tmp/autoresearch-update
```

---

## Community Landscape: Autoresearch Ecosystem (March 2026)

| Project | Stars | Focus | License |
|---------|-------|-------|---------|
| [karpathy/autoresearch](https://github.com/karpathy/autoresearch) | 42K+ | Original ML experiment loop (630 lines) | MIT |
| [uditgoenka/autoresearch](https://github.com/uditgoenka/autoresearch) | 2,600 | Full Claude Code skill (8 subcommands) — **ZAO's installed version** | MIT |
| [olelehmann100kMRR/autoresearch-skill](https://github.com/olelehmann100kMRR/autoresearch-skill) | 747 | Minimal skill + eval-guide + dashboard | Not specified |
| [drivelineresearch/autoresearch-claude-code](https://github.com/drivelineresearch/autoresearch-claude-code) | ~200 | ML-focused port with JSONL logging | MIT |
| [wanshuiyin/ARIS](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) | ~150 | Cross-model research, Markdown-only | MIT |
| [proyecto26/autoresearch-ai-plugin](https://github.com/proyecto26/autoresearch-ai-plugin) | ~100 | Claude Code plugin marketplace distribution | MIT |
| [Orchestra-Research/AI-Research-SKILLs](https://github.com/Orchestra-Research/AI-research-SKILLs) | ~300 | Comprehensive AI research skills library | Open source |

### Key Community Results

| Who | Skill Type | Before | After | Iterations | Cost |
|-----|-----------|--------|-------|------------|------|
| Ole Lehmann | Landing page copy | 56% | 92% | 4 | ~$1 |
| Ole Lehmann | Fundraising pitch | 70% | 94% | N/S | N/S |
| Ole Lehmann | Sales MEDDIC | 65% | 91% | N/S | N/S |
| MindStudio (blog) | Diagram generation | 80% | 97.5% | 50 | ~$10 |
| Community (Substack) | General prompts | 40-50% | 75-85% | 30-50 overnight | ~$5-15 |

---

## Cross-Reference with Existing Research

| Doc | Relationship |
|-----|-------------|
| [Doc 62 — Autoresearch: Skill Improvement](../../_archive/062-autoresearch-skill-improvement/) | Core loop documentation. Doc 170 adds ZAO-specific eval checklists and Lehmann comparison. |
| [Doc 63 — Autoresearch Deep Dive](../../dev-workflows/063-autoresearch-deep-dive-zao-applications/) | 7 ZAO use cases. Doc 170 adds concrete eval checklists for 5 skills with baselines. |
| [Doc 164 — Skills/Research Workflow Improvements](../../dev-workflows/164-skills-research-workflow-improvements/) | Skill improvement goals. Doc 170 provides the eval framework to measure improvement. |
| [Doc 168 — Community Innovations](../../dev-workflows/168-claude-code-community-innovations-march2026/) | Brief Lehmann summary. Doc 170 is the deep dive with actionable checklists. |
| [Doc 154 — Skills & Commands Master Reference](../../dev-workflows/154-skills-commands-master-reference/) | Full skill inventory. Doc 170 prioritizes which 5 skills to autoresearch first. |

---

## Codebase State

| Item | Status |
|------|--------|
| Autoresearch skill installed | Yes — `.claude/skills/autoresearch/SKILL.md` v1.7.3 |
| 8 subcommands available | Yes — `/autoresearch`, `:plan`, `:debug`, `:fix`, `:security`, `:ship`, `:scenario`, `:predict` |
| 11 reference files | Yes — in `.claude/skills/autoresearch/references/` |
| eval-guide.md | **Missing** — should copy from Lehmann's repo |
| Dashboard output | **Missing** — TSV logging exists, no HTML visualization |
| Eval checklists for ZAO skills | **Missing** — this doc provides 5 ready-to-use checklists |
| ZAO project skills | 8 custom skills in `.claude/skills/` (catchup, new-route, new-component, fix-issue, check-env, standup, zao-research, autoresearch) |

---

## Sources

- [Ole Lehmann — "How to 10x your Claude Skills"](https://x.com/itsolelehmann/status/2033919415771713715) — March 17, 2026 (5.2K likes, 2.4M views)
- [olelehmann100kMRR/autoresearch-skill](https://github.com/olelehmann100kMRR/autoresearch-skill) — 747 stars, SKILL.md + eval-guide.md
- [uditgoenka/autoresearch](https://github.com/uditgoenka/autoresearch) — 2,600 stars, MIT, v1.8.2
- [MindStudio — AutoResearch Eval Loop: Binary Tests](https://www.mindstudio.ai/blog/autoresearch-eval-loop-binary-tests-claude-code-skills)
- [MindStudio — Self-Improving AI Skills](https://www.mindstudio.ai/blog/claude-code-autoresearch-self-improving-skills)
- [Sid Saladi — Autoresearch 101 Builder's Playbook](https://sidsaladi.substack.com/p/autoresearch-101-builders-playbook)
- [Linas Substack — 10X Your Claude Skills](https://linas.substack.com/p/10xclaudeskills)
- [Karpathy/autoresearch](https://github.com/karpathy/autoresearch) — MIT, original implementation

---

## Quality Checklist

- [x] Recommendations/key decisions at the top
- [x] Specific to ZAO OS (5 skill-specific eval checklists with file paths and baselines)
- [x] Numbers, versions, and dates included (v1.7.3 vs v1.8.2, 747 vs 2600 stars, $5-15 cost)
- [x] Sources linked at the bottom with URLs
- [x] Cross-referenced with existing research (docs 62, 63, 154, 164, 168)
- [x] Actionable (ready-to-run eval checklists, upgrade commands, copy instructions)
- [x] Open-source code searched (7 repos compared, Lehmann skill analyzed)
- [x] Reference implementations documented with repo, license, and key patterns

**Score: 8/8**
