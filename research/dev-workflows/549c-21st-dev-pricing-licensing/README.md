---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 549a, 549b, 549d, 549e
tier: STANDARD
---

# 549c - 21st.dev Pricing & Licensing

> **Goal:** What does 21st.dev cost, what do we get, and what license applies to components we lift or generate? Resolve before any production use.

## Pricing Tiers (Best Available 2026-04-29)

| Tier | Monthly | Annual | Magic Generate | Inspiration Search | Logo Search | Site Cloning | Early Access |
|---|---|---|---|---|---|---|---|
| Free | $0 | n/a | Low quota* | Unlimited | Unlimited | No | No |
| Pro | $20 | Not exposed on landing fetch | Significantly raised | Unlimited | Unlimited | No | No |
| Max | $100 | Not exposed | Maximum | Unlimited | Unlimited | **Yes** | **Yes** |

> *Free quota reality check: PulseMCP listing says "5 free requests"; official `/magic` page says "100 credits". `/pricing` returned navigation-only HTML on fetch. **Confirm at signup, update this doc.**

Earlier 2025 reviews (Apidog blog, Skywork article) referenced "$10/month" for paid tier. As of 2026-04-29 the live `/magic` page shows $20 Pro and $100 Max - assume pricing rose between mid-2025 and early-2026.

## What Each Tool Costs

| Tool | Tier needed | Notes |
|---|---|---|
| `21st_magic_component_inspiration` | Free | Unmetered per official messaging. Use heavily. |
| `logo_search` | Free | Unmetered. Replaces ad-hoc Google trips for brand SVGs. |
| `21st_magic_component_builder` | Free with low quota, Pro for production use | Each call returns 5 variants - counts as one generation. |
| `21st_magic_component_refiner` | Free with low quota, Pro for production use | Per-iteration cost; counts toward generations. |
| Site cloning (Max only) | Max | Reproduces a target URL's UI structure. Useful for "make ZAO Stock landing look like X" briefs - if Zaal lands on a reference. |

## License of Generated / Lifted Components

This is the part that mattered most and was hardest to pin down on 2026-04-29.

### Magic-generated components

Generated TypeScript/React/Tailwind code is written into your repo. Standard practice across AI-generation tools (v0, Cursor, Lovable) is that the generated code is yours to use commercially without attribution. **21st has not posted explicit terms on the landing or `/magic` page** as of 2026-04-29 fetch; assume similar but verify in signup ToS.

**Recommendation:** treat generated code as fully owned + commercially usable; keep the prompt that produced it logged in the PR description for provenance. If 21st posts conflicting terms later, this doc supersedes itself with a corrected note.

### Catalog (community-published) components

Each contributor uploads their own component. License per component is not consistently labelled in the catalog browse. Default assumption from marketplace patterns: **MIT or similar permissive**, but per-component verification is required for any commercial use.

**Recommendation:** when lifting a community component:

1. Open the component page at `21st.dev/community/components/<slug>`.
2. Look for explicit license notes; if absent, treat as "ask before commercial use."
3. For ZAO public-facing surfaces (zaoos.com, ZAO Stock landing, BCZ portfolio), prefer Magic-generated code over uncertain-license community components.
4. For internal tools (devz, zoe.zaoos.com behind login), community lifts are lower risk.

### Brand SVGs from `logo_search`

Powered by **svgl** (`svgl.app`). svgl's terms cover usage. Brand logos remain property of their owners; svgl indexes publicly available marks. **Do not** modify brand logos. **Do not** use them to imply endorsement.

For ZAO: fine to use platform logos (Farcaster, Base, Spotify, etc.) on integrations pages, partner lists, share-as buttons. Not fine to put a major brand logo on the front page implying partnership.

## Refunds + Payment

Not posted on landing pages. Industry default: monthly subscriptions are non-refundable mid-cycle. Cancel before next renewal to stop charges.

Payment methods not enumerated on landing. Industry default: Stripe-style card processing.

## Cost Forecast for ZAO

| Phase | Plan | Why |
|---|---|---|
| Now (eval) | Free | Inspect catalog + run free Inspiration / logo searches |
| ZAO Stock site sprint | Pro $20 | Generate hero, pricing tiers, CTA, testimonials |
| ZAO OS visual refresh | Pro $20 | Generate AI Chat shell, refresh Hero, refine `/stake` |
| Continuous low-volume | Free | After visual sprint, pause Pro until next refresh |
| Aggressive multi-site phase | Max $100 | Only if ZAOstock + ZAO Music drop sites + BCZ refresh land in the same month |

Annualised: 2-3 Pro months / year = ~$40-$60. Cheap insurance vs hand-coding equivalent UI.

## Risk Register

| Risk | Mitigation |
|---|---|
| Pricing changes mid-sprint | Pin sprint plan to Pro tier; if 21st jacks rates, fall back to free Inspiration + manual coding |
| 21st sunsets free tier | Magic MCP is MIT and on GitHub; community fork would emerge. Track via `gh api repos/21st-dev/magic-mcp/releases` |
| Generated code license terms get tightened later | Keep PR descriptions referencing 21st prompt as evidence the generation predated any later term change |
| Community component without license tag | Skip for public surfaces; safe for internal-only use |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Verify free-tier quota (5 vs 100) at signup, update [549b](../549b-21st-dev-access-patterns/) | Zaal | Self-validate | At first install |
| Capture exact `/pricing` page once it stops returning nav-only HTML | Zaal or skill | Re-fetch | When 21st updates SPA |
| Add 21st license note to any PR that lifts community code | Zaal | PR convention | Per PR |
| Annual budget line: $40-$60 forecast | Zaal | BCZ ops | Plan for FY26 |

## Sources

- [21st.dev/pricing](https://21st.dev/pricing) - returned nav-only HTML on fetch 2026-04-29
- [21st.dev/magic](https://21st.dev/magic) - Free 100 credits, Pro $20, Max $100
- [PulseMCP listing](https://www.pulsemcp.com/servers/21st-dev-magic) - "5 free requests, $10/month" (older)
- [Apidog blog](https://apidog.com/blog/21st-dev-review/) - third-party review with pricing notes
- [svgl.app](https://svgl.app) - brand SVG source

## Staleness Notes

Pricing has 3 conflicting sources. Verify at signup. Re-validate by 2026-05-29.
