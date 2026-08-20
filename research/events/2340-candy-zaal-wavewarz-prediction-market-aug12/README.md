---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-08-20
related-docs: 743, 1786, 2083, 2267
tier: STANDARD
---

# 2340 - Candy x Zaal - WaveWarZ as the oracle for music prediction markets (2026-08-12)

> **Goal:** Record who committed to what on the 2026-08-12 Discord/Craig call
> between Zaal and Candy (candytoybox - Samantha, she/her, WaveWarZ cofounder
> and design lead, plus promo and marketing): the prediction-market positioning
> for WaveWarZ, the community-token variant, the no-fail slippage toggle,
> Candy's wavewars.info overhaul and Founder Video, and - for the zaostock lane
> - what agent stack Candy actually runs.

**The product of this doc is the obligation table in "Who owes what, which
way".** Read that first.

**Recording facts, because two of them were wrong on intake.** Craig multitrack
`E1NFiFOV2vyG`, tracks `1-candytoybox.aac` + `2-zaal.aac`. The files were
downloaded **2026-08-12 16:43** (not 08-20) and Zaal ends the call by stopping
the recording to download it, so the call date is taken as 2026-08-12 (medium
confidence - from file mtime, the call never states a date). `ffprobe` reports
69.5 min on the raw ADTS stream; the decode is **35:24 / 35:33** and the
transcript ends at 35:26 with "let me end this recording". The call is 35.5
minutes. Speaker labels are the track filenames (ground truth, no diarization).
The recording begins mid-sentence.

## For the zaostock lane: Candy's agent stack, from the call

The call answers it, narrowly. Candy uses **Claude**:

- 21:41 - "so i had a claude make a founder video" (the WaveWarZ Founder Video
  she screen-shares at 22:53, "trying to show everybody exactly what needs to
  be fixed on WaveWars").
- 21:22 - "I bet I can get Claude to do that nicely" (recreating a past battle
  from the battle contract's trades, annotated, for animations).

She does not mention a custom bot, a ChatGPT project, Telegram-only, or any
other agent. **Which Claude surface (claude.ai app, a Project, Claude Code) is
not stated** - do not size the bus adapter on more than "Claude, surface
unknown". One incidental tool: the Go Full Page Chrome extension, "700 times a
day" (35:21), which she and Zaal note has vanished from the Chrome store. Her
visual work (wavewars.info live header, album-art equalizer, DJ Wavy spot,
green withdraw screen) is described as her own design work, no tool named.

## Who owes what, which way

Each row re-read for DIRECTION per the doc 2316 lesson. CARD = a board card
was created. UNRESOLVED = recorded, deliberately not carded.

| # | Obligation | Runs from | Runs to | By when | Evidence (transcript) | Card |
|---|---|---|---|---|---|---|
| 1 | Send Zaal the Founder Video (she screen-shared it instead) | Candy | Zaal | none stated | 22:37 Zaal: "Well, yeah, send it." / Candy: "I'll show you ... Can I just share my screen?" | CARD (no due) |
| 2 | Put the no-fail slippage toggle idea to the WaveWarZ community for thoughts | Candy | community, on Zaal's ask | none - "not something that's super urgent" | 18:32 Zaal: "I'm telling you so that you can also present it to the community and see thoughts as well. Because I know geek myth would want that." Candy 19:30: "Yeah, a no-fail toggle would be good." | CARD (no due) |
| 3 | Ping Zaal whenever a battle is live so he sees the wavewars.info live header | Candy | Zaal | each battle | 28:23 "all hit you up whenever we're doing a battle or something so you can see this on wayburst.info and remind you to check it out" | soft, recurring - not carded |
| 4 | Build out the WaveWarZ tracker on the terminal he was demoing | Zaal | himself / Candy | none stated | 09:17 "Yes, please do all that, and I'll build out the Wave Wars tracker on that terminal." | CARD (no due; said mid-distraction, medium) |
| 5 | Get in front of Kalshi / Polymarket; first concrete step proposed: list a market for a WaveWarZ battle on their platform | "we" - nobody claimed it | WaveWarZ | none | 06:54 Candy: "i really think we need to figure out how we can get a meeting with like Kelsey or them" / 31:36-31:48 "we start off by figuring out how can we make a market for a wave wars event like put up a god cloud verse hurricane polymarket or kelsey ... that's what we should do" / Zaal: "that's what Kwon was saying. That's smart." | CARD as owner Open - a decision card, not an assignment |
| 6 | "I need to drop something on Liquid that I haven't had the bandwidth to do" | Zaal | Liquid NFTs (Nathan Hill) | none | 09:36 | UNRESOLVED - what and when not stated |
| 7 | Another Hurricane dev week | wish, Zaal's | Hurric4n3ike (absent) | none | 30:13 "we need fucking hurricane to do another dev week honestly" | UNRESOLVED - Hurric4n3ike not on the call, nothing agreed |
| 8 | Testnet replay of past battles / Claude-annotated battle recreation | idea, Candy's | - | none | 20:30-21:39 | UNRESOLVED - idea, not committed |
| 9 | Community-token WaveWarZ variant (any token in, community token out) | design idea, both | - | none | 10:52-17:14 | UNRESOLVED - see Thread 2; program upgrade cost noted |

Nothing in this call touches ZAOstock directly, fractal, or the Cypher video.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **Position WaveWarZ as the verified, un-gameable event that music prediction markets settle on** - "the entertainment layer for music" - rather than competing in the music or trading industries | Candy (pitch), Zaal ("a million percent") | agreed, direction |
| 2 | **Amplification over features, with a caveat** - Candy: "we don't need to change anything, we literally just need amplification of what we already have"; Zaal: "we need to improve the product" then "we need reach" - both hold | both | agreed with tension |
| 3 | **No-fail slippage toggle is wanted** - opt-in "don't fail my transaction if it's a slippage issue", queued in order; goes to the community first | Zaal (idea), Candy (to present) | TODO via row 2 |
| 4 | **Preferred shape for community-token battles**: accept any token in, auto-swap to the battle's community token, pay out in that token - creates buy pressure instead of the sell-only pressure of a pure community-token pool | Zaal (idea), Candy agrees | design, not scheduled |
| 5 | **Nobody pays Kalshi/Polymarket for a meeting** (Candy: "they have to pay us"); Zaal would consider "a grand" later if planned - not now | both | parked |
| 6 | **"There's no reason for red on our page"** - the withdraw screen shows green even on a small SOL loss; red only for errors | Zaal + Candy | Candy's overhaul |

## Thread 1 - WaveWarZ as the oracle

Candy's argument (00:00-03:10, 05:13-06:46): music prediction markets are big
(she says "$70 billion or whatever" - her number, unverified here) but settle
on weak data - album sales, stream counts, celebrity events. Kalshi (heard as
"cal she" / "Kelsey") relied on Spotify streams and, per a podcast Candy
heard, defended it as "we trust Spotify because Spotify pays royalties";
someone then botted a market for millions. WaveWarZ has what they lack:
verified on-chain data, a poll, DJ Wavy or human judges on a three-point
system, a deterministic win/loss at the battle timer. "You can game the data
by playing the game, that's it." Zaal: "it's called an Oracle, by the way."

The model to copy is Legend Trade - a live, in-person competitive-trading event
Candy says Polymarket funded and filmed ("one of the traders took a nap"). The
ask: the same treatment for WaveWarZ, "if I can put this on like American
Idol". First move: list a WaveWarZ battle as a market on Polymarket or Kalshi
so their users ask "what is this event" - Zaal credits the same idea to "Kwon"
(as heard). Candy on access: "somebody knows somebody ... I know people too,
but I've never been one of the people that always tries to get stuff from
people."

## Thread 2 - Community-token WaveWarZ and the liquidity problem

Nathan Hill (Liquid NFTs, met at the last COC Concertz session - see
[doc 1786](../../wavewarz/1786-wavewarz-community-verified-jul2026/)) is adding
music to Liquid and raised what Candy and Zaal had also discussed: a WaveWarZ
any community can run in its own token. Zaal: upgrading the Solana program now
costs under $250 (2.5 SOL, SOL under $100). The problem both had "thought about
a hundred times": fees arrive in the community token ("Quakey" is the running
example), so WaveWarZ and the artists must sell to realise value - sell
pressure, no buy pressure. Candy's fix: an automatic sell on the back end.
Zaal's better fix (15:07-16:01): let anyone pay in any token, auto-swap to the
community token, pay out in it - newcomers end up holding the community token
and "realistically might not swap it back", which the community would love,
and it creates real trading fees. Zaal notes platforms exist for the
any-token-to-SOL leg; the extra integration is accepting SOL as a single
purchase, not two. Open, not scheduled.

## Thread 3 - Slippage, early entry, and testing

Zaal's pain: three failed 0.25 SOL buys at battle start because someone got in
between each attempt, then the pot is at 1.25 and he is out. He wants a toggle:
"don't fail my transaction if it's a slippage issue", opt-in per user. Candy:
no-fail plus a queue so simultaneous buyers settle in order. Also floated:
everyone-at-one-price for the first seconds (launch style), a steep early
bonding curve, or Zaal's lock-in-cheap-but-cannot-withdraw-until-halfway -
"I would put 0.5 SOL on every battle if I could do that."

Candy's test plan: recreate the program on testnet and replay past battles from
the battle contract's trades ("you can go recreate all the top past battles"),
which doubles as material for annotated animations - "recreate the Louis vs
geek myth battle" (names as heard).

## Thread 4 - Candy's overhaul: Founder Video and wavewars.info

Candy had Claude make a "Founder Video" listing what needs fixing on WaveWarZ
and played it over screen-share (22:53-25:30, audio not captured). Zaal's
reactions: "needs to be a different voice", and on item four - the
refresh-and-scroll-to-the-bottom loop - "I cannot stand number four ... that's
insane." She then showed the wavewars.info live-battle header: when a battle
goes live it jumps to the top of the page with both album arts and a live
equalizer, a "jump into battle" button, a tilt on hover; a DJ Wavy 1:1 spot
because "nobody even knows we have that product"; and a withdraw screen that
is green even on a small loss. She used the DJ Wavy case to tell Hurric4n3ike
"this is why you got to do a product rollout" rather than silently release.
Zaal: he could leave that page up on a stream overnight.

## Thread 5 - Zaal's asides

- The terminal demo (03:24-05:06): `zj` jumps into any of ~37 sessions across
  the Mac (10), Pi (7) and VPS (20); the WaveWarZ session was a Codex one and
  had glitched. He says he will build the WaveWarZ tracker there (row 4).
- A ZAO livestream trading wallet: $100 a day, chat suggests trades, an AI
  decides, 24/7 window next to the music - "it's not even about the money"
  (08:10-08:49). Idea only, no owner.
- "Reed just gave me 100 more dollars in paragraph credits" (03:14).

## Action Items

| # | Action | Owner | Category | Due |
|---|--------|-------|----------|-----|
| 1 | Send Zaal the Founder Video | samantha | Other | TBD |
| 2 | Put the no-fail slippage toggle to the WaveWarZ community | samantha | Social | TBD |
| 3 | Build out the WaveWarZ tracker on the terminal | zaal | Site / Tech | TBD |
| 4 | Decide who runs the Kalshi/Polymarket approach (first step: list a WaveWarZ battle market) | Open | Other | TBD |

## Key Quotes

> "we wave wars is the event that the pools can settle on so people should be predicting on the outcome of Wave Wars events. Because we have verified data that goes on chain" - Candy

> "you can game the data by playing the game that's it" - Candy

> "we need somebody to be like yo we're gonna set up a stage ... if i can put this on like american idol that's what we need and polymarket already did that for legend trade" - Candy

> "We don't need to change anything. We literally just need amplification of what we already have." - Candy

> "no we won't pay them they have to pay us" - Candy

> "So you input any token, but the output is a specific token based on the community that's pushing it. That could be valuable because then you're converting and you don't force a trade back." - Zaal

> "There's no reason for red on our page." - Zaal

> "I bet I can get Claude to do that nicely" - Candy

## Verify / Low-confidence

- **Date** - 2026-08-12 from file mtime plus Zaal's end-of-call download; the
  call never says the date. Medium.
- **Duration** - the 69.5-minute intake figure is an ffprobe artifact on raw
  AAC; decode and transcript agree on 35.5 min. High.
- **"Kelsey" / "cal she" = Kalshi** - inferred from context (prediction market,
  a CEO on a podcast, Spotify data). High but inferred.
- **"$70 billion", Legend Trade funded by Polymarket, the Kalshi CEO quote** -
  Candy's claims, not checked here. Treat as her framing, not fact.
- **"Kwon", "geek myth", "God Cloud", "Louis", "Quakey", "coins"** - names as
  heard. Zaal to confirm spellings before any of them goes on a card or a post.
- **Row 4 (tracker)** - said while Zaal was switching windows; medium.
- **Row 5 (Kalshi/Polymarket)** - carded as owner Open on purpose: it is the
  strategic item of the call and nobody took it. Not tidied into an assignment.
- **Redaction** - 32:38-34:44 is personal (a friend's relationship, a third
  party's private life); redacted in `transcript.md`, full text at
  `~/.zao/private/craig-E1NFiFOV2vyG-candy-zaal-20260812-full.md`.
- **Artifacts** - isolated "Thank you." lines on the silent track; the Founder
  Video audio (22:53-25:30) is not in the transcript, only the reactions.

## Research Seeds

- WaveWarZ as a settlement oracle: what Kalshi / Polymarket actually require to
  list an event market, and whether a WaveWarZ battle qualifies - verify before
  anyone reaches out.
- The any-token-in / community-token-out battle: a short spec with the swap leg
  and the fee accounting, for Hurric4n3ike.
- Battle replay from the contract as a test harness and as animation source.

## Memory Updates

None written. Candidate for `project_candytoybox_samantha` once Zaal confirms:
"uses Claude (surface unknown) - had Claude produce the WaveWarZ Founder Video,
2026-08-12 call, doc 2340."

## Also See

- [Doc 743](../../wavewarz/743-wavewarz-whitepaper-v2-deep-dive/) - WaveWarZ canonical (fees, team, wavewars.info)
- [Doc 1786](../../wavewarz/1786-wavewarz-community-verified-jul2026/) - Nathan Hill / Liquid NFTs as a verified donor entity
- [Doc 2083](../../wavewarz/2083-wavewarz-ai-tournament-grand-final-result/) - AI tournament grand final (battle outcomes as settled events)
- [Doc 2267](../../wavewarz/2267-wavewarz-surface-map/) - WaveWarZ surface map

## Distribution Log

- Cowork tracker: 4 tasks inserted (legacy_source=meeting:candy-x-zaal-wavewarz-as-the-oracle-for--2026-08-12); the Kalshi/Polymarket card is owner Open (null owner_id) on purpose
- Bonfire: 4 episodes posted, 0 failed
- Telegram: skipped
- Calendar: skipped
- Memory writes: 0

## Transcript

Full transcript (one personal stretch redacted): [transcript.md](transcript.md)
