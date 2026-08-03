# Onboarding a new organism (the reusable kit)

> Spec deliverable: "provision a second organism from configuration alone." This
> guide + the code in `src/lib/dreamnet/tenant/` (onboarding.ts, conformance.ts)
> make a new tenant a config change, not a fork. Proven by `tenants/acme/` +
> `__tests__/onboarding.test.ts` (a second organism, ZAO-isolated, from config alone).

## The whole process (3 steps, no framework change)

1. **Add a tenant profile** at `tenants/<name>/profile.ts`. Copy `tenants/acme/profile.ts`,
   change the id + identity. Namespaces come from `canonicalTenantPrefixes(<id>)` - do not
   hand-write them (that is how drift + isolation bugs start). Sovereignty flags must all be
   `true`. Status may be at most `CANARY_APPROVED` in Stage 0.

2. **Onboard it** through the kit:
   ```ts
   import { onboardTenant } from '@/lib/dreamnet/tenant';
   const result = await onboardTenant({ manifest, allowedPrefixes }, new Date().toISOString());
   // result.onboarded === true only if the conformance suite fully passes
   ```
   `onboardTenant` runs the conformance suite and provisions ONLY on a full pass. A profile
   that surrenders sovereignty, drifts its namespaces, or fails the canary is refused - nothing
   is provisioned (fail closed).

3. **That is it.** No change to the gateway or the framework. Swap config + identity and a
   third organism onboards the same way.

## What conformance checks (the gate)

`runTenantConformance` runs six checks, all must pass:

1. manifest valid + sovereign (every ownership flag true)
2. status within Stage 0 (<= CANARY_APPROVED)
3. namespaces are the canonical, tenant-scoped set (no drift, no wildcards)
4. namespace isolation (own namespace allowed; every forbidden root rejected)
5. export gate blocks a secret (fail-closed behavior present)
6. read-only Spore canary round-trips to ACCEPTED

## Isolation guarantee

Each tenant's allowed prefixes are tenant-scoped (they contain the tenant id), so one
tenant's set can never cover another tenant's subjects. Acme cannot reach `spore.zaal.*`
and ZAO cannot reach `spore.acme.*` - verified in the onboarding test.

## Offboarding / rollback

```ts
import { offboardTenant } from '@/lib/dreamnet/tenant';
const record = offboardTenant({ manifest, allowedPrefixes });
// revokes the tenant's namespaces + surfaces operator pause/revoke/rollback refs.
// Receipts are PRESERVED (never erased).
```

## What is still DreamNet's side

The live Federation Gateway. This kit is the tenant-side framework + conformance + an
in-memory boundary. Wiring a tenant to the real gateway is Stage 1 and needs a
quorum-approved commit (spec section 18). Nothing here deploys.
