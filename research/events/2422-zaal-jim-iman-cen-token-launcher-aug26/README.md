---
topic: events
type: guide
status: research-complete
last-validated: 2026-08-26
superseded-by:
related-docs: "2362, 2190, 2419, 2097"
original-query: "/meeting ~/Desktop/downloads/craig-dLSOlmCitLBJ (3-track Craig multitrack)"
tier: STANDARD
---

# 2422 - Zaal x Jim x Iman: CEN token launcher goes live, Iman's token commissioned

> **Goal:** Recap the 2026-08-26 call where the Better Call Zaal token was bought into life on-chain, Jim McGee laid out the Crypto Endowment Network stack for Iman, and Iman commissioned his own artist token on it for a SongChain token-gated world.

This is the execution follow-on to [doc 2362](../2362-jim-mcgee-crypto-endowment-token-launch-aug21/) (2026-08-21 planning call). That call decided to launch a fresh BCZ token on Jim's stack. This call **did it**, then extended the same stack to Iman.

## Meeting

| | |
|---|---|
| Date | 2026-08-26 (Wednesday; confirmed by Zaal - the recording itself carries no date anchor) |
| Duration | ~55 min |
| Attendees | Zaal, James "Jim" McGee (Crypto Endowment Network, Meme for Trees), Iman |
| Also present | Thy Revolution joined partway but never got audio through - see "What did NOT happen" |
| Platform | Discord / Craig, 3-track per-speaker multitrack |
| Source | `~/Desktop/downloads/craig-dLSOlmCitLBJ/` (1-zaal.wav, 2-jim_ccc.wav, 3-imanafrikah_.wav) |
| Transcript | [transcript.md](transcript.md) |

**Speaker attribution is a multitrack fact, not an inference** - each track is one person, labelled from the filename. Loop-repeat rates: Zaal 1%, Jim 0%, Iman 7%, all far under the 20% flag threshold, so quotes here are verbatim rather than approximate.

## Done live, on the call

1. **The Better Call Zaal token went live.** Zaal swapped 0.001 ETH through Matcha into BCZ. The UI showed a "minus 100" value difference, which Jim explained is what buying from an untouched sell wall looks like. Market cap moved **9.888 to 10** - Zaal: *"we're officially live."*
2. **Jim and Iman were both added as admins on Zaal's Artizen fund.**
3. **Iman commissioned his token on the spot** and went off to send Jim a name, ticker and image by Telegram.

## Decisions

| # | Decision | Owner | Confidence |
|---|---|---|---|
| 1 | Iman's artist token gets built on the CEN launcher, using **Jim's defaults** rather than a custom structure - Zaal: *"Iman's newer to it, so let's rock with the defaults... we don't need to make it too complicated"* | zaal / jim | high |
| 2 | **Two-layer build for Iman:** his personal token paired off Jim's launcher (so it networks back to BCZ), plus **his own token factory** for the SongChain platform, so anyone launching there pairs against Iman's token | jim | high |
| 3 | **No further confirmation rounds needed** - Zaal: *"we don't have to do any more confirmations. I'm in. Like James can just make it and rock it out"* | zaal | high |
| 4 | Iman keeps design authority; engineering goes to Jim - *"the design things you have full reign over"* | Open | high |
| 5 | Zaal takes **community manager** of the token network: bringing people in, live streams, earned media, music and art around it, while Jim runs the endowment engineering | zaal | high |
| 6 | Subscription-splitting is reframed to stay legal: members pay for **Zaal's written report about** a subscription, not for access to the subscription. Jim: *"That is a curated product where you become a media producer on top of a curated service"* | zaal | medium |

## Actions

| Owner | Action | Why | Done when |
|---|---|---|---|
| iman | DM Jim the token name, ticker (**IMAN**) and image | Jim cannot launch without all three; he asked for it in writing so he does not mess it up | Jim has all three in Telegram |
| jim | Launch Iman's token | Committed on the call: *"within the next 10-20 minutes easily"* | Token is live on Base |
| jim | Build the SongChain platform token factory tied back to Iman's token | The second layer of decision 2 | Factory deployed, contract address handed to Iman |
| jim | Look at a factory-of-factories so Zaal can unlock token launching for community members himself | *"I think I can even build a factory for factories, I've never done that... that's something I'm gonna look at today"* | Zaal has the tool |
| iman | Scope token-gating on SongChain ("SongChain Pro") while Jim builds the launcher | Zaal wants the token gate testable as soon as Iman's token exists | A gated portion of SongChain exists to test against |
| zaal | Email Venus at Artizen to add Jim as a collaborator | Jim has two Artizen accounts and needs to be on the ZAO fund | Jim shows as collaborator |
| zaal | Send Jim the Cassie / Hypersnap Farcaster protocol video via the ZABAL Gamez link | Jim did not know Hypersnap; the ZABAL link carries a transcript and an LLMs.txt so his agent can read it without watching | Link sent |
| zaal | Send Jim the Reddit thread on the Orca terminal GUI | Offered twice in the opening minutes | Link sent |
| open | Invite Thy Revolution into the CEN DAO conversation properly | He joined this call but was never audible; Jim had already sent him a DAO invite | Rev has actually been talked to |
| zaal | Buy into the Artizen 24-hour round | Starting within hours of the call; Jim's approach is to wait for the open then buy $100 | Position taken |

## The Crypto Endowment Network, in Jim's words

The clearest statement of the stack yet recorded:

> "The Crypto Endowment Network is an on-chain tool stack that allows us to reroute AAVE lending yields through smart contracts to auto-buy tokens and build liquidity against them while also funding charity."

The yield splits in **thirds**:

1. **Charities on the ground today.**
2. **Endowment token holders** - funding the auto-buy and liquidity build for their own tokens.
3. **Back to the CEN liquidity manager** - roughly 20 launching liquidity pools, including 15 endowment tokens, USDC, a Coinbase Bitcoin and an Ethereum doorway, plus the legacy memes Meme for Trees and Real World Impact. Each got 5% of supply into the pools at launch.

Why he thinks this is different from every prior creator-coin attempt:

> "This is yet another attempt at creator coins and they have not done super well if we've all been paying attention. But none of them have had the auto buy functions built in with true endowment functions to pay for art."

> "Not just liquidity pool fees taken from the community, but actually money from outside the community being injected with regularity."

His own framing of why he built it:

> "I'm a bleeding heart hippie that gives away all his money all the time. So I built tools to perpetually give away my money - but more money than I had, because I didn't have that much."

## Numbers and dates

| Figure | Context | Said by |
|---|---|---|
| **$10,000** | Raised so far for the Crypto Endowment Network | Jim |
| **$2,244.19** | Currently locked into the endowments | Jim |
| **6 of 100** | CEN founder NFTs claimed; Zaal is a founding member | Zaal, reading the screen |
| **100** | Hard cap on Jim's DAO membership; after that, one invitation per member per year | Jim |
| **$3,000** | Raised for ZAO Festivals - Zaal: *"if I really need to I can float it to myself"* | Zaal |
| **9.888 to 10** | BCZ market cap before and after the first buy | Zaal |
| **0.001 ETH** | Size of that first buy | Zaal |
| **~$200/month** | What Cassie runs a full Hypersnap fork on, at about half Farcaster's user count | Zaal |
| **~$100,000/month** | What Zaal says the main Farcaster client now costs to run, up from ~$500. *"That's why they're selling."* | Zaal |
| **~$50/week** | Jim's current X creator payout; $600-700 total last year, nothing for most of this year | Jim |
| **~100 trees/week** | What that payout funds through Meme for Trees | Jim |
| **4TB+** | Minimum SSD to run a Base node, and he advises going larger | Jim |
| **5 years** | After which everything in the CEN goes to charity | Jim |
| **10-20 min / ~1 hour** | Jim's estimate to launch Iman's token, then the platform factory | Jim |

Relative dates resolved against 2026-08-26: *"I said this on stream yesterday"* = **2026-08-25**. *"tomorrow I'm talking to someone who's building something really cool"* = **2026-08-27**. *"in the next few hours we're going to get started to the 24 hour thing"* = the Artizen round opening the evening of **2026-08-26**.

## Iman's ask - the SongChain token-gated world

Iman was explicit that he is not exploring, he is executing:

> "I'm literally in phase two of that idea. The first part of it worked out perfectly. Second phase is why we're here. And that's why Zaal thought of this meeting to be relevant, because the infrastructure needed, you have it."

The shape:

> "Artists on SongChain are going to be able to create, for lack of a better term, their own world onto SongChain... they are literally building their own UI on top of the SongChain UI... but that idea has to be token gated."

And the motive, which is the artist-side argument for the whole stack:

> "I'm a musician and I want to create a place where people can find all my art. I'm tired of posting on social media for free. I'm tired of putting my content on other platforms. I want to control that content."

Jim's answer on mechanics: gating can be **pay-per-entry**, **hold-a-balance**, or both mixed per piece of content - *"you could have something that you have to give a token every time they look at it, you could have something they can only see it if they hold a million tokens."*

Iman named **Nemesis** as a likely second volunteer for the trial, subject to asking her.

## What did NOT happen

- **Thy Revolution never got audio through.** Zaal greeted him at least four times, Jim said *"he's on mute"*, and there are only three recorded tracks. Zaal had specifically wanted him on: *"I want Rev to come in, though, because I wanted to talk to him about it."* Jim had already DM'd him a DAO invite. **The Rev conversation did not happen and is still owed.**
- **The subscription-splitting DAO stalled at legality** before being reframed. It got a workable shape (sell the report, not the access) but no owner, no date, and Zaal explicitly deferred: *"We can keep talking about this later."*
- **The arbitrage-bot idea was talked out of.** Zaal wanted his Farcaster ZOL bot to arbitrage BCZ at ~$10 scale for the data. Jim's verdict: a correctly configured bot *"will almost never trade... the competition is just so fierce, the people actually doing it are running nodes and they don't even need capital to do it anymore."* No decision recorded either way.
- **Zaal left mid-call** to work, handing the CEN explainer to Jim, so he was not present for parts of the Iman exchange.

## Contradictions and corrections against existing docs

- **Doc 2362 (2026-08-21) planned the BCZ launch. This call executed it.** 2362 should be read as superseded on the question of whether BCZ exists - it does, as of this call.
- **"Artisan" throughout the raw transcript is Artizen.** Corrected in this doc; left as spoken in the transcript.
- **Iman's ticker is IMAN.** Confirmed by Zaal 2026-08-26. The transcript renders it twice as *"Ayman"*, which is a Whisper artifact, not the ticker. Cite IMAN.
- **Hypersnap connects to [doc 2419](../../identity/2419-zid-state-and-signup-spec/).** Zaal's plan to spin up a node and build ZAO social on the Snapchain fork rather than the main Farcaster client is the infrastructure half of the ZID work already specced there.

## Commitments to people outside the org

- **To Jim:** curator seat on the ZAO Artizen fund alongside Civil and Jose; Artizen collaborator access via Venus; the Hypersnap video and the Orca thread.
- **To Iman:** community-manager support, live-stream slots and earned media around his token; a look at token-gating SongChain.
- **From Jim, to both:** the token, the factory, and a possible factory-of-factories, built free, on the condition that they use the endowment tokens.

## Key quotes

> "If you're listening to people saying things for signals, you're too late. If you want to know what the fuck I'm doing, just go to my GitHub or go to my wallet and watch what I'm doing." - Zaal

> "Execution is always difficult and participation is always excruciatingly difficult... they can't get people to actively participate in it because there's no immediate gratification. Now I'm not saying don't do it - I just want to make sure you're aware, and this is the largest challenge that I've seen in these types of efforts." - Jim, on the ZAO social / respect-tracking idea

> "The workspace, the play space, they're not the same space all the time. I mostly host play spaces... but a lot of your spaces are goal oriented. And if random people come in and they don't even know what the goal is, obviously they're going to be a little bit off track." - Jim

> "They just need to not spend their money to send money to these people to help. That's the point of the endowments." - Jim

> "Once this just does what it's supposed to do, you're going to have a whole bunch of Africans using your tools, trust." - Iman

## Research seeds

- **ZAO Pro** - Zaal's active-members tier: open ZAO stays open, but a Pro group where the only entry condition is committing to be active, and a week of inactivity drops you back out. Directly prompted by Jim's 100-member DAO cap.
- **ZID + living article** - a ZID number for every person who has been part of The ZAO, plus an article per person on how Zaal met them and what they are working on, kept living. Feeds thezao.com/<name> pages showing socials plus on-chain contribution history. Ties to doc 2419.
- **Hypersnap node** - spin one up for network access and to host ZAO social on the fork rather than the main client.
- **Factory-of-factories** - Jim has not built one before; if it works it is the mechanism for ZAO members to launch community tokens without Jim in the loop.
- **Scam-flagging friction** - CEN tokens get auto-flagged as scams by blockchain explorers and screeners, and clearing it is currently manual, per token, by contacting each site. An unsolved distribution tax on every token launched from this stack.

## Also See

- [Doc 2362](../2362-jim-mcgee-crypto-endowment-token-launch-aug21/) - the 2026-08-21 planning call this executes
- [Doc 2190](../../business/2190-sparkz-endowment-network-integration/) - Sparkz x endowment network integration
- [Doc 2419](../../identity/2419-zid-state-and-signup-spec/) - ZID state and signup spec (Hypersnap)
- [Doc 2097](../../business/2097-wyde-partnership-music-cause-coin/) - Poly Raiders / music cause-coin thread

## Sources

- [FULL] The recording: ~55 min, 3-track Craig multitrack, transcribed locally with `whisper-large-v3-turbo` and the anti-hallucination flags, merged by timestamp with `interleave-tracks.py`. Speaker labels are ground truth from track filenames.
- Claims about the CEN's contracts, the AAVE yield routing, the thirds split, the pool composition and the dollar figures are **as stated on the call by Jim**, its builder, and were not re-verified against contracts or a block explorer this run.
- Claims about Hypersnap, Snapchain and Farcaster infra costs are **as stated by Zaal**, unverified.
- Not fetched this run: Artizen, SongChain, Matcha, Meme for Trees, Real World Impact.
