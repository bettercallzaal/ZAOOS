# 237 - USV Agents, Tasklet, Malleable Software & The "Build Something You Want" Era

**Date:** 2026-04-01
**Category:** AI Agents / Infrastructure / Strategy
**Status:** Complete
**Relevance:** Direct — agent architecture patterns for ZOE on OpenClaw

---

## 1. USV Blog Post: "Meet the Agents at USV" (Spencer Yen, March 25 2026)

Spencer Yen, engineer at Union Square Ventures, published a detailed account of how USV built a fleet of named AI agents for their venture capital operations. The post uses Stewart Brand's *How Buildings Learn* as its framing metaphor.

### 1.1 The Agent Roster

| Agent | Role | Trigger | Key Behavior |
|-------|------|---------|--------------|
| **Arthur** | Deal analyst | Email, schedule | Monitors pipeline 24/7, maintains living deal memos, tracks passed-on companies, performs Friday "USV Taste" reflection |
| **Ellie** | Email monitor | Email (real-time) | Monitors investment-related email groups, logs deal flow, saves pitch decks automatically |
| **Sally** | Meeting scribe | Schedule (post-meeting) | Generates recap emails with companies, people, themes, follow-ups |
| **Connor** | Calendar/relationship tracker | Schedule | Monitors calendars, tracks relationship context, links meetings to deal flow |
| **Nancy** | News monitor | Schedule | Scans news for portfolio-relevant developments |
| **Leo** | Legal counsel | On-demand | Contract review and legal questions |
| **Felix** | Finance data | On-demand | Financial modeling and data queries |
| **Librarian** | Ideas to tweets | On-demand | Converts internal ideas into social media posts |
| **Guestly** | Operations | Schedule (5am daily) | Scans calendars and registers building guests |

Each agent has its own email address and is treated as a team member — with a name, job title, and access equivalent to a human employee.

### 1.2 The "Mentions" Data Model

The foundational data structure across all USV agents is the **mention** — a structured contextual snapshot created whenever a company or person appears in:
- Meeting transcripts (via Sally)
- Emails (via Ellie)
- Calendar invites (via Connor)
- Google Drive documents
- Historical tweets

Background agents continuously parse unstructured data to create these mentions. The mentions model enables:
- Automatic deal memo generation (Arthur aggregates all mentions for a company)
- Relationship tracking (how often has USV met with founder X?)
- Trend detection (which themes keep appearing across meetings?)
- Deal status tracking (Arthur monitors status changes in the deal log)

**ZAO Takeaway:** This is directly applicable. ZOE could maintain a "mentions" model tracking: members referenced in fractal meetings, governance proposals mentioning specific artists, chat conversations about specific songs/projects, and wallet activity tied to member profiles.

### 1.3 Arthur's Friday "USV Taste" Reflection

Every Friday, Arthur runs a reflection cycle:
1. Analyzes deal log status changes from the week
2. Reviews company mentions across all meetings
3. Refines his encoded understanding of "USV Taste" — the organizational preference patterns for investments
4. Updates his own skills/prompts based on team feedback received in email threads

This is the **skills paradigm** — agents with feedback loops that update their own behavior. Team members give Arthur feedback directly in email threads ("Arthur, you overweighted the market size here"), and he incorporates it.

**ZAO Takeaway:** ZOE should have a weekly reflection cycle too. Possible "ZAO Taste" dimensions: music curation quality (which submissions get the most Respect), governance patterns (what proposals pass vs fail), community engagement patterns (who shows up to fractals). ZOE could generate a weekly "community pulse" and refine its own understanding of what the community values.

### 1.4 Four Key Learnings from USV

**1. Start with one problem well.** USV began with just meeting recaps (Sally). The structured output from that first agent created the "mentions" data model that all subsequent agents built on. Don't try to build 8 agents at once.

**2. Treat agents like employees.** Give them names, job titles, email addresses, and equivalent access to human team members. Naming improved adoption dramatically — people interacted with "Arthur" far more than they would with "deal-analysis-bot."

**3. Agents live where teams communicate.** USV embedded Arthur directly in team email groups rather than building a separate dashboard. This exposed capabilities to the whole team and enabled natural feedback loops. The post cites Stripe's principle: "if it's good for humans, it's good for LLMs, too."

**4. "Build Something You Want" era.** The paradigm is shifting from YC's "Build something people want" (mass-market SaaS) to "Build something *you* want" (custom internal tools). As custom software becomes cheaper to build via AI, the incentive is solving your own specific problems.

### 1.5 The Building 20 / MIT Metaphor

MIT's Building 20 was a temporary WWII radar research building that lasted 55 years. It became the most productive building on campus because researchers could freely knock down walls, run cables through ceilings, and modify the space without permission. Nine Nobel laureates worked there. Bose Corporation, Chomskyan linguistics, and the hacker culture all emerged from it.

Yen argues AI agents create the same dynamic for software: "AI agents have made it possible for us to do the same thing with our software." Teams can now rapidly build, tear down, and rebuild internal tools the way researchers modified Building 20.

### 1.6 "Vibecoding Asbestos"

Yen ends with an open question: Building 20 also had asbestos. What are the hidden dangers in this rapid internal agent development era? He cites:
- **Mario Zechner** — concerns about vibe-coded software quality
- **Steve Yegge** — warnings about automation risks
- **Gurwinder** — broader automation skepticism

The metaphor: just as asbestos was invisible but harmful, rapidly building agents without proper guardrails could create hidden technical and organizational debt. Yen leaves this as a "future discussion topic" rather than resolving it.

**ZAO Takeaway:** Real concern. ZOE running on OpenClaw on a VPS has low guardrails by design. Specific risks: agents making governance decisions without proper verification, hallucinated member data propagating through the system, security vulnerabilities in auto-generated code. Mitigation: human-in-the-loop for all consequential actions, audit logging, weekly review of agent outputs.

---

## 2. Tasklet — The Platform Behind USV's Agents

### 2.1 What Tasklet Is

Tasklet is a **hosted SaaS platform** for building and running AI agents using plain English. It is NOT open source. Built by **Andrew Lee** (Firebase co-founder) and the **Shortwave** email client team.

- **Founded:** 2025
- **Launched:** October 2025
- **HQ:** San Francisco
- **Funding:** $9M from Union Square Ventures and Lightspeed Venture Partners
- **Primary model:** Anthropic Claude

### 2.2 Pricing

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | $0 | Basic usage, limited runs |
| Pro | $35/month | Higher limits, computer use capability |
| Enterprise | Custom | Security controls, logging, cost management (in development) |

### 2.3 Architecture

**Two-tier agent model:**
- **Persistent high-level agents** maintain instructions and configuration
- **Execution-level agents** are spawned per run to carry out tasks

Each agent gets:
- A virtual computer (Ubuntu VM in Google Cloud)
- Filesystem access
- SQL database for state tracking
- Memory management across runs

**Integration options:**
- Thousands of pre-built integrations (Gmail, Slack, Notion, Asana, HubSpot, Linear)
- Direct HTTP API connections (any documented API)
- Custom MCP server support
- Browser automation via Anthropic's computer use capability

**Trigger types:**
- Scheduled (daily, weekly, custom cron)
- Email (on receipt or label application)
- Webhook (external service events)

### 2.4 Tasklet vs OpenClaw (ZAO's Current Agent Platform)

| Dimension | Tasklet | OpenClaw |
|-----------|---------|----------|
| **Type** | Hosted SaaS | Self-hosted (VPS) |
| **Cost** | $35/month Pro | VPS cost (~$10-20/month) + LLM API costs |
| **Open source** | No | Yes |
| **Customization** | Limited to platform capabilities | Full control over agent code |
| **MCP support** | Yes (built-in) | Yes (via configuration) |
| **Computer use** | Yes (Anthropic computer use) | Not built-in |
| **Triggers** | Email, schedule, webhook | Configurable |
| **Data ownership** | Tasklet's cloud | Your VPS |
| **Complexity** | Low (no-code) | High (requires setup/maintenance) |
| **Team** | Firebase co-founder + Shortwave team | Community-maintained |

**Assessment:** Tasklet is the easier path for non-technical teams. OpenClaw is the right choice for ZAO because: (1) data sovereignty matters for a crypto-native community, (2) full customization is needed for Farcaster/XMTP/blockchain integrations, (3) cost is lower at scale, (4) ZAO already has it running. However, Tasklet's trigger model (especially email triggers) and two-tier agent architecture are patterns worth borrowing.

### 2.5 Tasklet vs Competitors

| Platform | Approach | Best For |
|----------|----------|----------|
| **Tasklet** | Fully agentic, plain English | Non-technical recurring automation |
| **Zapier** | Explicit workflow builder (10+ years) | Deterministic, auditable workflows |
| **n8n** | Open-source, self-hosted | Technical teams wanting control |
| **Make** | Visual data routing | Complex data transformations |
| **Lindy** | Personal AI assistant | Individual productivity |

---

## 3. Stripe's Minions — Internal Coding Agents at Scale

### 3.1 Scale

- **1,300+ PRs merged per week** — zero human-written code, all human-reviewed
- Fully unattended: engineer sends Slack message, walks away, comes back to finished PR
- Evolved from an internal fork of **Block's Goose** (one of the first widely-used coding agents)

### 3.2 Blueprint Architecture

Stripe's core innovation is the **blueprint** — a template that wires together two types of nodes:

**Deterministic nodes** (hardcoded):
- Git operations (branching, pushing)
- Linting (runs in <5 seconds)
- Test selection
- Autofix application

**Agentic nodes** (LLM-powered):
- Feature implementation
- CI failure diagnosis and fixing
- Code review response

The principle: "each deterministic node is one less thing that can go wrong." Safety-critical operations never touch the LLM.

### 3.3 Toolshed MCP Server

Stripe built **Toolshed** — a centralized internal MCP server hosting **nearly 500 tools**:
- Internal documentation
- Ticket details
- Build statuses
- Sourcegraph code search
- Feature flag management

Critical insight: **"More tools aren't better."** Agents get a curated subset relevant to their specific task, not access to all 500 tools at once.

### 3.4 Devbox Infrastructure

- Pre-warmed cloud machines that spin up in **10 seconds**
- Identical to human engineer environments
- **Isolated from production and the internet** (security)
- Enable massive parallelism

### 3.5 Quality Controls

- Local linting: <5 seconds per push
- Selective CI from **3+ million tests**
- Autofixes for known failure patterns
- **Hard limit: 2 CI rounds maximum** — if code fails after second push, it returns to humans
- All PRs require human review before merge

### 3.6 Why Stripe Built Custom (Not Off-the-Shelf)

- Hundreds of millions of lines of code
- Uncommon stack (Ruby + Sorbet typing)
- Homegrown libraries unfamiliar to LLMs
- Processes $1T+ annually — high stakes
- Complex regulatory requirements
- Needed deep institutional knowledge embedded in tooling

**ZAO Takeaway:** The "curated tool subset per task" pattern from Toolshed is directly relevant. ZOE's MCP configuration should expose different tool sets for different tasks — governance tools for proposal analysis, music tools for curation, member tools for community queries — rather than dumping everything into one context. The 2-CI-round limit is also smart: set a maximum retry count for any ZOE task, then escalate to human.

---

## 4. Malleable Software (Ink & Switch)

### 4.1 Core Thesis

The essay argues computing has betrayed its original promise. Software should be "a new kind of clay — a malleable material that users could reshape at will." Instead, we have locked-down applications built by distant developers, where users "submit feedback and hope for the best."

### 4.2 The Problem

Every layer of modern computing assumes users are passive recipients:
- Settings only expose options developers anticipated
- Plugins are "limited to authorized ways" of extending apps
- Open source code requires "significant expertise" to modify
- AI code generation alone doesn't address composition or tweakability

Key example: doctors forced to fill irrelevant fields in EHR systems. "The pointlessness of it" caused burnout — not the time investment itself.

### 4.3 Three Design Patterns

**Pattern 1: A Gentle Slope from User to Creator**
- Avoid "cliffs" where users suddenly need programming skills
- Model: spreadsheets (view cells -> edit formulas -> write macros)
- Model: HyperCard (5 explicit levels from read-only to full programming)
- "Not everyone needs to reach the top of the slope" — communities need "local developers" who guide others

**Pattern 2: Tools, Not Applications**
- Current apps are like avocado slicers — do one thing, nothing else
- Solution: shared data repositories that multiple tools can operate on
- Kitchen analogy: knives are general tools, avocado slicers are applications
- Compound document systems (OpenDoc, OLE) embed multiple editors in one workspace

**Pattern 3: Communal Creation**
- "We use computers together" — customizations need to be shareable
- Clay Shirky's "situated software" — built for specific communities
- Robin Sloan's "home-cooked meal" — intimate, family-focused tools
- **"Building software for local contexts is sometimes easier than building for worldwide use"** (this is the quote USV cites)

### 4.4 AI's Role

The essay argues AI coding is necessary but insufficient: "Bringing AI coding tools into today's software ecosystem is like bringing a talented sous chef to a food court." Without underlying infrastructure for composition and editing, AI potential is wasted.

AI works best as a **complement to malleable infrastructure** — not a replacement for it. In their Patchwork prototype, AI rapidly built tools mid-workflow that automatically gained persistence and collaboration through the underlying system.

### 4.5 Key Quotes

- "Tools that users can reshape with minimal friction to suit their unique needs. Modification becomes routine, not exceptional."
- "Age plus adaptivity is what makes a building come to be loved." (Stewart Brand)
- "Before, new ideas took minutes to try; now they could take hours of wrangling configurations, if they were possible at all. Computerizing work led to a loss of agency."
- "AI code generation alone does not address all the barriers to malleability."

**ZAO Takeaway:** ZAO OS is already living this thesis. It's situated software built for a specific community (The ZAO), not mass-market. The "gentle slope" pattern maps to ZAO's progressive auth (wallet -> Farcaster -> XMTP). The "communal creation" pattern maps to governance proposals that become features. The risk is that ZAO's codebase becomes unmalleable as it grows — keep the "local developer" role alive by documenting everything and keeping community.config.ts as the single fork point.

---

## 5. The "Build Something You Want" Era

### 5.1 The Paradigm Shift

| Era | Motto | Economics | Example |
|-----|-------|-----------|---------|
| **SaaS era** (2005-2023) | "Build something people want" (YC) | High dev costs, need mass market to justify investment | Salesforce, Slack, Notion |
| **Agent era** (2024+) | "Build something YOU want" | Low dev costs via AI, custom tools are economically viable for teams of 1-10 | USV's agents, ZAO OS |

### 5.2 What Changed

- Cost of building custom software dropped 10-100x via AI coding tools
- LLMs can serve as the "backend brain" for any workflow
- MCP provides a universal integration layer
- Platforms like Tasklet, Claude Code, Cursor make building accessible to non-engineers

### 5.3 Who Benefits

From USV's post, non-engineering teams now build their own agents:
- **Sales:** Branded demo generators
- **Growth:** Custom dashboards
- **Marketing:** Cohort analysis tools
- **Finance:** Instant financial models
- **Legal:** Contract review systems
- **Ops:** Data automation workflows

### 5.4 The Enterprise Landscape (2026)

- Global agentic AI market surpassed $9B in 2026
- Gartner projects 40% of enterprise apps will embed task-specific agents by year-end
- Enterprise AI agent deployments returning average 171% ROI
- US enterprises seeing 192% ROI — 3x traditional automation

---

## 6. Comparison: USV's Agent Patterns vs ZAO's ZOE

### 6.1 Agent Naming / Anthropomorphization

| Dimension | USV | ZAO |
|-----------|-----|-----|
| **Agent names** | Arthur, Ellie, Sally, Connor, Nancy, Leo, Felix, Librarian, Guestly | ZOE (ZAO Operating Entity) |
| **Naming strategy** | One agent per function, human names | Single agent, acronym name |
| **Why it works** | "Naming improved adoption" — people interact more naturally | Single identity for community coherence |
| **Email/chat presence** | Each agent has own email, sits in team threads | Could have Farcaster account, sit in channels |

**Recommendation:** Consider giving ZOE sub-personas for different functions (ZOE the Curator, ZOE the Scribe, ZOE the Analyst) while keeping a unified identity. This gets the adoption benefits of named roles without the complexity of 8 separate agents.

### 6.2 The "Mentions" Data Model for ZAO

USV's mentions model adapted for ZAO:

| USV Mention Source | ZAO Equivalent |
|-------------------|----------------|
| Meeting transcripts | Fractal meeting notes, Spaces recordings |
| Emails | Farcaster casts, XMTP messages |
| Calendar invites | Event attendance, fractal participation |
| Google Drive docs | Governance proposals, research docs |
| Historical tweets | Farcaster cast history, cross-posts |

**Implementation sketch:**
```
mentions table:
  id, entity_type (member|project|song|proposal),
  entity_id, source_type (cast|message|fractal|proposal|space),
  source_id, context_text, sentiment, timestamp,
  extracted_by (zoe|manual)
```

This would let ZOE answer: "What has the community said about [artist] in the last month?" or "Which proposals reference [project]?" or "How many times was [song] mentioned in Spaces?"

### 6.3 Skills Paradigm Comparison

| USV (Arthur) | ZAO (ZOE) |
|--------------|-----------|
| Friday "USV Taste" reflection | Could do weekly "Community Pulse" reflection |
| Team feedback via email threads | Community feedback via Farcaster replies or governance |
| Encoded investment preference patterns | Encoded community value patterns (what music gets Respect, what proposals pass) |
| Self-updating deal analysis prompts | Self-updating curation and moderation prompts |

---

## 7. Actionable Takeaways for ZAO

### Immediate (This Sprint)

1. **Implement "mentions" table in Supabase** — start tracking entity references across casts, messages, proposals, and fractal notes
2. **Give ZOE a Farcaster account** — following USV's "agents live where teams communicate" principle
3. **Set max retry limits** — borrowing Stripe's "2 CI rounds" pattern, cap ZOE task retries at 3 then escalate to human

### Near-Term (Next 2-4 Weeks)

4. **Weekly ZOE reflection cycle** — every Monday before the fractal, ZOE analyzes: what was discussed last week, which proposals are trending, what music got the most Respect, community sentiment shifts
5. **Curated MCP tool subsets** — don't give ZOE all tools for every task. Create task-specific tool profiles (governance, curation, member-support, research)
6. **Sub-persona experiment** — try "ZOE the Curator" for music recommendations vs "ZOE the Scribe" for meeting notes, see if adoption differs

### Strategic (1-3 Months)

7. **Email/notification triggers** — adapt Tasklet's trigger model. ZOE should activate on: new governance proposals, fractal meeting completion, music submission thresholds, member onboarding events
8. **Feedback loop system** — let community members give ZOE feedback in Farcaster threads ("ZOE, that recommendation was off") and have ZOE incorporate it in weekly reflection
9. **Audit logging** — the "vibecoding asbestos" concern is real. Log every ZOE action, decision, and data modification for weekly human review

---

## 8. Sources

- [Meet the Agents at USV: Arthur, Ellie, Sally, and Friends](https://blog.usv.com/meet-the-agents) — Spencer Yen, USV Blog, March 25, 2026
- [Malleable Software](https://www.inkandswitch.com/malleable-software/) — Ink & Switch research hub
- [Malleable Software Essay](https://www.inkandswitch.com/essay/malleable-software/) — Full essay by Ink & Switch
- [Minions: Stripe's one-shot, end-to-end coding agents](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents) — Stripe Dev Blog
- [How Stripe's Minions Ship 1,300 PRs a Week](https://blog.bytebytego.com/p/how-stripes-minions-ship-1300-prs) — ByteByteGo
- [Introducing Tasklet: Automate your business with AI Agents](https://www.shortwave.com/blog/introducing-tasklet-ai-automation/) — Shortwave Blog
- [Tasklet | Ry Walker Research](https://rywalker.com/research/tasklet) — Independent analysis
- [Tasklet is IFTTT for the Agentic Age](https://thenewstack.io/tasklet-is-ifttt-for-the-agentic-age/) — The New Stack
- [Tasklet Pricing](https://tasklet.ai/pricing) — Tasklet.ai
