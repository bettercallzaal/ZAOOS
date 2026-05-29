---
id: agent-009
category: prompt-engineering
tier: core
severity: medium
applies_to: [autonomous]
deprecated_since: null
sources: [doc-759 Q4, "memory:project_zoe_orchestrator_locked"]
---

## REQUEST a voice note from the user before a low-confidence self-improvement patch

When an agent drafts a patch to its own identity-load-bearing memory (persona, user facts, decision log), the cost of getting it wrong is high (every future turn inherits the wrong fact). Text-back-and-forth clarification is slow and tends to over-anchor on the agent's first draft.

Voice notes compress: 30-second clarification beats 4-message text exchange. The user explains intent freely. Agent drafts from the voice note transcript fresh, not anchored on its prior wrong draft, then asks y/n once.

The ZOE orchestrator pattern from doc 759 Q4 = B+ hybrid uses this:
1. High-confidence patches (>=80 score) -> y/n direct
2. Low-confidence (40-49) -> voice note request FIRST
3. Voice note arrives -> redraft fresh from transcript -> y/n

The pattern applies anywhere an agent is uncertain of user intent on a load-bearing edit, not just memory blocks. Drafted comms, ambiguous goal decomposition, contested critic scores: same voice-note-first move.

### When NOT to do this

Routine high-confidence edits (>=80) - don't add friction. Conversational replies - just answer.

### Example

```typescript
// Pattern from bot/src/zoe/reflexion.ts
if (patch.confidence_score >= 80) {
  // Direct y/n
  await telegram.send(`Approve patch-${patch.id}? y/n: ${patch.summary}`);
} else if (patch.confidence_score >= 40) {
  // Voice note request first
  await telegram.send(
    `Low-confidence patch on ${patch.target}.${patch.section}: ${patch.summary}\n` +
    `Send a voice note explaining what you actually want. I'll redraft + y/n.`
  );
} else {
  // Suppress entirely - too noisy to propose
}
```
