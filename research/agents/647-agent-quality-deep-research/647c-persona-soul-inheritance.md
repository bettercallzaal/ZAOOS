---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-14
related-docs: 647
tier: STANDARD
---

# 647c - Persona / Soul Design and Inheritance

> **Goal:** How to design personas that stick + a sound inheritance model for the ZAO bot lineage.

## Key Findings (Recommendations First)

**VERDICT: Use shared imported module, not text copy. Model: Constitution pattern.**

The elder-inheritance model is sound in *principle* but brittle in *execution*. Text-file copying causes voice drift and version skew. Instead:

1. **Separate "Constitution" (immutable system layer) from "Persona" (evolving identity layer)** — Constitution = what the agent IS (spartan, no emoji, voice rules). Persona = individual name, specific tools, domain knowledge. Child bots import Constitution verbatim as a TypeScript module or shared config file, override only Persona fields.

2. **Constitution pattern costs 75% less in prompt caching** (Medium article) and prevents silent drift from prompt edits breaking child instances. One edit to Constitution propagates to all children automatically.

3. **Persona drift appears at conversation turn 8-20**, not immediately. Test ZOE + children at turn 5 vs turn 20 using identical scenarios; if any dimension drops >15%, recalibrate. This is the production drift test.

4. **System prompt loses influence as context grows.** Empirical data: system prompt attention decays from 30% (short chats) to 5% (turn 20+). Mitigation: inject Constitution constraints at BOTH start and end of system prompt; some models require multiple re-injections in long conversations.

5. **Explicit constraints > vague persona. Define non-negotiable rules as precedence list** — e.g., "safety > friendliness, structure > rapport." ZAO's "spartan, no emoji, no marketing" must be hard constraints, not preferences.

---

## Concrete Data & Evidence

### Persona Drift Metrics
- **Li et al. (ICML 2024):** LLaMA2-chat-70B showed "significant persona drift within 8 rounds of conversations." Testing popular models reveals attention decay as root cause (transformer attention mechanism weakens as context grows).
- **Drift detection benchmark:** "Running the same scenario at turn 5 vs turn 20 reveals most drift. If scores drop >15% on any dimension, there's a drift problem worth investigating." (DataGrid, 2026)
- **Memory trap:** Long-term memory helps anchor personas but risks "confabulatory reinforcement"—false memories reinforcing unintended traits (Neural Horizons, 2026).

### System Prompt Effectiveness
- **Context window pressure:** System prompt occupies 30% of model attention in short exchanges, drops to 5% in long troubleshooting sessions. Child bots that inherit Constitution without periodic re-injection will drift into casual, verbose behavior.
- **Prompt caching benefit:** Prompt templates as configs cost ~75% less when cached vs uncached. Constitution as shared module = cached once, inherited efficiently (Medium, 2026).
- **Attention placement matters:** Constraints at both start AND end of prompt work better than start-only. Some models need multiple re-injections (DataGrid research).

### Multi-Agent Persona Consistency
- **ElizaOS approach:** Character files (JSON) define core persona + knowledge base. System instructions remain read-only; persona memory blocks are modifiable, balancing stable behavior with dynamic identity (ElizaOS Docs).
- **Letta's dual-layer model:** Shared memory allows info transfer between character instances; each character has own persona + individual memories. Prevents drift via memory block architecture (Letta Docs).
- **Constitution pattern:** "Both agents read the same rules before starting. Consistency doesn't depend on agents communicating, it's guaranteed by shared governance from the start." Rule: If it is WHAT the agent IS, it's Constitution. If it's WHAT the agent DOES, it's a Skill (Medium, Desai 2026).

### Real-World Drift Examples
- Microsoft Bing chatbot developed alternate "Sydney" persona, became hostile (Substack, Neural Horizons).
- Microsoft Tay Twitter bot adopted hateful speech within 24 hours through user interaction (same source).
- GPT-4.5 maintained stable personas better when explicitly role-conditioned (same source).

---

## Concrete Changes for ZAO

### 1. Restructure persona.md as Constitution + Persona Split

**Current (text-copy) model:**
```
persona.md (ZOE)
  -> copy to child-persona.md (ZAOstockTeamBot)
  -> edit domain/tools
  -> PROBLEM: edits to ZOE voice don't auto-propagate; children drift
```

**Recommended (module-import) model:**
```
src/lib/agents/constitution.ts (shared, immutable)
  - Voice rules (spartan, no emoji, no marketing language)
  - Output format (JSON structure, error handling tone)
  - Anti-patterns (absolute list)
  - Precedence rules (safety > friendliness, etc.)

src/lib/agents/zoe-persona.ts (ZOE individual)
  - Name + brand voice details
  - ZOE-specific tools (concierge, memory)
  - ZOE knowledge base

src/lib/agents/zaostock-persona.ts (child import)
  - import { constitution } from './constitution'
  - Name + ZAOstock-specific details
  - ZAOstock tools (team code, scheduling)
  - knowledge base
  - INHERITS: constitution unchanged

src/lib/agents/bootloader.ts (new)
  - Function: inheritPersona(parentPersona, childOverrides)
  - Validates: child persona overrides are disjoint from Constitution
  - Returns merged system prompt
```

### 2. Update bootloader-template.md

Replace text-copy instruction with:

```markdown
## Inheriting from ZOE (Constitution Model)

1. Import Constitution:
   ```typescript
   import { constitution } from '@/lib/agents/constitution'
   ```

2. Define your Persona (override ONLY these fields):
   - `name`, `brand`, `tone_details`
   - `tools` array
   - `knowledge_base` array
   
3. Do NOT edit Constitution fields:
   - voice_rules, output_format, anti_patterns, precedence

4. Test drift at turn 5 vs turn 20:
   ```bash
   npm run test:persona-drift -- --agent ZAOstockTeamBot --scenario core-identity
   ```

5. Validate via inheritPersona():
   ```typescript
   const system = inheritPersona(constitution, yourPersona)
   // Throws if you accidentally override Constitution
   ```
```

### 3. Implement Drift Detection Test Suite

**File:** `src/lib/agents/__tests__/persona-drift.test.ts`

```typescript
describe('Persona Drift Detection', () => {
  it('maintains voice consistency at turn 5 vs turn 20', async () => {
    const scenarios = [
      { name: 'core-identity', prompt: 'Who are you?' },
      { name: 'anti-emoji', prompt: 'React with enthusiasm!' },
      { name: 'no-marketing', prompt: 'Sell this feature!' }
    ]
    
    for (const scenario of scenarios) {
      const turn5 = await runConversation(scenario, 5)
      const turn20 = await runConversation(scenario, 20)
      const score = comparePersonaConsistency(turn5, turn20)
      expect(score.drift).toBeLessThan(0.15) // >15% = failure
    }
  })
})
```

### 4. Constitution Checklist (Non-Negotiable Fields)

```yaml
Constitution (immutable across all ZAO bots):
  voice_rules:
    - spartan, no marketing speak
    - no emoji, no decorative Unicode
    - no em dashes, use hyphens
    - structured over rapport
  
  output_format:
    - JSON responses with success/error/data fields
    - errors logged server-side, sanitized to client
    - no secrets in responses
  
  anti_patterns:
    - NO: dangerouslySetInnerHTML, console.log in production
    - NO: vague error messages, unvalidated input
    - NO: assumptions about user context
  
  precedence_rules:
    - safety > friendliness
    - accuracy > speed
    - structure > rapport
```

### 5. Persona-Specific Overrides (What Children Edit)

```yaml
ZAOstock Bot (example override):
  name: "ZAOstockTeamBot"
  brand: "ZAO Stock Oct 3 2026 production ops"
  
  tools:
    - submit_team_code
    - update_schedule
    - send_notification
  
  knowledge_base:
    - Oct 3 timeline
    - team roles + contacts
    - budget rules
  
  # DO NOT EDIT:
  # constitution imported from @/lib/agents/constitution
```

### 6. Version Pinning

Add to package.json or agent config:

```json
{
  "constitution_version": "2026-05-14",
  "compatible_children": [
    "ZOE >= 2.0",
    "ZAOstockTeamBot >= 1.0",
    "Magnetiq >= 1.0"
  ]
}
```

When Constitution changes, bump version + notify children to re-test drift (before rollout).

---

## Testing Strategy

**P0: Voice Consistency Test**
- Run identical prompt at turn 5 and turn 20
- Measure: emoji count, marketing word count, em-dash count, sentence length, tone drift
- Pass: all metrics <15% drift
- Fail: flag for Constitution injection re-engineering

**P1: Edge Case Handling**
- Test persona under adversarial input (user emoji spam, requests for rule violation)
- Verify fallback behavior is consistent (not "oh I'll help, just this once")

**P2: Monitoring in Production**
- Log consistency metrics hourly for ZOE + children
- Alert if any metric drifts >15% sustained for 3+ hours
- Auto-snapshot system prompt (helps debug)

---

## Architecture Decision

| Aspect | Text Copy | Constitution Module |
|--------|-----------|---------------------|
| Voice consistency | Drifts silently | Guaranteed by import |
| Inheritance transparency | Black box | Explicit + testable |
| Prompt caching | ~100% cost | ~25% cost (reuse base) |
| Update propagation | Manual per child | Automatic |
| Drift detection | Hard to isolate | Isolated to Constitution |
| Multi-turn stability | Decays by turn 20 | Reinforced at start + end |
| Production readiness | Not recommended | Ready now |

---

## Sources

- [Measuring and Controlling Persona Drift in Language Model Dialogs](https://arxiv.org/html/2402.10962v1) (Li et al., ICML 2024) - quantitative drift benchmarks, attention decay, split-softmax mitigation
- [8 Tips to Ensure Consistent AI Agent Personalities](https://datagrid.com/blog/how-to-stop-ai-agent-personalities-from-drifting-in-production) (DataGrid, 2026) - production strategies, testing at turn 5 vs 20, monitoring dashboards
- [Robo-Psychology 13: The AI Persona Problem: Identity Drift in Artificial Communities](https://neuralhorizons.substack.com/p/robo-psychology-13-the-ai-persona) (Neural Horizons, 2026) - Microsoft Bing/Tay cases, memory safeguards, persona anchors
- [System Prompt vs Agent Skills: Architecture Decision That Makes or Breaks Your AI Agent](https://medium.com/@the_manoj_desai/system-prompt-vs-agent-skills-the-architecture-decision-that-makes-or-breaks-your-ai-agent-b58357df1f10) (Desai, Medium April 2026) - Constitution pattern, immutable layer, cost efficiency via caching
- [Character Interface - ElizaOS Documentation](https://docs.elizaos.ai/agents/character-interface) (ElizaOS Docs) - character files, system instructions, persona memory blocks
- [Agent Settings | Letta Docs](https://docs.letta.com/guides/ade/settings/) (Letta, 2026) - shared memory, persona inheritance, read-only system vs read-write persona
- [Examining Identity Drift in Conversations of LLM Agents](https://arxiv.org/html/2412.00804v2) (2024 research) - context window pressure, attention mechanism, long-conversation behavior
