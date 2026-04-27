'use client';

import Link from 'next/link';

interface Props {
  section: string;
  label?: string;
}

/**
 * Tiny "?" icon that links to /stock/team/help#<section>.
 * Drop next to any feature heading so users can self-serve.
 */
export function HelpIcon({ section, label = 'Help' }: Props) {
  return (
    <Link
      href={`/stock/team/help#${section}`}
      title={`What is this? Open the help page.`}
      aria-label={label}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/[0.06] hover:bg-[#f5a623]/30 text-[10px] text-gray-400 hover:text-[#f5a623] transition-colors leading-none"
    >
      ?
    </Link>
  );
}
