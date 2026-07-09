'use client';

import type { OverlayConfig } from './page';
import { tokensFor, KEYFRAMES } from './brand';
import { LiveBadge } from './LiveBadge';
import { Wordmark } from './Wordmark';

interface Props {
  cfg: OverlayConfig;
}

/**
 * Full-width top banner strip: brand wordmark left, message center, LIVE badge right.
 * Good for a persistent header across a workshop scene.
 */
export function TopBanner({ cfg }: Props) {
  const t = tokensFor(cfg);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        className="zg-animated"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 16 * t.scale,
          padding: `${12 * t.scale}px ${28 * t.scale}px`,
          background: t.panelBg,
          borderBottom: `${3 * t.scale}px solid ${t.accent}`,
          backdropFilter: 'blur(6px)',
          animation: 'zg-fade-up 0.5s ease both',
        }}
      >
        <Wordmark logo={cfg.logo} title={cfg.title} tokens={t} />
        {cfg.subtitle && (
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              color: t.titleColor,
              fontFamily: t.fontStack,
              fontWeight: 600,
              fontSize: 16 * t.scale,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cfg.subtitle}
          </div>
        )}
        {!cfg.subtitle && <div style={{ flex: 1 }} />}
        {cfg.live && <LiveBadge accent={t.accent} scale={t.scale} />}
      </div>
    </>
  );
}
