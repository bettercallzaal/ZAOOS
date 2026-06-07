# 807 - ZABAL Games fireside: Carlos (Plat0x / Bonfires) x Zaal - vibe-coding + Bonfires workshop (2026-06-06)

> **Goal:** Capture the first ZABAL Games fireside Space - a live vibe-coding + Bonfires teaching session between Zaal and Carlos (Plat0x, Bonfires dev). Doubles as workshop content for the builder track and a working session on getting ZAO's second Bonfire agent live.

| Field | Value |
|-------|-------|
| Date | 2026-06-06 |
| Duration | ~35 min |
| Attendees | Zaal, Carlos (Plat0x, Bonfires dev) |
| Platform | X / Twitter Space (live, recorded) |
| Project | ZAO Devz / ZABAL Games |
| Recap doc | this file |

Carlos = Plat0x, the Bonfires dev (Josh = founder, Ryan Kagy associated) - see [[project_plat0x_bonfire_zabal_architecture]] and [Doc 784](../784-plat0x-bonfire-zabal-architecture-may29/). The Space opens with the BetterCallZaal / WaveWarZ track, then moves into a fireside conversation that is half working-session (getting ZAO's 2nd Bonfire agent live) and half teaching session (how to vibe-code well). The teaching half is the reusable ZABAL Games builder-track content.

## Decisions / actions

| Item | Owner | Confidence |
|------|-------|-----------|
| Carlos sends Zaal the link to his CLI tool that auto-adds context to Bonfire on every git push | Carlos | high |
| Bonfires refactor deadline = June 14 - everything re-integrated; ZAO agent onboarding gets easier after (current code is mid-rewrite, so not worth wiring ZAO into it before then) | Carlos / Bonfires | high |
| Zaal stores ZABAL Games recordings on a dedicated subpage of his custom site and points Bonfire episodes at that media URL (YouTube embedded on the page) - so the graph can reference media, not just text | Zaal | medium |
| Wire every ZAO-repo git commit (his own + teammates') to auto-push that commit's context into the Bonfire, using Carlos's CLI | Zaal | medium |
| Get ZAO's second agent live on the ZABAL Bonfire (a community member's agent - currently responds in DMs but not groups despite group settings on; partly blocked by the refactor until the 14th) | Both | medium |

## Teaching content - ZABAL Games builder-track gold

Distill these into builder-track material. Carlos is teaching how to vibe-code well:

- **Bonfires = a "sense-making tool."** "Sense-making is cool because the definition isn't a word, it's to make sense. We're the sense makers." The agent is "the librarian of a library" - as your library of memories grows, the agent is where you send people to experience and be guided through the ZABAL Games.
- **Plan-then-goal execution.** Claude has great plan-making but stops after "phase 1." Fix: make a plan, then set a single goal whose prompt is only "complete the plan, use X and Y skill," with a measurable threshold (Carlos's example: "less than 5 seconds in a query"). With a numeric target it keeps going until it hits the threshold.
- **Bob and Alice diagramming** before any code. Draw Bob (seller) on one side, Alice (buyer) on the other, the app in the middle, then draw the arrows / sequence of the exchange. You define what needs to be built before picking a language - escrow vs direct pay falls out naturally for a crypto app.
- **Types-first prompting.** "Define types in Python for an application that does X" beats "make me an app that does X" - it avoids the rewrite spiral (add DB -> rewrite, add auth -> rewrite). Use a protocol/adapter contract ("I'm going to use a database" + an adapter) so you can swap Mongo later without a rewrite.
- **Documentation-as-code.** "When you write code you're writing prompts for a program to turn into machine instructions. AI is the same but more abstracted and fuzzier." So the documentation layer should equal the code: "if you removed all the code and only had documentation, you should be able to reproduce the code exactly." Maintain architectural dossiers / briefings for continuity and code quality.
- **Linus Torvalds compiler analogy.** "People say AI lets them code 10x more, but no one says that about the compiler, which lets you go a thousand times faster." You're still programming with syntax that compiles to machine output - AI just raises the abstraction.
- **Punch above your weight.** Carlos (self-taught, pre-AI) built an app with a Lisp backend he'd never touched by having AI read the docs/papers and write dossiers first. AI knows everything but only uses what you query - so ask "what the fuck is this" freely.
- **Carlos's 3 skills:** (1) plan-making, built by having an agent read papers on planning; (2) sub-agents - "you are the senior dev, keep the sub-agent threads full, organize, verify, integrate to the goal" - great for broad work with low overlap; (3) adversarial agents - one argues for an idea, one against, main agent reads both and forms an opinion (curious to run it on Opus 4.8; currently on Codex).
- **Multi-agent on one Bonfire.** Each agent produces its own episode stack but they drain into the same Bonfire - agents share context yet keep distinct histories, and a new agent's episodes become visible to the existing agent (it becomes "aware" of the second agent). Ideal for federated-crew setups operating inside one information structure.

## Threads worth tracking

- **Auto-commit-to-Bonfire pipeline** - Carlos already built this as a CLI (he set up his Claude to push on every commit). Getting it onto ZAO repos is the concrete near-term win - every commit feeds the graph. Wait for the link + the June 14 refactor.
- **Media-pointing episodes** - Zaal's pattern of a site subpage (YouTube embed) that Bonfire episodes point to solves the "Bonfire is text-only, how do we reference video" problem raised originally with the WaveWarZ team. Worth standardizing for all ZABAL Games recordings.
- **2nd ZABAL Bonfire agent** - blocked on Bonfires being mid-rewrite (group-listen config not sticking). Revisit after June 14.

## Also See

- [[project_plat0x_bonfire_zabal_architecture]] - Carlos / Plat0x entity + the GitHub-to-Bonfire judging architecture
- [Doc 784](../784-plat0x-bonfire-zabal-architecture-may29/) - the prior Plat0x x Zaal call (judging architecture)
- [[project_zabal_games]] - the build-a-thon this fireside feeds
- [Doc 805](../805-arun-phillips-collab-jun6/), [Doc 806](../806-rodrigo-nunez-desci-collab-jun1/) - other workshop recruits from the same batch

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Receive Carlos's auto-commit-to-Bonfire CLI link; evaluate wiring it onto ZAO repos | Zaal | Research | When Carlos sends |
| Stand up the 2nd ZABAL Bonfire agent once Bonfires refactor lands | Both | Tech | After 2026-06-14 |
| Build the ZABAL Games recordings subpage + point Bonfire episodes at the media URLs | Zaal | Build | This sprint |
| Distill the teaching content above into a ZABAL Games builder-track lesson / clip | Zaal | Content | Before July build month |
| Publish the fireside recording to YouTube + the recordings subpage | Zaal | Content | This week |

## Transcript

Full transcript: [transcript-raw.txt](transcript-raw.txt)
