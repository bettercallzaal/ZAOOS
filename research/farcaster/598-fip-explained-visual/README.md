---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: [593, 594, 595, 596, 597]
tier: STANDARD
original-query: "FIP 268 269 live activity visual explanation animated heartbeat stalker privacy stalking cooperative writer convention JFS signature Quilibrium OT magic trick (reconstructed)"
---

# 598 — FIP Live Activity: Visual Explorable Explainer

> **Goal:** Interactive HTML artifact: animated heartbeat + freshness, stalker attack walkthrough, cooperative-writer convention, JFS signature breakdown, Quilibrium OT, 5-app coalition, full stack diagram. Self-contained, no dependencies.

## What's in this doc

One file: [`live-at-explorer.html`](./live-at-explorer.html)

Open it in any browser. No build step, no dependencies, no internet required after load.

## What it covers (10 sections)

| # | Section | What you can do |
|---|---------|-----------------|
| 1 | What problem the FIP solves | Read the plain-English version |
| 2 | The heartbeat | Click "Start heartbeat" + watch the green dot. Stop it + watch the slot go stale after 5s |
| 3 | Why 5 seconds | Read the network-load tradeoff |
| 4 | The stalker problem | Step through how an adversary reconstructs co-location from public meta tags |
| 5 | Cooperative writer dance | Click "Juke writes activity" vs "ZAO writes presence" + see how the convention plays out |
| 6 | JFS signature | ASCII walkthrough of the 3-field envelope + 5-step verify |
| 7 | Quilibrium OT | Side-by-side "without OT" vs "with OT" reading the slot |
| 8 | The full stack | Top-to-bottom: user joins space → ZAO backend signs → Snapchain stores → other clients render |
| 9 | The 5-app coalition | Who's where, who builds what |
| 10 | What's actually next this weekend | The action list |

## Why HTML and not Mermaid

Mermaid renders OK in GitHub but doesn't animate. The heartbeat + freshness + cooperative-writer-yielding concepts only click when you SEE them happening. So HTML+JS, single file, no deps. Mobile-first, ZAO brand (navy + gold).

## How to open

```bash
# Mac
open research/farcaster/598-fip-explained-visual/live-at-explorer.html

# Or just double-click in Finder
```

## What this replaces / supplements

This doc doesn't supersede any prior research — it's a teaching artifact for Docs 593-597. If you (or anyone reading the research stack later) want the full technical details, the source docs cover it. This file is the warm-up.

## Key Facts in This File

| # | Fact | Source |
|---|------|--------|
| 1 | FIP #268 Stage 3: Review (moved from Stage 2 Draft May 3); FIP #269 Stage 2: Draft. Both authored by rishavmukherji. | GitHub discussions 268, 269 |
| 2 | Heartbeat every 1 second; freshness threshold exactly 5 seconds (per FIP #268 spec). | FIP #268 "Liveness and freshness" section |
| 3 | Cooperative writer convention: activity URLs preempt presence-only URLs (SHOULD not MUST). | FIP #268 "Cooperative writing convention" section |
| 4 | 3 HIGH-severity risks: stalking via LIVE_AT, co-location via speakerFids, permanent history. Risks 1+2 have app-layer mitigations; risk 3 unfixable (Snapchain immutable). | Doc 594 + 596 |
| 5 | Coalition: Juke (iOS LiveKit), Streamly (web Zego), Livecaster (chat-only), FarHouse (iOS+Android closed), Fireside (Base mini-app closed). | Doc 595 Coalition Map |
| 6 | JFS envelope: header + payload + signature, all base64url. Signed with Ed25519; verified against Snapchain app key registry. | FIP #269 "Manifest" section |

## Related Docs

- [Doc 593 — FIP Live Activity STANDARD](../593-fip-live-activity-zao-spaces/) — 5-PR action plan
- [Doc 594 — FIP Live Activity Deep Dive](../594-fip-live-activity-deep/) — threat model, precedents, load math
- [Doc 595 — FIP Live Activity: Adjacent FIPs & Coalition](../595-fip-live-activity-deeper/) — FIP gap map, coalition map, JFS code
- [Doc 596 — FIP Live Activity: Quilibrium Privacy Bridge](../596-fip-live-activity-quilibrium-privacy/) — OT + MPC mitigations, PR sequence
