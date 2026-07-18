# ZAO Newsletter: Paragraph Paid Tiers — Activation Guide (July 2026)

**Doc number:** 1348  
**Status:** READY-TO-EXECUTE — one Zaal action to go live  
**Context:** Doc 1344 identified the ZAO Newsletter as the fastest path to profitability ($150/mo infra covered by 30 paid subscribers at $5/mo). This doc is the implementation guide.  
**Board task:** ae0a9fe1 (2-year profitability question), 48b30545 (Paragraph posting cleanup)  
**Related docs:** 1344 (2-year profitability framework), 322 (Paragraph + Publish.new agent commerce)

---

## The One Action

Go to [app.paragraph.com/thezao/settings/monetization](https://app.paragraph.com/thezao/settings/monetization) and enable paid subscriptions.

Everything below is context for how to configure it, what to price it at, and what to say in the announcement.

---

## Why Now

- 500+ free subscribers already reading daily
- 400+ editions published — the track record is there
- The ZAO infrastructure costs ~$150/mo (Vercel + VPS + OpenRouter + Neynar) — 30 paid subscribers at $5/mo covers it entirely
- Paragraph paid tiers require zero dev work — no code, no PR, no API key
- The COC #7 show is happening TODAY — community engagement is at a seasonal high

---

## Pricing Recommendation

| Tier | Price | What it unlocks | Target |
|------|-------|-----------------|--------|
| Free | $0 | Daily ZM newsletter, all public content | Everyone (current 500+) |
| Supporter | $5/mo | Nothing extra — just sustaining the ZM | 30-60 people (6-12% of list) |
| Builder | $15/mo | Optional: early access to research docs, "builder" Farcaster tag | 5-10 people (1-2% of list) |

**Start with just "Supporter" at $5/mo.** Don't add a paywall or withhold content — the value is "sustaining something you already rely on," not "paying for access."

The "Builder" tier can be added later if demand is there.

---

## Step-by-Step Setup (Paragraph)

1. Log in at [app.paragraph.com](https://app.paragraph.com) as the @thezao publication
2. Go to **Settings → Monetization** (or Publication Settings → Subscriptions)
3. Enable paid subscriptions
4. Set Supporter tier: $5/mo, $50/yr (10% discount vs monthly)
5. Tier name: "ZM Supporter" or just "Supporter"
6. Description: "Sustaining the daily ZM newsletter so Zaal can keep shipping without worrying about server costs."
7. Enable Stripe — Paragraph handles the payment processing
8. Turn off content gates initially — keep all content free, paid tier is just a tip jar

---

## The Launch Announcement Copy

**Paragraph post body (publish as ZM edition, today or tomorrow):**

```
ZM.

Starting today, there's a "Supporter" tier for the newsletter.

$5/month.

Nothing changes. You still get every ZM, every day, for free. 
The Supporter tier is for people who want to keep it running.

30 people at $5/month covers the servers. That's the whole infrastructure 
cost for cocconcertz.com, thezao.xyz, the ZOE bot fleet, and everything 
that runs the ZAO on the backend.

If the daily ZM is worth $5/month to you, the link is below.

If it's not, no change — keep reading for free.

—Zaal
```

**Farcaster cast (same day):**

```
Starting a supporter tier for the ZAO newsletter.

$5/month. Nothing gates. 30 people = full infra covered.

@thezao on Paragraph has 500+ subscribers after 400+ editions.

If the daily ZM is part of your morning — https://paragraph.com/@thezao

No pressure, keep reading either way.
```

**X post (same day):**

```
Starting a $5/month supporter tier for the ZAO daily newsletter.

500+ readers. 400+ editions. 30 supporters = servers covered.

Nothing behind a paywall. Just sustaining the thing.

paragraph.com/@thezao
```

---

## Timing

**Optimal window: July 18-21** (show day + post-show momentum). The community is most engaged immediately after a COC show. Announce the Supporter tier alongside the COC #7 post-show cast for maximum reach.

**Why not later:** The "launch while hot" window closes fast. Waiting until August means competing with ZABAL Games + COC #8 + ZAOstock announcements for attention.

---

## Projections

| Scenario | Paid subs | Monthly revenue | Infrastructure covered? |
|----------|-----------|-----------------|------------------------|
| Conservative | 15 subs (3%) | $75/mo | 50% — pays half |
| Base case | 30 subs (6%) | $150/mo | 100% — fully covered |
| Optimistic | 60 subs (12%) | $300/mo | 200% — surplus funds ZAOstock |
| Builder tier addition | 5 at $15 | +$75/mo | +$75 on top of base |

The 6% conversion target is achievable for a newsletter with active daily readers who see the value directly. Newsletter conversion benchmarks for "tip jar" models (no paywall) run 3-8%.

---

## What to Track (First 30 Days)

- Total paid subscriber count (Paragraph dashboard)
- Monthly Recurring Revenue (Paragraph Stripe payout)
- Open rate change (paid subscribers typically open at 2x the free average)
- Any unsubscribes triggered by the announcement (expected: <5)

---

## Frequently Expected Questions

**"Should I gate anything to keep the paid tier valuable?"**  
No. The tip-jar model works specifically because readers pay to sustain something they already rely on — not to unlock new content. Adding a paywall risks the 500+ free subscriber trust built over 400 editions. Keep everything free; add content perks (Builder tier) only after the base Supporter tier is established.

**"What if almost nobody subscribes?"**  
30 subscribers = infrastructure covered. With 500+ free readers, even a 6% conversion is realistic. But if after 30 days you're at <10 paid, revisit the announcement approach or the pricing. The announcement matters more than the tier structure.

**"Can I run this alongside ZABAL token plans?"**  
Yes. The newsletter paid tier is fiat-native (Stripe, no wallet required) and appeals to the non-crypto segment of the 500+ readership. The future ZABAL/Boardwalk token is for the onchain-native segment. They're separate rails targeting different cohorts.

---

## Next Steps After Launch

1. Enable Supporter tier (1 action, today or tomorrow)
2. Publish launch ZM + Farcaster cast + X post
3. Check paid subscriber count at Day 7, Day 30
4. At 30 paid subscribers: declare profitability on newsletter (builds social proof → more subscribers)
5. At 60 paid subscribers: consider Builder tier ($15/mo) with 1 real perk (e.g., early research doc previews or a monthly Zaal livestream for supporters)
