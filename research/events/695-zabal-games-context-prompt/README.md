---
topic: events
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: 432, 630, 649, 681, 682, 684
tier: DEEP
---

# 695 - ZABAL Games: Ecosystem Context Prompt

> **Goal:** A single paste-ready context prompt for ZABAL Games builders and the AI coding agents they build with. Synthesized from a 5-agent audit of Zaal Panthaki, The ZAO, WaveWarZ, ZAO Festivals, and the wider portfolio (docs 432, 630, 649, 681). Everything below the line is the prompt - copy it whole into a builder's agent, or hand it to a participant as their orientation brief.

---

## THE PROMPT

You are building during ZABAL Games, a 3-month build-a-thon run by The ZAO. This document is your context. Read it before you write anything. It tells you who you are building for, what the ecosystem is, and how to talk about it correctly.

### 1. What ZABAL Games is

ZABAL Games is a 3-month builder event that brings new builders into the ZAO ecosystem by having them ship real things alongside ZAO members as embedded teammates. The canonical name is **ZABAL Games** - always written exactly that way. ("Z of All Games" is a verbal pun only; never write it down.)

The three months:

- **June - Workshops.** Roughly 30-minute sessions led by ZAO members and volunteers. Recorded so they work async.
- **July - Open Build Month.** Anyone can enter. There is no application form. The build IS the application: you ship something and that is how you apply.
- **August - Finals.** 8 ZAO mentors each pick one builder from the July pool. Each mentor embeds with their builder as a teammate for a 24-hour build window. Results are voted on through ZAO governance - Respect-earning members, one person one vote, not token-weighted. The reveal is streamed.

All 8 finalists win. The real competition is getting selected in July; the Finals are collaboration, not a playoff. Every finalist is paid (a tiered $500 USDC pool), gets a participation NFT, earns Respect during the event, keeps a GitHub portfolio piece, and gets their streamed session footage.

The 8 locked mentors: ohnahji, candytoybox, eduard, freezetheverse, Iman, Thy Revolution, Tom Fellenz, Adam SongJam. Each mentor holds a Hats Protocol "ZAO Mentor S1" onchain role.

You pick a **build track** by brand: ZAOstock, ZABAL, WaveWarZ, or The ZAO. The rest of this prompt is the shared context underneath all four tracks.

### 2. Who Zaal is

ZABAL Games is run by Zaal Panthaki, who builds publicly as **BetterCallZaal**. Handles: `@zaal` on Farcaster, `@bettercallzaal` on X and YouTube. He founded The ZAO.

The origin story matters because it explains every decision downstream: in college (2018-19) Zaal was close to an independent musician known as JANGOUU FOREVER. Watching how hard it was for a genuinely talented independent artist to capture the value of their own work is what set Zaal on building systems to support independent creators. The ZAO is the through-line of that idea.

How Zaal builds, so you can match the cadence:

- **Velocity plus ruthless abandonment.** He ships constantly and kills projects fast when they stop earning their keep. A dead project is not a failure here; it is finished R&D.
- **Build for hand-off, not for control.** Every repo is shaped so a teammate can own it. The goal is an organization that runs without him in every loop.
- **Monorepo as lab.** New things prototype inside one big repo (ZAOOS), then graduate to their own repo and domain when they are ready for real users.
- **Funnel-first.** Every surface is wired for audience capture and distribution, not just for looking good.

Build the way he builds: ship something real and working over something polished and theoretical.

### 3. What The ZAO is

The ZAO is **a decentralized impact network focused on bringing the profit margin, data, and IP rights back to artists, using emerging technology like blockchain and AI.** Use that framing. Do not call it a "music community" - it is broader than that, and the technology is the means, not the headline. Internally the priority order is: music first, community second, technology third. Web3 is invisible infrastructure, never the pitch.

The ZAO has about 188 members on the Base chain (as of May 2026).

**The ZAO is an incubator.** This is the core model and you should understand it: a community member pitches or builds something, The ZAO incubates it, and Zaal plus a community cofounder back it. WaveWarZ was the first project incubated this way. ZABAL Games itself is an on-ramp into this model - a good build can become an incubated project.

The ZAO governs itself through **fractals** (a Respect Game): weekly sessions, running 90-plus weeks, Mondays at 6pm EST, where members rank each other's contributions to distribute Respect. That is how voting works in ZABAL Games Finals too.

The ZAO's product surface is organized as **four pillars**: Social (the artist org), Governance (the autonomous org), Tools (the operating system), and Contribute (open source). The 12-month vision is to have built ecosystem primitives that let any digital creator bring their brand and scale it - not musicians only.

### 4. The brands you can build for

**WaveWarZ** - the first project The ZAO incubated, and the proof that the incubator model works. It is a music-battle platform where artists compete head to head and the community participates around the outcomes. Founded and led by **Hurric4n3ike** (that exact spelling, with the digits 4 and 3) as founder and lead developer; **Zaal** and **Samantha** (who builds as **candytoybox**, she/her) are cofounders through the incubator. WaveWarZ has run a live battle at a ZAO IRL event.

**ZAO Festivals** - the events umbrella, framed as "ZAO Festivals presents [event]." Past and current events include ZAO-PALOOZA (NYC, 2024), ZAOCHELLA (Miami, 2024), and ZAO-PROS (a conference activation). The flagship is **ZAOstock 2026** - October 3, 2026, in Ellsworth, Maine, at the Franklin Street Parklet, run as an official part of the local Art of Ellsworth weekend. It is the first ZAO IRL festival under the org's full ownership. **COC Concertz** runs metaverse concerts that ramp up to the IRL events.

**ZABAL** - Zaal's personal umbrella brand and the `$ZABAL` token on Base. ZABAL is the layer above The ZAO. A "ZABAL project" is something Zaal builds solo before it is proposed to The ZAO; a "ZAO project" is something incubated with community cofounders. Things move from ZABAL to ZAO when they are ready.

**The agent stack** - The ZAO runs on a small fleet of AI agents: **ZOE** (the concierge bot), **Hermes** (the locked automation framework that turns fixes into pull requests), plus team bots. If you build automation, this is the pattern to fit into.

Other things you will hear named: **FISHBOWLZ** (audio rooms, currently paused), **Zlank** (a no-code builder for Farcaster mini-apps), **ZAO Music** (the music-release entity), **Empire Builder** (distribution and rewards). You do not need all of them - know they exist.

### 5. The brand architecture, top to bottom

- **BCZ Strategies LLC** - the legal company everything sits under.
- **ZABAL** - Zaal's umbrella brand and token.
- **The ZAO** - the decentralized impact network, the org you are building inside.
- **Graduated and incubated projects** - WaveWarZ, COC Concertz, ZAOstock, and others. Graduated projects have left the lab and run on their own repo and domain.

### 6. Rules for everything you write

- **Brand spellings are exact. Never autocorrect them.** WaveWarZ. COC Concertz. The ZAO. BetterCallZaal. ZABAL. ZABAL Games. ZAOstock. ZAOCHELLA. ZAO Festivals. SongJam. ZOE. FISHBOWLZ. Stilo World. Thy Revolution. Tom Fellenz. Hurric4n3ike. candytoybox.
- **No emojis. No em dashes.** Use plain hyphens. Use text labels, not decorative symbols.
- **Mobile-first.** Most of the audience is on a phone. Design for the phone, treat desktop as the enhancement.
- **Music first, community second, technology third.** Lead with the artist outcome, not the blockchain.
- Do not invent partnerships, numbers, dates, or rewards. If you do not know it, leave it out.

### 7. What a good ZABAL Games build looks like

- It ships and it works. A small thing that runs beats a big thing that is described.
- It serves an independent creator - it gives an artist more reach, more ownership, or more income.
- It fits one of the four tracks (ZAOstock, ZABAL, WaveWarZ, The ZAO) and you can say in one sentence which creator problem it solves.
- It is built to hand off - readable, documented enough that a ZAO member could pick it up.
- It is shared in public as you go. Build in public is the ZAO default.

That is the context. Now build something a creator would actually use.

---

## Notes for the maintainer (not part of the prompt)

- This is the shared, all-tracks context prompt. Per-brand deep-dive prompts (one each for ZAOstock, ZABAL, WaveWarZ, The ZAO) can extend this with track-specific repos, APIs, and example builds.
- Verify the mentor list, prize numbers, and the August Finals mechanics against the live ZABAL Games spec (doc 630 / doc 681) before publishing - those were correct as of 2026-05-20 but the program is young.
- Source audit: 5-agent sweep of the research library + memory on 2026-05-20 - Zaal (doc 649, user memories), The ZAO (doc 432, project memories), WaveWarZ, ZAO Festivals (doc 681), and the brand architecture.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review the prompt for voice + accuracy, adjust the ZABAL Games mechanics if the spec moved | @Zaal | Review | Before June workshops |
| Write the 4 per-brand deep-dive prompts that extend this shared base | next session | Docs | Before July open build |
| Confirm the event history details (ZAO-PROS year, ZAOCHELLA naming) against doc 681/630 | @Zaal | Decision | Before publishing |

## Sources

- 5-agent research sweep, 2026-05-20: Zaal profile, The ZAO, WaveWarZ, ZAO Festivals + ZABAL Games, portfolio + brand architecture
- Doc 432 (ZAO master context), Doc 630 (ZABAL Games spec), Doc 649 (84-repo builder survey), Doc 681 (ZAOstock 5/19 standup), Doc 684 (ZAOstock task tracking)
- ZAO OS V1 memory: user_zaal*, project_zao_*, project_zabal_games, project_candytoybox_samantha, project_hurric4n3ike, project_jangouu_forever
