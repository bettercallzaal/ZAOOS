/**
 * Audio filter presets for ZAO OS music player.
 *
 * Two categories:
 * 1. Speed/pitch filters — use playbackRate, work with ALL audio sources
 * 2. EQ/effects filters — use Web Audio API nodes, require CORS-compatible sources
 *
 * NOTE: AudioContext must be created after a user gesture (click/tap).
 */

// ── Types ──────────────────────────────────────────────────────────────

export type AudioNodeConfig =
  | { type: 'biquad'; filter: BiquadFilterType; frequency?: number; gain?: number; Q?: number }
  | { type: 'gain'; gain: number }
  | { type: 'stereoPanner'; pan: number }
  | { type: 'delay'; delayTime: number };

export interface AudioFilterPreset {
  name: string;
  description: string;
  icon: string;
  category: 'speed' | 'eq' | 'fun';
  /** Web Audio API node chain (empty for speed-only presets). */
  nodes: AudioNodeConfig[];
  /** Applied to audioElement.playbackRate. Default 1.0. */
  playbackRate?: number;
}

export interface FilterCategory {
  label: string;
  icon: string;
  keys: string[];
}

// ── Filter Categories (for UI grouping) ────────────────────────────────

export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    label: 'Speed & Pitch',
    icon: '⚡',
    keys: [
      'nightcore', 'vaporwave', 'chipmunk', 'slowed', 'daycore',
      'speedUp', 'doubleTime', 'halfSpeed', 'subtleFast', 'subtleSlow',
    ],
  },
  {
    label: 'Vibes',
    icon: '🎭',
    keys: [
      'lofi', 'choppedScrewed', 'dreamy', 'underwater', 'oldRadio',
      'vinyl', 'telephone', 'concert', 'cave', 'whisper',
    ],
  },
  {
    label: 'Genres',
    icon: '🎵',
    keys: [
      'trap', 'phonk', 'synthwave', 'reggae', 'punk',
      'jazz', 'classical', 'edm', 'rnb', 'latin',
    ],
  },
  {
    label: 'Fun',
    icon: '🎉',
    keys: [
      'demon', 'angel', 'robot', 'giant', 'tiny',
      'drunk', 'reverse', 'echo', 'alien', 'godMode',
    ],
  },
];

// ── Presets ─────────────────────────────────────────────────────────────

export const AUDIO_FILTERS: Record<string, AudioFilterPreset> = {

  // ═══════════════════════════════════════════════════════════════════════
  // SPEED & PITCH — playbackRate only, works with ALL sources
  // ═══════════════════════════════════════════════════════════════════════

  nightcore: {
    name: 'Nightcore',
    description: 'Sped up 1.25x — energetic, higher pitch, anime vibes',
    icon: '🌙',
    category: 'speed',
    playbackRate: 1.25,
    nodes: [],
  },
  vaporwave: {
    name: 'Vaporwave',
    description: 'Slowed to 0.8x — dreamy, pitched down, aesthetic',
    icon: '🌅',
    category: 'speed',
    playbackRate: 0.8,
    nodes: [],
  },
  chipmunk: {
    name: 'Chipmunk',
    description: 'Sped up to 1.5x — fast and squeaky',
    icon: '🐿️',
    category: 'speed',
    playbackRate: 1.5,
    nodes: [],
  },
  slowed: {
    name: 'Slowed',
    description: 'Slowed to 0.85x — chopped & screwed vibes',
    icon: '🕺',
    category: 'speed',
    playbackRate: 0.85,
    nodes: [],
  },
  daycore: {
    name: 'Daycore',
    description: 'Slowed to 0.7x — deep, ambient, meditative',
    icon: '☀️',
    category: 'speed',
    playbackRate: 0.7,
    nodes: [],
  },
  speedUp: {
    name: 'Speed Up',
    description: 'Subtle 1.15x — slight energy boost',
    icon: '⚡',
    category: 'speed',
    playbackRate: 1.15,
    nodes: [],
  },
  doubleTime: {
    name: 'Double Time',
    description: '2x speed — hyperspeed, useful for podcasts too',
    icon: '⏩',
    category: 'speed',
    playbackRate: 2.0,
    nodes: [],
  },
  halfSpeed: {
    name: 'Half Speed',
    description: '0.5x — ultra slow, deep pitch, almost ambient',
    icon: '🐌',
    category: 'speed',
    playbackRate: 0.5,
    nodes: [],
  },
  subtleFast: {
    name: 'Subtle Fast',
    description: '1.08x — barely noticeable, fits more music in your day',
    icon: '🏃',
    category: 'speed',
    playbackRate: 1.08,
    nodes: [],
  },
  subtleSlow: {
    name: 'Subtle Slow',
    description: '0.92x — slightly relaxed, more chill',
    icon: '🧘',
    category: 'speed',
    playbackRate: 0.92,
    nodes: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // VIBES — speed-based effects that evoke a mood
  // ═══════════════════════════════════════════════════════════════════════

  lofi: {
    name: 'Lo-fi',
    description: 'Slowed to 0.93x — chill beats to study/relax to',
    icon: '📼',
    category: 'eq',
    playbackRate: 0.93,
    nodes: [],
  },
  choppedScrewed: {
    name: 'Chopped & Screwed',
    description: '0.75x — DJ Screw style, Houston classic',
    icon: '🔩',
    category: 'eq',
    playbackRate: 0.75,
    nodes: [],
  },
  dreamy: {
    name: 'Dreamy',
    description: '0.88x — floaty, ethereal, half-asleep vibes',
    icon: '☁️',
    category: 'eq',
    playbackRate: 0.88,
    nodes: [],
  },
  underwater: {
    name: 'Underwater',
    description: '0.65x — deep, muffled, submerged feeling',
    icon: '🫧',
    category: 'eq',
    playbackRate: 0.65,
    nodes: [],
  },
  oldRadio: {
    name: 'Old Radio',
    description: '0.95x — slight warmth, vintage broadcast feel',
    icon: '📻',
    category: 'eq',
    playbackRate: 0.95,
    nodes: [],
  },
  vinyl: {
    name: 'Vinyl',
    description: '0.97x — barely slower, that record player warmth',
    icon: '💿',
    category: 'eq',
    playbackRate: 0.97,
    nodes: [],
  },
  telephone: {
    name: 'Telephone',
    description: '1.03x — slightly sped up, like a phone call',
    icon: '📞',
    category: 'eq',
    playbackRate: 1.03,
    nodes: [],
  },
  concert: {
    name: 'Concert',
    description: '0.98x — live performance feel, slightly laid back',
    icon: '🎸',
    category: 'eq',
    playbackRate: 0.98,
    nodes: [],
  },
  cave: {
    name: 'Cave',
    description: '0.6x — deep, cavernous, echoing darkness',
    icon: '🦇',
    category: 'eq',
    playbackRate: 0.6,
    nodes: [],
  },
  whisper: {
    name: 'Whisper',
    description: '0.78x — soft, intimate, ASMR-like',
    icon: '🤫',
    category: 'eq',
    playbackRate: 0.78,
    nodes: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GENRES — speed tweaks that approximate genre feels
  // ═══════════════════════════════════════════════════════════════════════

  trap: {
    name: 'Trap',
    description: '0.82x — ATL trap, slow bounce, heavy',
    icon: '🔥',
    category: 'eq',
    playbackRate: 0.82,
    nodes: [],
  },
  phonk: {
    name: 'Phonk',
    description: '0.77x — Memphis phonk, dark and distorted',
    icon: '💀',
    category: 'eq',
    playbackRate: 0.77,
    nodes: [],
  },
  synthwave: {
    name: 'Synthwave',
    description: '0.9x — retro 80s, neon lights, outrun',
    icon: '🌆',
    category: 'eq',
    playbackRate: 0.9,
    nodes: [],
  },
  reggae: {
    name: 'Reggae',
    description: '0.87x — laid back island tempo',
    icon: '🌴',
    category: 'eq',
    playbackRate: 0.87,
    nodes: [],
  },
  punk: {
    name: 'Punk',
    description: '1.3x — fast, aggressive, raw energy',
    icon: '🤘',
    category: 'eq',
    playbackRate: 1.3,
    nodes: [],
  },
  jazz: {
    name: 'Jazz',
    description: '0.94x — smoky lounge, late night feel',
    icon: '🎷',
    category: 'eq',
    playbackRate: 0.94,
    nodes: [],
  },
  classical: {
    name: 'Classical',
    description: '0.96x — grand, composed, concert hall',
    icon: '🎻',
    category: 'eq',
    playbackRate: 0.96,
    nodes: [],
  },
  edm: {
    name: 'EDM',
    description: '1.2x — festival energy, build and drop',
    icon: '🎆',
    category: 'eq',
    playbackRate: 1.2,
    nodes: [],
  },
  rnb: {
    name: 'R&B',
    description: '0.91x — smooth, sensual, groovy',
    icon: '💜',
    category: 'eq',
    playbackRate: 0.91,
    nodes: [],
  },
  latin: {
    name: 'Latin',
    description: '1.1x — reggaeton bounce, slightly up-tempo',
    icon: '💃',
    category: 'eq',
    playbackRate: 1.1,
    nodes: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FUN — extreme/novelty effects
  // ═══════════════════════════════════════════════════════════════════════

  demon: {
    name: 'Demon',
    description: '0.55x — deep, evil, growling bass',
    icon: '👹',
    category: 'fun',
    playbackRate: 0.55,
    nodes: [],
  },
  angel: {
    name: 'Angel',
    description: '1.35x — bright, ethereal, heavenly',
    icon: '😇',
    category: 'fun',
    playbackRate: 1.35,
    nodes: [],
  },
  robot: {
    name: 'Robot',
    description: '1.18x — precise, mechanical, calculated',
    icon: '🤖',
    category: 'fun',
    playbackRate: 1.18,
    nodes: [],
  },
  giant: {
    name: 'Giant',
    description: '0.45x — massive, earth-shaking, thunderous',
    icon: '🦖',
    category: 'fun',
    playbackRate: 0.45,
    nodes: [],
  },
  tiny: {
    name: 'Tiny',
    description: '1.75x — small, fast, fairy-like',
    icon: '🧚',
    category: 'fun',
    playbackRate: 1.75,
    nodes: [],
  },
  drunk: {
    name: 'Drunk',
    description: '0.72x — wobbly, slurred, warped',
    icon: '🍺',
    category: 'fun',
    playbackRate: 0.72,
    nodes: [],
  },
  reverse: {
    name: 'Reverse',
    description: '1.4x — feels like playing backwards (forward, sped up)',
    icon: '⏪',
    category: 'fun',
    playbackRate: 1.4,
    nodes: [],
  },
  echo: {
    name: 'Echo',
    description: '0.83x — slow, spacious, canyon reverb feel',
    icon: '🏔️',
    category: 'fun',
    playbackRate: 0.83,
    nodes: [],
  },
  alien: {
    name: 'Alien',
    description: '1.6x — high pitch, otherworldly, extraterrestrial',
    icon: '👽',
    category: 'fun',
    playbackRate: 1.6,
    nodes: [],
  },
  godMode: {
    name: 'God Mode',
    description: '3x speed — transcend time itself',
    icon: '⚜️',
    category: 'fun',
    playbackRate: 3.0,
    nodes: [],
  },
} as const;

// ── Apply / Remove helpers (kept for future Web Audio API use) ─────────

export function applyFilter(
  audioContext: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  preset: AudioFilterPreset,
): AudioNode[] {
  const createdNodes: AudioNode[] = [];
  let previous: AudioNode = source;

  for (const config of preset.nodes) {
    const node = createNode(audioContext, config);
    previous.connect(node);
    createdNodes.push(node);
    previous = node;
  }

  previous.connect(destination);
  return createdNodes;
}

export function removeFilter(
  source: AudioNode,
  destination: AudioNode,
  activeNodes: AudioNode[],
  audioElement?: HTMLAudioElement,
): void {
  source.disconnect();
  for (const node of activeNodes) {
    node.disconnect();
  }
  source.connect(destination);
  if (audioElement) {
    audioElement.playbackRate = 1.0;
  }
}

// ── Internal ────────────────────────────────────────────────────────────

function createNode(ctx: AudioContext, config: AudioNodeConfig): AudioNode {
  switch (config.type) {
    case 'biquad': {
      const bq = ctx.createBiquadFilter();
      bq.type = config.filter;
      if (config.frequency !== undefined) bq.frequency.value = config.frequency;
      if (config.gain !== undefined) bq.gain.value = config.gain;
      if (config.Q !== undefined) bq.Q.value = config.Q;
      return bq;
    }
    case 'gain': {
      const g = ctx.createGain();
      g.gain.value = config.gain;
      return g;
    }
    case 'stereoPanner': {
      const p = ctx.createStereoPanner();
      p.pan.value = config.pan;
      return p;
    }
    case 'delay': {
      const d = ctx.createDelay();
      d.delayTime.value = config.delayTime;
      return d;
    }
  }
}
