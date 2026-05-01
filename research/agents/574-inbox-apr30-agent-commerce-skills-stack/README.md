---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-04-30
related-docs: 280, 322, 352, 429, 468, 558, 562, 567, 568
tier: STANDARD
---

# 574 — Inbox Batch Apr 30: Agent Commerce, Alignment Skills, Local Stack Update

> **Goal:** Synthesize 10 unread inbox items (5 X posts, 4 Reddit, 1 product page) into action-bridges. Anchor against the install wave of Docs 558-573.

## Key Decisions (TL;DR)

| # | Recommendation | Why | Owner |
|---|---|---|---|
| 1 | **INSTALL Matt Pocock's `grill-me` skill into ZAOOS `~/.claude/skills/`** | 45,289 GitHub stars (Apr 30 2026), inverts brainstorm: AI interrogates Zaal with 40-100 questions before code. Already aligned with `feedback_brainstorm_before_writing.md` + `.claude/rules/skill-enhancements.md` reverse-prompting rule. | @Zaal |
| 2 | **TRACK Stripe Agentic Commerce Suite (ACS) + Google Gemini integration as ZAO Music payment lane** | Apr 30 2026 Stripe-Google partnership extends ACS to Gemini surfaces. Shared Payment Tokens (SPTs) = the "x402 alternative" for ZAO Music agent purchases (rights/licenses/streams). Doc 352 + 429 already cover x402; ACS = the fiat lane. | @Zaal |
| 3 | **SKIP WaliGPT managed OpenClaw ($24.50-$59/mo)** | We self-host OpenClaw on VPS 1 already (`project_openclaw_status.md`). WaliGPT = Clerk + Stripe wrapper. Use only as cold-start UI reference for Pixel Agents portal. | @Zaal |
| 4 | **ADD `prose-craft` (33 stars, MIT) + `ghostwriter` (18 stars, MIT) to humanizer skill stack** | Extends Doc 558 (Anbeeld WRITING.md) + Doc 562 (blader/humanizer + quang-vybe). Ghostwriter explicitly compat with OpenClaw + Hermes — wires straight into ZOE/ROLO. | @Zaal |
| 5 | **DEDUPE 4 Claude Code listicle articles (zodchiii .env + CLAUDE.md, anatoli prompts, rohit AI agents 2026)** | Already covered by `.claude/rules/secret-hygiene.md` (Doc 461/523), project `CLAUDE.md`, and Doc 506 (TRAE skip). No new install. | — |
| 6 | **EXTEND Doc 567 (HF local) with Groq free tier (Llama 3.3 70B @ 200 tok/s) + razvanneculai/litecode planner-executor pattern** | Free LLM month post matches Zaal's prefer-Claude-Max + OSS-first feedback memory. Groq = real free option for ZOE side-tasks. | @Zaal |

## Source Inventory

10 inbox items from `zaalp99@gmail.com` -> `zoe-zao@agentmail.to`, all from 2026-04-27 to 2026-04-30:

| # | Source | Type | Engagement | Bucket |
|---|---|---|---|---|
| 1 | [zodchiii X — .env Setup keeps Claude Code from leaking secrets](https://x.com/zodchiii/status/2049779422291460576) | Article-tweet | 267 favs | E (dedupe) |
| 2 | [vibecoding Reddit — month of free LLMs (litecode)](https://www.reddit.com/r/vibecoding/comments/1szs4b3/) | Self-post | 28 ups, 32 comments | B (free stack) |
| 3 | [WaliGPT app](https://app.waligpt.com/) | Product | n/a | D (managed OpenClaw) |
| 4 | [anatolikopadze X — 20 Claude prompts $20 sub](https://x.com/anatolikopadze/status/2049492553133629950) | Listicle | 998 favs | E (dedupe) |
| 5 | [_MaxBlade X — Stripe agent marketplace](https://x.com/_maxblade/status/2049604418354438487) | Quote-tweet | 7,464 favs, 206 replies | A (Stripe ACS) |
| 6 | [rohit4verse X — What to Learn/Build/Skip in AI Agents 2026](https://x.com/rohit4verse/status/2049548305408131349) | Article-tweet | 794 favs | E (dedupe) |
| 7 | [ClaudeCode Reddit — humanizer comment](https://www.reddit.com/r/ClaudeCode/comments/1sy4137/comment/oirm28i/) | Comment | thread parent below | C (writing skills) |
| 8 | [ClaudeCode Reddit — humanizer thread (vybe.build)](https://www.reddit.com/r/ClaudeCode/comments/1sy4137/the_most_useful_claude_skill_i_ever_created/) | Self-post | active thread | C (writing skills) |
| 9 | [zodchiii X — CLAUDE.md File That 10x'd Output](https://x.com/zodchiii/status/2048683276194185640) | Article-tweet | 1,265 favs | E (dedupe) |
| 10 | [vibecoding Reddit — Grill Me viral 13K+ stars](https://www.reddit.com/r/vibecoding/comments/1swyadr/) | Image-post | 1,061 ups, 152 comments | C (alignment skill) |

## Section A — Stripe Agentic Commerce Suite (NEW SIGNAL)

**What's live as of 2026-04-30:**
- Stripe Agentic Commerce Suite (ACS) launched Dec 11 2025 ([Stripe newsroom](https://stripe.com/newsroom/news/agentic-commerce-suite))
- Apr 30 2026: Stripe + Google partnership lets Gemini surfaces do in-experience checkout ([Payments Dive](https://www.paymentsdive.com/news/stripe-google-partner-on-agentic-commerce/818915/))
- Mechanism: **Shared Payment Tokens (SPTs)** — AI agent passes buyer credentials to merchant; merchant runs payment through Stripe like any normal charge
- Early adopters: Coach, Kate Spade, URBN (Anthropologie/Free People/Urban Outfitters), Revolve, Etsy, Squarespace, Wix, BigCommerce

**MaxBlade's signal (7.4K favs):** "Stripe just gave you a new way to create generational wealth. Agents will be spending millions, eventually billions of dollars. The marketplace is empty right now."

**ZAO context (existing research):**
- Doc 280 — FID + x402 deep dive
- Doc 352 — Paragraph x402 agent implementation
- Doc 322 — Paragraph publishnew newsletter agent commerce
- Doc 429 — Paragraph agents launch apr2026
- `everything-claude-code:agent-payment-x402` skill installed already

**Decision: x402 (crypto) and Stripe ACS (fiat) are not competitors — they are two lanes of the same agent-payment graph.** ZAO Music payment plan should support both:

| Lane | Rail | Use case | Status |
|---|---|---|---|
| x402 (HTTP 402) | USDC on Base | Agent-to-agent micropayments, ZABAL gating | Doc 352 implementation path |
| Stripe ACS / SPT | USD/major cards | Fiat-buyer agent purchases of ZAO releases, tickets, merch | NEW — open scope |

**Concrete ZAO Music wiring (Doc 475):** when an agent buys a release on behalf of a Spotify/Apple-Music human, the rev-share split (DistroKid -> 0xSplits -> artists) needs to accept SPT payloads. BMI publishing royalties are unaffected.

## Section B — Free + Local LLM Stack Delta vs Doc 567

**razvanneculai/litecode** (vibecoding Reddit post 2):

- Author benchmarked free tiers over 1,500-2,000 LLM calls, $0 spent
- **Groq** = speed king: Llama 3.3 70B at 200+ tok/s, generous free tier
- **Gemini 2.5 Flash** via Google AI Studio = "almost non-stop" free tier
- **OpenRouter** = mixed (Nemotron free decent for simple)
- **DeepSeek** = sub-cent/req paid (cheap enough)
- **Ollama + LM Studio** = local ceiling around qwen2.5-coder 7B / deepseek-coder 6.7B on consumer GPU

**Architectural insight:** litecode uses **planner-executor split** — planner sees only project structure, executor edits one file at a time. Multi-file changes = multiple small calls. Counters the "200k context = required" narrative by treating context as the constraint, not the fix.

**ZAO context:** Doc 567 already plans Open WebUI + LM Studio + Ollama + LiteLLM proxy. **Add: Groq as fallback layer for ZOE side-tasks** (digest summaries, social drafts, low-stakes triage). Free, fast, no GPU needed.

| Layer | Role | Cost |
|---|---|---|
| Claude Code Max sub | Primary dev + ZAO bots (per `feedback_prefer_claude_max_subscription.md`) | $200/mo |
| Groq Llama 3.3 70B | ZOE side-tasks, digest gen, draft pass | $0 |
| Gemini 2.5 Flash | Long-context summarization, brand-voice scoring | $0 |
| LM Studio MLX (Mac) | Private/sensitive content | $0 |

## Section C — Humanizer + Alignment Skills Stack

**Existing (Doc 558, 562):**
- Anbeeld/WRITING.md (14-rule prose toolkit)
- blader/humanizer (best in class per vybe.build founder)
- quang-vybe humanizer

**NEW additions to lift:**

### 1. mattpocock/skills `grill-me` (45,289 stars Apr 30 2026)

Inverts the brainstorm dynamic. Instead of Zaal explaining the idea -> AI generates code, the AI interrogates Zaal with 40-100 questions on requirements, edge cases, UX, data models, failure modes BEFORE any code. Repo at [github.com/mattpocock/skills](https://github.com/mattpocock/skills).

This is exactly Zaal's `feedback_brainstorm_before_writing.md` + `.claude/rules/skill-enhancements.md` reverse-prompting rule, formalized into a skill. **Install action:**

```bash
mkdir -p ~/.claude/skills/grill-me
gh repo clone mattpocock/skills /tmp/mp-skills
cp -r /tmp/mp-skills/grill-me ~/.claude/skills/
```

### 2. TimSimpsonJr/prose-craft (33 stars, MIT)

- **Voice registers:** multiple profiles (personal vs professional)
- **Craft rules:** concrete-first, deliberate openings, structural variety
- **Dual review:** one agent detects AI patterns, second evaluates literary devices
- `/prose-craft-learn` analyzes manual edits to refine over time
- Banned phrases: "delve", "Furthermore"

### 3. angelarose210/ghostwriter (18 stars, MIT)

- Four skills: `voice-analyze`, `voice-create`, `voice-blend`, `voice-apply`
- 200+ AI-tells dictionary
- **Compatible with Claude Code, Hermes Agent, OpenClaw** — only writing skill that names OpenClaw explicitly
- Profile storage at project + user level

**Stack-up plan:**

| Skill | When to use |
|---|---|
| Anbeeld WRITING.md | Long-form articles, doc 568 newsletter, ZAOstock 1-pagers |
| blader/humanizer | Final pass before publish |
| ghostwriter | OpenClaw / ZOE / ROLO content auto-gen — auto-applies Zaal voice |
| prose-craft | Iterative refinement over time (the `learn` step) |
| Pocock grill-me | BEFORE any non-trivial implementation, replaces ad-hoc reverse-prompting |

## Section D — WaliGPT vs Self-Hosted OpenClaw

**WaliGPT** ([app.waligpt.com](https://app.waligpt.com/)) = managed OpenClaw deployment service. Stack: Clerk auth, Stripe billing, isolated cloud instances per agent.

**Pricing (current as of Apr 30 2026):**
- WaliGPT: Stripe-billed (no public tier shown without login)
- OpenClaw Cloud: $59/mo ($29.50 first month)
- OpenClaw Launcher promo: $24.50/mo
- **Self-hosted: $0 (we run this on VPS 1)**

**ZAO state (existing memory):**
- `project_openclaw_status.md` — OpenClaw live on VPS 1 (Hostinger KVM 2, 31.97.148.88)
- `project_paperclip_infra.md` — Paperclip live at paperclip.zaoos.com via named tunnel
- `project_ao_vps_portal_decision.md` — AO at ao.zaoos.com password qwerty1
- `feedback_oss_first_no_platforms.md` — OSS-first, no SaaS unless cheap + solves auth/payments

**Decision: SKIP WaliGPT for own use.** Use as **UX reference** for Pixel Agents portal at pixels.zaoos.com (`project_agent_squad_dashboard.md`). Their one-click-deploy-per-agent flow is what we want for the 10-order branded bot fleet (`project_tomorrow_first_tasks.md`).

## Section E — Claude Code Listicle Dedupe (Items 1, 4, 6, 9)

| Item | Article title | Already covered by |
|---|---|---|
| 1 zodchiii Apr 30 | "The .env Setup That Keeps Claude Code From Leaking Your Secrets" | `.claude/rules/secret-hygiene.md` (5-guard pipeline), Doc 461 fix-PR pipeline, Doc 523 audit |
| 4 anatoli Apr 29 | "20 Claude Prompts that turn $20 sub into Personal Assistant" | Project `CLAUDE.md`, all `.claude/rules/*.md` |
| 6 rohit Apr 29 | "What to Learn, Build, and Skip in AI Agents (2026)" | Doc 506 (TRAE skip), Doc 472 (AI tooling roundup), Doc 567 |
| 9 zodchiii Apr 27 | "The CLAUDE.md File That 10x'd My Output" | Project `CLAUDE.md` (already 10x-tier with workflow orchestration + boundaries + per-file commands) |

**Verdict: no new install actions.** File these as `x-posts` reference only.

## Connection to Recent Install Wave (Docs 549-573)

This batch closes 3 open threads from the install wave:

| Open thread (existing doc) | This doc closes by |
|---|---|
| Doc 558 Anbeeld WRITING.md — needs companion AI-tells dictionary | Adding ghostwriter (200+ AI-tells) |
| Doc 562 humanizer + Ronin pattern — needs voice-learning loop | Adding prose-craft `/prose-craft-learn` |
| Doc 567 HF local + ask-gpt — needs free-tier tier-1 model | Adding Groq Llama 3.3 70B @ 200 tok/s |

**Open threads still NOT closed by this batch (parking lot):**
- Doc 565/566 ask-gpt loop — needs ask-local mirror skill (Doc 567 plan)
- Doc 568 Aware Brain KG — pending Khoj/Reor install decision
- Doc 569 YapZ Bonfire ingestion — pending Bonfire SDK config
- Doc 470/471 — Vercel OAuth audit (`project_research_followups_apr21.md`)

## Hallucination + Staleness Audit

| Claim | Source | Verified |
|---|---|---|
| mattpocock/skills 45,289 stars | implicator.ai + clauday.com cross-check | Apr 30 2026 |
| Stripe ACS launched Dec 11 2025 | stripe.com newsroom | confirmed |
| Stripe + Google Gemini partnership | paymentsdive.com Apr 30 2026 | confirmed today |
| Groq Llama 3.3 70B @ 200 tok/s free | razvanneculai self-report only | NOT independently verified — note "user-reported, not benchmarked" |
| WaliGPT pricing | requires login to view actual tiers | partial — only OpenClaw umbrella numbers verified |
| prose-craft 33 stars / ghostwriter 18 stars | direct GitHub fetch | Apr 30 2026 |
| Pocock skill repo viral chronology | Multiple sources concur (24h: 22K -> 30.8K -> 45K stars) | confirmed |

No URL 404s found. All 10 inbox URLs resolved. Reddit short URLs needed redirect resolution (HTTP 301 -> full path).

## Also See

- [Doc 280](../../280-fid-registration-x402-deep-dive/) — x402 deep dive
- [Doc 352](../../business/352-paragraph-x402-agent-implementation/) — x402 agent impl
- [Doc 429](../../business/429-paragraph-agents-launch-apr2026/) — Paragraph agents
- [Doc 472](../../dev-workflows/472-ai-tooling-roundup-apr21/) — AI tooling roundup
- [Doc 506](../../dev-workflows/506-trae-ai-skip/) — TRAE skip
- [Doc 558](../../dev-workflows/558-anbeeld-writing-md/) — Anbeeld WRITING.md
- [Doc 562](../../dev-workflows/562-reddit-x-scraping-meta-eval/) — humanizer + Ronin
- [Doc 567](../../dev-workflows/567-hf-local-models-stack/) — HF local stack

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Clone + install `mattpocock/skills/grill-me` to `~/.claude/skills/` | @Zaal | Install | This week |
| Clone + install `TimSimpsonJr/prose-craft` to `~/.claude/skills/` | @Zaal | Install | This week |
| Clone + install `angelarose210/ghostwriter` to `~/.claude/skills/` (wires into OpenClaw) | @Zaal | Install | This week |
| Open Stripe ACS account under BCZ Strategies LLC, scope to ZAO Music DBA (Doc 475) | @Zaal | Bizdev | Next sprint |
| Add Groq API key to ZOE side-task router; route digest gen + low-stakes drafts | @Zaal | Infra | Next sprint |
| Map Pixel Agents portal UX against WaliGPT (no install — copy patterns only) | @Zaal | Design | When portal sprint resumes |
| Create Doc 575: ZAO Music payment lanes (x402 + Stripe ACS dual rail) | @Zaal | Research | After Stripe account opens |
| File Doc 471 Vercel OAuth audit (still parked from Apr 21) | @Zaal | Security | Unblock |

## Sources

- [Stripe — Agentic Commerce Suite launch](https://stripe.com/newsroom/news/agentic-commerce-suite)
- [Stripe blog — Introducing the Agentic Commerce Suite](https://stripe.com/blog/agentic-commerce-suite)
- [Payments Dive — Stripe + Google agentic commerce Apr 30 2026](https://www.paymentsdive.com/news/stripe-google-partner-on-agentic-commerce/818915/)
- [Stripe docs — Agentic commerce](https://docs.stripe.com/agentic-commerce)
- [implicator.ai — Pocock skills 45K+ stars](https://www.implicator.ai/matt-pocock-skills-repo-jumps-past-45k-stars-with-reusable-ai-instructions/)
- [Matt Pocock blog — Grill Me went viral](https://www.aihero.dev/my-grill-me-skill-has-gone-viral)
- [github.com/mattpocock/skills](https://github.com/mattpocock/skills)
- [github.com/TimSimpsonJr/prose-craft](https://github.com/TimSimpsonJr/prose-craft)
- [github.com/angelarose210/ghostwriter](https://github.com/angelarose210/ghostwriter)
- [github.com/blader/humanizer](https://github.com/blader/humanizer)
- [github.com/Anbeeld/WRITING.md](https://github.com/Anbeeld/WRITING.md)
- [github.com/razvanneculai/litecode](https://github.com/razvanneculai/litecode)
- [vibecoding Reddit — month of free LLMs](https://www.reddit.com/r/vibecoding/comments/1szs4b3/)
- [ClaudeCode Reddit — humanizer thread](https://www.reddit.com/r/ClaudeCode/comments/1sy4137/the_most_useful_claude_skill_i_ever_created/)
- [vibecoding Reddit — Grill Me viral](https://www.reddit.com/r/vibecoding/comments/1swyadr/)
- [WaliGPT app](https://app.waligpt.com/)
- [vybe.build humanizer post](https://www.vybe.build/blog/humanizer-prompt-to-copy)
