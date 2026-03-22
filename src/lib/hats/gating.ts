/**
 * Hat-based access control for privileged actions.
 *
 * Maps Hats Protocol roles to permissions, augmenting the existing
 * admin FID/wallet check with on-chain hat verification.
 *
 * Server-side only — never import in client components.
 */

import { isWearerOfHat, getWornHats } from './client';
import { HAT_IDS, PROJECT_HAT_IDS } from './constants';

// ── Permission types ────────────────────────────────────────

export type Permission =
  | 'admin'           // Full admin access (settings, user management)
  | 'moderate'        // Content moderation (hide/feature posts)
  | 'governance'      // Governance actions (create/manage proposals)
  | 'feature_tracks'  // Feature tracks in music section
  | 'manage_events'   // Manage events/festivals
  | 'manage_projects' // Manage project-level settings
  ;

export interface HatRole {
  hatId: bigint;
  label: string;
  permissions: Permission[];
}

// ── Hat → Permission mapping ────────────────────────────────

const HAT_PERMISSIONS: HatRole[] = [
  {
    hatId: HAT_IDS.topHat,
    label: 'ZAO',
    permissions: ['admin', 'moderate', 'governance', 'feature_tracks', 'manage_events', 'manage_projects'],
  },
  {
    hatId: HAT_IDS.configurator,
    label: 'Configurator',
    permissions: ['admin', 'moderate', 'governance', 'feature_tracks', 'manage_events', 'manage_projects'],
  },
  {
    hatId: HAT_IDS.governanceCouncil,
    label: 'Governance Council',
    permissions: ['moderate', 'governance', 'feature_tracks', 'manage_events'],
  },
  {
    hatId: HAT_IDS.councilMembers,
    label: 'Council Members',
    permissions: ['governance'],
  },
  {
    hatId: PROJECT_HAT_IDS.community,
    label: 'Community',
    permissions: ['moderate'],
  },
  {
    hatId: PROJECT_HAT_IDS.zaoFestivals,
    label: 'ZAO Festivals',
    permissions: ['manage_events'],
  },
  {
    hatId: PROJECT_HAT_IDS.ztalentNewsletter,
    label: 'ZTalent Newsletter',
    permissions: ['feature_tracks'],
  },
];

// ── Core gating functions ───────────────────────────────────

/**
 * Check if a wallet has a specific permission via any hat it wears.
 * Returns true if the wallet wears any hat that grants the permission.
 */
export async function hasPermission(
  walletAddress: `0x${string}`,
  permission: Permission
): Promise<boolean> {
  const relevantHats = HAT_PERMISSIONS.filter((h) =>
    h.permissions.includes(permission)
  );

  if (relevantHats.length === 0) return false;

  const results = await Promise.allSettled(
    relevantHats.map((h) => isWearerOfHat(walletAddress, h.hatId))
  );

  return results.some(
    (r) => r.status === 'fulfilled' && r.value === true
  );
}

/**
 * Get all permissions a wallet has based on its hats.
 * Returns a deduplicated set of permissions.
 */
export async function getPermissions(
  walletAddress: `0x${string}`
): Promise<Permission[]> {
  const allHatIds = HAT_PERMISSIONS.map((h) => h.hatId);
  const wornHats = await getWornHats(walletAddress, allHatIds);

  const permissions = new Set<Permission>();
  for (const wornId of wornHats) {
    const role = HAT_PERMISSIONS.find((h) => h.hatId === wornId);
    if (role) {
      for (const perm of role.permissions) {
        permissions.add(perm);
      }
    }
  }

  return Array.from(permissions);
}

/**
 * Get the roles (hats) a wallet currently wears, with labels and permissions.
 */
export async function getRoles(
  walletAddress: `0x${string}`
): Promise<HatRole[]> {
  const allHatIds = HAT_PERMISSIONS.map((h) => h.hatId);
  const wornHats = await getWornHats(walletAddress, allHatIds);

  return HAT_PERMISSIONS.filter((h) =>
    wornHats.some((w) => w === h.hatId)
  );
}

/**
 * Check if a wallet has admin-level access via hats.
 * This augments (does NOT replace) the existing session.isAdmin check.
 *
 * Usage in API routes:
 *   const session = await getSessionData();
 *   const isHatAdmin = session?.walletAddress
 *     ? await isHatAdmin(session.walletAddress as `0x${string}`)
 *     : false;
 *   const canAdmin = session?.isAdmin || isHatAdmin;
 */
export async function isHatAdmin(
  walletAddress: `0x${string}`
): Promise<boolean> {
  return hasPermission(walletAddress, 'admin');
}

/**
 * Require a specific permission — returns an error response object
 * if the wallet doesn't have the permission, or null if authorized.
 *
 * Usage:
 *   const denied = await requirePermission(walletAddress, 'moderate');
 *   if (denied) return NextResponse.json(denied, { status: 403 });
 */
export async function requirePermission(
  walletAddress: `0x${string}` | undefined | null,
  permission: Permission
): Promise<{ error: string; required: Permission } | null> {
  if (!walletAddress) {
    return { error: 'Wallet address required for hat-based access', required: permission };
  }

  const allowed = await hasPermission(walletAddress, permission);
  if (!allowed) {
    return { error: `Missing required permission: ${permission}`, required: permission };
  }

  return null;
}
