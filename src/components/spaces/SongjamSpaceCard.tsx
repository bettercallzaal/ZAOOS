import Link from 'next/link';
import { SONGJAM_SPACE_DESCRIPTION, SONGJAM_SPACE_LABEL } from '@/lib/spaces/songjam';

/**
 * Persistent entry point to the Songjam-hosted $ZABAL live audio space, shown
 * on the Spaces "Live" tab. Unlike Stream/100ms/Juke rooms (created per-event),
 * this is one always-available community space embedded at /spaces/songjam.
 */
export function SongjamSpaceCard() {
  return (
    <section className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22d3ee]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]" aria-hidden="true" />
        Live on Songjam
      </h3>
      <Link
        href="/spaces/songjam"
        aria-label={`Open ${SONGJAM_SPACE_LABEL} on Songjam`}
        className="group block rounded-xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#0d1b2a] to-[#0e2230] p-4 transition-all hover:border-[#22d3ee]/60 hover:shadow-lg hover:shadow-[#22d3ee]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="truncate font-bold text-white">{SONGJAM_SPACE_LABEL}</h4>
              <span className="rounded-full bg-[#22d3ee]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#22d3ee]">
                Songjam
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-gray-400">{SONGJAM_SPACE_DESCRIPTION}</p>
          </div>
          <span className="inline-flex flex-shrink-0 items-center rounded-lg bg-[#22d3ee] px-4 py-2 text-xs font-bold text-[#0a1628] transition-colors group-hover:bg-[#67e8f9]">
            Open
          </span>
        </div>
      </Link>
    </section>
  );
}
