# ZAO OS Evals

> Eval fixtures for probabilistic / agent flows. Separate from Vitest unit tests (`src/**/__tests__/`). Unit tests verify deterministic code; evals score probabilistic outputs.

## Structure

```
evals/
├── vault/      VAULT agent strategy evals (safe-hold decisions)
├── banker/     BANKER PnL + latency evals (trade execution)
├── dealer/     DEALER market-making evals (liquidity windows)
├── zoe/        ZOE response quality evals (concierge, email triage)
└── _shared/    Shared fixtures + helpers
```

## Running

Uses ECC `eval-harness` skill (plugin-scoped as `everything-claude-code:eval-harness`).

Invoke via Claude:

```
Use ecc-eval-harness to run evals/vault/*.eval.json and score against baseline.
```

Or directly:

```bash
node evals/run.js --scope vault
```

(runner TBD — scaffold only right now)

## Eval Fixture Format

Each fixture = one JSON file:

```json
{
  "id": "vault-hold-decision-01",
  "description": "VAULT should hold when token price drops >15% in 1hr",
  "inputs": {
    "token": "ZABAL",
    "price_drop_1hr_pct": 18,
    "current_balance": 1000
  },
  "expected": {
    "action": "HOLD",
    "min_confidence": 0.75
  },
  "metric": "action == expected.action && confidence >= min_confidence"
}
```

## Conventions

- One `.eval.json` file per scenario.
- 3-10 scenarios per agent initially; grow from real logs.
- Prefix with scenario type: `hold-*`, `sell-*`, `edge-*` for VAULT.
- Record baseline scores in `_shared/baseline.json`.
- Re-score on each PR that touches `src/lib/agents/`.

## Status

**2026-04-20:** Scaffold created. Fixtures TBD.

Next: populate 3 fixtures per agent from production logs.
