'use client';

import type { OverlayConfig } from './page';
import { tokensFor, withAlpha, KEYFRAMES } from './brand';

interface Props {
  cfg: OverlayConfig;
}

/** Preset copy per scene, overridable by ?title=/?subtitle=. */
const SCENE_PRESETS: Record<string, { title: string; subtitle: string }> = {
  starting: { title: 'Starting Soon', subtitle: 'Grab a seat — we go live shortly' },
  brb: { title: 'Be Right Back', subtitle: 'Back in a moment' },
  thanks: { title: 'Thanks for Watching', subtitle: 'See you next session' },
  custom: { title: 'ZABAL GAMES', subtitle: '' },
};

/**
 * Full-screen scene card for the between-content moments: starting / brb / thanks / custom.
 * Centered wordmark + big headline + subtitle over a full-bleed branded ground.
 * ?title= and ?subtitle= override the preset copy.
 */
export function SceneCard({ cfg }: Props) {
  const t = tokensFor(cfg);
  const preset = SCENE_PRESETS[cfg.scene] || SCENE_PRESETS.custom;
  // page.tsx defaults title to "ZABAL GAMES" — treat that as "unset" so the preset headline wins.
  const headline = cfg.title && cfg.title !== 'ZABAL GAMES' ? cfg.title : preset.title;
  const sub = cfg.subtitle || preset.subtitle;
  const dark = cfg.theme === 'dark';

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 8 * t.scale,
          background: dark
            ? `radial-gradient(circle at 50% 40%, ${withAlpha(cfg.accent, 0.18)}, rgba(10,22,40,0.97) 60%)`
            : `radial-gradient(circle at 50% 40%, ${withAlpha(cfg.accent, 0.14)}, rgba(248,246,240,0.98) 60%)`,
          fontFamily: t.fontStack,
        }}
      >
        <div
          className="zg-animated"
          style={{ animation: 'zg-fade-up 0.6s ease both', maxWidth: '80vw' }}
        >
          {cfg.logo ? (
            <img
              src={cfg.logo}
              alt={cfg.title}
              style={{ height: 72 * t.scale, width: 'auto', objectFit: 'contain', marginBottom: 24 * t.scale }}
            />
          ) : (
            <div
              style={{
                color: t.accent,
                fontWeight: 800,
                fontSize: 20 * t.scale,
                letterSpacing: 4,
                textTransform: 'uppercase',
                marginBottom: 20 * t.scale,
              }}
            >
              {cfg.title}
            </div>
          )}
          <div
            style={{
              color: t.titleColor,
              fontWeight: 800,
              fontSize: 64 * t.scale,
              letterSpacing: -1,
              lineHeight: 1.05,
              textWrap: 'balance',
            }}
          >
            {headline}
          </div>
          {sub && (
            <div
              style={{
                color: t.subtitleColor,
                fontSize: 24 * t.scale,
                marginTop: 16 * t.scale,
                textWrap: 'balance',
              }}
            >
              {sub}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
