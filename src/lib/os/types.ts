/**
 * ZAO OS — Core type definitions for the composable operating system.
 * Shell + Apps + Core architecture.
 */

export type AppCategory = 'social' | 'music' | 'governance' | 'tools' | 'earn';
export type AppType = 'full-app' | 'micro-app';
export type WidgetSize = 'small' | 'medium' | 'large';
export type ShellId = 'phone' | 'desktop' | 'dashboard' | 'feed';

export interface WidgetProps {
  size: WidgetSize;
  onExpand: () => void;
}

export interface AppManifest {
  id: string;
  name: string;
  icon: string;
  category: AppCategory;
  type: AppType;
  description: string;

  /** Internal route for full apps */
  route?: string;
  /** External URL for tools hosted elsewhere (ZOE, Pixels, etc.) */
  externalUrl?: string;

  /** Dynamic import for the app component (lazy loaded) */
  component?: () => Promise<{ default: React.ComponentType }>;
  /** Dynamic import for widget variant */
  widget?: () => Promise<{ default: React.ComponentType<WidgetProps> }>;

  /** Auth & gating */
  requiresAuth: boolean;
  requiresGate?: 'allowlist' | 'token' | 'respect';
  minRespect?: number;

  /** Micro-app embedding */
  embeddableIn?: string[];
  standalone?: boolean;

  /** Startup defaults */
  defaultPinned?: boolean;
  defaultWidget?: boolean;
}

export interface ShellDefinition {
  id: ShellId;
  name: string;
  description: string;
  icon: string;
}

export interface UserAppConfig {
  userId: string;
  shell: ShellId;
  pinnedApps: string[];
  startupApps: string[];
  widgetLayout: WidgetLayoutItem[];
  hiddenApps: string[];
}

export interface WidgetLayoutItem {
  appId: string;
  size: WidgetSize;
  position: { x: number; y: number };
}
