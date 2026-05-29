---
id: agent-004
category: agent-architecture
tier: core
severity: high
applies_to: [multi-agent, autonomous]
deprecated_since: null
sources: [doc-759, "bot/src/zoe/concierge.ts"]
---

## LOCK allowedTools to the minimum the agent needs, not the maximum the role might want

Claude Code's `allowedTools` is a hard gate at the SDK boundary, not just a soft prompt instruction. If a tool isn't in the allow-list, the model cannot call it even if the prompt says to.

Default to LOCKED. A research-only agent needs Read + Grep + WebFetch - that's it. No Edit, no Write, no Bash. A critic agent needs ZERO tools - pure reasoning over input. A code-fix agent needs Read + Edit + Write + specific scoped Bash patterns (`Bash(git diff*)` not `Bash` blanket).

Permissive tool surfaces are the #1 source of agent drift. The agent starts on task X, sees it has Write, decides to "be helpful" by creating a side file, that file ends up in a commit, you spend 20 minutes figuring out where it came from.

### When NOT to do this

Top-level orchestrator agents (the GATEWAY pattern) need broader allow-lists because they dispatch to specialized workers. But every WORKER subagent should be scope-locked to its role.

### Example

```typescript
// CORRECT - critic gets zero tools, pure reasoning
allowedTools: [],
disallowedTools: ['Bash', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'WebFetch', 'Task'],

// CORRECT - research-worker gets scoped read + fetch
allowedTools: ['Read', 'Glob', 'Grep', 'WebFetch', 'mcp__plugin_everything-claude-code_exa__web_search_exa'],

// WRONG - "let it figure it out" blanket
allowedTools: ['Bash', 'Read', 'Edit', 'Write'],
```
