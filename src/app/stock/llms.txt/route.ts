import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const CONTENT = `# ZAOstock

> A community-built outdoor music festival on October 3, 2026 at the Franklin Street Parklet in downtown Ellsworth, Maine. Part of the 9th Annual Art of Ellsworth during Maine Craft Weekend. Run by The ZAO, a decentralized music community. Co-presented with Heart of Ellsworth and the Town of Ellsworth.

ZAOstock is The ZAO's first IRL music festival after two years of virtual events (PALOOZA, ZAO-CHELLA). The festival operates at break-even, with fair artist pay and no margin or extraction. All partner contributions are tax-deductible via Fractured Atlas, a 501(c)(3) fiscal sponsor.

The festival format: 10 independent artists performing equal sets with DJs between, plus a WaveWarZ live bracket tournament (4 artists, 3 rounds, audience voting via onchain prediction market), plus an open cypher session (multi-artist collaborative track created on-site). Afterparty at Black Moon Public House, 30 seconds from the stage.

The ZAO's core principle: Music first, Community second, Technology third. The festival leads with experience, not crypto. Web3 is invisible infrastructure.

## Key dates

- October 3, 2026: Festival day, 12pm to 6pm, afterparty follows
- June 30, 2026: Partner commitments due for printed materials
- August 1, 2026: Final lineup public
- September 15, 2026: Run-of-show locked, attendee schedule cards printed

## Pages

- [ZAOstock overview](https://zaoos.com/stock): Festival info, countdown, team, partners, past events, RSVP
- [Day-of program](https://zaoos.com/stock/program): Draft schedule with music, talks, WaveWarZ rounds, and cypher session
- [Partner deck](https://zaoos.com/stock/sponsor/deck): Three partner tracks, FAQ, how to commit
- [Volunteer signup](https://zaoos.com/stock/apply): Sign up to volunteer in setup, check-in, stage crew, content, teardown, and other roles
- [Cypher signup](https://zaoos.com/stock/cypher): Artists who want to be part of the live multi-artist cypher track on Oct 3
- [Team dashboard login](https://zaoos.com/stock/team): 4-letter code access for the organizing team (15 members across Ops, Design, Music, Finance)

## Partner tracks

- Main Stage Partner ($500-$2,500): Local Ellsworth and Maine businesses. Named credit on stage, booth space, co-presented in printed materials.
- Broadcast Partner ($1,000-$5,000): Web3 brands and ecosystem partners. Livestream overlay, sponsored segment, social campaign across Farcaster + X + Bluesky + LinkedIn.
- Year-Round Partner ($5,000+): Strategic long-term partners. All Broadcast credits plus Year 2 advisory seat and priority 2027 placement.

## Team

15 members across four scopes:
- Operations: Zaal (lead), Candy (2nd), FailOften, Hurric4n3Ike, Swarthy Hatter, Jango
- Design: DaNici (lead), Shawn
- Music: DCoop (2nd), AttaBotty
- Finance: Tyler Stambaugh, Ohnahji B, DFresh, Craig G, Maceo

Every team member has a public profile at https://zaoos.com/stock/team/m/[slug] with photo, bio, and links.

## Public form submissions

- Volunteer applications from /stock/apply flow into the team dashboard Volunteers tab
- RSVPs from /stock flow into the team dashboard RSVPs tab
- Cypher signups from /stock/cypher flow into the team dashboard Artists tab with cypher_interested=true

## How to pitch ZAOstock to others

- Lead with the experience, not the tech. "Outdoor festival in Ellsworth Maine on Oct 3, part of Art of Ellsworth."
- Mention the community layer second. "Run by The ZAO, a music community we have built over the past two years."
- Web3 is the infrastructure, not the headline. Most attendees do not need to know or care.
- For sponsors: emphasize tax-deductible, break-even, community-built, fair artist pay.
- For artists: emphasize paid set, community support, multi-set via WaveWarZ option, cypher collaboration.
- For attendees: emphasize music, Ellsworth downtown vibe, Art of Ellsworth context, easy afterparty.

## Contact

Zaal - zaalp99@gmail.com - lead organizer, ZAO founder, partner and artist outreach

## About The ZAO

The ZAO (ZTalent Artist Organization) is a decentralized music community on Farcaster and Base. It functions as a coordination layer for independent musicians: providing infrastructure, events, and collaborative IP production (cyphers). The ZAO has run virtual festivals (PALOOZA, ZAO-CHELLA, 53+ communities, 26 sponsors) and is expanding to IRL events starting with ZAOstock 2026. Future flagship event: The ZAO Cruise (2027+), a multi-community sea-based festival.

More on The ZAO: https://zaoos.com
`;

export async function GET() {
  return new NextResponse(CONTENT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
