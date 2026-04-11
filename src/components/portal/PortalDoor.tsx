'use client';

import { useState } from 'react';

interface PortalDestination {
  name: string;
  url: string;
  description: string;
  external: boolean;
}

interface Portal {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  glowColor: string;
  locked: boolean;
  gateType?: 'allowlist' | 'token';
  destinations: PortalDestination[];
}

interface PortalDoorProps {
  portal: Portal;
  highlighted: boolean;
  onGateCheck?: () => Promise<boolean>;
}

export function PortalDoor({ portal, highlighted, onGateCheck }: PortalDoorProps) {
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleClick = async () => {
    if (portal.locked) {
      if (onGateCheck) {
        setChecking(true);
        setDenied(false);
        try {
          const allowed = await onGateCheck();
          if (allowed) {
            setExpanded(!expanded);
          } else {
            setDenied(true);
            setTimeout(() => setDenied(false), 3000);
          }
        } finally {
          setChecking(false);
        }
      } else {
        setDenied(true);
        setTimeout(() => setDenied(false), 3000);
      }
      return;
    }

    if (portal.destinations.length === 1) {
      const dest = portal.destinations[0];
      if (dest.external) {
        window.open(dest.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = dest.url;
      }
      return;
    }

    setExpanded(!expanded);
  };

  return (
    <div
      className={`relative rounded-2xl border cursor-pointer outline-none h-full
        ${portal.locked ? 'locked border-white/[0.04]' : 'border-white/[0.08]'}
        ${highlighted ? 'ring-2 ring-[#f5a623] ring-offset-2 ring-offset-[#0a1628]' : ''}
        bg-gradient-to-b from-[#0d1b2a] to-[#0a1628] overflow-hidden`}
      style={{ '--glow-color': portal.glowColor } as React.CSSProperties}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }}}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      aria-label={`${portal.title} portal${portal.locked ? ' (locked)' : ''}`}
    >
      {/* Arch glow at top */}
      <div className="portal-arch" style={{ '--glow-color': portal.glowColor } as React.CSSProperties} />

      {/* Inner glow effect */}
      <div className="portal-inner-glow" style={{ '--glow-color': portal.glowColor } as React.CSSProperties} />

      {/* Drop shadow beneath */}
      <div className="portal-door-shadow" />

      {/* Door content */}
      <div className="relative z-10 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${portal.glowColor}15, ${portal.glowColor}05)` }}
          >
            <span className="text-2xl" role="img" aria-hidden="true">{portal.icon}</span>
          </div>
          {portal.locked && (
            <span className="lock-pulse text-lg" role="img" aria-label="locked">🔒</span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white tracking-wide mb-1"
          style={{ textShadow: `0 0 20px ${portal.glowColor}20` }}
        >
          {portal.title}
        </h3>
        <p className="text-xs text-gray-400 mb-2">
          {portal.subtitle}
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: portal.glowColor, opacity: 0.6 }} />
          <p className="text-[10px] text-gray-500">
            {portal.destinations.length} destination{portal.destinations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Denied message */}
        {denied && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">
              {portal.gateType === 'token'
                ? 'Token required to enter this portal'
                : 'Members only - join The ZAO to unlock'}
            </p>
          </div>
        )}

        {/* Checking spinner */}
        {checking && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: portal.glowColor, borderTopColor: 'transparent' }} />
            <span className="text-xs text-gray-400">Checking access...</span>
          </div>
        )}

        {/* Destinations list */}
        <div className={`portal-destinations mt-3 ${expanded ? 'visible' : ''}`}>
          <div className="space-y-1 pt-3 border-t border-white/[0.06]">
            {portal.destinations.map((dest) => (
              <a
                key={dest.name}
                href={dest.url}
                target={dest.external ? '_blank' : undefined}
                rel={dest.external ? 'noopener noreferrer' : undefined}
                onClick={(e) => e.stopPropagation()}
                className="portal-dest-link flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] group"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white group-hover:transition-colors"
                    style={{ '--tw-text-opacity': 1 } as React.CSSProperties}
                    onMouseEnter={(e) => (e.currentTarget.style.color = portal.glowColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                  >
                    {dest.name}
                  </span>
                  <p className="text-[10px] text-gray-500 truncate">{dest.description}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {dest.external
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  }
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
