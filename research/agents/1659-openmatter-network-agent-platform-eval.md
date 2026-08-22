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
