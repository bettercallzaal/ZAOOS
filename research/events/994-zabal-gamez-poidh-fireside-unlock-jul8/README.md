---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-07-08
related-docs: 992, 631, 625, 759, 768, 786, 722, 948
tier: STANDARD
---

# 994 - ZABAL Gamez x POIDH Fireside (Kenny, Thy Revolution, Mauro)

> **Goal:** Lock in action items + decisions from the 2026-07-08 X Space (cross-posted
> Farcaster) fireside with Zaal, Kenny (POIDH founder), Thy Revolution/Rev (COC), and Mauro
> (Zao Poker), covering the POIDH x ZABAL Gamez integration, a POID bounty deadline calendar,
> the Unlock Protocol collectible + clipping-bounty pitch, and a Zao Poker POIDH tournament
> bounty.

Recording: `space_2026-07-09T01-15-11-660Z.mp4` (audio-only capture, ~58 min).

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **Build the POIDH x ZABAL Gamez workshop-page integration** - pre-populate a POIDH bounty-creation form on each workshop page using the clipping-bounty template info learned over R1-R4 | Zaal | TODO |
| 2 | **Test the "spark a recording into a POIDH bounty" tool** on this very fireside recording via `ziballgames.com/recordings` - if it works, any recording can be sparked | Zaal | TODO |
| 3 | **Build a POID bounty deadline calendar** - query on-chain bounty description text for deadline dates, present a unified calendar view - named "task number one for Kenny and Zal," to be submitted as a ZABAL Gamez Buildathon submission | Both (Zaal + Kenny) | TODO |
| 4 | **Minted a live Unlock Protocol collectible** during the space (9 free keys, ERC-1155, expires 5pm ET same day) for attendees to claim as proof-of-attendance - already executed live, not a future action | Zaal | DONE |
| 5 | **Kenny will boost up to 2 more Farcaster-culture bounties** at $25 each for anyone running a Farcaster-promotion bounty | Kenny | TODO |
| 6 | **Reaffirmed the Unlock Protocol x POIDH clipping-bounty pitch** ($5-10 bounty, Unlock rallies contributions) - this is the same idea already scaffolded as zpoidh R5 | Zaal | WIP |
| 7 | **Create a POIDH bounty for the first Zao Poker tournament winner** | Zaal + Mauro | TODO |

## Thread 1 - POIDH x ZABAL Gamez integration

### The Idea

Zaal's stated top priority for the call: build a POIDH bounty-creation flow directly into
each ZABAL Gamez workshop page, pre-populated with the clipping-bounty template learned
across R1-R4 in zpoidh. He flagged this explicitly for his own capture bot: "my goal over
sometime in July is to actually go back through and watch every single Zabal game session on
the live stream such that we can go back through and clip it up."

### Why It Matters

This is the same "clipper -> POIDH pipeline" concept from [doc 992](../../agents/992-live-clipper-agent-creator-ops/)
- this call is the live product-owner conversation validating that direction with the POIDH
founder himself.

### Next Step

Zaal builds the workshop-page integration; test target is `ziballgames.com/recordings`. If
sparking a bounty from this exact recording works, the pattern generalizes to every past and
future ZABAL Gamez recording.

## Thread 2 - POID bounty deadline calendar

### The Idea

Kenny's long-standing pain point: "why do poid bounties not have deadlines" is a
philosophical design choice (no on-chain enforcement, "I prefer social standards more than
hard laws whenever possible"), not a missing feature. But bounty creators DO write deadlines
into the free-text description. Kenny's proposed fix: an agent that reads bounty description
text, extracts stated deadlines, and presents them in one calendar view - bounties with no
stated deadline just don't show up.

### Why It Matters

Directly useful for zpoidh's own round-tracking (R1-R5 all have hand-maintained deadline
dates in README files right now). Kenny explicitly named this "task number one for Kenny and
Zal" and pointed at NARS DAO's bounty board + the POID GitHub as prior art to check first.

### Decisions Pending

Not decided: where this lives (POID's own repo vs. a zpoidh/ZABAL Gamez tool), who owns the
on-chain parsing vs. the calendar UI.

### Next Step

Kenny: look at the NARS DAO bounty board + POID GitHub. Zaal: fold it into the ZABAL Gamez
Buildathon submission he's already building for himself as an example submission.

## Thread 3 - Unlock Protocol (collectible + clipping bounty)

### The Idea

Zaal minted a live 9-key, free, ERC-1155 Unlock Protocol collectible during the space as
proof-of-attendance (config already logged in [zpoidh docs/unlock-fireside-collectible.md](https://github.com/bettercallzaal/zpoidh/blob/main/docs/unlock-fireside-collectible.md)).
Separately, he reaffirmed the pitch to run a POIDH clipping bounty funded by Unlock ("$5, $10
bounty and do something around Unlock and see how they rally around that") - the same idea
already scaffolded as zpoidh Round 5.

### Why It Matters

UnlockDAO already runs bounties via Incented; pairing Unlock's budget with POIDH's clip-up
format is a low-lift way to demo POIDH to a new partner while producing real Unlock
promotion.

### Decisions Pending

Reward amount, source recording link, and issuer wallet are still unlocked - same open items
already tracked in `rounds/r5/README.md` in zpoidh.

### Next Step

Send the pitch DM (already drafted at `rounds/r5/pitch-dm.md`), lock the placeholders with
Kenny + trigs, then cast.

## Thread 4 - Empire Builder collaboration

### The Idea

Kenny talked with yerbearserker (Empire Builder) about using Empire Builder's tooling so
bounty creators can offer secondary/custom rewards beyond POIDH's native single-winner
constraint. Zaal separately wants every ZABAL Gamez / Buildathon submission to carry BOTH a
POID bounty option and an Empire option "so that they can spread their submission out farther
in the ecosystem."

### Why It Matters

This is the same distribution-multiplier logic behind zpoidh's existing "score-by-count"
$ZABAL mechanic (slot 8 of $ZABAL Empire) - Empire Builder and POIDH already share
submitters; formalizing secondary rewards deepens that.

### Decisions Pending

No concrete mechanism agreed - Kenny said "got a lot of different pots on the stove," this is
an open conversation, not a committed build.

## Thread 5 - Zao Poker (Mauro)

### The Idea

Mauro is building Zao Poker - front end + back end, currently on Vercel, evaluating Svelte,
using a library called "Terso" for the database, working through poker's game-tree logic.
Zaal proposed creating a POIDH bounty for the winner of Zao Poker's first tournament, and
separately discussed with Mauro turning the traditional casino "rake" into a communal
benefit (burn a token, use a community token) rather than platform profit.

### Why It Matters

New project thread for the ZAO ecosystem, not previously in memory or research - genuinely
new (see Research Seeds below). First mention of "Terso" as a dependency; spelling not
independently verified against a package registry in this pass.

### Next Step

Mauro keeps building; Zaal creates the tournament-winner POIDH bounty once there's a testable
game.

## Thread 6 - Thy Revolution / COC

### The Idea

Rev gave an overview of The Community's (COC) mission - web3 movement, weekly Friday/Saturday
spaces at 9pm UK time, and the recent Wave Wars x Poly Raiders collaboration that helped fund
a water pump serving 500 homes in Nigeria. Zaal proposed a bounty around COC's book (content
creation using COC's existing assets) and floated interviewing Kenny for a COC space.

### Why It Matters

Confirms COC / Thy Revolution as an active, ongoing ZAO ecosystem partner (already documented
- see doc 722f people-network and doc 849). Not new, no memory update needed.

### Next Step

No firm commitment - "maybe a bounty out about the COC book" is a floated idea, not yet
scoped.

## Action Items

| # | Action | Owner | Category | Due |
|---|--------|-------|----------|-----|
| 1 | Test the recording -> POIDH-bounty spark tool on this fireside recording at ziballgames.com/recordings | Zaal | Bounty | TBD |
| 2 | Build POIDH x ZABAL Gamez workshop-page bounty integration (pre-populated form) | Zaal | Bounty | TBD (July) |
| 3 | Build the POID bounty deadline calendar (query on-chain descriptions for dates) | Both | Bounty | TBD |
| 4 | Look at NARS DAO bounty board + POID GitHub for deadline-calendar prior art | Kenny | Bounty | TBD |
| 5 | Watch every ZABAL Gamez July live-stream session + clip it up | Zaal | Social | TBD |
| 6 | Create an official Zao community calendar others can add events to | Zaal | ZAO Devz | TBD |
| 7 | Lock R5 (Unlock x POIDH clip bounty) placeholders + send pitch DM to trigs + Kenny | Zaal | Bounty | TBD |
| 8 | Continue Logadog bounties for a couple more weeks post-July 4 | Kenny | Bounty | TBD |
| 9 | Keep building Zao Poker (Terso DB, hosting) toward a testable tournament | Mauro | ZAO Devz | TBD |
| 10 | Create a POIDH bounty for the first Zao Poker tournament winner | Zaal + Mauro | Bounty | TBD |
| 11 | Ship the mp3-to-mp4 tool (with Nikki Sap) and publish this fireside's recording + transcript on the ZABAL Gamez site | Zaal | Site / Tech | TBD |

## Key Quotes

> "The vision for POI is more a social network than a bounty board. It's really we just want to give you a flexible tool you can use for any sort of incentivization you want." - Kenny

> "I built poid because I think we should stop building big organizations... Sometimes I'll say that poy bounties are just outcome markets." - Kenny

> "Why do poid bounties not have deadlines... it's a philosophical design choice there right of like you're leaving it open to the bounty creator... I prefer social standards more than hard laws whenever possible." - Kenny

> "I would like for every single submission to have a poid bounty along with it as well as an empire... as optional options for people to submit with so that they can spread their submission out farther in the ecosystem." - Zaal

> "I know UnlockDAO has had a bounty that they are actively using Incented for. So I think it'd be a great opportunity for us to just whip up a $5, $10 bounty and do something around Unlock." - Zaal

> "The utilisation of the Wave Wars technology helps the communities come together and generate enough funds to fund a water pump in Nigeria, helping 500 homes have access to clean water." - Thy Revolution

> "I've changed my handle a little bit to like the internet's coordination protocol. And I don't want poi.xyz to be the only front end for this." - Kenny

## Verify / Low-confidence

- **Speaker attribution for Mauro** - diarization (sherpa-onnx, forced 4-speaker) merged Mauro's "Hey guys, great to be here... Poker App" turn into the same label as Zaal's surrounding turns. Attributed to Mauro by content (he's clearly a distinct person introducing himself and his project), but not confirmed against a separate audio channel. See `transcript.md` header.
- **"Terso" (Mauro's DB library)** - name as transcribed by Whisper, not cross-checked against an actual package/library registry. Could be a mis-transcription of a real library name.
- **Action 2's due date** - Zaal said "sometime in July" and flagged it as high priority for his own bot to catch, but gave no specific date.
- **Thread 4 (Empire Builder secondary rewards)** - discussed as an open idea ("a lot of different pots on the stove"), not a committed build - listed as a research seed, not a firm action.
- **Mauro / Zao Poker as a new entity** - no hit in research/ or MEMORY.md during the Pass E cross-check. Proposed as a new memory entry below; needs Zaal's confirm before writing (per skill's memory-write gate).

## Research Seeds

- POID bounty deadline calendar (on-chain description parsing -> unified calendar view)
- POID submitter reputation/history tool (wallet's bounty history -> "verifiable active community member" story)
- Empire Builder secondary/custom-reward tooling for POIDH bounty creators
- Zao Poker (Mauro) - new ZAO ecosystem project, rake-to-communal-benefit token mechanics
- zolcaster - Zaal's private Farcaster client idea with fork-and-reward tokenomics (already has a doc, see Also See)
- mp3-to-mp4 tool (with Nikki Sap) for publishing X Space / Farcaster recordings + transcripts

## Memory Updates

Proposed (not yet written - needs Zaal's confirm per the skill's memory-write gate):

- `project_zao_poker_mauro.md` - Mauro is building Zao Poker (front end + back end, Vercel hosting, evaluating Svelte, "Terso" DB library). Discussing with Zaal: a POIDH bounty for the first tournament winner, and turning the traditional casino "rake" into a communal benefit via token mechanics. New project thread, no prior memory or research doc found.

## Also See

- [Doc 992](../../agents/992-live-clipper-agent-creator-ops/) - the clipper -> POIDH pipeline concept this call's Thread 1 is the live product conversation for
- [Doc 631](../../../research/631-poidh-zabal-sentinel/) - POIDH x $ZABAL x Sentinel convergence map (Empire Builder collab context)
- [Doc 625](../../../research/625-poidh-zao-bounty-playbook/) - POIDH x ZAO bounty playbook (18 templates)
- [Doc 722f](../../dev-workflows/722-zao-claude-code-3-month-synthesis/722f-people-network/) - people network, includes Thy Revolution
- [Doc 849](../../business/849-zao-artizen-execution-build-plan/) - references Thy Revolution / COC
- [Doc 925](../../agents/925-zol-free-cast-posting-build-guide/) - zolcaster background
- zpoidh repo (`github.com/bettercallzaal/zpoidh`) - R1-R5 bounty rounds, R5 is the Unlock draft this call reaffirmed

## Distribution Log

- actions.json / Supabase tracker: not yet written - pending Zaal's target confirm
- Bonfire ingest: not yet queued - pending confirm
- Telegram: not yet printed - opt-in, pending request
- Calendar: not checked yet - pending confirm
- Memory writes: 0 - 1 proposed (`project_zao_poker_mauro`), pending confirm
- zpoidh POIDH-idea issues: see the separate issue list drafted alongside this recap

## Transcript

Full transcript: [transcript.md](transcript.md)
