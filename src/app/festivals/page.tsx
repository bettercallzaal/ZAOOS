import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ZAO Festivals — Where Music Meets Community",
  description:
    "Art first. Tech invisible. ZAO brings independent artists to live stages — NYC, Miami, Maine, the metaverse, and beyond.",
  openGraph: {
    url: "https://zaoos.com/festivals",
    title: "ZAO Festivals — Where Music Meets Community",
    description:
      "Art first. Tech invisible. ZAO brings independent artists to live stages — NYC, Miami, Maine, the metaverse, and beyond.",
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface FestivalEvent {
  id: string;
  name: string;
  status: "past" | "ongoing" | "upcoming";
  location: string;
  date: string;
  description: string;
  highlights: string[];
  externalLink?: string;
  internalLink?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const EVENTS: FestivalEvent[] = [
  {
    id: "zao-palooza",
    name: "ZAO-PALOOZA",
    status: "past",
    location: "NYC — NFT NYC 2024",
    date: "April 2024",
    description:
      "12 artists (6 new to Web3) performed live. ZAO Cards on Manifold. The community met in person for the first time.",
    highlights: ["12 artists", "6 new to Web3", "ZAO Cards on Manifold"],
  },
  {
    id: "zao-chella",
    name: "ZAO-CHELLA",
    status: "past",
    location: "Wynwood, Miami — Art Basel 2024",
    date: "December 2024",
    description:
      "10 artists performed with AR art installations, collectible trading cards, and a WaveWarZ LIVE battle. Student $LOANZ Gold Sponsor.",
    highlights: [
      "10 artists",
      "AR art installations",
      "WaveWarZ LIVE",
      "Art Basel",
    ],
  },
  {
    id: "coc-concertz",
    name: "COC Concertz",
    status: "ongoing",
    location: "Virtual — Spatial.io",
    date: "Ongoing",
    description:
      "Live performances inside the metaverse. Free entry. No tickets needed. Bringing ZAO artists to virtual stages around the world.",
    highlights: ["4 events and counting", "Free entry", "Spatial.io"],
    externalLink: "https://cocconcertz.com",
  },
  {
    id: "zao-stock",
    name: "ZAO Stock",
    status: "upcoming",
    location: "Ellsworth, Maine",
    date: "October 3, 2026",
    description:
      "The flagship outdoor music festival. 10 artists. 12pm–6pm at the Franklin Street Parklet during Art of Ellsworth: Maine Craft Weekend.",
    highlights: [
      "10 artists",
      "Maine Craft Weekend",
      "Livestreamed",
      "Free entry",
    ],
    internalLink: "/stock",
  },
  {
    id: "zaoville",
    name: "ZAOVille",
    status: "upcoming",
    location: "DMV (Maryland / DC / Virginia)",
    date: "2026",
    description:
      "A regional ZAO festival bringing the same spirit to the DMV. Same name, different city, independent team.",
    highlights: ["DMV area", "Independent team", "Same ZAO spirit"],
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FestivalEvent["status"] }) {
  const variants = {
    past: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
    ongoing: "bg-green-500/10 text-green-400 border border-green-500/20",
    upcoming:
      "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20",
  } as const;

  const labels = {
    past: "Past",
    ongoing: "Ongoing",
    upcoming: "Upcoming",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}
    >
      {status === "ongoing" && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      )}
      {labels[status]}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FestivalsPage() {
  return (
    <div className="min-h-screen bg-[#0a1628] text-white relative overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#f5a623]/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="px-6 py-5 max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          ZAO OS
        </Link>
      </nav>

      {/* Hero */}
      <header className="px-6 pt-4 pb-12 max-w-2xl mx-auto">
        <div className="mb-3">
          <span className="text-xs font-medium tracking-widest uppercase text-[#f5a623]/60">
            The ZAO
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-4 leading-tight">
          ZAO Festivals
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-2">
          Where music meets community.
        </p>
        <p className="text-sm text-gray-500 italic">
          Art first. Tech invisible.
        </p>
      </header>

      {/* Events */}
      <section className="px-6 pb-16 max-w-2xl mx-auto space-y-5">
        {EVENTS.map((event) => {
          const CardWrapper = event.internalLink
            ? ({ children }: { children: React.ReactNode }) => (
                <Link href={event.internalLink!} className="block group">
                  {children}
                </Link>
              )
            : event.externalLink
            ? ({ children }: { children: React.ReactNode }) => (
                <a
                  href={event.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  {children}
                </a>
              )
            : ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
              );

          const isLinked = !!(event.internalLink || event.externalLink);

          return (
            <CardWrapper key={event.id}>
              <article
                className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 transition-colors ${
                  isLinked
                    ? "group-hover:bg-white/[0.04] group-hover:border-white/[0.10]"
                    : ""
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-base font-semibold text-white">
                        {event.name}
                      </h2>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {event.location} &middot; {event.date}
                    </p>
                  </div>
                  {isLinked && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors mt-0.5"
                    >
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {event.description}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1.5">
                  {event.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-gray-500"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* External link label */}
                {event.externalLink && (
                  <p className="mt-3 text-xs text-[#f5a623]/60">
                    {event.externalLink.replace("https://", "")} ↗
                  </p>
                )}
              </article>
            </CardWrapper>
          );
        })}
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">
            Want to bring ZAO to your city?
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            We&apos;re always looking to expand to new cities and regions. If
            you&apos;re interested in organizing a ZAO festival near you, reach
            out.
          </p>
          <a
            href="mailto:zaal@thezao.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 3.5A1.5 1.5 0 012.5 2h10A1.5 1.5 0 0114 3.5v8a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 011 11.5v-8z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M1 4l6.5 4.5L14 4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            zaal@thezao.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10 max-w-2xl mx-auto text-center">
        <p className="text-xs text-gray-600">Presented by The ZAO</p>
      </footer>
    </div>
  );
}
