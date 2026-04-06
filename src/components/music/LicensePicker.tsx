'use client';

interface LicensePickerProps {
  value: string;
  onChange: (preset: string) => void;
}

const PRESETS = [
  { id: 'collectible', name: 'Collectible', desc: 'Free to listen, buy to own. 25% royalty on remixes.', badge: 'Recommended' },
  { id: 'community', name: 'Community Share', desc: 'Free with credit. Others can remix with attribution.', badge: null },
  { id: 'premium', name: 'Premium', desc: 'Pay to access. No remixing or commercial use.', badge: null },
  { id: 'open', name: 'Open', desc: 'Full creative commons. Anyone can use freely.', badge: null },
] as const;

export default function LicensePicker({ value, onChange }: LicensePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">How should people use your music?</p>
      {PRESETS.map(preset => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
            value === preset.id
              ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-white'
              : 'bg-[#0a1628] border-white/[0.08] text-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
              value === preset.id ? 'border-[#f5a623] bg-[#f5a623]' : 'border-gray-600'
            }`} />
            <span className="text-sm font-medium">{preset.name}</span>
            {preset.badge && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623]">{preset.badge}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 ml-5">{preset.desc}</p>
        </button>
      ))}
    </div>
  );
}
