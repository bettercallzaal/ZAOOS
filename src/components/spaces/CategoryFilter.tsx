'use client';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'ama', label: 'AMA' },
  { id: 'chill', label: 'Chill' },
  { id: 'dj-set', label: 'DJ Set' },
];

interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
            value === cat.id
              ? 'bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/40'
              : 'text-gray-500 border-white/[0.08] hover:border-gray-600 hover:text-gray-400'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
