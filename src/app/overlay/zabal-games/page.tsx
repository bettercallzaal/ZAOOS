'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LowerThird } from './LowerThird';
import { TopBanner } from './TopBanner';
import { SceneCard } from './SceneCard';

/**
 * Generic ZABAL Games stream overlay — a browser source for OBS / Restream Studio.
 *
 * Unlike the now-playing overlay (per-user, Supabase-backed, music data), this is
 * 100% URL-configured: no auth, no DB, no polling. Any workshop host pastes a URL
 * into Restream's "web page" element or OBS "browser source" and gets a branded
 * overlay. See research docs 215 (browser-source pattern) + 627 (StreamElements).
 *
 * URL params (all optional):
 *   style    lower-third (default) | banner | scene
 *   title    main text                          (default "ZABAL GAMES")
 *   subtitle secondary line / topic             (default "")
 *   live     1|true shows a pulsing LIVE badge  (default on for lower-third/banner)
 *   theme    dark (default) | light
 *   accent   hex WITHOUT the # (default f5a623) — brand accent for badges/rules
 *   logo     image URL for a logo mark          (default: text wordmark)
 *   pos      lower-third corner: left (default) | right
 *   size     small | medium (default) | large
 *   scene    scene mode: starting (default) | brb | thanks | custom
 *
 * Examples:
 *   /overlay/zabal-games?title=ZABAL%20Games&subtitle=Phase%202%20Workshop&live=1
 *   /overlay/zabal-games?style=banner&subtitle=Ship%20something%20every%20week
 *   /overlay/zabal-games?style=scene&scene=starting&subtitle=Starting%20at%206pm%20ET
 */
export interface OverlayConfig {
  title: string;
  subtitle: string;
  live: boolean;
  theme: 'dark' | 'light';
  accent: string;
  logo: string;
  pos: 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  scene: string;
}

function parseConfig(params: URLSearchParams): OverlayConfig {
  const truthy = (v: string | null, dflt: boolean): boolean => {
    if (v === null) return dflt;
    return v === '1' || v.toLowerCase() === 'true';
  };
  const accentRaw = (params.get('accent') || 'f5a623').replace(/^#/, '');
  const accent = /^[0-9a-fA-F]{3,8}$/.test(accentRaw) ? `#${accentRaw}` : '#f5a623';
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';
  const pos = params.get('pos') === 'right' ? 'right' : 'left';
  const sizeRaw = params.get('size');
  const size = sizeRaw === 'small' || sizeRaw === 'large' ? sizeRaw : 'medium';

  return {
    title: params.get('title') || 'ZABAL GAMES',
    subtitle: params.get('subtitle') || '',
    live: truthy(params.get('live'), true),
    theme,
    accent,
    logo: params.get('logo') || '',
    pos,
    size,
    scene: params.get('scene') || 'starting',
  };
}

function OverlayInner() {
  const searchParams = useSearchParams();
  const style = searchParams.get('style') || 'lower-third';
  const cfg = parseConfig(new URLSearchParams(searchParams.toString()));

  switch (style) {
    case 'banner':
      return <TopBanner cfg={cfg} />;
    case 'scene':
      return <SceneCard cfg={cfg} />;
    default:
      return <LowerThird cfg={cfg} />;
  }
}

export default function ZabalGamesOverlay() {
  return (
    <Suspense fallback={null}>
      <OverlayInner />
    </Suspense>
  );
}
