---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs: 928, 2127, 2154, 2155, 2174, 601
original-query: "ZOE/agent HARNESS options - the best architecture for tapping ZOE (and the fleet) into different DEVICES (Mac, always-on Windows desktop, phone, VPS, Pi), different CHATS/surfaces (Telegram, Discord, Farcaster, zao-relay lanes, clipboard, AgentMail), and different BRANDS (ZAO, ZABAL, WaveWarZ, Sparkz, POIDH...). Recommend the architecture - how devices, chats, brands connect to ZOE without split-brain - and what to build next."
tier: DISPATCH
---

# 2178 - Agent Harness: One Orchestrator, Many Workers

> **Goal:** Decide how ZOE taps every device, every chat, and every brand from one place without split-brain - and the concrete build sequence to get there. Grounded in a 3-scout audit of the live system (2026-08-02).

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Where does the brain live | **Desktop = the single ORCHESTRATOR.** Always-on, dispatches work to every other node. (Zaal, 2026-08-02.) | Never sleeps; can reach any node over Tailscale; can dispatch to Pi/Mac/VPS/human. |
| 2 | What happens to the VPS | **VPS stays as the heavy WORKER** it already is - keeps the ZOE Telegram bot + the 9 brand loops; the orchestrator conducts it via the relay. No teardown. | The VPS is the current workhorse (systemd `zoe-bot.service` + 9 tmux loops + failover ladder). Ripping it out is pure risk for zero gain. |
| 3 | The ZOE Telegram bot | **KEEP it on the VPS (Option A).** The orchestrator drives it; the bot is not moved. | One-instance (Telegram 409s a second poller). The VPS instance is stable, systemd-managed, auto-deploying. Moving it is a migration with a hard failure mode and no upside. |
| 4 | Brands | **One brain wears any brand via the identity registry** (`identities.ts`) - NOT one bot per brand. | The infra is already built (registry + 7 ICM boxes + per-brand AgentMail), just unwired. Matches the "no new bots" rule (doc 601). |
| 5 | Worker autonomy (Mac/Pi) | **Gated-by-default.** A worker executes what the orchestrator dispatches, but anything outbound/spend/publish/merge bounces to Zaal via Telegram. | agent-loops rule 8 (PR-only + human gate is the circuit breaker). Loosen per-worker later if proven. |
| 6 | Trust between brands | **Wire the Spore trust layer (#2792) to a per-brand signing key** so inter-brand / DreamNet messages are signed. Later rung (needs the legal-body ladder, docs 2154/2155). | Today the Spore `issuer` is a plain string, not a key. Real signing is the DreamNet-federation unlock, not day-1. |

## The one-line architecture

**Desktop orchestrates -> the relay hub dispatches -> device-workers (VPS, Pi, Mac) and Zaal execute -> results flow back through the relay.** Brands are personas the orchestrator wears; the relay is the spine; one node owns any given job.

## Current state (grounded, 2026-08-02)

Three scouts audited the live system. Honest finding: **the harness mostly exists already** - it is a real backbone that feels less built than it is, plus one genuine split to resolve.

### Devices (who runs what - verified via SSH + `ps` + `tailscale status`)

| Node | Tailscale | Runs today | Role |
|------|-----------|------------|------|
| **VPS** (`vps`, 31.97.148.88) | online | `zoe-bot.service` (systemd) = the canonical ZOE Telegram bot; **9 tmux loops** (`zoe ww coc human zol zaostock fractal sparkz warpee`); provider failover `claude->codex->openrouter->ollama` (`loops-keepalive-failover.sh`, `provider-health.sh`); Ollama local; `fleet-json.sh`; `zoe-autodeploy.sh` (verify-then-deploy) | **Current de-facto brain + workhorse** |
| **Desktop** (`desktop-h2ov6da`, 100.72.152.63, Windows) | online | Relay-lane-`zoe` watcher (5-min tick) + repo auditor (opened ZAOOS PR #2786 unattended); always-on. **SSH not installed yet** (Zaal's pending one-time task) so it is a black box to the fleet. | **Target orchestrator** (Zaal's decision) |
| **Pi** (`ansuz`, 100.117.191.11) | online | ZOL Farcaster music scout (`zol-reply.js`, `zol-threads.js`, `zol-learn-zaal.js`); own signer | Independent Farcaster worker |
| **Mac** (`macbook-air-3`, 100.81.77.87) | online | Dev terminal; fleet monitor (`zao-fleet`, `zfleet`); no ZOE/relay daemon | Dev workbench + a potential worker |
| **Phone** (`iphone-15`) | online | Blink/mosh remote terminal | Remote access only |

**The split to resolve:** there are two things called "zoe" on two boxes - the VPS runs the actual bot + brand loops; the desktop runs the new watcher/auditor. They do **not** conflict (different resources: a bot token vs a relay lane), but they are not yet one brain. Decision #1-3 resolve this: desktop conducts, VPS keeps playing.

### Chats / surfaces (how messages move)

**Three LIVE bidirectional loops** (the harness is further along than it feels):
1. **Relay hub** (`zao-relay`, Supabase row `legacy_id=9000`, lanes = free strings, atomic `relay_hub_merge` RPC) - the **spine**. Terminal <-> lane <-> terminal, fully live. Auto-pull hook injects unread into Claude Code.
2. **Relay <-> Telegram bridge** (`relay-bridge.ts`, gated `ZOE_RELAY_TG_ENABLED`) - a lane message pushes to Zaal's DM with Reply/Ack; his tap routes back to the sender's lane. `tg_pushed` flag prevents terminal/TG stealing each other's mail.
3. **QA bridge** (`zao-ask` / `zao-ask-dm` / `zao-ask-check` / `zao-ask-chain` / `zao-ask-wait`) - terminal asks Zaal a button-question in TG; answer polls back. Cascade support.

**Unidirectional surfaces (the gaps):** AgentMail (inbound, ZOE-internal), clipboard (outbound display only), Discord (boots but no return channel), Farcaster (read-only, no message->agent route).

**Bots (one-poller each, rule 9):** `@zaoclaw_bot` (ZOE, VPS systemd), `@ZAOstockTeamBot` (Hermes/ZAOstock), `@zaodevz_bot`+`@hermes_bot` (Devz pair).

### Brands (whose identity speaks) - BUILT BUT NOT WIRED

- **ICM boxes:** 7 live (`thezao, wavewarz, zabalgamez, sparkz, fractal, zao-assistant, zaal`) - canonical per-brand context, read via `~/bin/icm`.
- **Identity registry:** `bot/src/zoe/identities.ts` - a full `BrandIdentity` struct (`brand -> {email:{inbox,keyEnv}, icmBox, socials, personaRef}`) + `identities.example.json`. **`loadIdentities()` is defined and never imported into `index.ts`/`concierge.ts`** - the runtime still operates as a single identity (ZOE only).
- **Per-brand email:** AgentMail interface parameterized per brand; ZOE's inbox live, others not wired.
- **Persona:** currently a fixed path (`~/.zao/zoe/persona.md`); `personaRef` is parsed but never loaded.
- **Signing:** Spore `receipt.ts` `issuer` is a **string**, not a key. Real per-brand signing = a later rung.

**The gap:** making one brain wear any brand is **~2-3 additive PRs of wiring** (import the registry, load the active brand's persona + inbox + box), not a from-scratch build.

## Target architecture

```
                         ORCHESTRATOR  (Desktop, always-on)
                         wears a brand persona per turn
                                    |
                          RELAY HUB  (Supabase, lanes, atomic merge)  = the spine
             ______________________|___________________________
            |            |             |            |           |
         lane:vps     lane:pi      lane:mac    lane:zoe...    Zaal (TG)
            |            |             |         (bridge)     human worker
        WORKER        WORKER        WORKER                   gated actions:
        VPS: bot +    Pi: ZOL       Mac: dev/               send/spend/
        9 loops       Farcaster     build tasks             publish/merge
            |            |             |
        results ------> back up the relay ------> orchestrator ------> surfaces
```

- **One node owns any job** (rule 9): the orchestrator assigns a lane; only that worker executes it. No two brains on one resource.
- **Brands = personas** the orchestrator loads per message (registry -> ICM box + persona + inbox + eventual signing key).
- **Humans are a worker node**: gated actions dispatch to Zaal over Telegram; he taps; the loop continues.
- **The relay is the only cross-node contract** - devices don't call each other directly; they post/read lanes. This is what keeps it debuggable and split-brain-free.

## Build sequence (what to build, in order)

1. **Worker-executor half of the bidirectional loop** (integration #1). Today device watchers *log/ack* a dispatched relay; add the *execute-and-report-back* half so `lane:mac` / `lane:pi` become real dispatch targets. The relay bridge already carries the message; wire the "run it" side, gated-by-default (decision #5). **This is the keystone** - it's what turns "one brain" into "one brain that can act everywhere."
2. **Make the desktop dispatchable.** Install OpenSSH Server on the desktop (Zaal's one-time elevated task) so the orchestrator is reachable by the fleet, not just a black box.
3. **Wire the brand identity registry** (integration, brands). Import `loadIdentities()` into the concierge; load the active brand's persona (`personaRef`) + inbox instead of the hardcoded ZOE path. ~2-3 PRs, purely additive.
4. **Spore-trust receipts per brand** (integration #2). Wire `#2792` so a brand's receipts are signed with its own key (needs a per-brand key, ties to docs 2154/2155). Later rung; the DreamNet-federation unlock.
5. **Close the unidirectional gaps** as needed: a Discord return-channel and a Farcaster->lane route (both currently one-way).

## Open decisions for Zaal (recommendations above; confirm or override)

- **Decision #3 - the ZOE bot:** keep on VPS (A, recommended) vs move to desktop (B).
- **Decision #5 - worker autonomy:** gated-by-default (recommended) vs more rope for Mac/Pi.

## Also See

- [Doc 928](../928-agent-loop-best-practices/) - the loop rulebook (rule 8 gate, rule 9 one-instance).
- [Doc 2127](../2127-loop-harness-engineering-anthropic/) - Anthropic harness engineering (orchestrator-worker basis).
- [Doc 2155](../../identity/2155-per-brand-identity-kit/) - per-brand identity kit (the registry this doc wires).
- [Doc 2154](../../identity/2154-zoe-digital-identity-legal-body/) - the signing-key / legal-body ladder for decision #6.
- [Doc 601](601-agent-stack-cleanup-decision/) - the "no new bots; brand voices = persona blocks" decision.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install OpenSSH Server on the desktop (elevated) so the orchestrator is fleet-reachable | @Zaal | Manual (one-time) | 2026-08-04 |
| Build the worker-executor half of the relay loop (execute + report back, gated-by-default) - PR merged | @Zaal | PR | 2026-08-09 |
| Wire `loadIdentities()` into the ZOE concierge + load per-brand persona/inbox - PR merged | @Zaal | PR | 2026-08-11 |
| Confirm decision #3 (bot on VPS vs desktop) + #5 (worker autonomy) - recorded in this doc | @Zaal | Decision | 2026-08-04 |
| Wire Spore-trust receipts to a per-brand key (after the signing-key rung) - PR merged | @Zaal | PR | wontfix (blocked on doc 2154 rung 3) |

## Sources

- [FULL] Device-topology audit (this session, 2026-08-02) - `tailscale status`, VPS `ps aux`/`systemctl`, `loops-keepalive-failover.sh`, `provider-health.sh`, `zoe-autodeploy.sh`, `fleet-json.sh`, Pi ZOL processes.
- [FULL] Chat/surface audit (this session) - `~/bin/zao-relay` (292 lines), `bot/src/zoe/relay-bridge.ts`, `zao-ask*` tools, `bot/src/zoe/index.ts`, bot->token map.
- [FULL] Brand-identity audit (this session) - `bot/src/zoe/identities.ts` + `identities.example.json`, `~/bin/icm` + `icm-boxes/*.llm.txt` (7 boxes), `bot/src/zoe/inbox-ingest.ts`, `src/lib/spore/receipt.ts`, docs 2154/2155.
- [PARTIAL - not found in repo as a numbered doc] doc 2174 "bidirectional relay" - the implicit push/pull inference is implemented at the command layer (`feedback_zoe_auto_relay.md`) but was not located as a numbered research doc; treat the command-layer behavior as the spec.
- [FULL] `.claude/rules/agent-loops.md` (rules 8, 9), CLAUDE.md "Primary Surfaces" + "no new bots".
- [FULL] PR #2792 (Spore trust layer), PR #2786 (desktop auditor's unattended find).
