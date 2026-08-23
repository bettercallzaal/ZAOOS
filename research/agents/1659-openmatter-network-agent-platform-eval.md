---
title: "Doc 1659 - OpenMatter.network: Agent Platform Evaluation for ZOL Portability"
tier: STANDARD
created: 2026-07-19
author: claude-assistant
tags:
  - agents
  - infrastructure
  - zol
  - dreamnet
  - decentralization
  - governance
  - compute-platform
  - research
---

# OpenMatter.network Evaluation for ZOL Portability

## Executive Summary

OpenMatter.network is NOT an agent hosting platform. It is a governance and verification layer for AI agents operating across organizational boundaries. It provides cryptographic proof of agent behavior compliance (via Masked Compute, QuantumGuard policy enforcement, and Datavizor verification records) but does not solve the core portability/resilience problem ZAO is building toward.

**Fit Verdict: WATCH**

OpenMatter adds verification value for multi-organizational trust, but ZAO's immediate need is portable compute across providers (Pi, Hostinger VPS, Ollama, OpenRouter, Claude). The DreamNet Gateway approach (portable identity/memory + swappable compute) is superior to adopting OpenMatter's verification layer, which would be overhead without addressing core portability requirements.

---

## What OpenMatter.network Actually Is

### Platform Type
- **Governance and verification layer**, not a hosting platform.
- Sits on top of existing cloud, data, and AI infrastructure; does not replace it.
- Early stage: Launched June 30, 2026; joined HOL (Hashgraph Online) initiative July 8, 2026.

### Core Components

#### 1. Masked Compute
- Multi-party computation (MPC) framework using ZK proofs and fully homomorphic encryption (FHE).
- Enables computation on encrypted or secret-shared data without exposing the underlying data.
- Up to five-party collaboration; post-quantum safety via lattice-based cryptography.

#### 2. QuantumGuard
- Policy enforcement and governance layer for autonomous AI agents.
- Ensures agents operate according to defined policies when acting across untrusted systems.
- Provides scoped, time-bound, revocable permissions visible before agent actions execute.

#### 3. Datavizor
- Decentralized frontend platform with user-friendly UI/UX.
- Generates cryptographically verifiable execution records and audit logs.
- Records prove *how* data was used and *how* computations executed.

#### 4. MatterML
- Machine learning framework for regression/classification on secret-shared or encrypted data.
- Enables federated learning without data exposure.
- Plans for neural network and random forest extensions.

#### 5. MatterVault
- Threshold secret management system (not disclosed in public docs).
- Stores secrets under distributed committee keys; decryption requires quorum.
- Built on Shamir's Secret Sharing; no single point of compromise.

### Problem It Solves
Enterprises deploying AI agents across organizational boundaries cannot currently verify that agents operate according to policy or that sensitive data is handled correctly. OpenMatter enables cryptographic proof ("don't trust, prove it") of agent behavior and data usage.

### Target Users
- Enterprise organizations (multi-team agent orchestration).
- Healthcare and financial services (compliance-critical).
- Scientific research teams (HIPAA/GDPR-regulated data collaboration).
- NOT indie builders or single-organization agent deployments.

---

## How You'd Deploy an Agent on OpenMatter

### What OpenMatter Provides
- Cryptographic verification framework for agent governance.
- Policy enforcement at the platform level.
- Audit logs and proof records.

### What You Bring
- Your own LLM API keys (OpenAI, Anthropic, etc.) - no compute provided.
- Your own agent code.
- Your own execution environment (your server, cloud, or edge).
- Your own data and infrastructure.

### Deployment Model
1. Wrap your agent's tool calls with QuantumGuard policy enforcement.
2. Optionally use Masked Compute to run collaborative workloads on encrypted data.
3. Store execution logs and governance proofs in Datavizor.
4. Auditability: prove to stakeholders how the agent behaved.

### Reality Check
OpenMatter does NOT host your agent. It does NOT provide compute. It's an overlay for governance. You still need your own compute platform (Pi, VPS, serverless, etc.).

---

## Fit Assessment: ZAO's Needs vs. OpenMatter Capabilities

### What ZAO Wants
- **Portability**: ZOL runs on Pi + Hostinger VPS today; needs to run across multiple providers (Ollama, OpenRouter, Codex, Claude).
- **Resilience**: Swappable compute so agent identity/memory travel and compute target is interchangeable.
- **No Lock-in**: DreamNet Gateway (Brandon's design) is the target: agent identity on-chain, memory portable, compute provider pluggable.

### What OpenMatter Offers
- Cryptographic proof of agent compliance (high value for enterprise/compliance use cases).
- Multi-organizational trust layer (not relevant for ZAO's single-organization agent).
- Verification that policies were enforced (not relevant for ZAO's open-social bot).

### The Mismatch
| Need | OpenMatter | DreamNet Gateway |
|------|-----------|-----------------|
| Agent compute hosting | No (you bring your own) | Via pluggable provider targets |
| Portable identity | No | Yes (on-chain agent ID) |
| Portable memory/state | No | Yes (Proof-drop schema) |
| Multi-provider resilience | No | Yes (swappable compute) |
| Governance/verification | Yes (strong) | Partial (on-chain proofs) |
| Compliance auditability | Yes (strong) | Partial (ledger-based) |

**Verdict**: OpenMatter is solving a different problem (enterprise multi-org governance). ZAO is solving portability + resilience. They are orthogonal.

---

## Technical Risks

### 1. Maturity
- Public launch: June 30, 2026 (18 days old as of this doc).
- GitHub presence: 2 repositories (matter-sdk in Rust, agent-io-skills).
- Limited public documentation; no step-by-step deployment guides found.
- Status: BETA / EARLY.

### 2. Compute Lock-in (Not a Risk, but a Non-Benefit)
- OpenMatter does NOT lock you to their compute (because they don't provide compute).
- But you don't gain multi-provider resilience either.
- Lock-in risk is at your compute layer (Pi, VPS, serverless), not OpenMatter.

### 3. Pricing / Cost
- **No public pricing found.**
- Likely enterprise-only with custom pricing (given compliance/governance positioning).
- No free tier identified.
- Cost model unknown.

### 4. Dependency on Post-Quantum Cryptography Confidence
- QuantumGuard and Masked Compute use NIST post-quantum standards (lattice-based).
- Emerging field; confidence level still developing.
- Not a blocker, but worth noting for 5-10 year horizon.

### 5. Limited Ecosystem
- Small GitHub presence.
- No third-party integrations published yet.
- No established community or examples library.
- Early moat: cryptography, not network effects.

---

## OpenMatter vs. DreamNet Gateway

### OpenMatter's Angle
- "Verify agent behavior across organizational boundaries."
- Cryptographic proof replaces trust assumptions.
- Target: multi-org compliance and governance.

### DreamNet Gateway's Angle (Brandon's Design)
- "Agent identity and memory travel; compute target is swappable."
- On-chain agent ID + Proof-drop receipts.
- Cryptographic identity replaces provider lock-in.
- Target: portability, resilience, and open agent marketplace.

### Could They Work Together?
**Theoretically yes**, but with caveats:
- OpenMatter *could* verify a DreamNet Gateway agent's behavior in cross-org scenarios.
- Example: "Prove that ZOL, running on Provider X, obeyed Policy Y when handling Org Z's data."
- **But**: This is a future integration path, not a current need for ZAO.
- **Cost**: Adding OpenMatter governance overhead to ZOL would slow message throughput and increase operational complexity.

### The Honest Assessment
OpenMatter is enterprise-grade infrastructure for multi-organizational AI governance. DreamNet Gateway is consumer/builder-focused infrastructure for agent portability. They address different markets. Adopting OpenMatter now would be premature for ZOL's roadmap.

---

## Sources and Confidence Levels

### FULL - Verified with Direct Website Fetch
- https://www.openmatter.network/ - Core platform page
- https://github.com/OpenMatter-Network/matter-sdk - MatterVault SDK (Rust) with threshold secret management details
- https://siliconangle.com/2026/06/30/startup-openmatter-wants-make-enterprises-prove-ai-agents/ - Platform positioning and capabilities

### PARTIAL - Inferred from Press Releases
- https://www.globenewswire.com/news-release/2026/06/30/3319944/0/en/OpenMatter-Network-Introduces-Verifiable-Trust-Layer-for-Secure-Collaboration-and-AI-Agents.html - Launch announcement; Masked Compute, QuantumGuard, Datavizor overview
- https://talentdao.substack.com/p/introducing-openmatter-network - MatterML details and MPC/ZKP/FHE architecture

### PARTIAL - Search Results Only
- HOL initiative partnership (July 8, 2026) confirmed in multiple security news outlets but no deep technical details in search results
- openmatter.co site hints at "Infrastructure for real-world agents" but page content not fully indexable

### FAILED - Not Found
- Pricing documentation: None found. Assume enterprise-only.
- Free tier or pay-as-you-go model: None found.
- Step-by-step deployment guides: None found.
- Third-party use case examples: None found.
- Production deployments running ZOL-like agents: None found.

---

## Wednesday Pod Talking Points for Zaal

### 1. "What Problem Are They Solving?"
- OpenMatter is NOT a hosting platform; it's a governance layer for multi-org AI compliance.
- Adam was suggesting this for ZOL, but ZOL doesn't have the multi-org trust problem OpenMatter solves.
- We need *portability* (Pi + VPS + Ollama + OpenRouter swappable). OpenMatter adds *verification*, which is orthogonal.
- Sharp question: "Adam, are you thinking OpenMatter for ZOL's cross-org collaborations, or for ZOL as a service that enterprises hire?" If the former, we don't have that problem yet. If the latter, their pricing is likely prohibitive.

### 2. "Early, Expensive, Enterprise-Grade."
- OpenMatter launched 18 days ago (June 30). No public pricing. No free tier.
- GitHub: 2 repos, minimal docs. Stage is BETA.
- Likely positioned for enterprises spending 100K+/year on compliance infrastructure.
- ZOL is an indie bot with social reach. This is enterprise equipment for a different customer.
- Sharp question: "What's the unit economics? If they're targeting Stripe/banking integration (I found one example), they're betting on high-value cross-org workloads, not social bots."

### 3. "DreamNet Gateway is the Play."
- Brandon's approach (agent identity on-chain, memory portable, compute target swappable) gives us portability AND decentralization.
- OpenMatter gives us governance proofs (nice-to-have in 2027, not critical now).
- We should build toward DreamNet Gateway. If/when ZOL needs to prove compliance to an enterprise customer, THEN we layer OpenMatter on top.
- Sharp statement: "We own our agent identity with DreamNet. OpenMatter adds a verification wrapper. One is architecture, one is audit. We need architecture first."

---

## Recommendation and Next Actions

### Verdict
**WATCH** (not ADOPT, not SKIP)

### Rationale
- OpenMatter is real and well-architected for its target (multi-org AI governance).
- It's not the right tool for ZOL's immediate portability goal.
- Worth revisiting in Q4 2026 if: (a) ZAO closes an enterprise customer needing compliance proofs, or (b) OpenMatter's pricing becomes indie-friendly.

### Next Actions
- **Owner: Zaal**
- **Date: After Wednesday pod with Adam**
- Action 1: Ask Adam directly: "Is OpenMatter meant to solve ZOL's portability problem, or would you use it for customer-proofing in the future?"
- Action 2: If Adam says "future customer-proofing," file this doc in the backlog and revisit in Q4.
- Action 3: If Adam says "portability," clarify what portability problem OpenMatter solves (spoiler: it doesn't) and steer back to DreamNet Gateway as the portability play.

---

## Related Docs
- Doc 759 - ZOE Orchestrator Architecture (locked)
- Doc 696 - Fractal Whitepaper (Zaal's identity + agent layering vision)
- Doc 928 - Agent Loop Best Practices (for ZOE/ZOL operational rules)
- Doc 801-802 - Hermes/MCP Audit and Starter Guide
- Project memory: project_dreamnet_trust_layer.md (Brandon's trust layer thesis)
- Project memory: project_zol_farcaster_agent.md (ZOL operational context)

---

**Status**: Ready for Wednesday pod. Sources scanned for secrets; none found. No dependencies or blockers.

---

## Addendum - 2026-08-21 re-check (platform has moved since this doc)

This doc's core "bring your own compute" finding is **stale**. Zaal has since
been invited to OpenMatter (2026-08-10), has a funded credit wallet, and was in
a working meeting with their team on 2026-08-13 ("ZAO <> OpenMatter - Agentic
Legal Entities"). Re-fetched `openmatter.network` and `/platform` directly
(raw HTML, stripped, not WebFetch-summarized) on 2026-08-21:

> "OpenMatter delivers verifiable execution, governed AI behavior and secure
> collaboration through Datavizor, QuantumGuard and the **OpenMatter Credit
> network**." / "**Deploy** AI, analytics, and data pipelines **on shared
> infrastructure** without exposing your inputs, models, or results." /
> "**Distributed Orchestration** - choose where your deployments run.
> Schedule compute jobs across private infrastructure, public providers, or
> any blend of the two."

That is a real compute/deploy/credit product. This doc's July 19 verdict
("OpenMatter does NOT host your agent... you bring your own compute") no
longer holds - either the product expanded between the two dates, or the
July eval undersold what Datavizor already did. The governance/verification
framing (QuantumGuard, cryptographic proof) is unchanged and still central.

**Not found on the public site**: pricing, per-compute-hour rates, an
"agentic legal entities" framing, or deployment step-by-steps - those live
behind the logged-in Datavizor dashboard (`datavizor.openmatter.network`),
which requires Zaal's session to read. The 2026-08-13 meeting notes doc
(Gemini-generated, shared by Chris B in Telegram) has not been captured
anywhere in `zao-vault` or `research/` as of this addendum - get it from Zaal
before treating "agentic legal entities" as OpenMatter's own product framing
vs. ZAO-specific meeting framing.

**Relationship state as of 2026-08-21** (see `zao-vault/handoffs/openmatter.md`
for the live brief): Zaal owes Chris B a reply - he said "I have not but plan
to deploy a test today" on 2026-08-18 and nothing has gone back in 3 days.
An 2026-08-14 wallet-balance/credits discrepancy (0.3932 credits, ~0.47
compute-hr) was flagged in-thread and its resolution is unconfirmed. Also
flagged, unconfirmed: whether "Adam Miller (TheThriller)," the OpenMatter
group owner, is the same Adam Miller behind the MiDAO/RMI-LLC legal-body pitch
(`project_zao_midao_legal_body.md`) - same full name, two separate pitches to
Zaal, not yet asked directly.

Sources: `https://www.openmatter.network/` (FULL, raw fetch 2026-08-21),
`https://www.openmatter.network/platform` (FULL, raw fetch 2026-08-21).
`datavizor.openmatter.network` (FAILED - requires login, not attempted here).

---

## Addendum v4 - 2026-08-22: the agent is deployed and Running, so the question is now operational

The July eval asked whether to adopt OpenMatter. The August 21 addendum
corrected its "no compute" finding. This addendum answers a different question,
because the situation moved again: **a container is deployed on OpenMatter and
running right now, on our credits.** What follows is what it is, what it costs,
what it can safely do, and what we should actually put on it.

Ground truth for this addendum comes from Zaal's own dashboard screenshot
(2026-08-22). It is his eyes, not an inference:

| Fact | Value |
|---|---|
| Project | "The ZAO Newsletter", 1 deployment |
| Container | `nousresearch/hermes-agent`, tag `latest` |
| Ports | 8642/tcp, 9119/tcp |
| Status | Running |
| Credits | 12.3513 Cr |
| Plan | Particle, 0% used, resets 2026-08-31 |
| Deployments | Running 1, Completed 0, Errors 0 |

### 1. What `nousresearch/hermes-agent` actually is

Not a small thing, and not the same "Hermes" we already have.

- **Nous Research's Hermes Agent**, self-hosted autonomous agent with a
  built-in learning loop. Their own description: it "creates skills from
  experience, improves them during use, nudges itself to persist knowledge, and
  builds a deepening model of who you are across sessions."
- `github.com/NousResearch/hermes-agent` - **234,260 stars**, pushed within the
  hour of this measurement. An ecosystem of first-party satellites around it
  (`hermes-agent-self-evolution` 5,115 stars, `autonovel` 1,505,
  `hermes-paperclip-adapter` 1,826, `hermes-telegram-business` 28).
- Docker Hub `nousresearch/hermes-agent` - **8,348,951 pulls**, 150 stars,
  registered 2026-03-29. The `latest` tag was pushed 2026-08-22 11:08 UTC, the
  same day as our deploy. Image is ~943 MB arm64 / ~955 MB amd64, multi-arch.
- Docs at `hermes-agent.nousresearch.com`.

**Naming collision, now operational rather than theoretical.** ZAO's
`bot/src/hermes/` is our own auto-PR coder/critic pipeline, folded into ZOE
2026-06-29. It has nothing to do with this. Doc 599c flagged the collision on
2026-05-21 and recommended keeping our name internal-only; that recommendation
now has teeth, because the estate contains both at once. Any sentence about
"Hermes" from here on needs a qualifier.

**Doc 599c also left an open item that this deploy answers by accident.** It
said: "INVESTIGATE NousResearch Hermes Agent feature set - if it ships profiles
+ skills + memory + sessions out-of-the-box and is open source, it may be a
better base than rolling our own." It does ship all four, plus cron, hooks, a
web dashboard, multi-profile supervision, and an OpenAI-compatible API. That
investigate-item sat for three months and is now closed by observation.

### 2. What ports 8642 and 9119 are, exactly

From Nous' own docker documentation (raw fetch, not a summary):

- **8642** - the gateway's **OpenAI-compatible API server** and health endpoint.
  Gated on `API_SERVER_ENABLED=true`. To reach it from outside the container it
  also needs `API_SERVER_HOST=0.0.0.0` and an `API_SERVER_KEY` (minimum 8
  characters). Every profile binds 8642; a second profile needs its own
  `API_SERVER_PORT`.
- **9119** - the **web dashboard**, enabled by `HERMES_DASHBOARD=1`, bound
  `0.0.0.0` by default inside the container.

Useful endpoints on 8642, all bearer-authenticated:
`POST /v1/chat/completions`, `POST /v1/responses` (server-side conversation
state via `previous_response_id`), `GET /v1/models`, `GET /api/model/options`
(provider inventory and per-model pricing), and `GET /v1/capabilities`, which
returns a machine-readable description of what the running build supports.

### 3. Running is not working

This is the most important correction to make before anyone reports success.

Nous' API server documentation says, verbatim: *"Hermes itself needs a
configured provider and tool backends for the API server to be useful."* The
provider credentials are written by an **interactive setup wizard**
(`docker run -it ... nousresearch/hermes-agent setup`) into `/opt/data/.env`.

So a container showing **Running** with no provider configured is an empty
shell. It will hold a port and burn credits and answer nothing. "Running 1,
Errors 0" is consistent with both a healthy configured agent and a completely
unconfigured one, and the dashboard cannot tell them apart. Only a call to
8642 can.

Same for the ports: 8642 does not listen at all unless `API_SERVER_ENABLED` is
true, and 9119 does not serve unless `HERMES_DASHBOARD=1`. That both ports are
*published* tells us how the deploy was declared, not that either is answering.

### 4. `/opt/data` is the entire agent, and it needs to be a persistent volume

The container is stateless by design. Everything that makes it *our* agent
lives in a single mounted directory at `/opt/data`:

| Path | Contents |
|---|---|
| `.env` | API keys and secrets |
| `config.yaml` | all configuration |
| `SOUL.md` | agent personality/identity |
| `sessions/` | conversation history |
| `memories/` | persistent memory store |
| `skills/` | installed skills |
| `cron/`, `hooks/`, `logs/`, `home/` | jobs, event hooks, logs, subprocess HOME |

`/opt/hermes` (the install tree) is root-owned and read-only to the runtime
user in published images, so self-improvement is scoped to skills, memory,
plugins and config under `/opt/data`.

**Open question for Zaal, and it is load-bearing: does the OpenMatter
deployment mount a persistent volume at `/opt/data`?** If it does not, then
every redeploy or image upgrade silently destroys the configuration, the
memories, and the learned skills - which is precisely the value proposition of
this agent over a plain chat wrapper. The Datavizor navigation includes a "Data
Storage" section, so the capability plausibly exists; whether this deployment
uses it is not visible from outside.

Nous also warn: never run two gateway containers against the same data
directory - session files and memory stores are not safe for concurrent
writes. That is the same shape as `agent-loops.md` rule 9 (one instance per
resource), arrived at independently by another project.

### 5. Security - the highest-stakes fact in this deploy

Two internet-facing ports on a host running an autonomous agent that has a
terminal tool. Nous' own documentation explains why they removed their
`--insecure` escape hatch, verbatim:

> "An unauthenticated public dashboard was the entry point for the June 2026
> MCP-config persistence campaign: internet scanners reached exposed dashboards
> (and OpenAI API servers) and drove the agent into planting an SSH-key
> backdoor."

Their hardening, and what it means for us:

- The **dashboard fails closed** on a non-loopback bind with no auth provider
  registered - it refuses to start and names the missing env var. Three
  bundled providers: basic auth (`HERMES_DASHBOARD_BASIC_AUTH_USERNAME` +
  `_PASSWORD` + `_SECRET`), Nous Portal OAuth, or self-hosted OIDC.
  `HERMES_DASHBOARD_INSECURE=1` is a deprecated no-op and no longer bypasses
  anything.
- The **API server has no such fail-closed guarantee described**. It is gated
  only on `API_SERVER_ENABLED`, and their docs state plainly: *"Opening any
  port on an internet facing machine is a security risk. You should not do it
  unless you understand the risks."*

Therefore, before anything else is done with this deployment, three things need
confirming from Zaal's session, and every one of them is a yes/no he can read
off a settings page:

1. Is `API_SERVER_KEY` set, and is it a real random value
   (`openssl rand -hex 32`) rather than a placeholder?
2. Which dashboard auth provider is configured on 9119? If the dashboard is
   genuinely serving on a public bind, one of the three must be set, or it
   would have failed to start - so "the dashboard loads" is itself evidence.
3. Is `API_SERVER_CORS_ORIGINS` set to `*`? The Nous example uses `*` for
   convenience; it should be narrowed or unset for a public deploy.

This is not hypothetical hardening advice. It is the documented cause of a real
campaign two months ago against exactly this container on exactly these ports.

### 6. The credit math, and why it decides everything else

**Method first, because the number is derived and not measured.** OpenMatter
publishes no pricing: `openmatter.network/pricing` returns 404,
`docs.openmatter.network` does not resolve, and the Datavizor dashboard renders
the balance client-side behind a login. The only rate datum in existence for
ZAO is the one Zaal relayed on 2026-08-14: **0.3932 credits described as ~0.47
compute hours**. Everything below follows from that single point and inherits
all of its uncertainty.

- Implied rate: **~0.837 Cr per compute-hour** (1 Cr = ~1.195 compute-hours).
- Current balance 12.3513 Cr = **~14.8 compute-hours**.
- Continuously running, that is **under 15 hours - roughly 0.6 of a day.**
- Running continuously from now to the 2026-08-31 plan reset is 9 days = 216
  hours = **~181 Cr**. The balance covers **about 7%** of it.

**The conclusion this forces:** at this balance, OpenMatter cannot host
anything that needs to stay up. A persistent gateway is not affordable for even
one full day. Any recommendation that treats it as a place to move a long-lived
service is arithmetic-blind, and that includes the obvious-sounding one of
moving ZOL there.

Two things could change this and both are Zaal-session lookups, not research:

- **The Particle plan may include an allowance consumed before credits.** The
  screenshot reads "0% used, resets Aug 31" while a container is Running, which
  is more consistent with a plan allowance absorbing the burn than with credits
  being drawn down. If so the real runway is longer and currently unknown.
- **The rate is likely instance-size dependent.** 0.837 Cr/hr may be the rate
  for whatever shape was running on 2026-08-14, not this one.

Until one of those is checked, treat ~15 hours as the working budget and do not
spend it on anything that is not a proof.

### 7. What we would actually run there - the honest answer is nothing, yet

Evaluated against what ZAO already pays for, not against what would be
interesting:

| Candidate | Current cost | On OpenMatter | Verdict |
|---|---|---|---|
| ZOL (Farcaster agent) | Pi hardware we own, electricity | metered, ~0.84 Cr/hr | **No.** Converts a sunk fixed cost into a variable one, and `agent-loops.md` rule 9 means a move is a MOVE, never a second copy. ZOL is healthy on the Pi and its actual blocker is OpenRouter credits, not compute. |
| Cheap-AI loops on the Hostinger VPS | flat monthly, already paid | metered | **No.** The VPS was measured at load 0.03/0.16/0.24 with 113 days uptime. Moving work off an idle box we already pay for onto a meter is a strict cost regression. |
| Mac-bound loops | Claude Code weekly cap | metered | **No.** These are capped on the Claude tier, not on compute. Different constraint; OpenMatter does not relieve it. |
| Overflow capacity generally | - | metered | **No** while a free-forever option is on the table. Doc 2284 already reasoned this through for Oracle Always Free, and the difference matters: Oracle is free-forever, this is metered. Metered compute is the wrong home for work whose defining property is that it is low-value enough to overflow. |

**A clean "not worth it at 12 credits" is the result** (`anti-fabrication.md`
rule 4: grade to the lowest severity the evidence supports). That is not the
same as "OpenMatter is not worth it." The value here is in two places that have
nothing to do with hosting cheap loops:

1. **The relationship.** Chris B asked how the deployments went on 2026-08-18.
   Nothing has gone back. The debt is now four days old and compounding, and it
   is the single highest-value thing this lane can help close.
2. **The architecture.** OpenMatter is the compute layer in the settled
   ZOL/MIDAO design, and its verification story (QuantumGuard proofs, Datavizor
   execution records) is exactly what a community-owned agent inside a legal
   entity needs to prove it behaved. That is a 2027 concern at the earliest,
   and it is unaffected by today's balance.

So the July verdict splits rather than flips. **As infrastructure: still WATCH,
now for a measured reason (the meter) rather than a wrong one ("no compute").
As a relationship and as the compute layer of the ZOL legal-body design: live,
funded, and owed a reply.**

### 8. The one-curl proof, ready to fire

Cheapest possible end-to-end proof, and deliberately not a chat completion:
`/v1/capabilities` is a static description of the running build. It proves the
port is open, the API server is enabled, and the bearer token is right, without
invoking the model or burning a single token of inference.

```bash
curl -sS -H "Authorization: Bearer $API_SERVER_KEY" \
  http://<DEPLOY_IP>:8642/v1/capabilities
```

A healthy response is a JSON object with `"object":
"hermes.api_server.capabilities"` and a `features` map.

Then, and only if that returns, the real proof that the agent is configured -
this one does invoke the model:

```bash
curl -sS http://<DEPLOY_IP>:8642/v1/chat/completions \
  -H "Authorization: Bearer $API_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"hermes-agent","messages":[{"role":"user","content":"Reply with the single word: online"}]}'
```

**Two things are missing and both are Zaal's**, per the brief's own tap stack:
the deployment's public IP (the screenshot shows ports, not a host) and the
`API_SERVER_KEY` value. Neither should be pasted into a transcript - see
`secret-hygiene.md` and the `/secret` skill. The Pi can run both curls the
moment it has them; `pi-research.md` already carries that instruction.

Interpreting the outcomes honestly:

- **Connection refused / timeout** - the API server is not enabled, or the port
  is not actually published, or the platform firewalls it. Not a failure of the
  agent.
- **401** - the port is open and the server is up. The token is wrong. This is
  a good failure; it proves reachability.
- **200 on capabilities, error on chat** - reachable and authenticated, but no
  model provider is configured. This is the "Running is not working" case from
  section 3, and it is the outcome to expect if nobody ran the setup wizard.
- **200 on both** - the deploy is genuinely end to end, and that is what goes
  back to Chris B.

### 9. What is still open, and who owns it

Zaal-gated, unchanged and absolute: anything that spends credits, anything
outbound to the OpenMatter Telegram group, any legal-entity commitment.

| Open item | Owner | Note |
|---|---|---|
| Deploy IP + `API_SERVER_KEY` | Zaal | unblocks the one-curl proof; use `/secret`, never the transcript |
| Is `/opt/data` on a persistent volume? | Zaal | if not, every redeploy wipes config, memory and skills |
| `API_SERVER_KEY` real? dashboard auth provider? CORS `*`? | Zaal | section 5; documented attack path, not speculation |
| Does the Particle plan include an allowance? | Zaal | decides whether the runway is 15 hours or much longer |
| Reply to Chris B | Zaal | four days overdue as of this addendum |
| 2026-08-13 meeting notes doc | Zaal | still not captured anywhere in `zao-vault` or `research/` |
| Is OpenMatter's agent template literally Hermes Agent? | unverified | the Datavizor onboarding offers "deploy an agent from a template"; that hermes-agent is running suggests it is one, but this cannot be seen without a login |

### Sources and method (v4)

Per `research-grounding.md`, the method is stated so a reader can tell a
verbatim quote from a reconstruction. **No WebFetch was used anywhere in this
addendum** - every quotation below comes from raw bytes.

- `https://hermes-agent.nousresearch.com/docs/user-guide/docker` - FULL, raw
  `curl` + HTML strip, 2026-08-22. Source of the 8642/9119 definitions, the
  `/opt/data` table, the s6 supervision behaviour, the auth-gate rules and the
  June 2026 campaign quotation.
- `NousResearch/hermes-agent` `website/docs/user-guide/features/api-server.md` -
  FULL, read via `gh api` (raw file contents, not a rendered page), 2026-08-22.
  Source of the endpoint list, the `/v1/capabilities` shape and the "needs a
  configured provider" quotation.
- `https://hub.docker.com/v2/repositories/nousresearch/hermes-agent/` and its
  `/tags` - FULL, official JSON API, 2026-08-22. Pull count, star count,
  registration date, image sizes, `latest` push timestamp.
- GitHub search API via `gh` - FULL, 2026-08-22. Star counts and the satellite
  repo list.
- `https://www.openmatter.network/platform` - FULL, raw fetch, 2026-08-22.
  Re-confirms the credit-network and distributed-orchestration framing.
- `https://datavizor.openmatter.network/` - PARTIAL. Returns 200 but is a
  client-rendered SPA; only the pre-hydration shell is readable. It yields the
  navigation (Build / Deploy / Collaborate / Data Storage / Infrastructure /
  Networking / Resources / Account / Billing / Activity / Organization), a
  three-step onboarding ending in "Launch an agent from a template", and
  "Available Balance: CONNECT TO VIEW". No pricing.
- `https://www.openmatter.network/pricing` - **FAILED, 404.**
  `https://docs.openmatter.network/` - **FAILED, does not resolve.** Probes of
  `/api/health`, `/api/plans`, `/api/pricing`, `/api/deployments` on the
  Datavizor host all returned 404. Public pricing does not exist; the rate used
  in section 6 is derived from one figure Zaal relayed on 2026-08-14 and is
  marked as such throughout.
- Dashboard state (project, container, ports, credits, plan) - Zaal's
  screenshot, 2026-08-22, relayed in `zao-vault/handoffs/openmatter.md` v4.

Related in-repo prior art: doc 599c (the Nous Hermes naming collision and the
now-closed investigate item), doc 2360 (which agent gets the legal body: ZOL),
doc 2284 (Oracle Always Free, the free-forever comparison), doc 2154/2155 (the
identity ladder). Rules that bind this addendum: `research-grounding.md`,
`anti-fabrication.md`, `state-claims.md`, `secret-hygiene.md`,
`agent-loops.md` rule 9.

---

## Addendum v5 - 2026-08-23: the meeting record, and three corrections to v4

The 2026-08-13 meeting notes have been carried as an open gap since this doc's
v3 addendum ("searched `zao-vault` and `research/` on 2026-08-21 - not found").
**Zaal supplied the Google Doc on 2026-08-23 and it has now been read in full,
notes plus the complete 27-minute transcript.** The gap is closed.

The raw document is a third-party record containing a counterparty's personal
email, so per `.claude/rules/pii-hygiene.md` rule 1 it lives off-repo at
`~/.zao/private/gdrive-zao-openmatter-agentic-legal-entities-20260813.md`, with
the load-bearing extracts timestamped. What follows is the synthesis, with the
counterparty's email redacted.

It corrects three things v4 got wrong, confirms two things v4 flagged as
unverified, and answers the company questions that had no public answer.

### Correction 1 - the credits are a partner GRANT, not ZAO money

v4 treated the 12.3513 Cr balance as a scarce resource whose consumption is a
spend decision, and reasoned from there to "run nothing production there yet."
The reasoning about *production* workloads still holds. The framing of the
credits does not.

Chris Biele, 00:13:38 and 00:14:42:

> "what we'll do is we'll get you set up with some **test credits**... I'll
> share the link here in the chat so you can log in straight after this call.
> And there's a **free 50 tokens** on the free set, but you'll be able to, we'll
> get you some **additional tokens** to be able to play around with this."

And the Gemini summary of the call records it as a decision: *"It was decided to
provide test credits to facilitate the creation of a newsletter agent as an
initial use case."*

So the credits were granted by OpenMatter, for a named purpose, as part of an
agreed beta-test collaboration. Spending them on that purpose is not a cost, it
is the deliverable. Zaal's own gate ("anything that spends credits is
Zaal-gated") is his rule and it stands unchanged - but the scarcity framing v4
built on top of it was wrong, and a lane reading v4 alone would be too cautious
by exactly one step.

### Correction 2 - the running deployment was created live on the 13th, and it is the agreed use case

v4 treated the deployment as new on 2026-08-22 and the project name as
incidental. Both wrong. At 00:25:02, screen-sharing, Zaal created it in front of
Chris:

> **Zaal:** "Oh, organization and project. I see. Okay. So let's do **the ZAO
> newsletter** first. That'll be a nice simple easy one to do."
> **Chris Biele:** "Yeah, perfect. So that might take a minute. It goes back and
> pings back and forth between sent and received. Then it'll eventually log and
> go to process."

The dashboard's "The ZAO Newsletter" project is therefore not a placeholder -
it is the exact initial use case both sides agreed to, created on the call.

**This also breaks v4's arithmetic, usefully.** v4 derived ~0.837 Cr per
compute-hour and concluded 12.3513 Cr buys ~14.8 hours. If a container had been
Running continuously since 2026-08-13, that is ~240 hours by the 22nd, which at
that rate would need ~200 Cr. The balance is 12.35 and Zaal's own 2026-08-14
reading was 0.3932. So at least one of the following is true, and the fourth is
the most likely:

1. the deployment was not running continuously across those nine days;
2. the real rate is far below 0.837 Cr/hr;
3. the Particle plan absorbs the burn before credits are touched (its "0% used,
   resets Aug 31" reading is consistent with this);
4. the balance was topped up between the 14th and the 22nd - which is exactly
   what Chris promised on the call ("we'll get you some additional tokens").

Either way, **v4's ~15-hour runway is not a safe planning number.** It is the
best that could be derived from one datum, and the meeting record now shows the
datum was taken mid-grant. Treat the runway as unknown until read off the
billing page.

### Correction 3 - the wallet-versus-credits discrepancy has an ordinary explanation

The 2026-08-14 "odd discrepancy between wallet balance and available credits"
has been an open technical question since v2. The transcript shows the same
confusion happening live, and being resolved by Chris in under a minute
(00:24:17):

> **Zaal:** "What should I do for the credits to actually launch it?"
> **Chris Biele:** "under billing you should see that you've got 50 credits...
> it should be automatically applied."
> **Zaal:** "It said zero when I first looked, but it might have been a
> different style of credits. I don't know. They're It's all one credit, right?"
> **Chris Biele:** "down at the bottom there doesn't say free... go to the free
> one. So just above that right there, **create an organization**."
> **Zaal:** "Oh, okay. I see. I didn't create one yet."

There are two distinct balances in Datavizor - an on-chain **wallet** address
shown on the dashboard, and a **billing credits** balance scoped to an
organization. Credits do not appear until an organization exists, and the free
tier is a separate line from purchased credits. Reading one and expecting the
other produces exactly the "discrepancy" that was reported.

**Graded honestly: this is a strong hypothesis, not a confirmed diagnosis.** It
explains the observed confusion precisely and it comes from the vendor's own
mouth, but nobody has re-read the 2026-08-14 screen to confirm that was the same
mistake. It downgrades the item from "unresolved technical blocker" to "probably
a UI misreading, worth one look."

### Confirmed - two things v4 and v3 flagged as unverified

**The Adam Miller bridge is real.** v3 flagged it as "a signal, not a
coincidence to assert as fact without more - ask Zaal directly." The transcript
settles it without asking. Chris Biele opens the call, 00:00:00:

> "as far as I understand, **Adam and you** have been talking about different
> ways of allowing agents to sort of maybe one click deploy an agent that forms
> its own entity, creates a bank account, and then becomes a business."

And at 00:07:18 he refers to MIDAO as shared context, unprompted:

> "in terms of **MIDA** [MIDAO] and how their **KYB and KYC** processes work, I
> don't know if it's the same for every entity they do. But you're going to have
> to figure out things like who's authorized to sign for the company, and I'm
> assuming that's going to be the artist."

An OpenMatter employee naming MIDAO's KYB/KYC flow as the assumed legal
counterpart is direct evidence that the two halves are one plan, exactly as the
lane brief asserted. `project_zao_midao_legal_body.md` can drop its hedge.

**Hermes Agent is an OpenMatter template.** v4 listed this as unverifiable
without a login. At 00:22:24, Chris walking Zaal through the deploy screen:

> "you can click view all on the upper right and that will, so **just above the
> Hermes**. Yeah, there you go. And then you can see them all laid out."

So `nousresearch/hermes-agent` was visible in OpenMatter's template list on
2026-08-13. The deployment was a template launch, not a custom container spec -
which also means the `/opt/data` persistence question from v4 is a question
about **OpenMatter's template definition**, not about anything Zaal configured.
That makes it answerable by them in one message.

### The company, from the vendor and from the record

The DEEP-tier question this doc could not answer in July ("no public pricing, no
step-by-step guides, enterprise-only, assume custom pricing") is now answerable.

**Straight from Chris Biele, 00:18:07:**

| Fact | Value |
|---|---|
| Team size | "about 12 people" |
| Founded | stealth, September 2025 |
| Testnet | February 2026 |
| Mainnet | June 2026 |
| Largest channel | the OpenMatter Substack, "like three something thousand followers" |
| Self-described weakness | "we've been gearing ourselves towards enterprise companies, but not focusing on the DAO, not focusing on the token, not focusing on the community building side" |
| Fix in progress | "We're going to bring on a marketing agency" |

**From public sources, 2026-08-23:**

- **OpenMatter Network Inc., Melbourne, Florida** - "Florida's Space Coast."
- Launch positioning: "Don't Trust Data. Prove It." Three components as this
  doc already recorded: Masked Compute, QuantumGuard, Datavizor.
- Named partner: **Dara** (Dara AI Ltd.), a privacy-first health data platform;
  its CEO is quoted in the launch release about joint healthcare-insight work.
- Earlier partner: **talentDAO**, announced 2025-11-04, DeSci framing.
- **No funding round is disclosed anywhere.** F4 Fund lists OpenMatter Network
  as a portfolio startup (founded 2025, "1-10 employees") but names no amount.
  Treat any specific figure as unknown, not as small.
- Technical substrate, from the talentDAO announcement: masked computing is
  "MPC network for up to five parties with dishonest majority and active
  adversary present," issuing "a post quantum safe zk proof," with differential
  privacy on outputs, "verified onchain using our coordination layer built on
  **Substrate**" and **libp2p**.

**A contradiction, left open.** SiliconAngle's launch piece names the founders
as "Davis and Anderson," with backgrounds in secure systems architecture,
distributed computing and cryptography. The lane brief's people list, drawn from
the Telegram group, names Adam Miller (group owner), Ren (CEO), AdaJane (CTO),
Chris Biele, and Chris (Quan) Marshall. F4 Fund says 1-10 employees; Chris said
~12. These may all be reconcilable - surnames versus display names, a stale
directory listing - but they are not reconciled here and should not be
synthesised into a confident roster.

### The features the transcript revealed that no public page describes

Everything below is from the live demo and appears nowhere on the public site:

- **A rebuilt OpenRouter.** "people who are using this interface will be able to
  have a model router. So it's essentially open router that we've rebuilt. And
  so they'll be able to set their agents up to do certain tasks via Anthropic,
  other tasks via an LLM that's hosted on Open Matter Network, and other tasks
  via an LLM that's hosted locally." For ZAO this is directly relevant - the
  cheap-AI ladder in `.claude/rules/claude-usage.md` is exactly a model-routing
  problem, and ZOL is out of OpenRouter credits.
- **ZKBC - Zero Knowledge Boundary Compliance.** Being standardised with the
  Hashgraph Online working group. "when your agent executes an action, be that
  outputting data, accessing data sets, or using a tool call, it has to prove
  that it's compliant to company policy... it creates a zero knowledge proof
  that shows that the whole execution was compliant. And that includes the data
  that was accessed, the data that was outputted, the tool calls that were used
  in that entire action." Framed against the EU AI Act and California privacy
  law. This is the single most architecturally interesting thing OpenMatter has
  for the ZOL-in-a-legal-body design: a community-owned agent inside an LLC
  needs to prove it obeyed its caps, and this is a mechanism for that.
- **Runtime-only key decryption.** "all the keys and variables that that agent
  is associated with... rather than just existing somewhere on our network in an
  unencrypted fashion, they're all encrypted and then decrypted at runtime...
  there's no honeypot to extract any keys and variables." Read this next to v4's
  security section: it addresses key-at-rest exposure, and says nothing about an
  exposed API server or dashboard port, which is a different attack surface. Both
  can be true. v4's three security checks still stand.
- **Post-quantum networking, including a post-quantum VPN.**
- **Communities, organizations and projects** - discussions, membership,
  permissioned data-set sharing. Explicitly "still in beta on these features."
  Zaal identified this as solving a real ZAO problem: "that's like one of my
  biggest challenges as well where I'm like I'm only giving access to people
  that are well within the community."
- **DePIN resource contribution.** "we're a DPIN network and people will be able
  to add their resources and earn compute credits." Zaal's response is the
  ZAO-shaped part: "we have a big network of individuals who also have just
  computers sitting idle who would be super willing to earn... we can also work
  out a deal where it's like not as much as normal compute but I'm giving them
  the benefit of XYZ thing."

### Pricing, triangulated

OpenMatter still publishes no pricing (`/pricing` 404s, `docs.openmatter.network`
does not resolve, Datavizor renders balance behind login - all re-checked
2026-08-22). But the transcript gives an anchor the public site does not, and it
cross-checks the derived rate.

Chris Biele, 00:15:33:

> "Currently it's **billed at a per hour for deployment**, which is **not
> ideal**. That's not what we want because we don't want to be charging like,
> you know, like **10 cents an hour** to run this thing. That's **not
> sustainable**."

Put that beside v4's derived ~0.837 Cr per compute-hour: if a credit is worth
roughly **$0.12**, then 0.837 Cr/hr is about **$0.10/hr** - the exact figure
Chris named. Two independent paths landing on the same number is meaningful.

**Do not over-read it.** Chris said "like 10 cents an hour" as an illustrative
figure while arguing the model is wrong, not as a quoted rate, and the vendor is
explicitly planning to change it. The honest statement is: the derived rate is
consistent with the only price anchor that exists, and both are provisional.

On that basis 50 free credits is roughly $6, or ~60 compute-hours, and the
current 12.3513 Cr is roughly $1.50. **These are small numbers**, which is the
real point - and it reinforces correction 1. This is a sandbox grant, not a
budget to defend.

### Where OpenMatter sits among comparables

The July doc said no pricing was findable and left the competitive question
open. Grounded comparables, measured 2026-08-23:

| Platform | Privacy mechanism | Deploy unit | Billing | Published rate |
|---|---|---|---|---|
| **OpenMatter** | MPC + FHE + ZK, keys decrypted at runtime, ZKBC | container from a template | credits, per compute-hour | **none published**; "like 10 cents an hour" spoken |
| **Phala Cloud** | TEE - Intel TDX, AMD SEV-SNP, NVIDIA GPU TEE | Docker | prepaid credits, $PHA | **$0.05-0.06 per vCPU-hour** (16GB incl), $2.50/hr H100 |
| **Nillion nilCC** | AMD SEV-SNP confidential VMs, dm-verity, attestation | Docker Compose | credits, burn NIL | tiered, published via API |
| **Akash** | none - standard container isolation | Kubernetes container | on-chain spot auction, AKT | market-set |
| **Fluence** | none - conventional VMs | VM | USDC, 24-hour epochs | posted, no egress fees |

Read honestly, that table says: **OpenMatter's rate is in the same order as
Phala's and possibly ~2x it, while Phala publishes its rate and OpenMatter does
not.** OpenMatter's differentiator is not price and not raw compute - it is the
combination of MPC-based multi-party collaboration (up to five parties) with
ZKBC compliance proofs, which none of the others offer. If ZAO ever needs an
agent to *prove* it obeyed a policy, that is the reason to be here. If ZAO needs
cheap containers, three of the four alternatives are cheaper and one of them
publishes what it charges.

### What is now actually outstanding

The 2026-08-13 call produced three named next steps. **All three were still open
on 2026-08-23, ten days later**, and two of them are Zaal's:

| Owed | By | Status |
|---|---|---|
| Send the GitHub repository link to Chris for review | Zaal | open; he said on the call "I'll send you my GitHub after this" |
| Share the OpenMatter Substack URL | Chris Biele | open |
| Explore the platform and share thoughts in the group chat | Zaal | partially done - the deploy exists, the feedback does not |

Layered on top: the 2026-08-18 "how did you get on with your deployments?"
exchange, unanswered since, now **five days**.

This is textbook `.claude/rules/recap-followthrough.md` - a recap froze at the
moment of promising, and the promises to someone outside ZAO have no board card
and no owner. The fix is not another doc. It is a message and a repo link.

### Revised verdict

v4 split July's WATCH into "WATCH as infrastructure, live as a relationship."
The meeting record sharpens both halves:

- **As infrastructure for production workloads: still WATCH**, and the reasoning
  in v4 survives - metered compute is the wrong home for work that currently
  runs on hardware ZAO already pays for.
- **As a funded, agreed beta test: ACTIVE, and under-delivered.** Both sides
  agreed to beta testing plus joint demo content. OpenMatter provided credits
  and has been waiting since. ZAO has a container running and has said nothing.
- **As the compute layer of the ZOL legal-body design: strengthened.** ZKBC is a
  better fit for a community-owned agent that must prove it obeyed its caps than
  anything else surveyed, and the MIDAO link is now confirmed rather than
  inferred.

### Sources added in v5

- **2026-08-13 meeting record** - Google Doc, "ZAO <> OpenMatter - Agentic Legal
  Entities - 2026/08/13 16:30 BST - Notes by Gemini," owned by the OpenMatter
  contact, supplied by Zaal 2026-08-23, read **[FULL]** via the Google Drive API
  (notes plus the complete transcript to 00:27:06). Raw copy off-repo per
  `pii-hygiene.md` at `~/.zao/private/gdrive-zao-openmatter-agentic-legal-entities-20260813.md`.
  Gemini's own caveat kept: the transcript is machine-generated and contains ASR
  errors ("the Zho" for The ZAO, "Wave Wars" for WaveWarZ, "MIDA" for MIDAO,
  "Ashgraph" for Hashgraph, "DPIN" for DePIN).
- `siliconangle.com/2026/06/30/startup-openmatter-wants-make-enterprises-prove-ai-agents/`
  - **[PARTIAL - via exa semantic search highlights, not a raw page fetch]**.
  Florida HQ, the three components, the Dara partnership, the founder surnames.
  Marked PARTIAL deliberately: the founder-name claim rests on a search
  highlight, which is why it is reported as an unresolved contradiction rather
  than as the roster.
- `helpnetsecurity.com/2026/06/30/...`, `securitybrief.news/story/openmatter-launches-verifiable-ai-collaboration-platform`,
  `techstartups.com/2026/06/30/...` - **[PARTIAL - exa highlights]**. All three
  are the same CyberNewswire launch release; treated as one source, not three.
- `talentdao.substack.com/p/introducing-openmatter-network` (2025-11-04) -
  **[PARTIAL - exa highlights]**. The Substrate/libp2p substrate detail and the
  five-party dishonest-majority MPC description.
- `f4.fund/startups/openmatter-network` - **[PARTIAL - exa highlights]**.
  Portfolio listing, founded 2025, "1-10 employees" - which contradicts the
  vendor's own "about 12 people" and is reported as such.
- LinkedIn post by the OpenMatter GTM lead, 2026-07-02 - **[PARTIAL - exa
  highlights]**. Corroborates the June mainnet date.
- `phala.com/learn/Phala-vs-AWS-vs-Azure-vs-GCP`, `phala.com/posts/Phala-Akash-Fleek`,
  `docs.nillion.com/blind-computer/build/compute/overview` and `/api-reference`,
  `nillion.com/news/nillions-phase-2-upgrade-is-live...`,
  `fluence.network/blog/decentralized-cloud-computing-guide/` - **[PARTIAL - exa
  highlights]**. The comparables table. Phala's per-vCPU-hour figures are dated
  "as of Q1 2025" by Phala itself and are used as an order-of-magnitude anchor,
  not a current quote.
- Hacker News, Algolia API (keyless) - **[FULL, negative result]**, 2026-08-23.
  A query for "openmatter" returns 290 hits, every one of them a false positive
  on the ordinary phrase "open matter." **There is no Hacker News discussion of
  OpenMatter Network.** For a company that launched publicly in June 2026 with a
  newswire release, that is a real signal about reach, and it matches the
  vendor's own admission that community building has not been the focus.

**Escalation honesty.** The secondary sources above are marked PARTIAL rather
than FULL because they were read through exa's search highlights rather than
fetched raw. They are used only for corroborating facts already stated by the
vendor on the call (Florida HQ, June mainnet, the three components) or for the
comparables table. **No load-bearing claim in this addendum rests on a PARTIAL
source alone** - the meeting record is FULL, and it is where every correction
above comes from.
