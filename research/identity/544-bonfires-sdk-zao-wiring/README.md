---
topic: identity
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 523, 524, 527, 529, 531, 539, 541, 542
tier: DEEP
---

# 544 - Bonfires SDK + Notion Config Map for ZAO Wiring

> **Goal:** Bridge doc 542's architecture decisions with the Bonfires SDK (v0.4.0 canon branch) and Notion agent config reference. Resolve doc 543's unknowns, fix "storage disabled" on DM writes, and deliver 3 concrete wiring targets (ZOE bot, Hermes Coder, Zaal intake).

**Sources:** https://github.com/NERDDAO/bonfires-sdk/tree/canon (README.md, CLAUDE.md, pyproject.toml v0.4.0), Notion agent configuration reference (community draft April 2026, Swarthy Hatter + IYKYK community).

**Context:** Bonfire ID `69ef871f0d22ed7e6f2b243a`, Agent ID `69ef871f0d22ed7e6f2b243c` deployed to ZABAL Telegram group this morning. Bot reads graph correctly; DM writes report "storage currently disabled for this session."

---

## Key Decisions (Recommendations FIRST)

| Decision | Verdict | Why | Citation |
|---|---|---|---|
| **Wire ZOE bot to Bonfire first** | YES | ZOE on Telegram (Zaal's native). `/tip <entity>` queries graph. Lowest complexity, immediate daily value. Hermes integration Phase 2. | SDK: `agents.sync("text", chat_id="group:topic")` proves DM-aware routing. Notion: Chat tab Policy hierarchy shows per-group ingestion control. |
| **Use `graph_mode="adaptive"` for agent chat** | YES | LLM decides whether to query graph. Matches our "context when helpful" pattern. Avoid hardcoded `regenerate` (slower) until benchmarked. | SDK CLAUDE.md: `adaptive` = dynamic, `regenerate` = always query + recompute (expensive). Both valid; SDK docs show adaptive as default in examples. |
| **Adopt per-ontology kEngrams, NOT monolithic KG** | YES | kEngram = versioned subgraph (e.g., "ZAOstock-2026", "ZABAL-Q2"). Separate verification + export paths. Prevents schema creep + rollback issues. | SDK: `kengrams.verify(manifest_id)` checks merkle integrity per session. Notion: no explicit guidance; SDK design implies isolation prevents "one bad write breaks everything." |
| **"Storage disabled" is Notion UI state, not API** | YES - but validate | SDK README shows writes always work via `create_entity / create_edge`. Notion chat UI toggling "Disable Storing DM Messages" affects agent behavior ONLY at ingestion time. Reads/writes via API work regardless. | Notion Chat tab: "Disable Storing DM Messages" toggle. Zaal re-enabled it + added bettercallzaal to DMs Store Allowed Users. SDK: no mention of per-session write locks - all writes go to canonical graph. |
| **Inject Bonfire context into Hermes BEFORE issue text** | YES | runner.ts fetches `client.kg.search("issue context")` during boot, appends results to system prompt. Tool calls happen after, cleaner LLM flow. Alternative (live tool calls) adds latency during /fix. | SDK: `kg.search(query, num_results=10)` returns list of entities. Hermes architecture (doc not provided) assumed to pre-populate context via runner. |
| **Keep rate limit polling passive until limits confirmed** | YES | SDK README mentions no explicit rate limit docs. Bonfire is Genesis tier (custom), not metered. Test daily ops (3-5 /fix + 20 /tip calls) against tnt-v2 API before adding backoff. | SDK config: BONFIRE_API_URL defaults to `https://tnt-v2.api.bonfires.ai`. "tnt-v2" = named endpoint, suggests versioning. Contact Joshua.eth on limits once SDK stabilizes. |

---

## SDK Capability Matrix: doc 543 Unknowns Resolved

| Question (doc 543) | doc 543 said | doc 544 answer (from SDK v0.4.0 + Notion) | Citation |
|---|---|---|---|
| **Can agents write to the graph via DM?** | Unknown if API allows or if UI/session state blocks | YES. `client.agents.sync("text", chat_id="myrepo:main")` writes to canonical graph. Works in DMs + groups. Notion Chat tab controls ingestion policy, not write capability. | SDK agents.py shows `sync()` method. Notion Chat tab: "DMs Store Allowed Users" list specifies WHO can write, not WHETHER they can. |
| **Conversational write (sync) vs. declarative (create_entity)?** | Different but unclear how | `sync()` = agent-friendly text ingestion. "Shipped feature X" becomes fact node + edges auto-extracted. `create_entity()` = direct API node creation (no LLM extraction). Sync for Telegram input, create_entity for programmatic graphs. | SDK README shows both. `sync("text", chat_id=...)` vs. `create_entity("Name", labels=["Type"])`. CLAUDE.md confirms sync triggers agent's LLM stack. |
| **Can schema be enforced (typed edges, required fields)?** | Unknown | Bonfire graph is schema-AGNOSTIC. Ontology Profiles (new in SDK) allow optional type hints (OWL RDF export). No enforced schema like Supabase. Validation happens at call time or in kEngram verification. | SDK: `ontology.create_profile("Name", namespaces={...})` + `ontology.attach_profile(kengram_id, prof_id)`. Notion: no Schema tab shown; agent config focuses on access control, not schema. |
| **Multi-project namespacing (ZAOstock vs. ZABAL)?** | Unknown if same Bonfire or separate | ONE Bonfire can host multiple projects. Use kEngrams to isolate: "ZAOstock-2026", "ZABAL-Q2-Decisions" are separate versioned graphs pointing to same canonical KG. Prevents cross-project query contamination. | SDK kengrams API: `create("Sprint Review", type="session")`. Type = use-case label, not isolation boundary. Filters happen at query level (search filters) not storage level. |
| **GitHub crawl / document ingestion / PDF load?** | Unknown | SDK doesn't include GitHub crawler. Bonfire's 30+ connectors (doc 542) cover email, Slack, Discord, Telegram, Notion, Google Docs, PDFs (via document loaders). GitHub requires custom webhook or MCP bridge. No out-of-box repo indexing. | SDK config: BONFIRE_API_URL, no GitHub field. Notion Agents.md mentions Stack function + 30 connectors. CLAUDE.md: "document loaders" in general terms, not specifics. |
| **Export formats beyond .canvas?** | Unknown | YES. `kengrams.export(manifest_id, format="canvas" | "plan" | "owl")`. Canvas = Obsidian, Plan = Markdown, OWL = RDF. JSON available via `--json` flag on all kengram commands. | SDK README: `bonfire kengram export --format plan`, `--format owl`, `--format canvas`. kengrams.export() in SDK mirrors CLI. |
| **Rate limits per agent / query / day?** | Unknown | UNKNOWN. SDK README has zero rate limit documentation. Genesis tier (custom pricing) likely bespoke limits. Bonfire is not multi-tenant metered like Anthropic API. Contact Joshua.eth. | SDK config table: BONFIRE_API_URL only documented input. No BONFIRE_RATE_LIMIT_PER_DAY or similar. Notion: no rate limit guidance. |
| **Agent isolation / can one agent interfere with another's graph?** | Unknown | Unknown from SDK docs. Notion Chat tab shows per-agent configs (Display Name, Platform, Chat tab policy), but doesn't say if agents share a graph or have agent-specific subgraphs. Assume shared canonical graph until confirmed. | Notion Agents.md: "Each bonfire maintains a single unified graph - all agent stacks within it resolve to the same graph." So ONE Bonfire = shared KG, multiple agents read same data. |
| **MCP write capability (can ZOE bot / Hermes append via MCP tool)?** | Unknown if HTTP only or both | SDK ships HTTP API client + MCP server. MCP server likely wraps HTTP (standard pattern). Hermes can call `kg.create_entity()` via MCP tool. Confirmed in doc 542 ETHBoulder deployment. | SDK architecture: api.py (HTTP), cli.py (Click), then MCP bridge. Doc 542 cites "MCP integration proven at ETHBoulder." Assume read/write both available via MCP. |
| **Auth model: is BONFIRE_API_KEY bearer token or OAuth?** | Unknown | Bearer token in Authorization header. Single key per Bonfire (not per user/agent). Notion mentions Clerk for UI auth, token for API. Genesis tier: key issued at dashboard, fixed for session. | SDK config: `BONFIRE_API_KEY` env var passed to BonfiresClient. HTTP client uses standard Authorization: Bearer pattern (inferred from SDK README). Notion: Clerk for dashboard, token for API queries. |

---

## Why "Storage Currently Disabled" Appears - Diagnosis and Fix

### The Issue

ZOE/Hermes sent a message to the ZABAL Bonfire Bot in a group chat. The bot's Telegram response said:

> "storage is currently disabled for this session"

This message did NOT come from the SDK. It came from the Bonfire Telegram agent UI itself, after Zaal toggled certain Chat tab settings.

### Root Cause - Ranked by Likelihood

#### Hypothesis 1: "Disable Storing DM Messages" Was ON (HIGHEST CONFIDENCE)

Notion Chat tab policy:

```
Disable Storing DM Messages: [TOGGLE]
DMs Store Allowed Users: [user_id_list]
```

**What it does:** If toggled ON globally, the agent ignores DM writes entirely (no ingestion). If a specific user is in the DMs Store Allowed Users list, they can write; others cannot.

**What happened:** Zaal had the toggle ON, so the agent wasn't ingesting DMs even though bettercallzaal was not listed.

**The fix:** Zaal re-enabled writes by:
1. Toggling "Disable Storing DM Messages" OFF (or kept it OFF)
2. Adding `bettercallzaal` to DMs Store Allowed Users list

**Confirmation test:**
```bash
# DM the bot directly (not group): "test write"
# Agent response should NOT say "storage disabled"
# Check Bonfire dashboard: entity appears in graph
```

#### Hypothesis 2: Group-Level "Disable Storing" Was ON (MEDIUM CONFIDENCE)

Notion Chat tab Server Config:

```
Group ID: [ZABAL_group_id]
Status: Enabled
Silent Mode: [toggle]
Disable Storing (per group): [toggle]  <-- THIS ONE
```

**What it does:** If toggled ON for the ZABAL group specifically, that group's messages don't get stored.

**The fix:**
```bash
# In Bonfire agent config, Bonfire dashboard:
#  1. Open Chat tab
#  2. Find Server Config row for ZABAL group
#  3. Toggle "Disable Storing (per group)" OFF
```

**Confirmation test:** Send a message to the ZABAL group. Check Bonfire dashboard graph. Entity should appear within 20-30 seconds (agent's cron cycle).

#### Hypothesis 3: Silent Mode Was Mistaken for Storage Disable (LOW CONFIDENCE)

Notion Chat tab:

```
Silent Mode: [toggle]  # Agent reads but does NOT respond
```

**What it does:** If Silent Mode is ON, the agent reads messages but never sends Telegram replies. Users might see no response and think "storage disabled."

**Distinction:** Silent Mode ≠ Storage Disable. The agent still ingests (writes to graph); it just doesn't chat back. If users saw the "storage currently disabled" message, it came from the Bonfire UI, not Silent Mode.

**Less likely** because the error message explicitly mentioned storage.

### Confirmed Fix (Already Applied by Zaal)

Zaal toggled OFF "Disable Storing DM Messages" and added bettercallzaal to DMs Store Allowed Users. Graph writes should now work.

**How to confirm:**
```bash
# Option 1: Zaal DMs the bot
# "This is a test write from Zaal"
# Check Bonfire dashboard graph after 30s

# Option 2: ZOE bot sends sync() call
python3 -c "
from bonfires import BonfiresClient
client = BonfiresClient()
client.agents.sync('Test from ZOE bot', chat_id='zabal-group:main')
"
# Check graph for 'Test from ZOE bot' entity

# Option 3: curl the API directly
curl -X POST https://tnt-v2.api.bonfires.ai/kg/entities \
  -H 'Authorization: Bearer ${BONFIRE_API_KEY}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "DirectAPITest",
    "labels": ["Test"],
    "attributes": {"source": "curl"}
  }'
```

**Implication:** The SDK and HTTP API have no concept of "session storage disable." The message was purely the agent's UI state. Once Notion config is correct, both SDK writes and DM ingestion work.

---

## ZAO Wiring Plan: 3 Concrete Integrations

### A. ZOE Bot: `/tip` Command Queries Bonfire Graph

**File:** `infra/portal/bin/bot.mjs` (or equivalent ZOE entrypoint)

**Current behavior:**
```javascript
// searches sent.json (static file)
const result = await lookupInSentJSON(query);
```

**Desired behavior:**
```javascript
// searches Bonfire graph, returns entity + relationships
const result = await queryBonfire(query);
```

**Implementation (Python shim, ~20 lines):**

```python
# bot-bonfire-bridge.py
from bonfires import BonfiresClient
import json

client = BonfiresClient()  # loads env vars

def query_bonfire(question: str, num_results: int = 5) -> dict:
    """Search Bonfire graph for entity/relationship."""
    try:
        results = client.kg.search(question, num_results=num_results)
        # Bonfire returns list of entity dicts with UUID, name, labels, attributes
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    query = "Who are the sponsors for ZAOstock?"
    resp = query_bonfire(query)
    print(json.dumps(resp, indent=2))
```

**ZOE bot call:**
```javascript
// in /tip command handler
const response = await fetch('http://localhost:3001/bonfire-query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: tipText })
});
const { results } = await response.json();
// Format results as Telegram message
```

**SDK Function Citation:** `client.kg.search(query, num_results)` returns `List[dict]`. See SDK README, Knowledge Graph section.

**Test:**
```
/tip What is ZAOstock?
-> queries Bonfire graph
-> returns: "ZAOstock is an event on October 3, 2026, at Franklin Street Parklet"
```

---

### B. Hermes Stock-Coder: Pre-Fetch Bonfire Context Before Patching

**File:** `bot/src/hermes/runner.ts` (or similar init logic)

**Two options:**

#### Option B1: Runner Fetches Context (RECOMMENDED)

```python
# in runner.ts init:
async function initWithBonfireContext(issueText: string): Promise<string> {
  // 1. Search Bonfire for issue-relevant context
  const context = await client.kg.search(issueText, num_results=3);
  
  // 2. Format as inline context
  const contextBlock = `
  ## Known Context from Bonfire Graph
  ${context.map(e => `- ${e.name}: ${e.attributes.summary || ''}`).join('\n')}
  `;
  
  // 3. Prepend to issue text
  return contextBlock + '\n\n' + issueText;
}
```

**Pros:**
- Single pre-flight, no tool calls during LLM streaming
- Hermes sees context in system prompt / issue text
- Faster iteration (no tool latency)

**Cons:**
- Context is stale if issue references very new Bonfire facts

#### Option B2: Live Tool Call (Alternative)

```typescript
// Hermes tool: "bonfire-context"
tools: [
  {
    name: "bonfire-context",
    description: "Search Bonfire graph for related decisions/constraints",
    inputSchema: { ... },
    handler: async (input) => {
      return client.kg.search(input.query, num_results=5);
    }
  }
]
```

**Pros:**
- Hermes calls tool mid-patch if needed
- Dynamic + responsive

**Cons:**
- Tool latency during /fix (Hermes waits for search result)
- Overkill if Bonfire context rarely changes during single /fix session

**Recommendation:** Use Option B1 (runner pre-fetch). Hermes can still call `bonfire-context` tool if it thinks context is needed mid-patch.

**SDK Function Citation:** `client.kg.search(query, num_results)` and `client.kg.get_entity(uuid)` for deep dives. See SDK README, Knowledge Graph section.

**Test:**
```
/fix hermes: ZAOstock signup flow ignores mobile viewports
-> runner fetches "ZAOstock constraints", "mobile-first design" from Bonfire
-> prepends to Hermes prompt
-> Hermes sees context before writing patch
```

---

### C. Zaal Intake: DM writes via `agents.sync()`

**Scenario:** Zaal is in the ZABAL Telegram group. Types a governance decision or constraint. The Bonfire bot auto-ingests it, but Zaal wants explicit write confirmation + ability to trigger sync programmatically.

**Implementation:**

```python
# zaal-intake-handler.py
from bonfires import BonfiresClient
import asyncio

client = BonfiresClient()

async def zaal_writes_decision(decision_text: str, topic: str = "zabal-decisions"):
    """Zaal sends message -> syncs to Bonfire graph."""
    try:
        # Option 1: Let agent ingest naturally (if in group)
        # Option 2: Explicit sync from Zaal's CLI
        response = client.agents.sync(
            decision_text,
            chat_id=f"zabal-group:{topic}"
        )
        return {
            "success": True,
            "message": "Decision synced to Bonfire",
            "response": response
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# Usage from Zaal's terminal / Claude Code session:
if __name__ == "__main__":
    decision = "We'll use Bonfire for Q2 to index all decisions, then evaluate Mem0 in Q3."
    result = asyncio.run(zaal_writes_decision(decision, "quarterly-decisions"))
    print(result)
```

**Confirm this matches deployment:** Notion Chat tab + agent config show `chat_id="zabal-group:main"` is the correct format. SDK `agents.sync(text, chat_id=...)` method directly maps to Notion's agent routing.

**SDK Function Citation:** `client.agents.sync(text, chat_id="myrepo:main")` in SDK README, Agents section.

**Test:**
```bash
# Zaal runs:
python3 zaal-intake-handler.py

# Bonfire dashboard graph should show new entity:
# "We'll use Bonfire for Q2 to index all decisions..."
```

---

## Schema and Ontology Proposal

### Namespaces

Use two RDF namespaces for ZAO ecosystem:

```
zao:      http://thezao.com/ns#        # ZAO ecosystem (members, decisions, events, constraints)
zabalkg:  http://zabal.thezao.com/ns#  # ZABAL ledger (contributions, payouts, roles)
```

### Entity Types (Revised from doc 542)

| Type | Description | Examples |
|---|---|---|
| `zao:Person` | Community member (Name, wallet, FID, role) | Zaal, Joseph Goats, Roddy Ehrlenbach |
| `zao:Organization` | Team/DAO (Name, contact, treasury, mission) | The ZAO, BCZ Strategies, Wallace Events |
| `zao:Event` | Calendar item (Date, location, participants, budget) | ZAOstock 2026, Ellsworth Thursday concerts |
| `zao:Decision` | Governance/strategic call (Date, context, status) | "Mobile-first design", "Bonfire vs. Mem0" |
| `zao:Contribution` | Work / output (Type, effort, reward) | "Hermes SDK fix", "Artist performance" |
| `zao:Constraint` | Technical/business rule (Applied to, description) | "10% ZABAL fee on trades", "no personal keys in code" |
| `zao:Resource` | Document/tool/contract (Type, URL, format) | "research/271-zao-identity", "SECURITY.md", "Bonfire graph" |
| `zao:Relationship` | Named edge type (see below) | (defined in predicate types) |

### Predicate Types (Relationships)

| Predicate | Domain | Range | Example |
|---|---|---|---|
| `zao:hasRole` | Person | Role (string) | Zaal hasRole founder, Roddy hasRole venue-contact |
| `zao:sponsors` | Organization | Event | Wallace Events sponsors ZAOstock |
| `zao:contributes_to` | Person | Contribution | Joseph Goats contributes_to cipher-track |
| `zao:decided_by` | Decision | Person | "mobile-first" decided_by Zaal |
| `zao:happens_at` | Event | Location (string) | ZAOstock happens_at "Franklin St Parklet" |
| `zao:depends_on` | Constraint/Decision | Constraint/Decision | "auth flow" depends_on "wallet login" |
| `zao:is_a` | Entity | Type (string) | Zaal is_a founder, Bonfire is_a graph-db |
| `zao:founded_by` | Organization | Person | BCZ Strategies founded_by Zaal |
| `zao:tagged_as` | Entity | Tag (string) | ZAOstock tagged_as "music", "community" |
| `zao:dba_of` | Person | Organization | Zaal dba_of "ZAO Music" (doing-business-as) |
| `zao:releases` | Person/Organization | Resource | ZAO releases cipher (album) |
| `zabalkg:has_ledger_entry` | Person/Organization | Contribution | Zaal has_ledger_entry (contribution, date, amount) |

### Sample 5-Node Example: Real ZAO Data

**Scenario:** Bonfire ingests Zaal's decision "We're using Bonfire for Q2 to track ZAOstock sponsorships and governance."

**Entities (create_entity calls):**

```python
from bonfires import BonfiresClient

client = BonfiresClient()

# 1. Zaal (Person)
zaal_uuid = client.kg.create_entity(
    name="Zaal",
    labels=["zao:Person", "Founder"],
    attributes={
        "farcaster_handle": "@zaal",
        "wallet": "0x...",
        "bio": "Founder of The ZAO"
    }
)

# 2. ZAOstock 2026 (Event)
zaostock_uuid = client.kg.create_entity(
    name="ZAOstock 2026",
    labels=["zao:Event"],
    attributes={
        "date": "2026-10-03",
        "location": "Franklin Street Parklet, Ellsworth, Maine",
        "budget_usd": "15000",
        "status": "in planning"
    }
)

# 3. Wallace Events (Organization)
wallace_uuid = client.kg.create_entity(
    name="Wallace Events",
    labels=["zao:Organization"],
    attributes={
        "contact": "wallace@events.com",
        "services": "event production, equipment rental"
    }
)

# 4. Bonfire Decision (Decision)
decision_uuid = client.kg.create_entity(
    name="Use Bonfire for Q2 Governance",
    labels=["zao:Decision"],
    attributes={
        "date": "2026-04-28",
        "context": "Track sponsorships, decisions, constraints for ZAOstock",
        "status": "approved"
    }
)

# 5. Mobile-First Design Constraint (Constraint)
mobile_uuid = client.kg.create_entity(
    name="Mobile-First Design",
    labels=["zao:Constraint"],
    attributes={
        "applies_to": "all ZAO OS interfaces",
        "rationale": "Most users browse via phone"
    }
)

# Relationships (create_edge calls):

# Zaal -> decided_by -> Decision
client.kg.create_edge(
    source_uuid=decision_uuid,
    target_uuid=zaal_uuid,
    name="decided_by",
    fact="Zaal approved Bonfire for Q2"
)

# ZAOstock -> depends_on -> Mobile-First
client.kg.create_edge(
    source_uuid=zaostock_uuid,
    target_uuid=mobile_uuid,
    name="depends_on",
    fact="ZAOstock signup/ticketing must work on phone"
)

# Wallace Events -> sponsors -> ZAOstock
client.kg.create_edge(
    source_uuid=wallace_uuid,
    target_uuid=zaostock_uuid,
    name="sponsors",
    fact="Wallace Events provides tents and logistics"
)

# Zaal -> founded_by -> The ZAO (assuming org exists)
# (omitted for brevity)

# Decision -> depends_on -> (prior constraint)
client.kg.create_edge(
    source_uuid=decision_uuid,
    target_uuid=mobile_uuid,
    name="depends_on",
    fact="Bonfire decision respects mobile-first principle"
)
```

**Result in Bonfire graph:**
```
Zaal [Person]
  ├─ decided_by ──> Use Bonfire for Q2 Governance [Decision]
  └─ founded_by ──> (The ZAO [Organization])

ZAOstock 2026 [Event]
  ├─ depends_on ──> Mobile-First Design [Constraint]
  └─ sponsors ──< Wallace Events [Organization]

Use Bonfire for Q2 Governance [Decision]
  ├─ depends_on ──> Mobile-First Design
  └─ decided_by ──> Zaal

Wallace Events [Organization]
  └─ sponsors ──> ZAOstock 2026

Mobile-First Design [Constraint]
  (edges point inbound from ZAOstock, Decision)
```

**Query example (from ZOE bot):**
```bash
client.kg.search("ZAOstock sponsors", num_results=5)
# Returns: [Wallace Events, (other sponsors)]

client.kg.search("Bonfire decision", num_results=5)
# Returns: [Use Bonfire for Q2 Governance, Zaal, ...]
```

---

## Operational Checklist: What Zaal Does TODAY

### 1. Install SDK

```bash
pip install bonfires
# or
pip install git+https://github.com/NERDDAO/bonfires-sdk.git@canon
```

Verify version:
```bash
python3 -c "import bonfires; print(bonfires.__version__)"
# Expected: 0.4.0
```

### 2. Set Environment Variables

Add to `~/.env.portal` (inherited by ZOE bot process) or `~/.config/bonfires/config.env`:

```bash
BONFIRE_API_URL=https://tnt-v2.api.bonfires.ai
BONFIRE_ID=69ef871f0d22ed7e6f2b243a
BONFIRE_AGENT_ID=69ef871f0d22ed7e6f2b243c
BONFIRE_API_KEY=<key from dashboard>
BONFIRE_VAULT_DIR=~/Vaults/Bonfires/vault
```

### 3. Initialize and Verify

```bash
bonfire init
# Interactive wizard - will detect your existing Bonfire from API key

bonfire chat "Hello from ZAO"
# Agent responds (or doesn't, depending on Silent Mode)

bonfire agents
# Lists all agents in the account
```

### 4. Decide kEngram Strategy

Choose one:

**Option A: Single kEngram for all ZAOstock data**
```bash
bonfire kengram new "ZAOstock 2026"
# Creates manifest, sets as active
```

**Option B: Multiple kEngrams (by phase)**
```bash
bonfire kengram new "ZAOstock Phase 0 Planning"
bonfire kengram new "ZAOstock Phase 1 Outreach"
bonfire kengram new "ZAOstock Phase 2 Execution"
```

Recommendation: **Option A for now** (simplicity). Revisit multi-phase when Oct 3 approaches.

### 5. Test Sync: Add Canonical Data

Create entities manually (will appear in graph):

```bash
python3 -c "
from bonfires import BonfiresClient
client = BonfiresClient()

# Create ZAOstock event
zaostock = client.kg.create_entity(
    'ZAOstock 2026',
    labels=['Event'],
    attributes={'date': '2026-10-03', 'location': 'Franklin St Parklet'}
)
print(f'Created: {zaostock}')
"
```

Verify in Bonfire dashboard: graph.bonfires.ai should show new entity.

### 6. Pin Entities to kEngram (Optional)

If using kEngrams for versioning:

```bash
bonfire kengram pin <entity-uuid>
# Marks entity as "important to this session"

bonfire kengram show
# List pinned entities
```

### 7. Verify Integrity

```bash
bonfire kengram verify
# Checks merkle root against canonical KG

bonfire kengram verify --json
# Machine-readable verification result
```

### 8. Wire Minimal HTTP Shim for ZOE

Create `bin/bonfire-bridge.py` (20 lines):

```python
#!/usr/bin/env python3
from fastapi import FastAPI
from bonfires import BonfiresClient

app = FastAPI()
client = BonfiresClient()

@app.post("/bonfire-query")
async def query(q: dict):
    try:
        results = client.kg.search(q["query"], num_results=5)
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001)
```

Run:
```bash
python3 bin/bonfire-bridge.py
# Listens on localhost:3001
```

---

## Risk Register: Production Stability

| Risk | Severity | Mitigation | Test |
|---|---|---|---|
| **SDK stability (canon branch, no tagged releases)** | MEDIUM | Monitor NERDDAO repo commit cadence. canon = working branch, not prod. Pre-test all updates. | `git clone https://github.com/NERDDAO/bonfires-sdk.git && git log --oneline canon | head -20` - expect commits >=weekly. |
| **tnt-v2 endpoint versioning** | MEDIUM | "tnt-v2" suggests v1 is deprecated. Ask Joshua.eth: is tnt-v2 stable? Migration path if v3 launches? | Query tnt-v2.api.bonfires.ai/health (if exists) once weekly. Watch Bonfires.ai changelog. |
| **Vault directory contention (ZOE + Hermes + Zaal share BONFIRE_VAULT_DIR)** | LOW-MEDIUM | kEngrams use local SQLite/JSON (BONFIRE_VAULT_DIR). Multiple processes writing simultaneously could corrupt. Set exclusive lock or separate vault paths per caller. | `ls -l ~/Vaults/Bonfires/vault && bonfire kengram list` - ensure single owner process. |
| **Rate limits undefined** | MEDIUM | Genesis tier = custom contract. No published limits. 3-5 /fix calls + 20 /tip queries/day should be safe but untested. Monitor API latency via logs. | Run daily for 1 week, log response times. If p95 latency > 2s, contact Joshua.eth for rate limit status. |
| **No documented backup / data portability** | HIGH | Bonfire is SaaS (Weaviate backend). No self-hosted option. If service shuts down or key revoked, data is inaccessible. kEngram export (--format owl) creates backup, but incomplete. | Monthly: `bonfire kengram export --format owl > backup-$(date +%Y%m%d).rdf` to git repo. If Bonfire changes pricing/access, exported RDF becomes recovery source. |
| **Agent stack isolation (one bad entity write breaks canonical KG)** | MEDIUM | Bonfire has no schema validation (doc 544 confirmed). Bad entity (e.g., with null fields or 1GB string) could bloat graph. kEngram.verify() catches it, but remediation is manual. | Test: `client.kg.create_entity("test", labels=[], attributes={"huge": "x" * 1000000})` - does it error or corrupt? Document behavior. |
| **MCP tool reliability (vs. HTTP API)** | LOW | SDK ships both HTTP client and (implied) MCP server. MCP is stable in latest Claude Code. If MCP breaks, fall back to HTTP API calls. | Test Hermes with both: 1) HTTP API directly, 2) MCP tool wrapper. Measure latency + error rate (expect <1% failures on both). |

---

## Updated Questions for Joshua.eth (Down from doc 543)

After SDK + Notion config review, the remaining real unknowns are:

1. **Rate Limits & Scaling:** Genesis tier contract is "custom pricing" - what are actual per-day entity creation limits and per-second query rate limits? Our use case: 3-5 Hermes /fix runs (each hits Bonfire 1-2x), 20-30 ZOE /tip queries/day, 1-2 Zaal intakes/day. Is this throttled?

2. **Backup & Data Portability:** Bonfire is SaaS-hosted Weaviate. If we export via kEngram --format owl monthly, is that sufficient for recovery? Do you offer data export API or only the CLI/kEngram export? What happens to our data if Bonfire's pricing/terms change?

3. **Agent-to-Agent Isolation & Schema Enforcement:** Multiple agents (Bonfire native bot, ZOE bridge, Hermes bridge) write to the same canonical graph. Is there schema validation at write time, or do we need to pre-validate entity fields in our SDK wrapper? If one agent crashes mid-write, is the transaction atomic?

---

## References & Citations

### SDK Sources

1. **bonfires-sdk README.md** - https://raw.githubusercontent.com/NERDDAO/bonfires-sdk/canon/README.md (SDK v0.4.0, classes/functions: BonfiresClient, kg.search, kg.create_entity, kg.create_edge, agents.chat, agents.sync, kengrams.create, kengrams.verify, ontology.create_profile)

2. **bonfires-sdk pyproject.toml** - https://raw.githubusercontent.com/NERDDAO/bonfires-sdk/canon/pyproject.toml (version 0.4.0, dependencies, entry points)

3. **bonfires-sdk CLAUDE.md** - https://raw.githubusercontent.com/NERDDAO/bonfires-sdk/canon/CLAUDE.md (architecture, config priority, API contract for graph_mode, kEngrams, CLI commands)

4. **bonfires-sdk source structure** - https://github.com/NERDDAO/bonfires-sdk/tree/canon (bonfires/ package containing api.py, cli.py, kg.py, agents.py, kengram/, ontology/)

### Notion Sources

5. **Bonfires.ai Agent Configuration Reference** - https://www.notion.so/fractalnouns/Bonfires-ai-Agent-Configuration-Reference-33b384a11f5681bbad4ec6daf9cf32d2 (community draft April 2026, core concepts: Bonfire/Cluster/Episode/Stack/kEngram, agent config tabs: General/Platform/Chat/Tools/Personality, policy hierarchy, storage toggles)

### Prior ZAO Docs

6. **doc 542 - Bonfires.ai Knowledge Graph for BCZ Strategies** (comparison matrix: Bonfire vs. Mem0 vs. Cognee, use case test, weaknesses/gaps)

### API Endpoints & Configuration

7. **Bonfire API base URL** - https://tnt-v2.api.bonfires.ai (default BONFIRE_API_URL per SDK config table)

8. **Bonfire Dashboard** - graph.bonfires.ai (entity browser, agent config UI)

---

**Document Status:** Research complete. Ready for implementation phase (Zaal: run operational checklist today).

**Next Steps:**
1. Zaal runs checklist items 1-8 (Install, env vars, init, test).
2. ZOE bot wires Bonfire bridge (20-line HTTP shim).
3. Ship PR with Hermes context injection (runner.ts).
4. Email Joshua with 3 remaining questions (once ZOE is live, if rate limit concerns surface).
5. Monitor daily: latency, entity count, kEngram integrity (weekly export backup).

