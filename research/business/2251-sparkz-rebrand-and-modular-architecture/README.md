---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-08
superseded-by:
related-docs:
original-query: "DEEP research project for Sparkz - a rebrand + architecture rethink. Cover: (1) NAMING/REBRAND - is 'Capsule' the right name for the core unit? Is 'Sparkz' the right product name? Is 'backer' the right word? How do we ZAOify it. (2) MODULAR WHEEL-AND-SPOKES ARCHITECTURE - make it as simple as possible for vendors to open a PR and add a connection/plugin for their tool, with a per-community toggle. (3) What makes the most sense for positioning Sparkz as OSS-monetization, back-the-work-not-a-coin, part of The ZAO."
tier: DEEP
---

# 2251 - Sparkz rebrand + modular wheel-and-spokes architecture

> **Goal:** Decide the naming (product / core unit / supporter), and the simplest vendor-plugin
> "wheel-and-spokes" architecture, so Sparkz reads as a ZAO-family product and any vendor can add
> their tool via one PR + a per-community toggle.

## Key Decisions (recommendations first)

| # | Decision | Call | Why |
|---|----------|------|-----|
| 1 | Product name | **KEEP "Sparkz"** | Only real collision is Sparkball (a game, different space). The Z fits the ZAO family. Brand + gold-flame identity already built. |
| 2 | Core-unit name | **RENAME "Capsule" -> "Hearth"** (Zaal chose, 2026-08-08) | "Capsule" collides hard (Capsule Wallet a16z-backed, Capsule Social - same creator audience) AND reads as a sealed container, not a hub. "Hearth" = the fire at the center of a home: hub + ownership + extends the Sparkz flame. Zero collision. |
| 3 | Supporter term | **KEEP "backer"** | Kickstarter-familiar, plain-language, anti-speculation ("back the work, not a coin"). Runner-up "Believer" if more edge wanted later. |
| 4 | Integration term | **"spokes"** | The wheel metaphor: the Hearth is the hub; each integration/tool a community adds is a spoke. Names the architecture for free. |
| 5 | Vendor-plugin pattern | **JSON-manifest + registry-PR + per-Hearth toggle + HMAC webhook isolation** (Home Assistant + Obsidian + Raycast + Sentry hybrid) | Simplest safe pattern across 9 platforms surveyed. 2-3 files, CI-gated, one-click community toggle, secrets never in the manifest. |
| 6 | Generalize the seam types | **Add a generic `spoke`/`connector` type** beyond the current 3 (signal/backing/approval) | Vendors want to add arbitrary tools, not only the 3 internal seam kinds. elizaOS's `connectorSources` + `routes` is the model. |
| 7 | ZAOification | **Surface, not soul** - adopt Space Grotesk + JetBrains Mono, ZAO Gold #FFD700, "Part of The ZAO", "graduate to independence" | Per the existing `rebrand-audit-zao-lens.md`: the thesis + copy are already ZAO; only the visual skin drifts Farcaster-generic. |

## Context: what's already true (grounding)

- **Sparkz code today** (`bettercallzaal/sparkz`): a `CapsulePlugin` (`src/lib/plugins/types.ts`) bundles component arrays behind one id + a declared `configSchema`. `BUILT_IN_PLUGINS` (`src/lib/plugins/built-in.ts`) wires 6 plugins across exactly **three seam types**: `signalSources`, `backingProviders`, `approvalChannels`. A per-Capsule toggle control plane (`src/lib/plugins/capsule-config.ts` + the `capsule_plugins` table: `capsule_id, plugin_id, enabled, config`) merges built-in defaults with per-Capsule overrides. This is already elizaOS-modeled - the rename target is Hearth, and the extension target is a generic spoke type.
- **Existing strategy docs**: `docs/strategy/positioning.md` (OSS-monetization, not SaaS; earn on flow through the rails + the receipts graph), `docs/strategy/graduation-timing.md` (launch = a readiness state), `docs/strategy/rebrand-audit-zao-lens.md` (the ZAO-lens brand audit this doc builds on).

## Finding 1 - Naming

### 1a. Collisions (the hard evidence)

| Name | Collision severity | Real collisions found |
|------|--------------------|-----------------------|
| **Capsule** | HIGH - reject | Capsule Wallet (a16z-backed web3 embedded wallet, usecapsule.com); Capsule Social (decentralized social for creators - SAME audience); Capsule pharmacy (Philips TM); Capsule phone cases (contested TM) |
| **Sparkz** | MODERATE - keep | Sparkball (web3 game, different space); GitHub Spark (non-web3, sunset by 2026-08-31); Sparkz Solutions (B2B India, low overlap) |
| **Ember** | FATAL | Ember.js (JS framework - Netflix, Apple, LinkedIn) |
| **Forge / Foundry** | FATAL | Atlassian/Laravel/Minecraft Forge; Paradigm Foundry (crypto toolkit) |
| **Beacon / Nexus / Node** | HIGH-FATAL | Ethereum Beacon Chain; Sonatype Nexus / Nexus Mods; Node.js |

### 1b. The core-unit shortlist (collision-vetted, scored for hub-fit)

| Candidate | Hub-fit | Ownable | Plain | Sparkz-fit | Total /25 | Verdict |
|-----------|---------|---------|-------|-----------|-----------|---------|
| **Hearth** | 5 | 5 | 5 | 4 | **22** | **CHOSEN** - fire-center, gather, own; extends the flame |
| Roost | 4 | 5 | 5 | 4 | 22 | Strong alt - playful, homing, culture-forward |
| Hub | 5 | 4 | 5 | 3 | 19 | Literal wheel-center but generic |
| Stage | 4 | 4 | 5 | 4 | 20 | Leans performance, not hub |

**Decision: Hearth.** It does triple duty - fire (matches the gold flame), a place people gather (hub + ownership), and it names the architecture: the Hearth is the hub, integrations are spokes. "Your Sparkz Hearth - the fire at the center, where your work, backers, and integrations gather."

### 1c. Supporter term

"backer" (Kickstarter, ~20M users) beats patron/collector/sponsor on plain-language + anti-speculation fit. Keep it. "Believer" is the ownable runner-up if a more ideological term is wanted later. Avoid "collector"/"sponsor" (speculation/transactional connotations).

## Finding 2 - The wheel-and-spokes vendor architecture

### 2a. How 9 platforms let vendors add integrations (survey)

| Platform | Manifest | Min files | Review | Per-tenant enable | Secrets |
|----------|----------|-----------|--------|-------------------|---------|
| Home Assistant | `manifest.json` (8-10 fields) | 2 | PR + CI | UI toggle | config_entries, encrypted |
| Obsidian | `manifest.json` + `versions.json` | 3 | PR to releases repo, GH Actions | one-click toggle | plugin data.json |
| Raycast | `package.json` (custom schema) | 2 | CLI + marketplace | install/toggle | Preferences, encrypted |
| n8n | TS node class | 1 | file-discovery | per-workflow | n8n DB, encrypted |
| Sentry | config-driven (OAuth + webhook) | 10+ | manual + OAuth | org + project | OAuth vault, HMAC webhooks |
| Backstage | `package.json` + `plugin.ts` | 4+ | build-time wiring | rebuild | env vars (AVOID) |

### 2b. elizaOS - what to selectively copy

elizaOS's `Plugin` interface (`packages/core/src/types/plugin.ts`) is far richer than Sparkz's 3-seam `CapsulePlugin`: lifecycle hooks (`init`/`dispose`/`applyConfig`), `services`, `actions`/`providers`/`evaluators`, **`connectorSources`** (a generic connector type), **`routes`** (plugins add API routes), `config` schema, `dependencies`, `autoEnable`, `priority`. **Copy selectively:** the generic connector/spoke type, `init` lifecycle, declared `config` schema, and `dependencies`. **Skip** the heavy agent-runtime pieces (evaluators, model handlers, chat pre-handlers) - Sparkz is not an agent runtime.

### 2c. The recommended Sparkz spoke pattern (Home Assistant + Obsidian + Raycast + Sentry hybrid)

A vendor adds a spoke with **one folder + one JSON manifest + one code entry**, opens **one PR** to a registry file, CI validates, a community toggles it on per-Hearth. Sample manifest:

```json
// src/spokes/<vendor-tool>/spoke.json
{
  "id": "audius-catalog",
  "name": "Audius Catalog",
  "version": "1.0.0",
  "author": "audius",
  "description": "Pull an artist's Audius catalog into their Hearth.",
  "type": "connector",
  "permissions": ["read:hearth", "write:receipts"],
  "config": {
    "AUDIUS_APP_NAME": { "required": true, "secret": false, "description": "Audius app name" }
  },
  "webhook": { "url": "https://vendor.example/hook", "signing": "hmac-sha256" },
  "minSparkzVersion": "1.0.0"
}
```

**Review flow:** vendor PRs the spoke folder + a one-line add to `spokes/registry.json` -> CI validates the manifest schema + permission scopes -> auto-merge if clean, human review only for dangerous perms -> registry syncs. **Enablement:** the existing `capsule_plugins` table (rename to `hearth_spokes`) already does per-Hearth toggle + config; `setCapsulePlugin` -> `setHearthSpoke`. **Safety (from Sentry/Raycast):** secrets never in the manifest (server-only config, as `configSchema.secret` already enforces); explicit declared permissions; HMAC-SHA256 on any webhook; version-pin spokes to a compatible Sparkz version; a broken/malicious spoke is toggle-off-able per-Hearth and never blocks the hub.

### 2d. Wheel-and-spokes principles (keep the hub stable)

1. **Dependency direction points inward** - spokes depend on the Hearth's stable interfaces; the Hearth never imports a spoke. (Sparkz already does this: plugins fan INTO the adapter registries.)
2. **Stable, versioned interfaces** - the spoke contract (`SignalSource`/`BackingProvider`/`ApprovalChannel` + new `Connector`) is the API; add fields, never break them.
3. **Capability-based registration** - a spoke declares what it provides + needs; the hub grants only that. No implicit access.
4. **A spoke failing is isolated** - one broken spoke degrades to off, never takes the Hearth down (the code already `try/catch`es + defaults-to-enabled-if-missing).

## Finding 3 - ZAOification (build on the existing rebrand audit)

The existing `rebrand-audit-zao-lens.md` verdict holds: **the rebrand is surface, not soul.** The anti-speculation spine ("start with a spark, not a token"), Meme Receipts ("receipts over claims"), OSS-first + Farcaster-native, and honest empty states are already pure ZAO. The gap is visual + belonging:

- **P0 (hours of work, high signal):** Space Grotesk + JetBrains Mono; ZAO Gold `#FFD700` as the on-chain/CTA accent; add "Part of The ZAO" with an estate link; reframe graduation as "to independence (a token only if it fits)."
- The **Hearth rename reinforces belonging** - a distinct, ownable, ZAO-flavored core noun that isn't a generic collided word.
- Word hygiene: drop "ecosystem" (ZAO voice-guide jargon); prefer "Part of The ZAO."

## Also See

- Sparkz `docs/strategy/rebrand-audit-zao-lens.md` (the ZAO-lens brand audit this extends)
- Sparkz `docs/strategy/positioning.md` (OSS-monetization frame)
- Sparkz `docs/strategy/graduation-timing.md` (launch = readiness state)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Land the naming decision doc, review + merge to ZAOOS main | @Zaal | PR review | 2026-08-11 |
| Ship the `Capsule -> Hearth` rename as one clean PR in bettercallzaal/sparkz (DB type, `capsule_plugins` -> `hearth_spokes`, `/c/[slug]` copy, all UI/copy), build green | @Zaal | PR merged | 2026-08-15 |
| Ship the generic `Connector`/spoke seam + `spoke.json` manifest + `spokes/registry.json` + CI validator in sparkz, with one example vendor spoke | @Zaal | PR merged | 2026-08-22 |
| Ship the P0 ZAOification (Space Grotesk + JetBrains Mono, #FFD700 accent, "Part of The ZAO", graduate-to-independence) in sparkz | @Zaal | PR merged | 2026-08-18 |
| Write CONTRIBUTING "Add a spoke in 3 files" guide so a vendor can self-serve | @Zaal | doc PR merged | 2026-08-22 |

## Sources

- [Capsule Wallet - Crunchbase](https://www.crunchbase.com/organization/capsule-wallets) [FULL]
- [Capsule Social - TechCrunch](https://techcrunch.com/2021/03/09/capsule-gets-1-5m-to-build-super-simple-decentralized-social-media/) [FULL]
- [Sparkball - PlayToEarn](https://playtoearn.com/blockchaingame/sparkball) [FULL]
- [Kickstarter - What are the basics (backer term)](https://help.kickstarter.com/hc/en-us/articles/115005028514-What-are-the-basics) [FULL]
- [elizaOS Plugin interface - packages/core/src/types/plugin.ts](https://github.com/elizaos/eliza/blob/main/packages/core/src/types/plugin.ts) [FULL]
- [Home Assistant - integration manifest](https://developers.home-assistant.io/docs/creating_integration_manifest) [FULL]
- [Obsidian sample plugin (manifest.json + versions.json)](https://github.com/obsidianmd/obsidian-sample-plugin) [FULL]
- [Raycast extensions](https://github.com/raycast/extensions) [FULL]
- [Sentry integration platform (webhook + HMAC)](https://docs.sentry.io/integrations/integration-platform/) [FULL]
- [Backstage - structure of a plugin](https://backstage.io/docs/plugins/structure-of-a-plugin/) [FULL]
- [n8n](https://github.com/n8n-io/n8n) [FULL]
- Sparkz codebase (grounding): `src/lib/plugins/{types,built-in,capsule-config}.ts`, `src/lib/adapters/*`, `docs/strategy/*` [FULL - read directly this session]
