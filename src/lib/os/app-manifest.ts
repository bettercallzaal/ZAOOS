/**
 * ZAO OS App Manifest — Registry of all available apps and micro-apps.
 * Each app declares its metadata, route, component loader, and widget.
 * The OS shell reads this manifest to render the app drawer and home screen.
 */

import type { AppManifest } from './types';

// ─── Full Apps ────────────────────────────────────────────────────

const chat: AppManifest = {
  id: 'chat',
  name: 'Chat',
  icon: '💬',
  category: 'social',
  type: 'full-app',
  description: 'Farcaster channel chat rooms',
  route: '/chat',
  requiresAuth: true,
  defaultPinned: true,
};

const messages: AppManifest = {
  id: 'messages',
  name: 'DMs',
  icon: '✉️',
  category: 'social',
  type: 'full-app',
  description: 'Encrypted XMTP direct messages',
  route: '/messages',
  requiresAuth: true,
  defaultPinned: true,
};

const music: AppManifest = {
  id: 'music',
  name: 'Music',
  icon: '🎵',
  category: 'music',
  type: 'full-app',
  description: 'Multi-platform music player with crossfade',
  route: '/music',
  requiresAuth: true,
  defaultPinned: true,
};

const spaces: AppManifest = {
  id: 'spaces',
  name: 'Spaces',
  icon: '🎙️',
  category: 'social',
  type: 'full-app',
  description: 'Live audio/video rooms with broadcast',
  route: '/calls',
  requiresAuth: true,
  defaultPinned: true,
};

const governance: AppManifest = {
  id: 'governance',
  name: 'Governance',
  icon: '⭐',
  category: 'governance',
  type: 'full-app',
  description: 'Proposals, polls, and community voting',
  route: '/governance',
  requiresAuth: true,
  defaultPinned: true,
};

const directory: AppManifest = {
  id: 'directory',
  name: 'Directory',
  icon: '👥',
  category: 'social',
  type: 'full-app',
  description: 'Community member directory',
  route: '/directory',
  requiresAuth: true,
  defaultPinned: true,
};

const respect: AppManifest = {
  id: 'respect',
  name: 'Respect',
  icon: '🏆',
  category: 'governance',
  type: 'full-app',
  description: 'Respect scores and fractal rankings',
  route: '/respect',
  requiresAuth: true,
  defaultPinned: true,
};

const library: AppManifest = {
  id: 'library',
  name: 'Library',
  icon: '📚',
  category: 'music',
  type: 'full-app',
  description: 'Your music library and playlists',
  route: '/library',
  requiresAuth: true,
};

const wavewarz: AppManifest = {
  id: 'wavewarz',
  name: 'WaveWarZ',
  icon: '⚔️',
  category: 'earn',
  type: 'full-app',
  description: 'Music prediction battles',
  route: '/wavewarz',
  requiresAuth: true,
};

const social: AppManifest = {
  id: 'social',
  name: 'Social',
  icon: '🌐',
  category: 'social',
  type: 'full-app',
  description: 'Social feed, analytics, and connections',
  route: '/social',
  requiresAuth: true,
  defaultPinned: true,
};

const admin: AppManifest = {
  id: 'admin',
  name: 'Admin',
  icon: '⚙️',
  category: 'tools',
  type: 'full-app',
  description: 'Community administration panel',
  route: '/admin',
  requiresAuth: true,
  requiresGate: 'allowlist',
};

// ─── External Apps (agent dashboards) ─────────────────────────────

const zoeDashboard: AppManifest = {
  id: 'zoe-dashboard',
  name: 'ZOE',
  icon: '🦞',
  category: 'tools',
  type: 'full-app',
  description: 'Agent command center',
  externalUrl: 'https://zoe.zaoos.com',
  requiresAuth: true,
  requiresGate: 'allowlist',
};

const pixelAgents: AppManifest = {
  id: 'pixel-agents',
  name: 'Pixels',
  icon: '🎨',
  category: 'tools',
  type: 'full-app',
  description: 'Pixel agent office',
  externalUrl: 'https://pixels.zaoos.com',
  requiresAuth: true,
  requiresGate: 'allowlist',
};

const paperclip: AppManifest = {
  id: 'paperclip',
  name: 'Paperclip',
  icon: '📎',
  category: 'tools',
  type: 'full-app',
  description: 'Paperclip agent dashboard',
  externalUrl: 'https://paperclip.zaoos.com',
  requiresAuth: true,
  requiresGate: 'allowlist',
};

const agentOrchestrator: AppManifest = {
  id: 'ao-dashboard',
  name: 'AO',
  icon: '🤖',
  category: 'tools',
  type: 'full-app',
  description: 'Parallel agent orchestrator',
  externalUrl: 'https://ao.zaoos.com',
  requiresAuth: true,
  requiresGate: 'allowlist',
};

// ─── Micro-Apps ───────────────────────────────────────────────────

const binauralBeats: AppManifest = {
  id: 'binaural-beats',
  name: 'Binaural Beats',
  icon: '🧠',
  category: 'music',
  type: 'micro-app',
  description: 'Focus-enhancing binaural beat generator',
  standalone: true,
  embeddableIn: ['music'],
  requiresAuth: true,
};

const notifications: AppManifest = {
  id: 'notifications',
  name: 'Notifications',
  icon: '🔔',
  category: 'social',
  type: 'micro-app',
  description: 'Activity notifications',
  route: '/notifications',
  standalone: true,
  requiresAuth: true,
};

const staking: AppManifest = {
  id: 'staking',
  name: 'Staking',
  icon: '💎',
  category: 'earn',
  type: 'micro-app',
  description: 'ZABAL conviction staking',
  route: '/stake',
  standalone: true,
  requiresAuth: false,
};

const leaderboard: AppManifest = {
  id: 'leaderboard',
  name: 'Leaderboard',
  icon: '📊',
  category: 'governance',
  type: 'micro-app',
  description: 'Community rankings and scores',
  route: '/zao-leaderboard',
  standalone: true,
  embeddableIn: ['respect', 'wavewarz'],
  requiresAuth: true,
};

const search: AppManifest = {
  id: 'search',
  name: 'Search',
  icon: '🔍',
  category: 'tools',
  type: 'micro-app',
  description: 'Search members, channels, and content',
  standalone: true,
  embeddableIn: ['chat', 'directory', 'music'],
  requiresAuth: true,
};

const settings: AppManifest = {
  id: 'settings',
  name: 'Settings',
  icon: '🔧',
  category: 'tools',
  type: 'micro-app',
  description: 'Account and app settings',
  route: '/settings',
  standalone: true,
  requiresAuth: true,
};

// ─── Registry ─────────────────────────────────────────────────────

export const APP_REGISTRY: AppManifest[] = [
  // Full apps
  chat,
  messages,
  music,
  spaces,
  governance,
  directory,
  respect,
  library,
  wavewarz,
  social,
  admin,
  // External apps
  zoeDashboard,
  pixelAgents,
  paperclip,
  agentOrchestrator,
  // Micro-apps
  binauralBeats,
  notifications,
  staking,
  leaderboard,
  search,
  settings,
];

export function getApp(id: string): AppManifest | undefined {
  return APP_REGISTRY.find((app) => app.id === id);
}

export function getAppsByCategory(category: AppManifest['category']): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.category === category);
}

export function getFullApps(): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.type === 'full-app');
}

export function getMicroApps(): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.type === 'micro-app');
}

export function getDefaultPinnedApps(): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.defaultPinned);
}
