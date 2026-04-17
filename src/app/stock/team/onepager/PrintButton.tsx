'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[#f5a623] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[#ffd700]"
    >
      Print / Save PDF
    </button>
  );
}
