# BUILD BRIEF - zaodroid + Hats admin (for ZOE on the Pi)

> Companion to doc 922. This is the executable build brief. START with a self-hosted **zaodroid**
> (tokenless TEST droid) that (1) is a Farcaster concierge for The ZAO and (2) administers Hats
> Protocol for ZAO access. Prove it, then apply the pattern to zabaldroid.

## Goal
A self-hosted AI droid (brained by ZOE) with its own Farcaster account that helps people in The ZAO
AND can administer Hats Protocol access hats. Tokenless. Test rig first, then zabaldroid.

## Architecture (why self-hosted, not a plain Clanker droid)
- A plain Clanker droid can ONLY cast/reply with a personality - it CANNOT sign onchain
  transactions. To mint/revoke Hats you MUST self-host the agent with its own wallet.
- Brain: ZOE. Farcaster account: via Neynar managed signer (cast + reply). Onchain: a wallet that
  wears a Hats **Autonomous Admin** hat on Optimism.
- Hats tooling (all exist, MIT/TS): `Hats-Protocol/hats-mcp-server` (MCP tools for an AI agent -
  use this as ZOE's hat interface), `sdk-v1-core`, `hats-api` (REST), `subgraph` (GraphQL),
  `modules-sdk`. The ZAO tree is **chain 10 (Optimism), tree 226** (app.hatsprotocol.xyz/trees/10/226).

## Tasks (in order - do NOT skip the guardrails)
1. **Read the tree first.** Pull tree 226 on Optimism via the subgraph or hats-api. List every hat
   (Top Hat, admin hats, member/access hats) with ids + wearers. Identify which hat = "ZAO access"
   and where an Autonomous Admin hat should sit (Hats recommends just below the Top Hat). REPORT
   back to Zaal before any write. Do not mint/spend anything without confirmation.
2. Stand up `hats-mcp-server` on the Pi. Verify READ ops: `isWearerOfHat`, tree read, `accountCanClaim`.
3. Set up the zaodroid Farcaster account via Neynar (managed signer). Pick the handle deliberately.
   Load the zaodroid voice (on Zaal's clipboard; also summarized below).
4. **Stage 1 - GUIDE ONLY (read-only, ship first):** droid answers "am I in The ZAO?"
   (`isWearerOfHat`), explains the tree, and walks people to CLAIM their access hat (claimable hats
   + Multi Claims Hatter: `accountCanClaim` / `claimHat`). No signing by the droid. Test the voice
   and the flow live.
5. **Stage 2 - AUTONOMOUS ADMIN (write, guarded):** give the droid wallet an Autonomous Admin hat.
   Implement grant (`mintHat` / `claimHatFor` / `batchMintHats`) with HUMAN-CONFIRM at first + mint
   caps; revoke/standing (`setHatWearerStatus`); wire an eligibility criterion for ZAO access
   (allowlist / EAS attestation / completed onboarding / holds another role - Hats Modules support
   all with and/or logic).

## Limitations / constraints (ALL of them - respect every one)
- **Clanker droid can't sign tx** -> self-host for any Hats admin. (Confirmed.)
- **Fund it or it goes silent** - the #1 way droids die. Keep the compute/USDC wallet funded; if it
  ever hits zero it pauses and looks abandoned.
- **Brand rules (HARD, non-negotiable, enforce in the voice + a post-filter):** every cast opens
  with `ZM` on its own line then a blank line; NO emojis ever; NO em dashes (hyphens only); NO
  crypto/web3/onchain/memecoin/"buy" language; say "100+ members" never a number; exact spellings:
  The ZAO, ZABAL Gamez (with a Z), WaveWarZ, COC Concertz, FISHBOWLZ, Empire Builder, Magnetiq.
  Tokenless - there is NO token to buy, ever.
- **Autonomous replies are the risk surface:** ~94% of agents are prompt-injection-vulnerable.
  Sandbox replies (reply CONTENT must never be able to trigger a mint, a spend, or an external
  action), cap them few-deep, rate-limit. Human-confirm all top-level casts at first.
- **SECURITY (critical):** a wallet that can mint access hats is sensitive. Guard hard - human-confirm
  every grant at first, enforce mint caps + an allowlist, keep the admin key in a vault/keystore,
  and make it structurally impossible for a Farcaster reply to cause an onchain write. Sandboxed.
- **Liability:** a brand agent owns what it casts (Air Canada precedent). Keep casts confirmable +
  logged.
- **Farcaster reality:** bot saturation, "mute aggressively" culture. Be genuinely useful, not
  spammy. Measure tag rate + usefulness, not post volume.

## Voice (zaodroid)
Tokenless concierge for The ZAO (100+ digital creators + builders, build-in-public, tokenless).
Warm, factual, tight; opens ZM; no emoji/em-dash/jargon; welcomes newcomers; ends with one concrete
next step; denies any "token to buy". Full voice + examples on Zaal's clipboard (`zaodroid-voice`).

## Follow-on: zabaldroid (after zaodroid test works)
Same self-hosted pattern. Mission: grow ZABAL Gamez + the Empire Builder $ZABAL rewards (EARN by
building, not buy) + month-1 north-star: grow the POIDH bounty #1249 "ZABAL Gamez Open Pot"
(https://poidh.xyz/base/bounty/1249). Voice v2 on Zaal's clipboard (`zabaldroid-voice-v2`). Doc 922
has the full droid research (mechanics, growth playbook, KPIs).

## First step for ZOE
Pull tree 226 (Optimism) and report its structure + a proposal for (a) which hat is ZAO access and
(b) where the Autonomous Admin hat should go. Then stop and wait for Zaal. Do not mint, spend, or
launch anything before Zaal confirms.
