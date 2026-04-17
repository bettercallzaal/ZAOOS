'use client';

interface Item {
  id: string;
  title: string;
  reason: string;
}

export function AttentionCard({ items }: { items: Item[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-lg border border-amber-500/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">⚠ Top {items.length} Need Attention</p>
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2 text-xs">
          <span className="text-amber-400 flex-shrink-0">→</span>
          <div className="min-w-0">
            <p className="text-white truncate">{item.title}</p>
            <p className="text-[10px] text-amber-500/80">{item.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
