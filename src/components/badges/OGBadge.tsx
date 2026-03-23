/**
 * OGBadge — Founding member badge for ZAO OGs (ZID 1–40).
 * Renders a small gold-bordered pill. Returns null if the user is not an OG.
 */
export function OGBadge({ zid }: { zid: number | null | undefined }) {
  if (!zid || zid < 1 || zid > 40) return null;

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#f5a623] border border-[#f5a623]/60 bg-[#f5a623]/10 rounded-full leading-none">
      OG
    </span>
  );
}
