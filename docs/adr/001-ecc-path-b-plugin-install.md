# ADR-001: ECC Path B — Full Plugin Install Over Cherry-Pick

**Status:** Accepted
**Date:** 2026-04-20
**Deciders:** Zaal + Claude (paired session)
**Tags:** dev-workflow, claude-code, harness

## Context

ZAO OS adopted `affaan-m/everything-claude-code` (ECC), a 183-skill / 48-agent / 79-command Claude Code plugin. We had two install paths:

- **Path A — manual cherry-pick:** copy individual `SKILL.md` / agent / command files from the ECC repo into `~/.claude/{skills,agents,commands}/` with an `ecc-` prefix. Initially picked 10 skills + 1 agent + 6 commands per doc 442 ranking.
- **Path B — full plugin install:** `extraKnownMarketplaces["everything-claude-code"]` + `enabledPlugins["everything-claude-code@everything-claude-code"]: true` in `~/.claude/settings.json`, then filter unwanted skills via `skillOverrides`.

Two days into Path A we hit hard ceilings:

1. **`continuous-learning-v2` cannot be cherry-picked.** Its `SKILL.md` has `agents/`, `hooks/`, `scripts/`, `config.json` siblings, and the hooks reference `scripts/lib/utils.js` at the ECC plugin root via `CLAUDE_PLUGIN_ROOT`. Manual port is large.
2. **`/checkpoint`, `/verify`, `/learn`, `/harness-audit`, `/evolve`, `/prune`, `/instinct-*` commands** all depend on the CL-v2 backend. Same blocker.
3. **Hook suite** (gateguard, governance-capture, config-protection, mcp-health-check, observe.sh) all live in a single `hooks.json` that requires the plugin bootstrap loader. Cherry-pick = port the loader = port half the plugin.

The instinct system is the marquee feature. Cherry-pick path forfeited it.

## Decision

**Switch to Path B.** Install ECC as a plugin via `~/.claude/settings.json`, then disable 163 of 183 skills via `skillOverrides` so the skill listing stays scoped to the 20 we actually want.

Concretely added to `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": { "source": "github", "repo": "affaan-m/everything-claude-code" }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  },
  "skillOverrides": {
    "everything-claude-code:django-patterns": "off",
    // ... 162 more entries
  }
}
```

Skills kept active (20):
- Daily: `continuous-learning-v2`, `verification-loop`, `security-review`, `eval-harness`, `nextjs-turbopack`, `postgres-patterns`, `database-migrations`, `hookify-rules`, `agent-introspection-debugging`, `skill-stocktake`
- Situational: `gateguard`, `rules-distill`, `architecture-decision-records`, `prompt-optimizer`, `canary-watch`, `deployment-patterns`, `mcp-server-patterns`, `content-hash-cache-pattern`, `strategic-compact`, `continuous-learning`

## Consequences

### Positive
- Unlocks `continuous-learning-v2` instinct system (session-to-session pattern capture).
- `/checkpoint`, `/verify`, `/learn`, `/harness-audit`, `/evolve`, `/prune`, `/instinct-*` all work natively.
- Full ECC hook suite active (gateguard, governance-capture, config-protection, mcp-health-check, observe).
- Upstream ECC updates flow through `git pull` on the marketplace clone — no per-skill maintenance.
- Provenance preserved: skills are namespaced as `everything-claude-code:<name>`, no ambiguity.

### Negative
- 48 ECC agents + 79 ECC commands load with no override mechanism (only skills are filterable). Manageable but adds noise to slash-command picker.
- ECC plugin's `silent-failure-hunter` agent isn't registered as a subagent (only ~40 of 48 agents exported by the plugin manifest). Workaround: `general-purpose` subagent with embedded persona prompt OR copy to `~/.claude/agents/` (registers next session start).
- ECC hooks fire pre-tool by default. Initial config used `pre:bash:dispatcher` as the disable id (wrong); real id is `pre:bash:gateguard-fact-force`. Cost a session of fact-forcing-gate friction before correction.
- `skillOverrides` key format isn't documented. We added BOTH `<skill-name>` and `everything-claude-code:<skill-name>` variants (326 entries total) to maximize the chance one bites. Wasted some context-window.

### Neutral
- ECC agents (48) include language reviewers (TS, Python, Go, etc.) that overlap with our existing patterns. Don't compete — different invocation paths.
- Plugin auto-installs MCPs (github, exa, memory, sequential-thinking) on top of our existing manual MCPs (context7, playwright, grep, notion, calendar). Total 9 MCPs — under ECC's recommended ≤10.

## Alternatives Considered

### A. Cherry-pick (initial path)
**Pros:** zero risk, easy rollback, no plugin name collision.
**Cons:** can't reach `continuous-learning-v2` or hook suite. Defeats the marquee value.
**Verdict:** rejected after 2 days of trying.

### C. Vendor as git submodule + symlink selected files
**Pros:** trackable upstream + selective.
**Cons:** adds submodule complexity to ZAO OS repo. Symlinks brittle across sessions/machines.
**Verdict:** rejected — too much per-machine setup.

### D. Wait for ECC to support partial install
**Pros:** would be ideal long-term.
**Cons:** no roadmap commitment from upstream. Blocks our use indefinitely.
**Verdict:** rejected — file an issue if needed but don't wait.

## References

- Research doc 441: `research/dev-workflows/441-everything-claude-code-integration/`
- Research doc 442: `research/dev-workflows/442-ecc-top-picks-zao-os/` (top-10 skill ranking)
- Research doc 448: `research/dev-workflows/448-ecc-skills-teaching-guide/` (per-artifact usage guide)
- ECC pinned SHA: `8bdf88e5ad8877bcd00a4aba7ccbfb50f235f10f`
- PR #225: Path B install + skillOverrides
- PR #228: harness-audit 29/29 + memory.md + evals scaffold

## Rollback

If Path B becomes untenable (skill collisions, hook noise, plugin breakage):

```bash
cp ~/.claude/settings.json.pre-path-b-2026-04-20 ~/.claude/settings.json
```

Then either re-do Path A cherry-picks OR remove ECC entirely.
