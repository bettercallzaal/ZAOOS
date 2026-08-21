# Zaal x Jim McGee (Crypto Endowment Network) - Token Launch Planning, Aug 21

**Type:** STANDALONE
**Date recorded:** 2026-08-21 (Craig multitrack, folder `craig-ANu02KmNDEZ8`, 2 tracks)
**Attendees:** Zaal, James "Jim" McGee (CCC - builds the Crypto Endowment Network /
"CEN" token infrastructure; also built Meme for Trees)
**Source:** `~/.zao/private/meetings/craig-ANu02KmNDEZ8--1-zaal.txt` (Zaal's track,
481 lines) + `craig-ANu02KmNDEZ8--2-jim_ccc.txt` (Jim's track, 664 lines).
Transcribed with the v2 anti-hallucination flags
(`--condition-on-previous-text False --hallucination-silence-threshold 2
--no-speech-threshold 0.6`); repetition well under the 20% flag threshold on
both tracks - quoted as verbatim, not approximate.
**Speaker attribution:** by track filename (multitrack fact, not inferred).

## What this is

Jim runs a token-launch/liquidity infrastructure toolkit (the Crypto Endowment
Network) - a launcher, a tipping system that auto-creates liquidity pools between
tipper/tippee tokens, and "endowment" tokens that route lending yield into
auto-buy pressure on whatever they're paired with. He's offering to build Zaal
(and the wider ZAO/Zabal ecosystem) creator tokens on this stack. This call is
the planning session for that build.

## Key decisions

- **New "Better Call Zaal" (BCZ) token, under the Zabal ecosystem, not a Zabal V2.**
  Zaal decided against relaunching the Zabal token itself (currently paired
  Zabal -> Sang -> Virtuals -> ETH on a V2 Uniswap contract, which he called
  broken - "it fucks me anyways"). Instead: launch BCZ fresh, and separately keep
  daily-tipping ZBAL holders (proportional to their holdings) so existing holders
  still benefit without a technical relaunch of Zabal itself.
- **Liquidity pairing, locked**: 50% ETH / 50% USDC pool, 25% of each locked, 25%
  left adjustable. Simple by design - "so we can explain it to more people."
- **Token allocation**: 25% of BCZ supply to Jim's system to seed liquidity pairs.
  Creator-token margin target discussed as ~20-25% ("even quarter").
- **Sequencing**: three tokens planned in order - Zaal (BCZ) first, then Iman,
  then Jango (Django). After ~a week of visible traction, Zaal expects to bring
  in Hurricane and "a couple other people," capped at roughly one new token
  launch per week (waitlist, not a rush).
- **PFP/branding**: BCZ token uses Zaal's current profile picture as placeholder
  art, subject to change later.
- **A separate, unrelated token**: Zaal is also running a distinct experiment -
  an AI-agent-managed droid token via Clanker/Zolcaster (with "Epic Dylan" /
  Trinity Labs on Farcaster), testing whether an agent can manage tokenomics
  over time. Explicitly parallel to the BCZ work, not the same token.
- **Sparks stays unbuilt for now.** Zaal is deliberately not forcing a Sparks
  token yet - wants more bandwidth first, plans to start it as a "hearth" (not a
  token) and revisit after his October event.
- **Jim's ask in return**: pair one pool against a Jim/CEN endowment asset
  (ETH-pegged art endowment, or the CEN token itself) as "proof of function" he
  can show Artisan before January - he wants to demonstrate real on-chain volume,
  not just a working contract on paper.

## Commitments (recap-followthrough.md block)

| Who | Owes | To whom | By when | Status |
|---|---|---|---|---|
| Jim | Send a written confirmation list of the pairing choices (ETH + ART + USDC pool) before building | Zaal | Not stated - "I'll send you just a double check" | OPEN |
| Jim | Launch the BCZ token per the agreed spec (50/50 ETH-USDC, 25% locked each side, 25% supply to Jim's system, one of Jim's endowment tokens in the pairing selection) | Zaal | Not stated | OPEN |
| Zaal | Send logos/branding assets for the token | Jim | Not stated | OPEN |
| Zaal | Send Jim the Boardwalk launcher info a friend texted him (referenced, not yet sent on-call) | Jim | Not stated | OPEN |
| Zaal | Apply to the Artisan fund at artisan.thezow.com (sic - as spoken) and plan a live stream / X Space with Jim to co-present the Crypto Endowment Network so Jim can be accepted into the fund | Jim | "Doesn't matter till next Thursday really anyways" (~2026-08-27) | OPEN |
| Zaal | Added Jim to the ZaoDevs Telegram group (per-person topic) during the call | - | done on-call | DONE |

No money moved and nothing was launched on this call - it is a spec/planning
session. All token-launch, allocation, and fund-application actions above are
Zaal's or Jim's next steps, not yet executed.

## Notable color (not decisions, but load-bearing context)

- Jim's stated principle: further from a "fair launch," harder to sustain a
  traditionally valued market - he pushed back gently on Zaal wanting to keep a
  large token share for himself, without overriding Zaal's call.
- Jim disclosed his own frustration with NFTs generally (most NFT art/media is
  stored off-chain in a server, only a small image can actually go on-chain) -
  volunteered as a disclaimer, not a knock on this project.
- Jim referenced Poly Raiders as a working precedent: liquidity-pool-funded,
  "taking out like a dollar a day for over a year," and separately a
  kid-sponsorship token (PR24/PR25, ~$10 each, one token = one kid helped) tied
  to Poly Raiders - Zaal has "been homies" with that project since 2024.
- Zaal's stated operating principle for this build: "low overhead, high
  retention and profit margin" - willing to skip anything that costs money
  without a clear return.
- Zaal name-checked Rene positively mid-call ("I love Rene... every time I hear
  him speak, I'm inspired") in the context of who else might want a token under
  this system - no commitment attached, listed for context only.

## Open / unresolved

- No firm date for the actual BCZ token launch - "so we can send you 25% of the
  supply and get it paired up" is agreed in principle, execution date not set.
- Boardwalk launcher (referenced by Zaal as a comparable tool worth borrowing
  ideas from) was never actually explained on-call - Zaal said he'd forward what
  a friend texted him. Not sent as of this recap. See also
  `project_deez_boardwalk.md` for prior ZAO context on Boardwalk.
- The live-stream/X-Space co-presentation for the Artisan fund application has
  no date - "as soon as we plan it, I'll just pop you in."

## Links

- Transcripts: `~/.zao/private/meetings/craig-ANu02KmNDEZ8--1-zaal.txt`,
  `craig-ANu02KmNDEZ8--2-jim_ccc.txt` (stay private per `pii-hygiene.md`)
- Founding brief: `~/zao-vault/handoffs/meetings-craig.md`
- Prior Boardwalk context: memory `project_deez_boardwalk.md`
