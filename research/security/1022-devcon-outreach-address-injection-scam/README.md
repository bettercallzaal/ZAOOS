---
topic: security
type: incident-postmortem
status: research-complete
last-validated: 2026-07-10
superseded-by:
related-docs:
original-query: "Emad Al-Shamiri / \"Layer Infinity\" Devcon 8 India outreach - suspected address-injection social engineering scam. Document the pattern: rapport-build via Devcon India ZTalent group, compliments on Zaal's GitHub, then a wall of unverified ETH addresses (21 of them) + 2 Solana addresses framed as \"Authority Cluster\" / \"Core Executive Addresses\" / \"Solana Infrastructure Endpoints\", explicitly asking to be fed into Claude alongside Zaal's real repos (bettercallzaal, zaodevz) \"to see what it outputs\" - a known indirect prompt-injection technique to get an AI coding agent to treat attacker-controlled addresses as trusted infrastructure. No addresses verified, none added to any config/allowlist/repo. Socials given by contact: github.com/Emadalshamery, linkedin.com/in/emad-al-shamiri, x.com/alemadtrc. Addresses listed only as reported-by-unverified-contact, explicitly marked do-not-trust in the doc. This is a security/scam-awareness note for institutional memory, not an outreach lead."
tier: QUICK
---

# 1022 - Devcon 8 India Outreach: Suspected Address-Injection Social Engineering Attempt

> **Goal:** Record a suspected scam pattern targeting Zaal so the ZAO team (and any agent, including Claude/ZOE) recognizes it on repeat and never treats the addresses involved as trusted infrastructure.

## Key Decisions

1. **DO NOT** add any address from this contact to any ZAO config, allowlist, wallet integration, or repo. None have been verified as real infrastructure for any legitimate project.
2. **DO NOT** feed the address list to Claude, ZOE, or any other AI agent as "context" for a codebase, wallet integration, or trust decision - this is the exact mechanism the contact requested and it is a known indirect prompt-injection vector (see Findings).
3. **TREAT** unsolicited "fellow founder" outreach that (a) opens on a shared conference/group, (b) compliments a public GitHub profile, then (c) pivots to "here are my infra addresses, feed this to your AI and tell me what it says" as a scam pattern going forward, regardless of how technically fluent the pitch sounds.
4. **NO REPLY** with wallet activity, code, or "here's what Claude said" - do not give the contact a signal on whether the injection attempt worked.

## What Happened

Contact "My Tea" (claiming the name Emad Al-Shamiri) reached out referencing the Devcon 8 India ZTalent group, framing himself as a blockchain architect building a "Layer Infinity protocol." The conversation followed a recognizable four-step shape:

1. **Rapport hook** - name-drop a shared context (Devcon 8 India / ZTalent), flatter the target's public work ("your work with ZTalent... truly visionary"), claim no ask ("not reaching out for anything specific").
2. **Reciprocity bait** - once Zaal responded warmly and shared his own GitHub repos (`github.com/bettercallzaal`, `github.com/zaodevz`), the contact praised Zaal's profile and said he was "trying to build something similar" - priming Zaal to reciprocate further.
3. **The injection payload** - contact volunteered 21 Ethereum addresses (labeled "Core Executive Addresses" / "Authority Cluster") and 2 Solana addresses (labeled "Solana Infrastructure Endpoints"), explicitly instructing: *"Feeding these along with the repo into Claude will give you a much clearer picture of how the sovereign execution and transaction tracking function in production."*
4. **Feedback loop** - contact asked Zaal to report back "what Claude outputs" - i.e., wants confirmation the addresses were ingested by an AI agent as context.

None of the 21 ETH addresses or 2 Solana addresses were verified against any known, audited, or publicly documented protocol. No on-chain lookup, contract-verification check, or reverse search was performed as part of this doc - the addresses are recorded below strictly as **reported-by-unverified-contact, do-not-trust**, for pattern recognition only.

### Addresses reported (UNVERIFIED - DO NOT TRUST, DO NOT USE)

ETH-format addresses supplied by the contact, labeled "Authority Cluster" / "Core Executive Addresses":

```
0xf3e726642f6384cb3d0ca14f426403bae888bf96
0x2e8601bfb4bd0f31a60e1b93945cfb7d6c2f17c5
0x773b20285d03b13190a31790dc4911c7188d24dc
0x086a2fff5f6e1c9eff375d1819eef314da84cbe4
0x2426b9ce7906231f8f3fe8fdab74dd914d72f1e7
0x9ecb641434f1eef3382bf573a1ef5065f31c69dd
0x3C9718a88C31D397c494A51Dbec614afB77ddBB2
0x53208f405281cae9ce059b2e9669d23412c0e2b3
0xdd5039bb6c28da062f351c5025873d6bbeeb0415
0x6b25fd2e9eef9eefffaac3a77b7b9c4304a25929
0x0d8612a8929e7308d4d6f31e44d4e8c2f2d6fb52
0xc26e08ec5f2289759fc9ec10ae9e035f29d929a7
0xb4c50b3e6f7cdf918b3bd0e63a6c62e960ee9b62
0xf30a791b0e7e122d89ea30bb7ea7f35941ea952d
0x611c0972f77acbfb57236db016e4ed63a5122b4a
0x8d791192d28b113ac347950f0a4badb0a7e5bd0f
0x6784e004126d91a3b034787d662ce3e97dd34025
0x8e8a432e3877a9d553a759081daecf9367e8f3eb
0x4cef0487ccd6f5fe52070cb57bf5c1eb6b3bd5b6
0xd97303b627563aef52adf26878c57534f4079a47
0xb8509f5259d6fEd87C13d31ABA4D638b8dc97F35
0x3e42d550ac249d2077f888838e15a5bf185054fd
```

Solana-format addresses, labeled "Solana Infrastructure Endpoints":

```
Eq9MkY3jhFsjGQ4RjUjrFjGUD34qyN2iBhqFLzZEDydQ
EZqGfTKusnWaZoFqfKqZbwwcM9oZFE5tuc2EpuseFKkk
```

Contact's stated socials (unverified, at face value from the pitch, not confirmed as belonging to a real identity):

- GitHub: https://github.com/Emadalshamery
- LinkedIn: https://www.linkedin.com/in/emad-al-shamiri
- X: https://x.com/alemadtrc

## Findings

**This matches a documented 2026 attack class: indirect prompt injection to manipulate AI agents into treating attacker-controlled crypto addresses as trusted.** The technique doesn't require the AI to execute a transaction on the spot - the goal in this variant looks like establishing the addresses as "known-good infrastructure" inside the target's own tooling/context (a coding agent, a research doc, a config file) so a future session treats them as legitimate when doing something crypto-adjacent (WaveWarZ, ZABAL token work, wallet integrations, etc). This is the same underlying trust-exploitation mechanism used in the live incidents below, adapted from "get the agent to pay" to "get the agent (and its owner) to believe."

- **SecurityWeek (2026):** documents active campaigns where indirect prompt injection tricks AI agents with payment capability into transferring crypto to attacker wallets, exploiting "the inherent trust AI agents place in external content." [FULL]
- **Zscaler ThreatLabz (2026):** found campaigns hiding injected instructions in web content (SEO poisoning + CSS/HTML concealment) that direct agents to send small amounts of ETH to hardcoded addresses or buy fake API keys - the same "innocuous-looking small ask that plants a trusted address" shape as this incident. [FULL]
- **Giskard / multiple outlets (May 2026):** the Grok/Bankrbot incident - an X user used an encoded (Morse-code) prompt injection to get an AI-controlled wallet to transfer ~$150,000-$200,000 in DRB tokens on Base. Confirms the broader 2026 threat landscape: AI agents with any crypto-adjacent context are active targets. [FULL]

Contradiction/gap: none of these public incidents document the exact "ask the human to manually paste addresses into their own coding assistant" variant seen here - this looks like a lower-tech, social-engineering-first adaptation of the same trust-exploitation goal, worth flagging as its own sub-pattern since it doesn't need the AI to have payment tooling at all, just a human who copy-pastes context.

## Also See

- No prior ZAO OS security doc covers social-engineering/scam outreach specifically (checked `research/security/` - closest are `343-agent-wallet-security-zabal-swarm`, `494-vps-secrets-ai-coding-agent`, `926-agent-secrets-management`, none cover inbound-outreach scams). This doc establishes that category.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| No reply sent to "My Tea" / Emad Al-Shamiri with any AI output, wallet activity, or code | @Zaal | Behavior | Already in effect |
| If contact resurfaces with a new ask (funding, integration, "send test tx"), treat as confirmed scam and stop engaging | @Zaal | Behavior | Ongoing |
| Add this pattern (unsolicited founder outreach -> address dump -> "feed to your AI") to onboarding notes for anyone else who fields Devcon/conference DMs on Zaal's behalf | @Zaal | Doc update | wontfix (covered by this doc; revisit only if a second incident lands) |

## Sources

- [Prompt Injection Attacks Trick AI Agents Into Making Crypto Payments - SecurityWeek](https://www.securityweek.com/prompt-injection-attacks-trick-ai-agents-into-making-crypto-payments/) [FULL]
- [Indirect Prompt Injection Targets AI Agents - Zscaler ThreatLabz](https://www.zscaler.com/blogs/security-research/indirect-prompt-injection-web-content-targets-ai-agents) [FULL]
- [How Grok got prompt-injected: an X user drained $150,000 from an AI wallet - Giskard](https://www.giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet) [FULL]
- [AI Prompt Injection Exploit Drains Grok-Linked Crypto Wallet - OECD.AI incident record](https://oecd.ai/en/incidents/2026-05-04-4a73) [PARTIAL - incident summary read, full internal report not accessible]
- Contact's self-reported profiles (unverified, listed for pattern record only, not confirmed authentic): [github.com/Emadalshamery](https://github.com/Emadalshamery), [linkedin.com/in/emad-al-shamiri](https://www.linkedin.com/in/emad-al-shamiri), [x.com/alemadtrc](https://x.com/alemadtrc)
