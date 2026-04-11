'use client';

import { useState, useEffect } from 'react';
import { PORTALS } from '@/lib/portal/destinations';
import { PortalDoor } from './PortalDoor';
import { PortalConcierge } from './PortalConcierge';
import { checkAllowlistGate } from './PortalGate';
import './portal.css';

export function PortalHub() {
  const [highlightedPortal, setHighlightedPortal] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRecommendation = (portalId: string) => {
    setHighlightedPortal(portalId);
    setTimeout(() => setHighlightedPortal(null), 5000);

    const el = document.getElementById(`portal-${portalId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getGateCheck = (portal: typeof PORTALS[number]) => {
    if (!portal.locked) return undefined;
    return checkAllowlistGate;
  };

  // Deterministic particle positions (avoid hydration mismatch)
  const particles = [
    { left: 10, top: 15, dur: 7, delay: 0, dx: 25, dy: -35, size: 3 },
    { left: 25, top: 8, dur: 9, delay: 1, dx: -20, dy: -45, size: 2 },
    { left: 40, top: 20, dur: 11, delay: 2, dx: 30, dy: -25, size: 4 },
    { left: 55, top: 5, dur: 8, delay: 0.5, dx: -15, dy: -50, size: 2 },
    { left: 70, top: 18, dur: 10, delay: 3, dx: 20, dy: -30, size: 3 },
    { left: 85, top: 12, dur: 7.5, delay: 1.5, dx: -25, dy: -40, size: 2 },
    { left: 15, top: 45, dur: 12, delay: 4, dx: 15, dy: -20, size: 3 },
    { left: 50, top: 50, dur: 9, delay: 2.5, dx: -30, dy: -35, size: 4 },
    { left: 80, top: 40, dur: 8, delay: 0, dx: 20, dy: -45, size: 2 },
    { left: 35, top: 60, dur: 10, delay: 3.5, dx: -10, dy: -30, size: 3 },
    { left: 65, top: 55, dur: 11, delay: 1, dx: 25, dy: -25, size: 2 },
    { left: 90, top: 30, dur: 8.5, delay: 2, dx: -20, dy: -50, size: 3 },
    { left: 5, top: 70, dur: 13, delay: 0, dx: 30, dy: -20, size: 4 },
    { left: 45, top: 75, dur: 7, delay: 4.5, dx: -25, dy: -35, size: 2 },
    { left: 75, top: 65, dur: 9.5, delay: 1.5, dx: 15, dy: -40, size: 3 },
  ];

  return (
    <div className="portal-room bg-[#0a1628]">
      {/* Back wall with ambient light */}
      <div className="portal-wall" />

      {/* Floor with grid lines */}
      <div className="portal-floor" />

      {/* Center light beam */}
      <div className="portal-light-beam" />

      {/* Floating particles */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p, i) => (
            <div
              key={i}
              className="portal-particle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                '--duration': `${p.dur}s`,
                '--delay': `${p.delay}s`,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Ambient glows */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#f5a623]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-1/4 w-[400px] h-[400px] bg-[#5865F2]/[0.02] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-1/4 w-[400px] h-[400px] bg-[#10b981]/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 pt-10 pb-6 px-6 text-center">
        <div className="inline-block mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#ffd700]/10 border border-[#f5a623]/20 flex items-center justify-center mx-auto shadow-lg shadow-[#f5a623]/10">
            <span className="text-3xl">🏛️</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent tracking-tight">
          THE ZAO
        </h1>
        <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">Choose your portal</p>
        <div className="mt-3 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#f5a623]/40 to-transparent mx-auto" />
      </header>

      {/* Portal Grid - 3D perspective scene */}
      <main className="relative z-10 px-4 sm:px-8 pb-32 max-w-5xl mx-auto">
        <div className="portal-grid grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {PORTALS.map((portal) => (
            <div
              key={portal.id}
              id={`portal-${portal.id}`}
              className="portal-door"
            >
              <PortalDoor
                portal={portal}
                highlighted={highlightedPortal === portal.id}
                onGateCheck={getGateCheck(portal)}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/90 to-transparent pt-10 pb-4 px-4">
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600">
          <a href="https://zaoos.com" className="hover:text-gray-400 transition-colors">zaoos.com</a>
          <span className="text-[#f5a623]/20">◆</span>
          <span>Powered by THE ZAO</span>
        </div>
      </footer>

      {/* AI Concierge */}
      <PortalConcierge onRecommend={handleRecommendation} />
    </div>
  );
}
