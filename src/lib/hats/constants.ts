/**
 * Hats Protocol constants for ZAO Tree 226 on Optimism.
 *
 * Hat IDs use 256-bit encoding: tree domain in upper 32 bits,
 * then 16-bit level segments at offsets 224, 208, 192, 176, ...
 */

/** Hats Protocol v1 contract address (deterministic, same on all chains) */
export const HATS_CONTRACT = '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137' as const;

/** ZAO tree domain on Optimism */
export const TREE_ID = 226;

/** Chain ID for Optimism */
export const HATS_CHAIN_ID = 10;

// ── Hat ID helpers ────────────────────────────────────────────────

const TREE_DOMAIN = BigInt(TREE_ID);

/** Encode a hat ID from tree domain + level indices (1-indexed) */
function hatId(...levels: number[]): bigint {
  let id = TREE_DOMAIN << BigInt(224);
  const shifts = [208, 192, 176, 160, 144, 128, 112, 96, 80, 64, 48, 32, 16, 0].map(BigInt);
  for (let i = 0; i < levels.length; i++) {
    id |= BigInt(levels[i]) << shifts[i];
  }
  return id;
}

// ── ZAO Tree 226 Hat IDs ──────────────────────────────────────────

export const HAT_IDS = {
  /** Top Hat — ZAO root (1 wearer) */
  topHat: hatId(),

  /** Configurator — admin hat (child 1 of top hat) */
  configurator: hatId(1),

  /** Governance Council — under Configurator (child 1.1) */
  governanceCouncil: hatId(1, 1),

  /** Governance Council Members — under Configurator (child 1.2) */
  councilMembers: hatId(1, 2),
} as const;

// ── Project Hats under Governance Council ─────────────────────────
// These are children of governanceCouncil (1.1.x)

export const PROJECT_HAT_IDS = {
  community: hatId(1, 1, 1),
  location: hatId(1, 1, 2),
  zao101: hatId(1, 1, 3),
  zaoFractals: hatId(1, 1, 4),
  waveWarZDao: hatId(1, 1, 5),
  zaoFestivals: hatId(1, 1, 6),
  ztalentNewsletter: hatId(1, 1, 7),
  zaoCards: hatId(1, 1, 8),
  studentLoanz: hatId(1, 1, 9),
  // 10 is unnamed
  futureProject3: hatId(1, 1, 11),
  futureProject4: hatId(1, 1, 12),
  cocConcertz: hatId(1, 1, 13),
  midiZaoNkz: hatId(1, 1, 14),
  letsTalkWeb3: hatId(1, 1, 15),
  futureProject1: hatId(1, 1, 16),
  futureProject2: hatId(1, 1, 17),
} as const;

/** Human-readable labels for known hat IDs */
export const HAT_LABELS: Record<string, string> = {
  [HAT_IDS.topHat.toString()]: 'ZAO',
  [HAT_IDS.configurator.toString()]: 'Configurator',
  [HAT_IDS.governanceCouncil.toString()]: 'Governance Council',
  [HAT_IDS.councilMembers.toString()]: 'Council Members',
  [PROJECT_HAT_IDS.community.toString()]: 'Community',
  [PROJECT_HAT_IDS.location.toString()]: 'Location',
  [PROJECT_HAT_IDS.zao101.toString()]: 'ZAO 101',
  [PROJECT_HAT_IDS.zaoFractals.toString()]: 'ZAO Fractals',
  [PROJECT_HAT_IDS.waveWarZDao.toString()]: 'Wave WarZ DAO',
  [PROJECT_HAT_IDS.zaoFestivals.toString()]: 'ZAO Festivals',
  [PROJECT_HAT_IDS.ztalentNewsletter.toString()]: 'ZTalent Newsletter',
  [PROJECT_HAT_IDS.zaoCards.toString()]: 'ZAO Cards',
  [PROJECT_HAT_IDS.studentLoanz.toString()]: 'Student $LOANZ',
  [PROJECT_HAT_IDS.cocConcertz.toString()]: 'COC ConcertZ',
  [PROJECT_HAT_IDS.midiZaoNkz.toString()]: 'MIDI-ZAO-NKZ',
  [PROJECT_HAT_IDS.letsTalkWeb3.toString()]: "Let's Talk about Web 3",
};

/** Format a hat ID as a 0x-prefixed hex string */
export function formatHatId(id: bigint): string {
  return '0x' + id.toString(16).padStart(64, '0');
}
