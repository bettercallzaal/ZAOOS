/**
 * Control Plane - the organism's operational nervous system. Types + contracts.
 *
 * Rather than coupling organs to each other, every organ REGISTERS with the
 * Control Plane and continuously publishes who it is, what it can do, and how
 * healthy it is. The organism can then always answer: what organs exist, which
 * are healthy vs degraded, what capabilities are available, and what workloads
 * each organ can accept - without any organ hard-wiring to another.
 *
 * The Control Plane is a REGISTRY + DISCOVERY surface. It does not execute
 * workloads (that is the Spine) and it never holds secret VALUES (only
 * references to where a secret lives). Clean interfaces, ZAO's own vocabulary.
 */

export type OrganStatus = 'starting' | 'healthy' | 'degraded' | 'failing' | 'draining' | 'stopped' | 'unknown';

/** A capability an organ offers, e.g. 'perceive.github', 'act.open_pr', 'remember.episodic'. */
export interface Capability {
  name: string;
  version: string;
  description?: string;
  /** Max concurrent workloads of this capability the organ will accept (backpressure hint). */
  maxConcurrency?: number;
}

/** A reachable endpoint an organ exposes (never a secret). */
export interface OrganEndpoint {
  name: string;
  /** Logical address - an internal service name, a queue, a function ref. Not a credential. */
  address: string;
  protocol: 'http' | 'queue' | 'internal' | 'ws' | 'cron';
}

/** A reference to a secret - the NAME/location, never the value. */
export interface SecretRef {
  key: string;
  /** Where it lives: env, a vault path, a manager id. The plane resolves references, not values. */
  source: 'env' | 'vault' | 'manager';
}

export interface HealthReport {
  status: OrganStatus;
  /** Free-form health detail (latency, error rate, queue depth) - metrics, not decisions. */
  metrics: Record<string, number>;
  message?: string;
  reportedAt: string;
}

/**
 * What an organ publishes to the Control Plane. Identity + version +
 * capabilities + dependencies + health + metrics + status + endpoints - exactly
 * the fields Brandon specified. Secrets appear only as references.
 */
export interface OrganRegistration {
  /** Stable organ identity, e.g. 'eyes', 'bloodstream', 'spine'. */
  organId: string;
  /** Human name / role. */
  name: string;
  version: string;
  /** Layer this organ runs in (Edge/Core/Data/Observability). */
  layer: 'edge' | 'core' | 'data' | 'observability';
  capabilities: Capability[];
  /** organIds this organ depends on (for discovery + startup ordering). */
  dependencies: string[];
  endpoints: OrganEndpoint[];
  /** Secret references this organ needs (names only). */
  secrets: SecretRef[];
  /** Initial health at registration. */
  health: HealthReport;
  /** Free-form labels (region, instance, etc). */
  labels?: Record<string, string>;
}

/** A live record the plane holds per organ. */
export interface OrganRecord extends OrganRegistration {
  registeredAt: string;
  lastHeartbeatAt: string;
  /** True once the plane has not heard a heartbeat within the liveness TTL. */
  stale: boolean;
}

/** A capability offered by one or more organs, as the plane sees it. */
export interface CapabilityListing {
  name: string;
  providers: Array<{ organId: string; version: string; status: OrganStatus; maxConcurrency?: number }>;
}
