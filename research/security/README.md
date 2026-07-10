# Security

> Codebase audits, security practices, and API verification.

| # | Title | Type | Summary |
|---|-------|------|---------|
| 040 | [Codebase Audit Guide](./040-codebase-audit-guide/) | CANONICAL | Step-by-step guide to audit ZAO OS for security, quality, performance, and accessibility |
| 057 | [Codebase Security Audit (March 2026)](./057-codebase-security-audit-march-2026/) | CANONICAL | Full audit via 4 parallel agents covering auth, chat/music, governance/respect, admin/social/XMTP |
| 136 | [API Status Verification (March 2026)](./136-api-status-verification-march-2026/) | EVENT/LOG | Confirm which APIs are active vs deprecated before integrating |
| 343 | [Agent Wallet Security: ZABAL Swarm](./343-agent-wallet-security-zabal-swarm/) | CANONICAL | 3-phase security upgrade: Privy TEE (replace env var keys), Safe 2/3 multisig treasury, OWASP agentic controls. Policy engine, key quorums, circuit breakers, kill switches, behavioral monitoring |
| 463 | [Portal + Agent Orchestrator Audit (10-Agent Batch)](./463-portal-ao-audit-10-batch/) | STANDALONE | Preserve findings from 10-parallel subagent audits (5 portal, 5 AO + cross-system). Drives PR A/B/C fixes for security, observability, BRAIN-bridge. |
| 471 | [Vercel OAuth Supply Chain Breach April 2026](./471-vercel-oauth-breach-apr2026/) | URGENT | P0 action: ZAO OS runs on Vercel. Context.ai OAuth compromise -> Vercel Google Workspace -> non-sensitive env vars leaked. 5-phase rotation checklist: triage, sensitivity flag audit, rotation (Supabase/Neynar/SESSION_SECRET/signer first), hardening (MFA+Deployment Protection+ggshield), OAuth app cleanup |
| 494 | [VPS Secrets Management with AI Coding Agents](./494-vps-secrets-ai-coding-agent/) | STANDALONE | Document community-vetted secrets management approaches for solo dev on single VPS with AI agent shell access; analyze rotation patterns and lock-in vectors specific to … |
| 968 | [ZAOOS codebase audit 2026-07-05](./968-zaoos-codebase-audit-2026-07-05/) | AUDIT | 6-dimension estate audit; security strong, tests thin on money/auth paths; verified gap counts |
| 1022 | [Devcon 8 India Outreach: Suspected Address-Injection Social Engineering Attempt](./1022-devcon-outreach-address-injection-scam/) | STANDALONE | Inbound contact fed unverified crypto addresses framed as "infrastructure," asked to feed them into Claude alongside real repos - matches 2026 indirect-prompt-injection scam pattern; addresses never trusted or stored anywhere |
