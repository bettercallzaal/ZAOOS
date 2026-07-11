// ZAOstock photo + promo calendar (research doc 1033) - pure date lookup.
//
// The 12-week Mon/Wed/Fri cadence doc 1033 designed to fold into the SAME
// content slate the event category already drives, not run as a competing
// parallel campaign (doc 1033 Key Decisions, "Run two content tracks in
// parallel, not sequentially"). Monday + Friday carry the place-photo theme;
// Wednesday carries the artist/event track. Silent (returns null) on every
// other day, and outside the Jul 13 - Oct 3, 2026 window - Oct 3 itself is
// the festival day and hands off to doc 1030's live-event media plan instead.

interface CalendarWeek {
  /** Monday of this week, YYYY-MM-DD. */
  start: string;
  placeTheme: string;
  artistTrack: string;
}

// Verbatim from doc 1033's "The Calendar" table.
const WEEKS: CalendarWeek[] = [
  {
    start: '2026-07-13',
    placeTheme:
      'Downtown Ellsworth intro - Historic Main Street, Riverwalk. Establish "this is the town" before the park.',
    artistTrack: 'ZAOstock explainer post.',
  },
  {
    start: '2026-07-20',
    placeTheme: 'Downtown continued - Harbor Park, working waterfront.',
    artistTrack: 'Highlights from past ZAO events (PALOOZA/CHELLA).',
  },
  {
    start: '2026-07-27',
    placeTheme: 'Acadia opens: Sand Beach, Otter Cliffs + Boulder Beach.',
    artistTrack: 'First confirmed-artist post - Fellenz.',
  },
  {
    start: '2026-08-03',
    placeTheme: 'Jordan Pond + the Bubbles, Park Loop Road.',
    artistTrack: 'Second confirmed-artist post - Dcoop.',
  },
  {
    start: '2026-08-10',
    placeTheme: 'Cadillac Mountain, Thunder Hole (tide-timed).',
    artistTrack: 'Artist video #1, if that route is confirmed.',
  },
  {
    start: '2026-08-17',
    placeTheme: 'Bass Harbor Head Light, Schoodic Point.',
    artistTrack: "Sponsor/partner spotlight (ties to doc 1031's HoE relationship track).",
  },
  {
    start: '2026-08-24',
    placeTheme: 'Schoodic Head, Eagle Lake.',
    artistTrack: 'Artist video #2, if confirmed.',
  },
  {
    start: '2026-08-31',
    placeTheme: 'Somes Sound, Winter Harbor lighthouse.',
    artistTrack: 'Volunteer/team spotlight - a real name, not a role.',
  },
  {
    start: '2026-09-07',
    placeTheme:
      "Woodlawn Estate, granite/quarry detail shots (teases the Union River Sculpture Trail's local-stone story).",
    artistTrack: 'Sponsor/partner spotlight #2.',
  },
  {
    start: '2026-09-14',
    placeTheme: 'Early foliage begins - revisit Jordan Pond and Eagle Lake with first color showing.',
    artistTrack: "\"Lineup so far\" recap post, folding in any newly confirmed artists.",
  },
  {
    start: '2026-09-21',
    placeTheme: 'Union River Sculpture Trail launch content, Somes Sound with early color.',
    artistTrack: 'Day-of logistics teaser (parking/what-to-bring, from doc 1032).',
  },
  {
    start: '2026-09-28',
    placeTheme: 'Countdown week - Franklin Street Parklet itself, featured for the first time as the actual venue.',
    artistTrack: "Final push - Oct 3 hands off directly to doc 1030's live-event media plan.",
  },
];

const CALENDAR_START = '2026-07-13';
const CALENDAR_END = '2026-10-03';

function weekFor(dateIso: string): CalendarWeek | undefined {
  // Weeks are Monday-Sunday, so the matching week is the last one whose
  // start is <= dateIso (WEEKS is in ascending start-date order).
  let match: CalendarWeek | undefined;
  for (const w of WEEKS) {
    if (w.start <= dateIso) match = w;
    else break;
  }
  return match;
}

/**
 * Today's ZAOstock promo line, or null if today isn't a scheduled Mon/Wed/Fri
 * slot inside the Jul 13 - Oct 3, 2026 window. dateIso is YYYY-MM-DD in the
 * America/New_York calendar day (caller's responsibility - matches how the
 * rest of posts/sources.ts treats "today").
 */
export function getTodaysZaostockPromoLine(dateIso: string): string | null {
  if (dateIso < CALENDAR_START || dateIso > CALENDAR_END) return null;

  const dow = new Date(`${dateIso}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  if (dow !== 1 && dow !== 3 && dow !== 5) return null; // Mon/Wed/Fri only

  const week = weekFor(dateIso);
  if (!week) return null;

  if (dow === 3) {
    // Wednesday = artist/event track.
    return `ARTIST/EVENT TRACK: ${week.artistTrack}`;
  }
  // Monday or Friday = place-photo theme. Distinguish so the drafter can note
  // week-open vs week-close framing if useful; content is the same theme.
  const slot = dow === 1 ? 'Mon' : 'Fri';
  return `PLACE PHOTO (${slot}, week of ${week.start}): ${week.placeTheme}`;
}

/** Exposed for tests - the raw calendar the lookup is built on. */
export const ZAOSTOCK_PROMO_WEEKS = WEEKS;
export const ZAOSTOCK_PROMO_CALENDAR_START = CALENDAR_START;
export const ZAOSTOCK_PROMO_CALENDAR_END = CALENDAR_END;
