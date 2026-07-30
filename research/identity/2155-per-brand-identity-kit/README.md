# 2155 - Per-Brand Identity Kit (a fleet of agent identities, one per brand)

**Date:** 2026-07-30
**Status:** Design (spec). Non-gated plumbing = assistant builds; account creation = Zaal's clicks.
**Owner:** Zaal
**Extends:** [[2154]] (ZOE digital identity + legal body) - this is 2154 generalized from one agent to a fleet.
**Siblings:** [[project_zai_community_agent]], [[project_zol_farcaster_agent]], [[project_zoe_soul_architecture]], [[project_icm_boxes]], [[project_zao_midao_legal_body]], doc 601 (agent-stack cleanup - the "no new bots without a doc" rule).

---

## The vision (Zaal, 2026-07-30, verbatim intent)

Not just an email for ZOE - a **person-like identity per brand**: "an account that can make emails and socials, and make an agent with its own emails and socials for each brand we have." Each ZAO brand gets an agent identity = **{ email + social handles + credentials + persona }**, each able to read its own inbox, draft/post to its own socials, and be run as an agent - all on shared plumbing, all human-gated at the one irreversible step (account creation + outbound send).

This is doc 2154's 3-rung ladder (email -> accounts -> legal body) **replicated per brand**, on one shared runtime.

## The one primitive that makes this cheap: AgentMail (already in the repo)

ZOE already owns a real, fully-programmatic mailbox - `zoe-zao@agentmail.to` - read via the AgentMail API (`api.agentmail.to/v0/inboxes/<inbox>/messages`, keyed on `AGENTMAIL_API_KEY`), in `bot/src/zoe/inbox-ingest.ts`. It is PII-scrubbed, deduped, best-effort, and needs NO Google connector and NO app-password. That file is the template for every brand's inbox.

**Decision: each brand's email = its own AgentMail inbox + own API key.** Reasons: (1) truly separate inbox per brand (own messages, own key, own dedup log); (2) programmatic read+send with zero human-in-the-loop for READING (the gated part is only the send); (3) `inbox-ingest.ts` clones per brand almost verbatim; (4) AgentMail supports custom domains, so a branded human-facing address (e.g. `zoe@thezao.com`, `hey@wavewarz.com`) can be AgentMail-backed - the address people see is branded, the inbox behind it is the agent's.

Note on the Google alias done this session: `zoe@thezao.com` was created as a Google Workspace alias (lands in info@thezao.com). That is fine as the human-branded face, but the AGENT reads via AgentMail. If we want zoe@thezao.com itself agent-readable without the Google connector, route/forward it to an AgentMail inbox (or mint the AgentMail inbox on the thezao.com domain). Either works; AgentMail is the machine layer.

## The brands (canonical, from the ICM box registry)

The ICM boxes ([[project_icm_boxes]], [[icm-grounding]]) ARE the brand registry - each identity should be GENERATED FROM its box (name, one-liner, voice), never hand-written in parallel (that is how bios drift - icm-grounding.md). Candidate first wave (in priority order):

| Brand | ICM box | Agent identity | Persona source |
|-------|---------|----------------|----------------|
| The ZAO | `thezao` | ZOE (orchestrator) / ZAI (community face) | thezao box + [[project_zoe_soul_architecture]] |
| WaveWarZ | `wavewarz` | brand agent | wavewarz box |
| ZABAL Games | `zabalgamez` | brand agent | zabalgamez box |
| Sparkz | `sparkz` | brand agent | sparkz box + [[project_sparkz_configurable_ai_advisor]] |
| COC Concertz | `coc-concertz` | brand agent | coc-concertz box |
| POIDH | `poidh` | brand agent | poidh box |

Taxonomy stays LOCKED (CLAUDE.md): ZOE = private orchestrator, ZOL = social/Farcaster, ZAI = community. A per-brand agent is a **persona block on the shared runtime**, NOT a new Telegram bot (doc 601 "no new bots without a doc"; brand voices = persona blocks, not separate bot processes). The "fleet" is one runtime wearing many faces, not many bot tokens.

## Architecture - one runtime, N identities

```
                 shared ZOE runtime (bot/src/zoe/, on the Pi)
                 |
  per-brand config (identities.json)  --- one row per brand:
     { brand, agentmail_inbox, agentmail_key_ref, socials:{...}, persona_ref, icm_box }
                 |
   +-------------+-------------+-------------+
   | inbox-ingest (per brand)  | social-draft (per brand) | persona (per brand)
   | clone of inbox-ingest.ts  | draft->approve->send     | generated from ICM box
```

- **identities.json** (the fleet registry): one entry per brand. Credential VALUES never live here - only *references* to secrets in `~/.zao/private/` (secret-hygiene.md, agent-loops rule 15). Shape: `{ brand, email:{inbox, keyRef}, socials:{farcaster, x, ...handles}, personaRef, icmBox }`.
- **Email layer:** `inbox-ingest.ts` parameterized by inbox+key (today it hardcodes `zoe-zao@agentmail.to`; generalize to take the inbox from identities.json). Reading is autonomous + PII-scrubbed. Sending is gated.
- **Social layer:** per-brand draft generated from the ICM box voice (reuse the `/socials` skill's voice rules), surfaced to Zaal for approval, posted via the existing publish path ([[project_zoe_post_slate]], `src/lib/publish/`). Never auto-posts.
- **Persona layer:** each brand's voice = a persona block generated from its ICM box, injected like ZOE's soul blocks ([[project_zoe_soul_architecture]]).

## What the assistant builds vs what Zaal clicks (per brand)

| Piece | Who |
|-------|-----|
| identities.json registry + schema | Assistant |
| Generalize inbox-ingest.ts to read any brand's AgentMail inbox | Assistant |
| Per-brand persona block generated from the ICM box | Assistant |
| Per-brand social draft->approve->send wiring (reuse /socials + publish path) | Assistant |
| **Create the AgentMail inbox for a brand** (or the Google alias) | **Zaal (gated - account/resource creation)** |
| **Create each social account** (Farcaster, X, etc.) + solve any human-check | **Zaal (gated - account creation, CAPTCHA)** |
| **Capture each account's credential/app-password/API key -> ~/.zao/private/** | **Zaal (gated - the assistant never enters passwords)** |
| **Approve every outbound post/DM** | **Zaal (gated - outbound)** |
| **Form a legal body for an identity (OtoCo/MiDAO)** when it needs to own things | **Zaal (gated - paid, onchain)** |

## The hard boundary (stated once, applies to every brand)

The assistant can build all the plumbing and can READ + DRAFT autonomously. It **cannot**: create accounts, enter passwords, solve CAPTCHAs, or send outbound without approval. Those are prohibited/gated by the operating rules AND are exactly what a CAPTCHA is designed to stop a bot from doing. So "an agent that makes its own accounts unattended" is not buildable as an autopilot; the correct shape is **agent-assisted, human-at-the-signup-click**. What makes an agent legitimately *own* accounts (vs risk-of-ban puppeting) is the legal body - rung 3, per identity, when it matters.

## Batchable click-list for Zaal (so account creation is one sitting, per brand)

For each brand you want live, in one session:
1. Mint the email inbox (AgentMail inbox on the brand domain, OR a Google alias) - capture the API key / creds to `~/.zao/private/<brand>-mail.json` (chmod 600).
2. Create the social accounts you want that brand to have (Farcaster, X, ...) using that email - capture creds/keys to `~/.zao/private/<brand>-socials.json`.
3. Tell the assistant the brand is provisioned; it wires identities.json + persona + ingest + draft path, PR-only.

## Guards kept (every brand)

- Account creation / passwords / CAPTCHA: PROHIBITED for the assistant - always Zaal.
- Outbound (posts/DMs): human-gated (agent-loops rule 8). Reading is autonomous.
- One runtime owns each identity's credentials/session; never split across two pollers (agent-loops rule 9).
- Secrets + per-brand keys: `~/.zao/private/` only, chmod 600, never printed/committed (secret-hygiene.md).
- PII from any inbox: scrubbed before it touches memory (pii-hygiene.md; inbox-ingest.ts already does this).
- Brand copy generated FROM the ICM box, never hand-written in parallel (icm-grounding.md).
- No new Telegram bots - each brand is a persona block on the shared runtime (doc 601).

## Open decisions (for Zaal)

1. **First brand after ZOE:** WaveWarZ (highest external pull) or ZABAL Games (active builders)?
2. **Email backing:** AgentMail-per-brand (recommended, fully programmatic) vs Google aliases (human-branded but needs connector/app-password for the agent to read).
3. **Scope of wave 1:** all 6 brands, or prove 2 (ZOE + one) then template?
4. **Social autonomy:** draft-and-approve (recommended) vs eventually-autonomous-once-legal-body-exists (rung 3 gated).

## Source

Zaal, 2026-07-30 (this session): the vision above, articulated live while setting up zoe@thezao.com. Grounding: `bot/src/zoe/inbox-ingest.ts` + `inbox-triage.ts` (the AgentMail template, read live), the ICM box registry ([[project_icm_boxes]]), doc 2154 (the single-agent ladder this generalizes), doc 601 (no-new-bots rule).
