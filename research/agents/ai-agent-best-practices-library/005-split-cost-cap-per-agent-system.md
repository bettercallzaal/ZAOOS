---
id: agent-005
category: deployment-ops
tier: core
severity: high
applies_to: [autonomous, multi-agent]
deprecated_since: null
sources: ["bot/src/hermes/runner.ts FLEET_DAILY_USD_CAP", doc-759 Q7]
---

## SPLIT the daily cost cap per agent-system so a runaway loop doesn't burn the whole budget

A single unified daily cost cap across all agents means a runaway loop on ONE agent (infinite retry, bad routing, sub-agent recursion) starves every other agent until UTC reset.

Split per-system attribution. If you have N agent surfaces (concierge, code-fix, research dispatch, etc.), give each its own cap. When one hits its cap, the others stay alive. The system-with-the-cap surfaces its hit-cap event to the operator via the usual escalation channel.

For ZAO's stack: $20 Hermes (code-fix) + $10 ZOE concierge + $20 worker dispatches = $50/day total. Hermes runs an in-process counter that resets at UTC midnight; the others should follow the same pattern.

### When NOT to do this

Solo experimentation with one agent on a closed laptop: skip the cap entirely or use a single soft alert. Caps are for shared infrastructure with cost accountability.

### Example

```typescript
// From bot/src/hermes/runner.ts
const FLEET_DAILY_USD_CAP = Number(process.env.HERMES_FLEET_DAILY_USD_CAP ?? '20');
let _todayUsdSpent = 0;
let _todayDateUtc = new Date().toISOString().slice(0, 10);

function fleetDailyGuard(notionalUsd: number): { ok: boolean; reason?: string } {
  const todayUtc = new Date().toISOString().slice(0, 10);
  if (todayUtc !== _todayDateUtc) {
    _todayDateUtc = todayUtc;
    _todayUsdSpent = 0;
  }
  if (_todayUsdSpent + notionalUsd > FLEET_DAILY_USD_CAP) {
    return { ok: false, reason: `fleet daily cap $${FLEET_DAILY_USD_CAP} would be exceeded` };
  }
  _todayUsdSpent += notionalUsd;
  return { ok: true };
}
```
