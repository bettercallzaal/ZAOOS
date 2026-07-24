/**
 * Eyes - the perception organ. Types + contracts.
 *
 * The Eyes have exactly ONE responsibility: observe. They perceive the outside
 * world and emit structured Observations. They do NOT think, do NOT decide, and
 * do NOT execute. That boundary is enforced by construction here: a Sensor's
 * only output is an Observation[]; there is no action, write, or decision
 * surface anywhere in these interfaces. If a future change gives a Sensor a way
 * to act, the organ boundary is broken.
 *
 * Observations are consumed downstream by the Brain (reasoning), the Spine
 * (coordination), and Memory - but the Eyes never tell them what is TRUE. They
 * report what was seen, with enough provenance and evidence that consumers can
 * reconcile multiple independent observations of the same subject later.
 *
 * ZAO's own vocabulary. No external protocol/branding coupling.
 */

/** A pointer to a supporting artifact (raw response, screenshot, OCR image, log slice). */
export interface EvidenceRef {
  /** What the artifact is. */
  kind: 'raw' | 'screenshot' | 'image' | 'document' | 'log' | 'snapshot' | 'link';
  /** Where it lives (file path, url, storage key). */
  uri: string;
  /** Content hash of the artifact, when available. */
  sha256?: string;
  mediaType?: string;
  description?: string;
}

export type SensorStatus = 'healthy' | 'degraded' | 'failing' | 'stopped';

/** A snapshot of a sensor's health at the moment it captured an observation. */
export interface SensorHealthSnapshot {
  status: SensorStatus;
  /** Time the observe() call took, ms. */
  latencyMs: number;
  /** Rolling error rate 0..1 over the sensor's recent window. */
  errorRate: number;
  /** ISO time of the sensor's last successful observe. */
  lastOkAt: string | null;
  /** Consecutive failures before this capture. */
  consecutiveFailures: number;
}

/**
 * A single structured observation. Every field Brandon required is here:
 * source (sensor), timestamp (capturedAt/observedAt), confidence, provenance,
 * hashes (contentHash + evidence sha256s), evidence, supporting artifacts, and
 * health metadata. Plus subjectKey so multiple Eyes observing the SAME thing
 * can be grouped for later consensus - without any Eye deciding what is true.
 */
export interface Observation {
  schemaVersion: 'zao.observation.v1';
  /** Unique id for THIS observation. */
  observationId: string;
  /** The sensor that produced it (the source). */
  sensor: string;
  /** The Eye instance/process that ran the sensor (for multi-eye reconciliation). */
  observerId: string;
  /** What kind of thing was seen, e.g. 'github.pr', 'fs.change', 'chain.tx', 'market.price', 'log.error'. */
  kind: string;
  /**
   * A STABLE key for the observed subject/event. Two Eyes seeing the same PR
   * emit the same subjectKey with (likely) the same contentHash - which is what
   * lets a downstream consumer reconcile them. The Eyes do not reconcile.
   */
  subjectKey: string;
  /** When the observed event actually happened, if known. */
  observedAt: string | null;
  /** When the sensor captured it (always set). */
  capturedAt: string;
  /** How sure the sensor is about the observation, 0..1. Not a truth claim - a self-report. */
  confidence: number;
  /** How it was obtained. */
  provenance: {
    method: 'poll' | 'subscribe' | 'scrape' | 'api' | 'ocr' | 'vision' | 'filesystem' | 'search';
    endpoint?: string;
    query?: string;
  };
  /** sha256 of the canonical payload - dedup, tamper-evidence, and consensus grouping. */
  contentHash: string;
  /** The structured observation data. Consumer-defined shape per kind. */
  payload: unknown;
  /** Supporting artifacts backing the observation. */
  evidence: EvidenceRef[];
  /** The sensor's health at capture time. */
  health: SensorHealthSnapshot;
}

/** Declarative description of a sensor - the manifest the registry reads. */
export interface SensorManifest {
  sensorId: string;
  version: string;
  /** Human description of what it observes. */
  description: string;
  /** How it acquires observations. */
  strategy: 'poll' | 'subscribe' | 'on_demand';
  /** For poll strategy, how often. */
  pollIntervalMs?: number;
  /** The observation kinds it can emit. */
  produces: string[];
  /** Env/config keys it needs to function. */
  requiredConfig: string[];
  /**
   * Eyes are ALWAYS passive. This is fixed at the type level as a reminder that
   * a sensor may only read. There is no other risk tier for an Eye.
   */
  riskTier: 'passive';
}

/** Live health of a sensor (richer than the per-observation snapshot). */
export interface SensorHealth extends SensorHealthSnapshot {
  sensorId: string;
  totalObservations: number;
  totalErrors: number;
}

/** Context handed to a sensor for one observe cycle. Read-only inputs only. */
export interface ObserveContext {
  observerId: string;
  /** Opaque cursor from the sensor's previous run (for incremental polling). */
  cursor?: string;
  /** Read-only config values the sensor declared it needs. */
  config: Readonly<Record<string, string | undefined>>;
  /** ISO 'now' for deterministic testing. */
  now?: string;
}

export interface ObserveResult {
  observations: Observation[];
  /** New cursor to hand back next cycle. */
  cursor?: string;
}

/**
 * A Sensor is text/read-in, Observation-out. Note there is NO method that acts,
 * writes, or decides - observe() returns observations and health() reports
 * state. That is the entire surface. This is the organ boundary in code.
 */
export interface Sensor {
  readonly manifest: SensorManifest;
  /** Perceive. Read-only. Returns structured observations + a cursor. */
  observe(ctx: ObserveContext): Promise<ObserveResult>;
  /** Report health. Does not perceive or act. */
  health(): SensorHealth;
}
