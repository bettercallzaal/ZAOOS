/**
 * ZAO OS Shell Definitions — Swappable layout systems.
 * Like Linux desktop environments: same apps, different UX.
 */

import type { ShellDefinition, ShellId } from './types';

export const SHELLS: Record<ShellId, ShellDefinition> = {
  phone: {
    id: 'phone',
    name: 'Phone',
    description: 'App grid with widgets, like a phone home screen',
    icon: '📱',
  },
  desktop: {
    id: 'desktop',
    name: 'Desktop',
    description: 'Dock and floating windows, like a computer',
    icon: '🖥️',
  },
  dashboard: {
    id: 'dashboard',
    name: 'Command Center',
    description: 'Mission control cockpit for agent fleet, telemetry & apps',
    icon: '📊',
  },
  feed: {
    id: 'feed',
    name: 'Feed',
    description: 'Activity stream from all your apps',
    icon: '📰',
  },
};

export const DEFAULT_SHELL: ShellId = 'phone';

export function getShell(id: ShellId): ShellDefinition {
  return SHELLS[id] ?? SHELLS.phone;
}

export function getAllShells(): ShellDefinition[] {
  return Object.values(SHELLS);
}
