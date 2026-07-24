/**
 * Eyes - the perception organ. Public API.
 *
 * One responsibility: observe. Sensors perceive the outside world and emit
 * standardized Observation objects; the registry plugs sensors in/out and runs
 * perception cycles with health + failure isolation. Nothing here thinks,
 * decides, or acts - Observations flow outward to the Brain, Spine, and Memory,
 * which are the organs that reason and reconcile.
 */

export type {
  Observation,
  EvidenceRef,
  SensorStatus,
  SensorHealth,
  SensorHealthSnapshot,
  SensorManifest,
  Sensor,
  ObserveContext,
  ObserveResult,
} from './types';

export {
  createObservation,
  observationContentHash,
  verifyObservation,
  clusterForConsensus,
  canonicalize,
  sha256Hex,
} from './observation';

export { SensorRegistry, validateManifest, ManifestError } from './registry';
export type { RunCycleResult } from './registry';

export { createFilesystemSensor } from './sensors/filesystem-sensor';
export type { DirEntry, FilesystemSensorOptions } from './sensors/filesystem-sensor';
