/**
 * Control Plane - the organism's operational nervous system. Public API.
 *
 * Organs register and continuously publish identity, version, capabilities,
 * dependencies, health, metrics, status, and endpoints. The plane answers what
 * organs exist, which are healthy vs degraded, what capabilities are available
 * and who provides them - so organs discover each other through the plane rather
 * than coupling directly. Registry + discovery only; it never executes a
 * workload (Spine) and never holds a secret value (references only).
 */

export type {
  OrganStatus,
  Capability,
  OrganEndpoint,
  SecretRef,
  HealthReport,
  OrganRegistration,
  OrganRecord,
  CapabilityListing,
} from './types';

export { ControlPlane, ControlPlaneError } from './control-plane';
export type { ControlPlaneOptions } from './control-plane';
