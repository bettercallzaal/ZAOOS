---
topic: business
type: decision
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs: 893, 894, 899
original-query: "Sven from Incented - research the person (Sven), the company Incented, and Borker (borker.xyz, their AI social-content automation tool). Context: Sven is Zaal's friend; potential ZAO partnership; ZAO wants to use Borker for ZOL/ZAO social automation (driven via computer-use on the Pi). Tier STANDARD."
tier: STANDARD
---

# 905 - Sven / Incented / Borker (use Borker for ZAO social; warm partner)

> **Goal:** Decide how ZAO uses Borker for ZOL/ZAO social automation and how to frame the Incented partnership. Sven is Zaal's friend.

## Key decisions (recommendations first)

| Decision | Call | Why |
|----------|------|-----|
| Which Borker plan | **BYOK** (bring your own Anthropic key, ~$1-10/mo) | ZAO already has Claude/Anthropic access. Starter $99/mo and Pro $299/mo are overkill at ZAO's posting volume. |
| Use Borker directly vs Pi computer-use | **Use Borker directly first** (5-min signup SaaS), add Pi computer-use only if you want ZOL fully hands-off | Borker is a normal web app with login; driving it via headless computer-use is fragile + unnecessary for v1. The Pi browse path is a later "set it and forget it" upgrade. |
| Borker vs build into ZOL/ZOE | **Use Borker** | It already does multi-platform (X, LinkedIn, Farcaster, Paragraph) + scheduling + news-reactive + blog-to-social. ZAO's `bot/src/zoe/posts/` + ZOL cover only Farcaster drafts. Don't rebuild a friend's product. |
| Incented partnership | **Pursue beyond Borker** - warm intro already exists (friendship) | Incented = grant-accountability ("make grant money trackable + impactful"). Directly relevant to ZAO's grant funds (ZAO Fund on Artizen, Gitcoin) + contributor rewards (ZOLs). |

## Who / what

- **Sven H** - second-time Web3 founder, "on-chain | off-grid", focus on **regenerative incentive design** (values-alignment over extractive growth). Founder of Incented.co. Currently also exploring Bhutan's Gelephu Mindfulness City (regenerative incentives + decentralized governance). X [@iamsvenh](https://x.com/iamsvenh/), Farcaster [@svenh](https://farcaster.xyz/svenh), [svenh.com](https://svenh.com). NOTE: not the Farcaster `@sven` (Sven Meyer, FID 17818) - different person, do not conflate.
- **Incented** (incented.co, Farcaster [@incented](https://farcaster.xyz/incented) FID 1104192) - "We make grant money trackable and more impactful through programmable accountability." A web3 grant-accountability / programmable-incentive platform.
- **Borker** (borker.xyz) - **an Incented project** (confirmed: @incented "Borker.xyz is an Incented project. Let us bork in your voice"). AI social-content automation: learns your brand voice and produces platform-native content for **X, LinkedIn, Farcaster, Paragraph**, with scheduling, news-monitoring reactive posts, and blog-to-social redistribution, via a "Command Center" calendar.

## Borker pricing (verified 2026-06-25)

| Plan | Cost | Limits | Best for ZAO? |
|------|------|--------|---------------|
| Starter | $99/mo | 100 AI gen/mo, 2 seats | No - overkill |
| Pro | $299/mo | 500 AI gen/mo, 10 seats | No - overkill |
| **BYOK** | **own Anthropic key (~$1-10/mo)** | uses your Claude API key | **YES** |
| Lifetime | one-time (unlimited via own key) | unlimited gen via your key | Maybe, if you commit |

No public API; it integrates Anthropic's Claude API (BYOK/Lifetime = you supply the key). Yearly plans save 10%; promo code field at checkout (ask Sven for one).

## How ZAO uses it

1. Zaal signs up (BYOK, plug ZAO's Anthropic key). Connect X + Farcaster (+ Paragraph for long-form).
2. Configure brand voice = ZAO's Year-of-ZABAL voice (spartan, no emojis, no em dashes) - matches what's already in `bot/src/zoe/memory.ts`.
3. Use Borker as the multi-platform content surface; ZOL (Pi) stays the Farcaster *reply/scout* agent. Borker = outbound campaigns; ZOL = inbound mentions + curation. Complementary, not duplicate.
4. (Later) Pi computer-use can drive Borker hands-off if desired - the auth + the existing `~/cu/run.sh` capability make it possible, but it's a v2 nicety.

## Partnership angle

Incented's core (programmable grant accountability) maps onto ZAO's actual needs: the ZAO Fund on Artizen, Gitcoin rounds, and ZOL/ZOLs contributor credits. A friend-to-friend conversation could cover: (a) ZAO as a Borker design partner / case study, (b) Incented accountability rails for ZAO grant disbursement + contributor rewards, (c) cross-promo (Sven + ZAO both regen/web3-music adjacent).

## Also See

- [Doc 899](../../agents/899-zoe-agent-fleet-audit/) - ZAO agent fleet (ZOL, ZOE posts module = the existing social surface)
- [Doc 894](../../events/894-zol-launch-night/) - ZOL on Farcaster
- `bot/src/zoe/posts/` + `bot/src/zoe/memory.ts` - ZAO's existing social-draft + brand-voice code

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Sign up for Borker BYOK, plug ZAO Anthropic key, connect X + Farcaster | @Zaal | Action | This week |
| Set Borker brand voice to ZAO Year-of-ZABAL rules | @Zaal | Config | At signup |
| Ask Sven for a promo code + a Borker BYOK/Lifetime steer | @Zaal | DM | This week |
| Scope the Incented x ZAO partnership (grant accountability for ZAO Fund / ZOLs) | @Zaal | Convo | Next call |
| (v2) Wire Pi computer-use to drive Borker hands-off for ZOL | @Zaal/ZOE | Build | After v1 proves value |

## Sources

- [FULL] [borker.xyz](https://www.borker.xyz) - features, platforms, pricing tiers ($99/$299/BYOK/Lifetime), Anthropic-key integration (fetched 2026-06-25)
- [FULL] [borker.xyz/docs](https://www.borker.xyz/docs) - product capabilities (brand voice, scheduling, news monitoring, blog-to-social, Command Center)
- [FULL] [svenh.com](https://svenh.com) - Sven H bio, regenerative incentive design, founder of Incented, socials, Gelephu Mindfulness City
- [FULL - keyless scout, haatz] Farcaster @incented (FID 1104192) bio + casts confirming "Borker.xyz is an Incented project"; @svenh socials
- [PARTIAL] [WebSearch: Incented / Sven] - confirmed Sven H builds Incented.co (regenerative incentive design); general web3-incentive results otherwise
