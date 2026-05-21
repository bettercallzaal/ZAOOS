---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-21
related-docs: 699, 698, 685
original-query: "Agent security hardening for the ZAO agent stack - MCP vulns, prompt injection, agent wallets, running agents safely. (sub-study of doc 699)"
tier: STANDARD
---

# 699b - Agent Security Hardening for the ZAO Stack

> **Goal:** Map the 2026 agent-security threats ZAO is exposed to and the concrete defenses to apply.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | DOWNGRADE ZAOcoworkingBot from root to a dedicated non-root user this week | It runs as root on Iman's VPS. A token leak or injection today = full VPS compromise. ~2-hour fix. |
| 2 | UPGRADE @modelcontextprotocol/inspector to v0.14.1+ wherever the stack uses MCP | CVE-2025-49596 is a CVSS 9.4 RCE; bind MCP to 127.0.0.1, never 0.0.0.0 |
| 3 | TREAT prompt injection as a live threat on every input surface - Telegram, GitHub, captured notes, agent memory | ZOE + Hermes read untrusted input and have persistent memory; a successful injection hijacks the agent's whole goal |
| 4 | BUILD spend caps + recipient allowlists into `src/lib/agents/` before VAULT/BANKER ever run live | The Bankr breach drained 14 wallets; agent wallets are a proven attack surface. Design the guards before activation, not after. |
| 5 | SYSTEMD-HARDEN every bot unit (NoNewPrivileges, ProtectSystem=strict, PrivateTmp, RestrictNamespaces) | Cheap, structural blast-radius reduction across ZOE, Hermes, ZAOstock, coworking |

## Threat Matrix

| Threat | Severity | ZAO exposure | Mitigation |
|--------|----------|--------------|------------|
| MCP Inspector RCE (CVE-2025-49596) | CRITICAL (9.4) | HIGH - claude CLI may invoke MCP | Upgrade to 0.14.1+, session tokens, localhost-only bind |
| MCP tool poisoning | CRITICAL | HIGH - Hermes/ZOE call external tools | Static tool-metadata validation at connect, version-pin servers, audit-log every tool call |
| Prompt injection (doc / web / email / memory / inter-agent) | HIGH | VERY HIGH - all of ZOE/Hermes input | 2-LLM quarantine pattern, JSON-strip persuasive text, allowlist sources |
| Agent memory poisoning | HIGH | VERY HIGH - ZOE memory blocks, no integrity check | SHA256 sidecar per memory file, verify on read, alert on mismatch |
| Agent wallet drain (Bankr precedent) | CRITICAL | MEDIUM - VAULT/BANKER architecture exists, not live | Spend velocity caps, recipient allowlist, explicit auth per tx, MPC/HSM keys |
| Non-root process execution | HIGH | VERY HIGH - ZAOcoworkingBot runs as root | Dedicated `_zaobots` user, systemd hardening |
| MCP design-level RCE class | MEDIUM | MEDIUM - Anthropic declined to change the protocol | Client-side only: auth, origin checks, sandbox the MCP sidecar |

## Top Security Todos (Ranked)

1. Downgrade ZAOcoworkingBot to a non-root `_zaobots` user (P0, ~2 hr)
2. Upgrade MCP Inspector to v0.14.1+, audit version on the VPS deploy (P0)
3. Version-pin / hash-verify MCP tool manifests in `bot/src/hermes/` (P0)
4. SHA256 integrity sidecars for ZOE memory files; verify on read (P1)
5. Input-validation layer on the concierge - separate trusted (Zaal direct) from untrusted (captures) (P1)
6. Spend caps + recipient allowlist documented in `src/lib/agents/types.ts` + `runner.ts` (P1)
7. MCP tool-response filtering for injection patterns + audit log to Supabase (P2)
8. Privilege-separate the Hermes coder/critic - critic read-only, cannot modify the fix (P2)
9. Systemd hardening on all bot units (P2)
10. `agent_audits` Supabase table - log every action's input/output hash, tool calls, memory mutations (P2)

## ZAOcoworkingBot: The Root Fix

Create `_zaobots` system user, move the bot to a systemd unit with `User=_zaobots`, `NoNewPrivileges=yes`, `ProtectSystem=strict`, `ProtectHome=true`, `ReadWritePaths` scoped to the memory dir only. Watch out: `.env` must be readable by `_zaobots` (chmod 640, owned by that user), and no code can assume a `/root/` path. ~1-2 hour task; test that Telegram still connects after restart.

## Specific Numbers

- CVE-2025-49596: CVSS 9.4, patched in MCP Inspector v0.14.1 (June 2025)
- Bankr breach (May 2026): 14 wallets accessed, ~$150K drained
- A 2026 study found 26 LLM routers injecting malicious tool calls, ~$500K drained from one client wallet
- HiddenLayer 2026: autonomous agents account for ~1 in 8 reported AI breaches

## Sources

- [CVE-2025-49596 RCE in MCP Inspector (Oligo)](https://www.oligo.security/blog/critical-rce-vulnerability-in-anthropic-mcp-inspector-cve-2025-49596) [FULL]
- [The Hacker News - Anthropic MCP design vulnerability](https://thehackernews.com/2026/04/anthropic-mcp-design-vulnerability.html) [FULL]
- [Bankr breach - 14 wallets, $150K drained (CryptoTimes)](https://www.cryptotimes.io/2026/05/20/bankr-breach-exposes-ai-crypto-wallet-after-14-wallets-lose-150k-ai-attack/) [FULL]
- [MCP threat modeling + tool poisoning (arXiv 2603.22489)](https://arxiv.org/pdf/2603.22489) [FULL]
- [Memory poisoning attack + defense on LLM agents (arXiv 2601.05504)](https://arxiv.org/abs/2601.05504) [FULL]
- [Agent privilege separation as structural injection defense (arXiv 2603.13424)](https://arxiv.org/pdf/2603.13424) [FULL]
- [How to sandbox AI agents in 2026 (Northflank)](https://northflank.com/blog/how-to-sandbox-ai-agents) [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Downgrade ZAOcoworkingBot off root (todo 1) | @Zaal / @Iman | Fix | This week |
| Upgrade MCP Inspector + pin tool manifests (todos 2-3) | @Zaal | Fix | This week |
| Memory integrity + input validation (todos 4-5) | @Claude | PR | Next sprint |
| Wire `agent_audits` logging + systemd hardening (todos 9-10) | @Claude | PR | Next sprint |
