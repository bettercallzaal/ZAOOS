/**
 * ControlPlane - the registry + discovery engine.
 *
 * Organs register, then heartbeat to keep their record fresh. The plane answers
 * the organism's standing questions: what organs exist, which are healthy vs
 * degraded, what capabilities are available and who provides them, and what
 * each organ depends on. It is discovery + health rollup, not execution - it
 * never runs a workload (that is the Spine) and never holds a secret value
 * (only references).
 *
 * Pure in-memory state + injectable clock, so it is fully testable.
 */

import type {
  OrganRegistration,
  OrganRecord,
  OrganStatus,
  Capability,
  CapabilityListing,
  SecretRef,
  HealthReport,
} from './types';

export class ControlPlaneError extends Error {}

function validate(reg: OrganRegistration): void {
  if (!reg.organId?.trim()) throw new ControlPlaneError('organId required');
  if (!reg.version) throw new ControlPlaneError(`${reg.organId}: version required`);
  if (!['edge', 'core', 'data', 'observability'].includes(reg.layer)) throw new ControlPlaneError(`${reg.organId}: bad layer`);
  // Secrets must be references, never values - reject anything that looks like a value.
  for (const s of reg.secrets ?? []) {
    if (!s.key || !['env', 'vault', 'manager'].includes(s.source)) throw new ControlPlaneError(`${reg.organId}: secret must be a reference {key, source}`);
  }
}

export interface ControlPlaneOptions {
  /** How long without a heartbeat before an organ is marked stale (unknown). */
  livenessTtlMs?: number;
  now?: () => string;
}

export class ControlPlane {
  private organs = new Map<string, OrganRecord>();
  private readonly ttlMs: number;
  private readonly now: () => string;

  constructor(opts: ControlPlaneOptions = {}) {
    this.ttlMs = opts.livenessTtlMs ?? 90_000;
    this.now = opts.now ?? (() => new Date().toISOString());
  }

  /** Register (or re-register) an organ. Idempotent by organId. */
  register(reg: OrganRegistration): OrganRecord {
    validate(reg);
    const t = this.now();
    const record: OrganRecord = { ...reg, registeredAt: t, lastHeartbeatAt: t, stale: false };
    this.organs.set(reg.organId, record);
    return record;
  }

  deregister(organId: string): boolean {
    return this.organs.delete(organId);
  }

  /**
   * An organ heartbeats to publish fresh health/metrics/status (and optionally
   * updated capabilities). Keeps its record live. Returns false if unknown.
   */
  heartbeat(organId: string, health: HealthReport, capabilities?: Capability[]): boolean {
    const rec = this.organs.get(organId);
    if (!rec) return false;
    rec.health = health;
    rec.lastHeartbeatAt = this.now();
    rec.stale = false;
    if (capabilities) rec.capabilities = capabilities;
    return true;
  }

  private effectiveStatus(rec: OrganRecord, nowMs: number): OrganStatus {
    if (nowMs - new Date(rec.lastHeartbeatAt).getTime() > this.ttlMs) return 'unknown';
    return rec.health.status;
  }

  /** Refresh staleness against the clock; returns organs that just went stale. */
  reapStale(): string[] {
    const nowMs = new Date(this.now()).getTime();
    const wentStale: string[] = [];
    for (const rec of this.organs.values()) {
      const stale = nowMs - new Date(rec.lastHeartbeatAt).getTime() > this.ttlMs;
      if (stale && !rec.stale) wentStale.push(rec.organId);
      rec.stale = stale;
    }
    return wentStale;
  }

  get(organId: string): OrganRecord | undefined {
    return this.organs.get(organId);
  }

  /** Every organ + its effective status (heartbeat-aware). */
  list(): Array<OrganRecord & { effectiveStatus: OrganStatus }> {
    const nowMs = new Date(this.now()).getTime();
    return [...this.organs.values()].map((r) => ({ ...r, effectiveStatus: this.effectiveStatus(r, nowMs) }));
  }

  /** Organs whose effective status is healthy. */
  healthy(): OrganRecord[] {
    return this.list().filter((r) => r.effectiveStatus === 'healthy');
  }

  /** Organs that need attention (degraded/failing/unknown). */
  degraded(): Array<OrganRecord & { effectiveStatus: OrganStatus }> {
    return this.list().filter((r) => ['degraded', 'failing', 'unknown'].includes(r.effectiveStatus));
  }

  /**
   * The Capability Registry: who can do what, right now. Only providers whose
   * effective status is healthy or degraded are listed as usable providers
   * (a failing/unknown organ is not offered as a provider).
   */
  capabilities(): CapabilityListing[] {
    const nowMs = new Date(this.now()).getTime();
    const map = new Map<string, CapabilityListing>();
    for (const rec of this.organs.values()) {
      const status = this.effectiveStatus(rec, nowMs);
      for (const cap of rec.capabilities) {
        const listing = map.get(cap.name) ?? { name: cap.name, providers: [] };
        listing.providers.push({ organId: rec.organId, version: cap.version, status, maxConcurrency: cap.maxConcurrency });
        map.set(cap.name, listing);
      }
    }
    return [...map.values()];
  }

  /** Discovery: usable providers of a capability (healthy first, failing/unknown excluded). */
  discover(capabilityName: string): CapabilityListing['providers'] {
    const listing = this.capabilities().find((c) => c.name === capabilityName);
    if (!listing) return [];
    const rank = (s: OrganStatus) => (s === 'healthy' ? 0 : s === 'degraded' ? 1 : 2);
    return listing.providers.filter((p) => p.status === 'healthy' || p.status === 'degraded').sort((a, b) => rank(a.status) - rank(b.status));
  }

  /** Version registry: organId -> version. */
  versions(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const rec of this.organs.values()) out[rec.organId] = rec.version;
    return out;
  }

  /** Dependency check: does every declared dependency exist + is it usable? */
  unmetDependencies(organId: string): string[] {
    const rec = this.organs.get(organId);
    if (!rec) return [];
    const nowMs = new Date(this.now()).getTime();
    return rec.dependencies.filter((dep) => {
      const d = this.organs.get(dep);
      if (!d) return true;
      const s = this.effectiveStatus(d, nowMs);
      return s === 'failing' || s === 'unknown' || s === 'stopped';
    });
  }

  /** The secret REFERENCES an organ declared (names only - never values). */
  secretRefs(organId: string): SecretRef[] {
    return this.organs.get(organId)?.secrets ?? [];
  }

  /** A one-shot organism snapshot for a dashboard. */
  snapshot(): { total: number; healthy: number; degraded: number; capabilities: number; organs: Array<{ organId: string; layer: string; status: OrganStatus; version: string }> } {
    const list = this.list();
    return {
      total: list.length,
      healthy: list.filter((r) => r.effectiveStatus === 'healthy').length,
      degraded: list.filter((r) => ['degraded', 'failing', 'unknown'].includes(r.effectiveStatus)).length,
      capabilities: this.capabilities().length,
      organs: list.map((r) => ({ organId: r.organId, layer: r.layer, status: r.effectiveStatus, version: r.version })),
    };
  }
}
