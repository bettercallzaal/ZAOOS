---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-29
related-docs: 2127, 2131, 601
original-query: "/zao-research Corey's Notes - Nick's $5K/mo managed AI agents; agent 'Dewey' builds clients' agents; the 80/20 agent stack (harness+model, Orgo, Agent Bundle, Obsidian/Honcho/Composio, Latitude)"
tier: STANDARD
---

# 2133 - Managed agents that build agents (Nick/Corey model) - ZAO already owns ~70% of the stack

> **Goal:** Decide what ZAO takes from the "$5K/mo managed-agent, an agent builds the agents, B2B2B" playbook - the business model vs the stack pieces - given ZAO already runs most of the stack.

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **The valuable half is the BUSINESS MODEL, not the stack - ZAO already has the stack.** Harvest the model (managed agent, priced on the money it makes the client, sold B2B2B), not the vendor list. | ZAO already runs Hermes (harness), the zoe-zao AgentMail identity, Obsidian memory, a multi-model router, and an agent-builds-PRs pipeline. The newsletter's stack is ~70% things ZAO has or decommissioned on purpose. | @Zaal |
| 2 | **The one genuinely new idea worth chewing on: B2B2B "the agent becomes the client's revenue stream."** Build an agent for a creator/community, they resell it to THEIR audience - "when your client depends on your infrastructure for revenue, they never churn." | This is a Sparkz / ZABAL-adjacent revenue shape (creator-economy tooling ZAO already builds toward). It is a real strategic question, NOT a commitment - surfaced for Zaal, not decided here. | @Zaal |
| 3 | **Complete the "agent gets a body," don't rebuild it.** ZAO has the email (zoe-zao@agentmail.to) + the MIDAO legal-body thread ("ZOL gets a body"). The missing pieces from Nick's kit are a phone + a card (Agent Phone / Agent Card) so an agent can sign itself up for tools. | Extends the existing agent-identity work ([[project_zao_midao_legal_body]]) rather than adopting theagentbundle.com wholesale. GATED - agent finance/identity is money + on-chain adjacent, needs Zaal. | @Zaal |
| 4 | **Evaluate exactly two stack pieces ZAO lacks: Orgo (agent desktop) + Latitude.so (conversation observability). Skip the rest.** | ZAO has Hermes+model, memory (Obsidian + ZOE soul), and connections (it evaluated Composio and decommissioned the Composio AO orchestrator on purpose - doc 601). Orgo (a real desktop vs headless) overlaps the Pi computer-use work ([[project_pi_computer_use]]); Latitude (alert when a customer is frustrated) is a genuine gap. | @Zaal |
| 5 | **Discount the vendor recommendations - this is an affiliate newsletter.** Corey ships promo codes (Orgo "COREY", theagentbundle.com) and is selling AI Operator Academy. The stack has a commercial bias; treat tool picks as leads to evaluate, not endorsements. | Grounding/honesty - the model is real, the vendor list is monetized. | @Zaal |

## The model (what the newsletter describes)

Corey (Corey's Notes newsletter) profiles his friend **Nick**, who sells **managed AI agents at $5,000/mo/client**. Nick does not build them - his personal agent **Dewey** does the build + setup. Dewey has its own **card** (Agent Card), **email** (Agent Mail), and **phone** (Agent Phone), signs itself up for tools (even picked its own Higgsfield username), and talks to clients directly in a Nick+Dewey+client group chat. "Nick literally watches customer problems get solved while he's on a walk."

Thesis: "**building is commoditized. The valuable skill is knowing WHICH tool to use for which problem.**" And on price: "nobody pays $5K for a chatbot. They pay $5K for an agent that makes them money." The B2B2B twist: build the agent for a client's industry, the client resells it to their customers as a new revenue stream = they never churn.

Nick's 80/20 stack (7 steps):
1. **Harness + model**: Hermes or OpenClaw + Grok 4.5 or GPT 5.6.
2. **A computer**: Orgo (a real desktop, not a headless sandbox) - affiliate code COREY.
3. **An identity**: email + phone + card via theagentbundle.com (~$20/mo).
4. **Memory + connections**: Obsidian (knowledge base) + Honcho.dev (persistent memory across Slack/Telegram/iMessage) + Composio (connect Gmail/calendar/tools).
5. **Observability**: Latitude.so (watches customer conversations, alerts when someone is frustrated).
6. **Templatize**: build the stack once, save as an Orgo template, one-click clone per client.
7. **Client process**: discovery call -> proposal -> Trello (4 columns) -> Slack channel -> client context-dumps -> the agent builds their agent.

Community signal in the same issue: Marc Lou ("Codex built me a new iOS app and submitted it, one prompt") and Price Foulger (running a roofing CRM as a "tycoon game" with agents handling real customer comms) - both point at "human value shifting from execution to judgement."

## The ZAO map (newsletter stack -> what ZAO already has)

| Nick's stack piece | ZAO status | Evidence |
|--------------------|------------|----------|
| Harness (Hermes/OpenClaw) | HAS Hermes (coder/critic/auto-PR, folded into ZOE); OpenClaw deliberately decommissioned | `bot/src/hermes/`, CLAUDE.md "Decommissioned 2026-05-04" |
| Model (Grok/GPT) | HAS a multi-model router + fleet failover (Claude/Grok/GPT/OpenRouter/Ollama) | `bot/src/zoe/models/router.ts` |
| Agent identity - email | HAS zoe-zao@agentmail.to (AgentMail) | pii-hygiene allowlist, `bot/src/zoe` inbox |
| Agent identity - phone + card | GAP - the "agent gets a body" thread covers legal identity, not yet phone/card | [[project_zao_midao_legal_body]] |
| A computer/desktop | PARTIAL - Pi computer-use work; no Orgo | [[project_pi_computer_use]] |
| Memory | HAS Obsidian second-brain + ZOE 4-block soul memory; Honcho is an alternative | [[project_obsidian_second_brain]], `bot/src/zoe/memory.ts` |
| Connections (Composio) | EVALUATED + decommissioned the Composio AO orchestrator on purpose | doc 601, CLAUDE.md |
| Observability (Latitude) | GAP - no conversation-sentiment alerting | - |
| Agent builds/maintains the product | HAS - ZOE's fix-PR pipeline (coder+critic+auto-PR) + the ZAI community agent | [[project_fix_pr_pipeline_live]], [[project_zai_community_agent]] |
| Managed-agent-as-a-business ($5K/mo, B2B2B) | NOT a ZAO business today - the open strategic question | - |

**Bottom line:** ZAO is ~70% of Nick's stack already, and much of the remaining 30% (OpenClaw, Composio) was dropped deliberately. The thing ZAO does NOT have is the *business* - a managed-agent offering priced on client revenue. That, plus Orgo/Latitude and completing the agent's phone/card identity, is the entire delta.

## The genuine delta (what's worth doing)

1. **Strategic question for Zaal (not decided here):** does ZAO/Sparkz want a **managed-agent, B2B2B** offering - build an agent for a creator/community, they resell it to their audience? It rhymes with Sparkz (creator monetization) and the ZAI community agent. This is a direction to weigh, not a roadmap item (see [[feedback_no_unconfirmed_roadmap]]).
2. **Complete the agent body:** add phone + card to the existing zoe-zao email identity so an agent can self-provision tools - via the MIDAO legal-body path, GATED (money/identity).
3. **Two tools to trial:** Orgo (agent desktop; compare to the Pi computer-use setup) and Latitude.so (frustrated-customer alerting; a real observability gap).
4. **Adopt the framing, not the affiliate links:** "price on the money the agent makes, not the tool"; "judgement over execution." Both already align with ZAO's orchestrator model (ZOE routes, Zaal judges).

## Also See
- [Doc 2127](../../agents/2127-loop-harness-engineering-anthropic/) + [Doc 2131](../../agents/2131-loop-vs-graph-engineering/) - the loop/graph engineering behind "an agent that builds things"
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - why ZAO decommissioned OpenClaw + Composio (don't re-add them)
- `[[project_zao_midao_legal_body]]`, `[[project_zai_community_agent]]`, `[[project_pi_computer_use]]`, `[[project_sparkz_configurable_ai_advisor]]`

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide whether a managed-agent B2B2B offering fits ZAO/Sparkz (yes/no/park) | @Zaal | decision | 2026-08-15 |
| Trial Latitude.so on ZOE/ZAI conversations (frustrated-customer alerting) - the one clear tool gap | @Zaal | eval | 2026-08-22 |
| Compare Orgo (agent desktop) against the existing Pi computer-use setup before adopting | @Zaal | eval | 2026-08-22 |
| Scope adding phone + card to the zoe-zao agent identity via the MIDAO legal-body path (GATED) | @Zaal | decision | wontfix until #1 decided |
| Do NOT re-add OpenClaw or Composio (decommissioned by decision - doc 601) | @Zaal | guardrail | wontfix |

## Sources
- Corey's Notes newsletter, "We're a lot closer to AI agents building other AI agents than most people realize" (full text) - `[FULL]` - Nick's $5K/mo managed-agent model, Dewey, the B2B2B thesis, the 7-step 80/20 stack, the Marc Lou / Price Foulger community signals. NOTE: this is an AFFILIATE newsletter (Orgo code "COREY", theagentbundle.com, AI Operator Academy) - vendor picks carry a commercial bias.
- ZAO grounding (code is ground truth): `bot/src/hermes/`, `bot/src/zoe/models/router.ts`, `bot/src/zoe/memory.ts`, doc 601, `[[project_zao_midao_legal_body]]`, `[[project_zai_community_agent]]`, `[[project_pi_computer_use]]` - `[FULL]`.
