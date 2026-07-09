'use client';

import type { OverlayConfig } from './page';
import { tokensFor, withAlpha, KEYFRAMES } from './brand';
import { LiveBadge } from './LiveBadge';

interface Props {
  cfg: OverlayConfig;
}

/**
 * Bottom lower-third: accent rule + logo/title + subtitle, optional LIVE badge.
 * Positioned bottom-left (default) or bottom-right via ?pos=. The workhorse overlay.
 */
export function LowerThird({ cfg }: Props) {
  const t = tokensFor(cfg);
  const alignRight = cfg.pos === 'right';

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 48 * t.scale,
          left: alignRight ? undefined : 48 * t.scale,
          right: alignRight ? 48 * t.scale : undefined,
          maxWidth: '60vw',
        }}
      >
        <div
          className="zg-animated"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16 * t.scale,
            padding: `${14 * t.scale}px ${20 * t.scale}px`,
            background: t.panelBg,
            borderLeft: alignRight ? undefined : `${4 * t.scale}px solid ${t.accent}`,
            borderRight: alignRight ? `${4 * t.scale}px solid ${t.accent}` : undefined,
            borderRadius: 10,
            boxShadow: `0 8px 30px ${withAlpha('#000000', 0.35)}`,
            backdropFilter: 'blur(6px)',
            animation: 'zg-fade-up 0.5s ease both',
          }}
        >
          {cfg.logo && (
            <img
              src={cfg.logo}
              alt={cfg.title}
              style={{ height: 44 * t.scale, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: t.titleColor,
                fontFamily: t.fontStack,
                fontWeight: 800,
                fontSize: 22 * t.scale,
                letterSpacing: 0.3,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cfg.title}
            </div>
            {cfg.subtitle && (
              <div
                style={{
                  color: t.subtitleColor,
                  fontFamily: t.fontStack,
                  fontSize: 15 * t.scale,
                  marginTop: 3 * t.scale,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cfg.subtitle}
              </div>
            )}
          </div>
          {cfg.live && <LiveBadge accent={t.accent} scale={t.scale} />}
        </div>
      </div>
    </>
  );
}
