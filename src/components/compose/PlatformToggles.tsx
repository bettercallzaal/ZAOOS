'use client';

import { useCallback } from 'react';

const PLATFORMS = [
  { id: 'farcaster', name: 'Farcaster', color: '#8A63D2', alwaysOn: true },
  { id: 'lens', name: 'Lens', color: '#00501E' },
  { id: 'bluesky', name: 'Bluesky', color: '#0085FF' },
  { id: 'hive', name: 'Hive', color: '#E31337' },
  { id: 'x', name: 'X', color: '#FFFFFF', adminOnly: true },
] as const;

interface PlatformTogglesProps {
  selectedPlatforms: Set<string>;
  onToggle: (platform: string) => void;
  connectedPlatforms: Set<string>;
  isAdmin: boolean;
}

export function PlatformToggles({
  selectedPlatforms,
  onToggle,
  connectedPlatforms,
  isAdmin,
}: PlatformTogglesProps) {
  const handleToggle = useCallback(
    (platformId: string) => {
      onToggle(platformId);
    },
    [onToggle]
  );

  const visiblePlatforms = PLATFORMS.filter(
    (p) => !('adminOnly' in p && p.adminOnly) || isAdmin
  );

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mb-1">
      {visiblePlatforms.map((platform) => {
        const isAlwaysOn = 'alwaysOn' in platform && platform.alwaysOn;
        const isConnected = isAlwaysOn || connectedPlatforms.has(platform.id);
        const isSelected = isAlwaysOn || selectedPlatforms.has(platform.id);

        return (
          <PlatformPill
            key={platform.id}
            id={platform.id}
            name={platform.name}
            color={platform.color}
            alwaysOn={isAlwaysOn}
            connected={isConnected}
            selected={isSelected}
            onToggle={handleToggle}
          />
        );
      })}
    </div>
  );
}

interface PlatformPillProps {
  id: string;
  name: string;
  color: string;
  alwaysOn: boolean;
  connected: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
}

function PlatformPill({
  id,
  name,
  color,
  alwaysOn,
  connected,
  selected,
  onToggle,
}: PlatformPillProps) {
  // Always-on platform (Farcaster): non-toggleable, always active
  if (alwaysOn) {
    return (
      <span
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
        style={{
          borderColor: color,
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        <CheckIcon />
        {name}
      </span>
    );
  }

  // Not connected: gray, shows tooltip-style info
  if (!connected) {
    return (
      <div className="relative group flex-shrink-0">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-700 text-gray-500 cursor-default"
          aria-label={`${name} - Not connected`}
          tabIndex={0}
        >
          {name}
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block z-10">
          <div className="bg-[#1a2a3a] border border-gray-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
            <p className="text-gray-400 mb-1">Not connected</p>
            <a
              href="/settings"
              className="text-[#f5a623] hover:underline"
            >
              Connect in Settings &rarr;
            </a>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-[#1a2a3a] border-r border-b border-gray-700 rotate-45" />
        </div>
      </div>
    );
  }

  // Connected: toggleable
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
      style={
        selected
          ? {
              borderColor: color,
              backgroundColor: `${color}15`,
              color: color,
            }
          : {
              borderColor: '#374151',
              backgroundColor: 'transparent',
              color: '#9CA3AF',
            }
      }
      aria-label={`${selected ? 'Deselect' : 'Select'} ${name}`}
      aria-pressed={selected}
    >
      {selected && <CheckIcon />}
      {name}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-3 h-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}
