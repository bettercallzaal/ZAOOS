/**
 * Feature flags for the DreamNet tenant-organism layer.
 *
 * ALL default OFF. Stage 0 is a canary + reference implementation, never a
 * production rollout (spec sections 9, 18). Nothing in this module is wired
 * into a live route; the canary runs only when its flag is explicitly ON.
 */

/** Read a boolean env flag, default false. Any value other than "true" is OFF. */
function flag(name: string): boolean {
  return process.env[name] === 'true';
}

/** Master switch for the tenant-organism layer. Default OFF. */
export function isTenantLayerEnabled(): boolean {
  return flag('DREAMNET_TENANT_ENABLED');
}

/** The read-only Spore federation canary (spec section 9). Default OFF. */
export function isTenantCanaryEnabled(): boolean {
  return flag('DREAMNET_TENANT_CANARY_ENABLED');
}
