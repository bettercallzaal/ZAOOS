import type { OverlayConfig } from './page';

/** Shared visual tokens derived from config, so all three styles stay consistent. */
export interface Tokens {
  panelBg: string;
  panelBorder: string;
  titleColor: string;
  subtitleColor: string;
  accent: string;
  fontStack: string;
  scale: number;
}

const FONT_STACK =
  '"Space Grotesk", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Add an alpha channel to a #rrggbb hex. alpha 0..1. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function tokensFor(cfg: OverlayConfig): Tokens {
  const dark = cfg.theme === 'dark';
  const scale = cfg.size === 'small' ? 0.82 : cfg.size === 'large' ? 1.25 : 1;
  return {
    // ZAO navy ground for dark, warm off-white for light — both readable over video.
    panelBg: dark ? 'rgba(10, 22, 40, 0.92)' : 'rgba(248, 246, 240, 0.94)',
    panelBorder: withAlpha(cfg.accent, 0.45),
    titleColor: dark ? '#ffffff' : '#141e27',
    subtitleColor: dark ? '#9ca3af' : '#4b5563',
    accent: cfg.accent,
    fontStack: FONT_STACK,
    scale,
  };
}

/** Keyframes string injected once per style via a plain <style> element (no dangerouslySetInnerHTML). */
export const KEYFRAMES = `
@keyframes zg-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes zg-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) {
  .zg-animated { animation: none !important; }
}
`;
