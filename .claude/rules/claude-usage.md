# Tool Routing

Route work to the surface that can complete it with the least unnecessary premium-model use. Source: `research/dev-workflows/2675-claude-rate-limit-multi-tool-routing/`.

| Work | Use | Boundary |
|---|---|---|
| Grounded live-code edits, verification, and PRs | Claude Code | Use the repository's rules, hooks, skills, and current implementation. |
| Well-specified mechanical code with a file list and acceptance criteria | Codex exec | Check its result against the repository; do not delegate ambiguous discovery or completion judgment blindly. |
| Research triage; Google Docs and Sheets output | Gemini CLI | Treat fetched sources, not summaries, as evidence. |
| Bulk summarising and classifying inside ZOE loops | OpenRouter through ZOE's router | Text jobs only; file-editing work waits for a grounded coding surface. |
| Small private/offline text transformations | Ollama local | Local models only; cloud-tagged Ollama models are not private. |

- One lane keeps its assigned Claude account for its lifetime. Do not switch accounts inside a running lane.
- Claude Code fallback models do not cover a usage cap. On a cap, update the lane brief and continue from it on the routed surface.
- Plan in chat and provide the agent a concrete spec and file list. Grounded repository edits stay grounded in the repository.
