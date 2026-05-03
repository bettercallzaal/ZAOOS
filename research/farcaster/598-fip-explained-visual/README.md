---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-03
related-docs: 593, 594, 595, 596, 597
tier: STANDARD
---

# 598 — FIP Live Activity Visual Explorable Explainer

> **Goal:** Make the FIP Live Activity research stack actually understandable. One self-contained HTML file you open in a browser. Animated heartbeat, stalker walkthrough, cooperative-writer dance, JFS breakdown, OT magic-trick, full stack diagram.

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

## Also See

- [Doc 593 — FIP Live Activity STANDARD](../593-fip-live-activity-zao-spaces/) — 5-PR action plan
- [Doc 594 — FIP Live Activity DEEP](../594-fip-live-activity-deep/) — threats + precedents + load
- [Doc 595 — FIP Live Activity DEEPER](../595-fip-live-activity-deeper/) — adjacent FIPs + coalition + JFS code
- [Doc 596 — Quilibrium Privacy Bridge](../596-fip-live-activity-quilibrium-privacy/) — Quilibrium mitigation matrix
- [Doc 597 — Hypersnap Install Reality Check](../597-hypersnap-install-prep/) — pre-purchase decision
