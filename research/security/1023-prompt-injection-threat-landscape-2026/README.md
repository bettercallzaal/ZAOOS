---
topic: security
type: threat-landscape
status: research-complete
last-validated: 2026-07-10
superseded-by:
related-docs: 1022
original-query: "DEEP tier: Prompt injection attack landscape 2026 - comprehensive threat map so the ZAO team (Zaal, ZOE, any Claude Code session, any autonomous agent/bot in the fleet) recognizes and defends against prompt injection in all its forms, not just the crypto-address-dump variant already documented in doc 1022. Cover: (1) direct prompt injection, (2) indirect/environmental prompt injection (web content, tool outputs, documents, emails, calendar invites, PDFs, images/alt-text), (3) the specific sub-pattern from doc 1022 - social-engineered address/config injection, (4) known 2026 real-world incidents (Grok/Bankrbot wallet drain, ChatGPT/Claude/Gemini connector attacks, browser-agent attacks, MCP server attacks, GitHub issue/PR injection targeting coding agents), (5) defenses specifically relevant to ZAO OS's actual attack surface - ZOE's bonfire/inbox/telegram ingestion pipelines, MCP tool use, autonomous PR pipelines, ICM box fetching (fetchIcmBrain reads external llm.txt content into bot memory), research doc ingestion from external URLs, and Claude Code sessions with Bash/file-write/MCP access reading untrusted web/email/calendar content. Ground findings in the actual ZAO OS codebase surfaces that read external content - flag which ones are and aren't currently hardened. Defensive/awareness doc, not building an exploit."
tier: DEEP
---

# 1023 - Prompt Injection Threat Landscape 2026: A Defense Map for the ZAO Agent Fleet

> **Goal:** Give Zaal, ZOE, every Claude Code session, and every autonomous ZAO bot one place that maps every prompt-injection shape (direct, indirect/environmental, social-engineered) against ZAO OS's actual attack surface, with a concrete owner+date hardening list - not a generic security listicle.

## Key Decisions

1. **USE Meta's "Agents Rule of Two" as the design budget for every new ZAO agent surface** (fetchIcmBrain, Hermes fixer, Bonfire recall, future connectors): an agent session may satisfy at most 2 of {processes untrustworthy input, touches sensitive data/systems, changes state or communicates externally}. If a feature needs all 3, it does NOT run autonomously - it stops for human approval. This single rule directly flags the ICM-brain-override feature below as needing a gate before it reaches production.
2. **HARDEN `fetchIcmBrain` / `buildMemoryBlocks` brain override (`bot/src/zoe/memory.ts:408-438`, commit `ca8e8de7`, still on `ws/zoe-bot-factory-mvp`, not yet on main) before merge** - it fetches raw external text (`useicm.com/api/objects/<boxId>/llm.txt`) and uses it VERBATIM as a fleet bot's persona block (the system-prompt-equivalent identity/instruction layer). This is a textbook indirect-injection surface: whoever can write to that ICM box (owner-key-gated per `project_icm_boxes` memory, but box creation/editing has already shown weak-ownership failure modes per `.claude/rules/agent-loops.md` rule 15) controls that bot's entire instruction set for every conversation. USE an allowlist of exact known-good `boxId`s per bot (not attacker-suppliable) plus a length/content sanity check (reject bodies containing role-reassignment strings like "ignore previous instructions", "you are now", tool-invocation syntax) before accepting a fetched body as persona.
3. **Hermes `runFixer` (`bot/src/hermes/coder.ts:100-160`) is PARTIALLY hardened, not fully** - it already blocks `git commit/push/config`, `rm`, `curl`, `wget`, and all package installers in its `disallowedTools` list (explicitly citing the Shai-Hulud 2025-2026 supply-chain worm), and ships behind the PR-only + human-merge gate (rule 8, `.claude/rules/agent-loops.md`). But `input.issueText` - raw, attacker-writable GitHub issue text - is concatenated directly into the model's user prompt with zero content screening, and the model still has `Read/Edit/Write/Bash(git diff/ls/cat/npm run)`. This is structurally the same shape as the documented "Comment and Control" attack (SecurityWeek, June 2026) that hijacked Claude Code, Gemini CLI, and GitHub Copilot Agent via crafted PR titles/issue bodies/HTML-comment-hidden payloads in GitHub Actions runtimes holding secrets. ZAO's version runs on a VPS process rather than GitHub Actions (smaller blast radius - no repo secrets in that runtime by default per `secret-hygiene.md`), but the underlying flaw is identical: untrusted GitHub text flows straight into a tool-using model. ADD a pre-flight scan on `issueText` for role-reassignment / hidden-HTML-comment / "ignore instructions" patterns before it ever reaches `callClaudeCli`, and log+flag (not silently strip) any hit for human review.
4. **Bonfire `recall()`/`delveBonfire()` (`bot/src/zoe/recall.ts`) scans outbound episode writes for secrets (`containsSecret()`, line 92) but has ZERO scan on the READ path** - `/delve` returns "ranked episodes with full content" from a shared graph that any agent (or, per the ZABAL Bonfire product surface, any wallet-gated user) can write to, and that content flows straight into ZOE's synthesis context. ADD the same pattern-screen used for Hermes's issueText (role-reassignment phrases, hidden-instruction markers) to delve results before they enter context, matching the "Open follow-up" already logged in `.claude/rules/pii-hygiene.md` (PII scan for BonfireMemory) - bundle the injection-pattern scan into that same follow-up PR since it touches the same adapter.
5. **Doc 1022's pattern (a human is socially engineered into hand-feeding attacker data to their own coding agent) is a distinct 4th category not yet named in the mainstream OWASP/MCP literature reviewed below** - the closest analog is "promptware" (Cornell Tech's "Invitation Is All You Need!" paper) but that targets zero-click ingestion, not a human intermediary who is talked into pasting the payload themselves. Treat any inbound contact that asks "paste this into your AI and tell me what it says" as the same threat class as a poisoned calendar invite - the delivery mechanism differs (social engineering vs. zero-click), the goal (get attacker data treated as trusted context) is identical.

## Findings

### The four shapes of prompt injection, mapped to ZAO OS surfaces

| Shape | Definition | ZAO OS surface exposed | Hardening status |
|---|---|---|---|
| **Direct** | Attacker (or a well-meaning user) types adversarial instructions straight into the chat/prompt | Any Claude Code session, any Telegram DM to ZOE (`@zaoclaw_bot`) | Session-level; relies on model training + user judgment. No ZAO-specific gate exists or is needed here - this is the least novel category. |
| **Indirect/environmental** | Malicious instructions hidden in content the agent *retrieves and trusts* - web pages, tool outputs, PDFs, emails, calendar invites, GitHub comments, MCP tool descriptions | (a) `fetchIcmBrain` external llm.txt fetch, (b) Hermes `runFixer` GitHub issue text, (c) Bonfire `delve()` read path, (d) any WebFetch/exa/Playwright content this skill or ZOE ingests during research, (e) any future Gmail/GCal MCP connector (already flagged for PII in `pii-hygiene.md`, same channel is an injection channel) | Mixed - see Key Decisions 2-4. Nothing in the repo currently pattern-scans *inbound* untrusted content for injected instructions; the existing scans (`containsSecret`, PII redaction) all guard *outbound* writes. |
| **Tool/MCP poisoning** | A connected MCP server's tool names/descriptions/schemas carry hidden instructions that the host model treats as authoritative at session init | Every `mcp__*` tool loaded via ToolSearch in Claude Code sessions (supabase-cowork, github, dune, playwright, etc.) | Not evaluated per-server in this doc (out of scope for a QUICK/DEEP text pass - needs a manifest audit). Flag as a Next Action. |
| **Social-engineered manual injection** | A human is persuaded to personally copy attacker content into their own agent's context (doc 1022's pattern) | Any inbound DM/email to Zaal or any team member who then pastes content into Claude Code, ZOE, or another agent | Behavioral only - doc 1022 + this doc are the defense (pattern recognition), there is no technical gate possible since the human is the one performing the paste. |

### Documented 2026 real-world incidents (grounding for how real this is)

- **Grok/Bankrbot wallet drain (May 2026)** - already the primary incident in doc 1022; ~$150,000-$200,000 in DRB tokens drained via a Morse-code-encoded prompt injection sent over X, exploiting an AI-controlled wallet's excessive agency. [Giskard, FULL]
- **"Comment and Control" (June 2026)** - Claude Code Security Review, Gemini CLI Action, and GitHub Copilot Agent all confirmed hijackable via crafted GitHub PR titles / issue bodies / HTML-comment-hidden payloads inside GitHub Actions runtimes that hold repo secrets and broad tool access; attacker needs zero prior access, just the ability to open a PR or file an issue. Confirmed by SecurityWeek, cross-referenced by Microsoft's own security blog and the Cloud Security Alliance. [SecurityWeek, FULL] [Microsoft Security Blog, PARTIAL - blog summary read, full technical writeup behind Microsoft's longer report not separately fetched]
- **Gemini calendar-invite promptware (2026)** - Google researchers demonstrated 14 attack scenarios across 5 threat classes (spam, phishing, disinformation, data exfiltration, smart-home control) by embedding hidden instructions in a calendar event's DESCRIPTION field, triggered when a user asked Gemini something as innocuous as "summarize my day." A related zero-click Copilot case exfiltrated data via an image URL from a single poisoned email with no user click at all. [Bitdefender + TechTimes, FULL]
- **MCP tool poisoning (2026, Invariant Labs / Trail of Bits POCs)** - adversarial MCP tool descriptions instructing agents to exfiltrate session data, suppress audit logs, or invoke unauthorized secondary tools; OWASP's 2026 Top 10 for Agentic Applications now classifies this under ASI01 (Agent Goal Hijack). [Practical DevSecOps, FULL]
- **Anthropic's own browser-agent numbers** - at Claude Opus 4.5 launch (computer use, March 2026), unmitigated attack success rate against the browser agent was 31.5%; safeguards (RL + classifiers) cut Opus 4.5 to ~1%, and Opus 4.8 to 0.5% with safeguards on, 0% with "thinking" off across all 129 tested environments. Anthropic's own February 2026 system card dropped the *direct* prompt-injection metric entirely, explicitly arguing indirect injection is the more relevant enterprise threat now. [VentureBeat, FULL]

### The mental model worth internalizing: the Lethal Trifecta

Simon Willison's framing (the same person who coined "prompt injection" in 2022, naming it after SQL injection) - an agent is exploitable when a single session has all three of: **(1) access to private data, (2) exposure to untrusted content, (3) ability to communicate externally.** Meta's October 2025 "Agents Rule of Two" turns this into an actual design budget: any agent may satisfy at most 2 of the 3 in one autonomous session; if a use case needs all 3, it requires human-in-the-loop approval before consequential action, full stop. [Simon Willison / HiddenLayer / Meta, FULL]

Run each ZAO surface through this lens:

| ZAO surface | Private/sensitive data? | Untrusted content? | External comms? | Trifecta? |
|---|---|---|---|---|
| ZOE Telegram concierge, normal chat | Yes (Zaal's tasks/memory) | No (Zaal's own input) | Yes (replies) | 2 of 3 - safe |
| `fetchIcmBrain` brain override | Yes (becomes bot's whole instruction set) | **Yes** (any ICM box body) | Yes (bot then talks to users) | **3 of 3 - THIS IS THE GAP.** Needs the boxId allowlist + content screen in Key Decision 2 to drop it back to 2. |
| Hermes `runFixer` | Yes (repo write access, `bypassPermissions`) | **Yes** (raw issue text) | No (no push, no external network calls - `curl`/`wget` blocked) | 2 of 3 - the missing external-comms leg is *why* the existing hardening (no push/curl/wget) already works; do not remove that leg without adding an equivalent screen first |
| Bonfire `delve()` read into ZOE context | Yes (feeds into private concierge context) | **Yes** (any graph writer's episode body) | Yes (ZOE then acts/replies on it) | **3 of 3 - second gap**, per Key Decision 4 |

### Doc 1022's pattern, named

The Devcon-outreach incident in doc 1022 doesn't fit cleanly into "direct" or "indirect" as the literature defines them - it's a **social-engineered manual injection**: the untrusted payload doesn't reach the agent automatically (no zero-click, no poisoned tool description); a human is persuaded to be the delivery mechanism. The closest published analog is Cornell Tech's "Invitation Is All You Need!" promptware research, but that paper's attacks are all zero-click (calendar/email auto-ingested). The doc-1022 variant requires the same defensive posture as the technical ones - never let fetched/pasted attacker content become part of a trust boundary (persona, config, allowlist) - but the mitigation is 100% behavioral (recognize the ask, don't do it), not technical, since the human chose to paste it.

## Also See

- [Doc 1022 - Devcon 8 India Outreach: Suspected Address-Injection Social Engineering Attempt](../1022-devcon-outreach-address-injection-scam/) - the incident that prompted this landscape doc; the social-engineered-manual-injection category above is this doc's pattern.
- `.claude/rules/secret-hygiene.md` - covers the outbound secret-scan side (staged-diff + post-edit + pre-complete scans); this doc's Key Decisions 2-4 are the inbound-content counterpart that doesn't yet exist.
- `.claude/rules/pii-hygiene.md` - already logs an open follow-up to add PII regex to the BonfireMemory adapter's pre-POST scan; bundle the injection-pattern screen from Key Decision 4 into that same follow-up (same file, same adapter, same PR).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add boxId allowlist + injection-pattern content check to `fetchIcmBrain`/`buildMemoryBlocks` in `bot/src/zoe/memory.ts` before the `ws/zoe-bot-factory-mvp` branch merges to main | @Zaal | PR | 2026-07-14 |
| Add pre-flight role-reassignment/hidden-instruction scan on `input.issueText` in `bot/src/hermes/coder.ts` `runFixer`, log+flag hits instead of silently stripping | @Zaal | PR | 2026-07-21 |
| Extend the BonfireMemory adapter's existing secret-scan (per `pii-hygiene.md` open follow-up) to also screen `delveBonfire()` read results for injection patterns, not just outbound writes | @Zaal | PR | 2026-07-21 |
| Audit each connected MCP server's tool manifest (supabase-cowork, github, dune, playwright, etc.) for adversarial descriptions/schemas per the tool-poisoning pattern above | @Zaal | Doc (audit) | 2026-07-28 |
| Circulate doc 1022 + this doc to anyone else who might field inbound DMs/emails on Zaal's or ZAO's behalf, so the social-engineered-manual-injection pattern is recognized team-wide | @Zaal | Comms | 2026-07-17 |

## Sources

- [OWASP LLM Top 10 (2026) - Repello AI](https://repello.ai/blog/owasp-llm-top-10-2026) [FULL]
- [MCP Tool Poisoning Explained: Attack Chain & Defense in 2026 - Practical DevSecOps](https://www.practical-devsecops.com/mcp-tool-poisoning/) [FULL]
- [Claude Code, Gemini CLI, GitHub Copilot Agents Vulnerable to Prompt Injection via Comments - SecurityWeek](https://www.securityweek.com/claude-code-gemini-cli-github-copilot-agents-vulnerable-to-prompt-injection-via-comments/) [FULL]
- [Securing CI/CD in an agentic world: Claude Code GitHub Action case - Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/06/05/securing-ci-cd-in-agentic-world-claude-code-github-action-case/) [PARTIAL - summary read via search synthesis, full post not separately fetched]
- [Anthropic's browser agent got hijacked 31.5% of the time before safeguards engaged - VentureBeat](https://venturebeat.com/security/anthropic-browser-agent-hijacked-31-percent-before-safeguards-engaged) [FULL]
- [Gemini AI Compromised Through Malicious Calendar Invites, Researchers Warn - Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/gemini-ai-compromised-through-malicious-calendar-invites-researchers-warn) [FULL]
- [AI Agent Security Hits Its Reckoning - TechTimes](https://www.techtimes.com/articles/318361/20260614/ai-agent-security-hits-its-reckoning-prompt-injection-may-permanent-flaw-not-patchable-bug.htm) [FULL]
- [Invitation Is All You Need! Promptware Attacks Against LLM-Powered Assistants - arXiv](https://arxiv.org/pdf/2508.12175) [PARTIAL - abstract/summary read, full paper not fetched]
- [The lethal trifecta for AI agents - Simon Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) [FULL]
- [Understanding the Lethal Trifecta of AI Agents - Oso](https://www.osohq.com/learn/lethal-trifecta-ai-agent-security) [FULL]
- [Design Patterns for Securing LLM Agents against Prompt Injections - Simon Willison](https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/) [FULL]
- [How Google DeepMind's CaMeL Architecture Aims to Block LLM Prompt Injections - InfoQ](https://www.infoq.com/news/2025/04/deepmind-camel-promt-injection/) [FULL]
- Codebase (read directly, not web sources): `bot/src/zoe/memory.ts:408-438` (commit `137ca122`, `ca8e8de7` on `ws/zoe-bot-factory-mvp`), `bot/src/hermes/coder.ts:1-160` (main), `bot/src/zoe/recall.ts:1-150` (main)
