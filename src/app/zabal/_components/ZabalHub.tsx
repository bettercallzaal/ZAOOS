// Static hub sections for the ZABAL landing page (zaoos.com/zabal).
// Server components - no client JS. Spec: research Doc 708.

import React from 'react';

const GOLD = '#e0ddaa';
const DIM = '#a0a0a0';
const PANEL = 'rgba(20, 30, 39, 0.6)';
const BORDER = 'rgba(224, 221, 170, 0.2)';

// ---------------------------------------------------------------
// Anchored top nav
// ---------------------------------------------------------------

const NAV = [
  ['#vote', 'Vote'],
  ['#token', 'Token'],
  ['#ecosystem', 'Ecosystem'],
  ['#spotlight', 'Spotlight'],
  ['#about', 'About'],
] as const;

export function ZabalNav() {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        gap: '1.25rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '0.85rem 1rem',
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {NAV.map(([href, label]) => (
        <a
          key={href}
          href={href}
          style={{ color: DIM, fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------
// $ZABAL token panel
// ---------------------------------------------------------------

export function ZabalTokenPanel() {
  return (
    <section id="token" style={{ padding: '2.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={sectionTitle()}>$ZABAL</h2>
      <div
        style={{
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: '1.75rem',
        }}
      >
        <p style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' }}>
          $ZABAL is the token at the center of the ZABAL universe - launched Jan 1 2026 on Base.
          Holding it and showing up in /zao both feed your weekly vote power.
        </p>
        <p style={{ color: DIM, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Vote power = base 1 + /zao cast activity + Neynar score, capped at 6. Hold $ZABAL and
          stay active to vote heavier.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="https://empirebuilder.world" target="_blank" rel="noopener noreferrer" style={primaryCta()}>
            Hold $ZABAL
          </a>
          <a
            href="https://songjam.space/zabal"
            target="_blank"
            rel="noopener noreferrer"
            style={secondaryCta()}
          >
            $ZABAL Empire leaderboard
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------
// Ecosystem portals grid
// ---------------------------------------------------------------

interface Portal {
  name: string;
  url: string;
  blurb: string;
  badge: string;
}

const PORTALS: Portal[] = [
  { name: 'The ZAO', url: 'https://thezao.com', blurb: 'The artist org - ~190 members on Base.', badge: 'Org' },
  { name: 'ZAO Festivals', url: 'https://zaofestivals.com', blurb: 'ZAOstock, ZAO-PALOOZA, ZAO CHELLA.', badge: 'Events' },
  { name: 'WaveWarZ', url: 'https://www.wavewarz.com', blurb: 'Onchain music battles.', badge: 'Music' },
  { name: 'ZAO OS', url: 'https://zaoos.com', blurb: 'The community operating system.', badge: 'Platform' },
  { name: 'BCZ YapZ', url: 'https://bczyapz.com', blurb: 'The podcast - Web3, music, building.', badge: 'Media' },
  { name: 'ZAO Nexus', url: 'https://www.thezao.com/nexus', blurb: 'The full ecosystem link directory.', badge: 'Directory' },
  { name: 'Empire Builder', url: 'https://empirebuilder.world', blurb: 'Where $ZABAL lives onchain.', badge: 'Token' },
  { name: 'BetterCallZaal', url: 'https://bettercallzaal.com', blurb: 'Zaal’s personal brand + studio.', badge: 'Brand' },
];

export function ZabalEcosystem() {
  return (
    <section id="ecosystem" style={{ padding: '2.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={sectionTitle()}>Ecosystem</h2>
      <p style={{ color: DIM, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Everything under the ZABAL umbrella - one tap away.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {PORTALS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: '1.25rem',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.05rem' }}>{p.name}</strong>
              <span
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: GOLD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                {p.badge}
              </span>
            </div>
            <span style={{ color: DIM, fontSize: '0.85rem' }}>{p.blurb}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------
// About ZABAL + socials footer
// ---------------------------------------------------------------

interface Social {
  label: string;
  url: string;
}

const SOCIALS: Social[] = [
  { label: 'BCZ on X', url: 'https://x.com/BetterCallZaal' },
  { label: 'BCZ on Farcaster', url: 'https://warpcast.com/bettercallzaal' },
  { label: 'The ZAO on X', url: 'https://x.com/TheZAODAO' },
  { label: '/thezao channel', url: 'https://warpcast.com/~/channel/thezao' },
  { label: 'ZAO Festivals', url: 'https://x.com/ZAOFestivals' },
  { label: 'WaveWarZ', url: 'https://x.com/WaveWarZ' },
  { label: 'Discord', url: 'https://discord.gg/thezao' },
  { label: 'Paragraph', url: 'https://paragraph.xyz/@thezao' },
];

export function ZabalAbout() {
  return (
    <section
      id="about"
      style={{
        padding: '2.5rem 2rem 3.5rem',
        maxWidth: 960,
        margin: '0 auto',
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <h2 style={sectionTitle()}>About ZABAL</h2>
      <p style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
        ZABAL is the umbrella over everything Zaal builds: BetterCallZaal (the personal brand +
        studio), The ZAO (the artist org), and incubated projects like WaveWarZ and ZAO Festivals -
        all tied together by the $ZABAL token.
      </p>
      <p style={{ color: DIM, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        This page is the front door. Vote weekly on where it goes.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: GOLD,
              fontSize: '0.82rem',
              textDecoration: 'none',
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              padding: '5px 12px',
            }}
          >
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------
// shared style helpers
// ---------------------------------------------------------------

function sectionTitle(): React.CSSProperties {
  return {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: GOLD,
  };
}

function primaryCta(): React.CSSProperties {
  return {
    background: GOLD,
    color: '#0a0a0a',
    fontWeight: 700,
    fontSize: '0.9rem',
    padding: '0.65rem 1.4rem',
    borderRadius: 10,
    textDecoration: 'none',
  };
}

function secondaryCta(): React.CSSProperties {
  return {
    background: 'transparent',
    color: GOLD,
    fontWeight: 700,
    fontSize: '0.9rem',
    padding: '0.65rem 1.4rem',
    borderRadius: 10,
    textDecoration: 'none',
    border: `1px solid ${BORDER}`,
  };
}
