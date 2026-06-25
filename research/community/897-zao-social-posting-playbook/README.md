---
topic: community
type: guide
status: research-complete
last-validated: 2026-06-24
superseded-by:
related-docs:
original-query: "this is really bad for a post can we /zao-research more about posting (re: a flat ZABAL Gamez workshop announcement that read like an event listing)"
tier: STANDARD
---

# 897 - ZAO social posting playbook (Farcaster + X event announcements)

> **Goal:** Stop shipping flat, listing-style posts. A repeatable structure for ZAO/ZABAL Gamez announcements that earns reach on Farcaster and X in 2026.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Opening line | LEAD WITH A HOOK, never the event title or logistics | "Nobody cares about the date until they care about the event." The first 1-2 lines (before X's ~280-char "Show more" / Farcaster's ~80-120 visible chars) do all the work. |
| What you sell | OUTCOME, not a feature list | "onchain memberships, NFT tickets, token-gating" is a feature dump. Say what someone walks away able to DO. A feature list reads like a press release and dies in feed. |
| Links on X | PUT THE LINK IN THE FIRST REPLY, not the post body | X's 2026 algorithm cuts organic reach ~50% for posts with an external link in the body. A link-free post + link in reply-1 consistently outperforms. |
| Optimize for | REPLIES + BOOKMARKS, not likes | Replies carry ~54-75x the distribution weight of a like; bookmarks are a 2026 high-intent signal. End with a question or a take that invites reply. |
| Farcaster voice | SHORT, opinionated, builder-native; post in the channel (/zabal) | "A bad cast reads like a LinkedIn update ported into a crypto app." 320-byte cast / 1024-byte longcast. No hashtags - channels do that job. |
| Tagging | Credit the guest/partner by handle | A native @mention notifies them and invites a recast/quote = free amplification. Type @ in Firefly so the handle resolves per network (Farcaster vs X differ). |
| Hashtags | 0-2 max, only for a live/trending tag | 3+ hashtags add clutter and can trip spam filters; top-reach accounts use ~0. |

## Findings

### The structure (use for every announcement)

Hook -> Relevance -> Promise (outcome) -> Proof -> Logistics -> CTA. Lead with desire; logistics come AFTER. The three "sins" that kill event posts: generic copy ("join us for an amazing workshop"), no urgency, and a weak CTA ("link in bio").

### Hook formulas that work (crypto-native)

- Contrast / contrarian: "[Common belief]. What actually works: [your way]." (e.g. "Most platforms take a cut just to let you sell access to your own work.")
- Curiosity gap: open a question the reader has to tap to close.
- Stakes / identity: "If you've been [doing X] and [not getting Y]..." so the reader self-qualifies.
- Specific number / data point.
- Hot take / admission. Delete every hedge - state it directly.

### Platform mechanics (numbers)

- **Farcaster:** standard cast = 320 bytes; longcast = 1024 bytes (use for announcements). Only ~80-120 chars show in-feed before expand. Emoji/non-Latin burn the byte budget faster. URLs render a preview but still cost their full byte length.
- **X 2026 algorithm:** relevance score from engagement velocity (first 30-60 min), author credibility, and content-quality signals. External link in body = ~50% reach cut -> link in first reply. Replies ~54-75x likes; author replies boost ~75x. 0-2 hashtags. 5-8 posts/day is the ceiling before later-post visibility drops ~80%.
- **Event cadence:** first announcement ~4 weeks out, then speaker spotlight, social proof, urgency ("X spots left"), day-of "happening now", day-after recap. Rotate angles (outcome / lineup / logistics / proof / urgency) - do not repeat the same post.

### Worked example - the ZABAL Gamez x Unlock (Ceci Sakura) fix

- BEFORE (flat): opened with the title, then "what Unlock unlocks for creators and communities - onchain memberships, NFT tickets, token-gating." Feature list, no hook, link in body.
- AFTER (hook + outcome): "Most platforms take a cut just to let you sell access to your own work. Ceci from @unlockprotocol is coming to ZABAL Gamez to show the other way - ticket an event, gate a community, run memberships, all onchain, no dev needed." Link moved to the first reply on X.

### Where ZAO posts originate (codebase)

In zabalgames (the ZABAL Gamez Mini App), casts are composed through `assets/miniapp.js` -> `window.ZABAL.composeCast({ text, embeds, channelKey })`, which defaults to the `zabal` channel and prepends the builder's handle via `withZaal()`. Per-recording share copy comes from `scripts/ingest-recording.mjs` (`share_topics`) and the `data/daily-updates.json` feed. This playbook is the copy standard those share strings and the manual /clipboard posts should follow.

## Also See

- [Doc 896](../896-unlock-events-luma-setup/) - the Unlock + Luma event this playbook was first applied to.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Use the hook -> outcome -> (link in reply on X) structure for every ZABAL Gamez announcement | @Zaal | Standard | Ongoing |
| Update `share_topics` defaults in scripts/ingest-recording.mjs to hook-led lines | @Zaal | PR | Next content pass |
| Apply to the Ceci/Unlock post (done - clipboard ceci-unlock-post-v2) | @Zaal | Task | Done 2026-06-24 |

## Sources

- [X (Twitter) Content Strategy 2026 - Metadata Reactor](https://metadatareactor.com/blog/x-twitter-content-strategy-2026/) [FULL - algorithm mechanics, hook formulas, link-in-reply rule read in full]
- [How to Share Events on Social Media 2026 - Calen](https://www.calen.events/blog/share-events-social-media) [FULL - event-post structure, three sins, X thread template read in full]
- [How to Write Hooks That Stop the Scroll on Crypto Twitter - Web3Lists](https://web3lists.com/blog/article14) [PARTIAL - read the six hook types + multi-layer table via search highlights; full article not fetched]
- [Warpcast Post Generator - Postiz](https://postiz.com/tools/warpcast-post-generator) [PARTIAL - Farcaster cast culture, "lead with the point", credit-by-handle via highlights]
- [Warpcast Character Counter - Postiz](https://postiz.com/tools/warpcast-character-counter) [PARTIAL - 320/1024 byte limits, hook-in-first-80-chars via highlights]
- [Crypto Twitter Marketing Guide - LunarStrategy](https://www.lunarstrategy.com/article/crypto-twitter-marketing-guide-master-threads) [PARTIAL - hook = 30-40% of writing time, CTA per thread via highlights]
- [The Art of Event Announcement - Loopyah](https://loopyah.com/blog/selling/art-of-announcing-event) [PARTIAL - announcement element checklist, rotate-angles via highlights]
