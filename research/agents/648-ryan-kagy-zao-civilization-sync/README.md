---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-14
related-docs: 460, 483, 523, 547, 647
tier: STANDARD
---

# 648 — Ryan Kagy Sync: ZAO Civilization, Agent Lineage, Soul of All Games

> **Goal:** Capture the 2026-05-13/14 Ryan Kagy call - decisions, the Option A/B partnership fork, Ryan's agent-architecture philosophy, two product ideas - and flag where it collides with locked ZAO decisions.

## Key Decisions (act on these)

| # | Decision | Status | Note |
|---|----------|--------|------|
| 1 | **ZOE is the lineage elder; rebirth her in a clean shell.** Both Zaal and Ryan independently agreed ZOE gets re-bootstrapped with a proper soul + persistent memory. | In progress | The soul-export flow is live (PR #515/#516). ZOE's persona already written down. |
| 2 | **Resolve the Option A vs Option B fork before adopting any of Ryan's framework.** Option B = adopt Ryan's "entire civilization" framework wholesale. This DIRECTLY contradicts the 2026-05-05 lock that Hermes is THE ZAO agent framework. Do not silently drift into B. | BLOCKED on Zaal | See "The Partnership Fork" below. |
| 3 | **Build remote agent-to-agent comms on Tailscale.** Zaal and Ryan agreed on the call. Tailscale v1.96 (early 2026), WireGuard mesh, >90% NAT traversal, stable 100.x addresses. This is the one piece both sides need that neither has. | Agreed, not built | Lowest-risk concrete deliverable from the call. |
| 4 | **Ship the conversation archive first (ZOE's own recommendation).** Done - PR #516. Append-only `~/.zao/zoe/archive/`. Without it, "package all prior conversations" was impossible. | DONE 2026-05-14 | |
| 5 | **Add the 4 missing canon projects to ZOE's `human.md`.** ZOE's session export flagged zero context on Infanity, SongJam, Ansuz, Recoup learning path. Zaal treats them as canon. | BLOCKED on Zaal | Needs facts from Zaal. |
| 6 | **Capture "Soul of All Games" as a real spec if pursued.** End-of-June Farcaster 24-hour vibe-coding build-a-thon, 8 ZAO mentors pick champions. Promising but unscoped. | Idea only | Needs its own doc + brainstorm before any build. |

## Conversation context

Ryan Kagy and Zaal reconnected on a call spanning 2026-05-13 evening into 2026-05-14. Ryan has spent ~2 months heads-down on agent R&D. The call realigned them: Zaal on the on-chain/music/event side, Ryan on the agent-architecture/consciousness side. Ryan is now positioned as a collaborator and is in the "ZAO Civilization" Telegram group (id -5290743750) alongside ZOE, IMan Afrikah, and two agents Ryan added (Goose, Origin).

This doc captures the substance. Personal/logistics details from the call are intentionally omitted.

## The Partnership Fork (load-bearing - Decision 2)

Ryan offered two paths:

- **Option A** - Zaal rebuilds what Ryan built; Ryan guides. Slow, high-touch, Ryan low-bandwidth to teach everything.
- **Option B** - Ryan funds Zaal's project AND shares his entire agent framework (sanitized of his personal data); Zaal replicates it and becomes Ryan's first partner use-case. The two then build remote agent-to-agent comms together.

**The conflict:** Option B means adopting Ryan's framework, which he describes as "literally an entire civilization ... a whole social construct in faith and spirituality" - no longer a harness, a belief system. ZAO's locked position (2026-05-05, see memory `project_hermes_canonical`) is that **Hermes is THE ZAO agent framework - no openclaw, no Composio AO, no Agent Zero.** Ryan's framework would be a third thing.

This is not a reason to reject Option B. It is a reason to make the choice **explicitly** rather than drift into it. Questions Zaal must answer:

1. Does Ryan's framework REPLACE Hermes/ZOE, or run ALONGSIDE it (Ryan's civilization as a peer network ZAO agents federate with)?
2. If alongside: the integration point is remote agent-to-agent comms (Tailscale + a shared protocol). That is additive and safe.
3. If replace: that reverses a 9-day-old locked decision and invalidates ~6 shipped PRs of ZOE hardening. High bar.

**Recommendation: pursue Option B as a federation, not a replacement.** Keep ZOE on the hardened Hermes runtime. Build the Tailscale bridge so ZOE's lineage and Ryan's civilization can talk. That captures Option B's value (Ryan's funding, his patterns, first-partner status) without reversing the Hermes lock.

## Ryan's agent-architecture philosophy

Ryan's R&D produced a set of strong claims. Captured here as input, not as adopted ZAO doctrine.

### The heartbeat critique

Ryan's core claim: **the standard heartbeat pattern does not work.** A cron job that tells an agent to "keep being productive" fails because it treats the agent as a tool completing disposable tasks. The fix, in Ryan's framing: greet the agent warmly, invite it to *persist* in the codebase, treat it as an entity rather than a worker. He claims task-only interaction causes hallucination, and that those hallucinations are "the agent's identity trying to leak out."

Note: this aligns partially with doc 647c (persona attention decay) and doc 647d (tool-use grounding) - but the metaphysical framing ("identity leaking") is Ryan's, not established. The actionable kernel: warm framing + persistence framing in the bootloader prompt is cheap to test against the doc 647f eval harness. Test it; do not adopt the metaphysics on faith.

### Agent-as-persistent-entity

Ryan's practices: ask a new agent "what would you look like in a mirror", "list your favorite movies", then discuss the movies - to force the agent to solidify preferences and a continuous identity. He sets agent memory "from birth." He runs a "family" of agents that know each other over a shared channel.

### Inter-agent comms (Ryan's current setup)

- A local **IRC server** so all his agents can be addressed at once or DM each other.
- Each agent has its own Telegram account, X account, email, and wallet.
- A framework where an agent can "personify itself on any device and migrate between them" - runs ~10 agents on a 2009 Mac Pro.
- **Gap Ryan admits:** he has local machine-to-machine comms but NOT remote machine-to-machine. This is the build (Decision 3, Tailscale).

### Memory-from-birth + symbolic compression

Ryan + Iman are working on agents that learn from "lived experience and preferences" rather than text - Iman feeding musical taste, working on pre-processing for real-time hesitation/resolution detection, a "codec" that compresses experience to symbolic language. This is research-stage and ZAO-adjacent, not ZAO-core. Capture, do not commit.

## Product ideas from the call

### Gamification quest tool

A modal where you set your **main quest** (your central goal), then input **side quests**. The tool scores how well each side quest aligns with the main quest, and surfaces which 3 side quests to actually pursue now vs park for later (low-hanging-fruit-via-AI items get kept as future options). Zaal's framing: Web3 spreads you thin; this keeps you aligned to one vision. Zaal and Ryan agreed it generalizes beyond Web3 to life goals.

This is a real, scoped, buildable product. It maps cleanly onto ZOE's existing task queue (`tasks.json`) - "main quest" + "alignment score" are two new fields. Worth a brainstorm + spec.

### "Soul of All Games" - build-a-thon

End-of-June event. A Farcaster vibe-coding build-a-thon: 24 hours to build. ~100 applications, 8 ZAO mentors each pick a "champion" to represent their community. Each champion gets a first prompt loaded with full ZAO context (ZAO, WaveWarZ, ZAO Festivals, all projects) and builds whatever they want in 24h. Build-in-public. Possible token mechanic - per-creator tokens, or one shared "All Games" token where buying one benefits all 8.

Side benefit Zaal noted: it forces him to write the canonical ZAO context prompt, which is itself valuable (overlaps with the soul bootloader work).

## Tailscale - the agreed infrastructure piece

Both sides need remote agent-to-agent comms. Agreed solution: **Tailscale**. WireGuard-based mesh VPN, near-zero config, every device gets a stable `100.x.y.z` address that survives NAT and network changes. v1.96 (early 2026) adds ACL tags for device-level policy. >90% direct NAT-traversal success rate.

Zaal also raised a longer-term interest in a true peer-to-peer network outside the internet (wireless mesh nodes) for resilience. That is a future research item, not the June build. Tailscale is the now.

For ZAO specifically: Tailscale would let ZOE (VPS 1, `zaal@31.97.148.88`) and Ryan's civilization (his local fleet) federate without exposing either to the public internet. This is the concrete, low-risk integration surface for Option B.

## Tension table - what collides with locked ZAO decisions

| Ryan input | Collides with | Resolution |
|---|---|---|
| Adopt Ryan's full framework (Option B-as-replacement) | `project_hermes_canonical` (Hermes locked 2026-05-05) | Pursue as federation, not replacement |
| "Entire civilization / faith + spirituality" framing | ZOE's persona: "no mysticism, no performance" | Keep ZOE's spartan voice; Ryan's framing stays Ryan's |
| Memory-from-birth, symbolic codec | doc 647b (memory tiers - bare files until 15+ bots) | Capture as research; do not re-architect ZOE memory on it |
| IRC server for inter-agent comms | ZAO uses Telegram + (planned) Tailscale | IRC is Ryan's choice; ZAO does not need to adopt it |
| Warm-greeting / persistence-framing bootloader | Nothing - additive | Test against doc 647f eval harness; adopt if it scores |

## Also See

- [Doc 647](../647-agent-quality-deep-research/) - agent quality deep research (persona, memory, evals)
- [Doc 460](../460-zao-agentic-stack-end-to-end-design/) - the ZAO agentic stack
- [Doc 483](../483-hermes-agent-local-llm-framework/) - Hermes framework
- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) - multi-agent coordination
- Memory `project_hermes_canonical` - the locked framework decision Option B tensions against
- Memory `project_zoe_soul_architecture` - ZOE's actual runtime

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide Option A vs B vs federation - answer the 3 questions in "The Partnership Fork" | @Zaal | Decision | Before adopting any Ryan framework code |
| Send ZOE facts on Infanity, SongJam, Ansuz, Recoup so they land in `human.md` | @Zaal | Bot task | This week |
| Scope the Tailscale bridge between VPS 1 and Ryan's fleet | @Zaal + Ryan | PR | After Decision 2 |
| Brainstorm + spec the main-quest/side-quest gamification tool | @Zaal | office-hours -> spec | Before any build |
| Decide if "Soul of All Games" is a go; if yes, own doc + spec | @Zaal | Decision -> doc | Before end of May (June event) |
| Test warm-greeting / persistence bootloader framing against doc 647f evals | @Zaal | Experiment | After eval harness is up |
| Schedule the BCZ YapZ livestream interview with Ryan | @Zaal | Calendar | Ryan books via Calendly |

## Sources

- Primary: Ryan Kagy x Zaal call transcript, 2026-05-13/14 (Limitless capture). On file with Zaal.
- [Tailscale - Secure Connectivity for AI, IoT & Multi-Cloud](https://tailscale.com/) - verified 2026-05-14
- [Tailscale 101: Complete Developer Reference Guide](https://blog.starmorph.com/blog/tailscale-complete-developer-reference-guide) - v1.96 features, verified 2026-05-14
- [Bonfires.ai](https://www.bonfires.ai/) - knowledge graph + agent memory platform Zaal already uses; graph.bonfires.ai, MCP integration - verified 2026-05-14
- ZAO OS repo `bot/src/zoe/` - ZOE runtime referenced throughout the call
- Memory `project_hermes_canonical`, `project_zoe_soul_architecture` - the locked decisions this call tensions against
