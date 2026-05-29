/**
 * Multi-agent registry (doc 761 Phase 3, design from doc 318 - Cassie's multi-agent
 * coordination bootcamp).
 *
 * Each agent is a persona that can act on Farcaster under ZOE's orchestration. The ranker
 * (ranker.ts) decides which agent acts on a given trigger; the guard battery (guards.ts) gates
 * whether the chosen action fires. Registry is loaded from ~/.zao/zoe/agents.json (hand-edit
 * after first seed), falling back to a single default caster agent.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from '../memory';

/** Persona dials (doc 318) - shape ZOE's behaviour, fed into the ranker + draft prompt. */
export interface PersonaDials {
  tone: string; // e.g. 'warm-sharp', 'dry', 'hype'
  domain: string; // e.g. 'music', 'defi', 'community'
  risk: number; // 0..1 - willingness to say spicy things (also informs Klearu strictness)
  social: number; // 0..1 - how proactively it engages vs lurks
  engagement: number; // 0..1 - reply-depth appetite
}

export interface AgentSpec {
  agent_id: string;
  persona_prompt: string; // system prompt for draftCast
  topics: string[]; // topics this agent owns (matched against trigger)
  activity_budget: number; // max actions per budget window (see budget guard)
  cooldown_seconds: number; // min seconds between this agent's actions (>=90 enforced)
  thread_max_depth: number; // do not reply deeper than this in a thread
  priority_weight: number; // base weight in the softmax ranker
  schedule: AgentSchedule; // when the agent is "alive"
  persona: PersonaDials;
}

/** "alive" window - hours/days the agent is allowed to act (local time). */
export interface AgentSchedule {
  /** UTC hour range [start, end). If start===end, always alive. */
  active_hours_utc: [number, number];
  /** 0=Sun..6=Sat; empty = all days. */
  active_days?: number[];
}

const AGENTS_FILE = join(ZOE_PATHS.home, 'agents.json');

export const DEFAULT_CASTER: AgentSpec = {
  agent_id: 'caster',
  persona_prompt:
    'You are the ZAO community caster. Warm, sharp, builder voice. Never shill, never overpromise.',
  topics: ['zao', 'zabal', 'music', 'community'],
  activity_budget: 24, // doc 761: dozens of casts/day ceiling
  cooldown_seconds: 90,
  thread_max_depth: 3,
  priority_weight: 1,
  schedule: { active_hours_utc: [0, 0] }, // always alive by default
  persona: { tone: 'warm-sharp', domain: 'community', risk: 0.3, social: 0.5, engagement: 0.5 },
};

function coerce(spec: Partial<AgentSpec>): AgentSpec {
  // Enforce the cooldown floor (doc 761 guard battery: cooldown >= 90s).
  const cooldown = Math.max(90, spec.cooldown_seconds ?? DEFAULT_CASTER.cooldown_seconds);
  return {
    ...DEFAULT_CASTER,
    ...spec,
    cooldown_seconds: cooldown,
    persona: { ...DEFAULT_CASTER.persona, ...(spec.persona ?? {}) },
    schedule: { ...DEFAULT_CASTER.schedule, ...(spec.schedule ?? {}) },
  } as AgentSpec;
}

/** Load the registry. Returns [DEFAULT_CASTER] if no file exists. */
export async function loadAgents(): Promise<AgentSpec[]> {
  try {
    const raw = await fs.readFile(AGENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AgentSpec>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_CASTER];
    return parsed.map(coerce);
  } catch {
    return [DEFAULT_CASTER];
  }
}

/** Seed the registry file with the default caster if none exists. */
export async function seedAgents(): Promise<{ seeded: boolean }> {
  try {
    await fs.access(AGENTS_FILE);
    return { seeded: false };
  } catch {
    await fs.mkdir(ZOE_PATHS.home, { recursive: true });
    await fs.writeFile(AGENTS_FILE, JSON.stringify([DEFAULT_CASTER], null, 2), 'utf8');
    return { seeded: true };
  }
}
