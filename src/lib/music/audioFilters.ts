/**
 * Audio filter presets for ZAO OS music player.
 *
 * Inspired by ZAOMusicBot's Lavalink filter definitions, translated to
 * Web Audio API nodes (BiquadFilterNode, GainNode, etc.).
 *
 * NOTE: AudioContext must be created after a user gesture (click/tap) to
 * comply with browser autoplay policies. Never create an AudioContext at
 * module load time.
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
  /** Web Audio API node chain to create and connect in order. */
  nodes: AudioNodeConfig[];
  /**
   * Some effects (nightcore, vaporwave) require changing the HTMLAudioElement's
   * playbackRate, which cannot be achieved with AudioContext nodes alone.
   * When set, the caller should apply this to `audioElement.playbackRate`.
   */
  playbackRate?: number;
}

// ── Presets ─────────────────────────────────────────────────────────────

export const AUDIO_FILTERS: Record<string, AudioFilterPreset> = {
  nightcore: {
    name: 'Nightcore',
    description: 'Speeds up playback 1.25x — energetic, higher pitch',
    icon: '\uD83C\uDF19',
    playbackRate: 1.25,
    nodes: [],
  },

  vaporwave: {
    name: 'Vaporwave',
    description: 'Slows to 0.8x — dreamy, pitched down',
    icon: '\uD83C\uDF05',
    playbackRate: 0.8,
    nodes: [],
  },

  chipmunk: {
    name: 'Chipmunk',
    description: 'Speeds up to 1.5x — fast and squeaky',
    icon: '\uD83D\uDC3F\uFE0F',
    playbackRate: 1.5,
    nodes: [],
  },

  slowed: {
    name: 'Slowed',
    description: 'Slowed to 0.85x — chopped & screwed vibes',
    icon: '\uD83D\uDD7A',
    playbackRate: 0.85,
    nodes: [],
  },

  daycore: {
    name: 'Daycore',
    description: 'Slowed to 0.7x — ambient, deep pitch',
    icon: '\u2600\uFE0F',
    playbackRate: 0.7,
    nodes: [],
  },

  speedUp: {
    name: 'Speed Up',
    description: 'Speeds up to 1.15x — subtle energy boost',
    icon: '\u26A1',
    playbackRate: 1.15,
    nodes: [],
  },
} as const;

// ── Apply / Remove helpers ──────────────────────────────────────────────

/**
 * Creates and connects Web Audio API nodes for a given preset.
 *
 * The nodes are wired in series: source -> node[0] -> node[1] -> ... -> destination.
 *
 * Returns the created AudioNode instances so the caller can disconnect them
 * later (call `.disconnect()` on each, then reconnect source to destination).
 *
 * If the preset has a `playbackRate` value, the caller is responsible for
 * setting `audioElement.playbackRate` separately.
 */
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

  // Connect last node in the chain to the destination
  previous.connect(destination);

  return createdNodes;
}

/**
 * Disconnects all filter nodes and reconnects source directly to destination.
 * Also resets playbackRate on the audio element if provided.
 */
export function removeFilter(
  source: AudioNode,
  destination: AudioNode,
  activeNodes: AudioNode[],
  audioElement?: HTMLAudioElement,
): void {
  // Disconnect source from the first filter node
  source.disconnect();

  // Disconnect every filter node
  for (const node of activeNodes) {
    node.disconnect();
  }

  // Reconnect source straight to destination
  source.connect(destination);

  // Reset playbackRate if an audio element was provided
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
