# src/lib/dreamnet - flags and how they are switched

The DreamNet tenant layer and Proof Drops, built to Brandon Ducar's DreamNet
(Spore) spec. Everything here is flag-gated and **defaults OFF**: a flag is ON
only when its env var is the exact string `true`.

| Env var | Read at | What it gates | Wired into a live path? |
|---|---|---|---|
| `DREAMNET_TENANT_ENABLED` | `tenant/flags.ts` `isTenantLayerEnabled()` | master switch for the tenant-organism layer | No. As of 2026-10-06 nothing outside `src/lib/dreamnet` calls it |
| `DREAMNET_TENANT_CANARY_ENABLED` | `tenant/flags.ts` `isTenantCanaryEnabled()` | the read-only Spore federation canary (`tenant/canary.ts`) | The canary runs only when called; no route or cron calls it today |
| `DREAMNET_PROOF_DROPS_ENABLED` | `proof-drop/proof-drop.ts` `isProofDropsEnabled()` | Proof Drops (claim plus quotable evidence) | No caller outside this directory |

## Switching them on

Zaal ruled on 2026-10-06 to switch the tenant flags on ("switch it on adn then
close", both switches; vault `decisions/grill-2026-10-06-dreamnet-evening.md`,
item 4, board card 9076).

Setting an env var is a deploy-environment change, so it is Zaal's step, not a
code change:

1. In the Vercel project for ZAOOS, add `DREAMNET_TENANT_ENABLED=true` and
   `DREAMNET_TENANT_CANARY_ENABLED=true` (Production, and Preview if wanted).
2. Redeploy so the new values are read.
3. Verify with the deployed app's env listing (`vercel env ls`), not with this
   file.

**What to expect:** no behaviour change yet. The flags are read by functions
that no live route calls, so "on" only makes the layer reachable for the code
that will be wired to it next. Do not read a set flag as "the tenant layer is
running" (`.claude/rules/state-claims.md`: merged is not running, and a flag
that is ON proves the code is reachable, not that it was reached).

**Rollback:** remove the two env vars and redeploy. Nothing persists.

## Related

- Research: `research/agents/2622-dreamnet-hardening-phase0-ground-truth-and-verification/` (section D).
- The ZOE half of the same ruling (`ZOE_REPO_IMPROVER_LEASES` on the VPS) is a
  live-bot change and is not made from this repo.
