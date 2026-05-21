---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 657, 657a
tier: STANDARD
parent-doc: 657
---

# 657c — Agora Citizen Network

> **Goal:** Track Agora Citizen Network (by ZKorum) as the "conversational Polis with ZK identity" alternative. Useful for any context where sybil-resistance matters (token-gated DAO votes, paid-membership communities).

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use Agora for Maine Plural Event | NO | Sybil-resistance via ZK Proof of Passport is overkill for an in-person 25-person event where everyone is in the room. Use Polis or dembrane. |
| Use Agora for The ZAO 188-member governance | MAYBE — second-stage | Members are already wallet/Farcaster-gated, so ZK passport is redundant. But the conversational chat-format flow is more engaging than Polis's vote-by-list. Worth a side-by-side trial. |
| Use Agora for an open-public ZAOstock community input page (where sybil matters) | YES | A "what should ZAOstock 2027 be" public input gathering would benefit from ZK Proof of Passport to prevent ballot stuffing. |

## What It Is

Open-source social platform built by **ZKorum** (Crunchbase-listed). Pitch: "rehumanize and depolarize public debates around complex and divisive issues." Designed for individuals, organizations, and governments.

## What's Different From Polis

1. **Conversational interface, not list-of-statements.** Looks like a chat. Each "statement" has more context attached, more like a forum post than a poll item.
2. **AI-generated cluster names.** Polis gives you cluster A / B / C — Agora uses an LLM to name them ("pro-deliberation", "anti-capitalist", "anti-woke" etc. would be the kind of names AI assigns).
3. **ZK Proof of Passport for sybil-resistance.** Participants can be verified as unique humans (one passport per vote) without revealing identity. Decentralized identity layer.
4. **Trust-minimized infrastructure** + collective dialogue systems.

## Use Pattern From Berlin Example

Bastien (Berlin host) used Agora previously for a **brainstorming activity around new tools**. Participants put ideas in as statements, and the live experience felt like collective ideation more than polling. Agree / unsure / disagree happened in real time.

## When Agora Wins Over Polis

- The conversation needs richer context per statement (a paragraph, not a one-liner).
- Sybil-resistance matters (public-facing input gathering, no pre-existing gate).
- Audience prefers chat-style UX over list-of-toggles UX.

## When Polis Still Wins

- 15-min event wrap-up — Polis is faster to onboard.
- Population-scale battle-tested deployments (Polis has Taiwan/Australia track record, Agora is newer).
- No login at all — Polis is fully anonymous, Agora wants Proof of Passport for full feature set.

## ZAO Integration Path

- Public-facing ZAO governance experiments: stand up an Agora conversation, advertise on Farcaster + X, let any humans-with-passport-proof participate.
- Could complement (not replace) Snapshot voting. Agora is the "discussion + cluster discovery" upstream stage; Snapshot is the "ratification" downstream stage.

## Cost

Free. Open source. Self-hosting requires running a node + the ZK passport verifier (more infra than Polis).

## Strengths

- ZK Proof of Passport is genuinely novel — sybil resistance without doxxing.
- Conversational UX is more engaging for participants without facilitator hand-holding.
- AI-generated cluster names save the facilitator the "what do I call group A?" step.

## Limitations

- More infra to run than Polis (ZK proving stack).
- Passport requirement = real-world barrier in some demographics (especially under-18s, undocumented populations, Global South).
- For Anna's Ukraine youth hackathon (ages 12-15), Agora is the wrong fit — kids don't have passports.

## Sources

- [Agora Citizen Network](https://www.agoracitizen.network/)
- [Agora Citizen on Civic Tech Guide](https://directory.civictech.guide/listing/agora-citizen-network)
- [ZKorum on Crunchbase](https://www.crunchbase.com/organization/zkorum)
- Meeting transcript — Nicolene's Agora walkthrough segment around 40:00 (Berlin brainstorming example)
