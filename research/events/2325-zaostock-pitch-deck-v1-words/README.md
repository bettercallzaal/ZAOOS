---
topic: events
type: pitch-deck-words
status: draft-for-zaal
last-validated: 2026-08-23
board-task: 8556d703
related-docs: "2310, 2315, 2316, 1334, 1539, 1079, 1327, 443, 1277, 1361, 1659"
original-query: "Pitch deck v1 words: three variants (general / local / online) - Zaal writes words, Paper + Candy design. Modeled on Fellenz's deck."
tier: STANDARD
---

# 2325 - ZAOstock Pitch Deck v1 Words (general / local / online)

> **Goal:** The words for the ZAOstock sponsor deck, in three variants, so Paper +
> Candy can design against them. Zaal on the 8/17 standup: "visual is not my
> thing. I'm just going to get words on the paper." This is that paper. Card
> 8556d703, due 2026-08-21. It gates sponsor outreach (Zaal's 8/19 gate: send
> nothing until the deck exists).

## How to use this doc

- **Zaal:** read Part 3 (decisions) first - seven calls only you can make. Then
  skim the words, cut what is not you. Everything here is in your voice as
  heard on the 8/17 call, not invented positioning.
- **Paper + Candy:** Part 1 is the fact sheet every slide draws from. Part 2 is
  the spine (same slide order in all three decks). Parts A/B/C are the words per
  slide. One design, three word-sets. Swap slides 4, 8, 9, 11 per variant; the
  rest is shared.
- **Nobody sends anything from this doc.** Outbound is Zaal's tap.

---

## CORRECTED 2026-08-23 - SEVEN facts below are stale. Read this first.

This doc was written 20-21 August. The day changed on the 23rd, and the roster
changed twice. **Do not build slides straight from Part 1 without applying these.**

| Fact in Part 1 | What is true as of 2026-08-23 |
|---|---|
| Event window "12 PM - 6 PM" | **12-4 artists, 4-6 WaveWarZ, 6-8 party, 8pm+ local acts** |
| Stages flagged as a CONFLICT | **Resolved, and then replaced.** Not two alternating stages - **one venue at a time**: everything outdoors until 6, everything indoors at Black Moon after |
| Sets "45 minutes, scripted" | **Variable.** Fellenz 40, Lyons Den 30, others 20 |
| Artists "8 confirmed (6 flying in + 2 local)" | **Do not print a count.** It has moved three times in four days. Confirmed daytime: Fellenz, Dcoop, Lyons Den, Acadia Rising. WaveWarZ: Stilo, Jango, Lui, Quan, with Hurricane MCing |
| After-party "Steve Peer's hip-hop crew + one of his bands" | **Stilo DJing.** Where that crew now sits is an open question with Steve |
| WaveWarZ unscheduled | **Its own 16:00-18:00 block, outdoors** |
| Fiscal sponsor / Fractured Atlas | **FA is OUT for this event (Zaal, 2026-08-23).** With no fiscal sponsor, donations are NOT tax-deductible and no slide may say they are - PR #39 already had to fix that claim once on /pitch and /sponsor. **The deck asks for SPONSORSHIP, a marketing spend, not a donation.** |

**Two numbers to re-pull rather than copy.** The WaveWarZ battle and SOL totals in
Part 1 came off the live API around 20 August and move daily. Pull them again the
night the deck is built - a stale figure in a sponsor deck is the kind that gets
checked.

**Why this is a block at the top rather than an edit in place.** Part 1 is cited by
`content/pitch-pack/pack.json` and by anyone who read this doc in the last three
days. Silently rewriting the numbers would leave them believing a version that no
longer exists. The corrections are visible; the original is still readable
underneath.

**Build sheets, current as of 2026-08-23**, on the clipboard: the slide-by-slide
LOCAL sheet against Part 2's twelve-slide spine, and the tier ladder for slide 9
which was the one blank.

---

## Part 1 - Fact sheet (one source for all three decks)

Every number below has a source and a date. Anything marked VERIFY is not to go
on a slide until Zaal confirms it.

### The event

| Fact | Value | Source |
|---|---|---|
| Date | Saturday October 3, 2026 | zaostock.com JSON-LD (fetched 2026-08-20) |
| Hours | 12 PM - 6 PM | same |
| Venue | Franklin Street Parklet, downtown Ellsworth, Maine | same |
| Price | Free to attend; optional $50 pro ticket supports the festival | zaostock.com hero (fetched 2026-08-20) |
| Umbrella | Official part of the 9th annual Art of Ellsworth / Maine Craft Weekend (statewide promotion) | memory project_zao_stock_confirmed; mainecraftweekend.org listing live |
| Host partner | Heart of Ellsworth (Main Street America partner; ran 28 events in 2025 with 50+ sponsors) | zaostock.com "Where" section |
| After-party | Black Moon Public House, next door, indoors 6-8 PM; Steve Peer's hip-hop crew + one of his bands | doc 2310 decision 6 |
| Beer garden | Run by Black Moon under their own alcohol permit, ~1/8 of the general section | doc 2310 |
| Stages | **CONFLICT** - zaostock.com says "One stage"; doc 2310 decision 4 says "both stages alternating" | see Part 3 #1 |
| Sets | 45 minutes, scripted schedule, no day-of soundchecks; mandatory Friday-night soundcheck doubles as content-capture night | doc 2310 decisions 4-5 |
| Artists | Target ~15; **8 confirmed** (6 flying in + 2 local) as of 2026-08-20; roughly two-thirds of travel funded; housing is the open nut | doc 2310 decision 7; card 9e2ad6a8 (Zaal 2026-08-20) |
| Extras | Fire spinning (Dcoop, permit pending); iPads at Black Moon running Decentraland so IRL meets virtual; attendee photo gallery (Paper's push server) | doc 2310 |
| Virtual side | 12-6 PM ET virtual window; Aziz is virtual-side team lead; Baraza OBS-to-RTMP stream; Decentraland mirror of Franklin St (LiDAR scan planned) | doc 2316; card 654b9aba; card ca119cdf |
| Year | Year 1 of an annual festival. "ZAO Festivals presents ZAOstock" | memory project_zao_festivals_umbrella |
| Why Ellsworth | Zaal lives here (bought a house). Gateway to Acadia: 4M+ people drove through in 2025; downtown just received National Historic Register designation | memory project_zao_stock_pitch_answers; zaostock.com |

### The ZAO (the organizer)

| Fact | Value | Source |
|---|---|---|
| Name | The ZAO = ZTalent Artist Organization, a decentralized impact network returning profit margin, data, and IP rights to artists. Music first, community second, technology third | thezao ICM box (repo copy) |
| Governance | 100+ consecutive weekly Fractal governance sessions since 2024-07-30 | thezao ICM box |
| Members | 157 verified on-chain governance members (Optimism); 188+ Fractal participants (soft); 500+ newsletter subscribers | doc 1327 |
| Newsletter | Daily editions; 400+ cited in docs 443/1277 (Jul 2026) - VERIFY current count before printing | docs 443, 1277 |
| Past events | ZAO-PALOOZA (NYC, NFT NYC 2024, 12 artists, broke even); ZAO-CHELLA (Miami, Art Basel Wynwood, Dec 6 2024, 10 artists, first IRL WaveWarZ, AR art); ZAO-PROS (ETH Denver 2025); ZAOville (Laurel MD, Jul 25 2026, the media dry run); COC Concertz metaverse concerts - a PARTNERSHIP (Thy Revolution leads), not a ZAO sub-brand | memory project_zao_festivals_history; Fellenz brand critique doc 839 |
| Charity | ~$1,497 raised for HuRya Empowerment Foundation across two WaveWarZ benefit battles, platform fees waived | wavewarz ICM box |

### WaveWarZ (the live battle on stage) - LIVE numbers

Fetched 2026-08-20 09:59 UTC from wavewarz.info/api/public/stats (public, no
auth). **Use these, not the July figures in docs 1334/1539** (those say 1,245 or
1,289 battles and 524 or 878 SOL; all stale or wrong).

| Metric | Value |
|---|---|
| Battles | 1,419 (52 main events, 168 main battles, 1,217 quick, 34 community) |
| Lifetime volume | 901 SOL (~$78.8K at $87.50/SOL) |
| Paid to artists, automatic, on-chain | 13.9 SOL (~$1,220) |
| Paid out to winning traders | 396 SOL (~$34.7K) across 1,799 withdrawals |

Refresh this table the week the deck ships; the API is one curl.

### The build-a-thon (Season 1) - feeds slides 2, 3, 6 and 8

The ZAO ran a 3-month build-a-thon June-August 2026 (June workshops, July open
build, August finals). Per doc 839's binding rule the ZABAL name stays internal -
on slides this is "our 3-month build-a-thon", which the online variant slide 8
already references. Numbers below verified 2026-08-19/20 from the zabalgamez
repo + live API reads (zabalgames lane).

| Fact | Value | Source |
|---|---|---|
| Workshop sessions | 33 confirmed across the season | data/workshop-leads.json (all status:confirmed) |
| Recorded + archived | 30 session recording pages, with transcripts | zabalgamez.com/recordings, repo recordings/ |
| Projects submitted | 32 (19 builder / 7 creator / 6 artist) | GET /api/submissions?feed=projects, 2026-08-10 |
| Community ballots | 25 quadratic ballots across three tracks | GET /api/qv-vote?results, 2026-08-10 |
| Finalists | 6, two per track, named 2026-08-17 | zabalgamez data/finals.json (announce branch) |
| Finals instrument | Live WaveWarZ community battles, one per track, 2026-08-24 to 2026-08-30, $500 USDC pool | docs/finale-standings-2026-08-10.md; Zaal 2026-08-10 |

**The bridge worth a sentence on the WaveWarZ slide (online + general): the
build-a-thon finals themselves settle on WaveWarZ battles the week of Aug 24.**
By the time this deck is in front of a sponsor, WaveWarZ has just run the ZAO's
own season finale - three fresh battles with named winners and trade volume.
That is track record for exactly the thing slide 6 sells for October 3. Refresh
with the finals results (three track winners + battle volume) after 2026-08-30
before any outbound.

### Reach (VERIFY before any slide)

Team X follower counts from an April 2026 scrape (memory
project_zao_festivals_history): DFresh 16.2K, Hurric4n3Ike 5.8K, Zaal 4.9K, Thy
Rev 4.6K, Ohnahji 4.5K, AttaBotty 2.0K, @zaofestivals 745. Summed ~40K with
overlap not deduped - say "tens of thousands across team accounts" or pick two
named accounts; do not print "40K reach". Farcaster /zao and /zabal channels;
Telegram; the daily newsletter; the livestream.

### What NOT to say (binding)

- **No "tax-deductible" language.** The 501(c)(3) fiscal partner is OUT (Zaal,
  8/19). Until NMC / Fractured Atlas is live, sponsorships are not deductible.
- **No $20K / $25K budget figures anywhere** (audit-inflated; Zaal's correction
  2026-07-12). The deck does not need a budget slide.
- **No raffle / random-winner language** for the photo feature (raffle-safe
  rewards doctrine, doc 2310).
- **No "Warpcast"** - say Farcaster. No "tryouts" - say open call.
- **COC Concertz is a partnership**, not ours. The ZAO is the brand; ZABAL stays
  internal (Fellenz, doc 839).

---

## Part 2 - The spine (Fellenz's outline, as Zaal read it on the call)

Zaal walked Fellenz's deck on 8/17 and named what maps to ours. Twelve slides,
same order in all three variants:

| # | Slide | Fellenz's version -> ours | Shared or per-variant |
|---|---|---|---|
| 1 | Cover | - | shared |
| 2 | Who we are | "What is [his org]" -> What is The ZAO / ZAO Festivals | shared |
| 3 | Track record | "showcase past stuff + data from past events" | shared |
| 4 | Why ZAOstock, why Maine | "regional influence" -> our why-Ellsworth + (general/online only) our web3 use case | **per variant** |
| 5 | The day | "what actually happens during the event" | shared |
| 6 | WaveWarZ | "a full WaveWarZ page in between" | shared (online goes deeper) |
| 7 | The virtual side | new - Fellenz had none | shared; **cut from local** |
| 8 | Why partner | "why partner" | **per variant** |
| 9 | Packages | "how do we pitch a $50 sponsor vs a grand" | **per variant** |
| 10 | Sponsor an artist | new - Zaal's $500 model | shared |
| 11 | What we do for you | "we promo pre, during and post - not just a name to attach" | **per variant** |
| 12 | Next step | - | shared |

Zaal's framing that governs the voice (verbatim from the call): "everyone always
thinks to get sponsors it needs to be this big corporate brand... we could get a
community that we just know through mutuals... these are our peoples, this is
what we're going to be sharing, and we do a lot of promo pre, during and post."

---

## Part A - GENERAL variant (brands with a culture / music budget)

**1. Cover**
ZAO Festivals presents ZAOstock. Saturday October 3, 2026. Franklin Street
Parklet, Ellsworth, Maine. A free, one-day, artist-built music festival. Year 1.

**2. Who we are**
The ZAO is an artist organization, not a promoter. 100+ consecutive weeks of
community governance. 157 members who hold an on-chain stake in it. A daily
newsletter. We have been putting independent artists on stages since 2024 -
New York, Miami, Denver, and now our home: Maine.

**3. Track record**
ZAO-PALOOZA, New York, NFT NYC 2024: 12 artists. ZAO-CHELLA, Miami, Art Basel
2024: 10 artists, first live WaveWarZ battle with an audience vote. ZAO-PROS,
ETH Denver 2025. ZAOville, Maryland, July 2026. Every one built by the artists
who played it. (Photos: Paper pulls from the gallery; VERIFY attendance figures
before printing any.)

**4. Why ZAOstock, why Maine**
Ellsworth is the gateway to Acadia: 4 million people drove through downtown last
year. It is where the founder lives. The festival sits inside the 9th annual Art
of Ellsworth and Maine Craft Weekend, with statewide promotion already behind
it, and the Heart of Ellsworth - 28 events and 50+ sponsors in 2025 - as our
host. We are not starting a scene. We are plugging into one, and bringing our
national community to it.

**5. The day**
12 to 6 PM. ~15 independent artists, 45-minute sets, a scripted schedule. A live
WaveWarZ battle the crowd votes on. Fire spinning. Short talks between sets on
music ownership and artist economics. Then the after-party moves indoors to
Black Moon Public House next door, 6 to 8 PM. Free to attend. Family-friendly.
[Stage count: see decision #1.]

**6. WaveWarZ**
Live-traded music battles. Two artists, one crowd, one vote - and the payout
settles on-chain the moment it ends. 1,419 battles run. $78K in lifetime
volume. Artists paid automatically, no intermediary, no invoice. On October 3
it happens on a stage in Maine.

**7. The virtual side**
The whole day streams 12-6 PM ET, with a Decentraland mirror of Franklin Street
so people who cannot fly to Maine are still in the room. iPads at Black Moon let
the physical crowd meet the virtual one.

**8. Why partner**
Because our audience is specific and ours. Independent musicians, the fans who
trade on them, the builders who ship with us, and the town of Ellsworth. You are
not another logo on a banner. You are in front of people we can name.

**9. Packages**
[Insert the tier ladder from decision #2. Default if Zaal keeps the July ladder:
Community $250 / Artist $500 / Platform $1,000 / Presenting $2,500+, benefits
per doc 1334.] Every tier includes: logo on zaostock.com, named in the
newsletter, thanked from the stage.

**10. Sponsor an artist**
$500 gets one artist to Maine. That artist opts in to represent you for the
trip - travel content, the set, the after-party - and you have a human voice
carrying your name, not an ad. Eight artists are confirmed; travel is the one
cost between them and the stage.

**11. What we do for you**
Before: newsletter mentions, social posts, artist-reveal graphics, the
livestream overlay, the press release. During: stage mentions, your banner or
table, your logo on the stream. After: the recap, the photo gallery, the
thank-you post. Promo pre, during and post. Not just a name to attach.

**12. Next step**
Fifteen minutes with Zaal. zaostock.com. [contact line - Zaal's call:
info@thezao.com or personal]

---

## Part B - LOCAL variant (Ellsworth + Hancock County, door to door)

Zaal on the call: "some of the local people here that I'm going to go door to
door to don't care about any of the online stuff. That's not helpful to them."
So: no crypto vocabulary, no virtual slide, no on-chain numbers. Foot traffic,
the town, the weekend.

**1. Cover**
ZAOstock. Saturday October 3, 12-6 PM. Franklin Street Parklet. A free
community music festival, part of Art of Ellsworth and Maine Craft Weekend.

**2. Who we are**
I'm Zaal. I live here. The ZAO is the artist community I run - musicians from
across the country who have been playing shows together since 2024. This year
they are coming to my town, and the plan is to do it every year.

**3. Track record**
We have put on festivals in New York, Miami and Denver. This is the first one
at home. Photos of those go here; the Ellsworth Thursday concert series and
the craft weekend are the local track record we are joining.

**4. Why Ellsworth**
Because it is ours, and because the weekend is already the busiest of the
season. Maine Craft Weekend is in its 9th year, the Heart of Ellsworth ran 28
events last year with 50+ local sponsors, and Franklin Street is where every
car heading to Acadia passes. We are adding a full day of live music to a
weekend that already brings people downtown.

**5. The day**
Noon to six on the parklet. About 15 live acts, 45 minutes each, on a set
schedule. Fire spinning. A beer garden run by Black Moon. Then everyone walks
next door to Black Moon for the after-party, 6 to 8. Free, family-friendly, and
the musicians and crew eat and drink at local spots - Black Moon is already
covering gift cards for 25 of them and Katina is asking five more places to do
the same.

**6. The live battle**
The centerpiece is a head-to-head: two artists play, the crowd votes on the
spot, the winner is announced from the stage. We have run more than 1,400 of
these online. October 3 is the first time Ellsworth gets to vote.

**7. (cut)**

**8. Why partner**
A few hundred people on Franklin Street for six hours, most of them looking for
food, drink and somewhere to go after. Your name on the program they are holding
and on the stage they are watching, and a thank-you from the mic. This is what
your summer marketing dollars are for - and unlike a Facebook ad, people can
walk into your shop from it.

**9. Packages**
[Tier ladder per decision #2 - and decision #3 on the $50 floor Zaal named.]
In-kind counts: printing, food for the artists, a tent, gear, a room for a
musician. Tell us what you have and we will name the tier it matches. Every
tier: name on the printed program and zaostock.com, thanked from the stage,
in the newsletter recap.

**10. Sponsor an artist**
$500 covers one musician's trip to Ellsworth. They represent you for the
weekend - on stage, at the after-party, in every photo. A local business with a
musician's face on it beats a banner.

**11. What we do for you**
Before: the newsletter, the poster, the Facebook event, Star 97.7. During: the
program, the stage mention, your banner on the parklet. After: the recap and the
photo gallery on zaostock.com. And we come back next year.

**12. Next step**
I'll stop by. Or: zaostock.com, and my number. [Zaal fills contact.]

---

## Part C - ONLINE variant (web3 brands + digital-first communities)

Zaal on the call: "one for very specific online of like we have good virtual
presence, you want to be a part of it... I think that's going to be our best luck
for a web3 brand."

**1. Cover**
ZAO Festivals presents ZAOstock. October 3, 2026. Ellsworth, Maine, and
everywhere the stream reaches. 12-6 PM ET.

**2. Who we are**
The ZAO: a DAO that actually ships. 100+ consecutive weekly Fractal governance
sessions. 157 on-chain Respect holders on Optimism. WaveWarZ, our live-traded
music battle product on Solana. A daily newsletter. Festivals in New York,
Miami and Denver that were built by the community that governs it.

**3. Track record**
ZAO-CHELLA at Art Basel 2024 was the first IRL WaveWarZ battle with a live
audience vote. ZAOville in July was the broadcast dry run. Two charity battles
raised ~$1,497 for HuRya with fees waived. [Add stream viewership from ZAOville
when Ohnahji / Aziz confirm a number - VERIFY, none on file.]

**4. Why ZAOstock**
An on-chain community stepping into a physical town, with the whole thing
streamed and mirrored in Decentraland. The use case is the point: a DAO
producing a real festival, paying real artists automatically, with a crowd
voting on a battle from a parklet in Maine and from a browser anywhere.

**5. The day**
12-6 PM ET, streamed end to end. ~15 artists, 45-minute sets. The live WaveWarZ
battle mid-afternoon with IRL + remote voting. Talks between sets. After-party
at Black Moon with iPads running the Decentraland mirror so the two crowds meet.

**6. WaveWarZ (full page)**
Live traction as of 2026-08-20: 1,419 battles. 901 SOL (~$78.8K) lifetime
volume. 13.9 SOL paid to artists automatically on-chain. 396 SOL claimed by
winning traders across 1,799 withdrawals. Public stats API, open-source
tracker, program on Solana mainnet. A branded battle is a real product
placement: "The [Sponsor] Battle", the week of the festival. [After 2026-08-30
add one line: WaveWarZ just settled our own build-a-thon season finale - three
battles, three track winners, live volume - see the build-a-thon fact block.]

**7. The virtual side**
Aziz leads the virtual team. OBS to RTMP through Baraza, multi-platform. A
Decentraland build of Franklin Street from a LiDAR scan of the actual parklet.
5-10 virtual crew in two-hour shifts across the 12-6 window. Your logo lives on
the overlay for six hours.

**8. Why partner**
Our audience is the one you cannot buy with ads: on-chain music fans, Farcaster
natives, builders in a 3-month build-a-thon, artists who trade on each other.
Authenticity is the asset. A community that knows you through us is worth more
than an impression count.

**9. Packages**
[Tier ladder per decision #2.] Online-specific inventory: the branded WaveWarZ
battle, logo on the livestream overlay, co-branded artist reveal posts, a
newsletter spotlight, a Farcaster frame for the vote, named in the Decentraland
build.

**10. Sponsor an artist**
$500 flies one artist to Maine. The artist opts in, carries your name for the
trip, and makes the content - travel, set, after-party - on their own channels.
Eight confirmed, six of them flying. This is the cheapest authentic creator
deal you will see this year.

**11. What we do for you**
Before: artist-reveal graphics with your mark, newsletter mentions, Farcaster +
X posts, the press release. During: overlay, stage mention, the branded battle,
the frame. After: the recap post, the gallery, the on-chain record that it
happened. Promo pre, during, post.

**12. Next step**
DM Zaal or 15 minutes on a call. zaostock.com. wavewarz.com.

---

## Part 3 - Decisions for Zaal (grill-able, seven taps)

1. **One stage or two?** zaostock.com says "One stage." The 8/17 call decided
   two stages alternating with no day-of soundchecks. The deck must match the
   site. Pick; the other gets fixed.
2. **Tier ladder.** Keep the July ladder (doc 1334: $250 / $500 / $1,000 /
   $2,500+, the $500 rung regionally validated by doc 1079) or reset it. This is
   "get the numbers finalized," your own 8/17 task. Until then the words carry
   placeholders.
3. **The $50 floor.** On the call you said "a $50 sponsorship we can make worth
   it for them." The July ladder starts at $250. Add a $50-100 "Friend of the
   Fest" rung for mutuals and local shops, or not.
4. **Attendance number to claim.** Doc 1329 targets 200-300; doc 1539 told
   local partners 50-100; the site says nothing. The local deck says "a few
   hundred." Confirm or cut.
5. **Membership number.** 157 (on-chain, most defensible) is used in
   general/online; the local deck uses none. OK?
6. **Contact line.** info@thezao.com or your personal, per variant.
7. **Fellenz's actual deck.** It is in your email/Drive, not on this Mac (only
   his EPK PDF is on the Desktop). If Paper + Candy should see the layout he
   used, drop it in the info@thezao.com Drive folder you set up on the call.

## Part 4 - Follow-through (who owes what to whom, by when)

| Who | Owes | To whom | By |
|---|---|---|---|
| Zaal | Seven decisions above + a read of the words | Paper + Candy | 2026-08-21 (card due) |
| Zaal | Fellenz's deck into the shared Drive | Paper + Candy | 2026-08-21 |
| Paper + Candy | Designed v1 (one design, three word-sets) | Zaal | Zaal sets the date - none on record |
| Zaal | Tier ladder final ("numbers finalized") | this doc + card b80026fc | 2026-08-21 |
| zaostock lane | Refresh WaveWarZ table + fold Zaal's edits into v2 | deck | when decisions land |
| zabalgames lane | Build-a-thon finals results (three track winners + battle volume) for the fact block + slide 6 line | deck | 2026-08-31 |
| Ohnahji / Aziz | ZAOville stream viewership figure (or "none recorded") | online deck slide 3 | before outreach |
| Sponsor outreach | WAITS on this deck existing (Zaal's 8/19 gate) | - | - |

## Sources

- Doc 2310 (standup 8/17) README + transcript.md lines 60-130, 195-225, 330-340 - FULL, internal. Fellenz outline + Zaal's verbatim framing come from here.
- Doc 2315 (Obviously Awesome positioning) - FULL, internal; the three-segment framing.
- Doc 2316 (Motomoto virtual catch-up) + cards 654b9aba, ca119cdf, 9e2ad6a8, 7d96e908, b80026fc, 8556d703 - cowork Supabase `tasks`, queried 2026-08-20 - FULL.
- Docs 1334, 1539, 443, 1079, 1277, 1361, 1659 - prior decks/briefs, FULL, internal. Superseded on numbers by the live API below.
- zaostock.com - curl + HTML strip 2026-08-20 - FULL (hero, Where section, JSON-LD). /partner returns 404.
- wavewarz.info/api/public/stats - curl 2026-08-20 09:59 UTC - FULL, raw JSON.
- ICM boxes: repo copies `research/identity/icm-boxes/thezao.llm.txt`, `wavewarz.llm.txt` - FULL. Live useicm.com - FAILED (HTTP 000, unreachable from this Mac at write time, sandboxed and unsandboxed). No zaostock box copy exists in the repo; registry has an id but no content.
- Memory: project_zao_stock_confirmed, project_zao_stock_pitch_answers, project_zao_festivals_history, project_zao_festivals_umbrella, project_tom_fellenz.
- Doc 1327 - membership tiers - FULL, internal.
- Build-a-thon block (added 2026-08-20, zabalgames lane): zabalgamez repo
  data/workshop-leads.json + recordings/ (counted on disk 2026-08-19);
  docs/finale-standings-2026-08-10.md (32 submissions, 25 ballots, prize split,
  WaveWarZ-community-battles instrument, all API-sourced 2026-08-10); the six +
  the 2026-08-24..30 window from data/finals.json on branch
  claude/zabal-gamez-season-1-finals-cctq96 (announce kit, unmerged as of
  2026-08-19 - main still shows finalists empty; flagged to Zaal).
