import type { Metadata } from 'next';
import Link from 'next/link';

// zaoos.com/artizen — public page for the ZAO Fund for Emerging Culture, the
// community match fund Zaal directs on Artizen (artizen.fund). Static, server-
// rendered from the Season 6 roster captured 2026-06-11. Source of truth +
// provenance: research/business/843-zao-fund-artizen-roster-june2026.
// Numbers are a point-in-time snapshot; the live fund is the canonical figure.

const FUND_URL = 'https://artizen.thezao.com/';
const SNAPSHOT_DATE = 'June 11, 2026';

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og',
  button: {
    title: 'ZAO Fund for Emerging Culture',
    action: { type: 'launch_miniapp', url: 'https://zaoos.com/artizen', name: 'ZAO OS' },
  },
});

export const metadata: Metadata = {
  title: 'ZAO Fund for Emerging Culture | ZAO OS',
  description:
    'The ZAO Fund for Emerging Culture on Artizen — a community match fund backing artists and technologists building collaborative cultural experiences. 32 projects, Season 6.',
  openGraph: {
    title: 'ZAO Fund for Emerging Culture',
    description:
      'A community match fund backing 32 projects at the intersection of art, emerging tech, and community.',
  },
  other: { 'fc:miniapp': miniAppEmbed },
};

interface Project {
  rank: number;
  name: string;
  creator: string;
  sales: number;
  match: number;
  category: string;
  blurb: string;
  zaoTie?: string;
}

// ZAO Fund for Emerging Culture, Artizen Season 6 — full Competition roster,
// ranked by artifact sales as of the snapshot date. See doc 843 for sources.
const PROJECTS: Project[] = [
  { rank: 1, name: 'InfiniteZero Network', creator: 'Abraham Nash', sales: 45108, match: 502, category: 'DeSci / AI', blurb: 'Decentralized AI training network (DIN) out of Oxford — data stays local, models go to the commons.', zaoTie: 'Researched in the ZAO library (doc 760)' },
  { rank: 2, name: 'Edge Esmeralda 2026', creator: 'Telamon Ardavanis', sales: 30569, match: 2677, category: 'Human Flourishing', blurb: 'A month-long gathering in Northern California for people building a brighter future (May 30 - June 27, 2026).', zaoTie: 'ZAO x Edge City collaboration channel open' },
  { rank: 3, name: 'Voices of the Land', creator: 'Yessie', sales: 23236, match: 0, category: 'Music', blurb: 'From women to the world — a journey of voice and vibration. Music, stories, and sacred sounds.' },
  { rank: 4, name: 'Edge City Fellowship', creator: 'Telamon Ardavanis', sales: 10567, match: 1557, category: 'Fellowship', blurb: 'A fellowship funding exceptional builders under 25 to spend a month at Edge City on frontier fields.' },
  { rank: 5, name: 'Gaian Temple', creator: 'NAOBA', sales: 7797, match: 939, category: 'Sound', blurb: 'Temple of Sound: listening experiments, concerts, installations, and biosphere network communication.' },
  { rank: 6, name: 'Coralverse - Reef Revival', creator: 'ZCreative Media', sales: 7464, match: 0, category: 'Gaming', blurb: 'Combining adventure gaming with real-world reef conservation.' },
  { rank: 7, name: 'Memethology', creator: 'Colton', sales: 6684, match: 508, category: 'Community', blurb: 'A trading card game about tech, culture, and human flourishing.' },
  { rank: 8, name: 'HERITAGE COLLECTION: Fashion, Music & Blockchain Show', creator: 'Gneric', sales: 5810, match: 634, category: 'Fashion', blurb: 'A multidisciplinary fashion, music, and blockchain showcase.' },
  { rank: 9, name: 'ToGather Project, Documenting Living Systems', creator: 'Sharon', sales: 5712, match: 45, category: 'Community', blurb: 'Better communities are being built right now. This platform is where their experience becomes part of the commons.' },
  { rank: 10, name: 'HOPE', creator: 'JED XO', sales: 5665, match: 669, category: 'Discovery', blurb: 'An EP of five experimental tracks ministering hope out of brokenness.' },
  { rank: 11, name: 'ENTERTAINMENT EVOLVED', creator: 'Matthew Chan', sales: 4910, match: 200, category: '360 Experience', blurb: 'You will believe a man can become content.' },
  { rank: 12, name: "The Owl's Nest: Regenerative Arts Gathering", creator: 'Eska', sales: 4549, match: 0, category: 'Regenerative Culture', blurb: 'A 5-day gathering of 50 makers on a reforestation site: land art, ritual, and ecological skill-sharing.' },
  { rank: 13, name: 'Regen Reef', creator: 'MesoReefDAO', sales: 4469, match: 50, category: 'ReFi', blurb: 'Marine biotech, socio-ecological restoration, and ReFi — modular wet labs for coral and fish.' },
  { rank: 14, name: 'Cinemetropolis', creator: 'Jeff Desom', sales: 3645, match: 615, category: 'Mixed Reality', blurb: 'A mixed-reality world where AR expands real miniatures into one connected movie universe you can step inside.' },
  { rank: 15, name: 'Sonic Sanctuary: A Journey Through Sound', creator: 'Plexonerz', sales: 3562, match: 270, category: 'Electronic Music', blurb: 'Electronic music as a sonic journey — introspection and the feeling that resides deep within us.' },
  { rank: 16, name: 'International Artists Project', creator: 'International Artists Project', sales: 3215, match: 270, category: 'Community', blurb: 'A global music community uplifting artists born in every country, preserving hundreds of languages and genres.' },
  { rank: 17, name: 'CHAINWARS .wtf — Cypherpunk Space-Opera', creator: 'Fly you fools .wtf', sales: 2072, match: 107, category: 'Journalism', blurb: "An epic docu-myth from inside crypto's war room. Stories the whitepapers were protecting you from." },
  { rank: 18, name: 'THE NEW VANGUARD', creator: 'Enrico', sales: 1965, match: 250, category: 'Photography', blurb: 'A cinematic archive of Nigerian identity, documenting a generation and educating communities on Web3 cultural preservation.' },
  { rank: 19, name: 'DeSci Asia', creator: 'Swift Evo', sales: 1870, match: 0, category: 'DeSci', blurb: 'Building bridges, sharing knowledge, and fostering growth for DeSci communities in Asia.' },
  { rank: 20, name: 'Participatory Spatial Music Show', creator: 'Joel DeJong', sales: 1375, match: 0, category: 'Participatory Art', blurb: 'A live, co-created entertainment series.' },
  { rank: 21, name: 'HuRya Empowerment Foundation (Poly Raiders)', creator: 'Poly Raiders', sales: 1190, match: 40, category: 'Impact', blurb: "Web3 art fuels dignity for thousands of girls through pads, kids' education, and a vocational center." },
  { rank: 22, name: 'The Creator Block', creator: 'KOSBAA', sales: 1080, match: 500, category: 'Creator Economy', blurb: 'A two-day summit where creators showcase their work and learn how to own it onchain.' },
  { rank: 23, name: 'THE ART FACTORY', creator: 'Gidzeey', sales: 978, match: 58, category: 'Music', blurb: 'One stage play each month telling Nigerian stories, paying creatives, and using Web3 to build lasting support.' },
  { rank: 24, name: 'The MOTHERLand Project', creator: 'Tarzaa Gerald Caesar (CZA OF REM)', sales: 950, match: 0, category: 'Infrastructure', blurb: 'A women-led cultural infrastructure uniting music, film, AI tools, and digital ownership.' },
  { rank: 25, name: 'The Space — a Home for Activists in Israel-Palestine', creator: 'Sapirs55', sales: 925, match: 0, category: 'Peacebuilding', blurb: 'A protected community space for activists building justice, solidarity, and political imagination.' },
  { rank: 26, name: 'Ear of Dionysus: Listening as a Frontier Technology', creator: 'The Decentralised Cult of Quantum Listening', sales: 480, match: 80, category: 'Sound', blurb: 'An immersive sound lab and sonic theater at ancient sites, exploring quantum listening through Dionysian ritual.' },
  { rank: 27, name: 'Artisanal Intelligence', creator: 'KNOTTO', sales: 400, match: 0, category: 'Craftsmanship', blurb: 'An exhibition world tour about endangered crafts, design, and cultural exchange between Europe and Japan.' },
  { rank: 28, name: 'America 250 - Echoes of Freedom AR Tour', creator: 'Trishgiaart', sales: 385, match: 0, category: 'Augmented Reality', blurb: 'A site-specific augmented reality public-art and history XR project.' },
  { rank: 29, name: 'Thread of Hope', creator: 'whyldwanderer', sales: 215, match: 0, category: 'Women Empowerment', blurb: 'Palestinian women in Cairo rebuilding identity, community, and livelihoods through the living tradition of Tatreez.' },
  { rank: 30, name: 'Hip-Hop Africa', creator: 'Hiphop Africa', sales: 110, match: 0, category: 'Multi-Media', blurb: 'Building a unified platform for African hip hop through community, online radio, events, festivals, and awards.' },
  { rank: 31, name: 'ANFT', creator: 'Amin', sales: 80, match: 0, category: 'Digital Art', blurb: 'A decentralized, authorship-first digital painting marketplace where every artwork is painted within the platform.' },
  { rank: 32, name: 'The Impact Concerts', creator: 'EZinCrypto', sales: 30, match: 30, category: 'Music', blurb: 'Bringing awareness to social-good projects with cultural exchange through live music between project speakers.' },
];

const ELIGIBILITY: string[] = [
  'Creator-owned and independently operated',
  'Integrates emerging tech (blockchain, AI, decentralized tools, immersive media) in a meaningful way',
  'Demonstrates active collaboration or meaningful community participation',
  'Builds in public by sharing process, progress, or outcomes openly',
  'Operates within a non-extractive, fair-compensation framework',
  'Culminates in a public-facing, real-world activation (performance, installation, gathering, exhibition, release, or showcase)',
];

function usd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
      <div className="text-xl font-bold text-[#f5a623] sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs text-white/60">{label}</div>
    </div>
  );
}

export const revalidate = 3600; // ISR: refresh hourly

export default function ArtizenPage() {
  const totalSales = PROJECTS.reduce((sum, p) => sum + p.sales, 0);

  return (
    <main className="min-h-screen bg-[#0a1628] text-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f5a623]">
            The ZAO on Artizen
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            ZAO Fund for Emerging Culture
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            A community match fund backing independent musicians, visual artists, technologists, and
            community organizers building collaborative cultural experiences — at the intersection of
            art, emerging technology, and real-world activation. Directed by Zaal on{' '}
            <a href="https://artizen.fund" className="text-[#f5a623] underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
              Artizen
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={FUND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
            >
              Back the fund
            </a>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
            >
              ZAO OS home
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Season" value="6" />
          <Stat label="Projects backed" value={String(PROJECTS.length)} />
          <Stat label="Fund pool" value="$10K" />
          <Stat label="Artifact volume" value={usd(totalSales)} />
        </section>

        {/* How it works */}
        <section className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold sm:text-xl">How the fund works</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Artizen runs on instant match funding. Supporters buy a project&apos;s open-edition{' '}
            <span className="text-white">Artifact</span>, and every dollar of sales unlocks a matching
            dollar from each fund backing that project, while the pool lasts. A project curated into
            multiple funds gets matched by each — so broad backing multiplies a creator&apos;s raise.
            We back emerging tech used as infrastructure for shared ownership and fair compensation,
            not as a gimmick.
          </p>
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[#f5a623]">What we fund</h3>
            <ul className="mt-2 space-y-1.5">
              {ELIGIBILITY.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-white/70">
                  <span className="mt-1 text-[#f5a623]">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Roster */}
        <section className="mb-12">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-lg font-bold sm:text-xl">The projects</h2>
            <span className="text-xs text-white/50">Ranked by sales — snapshot {SNAPSHOT_DATE}</span>
          </div>
          <ul className="space-y-3">
            {PROJECTS.map((p) => (
              <li
                key={p.rank}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[#f5a623]/40"
              >
                <div className="flex gap-4">
                  <div className="shrink-0 text-lg font-bold text-white/30 tabular-nums">
                    {String(p.rank).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h3 className="text-base font-semibold leading-snug">{p.name}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                        {p.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/50">by {p.creator}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{p.blurb}</p>
                    {p.zaoTie ? (
                      <p className="mt-2 text-xs font-medium text-[#f5a623]">ZAO link: {p.zaoTie}</p>
                    ) : null}
                    <div className="mt-2 flex gap-4 text-xs text-white/50 tabular-nums">
                      <span>{usd(p.sales)} sales</span>
                      <span>{usd(p.match)} matched</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* About Artizen */}
        <section className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold sm:text-xl">About Artizen</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Artizen is a Web3 crowdfunding and match-funding platform for projects at the intersection
            of art, science, technology, and culture, founded by René Pinnell. As of June 2026 it
            relaunched a rebuilt platform with its Phoenix Fund Drive — creators raised{' '}
            <span className="text-white">over $270,000 in three days</span> — and is standing up
            marquee funds with collaborators including RZA (Wu-Tang) and Lilly Wachowski (The Matrix).
            Season 6 closes July 9, 2026.
          </p>
          <p className="mt-3 text-xs text-white/40">
            Standings on this page are a point-in-time snapshot ({SNAPSHOT_DATE}) and move as artifacts
            sell. The{' '}
            <a href={FUND_URL} className="text-[#f5a623] underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
              live fund
            </a>{' '}
            is the canonical figure.
          </p>
        </section>

        <footer className="border-t border-white/10 pt-6 text-center">
          <a
            href={FUND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[#f5a623] px-6 py-3 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Support emerging culture on Artizen
          </a>
        </footer>
      </div>
    </main>
  );
}
