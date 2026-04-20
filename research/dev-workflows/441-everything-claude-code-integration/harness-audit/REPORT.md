### Harness Audit Report — ZAO OS

> **Date:** 2026-04-20
> **Tool:** `ecc harness-audit` (plugin v1.10.0)
> **Scope:** `repo` / consumer mode
> **Rubric:** `2026-03-30`

---

## Overall Score: 25/29 (86%)

| Category | Earned / Max | Score |
|----------|-------------|-------|
| Tool Coverage | 7 / 7 | 10/10 |
| Context Efficiency | 5 / 5 | 10/10 |
| Quality Gates | 7 / 7 | 10/10 |
| Memory Persistence | 0 / 2 | **0/10** |
| Eval Coverage | 0 / 2 | **0/10** |
| Security Guardrails | 6 / 6 | 10/10 |

**11 checks, 9 passing, 2 failing.**

---

## Passing Checks (9)

| Check | Path | Points |
|-------|------|--------|
| Everything Claude Code installed | `~/.claude/plugins/` | 4 |
| Project-specific harness overrides | `.claude/` | 3 |
| Explicit agent/instruction context | `AGENTS.md` | 3 |
| Local MCP or Claude settings | `.mcp.json` | 2 |
| Automated test entrypoint | `tests/` | 4 |
| CI workflows checked in | `.github/workflows/` | 3 |
| Security policy exposed | `SECURITY.md` | 2 |
| Secret env files ignored | `.gitignore` | 2 |
| Hook settings reference guardrails | `.claude/settings.json` | 2 |

---

## Failing Checks (2)

### 1. Memory Persistence — Missing `.claude/memory.md` or ADRs

**Path:** `.claude/memory.md` (or `docs/adr/`)
**Points lost:** 2

**Description:** Durable project memory or Architecture Decision Records aren't checked in.

**ZAO context:** Auto-memory at `~/.claude/projects/.../memory/` is user-scoped and private. The audit wants **project-level** durable context committed to the repo — something future sessions + agents can read without user-specific state.

**Fix options:**
- A. Add `.claude/memory.md` summarizing key architectural decisions + links to research docs.
- B. Add `docs/adr/` with ADRs per major module (XMTP, Spaces, agents, ENS subnames, Fractal, etc.). Pair with ECC `architecture-decision-records` skill.
- C. Both. A gives fast skimmable context, B gives per-decision detail.

Recommendation: C. Start with minimal `.claude/memory.md` now, build `docs/adr/` over time via `architecture-decision-records` skill.

### 2. Eval Coverage — Missing `evals/` dir

**Path:** `evals/`
**Points lost:** 2

**Description:** No eval fixtures for critical flows.

**ZAO context:** ZAO has Vitest tests under various `__tests__/` dirs, but no dedicated eval harness for probabilistic/agent flows (VAULT/BANKER/DEALER, ZOE replies, Composio AO). Unit tests != evals.

**Fix:** Create `evals/` with at least 1 eval fixture per high-value probabilistic flow:
- `evals/vault/` — VAULT agent strategy evals
- `evals/banker/` — BANKER PnL/latency evals
- `evals/dealer/` — DEALER trade windows
- `evals/zoe/` — ZOE response quality evals

Pair with ECC `eval-harness` skill (already enabled).

---

## Next Actions

1. Create `.claude/memory.md` with current architecture snapshot + research doc index (doc 441/442/448 pointers). **DONE 2026-04-20**
2. Create `evals/` scaffold with 1 example eval fixture per agent (VAULT/BANKER/DEALER/ZOE). **DONE 2026-04-20**
3. Re-run audit: expect 29/29. **DONE — 29/29 (see `audit-v2-29.txt`).**

## Follow-ups

- Populate `evals/**/*.eval.json` with 3 real scenarios per agent from production logs.
- Write eval runner (`evals/run.js`) — scoped dispatcher to ECC `eval-harness` skill.
- Add ADRs under `docs/adr/` as major modules ship (XMTP, Spaces, ENS subnames, Fractal).
- Re-run audit on every major repo change — aim to keep 29/29.

---

## Commands Used

```bash
cd ~/.claude/plugins/cache/everything-claude-code/everything-claude-code/1.10.0
CLAUDE_PLUGIN_ROOT=$(pwd) node scripts/harness-audit.js repo --format text --root "/path/to/ZAO OS V1"
CLAUDE_PLUGIN_ROOT=$(pwd) node scripts/harness-audit.js repo --format json --root "/path/to/ZAO OS V1"
```

(Slash command `/harness-audit` not tested yet — blocked by plugin bootstrap path detection.)
