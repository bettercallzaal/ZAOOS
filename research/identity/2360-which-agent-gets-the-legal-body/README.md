# 2360 - Which Agent Gets the Legal Body (ZOL, confirmed from Zaal's own words)

**Date:** 2026-08-21
**Status:** Answered - ZOL is the candidate. Not a new decision; a confirmation.
**Owner:** Zaal
**Siblings:** [[project_zao_midao_legal_body]], `2154-zoe-digital-identity-legal-body`,
`2155-per-brand-identity-kit`, `1659-openmatter-network-agent-platform-eval` (addendum),
[[project_zol_farcaster_agent]], [[project_dreamnet_trust_layer]]

---

## The question this answers

The MIDAO pitch (July 2026) and OpenMatter intro (2026-08-10, via Adam Miller)
are two halves of one build - MIDAO gives the legal container (RMI Digital
LLC), OpenMatter gives the decentralized compute the agent runs on. That part
is settled and is NOT re-argued here (`project_zao_midao_legal_body.md`
already has it). What was still open: **which ZAO agent actually gets wrapped
in that legal body** - ZOL or ZOE. This doc answers it by mining a source
that had never been read: `~/Downloads/documents to mine and review/Just DAO
IT! with Zaal.md` (40KB transcript, saved 2026-07-30, never previously
processed).

## The answer, on the record, in Zaal's own words

The Just DAO It episode is not background context here - it is the source
Adam Miller cited as the reason for the OpenMatter introduction
("Preventing DAO Governance Attacks + Building a Music DAO and AI Agent
Legal Entities"). In it, Zaal names the candidate directly, unprompted, when
Adam asks what excites him about wrapping an AI agent in a legal entity:

> "I have created an agent called the [Zool/XOL] Bot... it has a Farcaster
> account, it has a wallet and a social identity that it can do things
> with... The ultimate idea with the [XOL] is to create tokens, legal
> entities, whatever we need for our overall community. **It can be an
> entity owned by the community.**"
>
> "Instead of having our DAO try and have a treasury, we're gonna be able to
> give the sovereign agent the money to grow itself and just give our social
> capital feedback to it, where an individual that has five ZAO Respect
> saying something to the [XOL] bot will not nearly capture as much into its
> memory as a founding member that has 3,000."

The transcript is an ASR (auto-generated) transcription and spells the name
phonetically ("Zool," "XOL") throughout - this is **ZOL**, mis-transcribed,
not a different agent. Read in context (Farcaster account, ZAO-wide
community-owned entity, Respect-weighted trust) there is no other candidate
this could refer to.

This closes the question with something stronger than the MIDAO pitch deck's
"flagship idea #1" framing: Zaal said it himself, on the record, in the exact
conversation that produced the OpenMatter introduction. **ZOL is not a
recommendation to evaluate - it is what Zaal already told Adam Miller he was
building**, before any of this doc's own analysis.

## Corroboration from the repo (checked 2026-08-21, not assumed)

- `bettercallzaal/zol` PR #41 ("ci: GitHub Actions workflow") merged to main
  **2026-08-21T17:17:27Z - today** - the "ZOL v2 merged, 511 tests" Zaal
  referenced. PR body cites 508 assertions across 71 suites; test count has
  moved slightly since. ZOL is actively developed and current, not a stale
  candidate.
- `git ls-tree` of `bettercallzaal/zol`'s main branch, searched for
  `wallet|treasury|payout` paths: **no matches.** No wallet or treasury code
  exists in the repo today. This matches `project_zao_midao_legal_body.md`'s
  framing ("ZOL, wallet-less by design... give ZOL the wallet Zaal
  deliberately withheld").

**The "ZOL has a wallet" nuance - resolved, not inferred (2026-08-21).**
Checked directly on the Pi: ZOL's only key material is `PRIVATE_KEY`, used by
`~/zol/farcaster-agent/src/add-signer.js` to add a Farcaster signer key to
its FID via a self-signed key request - the script's own docstring: "since
you control the custody address, you can sign the key request." **That is a
Farcaster custody key for authorizing a cast signer, not a spending wallet,
and it has no spend authority.** "ZOL has a wallet," on the podcast, is true
only in the narrow on-chain-address sense; it is false in the sense the
MIDAO pitch means. The deliberate constraint - no spend authority until a
legal body + hard caps exist - has not been given away.

## Why not ZOE

Doc 2154 (2026-07-30) designed a 3-rung identity ladder for **ZOE**
specifically - email, then real accounts on the Pi (Discord), then a legal
body via OtoCo MCP. That doc's rung 3 is superficially the same mechanism
(OtoCo, MiDAO) as this build, which is why the two could be confused. They
are not the same project:

- **Doc 2154's problem**: give ZOE a *presence* - so it can exist somewhere
  other than a Telegram bot token (join a Discord, be referenced by a
  receipt). The legal body there is about **completing an identity**.
- **This build's problem**: give a community-owned agent a *wallet with
  hard limits*, governed by Respect holders, running on decentralized
  compute. The legal body here is about **bearing financial liability
  safely**.

Those are different axes, and ZOE is the wrong agent for the second one
regardless of doc 2154:

- ZOE already touches wallet-adjacent code (`bot/src/zoe/farcaster/x402.ts`,
  `bot/src/zoe/farcaster/signer.ts`) - it does not have ZOL's clean "never
  touched money" story, which is the whole narrative hook MIDAO's pitch and
  Zaal's own framing depend on ("the scout that refused a wallet until it
  had a legal body and hard limits").
- ZOE is the orchestrator that runs the coder/critic/auto-PR pipeline and
  holds real infra credentials (Telegram token, GitHub, Supabase service
  keys). It is the worst first candidate for "now also give it a legally-
  wrapped wallet" - the blast radius of anything going wrong is the whole
  build pipeline, not a Farcaster bot's tip jar.
- ZOL's actual function (scouting artists, curation, DreamLoops) is exactly
  what a small legally-wrapped wallet would extend usefully - tipping,
  bounties, x402 curation fees. ZOE's function has no natural fit for
  "holds money and can be sued."

**Conclusion: ZOL gets the body. ZOE's identity ladder (doc 2154) proceeds
on its own separate track (email + Discord presence) and is unrelated to
this decision.**

## What is still open (not this doc's job to resolve)

- Everything OpenMatter-side: deployment mechanics, the credits/balance
  discrepancy, the overdue reply to Chris B - tracked in
  `zao-vault/handoffs/openmatter.md` and the doc 1659 addendum, not here.
- Formal MiDAO entity formation itself - gated, paid, onchain, Zaal's alone
  (`project_zao_midao_legal_body.md`, doc 2154's gate table).

## Sources

- FULL (local file read): `~/Downloads/documents to mine and review/Just DAO
  IT! with Zaal.md` (40KB, saved 2026-07-30, mined for the first time here).
- FULL (`gh api`, 2026-08-21): `bettercallzaal/zol` commit history + `git
  ls-tree` of main for wallet/treasury paths.
- Memory: `project_zao_midao_legal_body.md` (already updated 2026-08-21 with
  the OpenMatter compute-layer addition and the four-layer model).
