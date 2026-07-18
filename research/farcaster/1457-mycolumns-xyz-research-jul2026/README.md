# 1457 — mycolumns.xyz Research (Jul 2026)

> **Type:** STANDALONE
> **Status:** RESEARCH COMPLETE
> **Owner:** Zaal
> **Created:** 2026-07-18

---

## What It Is

**mycolumns.xyz** (also known as Columns) is a multi-column Farcaster desktop client — essentially TweetDeck for Farcaster. It lets users view and manage multiple Farcaster feeds simultaneously in a column-based layout, targeting power users and community managers who monitor multiple channels, keywords, or accounts at once.

| Field | Value |
|-------|-------|
| URL | mycolumns.xyz |
| Type | Farcaster client (web app, desktop-optimized) |
| Format | Multi-column feed manager |
| Status | Private beta (as of Jul 2026); Mini App available |
| Team | Not publicly disclosed |
| Pricing | Not yet disclosed; no token |
| Network | Farcaster (Base) |

---

## Why It Was Flagged for ZAO Research

ZAO operates multiple Farcaster channels (`/zao`, `/cocconcertz`, `/zaofestivals`) and has two active Farcaster-posting entities (@bettercallzaal personal, ZOL @zolbot). Zaal is also building zaalcaster (his own Farcaster client). mycolumns.xyz is potentially:
- A daily-driver tool for managing ZAO's Farcaster presence
- A competitive reference for zaalcaster's feature backlog
- A collaborator or integration target (if they open APIs)

---

## Feature Comparison vs ZAO Needs

| Use case | mycolumns.xyz | zaalcaster (current) |
|----------|--------------|----------------------|
| Multi-channel monitoring (/zao + /cocconcertz + /zaofestivals) | Yes (core feature) | No — single feed |
| Power-user feed management | Yes | Partial (in backlog — doc 969) |
| ZAO-specific features (ZOL integration, ZABAL context) | No | Yes (designed for this) |
| Scheduling / ZOE automation | Unknown | Not yet built |
| AI digest / priority triage | Unknown | In backlog (doc 969) |
| Mobile | Unknown (desktop-optimized) | Not yet |

---

## Recommendation

**Use mycolumns.xyz as a reference, not a daily driver — and accelerate zaalcaster's multi-column feature.**

1. **Try it in private beta.** Zaal should request access and evaluate the column layout UX before building the equivalent in zaalcaster. The multi-column feature is in zaalcaster's backlog (doc 969) — seeing a live implementation saves design time.

2. **Don't replace zaalcaster.** mycolumns.xyz has no ZAO-specific integration (ZOL context, ZABAL Gamez scoring, Empire Builder, $zaalcaster token). Those are zaalcaster's moat. A generic multi-column client will never have them.

3. **Watch for API openings.** If mycolumns.xyz opens a public API or integrations layer, ZOE could potentially read from columns as a secondary feed source. Low priority for now.

4. **Add to zaalcaster backlog:** multi-column view is a P2 feature per doc 969. mycolumns.xyz validates that power-user Farcaster clients need this. Keep it on the list.

---

## Decision Summary

| Action | Who | When |
|--------|-----|------|
| Request beta access to mycolumns.xyz | Zaal | This week |
| Evaluate for ZAO daily-driver potential | Zaal | After beta access |
| Add multi-column to zaalcaster roadmap (already in doc 969 backlog) | Zaal/Hurricane | Q3 2026 |
| Revisit mycolumns.xyz if they open public APIs | Zaal | TBD |

---

## Related Docs

- [969 — zaalcaster Daily-Driver Feature Backlog](./969-zaalcaster-daily-client-backlog/)
- [987 — $zaalcaster Support-Token Growth Playbook](./987-zaalcaster-support-token-growth-playbook/)
- [1451 — /zaofestivals Farcaster Channel Launch](./1451-zaofestivals-farcaster-channel-launch-jul2026/)
- [1441 — ZAO Farcaster Channel Growth Strategy H2 2026](./1441-zao-farcaster-channel-growth-strategy/)
