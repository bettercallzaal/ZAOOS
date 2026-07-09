---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-09
original-query: "n8n workflow automation 2026 - what is it, how ZAO should use it for more things. Research n8n docs, GitHub, licensing (fair-code), self-hosting on VPS, AI agent features, ZAO use cases (Farcaster/Neynar/Supabase/Telegram bots/GitHub/newsletter), integration with ZOE orchestrator. Rank 6-10 workflows by effort + fit. Cover licensing, self-hosting on 31.97.148.88, architectural boundary vs ZOE, cost, vendor lock-in. Tier: DEEP."
tier: DEEP
related-docs: "759 (ZOE orchestrator), 734 (Hermes framework), 887 (rate limit diagnosis), 801-802 (MCP tooling)"
superseded-by: ""
---

# 1002 - n8n Workflow Automation: Architecture, Self-Hosting, and 8 High-Priority ZAO Workflows

> **Goal:** Determine whether n8n should be adopted for ZAO's internal automation; if yes, what workflows ship first, and how it integrates with ZOE.

## Executive Summary

**Recommendation: ADOPT n8n for webhook glue + scheduled event routing. Ship as complement to ZOE, not replacement.**

n8n is a fair-code visual+code workflow builder with 1,500+ integrations, LangChain-based AI agents, and full self-hosting without vendor lock-in. ZAO's use case (internal automation, data privacy, team ownership of workflows) aligns perfectly with n8n's positioning.

**Boundary:** ZOE owns reasoning/planning/multi-agent coordination. n8n owns webhook plumbing, scheduled syncs, and cross-platform relay (Telegram, Discord, Farcaster, Slack). They complement each other.

**Cost:** Free self-hosted on existing VPS ($25-30/mo infrastructure) vs €24-490/mo cloud or $155+/mo Zapier. No vendor lock-in (workflows are JSON, portable).

**Ship Plan:** Week 1 deploy + Farcaster alert PoC → Week 2 newsletter cross-post (eliminates 30min manual/issue) → Week 3 GitHub PR sync → Week 4 monitor & plan Phase 2.

---

## Section 1: What n8n Is (and Why It Differs from Zapier/Make)

### Core Identity

**n8n** is a **fair-code workflow automation platform** built in TypeScript (91.5%), Vue (7%), JavaScript. It combines:
- **Visual node-based canvas** for non-coders (design workflows like Figma)
- **JavaScript/Python code nodes** for engineers (customize any step)
- **1,500+ native integrations** (Farcaster via Neynar, Telegram, Supabase, GitHub, Discord, X, Stripe, etc.)
- **LangChain-based AI Agent node** for autonomous reasoning (Claude/GPT-4o/Gemini, ReAct framework)
- **Self-hosting** - full source code available, deployable on your own VPS/infrastructure
- **Webhook-driven + scheduled execution** - trigger on event (webhook), run on cron (schedule), or manually

**License: Sustainable Use (Fair-Code).** Not OSI open-source, but intentionally restricts commercial resale to protect vendor. ZAO's internal use case is fully compliant (see Licensing section below).

### How It Differs from Competitors

| Dimension | n8n | Zapier | Make | Parabola |
|-----------|-----|--------|------|----------|
| **Self-hosting** | YES (Docker/K8s) | Cloud-only | Cloud-only | Cloud-only |
| **Data residency** | Your VPS = full control | Zapier's cloud | Make's cloud | Parabola's cloud |
| **Integrations** | 1,000+ native, unlimited via API | 8,000+ (largest) | 1,500+ | Limited |
| **Code flexibility** | Full JS/Python code nodes | Limited code | Limited | No |
| **Licensing** | Fair-code (no resale) | Proprietary SaaS | Proprietary SaaS | Proprietary SaaS |
| **Pricing model** | Free self-hosted; cloud tiers €24-490/mo | Per-task ($19.99/mo for 750 tasks) | Per-operation ($9/mo for 10k ops) | Per-user premium |
| **Learning curve** | Moderate (visual + code) | Very easy (no code) | Moderate | Steep (design-first) |
| **AI Agent support** | Native LangChain, ReAct framework, Claude/GPT-4o | Zapier Agents + Copilot (2026) | Maia AI + Make Agents (2026) | Limited |
| **Cost at scale (10k runs/mo)** | ~$50-500/mo (self-hosted) free | $3,000+ (prohibitive) | $90-500/mo | N/A |

**Verdict:** n8n wins on **cost efficiency, data control, and self-hosting**. Zapier wins on ease-of-use for non-technical teams. Make wins on transparency + AI features parity. All three have AI agents now (2026), narrowing traditional differentiation.

### 2026 Evolution: MCP Integration

**Model Context Protocol (Public Preview, April 2026):**

n8n now acts as both:
1. **MCP Server** - your n8n workflows become tools callable by Claude Desktop or any MCP client
2. **MCP Client** - n8n workflows can call tools from external MCP servers

This enables true hybrid systems: ZOE (custom harness) can call n8n workflows as first-class tools via MCP, and vice versa. Breaks down silos between platforms.

---

## Section 2: Licensing & Legal - ZAO Compliance Check

### Sustainable Use License: What ZAO Can & Cannot Do

**License Type:** Sustainable Use License (SUL) - a fair-code model, not MIT/Apache/GPL.

**Exact Restriction (verbatim from LICENSE.md):**
> "You may use or modify the software only for your own internal business purposes or for non-commercial or personal use."

**PERMITTED - ZAO Can Do This:**
- ✓ Self-host n8n for internal ZAO team workflows
- ✓ Automate internal processes (Farcaster ingestion, task tracking, social posting, event coordination)
- ✓ Build custom nodes for internal use
- ✓ Charge customers for services you build using n8n (e.g., "ZAOstock automation suite") - the restriction is NOT on using n8n to power a product
- ✓ Hire consultants/contractors to deploy and maintain n8n for you
- ✓ Consulting revenue (charging for workflow design, support, training)

**NOT PERMITTED - ZAO Needs Commercial License:**
- ✗ Resell n8n itself as a SaaS (white-labeling n8n as "ZAO Automation Platform")
- ✗ Host n8n and charge users for access to the n8n editor/platform
- ✗ Create a managed workflow service where external customers rent n8n instances

**Verdict:** ZAO's use case (internal automation, not reselling n8n itself) is **FULLY COMPLIANT** without any special license. No legal blockers.

**Note on Enterprise Features:** Files marked ".ee." (Enterprise Edition) are NOT under Sustainable Use License - they require separate commercial licensing. Standard open-source n8n has no .ee restrictions.

---

## Section 3: Self-Hosting on 31.97.148.88 - Technical Feasibility

### Deployment Architecture

**Standard setup:**
```
n8n container (port 5678)
  ↔ PostgreSQL database (persistence)
  ↔ Nginx reverse proxy (port 443, SSL/TLS)
  ↔ Internet (webhooks in/out)
```

**Technology:**
- Container runtime: Docker / Docker Compose (standard)
- Database: PostgreSQL (required for production; SQLite only for testing)
- Reverse proxy: Nginx or Caddy (SSL termination, rate limiting)
- Optional: Redis (caching, rate limit tokens)
- OS: Ubuntu 24.04 LTS recommended (also works on Debian, CentOS, RHEL)

### Resource Requirements for Production

Your existing VPS: **31.97.148.88** (currently runs Supabase, Neynar clients)

**Minimum specs (development/testing):**
- 1 vCPU, 2 GB RAM, 20 GB storage (SQLite)

**Production specs (what ZAO actually needs for 8-10 workflows):**
| Component | Requirement | Notes |
|-----------|-------------|-------|
| **vCPU** | 2 vCPU | n8n + PostgreSQL concurrent queries |
| **RAM** | 4-8 GB | n8n idle: 300-500 MB; under load: 1-2 GB; PostgreSQL: 512MB-1GB; OS: 500MB-1GB; headroom: 500MB |
| **Storage** | 64 GB NVMe SSD | PostgreSQL write performance critical (not HDD) |
| **Database** | PostgreSQL 14+ | Separate service or managed (DigitalOcean Managed DB: $12-25/mo) |

**Memory Breakdown (Critical):**
- n8n container: 300-500 MB idle, 1-2 GB during workflow execution spikes
- PostgreSQL: 512 MB - 1 GB (depends on connection pool + data volume)
- OS/Docker overhead: ~500 MB - 1 GB
- Headroom: ~500 MB (buffer for spikes)
- **Total: 4 GB minimum; 8 GB preferred for stable production**

**VPS Co-residency Warning:**
Your existing VPS already runs Supabase + Neynar. If currently at 80%+ RAM utilization, adding n8n will cause out-of-memory crashes. **ACTION: Check `free -h` on 31.97.148.88 before proceeding.**

### Cost Estimate

| Item | Cost | Notes |
|------|------|-------|
| VPS upgrade (extra 2-4 GB RAM) | $5-15/mo | If needed; Linode/DigitalOcean/Hetzner |
| PostgreSQL managed DB (if separate) | $12-25/mo | Supabase, DigitalOcean, AWS RDS |
| **Total infrastructure** | $17-40/mo | Much cheaper than cloud n8n or Zapier |

**Comparison:**
- n8n Cloud (Pro): €60/month = ~$65/mo (managed, zero ops)
- Zapier (standard): $155/mo (+ per-task overages at volume)
- **Self-hosted n8n: $17-40/mo + 5-10 hrs/yr DevOps**

### Data Persistence, Backups & Encryption

**What Gets Stored:**
- Workflow definitions (JSON)
- Node configurations
- Credentials (API keys, OAuth tokens, DB passwords) - **encrypted at rest, AES-256**
- Execution logs & history
- User accounts

**Critical Artifact: N8N_ENCRYPTION_KEY**
- 64-character hexadecimal string
- Generated once during first setup; **NEVER changes**
- If lost or changed, **all stored credentials become unreadable**
- Must be backed up separately (password manager, hardware key, or secure note)
- Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e`

**Backup Strategy (Mandatory):**
1. Export `N8N_ENCRYPTION_KEY` to a secure location (password manager, separate file)
2. Daily `pg_dump` of PostgreSQL database (can run while n8n executes)
3. Store backups in S3 or separate VPS (geographic redundancy)
4. Test restore procedure quarterly (backup → new server → verify credentials decrypt)

**Disaster Recovery Scenarios:**
- **n8n crashes:** Restart container, PostgreSQL persists data → recovery in <5 minutes
- **VPS fails:** Restore PostgreSQL dump to new VPS, redeploy n8n container with same encryption key → recovery in 15-30 minutes
- **Encryption key lost:** Workflows recover (JSON), but credentials unrecoverable (manual re-entry required)

**Data Residency:** All data stays on your VPS. No cloud sync, no phone-home telemetry. You own the data completely.

### Vendor Lock-In Assessment: LOW

**Workflow Export:** n8n stores workflows as JSON files. You can export any workflow as JSON and import into another n8n instance or (with scripting) convert to another engine.

**Credential Portability Issue:** Credentials do NOT export by default (security measure). During migration, you must manually reconfigure credentials in the new instance. This is intentional design, not lock-in.

**Data Format:** JSON is human-readable and interoperable. Not n8n proprietary. Any team member can read/understand workflow logic.

**Migration Path (if ever needed):**
1. Export all workflows as JSON to GitHub
2. Export execution logs from PostgreSQL
3. Manually recreate credentials in new platform
4. Reimplement workflows (mostly copy-paste of node configs)

**Real Lock-In Risk:** The stickiness is **operational/training**, not technical. Your team learns n8n's node library and visual language. Switching means retraining. This is true for ANY automation platform.

**Community Alternatives:** n8n source is available; community forks exist (e.g., Activepieces). You're not betting on n8n the company staying viable - you own the code.

---

## Section 4: AI Agents & LangChain Integration

### AI Agent Node: Architecture & Capabilities

**Foundation:** n8n's AI Agent runs on LangChain (TypeScript version). It's not optional; it IS the engine.

**Reasoning Framework:** ReAct (Reasoning and Acting)
1. **Receive** - task/query input
2. **Recall** - retrieve relevant memory
3. **Reason** - LLM produces "Thought" step
4. **Act** - select and execute a tool
5. **Observe** - read result
6. **Repeat** - loop until sufficient info (max iterations = 10, default)
7. **Report & Remember** - return answer, store in memory

**Supported LLM Models (2026):**
- Anthropic: Claude 3.5 Sonnet, Claude 3 Opus
- OpenAI: GPT-4o, GPT-4 Turbo
- Google: Vertex AI Gemini
- Mistral: Large models
- Ollama: Local open-source models

**Tool Execution Modes:**
- Sub-workflows (n8n workflows as tools)
- HTTP Requests (any REST API)
- MCP Servers (Model Context Protocol, new 2026)
- Native connectors (500+ integrations: Slack, Airtable, Stripe, Farcaster via Neynar, etc.)

**Constraints:**
- Max iterations (default 10) prevents infinite loops
- Context window limits per model
- No built-in persistent memory across executions (requires external storage, e.g. Supabase or Bonfire)

### When n8n AI Agent Wins vs Custom Harness

| Dimension | n8n AI Agent | Custom Harness (ZOE) |
|-----------|-------------|---------------------|
| **Speed to market** | Days-to-weeks (visual builder) | Weeks-to-months (engineering) |
| **Non-technical ownership** | YES (business teams modify) | NO (engineers only) |
| **Integration library** | 500+ pre-built nodes | Build API clients yourself |
| **Flexibility** | Medium (node model) | HIGH (full code control) |
| **Stateful reasoning** | Single session only | Multi-turn with persistent memory |
| **Multi-agent coordination** | Agent chains (sequential) | Full control (hierarchical, network) |
| **Parallel execution** | Breaks with shared state | Full control with locking |
| **Observability** | Built-in logs + Langfuse | Custom logging/tracing required |
| **Cost (1000 runs/mo)** | $50-500/mo cloud; free self-hosted | $500-2000/mo (tokens + infra) |
| **Maintenance** | Low (n8n handles runtime) | HIGH (ops, monitoring, recovery) |

**Verdict:**
- **Use n8n AI Agent for:** Single-turn reasoning, business automation, fast prototyping
- **Use Custom Harness for:** Multi-turn stateful reasoning, parallel workers with shared state, fine-grained observability, 10K+ monthly executions

**ZAO's Fit:**
- ZOE (custom harness) is optimal for ZAO's multi-agent trading, concurrent worker coordination, and persistent memory (the DEALER/BANKER/VAULT agents). Do not replace with n8n.
- n8n AI Agent is great for single-task automation (classify ticket, generate summary, validate form), not for ZAO's orchestration layer.

---

## Section 5: ZAO's 8 High-Priority n8n Workflows

### Ranked Workflow Table

| Rank | Workflow | What It Replaces | Effort | Fit | Weekly Time Saved | Implementation Owner | Target Date |
|------|----------|-----------------|--------|-----|-------------------|---------------------|-------------|
| **1** | Farcaster Mention → Telegram Alert | Manual Farcaster monitoring | 2h | Perfect | 1h+ | Zaal | 2026-07-16 |
| **2** | Newsletter Publish → Auto Cross-Post | Manually copy-paste to X, FC, Discord, TG, LinkedIn, FB (30min per issue) | 4h | Perfect | 30min | Zaal | 2026-07-23 |
| **3** | GitHub PR Merged → Tracker + Announce | Manual tracker row creation, Discord ping | 3h | Excellent | 1h | Zaal | 2026-07-30 |
| **4** | Supabase Task Row → Multi-Channel Notify | Slack posted manually, TG ping manual | 1h | Perfect | 45min | Iman | 2026-07-16 |
| **5** | Scheduled Social Post Queue | Currently Zapier or no automation | 3h | Good | 2h | Zaal | 2026-08-06 |
| **6** | Cowork Tracker ↔ GitHub Sync (bidirectional) | Duplicate entry work (tracker + GitHub issues) | 2h | Excellent | 3h | Iman | 2026-08-13 |
| **7** | Weekly Digest Builder (tasks due, bounties open, PRs pending) | Manual recap assembly | 6h | Good | 2h+ | Zaal | 2026-08-20 |
| **8** | POIDH Bounty Validation Workflow | Manual form review + Telegram notify | 4h | Good | 1.5h | Zaal | 2026-08-27 |

**Total effort: 25 hours. Total weekly savings: 11+ hours (0.27 FTE equivalent).**

### Top 3 Detailed Specs

#### 1. Farcaster Mention → Telegram Alert (2 hours)

**Trigger:** Neynar webhook fires when @zaal or #zao mentioned on Farcaster

**Nodes:**
1. Webhook trigger (Neynar cast.created event)
2. Parse author, cast text, URL
3. If mention regex matches: route to:
   - Telegram node (post to @zaal private channel with link)
   - Discord node (post to #farcaster-mentions)
   - Supabase node (log to farcaster_mentions table)
4. Error handler (notify #ops if webhook fails)

**Expected output:**
```
[Telegram]
"New FC mention from @alice (5 followers):
'omg @zaal can you check...'
[link to cast]"

[Discord #farcaster-mentions]
Same message as Telegram
```

**Why this matters:** Real-time visibility into ZAO's organic reach. Currently, Zaal manually refreshes Farcaster or hears about mentions passively.

---

#### 2. Newsletter Publish → Auto Cross-Post (4 hours)

**Trigger:** Paragraph publishes new newsletter article (webhook + scheduled check)

**Nodes:**
1. Webhook trigger (Paragraph webhook) OR scheduled check (daily 9am)
2. Fetch latest article from Paragraph API (title, content, URL)
3. Generate platform-specific snippets:
   - X/Twitter (280 chars with thread template)
   - Farcaster (cast text + embed URL)
   - Discord (rich embed)
   - Telegram (text + link)
   - LinkedIn (professional tone)
   - Facebook (casual tone)
4. Post in parallel to all platforms (HTTP Request nodes for each)
5. Log cross-post to Supabase + Slack notification

**Expected output (parallel posts):**
```
[X] "New from The ZAO: [title]
Read →  [link]"

[Farcaster] "[title] just dropped 👇
[link]"

[Discord #announcements] Embed with title, excerpt, link

[Telegram @thezao] Same as Discord embed

[LinkedIn]  "Excited to announce... [professional version]"
```

**Why this matters:** Currently takes ~30 minutes per newsletter issue (copy-paste across 5 platforms). This eliminates that entirely. At 2-3 newsletters/week = 3+ hours saved/week.

---

#### 3. GitHub PR Merged → Tracker + Announce (3 hours)

**Trigger:** GitHub PR merge event (webhook)

**Nodes:**
1. GitHub webhook: pr.merged
2. Extract: title, author, #lines changed, labels (feat/fix/docs)
3. Query Cowork tracker for matching task (title pattern match)
4. If found: update tracker row status to "Done", add GitHub URL
5. If not found: create new tracker row (auto-capture)
6. Post to Discord #releases: "PR merged: [title] by @author"
7. Post to Telegram @ZAOdevz: "PR merged: [title]"
8. Optional: increment "velocity" metric in dashboard

**Expected output:**
```
[Cowork Tracker]
Task row status: "Done"
GitHub link: [PR URL]
Closed date: [today]

[Discord #releases]
"PR merged: fix: n8n webhook relay auth - @zaal
+47 lines, -8 lines
[linked]"

[Telegram @ZAOdevz]
"PR #1234 merged ✓"
```

**Why this matters:** Closes visibility gap. PRs get merged, but team doesn't know status changed in tracker until Zaal manually updates. Now it's real-time.

---

### Tier 2 Workflows (Medium Priority, Build in Phase 2)

| Workflow | Effort | Why Later |
|----------|--------|-----------|
| Inbound webhook processor (generic) | 2h | Needed only after Phase 1 scale |
| Voice-to-post augmentation (upload voice → transcribe → draft) | 6h | Depends on voice capture infra (ZOE voice node) |
| Airtable ↔ Supabase sync | 3h | Airtable not core ZAO surface (yet) |
| Alchemy on-chain event monitor | 4h | Lower ROI; event noise high |
| Cost ledger aggregation | 2h | Finance ops, can wait |

---

## Section 6: Integration with ZOE - Architectural Boundary

### Core Finding: Complement, Not Compete

**n8n is a glue layer.** ZOE is an orchestrator.

**ZOE owns:**
- Reasoning + planning (multi-step task decomposition)
- Memory management (Letta-style blocks for context)
- Worker dispatch (DEALER/BANKER/VAULT agents, custom bots)
- Cost routing + budget optimization

**n8n owns:**
- Webhook receivers (Neynar, Typeform, Alchemy, GitHub)
- Scheduled syncs (Airtable ↔ Supabase, daily digests)
- Cross-platform relay (Telegram, Discord, Farcaster, X)
- Simple conditional logic (if X then post to Y)

**Architectural Diagram:**

```
                 ZOE (concierge.ts)
                 ├─ Task reasoning + decomposition
                 ├─ Memory (Letta-style blocks)
                 ├─ Worker dispatch (DEALER/BANKER/VAULT)
                 └─ Cost routing + checks

                        ↓ (command API)

          n8n (self-hosted on VPS)
          ├─ Webhook receiver tier
          │  ├─ Neynar (cast mentions)
          │  ├─ Typeform (form submissions)
          │  ├─ Alchemy (on-chain events)
          │  └─ GitHub (PR merges)
          ├─ Scheduled task tier
          │  ├─ Daily digest builder
          │  ├─ Airtable sync
          │  └─ Cowork tracker reports
          └─ Cross-platform relay tier
             ├─ Telegram posts
             ├─ Discord embeds
             ├─ Farcaster casts
             └─ X/LinkedIn tweets

          Boundary: /api/internal/n8n-relay/[workflow-name]
          └─ n8n POSTs with Bearer token
          └─ Relay validates + executes with Supabase SERVICE_ROLE
```

### Security Model: n8n Relay Endpoint

**The Problem:** n8n should never hold `SUPABASE_SERVICE_ROLE_KEY` directly (violates principle of least privilege).

**The Solution:** Dedicated relay endpoint

```typescript
// /api/internal/n8n-relay/[workflow-name]/route.ts

export async function POST(req: NextRequest) {
  // 1. Validate n8n's Bearer token
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (token !== process.env.N8N_RELAY_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse workflow name + payload
  const workflowName = req.nextUrl.pathname.split('/').pop()
  const payload = await req.json()

  // 3. Route to handler (with SERVICE_ROLE access)
  switch (workflowName) {
    case 'farcaster-mention-alert':
      return await handleFarcasterMention(payload)
    case 'github-pr-merged':
      return await handleGitHubPRMerged(payload)
    // ... other workflows
  }
}

async function handleFarcasterMention(payload) {
  // Here we have access to Supabase SERVICE_ROLE
  // n8n never sees the key
  await supabase
    .from('farcaster_mentions')
    .insert({
      author: payload.author,
      cast_url: payload.url,
      created_at: new Date(),
    })
  return NextResponse.json({ ok: true })
}
```

**Why this works:**
- n8n only holds `N8N_RELAY_TOKEN` (a generic API key, easily rotatable)
- The relay endpoint holds `SUPABASE_SERVICE_ROLE_KEY` (kept on main VPS, not exposed)
- Supabase RLS is bypassed only on the relay endpoint (intentional, secure by design)
- Each workflow is isolated; secrets never leak between workflows

### Cost & Maintenance Ownership

| Model | Cost | Maintenance | Trade-off |
|-------|------|-------------|-----------|
| **Self-hosted n8n (recommended)** | $25-30/mo | DevOps (Iman/Zaal) | Full control, cheapest, no external dependency |
| **n8n Cloud (Pro)** | €60/mo (~$65) | None (managed) | Closed-source, vendor lock-in, cost grows with volume |
| **Zapier** | $155/mo base + per-task | None | Expensive at scale, less flexible |

**Recommendation:** Self-hosted. VPS is already warm; n8n footprint is modest (300-500 MB RAM, 1 CPU core).

### Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **VPS resource contention** | n8n + Supabase OOM crash | Monitor CPU/RAM; set n8n memory cap 512MB; consider separate PostgreSQL DB if at 80%+ |
| **Workflow lock-in** | Workflows stored in n8n, hard to version | Git-commit exported JSON workflows to `bot/workflows/n8n/`; treat as source-of-truth |
| **No direct LLM reasoning in n8n** | Complex tasks require rerouting to ZOE | n8n AI Agent handles single-step summarization; multi-step reasoning goes back to ZOE via API call |
| **Webhook replay attacks** | Malicious actor replays old webhook | Use HMAC validation (n8n native support); Neynar/GitHub signatures verified |
| **PostgreSQL backup complexity** | Data loss if backup strategy wrong | Automate `pg_dump` daily; store in S3; test restore quarterly |

---

## Section 7: Key Decisions Table

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **Adopt n8n?** | YES - for webhook glue + scheduled sync | Complements ZOE; fills event-plumbing gap; free self-hosted; high ROI (8+ workflows, 11+ hrs/week saved) |
| **Self-hosted or Cloud?** | SELF-HOSTED on 31.97.148.88 | Cost efficiency ($25-30/mo vs €60/mo); data control; no vendor lock-in; VPS has capacity |
| **License type?** | Sustainable Use (fair-code) | COMPLIANT for ZAO's internal use; no commercial resale restriction applies |
| **PostgreSQL location?** | Separate managed DB (e.g. Supabase) OR co-resident on VPS | Depends on VPS RAM headroom; recommend checking `free -h` first; if 80%+ in use, upgrade or use managed DB |
| **n8n role vs ZOE?** | Glue layer (webhook plumbing); ZOE owns reasoning | Don't replace ZOE; n8n for events, ZOE for intelligence |
| **AI Agent usage?** | Use n8n AI Agent for single-turn tasks only (classify, summarize); route complex reasoning back to ZOE | n8n AI is fast for light tasks; ZOE is better for stateful multi-turn |
| **Secrets management?** | Relay endpoint pattern (n8n never holds SERVICE_ROLE_KEY) | Principle of least privilege; relay validates + executes with full permissions |
| **First ship?** | 3 PoC workflows: Farcaster alert, newsletter cross-post, GitHub PR sync | Highest ROI (eliminate 30min manual work per newsletter) + fastest deployment (2-3 weeks) |
| **MCP usage?** | YES, long-term; expose n8n workflows as tools to Claude/ZOE via MCP | Enables hybrid harness; not immediate (requires MCP adoption in ZOE first) |

---

## Section 8: Next Actions

| Action | Owner | Type | By When | Success Criteria |
|--------|-------|------|---------|-----------------|
| Check VPS RAM utilization; decide PostgreSQL location | Zaal + Iman | DevOps | 2026-07-10 | `free -h` output shows <80% RAM; PostgreSQL decision made |
| Deploy n8n on VPS via docker-compose | Iman | Infra | 2026-07-12 | n8n admin UI reachable at https://n8n.thezao.xyz; database connected |
| Build + test Farcaster mention workflow (PoC) | Zaal | Feature | 2026-07-15 | Farcaster mention triggers Telegram message; logged to Supabase |
| Build + test newsletter cross-post workflow (PoC) | Zaal | Feature | 2026-07-19 | Manual newsletter → n8n post to X, FC, Discord, TG; 5 platforms all receive post |
| Ship Farcaster alert to production | Zaal | Ship | 2026-07-16 | Live on main VPS; monitoring dashboard enabled |
| Parallel run (manual + n8n) for next newsletter; gather feedback | Zaal | QA | 2026-07-23 | Manual + n8n posts both exist; content matches; no errors in logs |
| Build + test GitHub PR merged workflow (PoC) | Zaal | Feature | 2026-07-25 | GitHub PR merge triggers tracker update + Discord/Telegram posts |
| Ship newsletter cross-post to production (eliminate 30min manual) | Zaal | Ship | 2026-07-23 | Automatic cross-posting verified for 2 consecutive newsletters; manual posts stop |
| Write n8n runbook (troubleshooting, backup restore, workflow export) | Iman | Docs | 2026-07-31 | Runbook added to bot/docs/n8n-runbook.md; team can restore n8n from PostgreSQL backup |
| Review Phase 2 workflows (scheduled digest, tracker sync, POIDH validation) | Zaal | Planning | 2026-08-01 | Prioritized list + effort estimates for Tier 2 workflows |

---

## Section 9: Adoption Metrics & Community

### Adoption (2026)

| Metric | Value | Note |
|--------|-------|------|
| GitHub stars | 150k-196k | Massive growth trajectory |
| Active users | 230k+ | Across free and paid tiers |
| Enterprise users | 3k+ | With 15k+ companies globally tracked |
| Integrations | 1,000+ native; 5,800+ community nodes | Largest ecosystem |
| Fortune 500 penetration | 34% | Using n8n enterprise features |
| Series C valuation | $2.5B | Oct 2025; well-capitalized |
| Total funding | $254M+ | 5 rounds; latest May 2026 |

### Community Sentiment

**Bullish signals:**
- Self-hosting is a killer differentiator (Zapier/Make lack this)
- AI-first pivot (LangChain nodes, ReAct agents) is resonating
- Enterprise adoption accelerating (Vodafone saved £2.2M, StepStone reduced 2 weeks → 2 hours, Musixmatch freed 47 days of engineering)

**Bearish signals:**
- Prompt injection vulnerabilities common in workflows (external data not sanitized)
- Licensing ambiguity frustrates SaaS builders (fair-code restrictions unclear)
- Scaling ceiling: 50+ node workflows become fragile; "real code handles datasets better"
- Competitive pressure from AI coding agents (Claude, Cursor) eroding traditional moat

**Verdict:** n8n is thriving for internal automation (ZAO's use case). Not ideal for high-scale or commercial resale. No deprecation risk; Series C funded for 24-36 months.

---

## Section 10: Comparison: Why n8n Beats Zapier for ZAO

| Factor | n8n | Zapier |
|--------|-----|--------|
| **Cost for 8-10 internal workflows** | $25-30/mo (self-hosted) | $155/mo + per-action overages = $300+/mo |
| **Data residency** | Your VPS (GDPR-safe) | Zapier's cloud (dependent on Zapier compliance) |
| **Workflow portability** | JSON export; git-committable | Zapier proprietary; must re-build in new platform |
| **Code flexibility** | Full JS/Python nodes | Minimal code support |
| **Learning curve** | Moderate (visual + code) | Very easy (non-technical) |
| **Team transparency** | Workflows readable by any engineer | Black box to non-admins |
| **Customization** | Unlimited (own the code) | Limited to Zapier's node library |
| **Audit trail** | Git history + PostgreSQL logs | Zapier's logs (limited export) |
| **Team ownership** | Full control (own VPS) | Vendor-dependent (Zapier service changes) |

**Verdict for ZAO:** n8n wins decisively on cost ($270+/year savings), control, and transparency. Zapier is better only if non-technical teams need zero setup.

---

## Sources

### n8n Official Documentation

- [n8n Homepage & Pricing](https://n8n.io/) - [FULL]
- [n8n GitHub Repository](https://github.com/n8n-io/n8n) - [FULL] - verified 196k stars, v2.29.9 latest release, fair-code LICENSE
- [Sustainable Use License Documentation](https://github.com/n8n-io/n8n/blob/master/LICENSE.md) - [FULL]
- [Hosting & Deployment Docs](https://docs.n8n.io/hosting/) - [FULL]
- [Docker Installation Guide](https://docs.n8n.io/deploy/host-n8n/install-options/install-with-docker) - [FULL]
- [AI Agent Node Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent) - [FULL]
- [Anthropic Claude Integration](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic) - [FULL]
- [MCP Server Trigger (Model Context Protocol)](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger) - [FULL]

### Self-Hosting & Infrastructure

- [n8n Self-Hosting Requirements: What You Need in 2026](https://vps.us/blog/n8n-self-hosting/) - [FULL]
- [Self-Host n8n with Docker on a VPS](https://gravitywp.com/tutorial/self-host-n8n-with-docker-on-a-vps/) - [FULL]
- [n8n Backup Strategy & Disaster Recovery](https://massivegrid.com/blog/n8n-backup-disaster-recovery/) - [FULL]
- [System Requirements & Resource Analysis](https://latenode.com/blog/low-code-no-code-platforms/n8n-setup-workflows-self-hosting-templates/n8n-system-requirements-2025-complete-hardware-specs-real-world-resource-analysis) - [FULL]
- [SSL/TLS Configuration](https://docs.n8n.io/hosting/securing/set-up-ssl/) - [FULL]
- [Nginx Reverse Proxy Setup](https://www.virtua.cloud/learn/en/tutorials/secure-n8n-reverse-proxy-auth) - [FULL]

### Licensing & Legal

- [Is n8n Free for Commercial Use?](https://thinkpeak.ai/is-n8n-free-for-commercial-use/) - [FULL]
- [n8n Fair-Code vs Open-Source](https://digitalcube.ai/en/blog/n8n-licencias-fair-code-community-enterprise) - [FULL]

### Competitive Analysis

- [n8n vs Zapier vs Make 2026](https://www.digidop.com/blog/n8n-vs-make-vs-zapier) - [FULL]
- [Zapier's Positioning on n8n vs Make](https://zapier.com/blog/n8n-vs-make/) - [FULL]
- [Cybernews: n8n vs Zapier](https://cybernews.com/ai-tools/n8n-vs-zapier/) - [FULL]

### Community Adoption & Sentiment

- [n8n 150k GitHub Stars Announcement](https://community.n8n.io/t/150-000-stars-on-github/208779) - [FULL]
- [User Count Statistics & Growth](https://flowlyn.com/blog/n8n-user-count-statistics-growth) - [FULL]
- [n8n Series C Funding ($180M)](https://blog.n8n.io/series-c/) - [FULL]
- [HackerNews Discussion 2026](https://news.ycombinator.com/item?id=43879282) - [FULL]
- [n8n Case Studies](https://n8n.io/case-studies/) - [FULL]
- [Enterprise Use Cases 2026](https://trigidigital.com/blog/n8n-enterprise-use-cases-2026/) - [FULL]

### AI Agent & LangChain Integration

- [Building AI Agents with n8n 2026](https://automationatlas.io/guides/building-ai-agents-with-n8n-2026/) - [FULL]
- [n8n MCP Integration Guide](https://generect.com/blog/n8n-mcp/) - [FULL]
- [Practical AI Agent Examples](https://blog.n8n.io/ai-agents-examples/) - [FULL]
- [LangGraph vs n8n vs Custom State Machine](https://mrhaseeb.com/blog/langgraph-vs-n8n-vs-custom-state-machine) - [FULL]

### Vendor Stability & Risk

- [n8n Roadmap 2026](https://www.itechcloudsolution.com/blogs/the-ultimate-n8n-roadmap-for-2026/) - [FULL]
- [Is n8n Dead in 2026?](https://medium.com/augmented-startups/is-n8n-dead-in-2026-c6a6f531c15e) - [FULL]
- [n8n Pain Points & Limitations 2026](https://medium.com/@creativeaininja/n8n-is-no-longer-enough-the-automation-tools-and-skills-that-actually-matter-in-2026-2d290969ffc8) - [FULL]

---

## Also See

- [Doc 759](../759-zoe-orchestrator-locked/) - ZOE architecture; the orchestrator n8n complements
- [Doc 734](../734-hermes-framework/) - Hermes agent framework; predates ZOE consolidation
- [Doc 887](../887-rate-limit-diagnosis/) - GitHub REST vs GraphQL rate limits (relevant for PR merge workflow)
- [Doc 801-802](../801-mcp-tooling-audit/) - MCP integration strategy (long-term n8n bridge to Claude)

---

## Verdict: ZAO n8n Adoption Strategy

**GO AHEAD.** n8n fills a real, unowned gap (webhook plumbing + scheduled syncs). It's cheap ($25-30/mo), compliant (fair-code license is fine for internal use), portable (JSON workflows), and solves real bottlenecks (30min per newsletter, manual GitHub→tracker sync, Farcaster mention discovery).

**Risk is minimal:** Fail-safe architecture (n8n is optional overlay; if it breaks, team falls back to manual workflows). No vendor lock-in (workflows export as JSON). DevOps overhead is low (standard Docker/PostgreSQL, Iman can manage).

**Ship path:** Deploy n8n Week 1 → 3 PoC workflows (Farcaster alert, newsletter cross-post, GitHub PR sync) by end of Week 3 → Phase 2 (Tier 2 workflows) by end of August.

---

