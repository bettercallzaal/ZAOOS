'use client';

import Link from 'next/link';

interface PillarCardProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

export function PillarCard({ icon, label, href, badge }: PillarCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-[#0d1b2a] border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-[#f5a623]/30 transition-all hover:bg-[#0d1b2a]/80"
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#f5a623] text-[10px] font-bold text-black px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div className="w-10 h-10 flex items-center justify-center text-gray-400 group-hover:text-[#f5a623] transition-colors">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </Link>
  );
}
