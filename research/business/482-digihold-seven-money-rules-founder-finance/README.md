# 482 — DigiHold's 7 Money Rules (Founder Finance After Losing $1.5M)

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Adapt Nicolas / DigiHold's 7 personal-finance rules into BetterCallZaal Strategies LLC operating procedure + ZAO Music entity cash flow.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Which of the 7 rules apply to BCZ Strategies LLC today? | USE all 7 as-is. They're obvious by design — the failure mode is ignoring them, not understanding them. |
| Rule priority for Zaal this quarter? | USE Rules **2, 3, 6** first (tax escrow, business↔personal separation, 12-month runway). Rules 1, 4, 5, 7 come once revenue is recurring. |
| Rule 2 tax %? | USE **35%** for US context even though rule is French-framed (rough federal + state + SE tax on a sole LLC). Re-tune with CPA. |
| Who tracks this? | USE ZOE v2 weekly Monday brief as the "Rule 7" 15-minute check. Matches `user_zaal_schedule.md` 4:30am Monday anchor. |
| ZAO Music entity cash flow? | APPLY — BMI + DistroKid + 0xSplits revenue should land in a ZAO Music DBA account that hands a fixed salary to Zaal and a fixed 20% reinvest to production. Mirrors `project_zao_music_entity.md`. |

## Comparison of Options

| Framework | Mental model | Strength | Weakness | Fit for Zaal |
|---|---|---|---|---|
| **DigiHold 7 Rules** | Post-mortem of losing $1.5M | Scar-tissue, not theory | French-tax framed | Excellent |
| Mike Michalowicz — Profit First | Allocate each dollar to buckets on arrival | Operational, spreadsheet-ready | Prescriptive | Good complement |
| Ramit Sethi — Conscious Spending Plan | Fixed % buckets for living / savings / guilt-free | Lifestyle-tuned | Personal not business | Partial |
| Default YC founder playbook | "Default alive" revenue > burn | Macro only | No tactic | Complementary |

## The 7 Rules, ZAO-ified

1. **Fixed salary, not "what's in the account."** — Decide Zaal's monthly draw at the top of the year. Transfers on the 1st like a W-2 employee from BCZ Strategies. (Apr 2026 action: set Jan 2027 number in December 2026 planning.)
2. **35% of every dollar → tax account on arrival.** — Same week as revenue hits. ZAO Music and BCZ Strategies each have their own tax-escrow sub-account. CPA re-tunes %.
3. **Business ↔ personal never touch.** — 2 accounts, 2 cards. Business pays personal on the 1st. Already partly in place; enforce zero crossover.
4. **No recurring expense > 10% of worst month last year.** — Pull 12 months of BCZ Strategies + ZAO Music revenue; if worst month = $X, no single subscription/rent/contractor > $0.10*X. (Kills SaaS sprawl, see `project_research_followups_apr21.md` env var audit for the parallel tech version.)
5. **20% of every profit dollar → reinvest before counting as mine.** — For ZAO Music: 20% to production/distribution. For BCZ Strategies: 20% to agency infra (bots, tools, cold outreach). Rule mirrors CyrilXBT's "keep feeding the product."
6. **12 months personal + business runway in cash before helping anyone financially.** — Hard rule. Mentioned to family/friends once, then enforced silently.
7. **Monday 15-min number check.** — Revenue, cash, runway, AR, overdue invoices, top 3 recurring subs. ZOE v2 auto-generates this as the first Monday brief (see `project_zoe_dashboard.md`).

## Specific Numbers

- **$1.5M** — amount Nicolas lost in 2 years.
- **2017–2019** — the specific collapse window after his WordPress theme hit.
- **$30k → $12k** — the revenue swing that killed his over-committed rent (Rule 4 origin).
- **35%** tax-escrow rate (France-indexed; tune for US at **~30–40%** depending on state).
- **12 months** runway target before philanthropy.
- **5 months** — how long his revenue dropped before he noticed (origin of Rule 7).

## Concrete Integration Points

- `content/youtube-descriptions/` — no fit.
- New: `scripts/finance-weekly-report.ts` — a Monday-morning job that hits Mercury + Stripe + Coinbase APIs, spits out the Rule-7 dashboard to Telegram via ZOE. (Owner: ZOE v2 sprint.)
- `community.config.ts` — no fit.
- `research/business/README.md` — add this doc to the BCZ agency + ZAO Music stream.
- `project_bcz_agency.md` + `project_zao_music_entity.md` — cross-reference this doc as the operating-finance SOP.

## What to Skip

- SKIP cloning Nicolas's WordPress-theme narrative arc — our wedge (ZAO music community + BCZ agency) is structurally different.
- SKIP interpreting Rule 6 as "never help." It says "12 months runway first." That's a timing rule, not a stingy rule.

## Sources

- [Reddit — r/passive_income 7 Rules thread](https://www.reddit.com/r/passive_income/comments/1ss3eim/7_rules_i_follow_with_every_dollar_now_after/)
- [Mike Michalowicz — Profit First](https://mikemichalowicz.com/profit-first/)
- [Ramit Sethi — Conscious Spending](https://www.iwillteachyoutoberich.com/conscious-spending-plan/)
