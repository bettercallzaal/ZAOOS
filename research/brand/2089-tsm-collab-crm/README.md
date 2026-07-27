# 2089 — TSM collaboration CRM + recurring research loop

**Type:** BRAND-OPS
**Topic:** Brand
**Status:** ACTIVE — Zaal-initiated (2026-07-27). A living CRM of Boston-sports accounts, podcasts, communities, and sports-DAO benchmarks for **TSM / Two Spoiled Mastholes** (doc 2086), plus a recurring research loop that grows it. Data lives in [`crm.csv`](./crm.csv) (import into Sheets/Notion/Airtable anytime). **Outreach is human-gated** — the loop finds and files prospects; Zaal + co-host do the actual DMs/collabs (per `.claude/rules/agent-loops.md` rule 8: research is autonomous, outbound is not).

---

## Executive summary — start here

**What to do first (top 5 collab targets, ranked):**

| # | Target | Why it's #1-priority | First move (human) |
|---|--------|----------------------|--------------------|
| 1 | **The Boston Sports Bros Podcast** | Closest peer — a two-bro indie Boston sports pod, nearly the same concept + size. Peers cross-promote best; no ego gap. | Follow, engage genuinely for 1-2 wks, then DM a guest-swap. |
| 2 | **@boston.memes** | Largest reach in the meme lane; reposts are the cheapest distribution you can get from zero. | Feed them 2-3 genuinely funny TSM clips to repost (no ask attached first). |
| 3 | **Savage Boston Sports** | Peer that already runs a **merch + fan-submission** model — both a cross-promo partner and a live example of the money-later playbook (doc 2086 §7). | Study their merch; propose a fan-submission/clip swap. |
| 4 | **@boston.sports.fans / @bostoncelticsmemes** | Mid-size fan/meme pages = repost partners tuned to playoff moments. | Time clip drops to their teams' big games. |
| 5 | **r/bostonsports + team subreddits** | Where the priced-out everyfan actually lives; free reach if you earn it. | Participate for real; drop a clip only after you have karma/rep. |

**Decision criteria (how the loop + humans prioritize a prospect):**
1. **Peer-first, not whale-first.** Similar-or-slightly-bigger indie accounts reply and reciprocate; giant media outlets don't. Rank `collab-peer` and `collab-meme` above `media-outlet`.
2. **Audience overlap = priced-out Boston everyfan.** Closer to that identity → higher priority.
3. **Reciprocity is realistic.** Can we actually give them something (a clip, a guest, a laugh) they want? If not, it's a `watch`, not a `prospect`.
4. **On-brand.** Skip anything that clashes with the "spoiled / never got in" POV.

**Category legend (the `category` column in `crm.csv`):**
- `collab-peer` — similar-size indie pods/brands → guest swaps, cross-promo. **Highest ROI.**
- `collab-meme` — Boston meme/fan IG pages → clip amplification.
- `community-forum` — Reddit/Discord/forums → seed sparingly, participate genuinely.
- `media-outlet` — big outlets → aspirational, `watch` for now.
- `benchmark-community` — sports DAOs / token-gated fan communities → **study, don't collab** (feeds doc 2088's community model).

**Status values:** `prospect` (found, not contacted) → `contacted` → `talking` → `collab-live` → `passed`/`watch`. The loop only ever adds `prospect`/`benchmark`/`watch`; **humans move a row past `contacted`.**

---

## The benchmark row matters as much as the collabs

`Krause House DAO` and `LinksDAO` are in the CRM as `benchmark-community`, not collab targets — they're the working proof behind [doc 2088](../2088-tsm-dao-community-engine/) (community-funded access arc; free-to-belong gated community). `Socios` is the logged **anti-pattern** (paywalls fandom — the thing TSM must not do). Track how these run their communities; that's borrowed R&D for TSM's own club.

---

## The recurring loop

- **Cadence:** weekly (adjustable). Runs as an autonomous research pass.
- **What it does each run:** WebSearch for *new* Boston-sports IG accounts, indie pods, fan communities, and sports-DAO/token-gated benchmarks not already in `crm.csv`; append ~5-10 new `prospect`/`benchmark` rows (deduped by handle/name); commit + push to the branch. It never edits a human-set status and never does outreach.
- **Why not scrape Instagram directly:** IG is login-walled and blocks automated access, and there's no IG connector in this environment. The loop finds accounts via web search (listicles, directories, third-party indexes) which surfaces handles + focus + rough size. Live follower counts and DMs are a human step.
- **Cost discipline:** capped at a handful of new prospects/run to keep it lean (`.claude/rules/claude-usage.md`). Dial cadence down anytime.

---

## Action items

| Item | Owner | When |
|------|-------|------|
| Approve the top-5 and start genuine engagement (follow, comment) before any ask | Zaal + co-host | this week |
| Record the pilot clip to *have something to offer* on a repost/guest swap | Zaal + co-host | before first outreach |
| Import `crm.csv` into a shared Sheet/Notion so both hosts can update status | Zaal | when convenient |
| Weekly loop appends new prospects | automated (this loop) | weekly |
| Move rows past `contacted` as outreach happens | Zaal + co-host | ongoing |

---

## Sources (this seeding pass, 2026-07-27)

- Boston sports IG accounts — [Feedspot Boston sports blogs](https://bloggers.feedspot.com/boston_sports_blogs/), [BOStoday/6AM City](https://bostoday.6amcity.com/boston-instagram-influencers)
- Boston sports podcasts — [Feedspot Boston sports podcasts](https://podcast.feedspot.com/boston_sports_podcasts/), [bostonsportsbros.podbean.com](https://bostonsportsbros.podbean.com/), [Locked On Boston](https://lockedonpodcasts.com/cities/boston/), [Savage Boston](https://savageboston.com/)
- Communities/forums — [Feedspot Celtics forums](https://forums.feedspot.com/celtics_forums/), [PatsFans.com](https://www.patsfans.com/), r/bostonceltics · r/Patriots · r/redsox · r/bostonbruins
- Sports-DAO benchmarks — [Krause House](https://www.krausehouse.club/), [Sportico: Sports DAOs / LinksDAO](https://www.sportico.com/business/tech/2022/what-is-a-dao-sports-fans-linksdao-garage-1234675873/), [Socios](https://www.socios.com/how-it-works/)
- Related ZAO docs: 2086 (TSM brand), 2087 (wheel-and-spoke architecture), 2088 (DAO community engine)
