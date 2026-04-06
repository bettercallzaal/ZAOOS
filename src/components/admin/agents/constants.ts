export const AGENTS = [
  { name: 'zoe', label: 'ZOE', emoji: '🦞', color: '#FF6B6B', role: 'Orchestrator' },
  { name: 'zoey', label: 'ZOEY', emoji: '⚡', color: '#4ECDC4', role: 'Action Agent' },
  { name: 'builder', label: 'BUILDER', emoji: '🔨', color: '#F59E0B', role: 'Code' },
  { name: 'scout', label: 'SCOUT', emoji: '🔭', color: '#8B5CF6', role: 'Intel' },
  { name: 'wallet', label: 'WALLET', emoji: '💰', color: '#10B981', role: 'On-chain' },
  { name: 'fishbowlz', label: 'FISHBOWLZ', emoji: '🐟', color: '#06B6D4', role: 'Audio Rooms' },
  { name: 'caster', label: 'CASTER', emoji: '📢', color: '#EC4899', role: 'Social' },
] as const;

export type AgentName = (typeof AGENTS)[number]['name'];

export const EVENT_TYPES = {
  task_started: { label: 'Started', color: 'bg-blue-500/20 text-blue-400', icon: '▶' },
  task_completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400', icon: '✅' },
  task_failed: { label: 'Failed', color: 'bg-red-500/20 text-red-400', icon: '❌' },
  blocked: { label: 'Blocked', color: 'bg-yellow-500/20 text-yellow-400', icon: '⚠️' },
  approval_needed: { label: 'Needs Approval', color: 'bg-[#f5a623]/20 text-[#f5a623]', icon: '🟡' },
  heartbeat: { label: 'Heartbeat', color: 'bg-gray-500/20 text-gray-400', icon: '💓' },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export interface AgentEvent {
  id: string;
  agent_name: AgentName;
  event_type: EventType;
  summary: string | null;
  payload: Record<string, unknown>;
  dispatched_by: string | null;
  notified_at: string | null;
  created_at: string;
}

export interface AgentStatus {
  name: AgentName;
  label: string;
  emoji: string;
  color: string;
  role: string;
  status: 'active' | 'idle' | 'error' | 'approval_needed';
  current_task: string | null;
  last_event: AgentEvent | null;
  events_24h: number;
}

export function getAgent(name: string) {
  return AGENTS.find((a) => a.name === name);
}

export function getStatusDot(status: AgentStatus['status']): string {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'approval_needed': return 'bg-[#f5a623]';
    default: return 'bg-gray-500';
  }
}

export function deriveStatus(lastEvent: AgentEvent | null): AgentStatus['status'] {
  if (!lastEvent) return 'idle';
  switch (lastEvent.event_type) {
    case 'task_started': return 'active';
    case 'task_failed': return 'error';
    case 'blocked': return 'error';
    case 'approval_needed': return 'approval_needed';
    default: return 'idle';
  }
}
