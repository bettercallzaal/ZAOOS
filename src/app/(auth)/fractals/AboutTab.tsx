'use client';

export function AboutTab() {
  const FIBONACCI = [
    { rank: '1st', x1: 55, x2: 110 },
    { rank: '2nd', x1: 34, x2: 68 },
    { rank: '3rd', x1: 21, x2: 42 },
    { rank: '4th', x1: 13, x2: 26 },
    { rank: '5th', x1: 8, x2: 16 },
    { rank: '6th', x1: 5, x2: 10 },
  ];

  const LINKS = [
    { label: 'zao.frapps.xyz', href: 'https://zao.frapps.xyz', desc: 'ZAO fractal app' },
    { label: 'of.frapps.xyz', href: 'https://of.frapps.xyz', desc: 'ORDAO governance UI' },
    { label: 'Optimystics', href: 'https://optimystics.io', desc: 'Fractal governance toolkit' },
    { label: 'ORDAO Docs', href: 'https://optimystics.io/ordao', desc: 'How ORDAO works' },
    { label: 'The Respect Game', href: 'https://optimystics.io/introducing-the-respect-game', desc: 'Learn the fundamentals' },
  ];

  return (
    <div className="pt-2 space-y-6">
      <div className="bg-[#0d1b2a] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">What is the Respect Game?</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          ZAO runs weekly fractal governance sessions where members split into groups of 3-6. Each person
          shares recent contributions for ~4 minutes. The group then ranks contributions by consensus (2/3+
          agreement required). Rankings earn Respect tokens on Optimism — permanently on-chain.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Respect is non-transferable. It reflects real community contribution over time, and gates
          governance rights via ORDAO.
        </p>
      </div>

      <div className="bg-[#0d1b2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Fibonacci Scoring</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left pb-2">Rank</th>
              <th className="text-right pb-2">1x Era</th>
              <th className="text-right pb-2">2x Era</th>
            </tr>
          </thead>
          <tbody>
            {FIBONACCI.map((row) => (
              <tr key={row.rank} className="border-b border-gray-800/50">
                <td className="py-1.5 text-gray-300">{row.rank}</td>
                <td className="py-1.5 text-right font-mono text-[#f5a623]">{row.x1} R</td>
                <td className="py-1.5 text-right font-mono text-[#f5a623]">{row.x2} R</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-600 mt-3">
          Scores follow Fibonacci sequence — each rank earns ~60% more than the next (Weber Law).
          ZAO is currently in the 2x era.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Resources</p>
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-[#0d1b2a] rounded-xl px-4 py-3 border border-gray-800 hover:border-[#f5a623]/30 transition-colors"
          >
            <div>
              <p className="text-sm text-white">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
