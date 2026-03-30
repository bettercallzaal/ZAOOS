'use client';

interface SpacesTabsProps {
  active: string;
  onChange: (tab: string) => void;
  liveBadge?: number;
  upcomingBadge?: number;
}

const TABS = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

export default function SpacesTabs({ active, onChange, liveBadge, upcomingBadge }: SpacesTabsProps) {
  const badges: Record<string, number | undefined> = {
    live: liveBadge,
    upcoming: upcomingBadge,
  };

  return (
    <div className="flex border-b border-gray-800">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? 'text-[#f5a623]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {tab.label}
            {badges[tab.id] && badges[tab.id]! > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab.id === 'live'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[#f5a623]/15 text-[#f5a623]'
              }`}>
                {badges[tab.id]}
              </span>
            )}
          </span>
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5a623] rounded-t" />
          )}
        </button>
      ))}
    </div>
  );
}
