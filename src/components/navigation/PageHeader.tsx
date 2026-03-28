'use client';

import Link from 'next/link';

export function PageHeader({
  title,
  subtitle,
  backHref = '/home',
  rightAction,
  count,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightAction?: React.ReactNode;
  count?: number;
}) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
      <Link href={backHref} className="text-gray-400 hover:text-white">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-white truncate">{title}</h2>
          {count !== undefined && (
            <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full shrink-0">{count}</span>
          )}
        </div>
        {subtitle && <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>}
      </div>
      {rightAction}
    </header>
  );
}
