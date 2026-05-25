import type { JukeParticipantEntry } from '@/lib/spaces/jukeSpacesDb';

/**
 * "N ZAO members here" badge above the Juke iframe on /live/{id}. Reads from
 * the `participants` jsonb on the space row (populated by participant.joined /
 * participant.left webhooks). Server-rendered — refreshes only on a page
 * reload, which is fine for v1: this is a passive ambient signal, not a
 * realtime presence list.
 *
 * Limits the visible name list to the first 6 distinct display names; any
 * extras collapse into a +N pill so the badge stays single-line on mobile.
 *
 * Hidden entirely when there are zero known participants — the iframe already
 * shows a generic listener count, so an empty wrapper here would be noise.
 */
export function JukeListenerBadge({
  participants,
  participantCount,
}: {
  participants: JukeParticipantEntry[] | null | undefined;
  participantCount: number;
}) {
  const arr = Array.isArray(participants) ? participants : [];
  if (arr.length === 0 && participantCount <= 0) return null;

  // Distinct by FID so a join/leave/join sequence does not double-list.
  const distinct = new Map<number, JukeParticipantEntry>();
  for (const p of arr) {
    if (!distinct.has(p.fid)) distinct.set(p.fid, p);
  }
  const list = Array.from(distinct.values());
  const visible = list.slice(0, 6);
  const overflow = Math.max(0, list.length - visible.length);
  const headlineCount = Math.max(list.length, participantCount);

  return (
    <div className="w-full max-w-md rounded-2xl border border-[#855dcd]/30 bg-[#855dcd]/[0.06] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a78bfa]" aria-hidden="true" />
        {headlineCount} ZAO {headlineCount === 1 ? 'member' : 'members'} here
      </div>
      {visible.length > 0 && (
        <ul className="mt-2 flex flex-wrap items-center gap-1.5">
          {visible.map((p) => {
            const label =
              p.display_name && p.display_name.trim().length > 0
                ? p.display_name
                : `fid ${p.fid}`;
            return (
              <li key={p.fid}>
                <a
                  href={`https://farcaster.xyz/~/profiles/${p.fid}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0d1b2a] px-2 py-0.5 text-[11px] text-gray-300 hover:border-[#a78bfa]/40 hover:text-white transition-colors"
                  title={`FID ${p.fid}`}
                >
                  {p.role === 'host' && (
                    <span
                      className="text-[#f5a623]"
                      aria-label="host"
                      title="host"
                    >
                      *
                    </span>
                  )}
                  {label}
                </a>
              </li>
            );
          })}
          {overflow > 0 && (
            <li className="rounded-full border border-white/[0.08] bg-[#0d1b2a] px-2 py-0.5 text-[11px] text-gray-500">
              +{overflow} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
