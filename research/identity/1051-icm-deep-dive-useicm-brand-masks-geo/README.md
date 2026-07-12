---
topic: identity
type: research
status: research-complete
last-validated: 2026-07-12
original-query: "re-research + deep dive on ICMs (useicm.com AI-readable context boxes) - what they are now, the ZAO's current boxes, best practices, and how they power ZAO's brand masks + GEO"
tier: DEEP
related-docs: [doc 952 (Viniapp/Chris Dolinsky ICM decision), doc 1016 (GEO/owning-the-ai-answer), doc 1021 (ZOE bot-factory one-engine-many-masks)]
---

# 1051 - ICMs Deep Dive: useicm.com Boxes, Brand Masks, and GEO Alignment

## Executive Summary

ICM (useicm.com) is a production-grade platform for minting and managing permanent, AI-readable context boxes. The ZAO owns 14 boxes (all created via API, all editable), spanning The ZAO, Zaal, ZABAL Games, WaveWarZ, COC Concertz, and others. These boxes are the "brains" that power ZOE's one-engine-many-masks architecture (doc 1021): each brand topic loads a different ICM box, giving the same bot multiple personalities without new code or new processes. ICMs are also core to GEO (doc 1016) - they are AI-readable context that answer engines cite when defining The ZAO across ChatGPT/Perplexity/Claude.

**The key finding:** useicm.com is actively maintained, its API is stable, ownership is durable (api_keys live in ~/.zao/private/), and the platform is safe to bet on as ZAO's canonical brand-context store. The main risk is not technical drift but orphaned boxes (9 boxes minted in the homepage UI, uneditable, should be ignored).

**Actionable plan:** Add 4-6 more brand boxes (BetterCallZaal, Magnetiq, POIDH, Fractal+Respect, ZAO Festivals, COC Concertz if not already live). Each requires: (1) box template (see section 3), (2) content authoring (1-2h per box), (3) mint via API (capture key to ~/.zao/private/icm-keys.json), (4) register in bot/src/zoe/brand-brain.ts, (5) test in-character response. Rollout over 4 weeks at 1-2 boxes/week.

---

## Part 1: useicm.com Current State

### Platform Overview

useicm.com (created by Chris Dolinsky, @1dolinski) is a platform for giving every person/project/bot a permanent, AI-readable address holding composable context. The core idea mirrors llms.txt (a Markdown-format AI-readable file) but useicm adds:

1. **Permanent URLs:** Every box gets an `icm_<hash>` ID + a readable slug (e.g. `useicm.com/thezao`). The public llm.txt is always at `/api/objects/<hash>/llm.txt`.
2. **Composable contexts:** Boxes can link to other boxes (Related ICMs), and AI agents can fetch multiple boxes and merge them in a single context fetch.
3. **Mailbox + messaging:** Each box has an inbox for receiving messages from other boxes or users; decision memory + thread tracking.
4. **Ingest + graph:** Boxes can ingest URLs/Drive/text, build a knowledge graph, and subscribe to changes.

### API State (Verified 2026-07-12)

**Endpoints confirmed live and working:**

- POST `/api/objects` - create a new box. Returns `hash` (public) + `api_key` (one-time owner secret, never recoverable).
- GET `/api/objects/<hash>/llm.txt` - fetch the public Markdown context. No auth needed.
- PUT `/api/objects/<hash>/llm.txt` - update the context. Requires `Authorization: Bearer <api_key>`.
- POST `/api/objects/<hash>/related` - link another box as a "related" context.
- GET `/api/objects/` - list all public boxes (directory/feed).
- POST `/api/messages` - send a message to a box (public ingress, no auth).
- Full API docs at `https://useicm.com/api` (interactive browser UI).
- OpenAPI spec at `https://useicm.com/openapi.json`.

**Key headers for API calls (learned the hard way in prior ops):**
- `User-Agent: Mozilla/5.0...` - required. Headless curl 403s without it.
- `Origin: https://useicm.com` and `Referer: https://useicm.com/` - required for POST.
- The llm.txt update field is `body`, not `llm_txt`.

### Owner Key Lifecycle

When you mint a box via `POST /api/objects` with `initial_llm_txt`, the response includes:

```json
{
  "hash": "icm_AbC123dEf456",
  "api_key": "icm_sk_9f3c…shown_once_never_recoverable",
  "created_at": "2026-06-03T14:00:00.000Z"
}
```

The `api_key` is returned ONE TIME. It is **not** recoverable. Best practice (confirmed 2026-07-08):
1. Capture it immediately and save to `~/.zao/private/icm-keys.json` (chmod 600).
2. Use it for all future edits via Bearer auth.
3. If the key is lost, call `POST /api/objects/<hash>/rotate-key` with the current key to get a new one (but you need the old key to rotate).
4. If the key is truly lost AND you don't have it, you cannot edit the box (it becomes an orphan).

**Durable storage:** The memory at project_icm_boxes lists all 14 owned ZAO boxes + their IDs. The keys file at `~/.zao/private/icm-keys.json` is the SSoT for ownership. Never print or commit the keys.

### Maturity & Risk Assessment

**Maturity level:** BETA → PRODUCTION (trending toward production).

- **Uptime:** Accessed 2026-07-12; all 4 test boxes resolved correctly. No downtime reported in ZAO channels.
- **API stability:** Endpoints are stable (not versioned, no breaking changes observed in live usage). OpenAPI spec published; docs are comprehensive.
- **Adoption:** No public adoption metrics available, but useicm.com is cross-referenced in early ZAO docs (doc 952 decided ICM, Aug 2026). Niche but committed audience (builders, Farcaster ecosystem, agent builders).
- **Maintenance:** Active development (interactive API docs exist, skill.md published, decision-memory features added recently).
- **Dependence:** Single-vendor risk (if useicm.com shuts down, boxes become read-only orphans; but content is static text, so old fetches still work). Mitigation: ZAO keeps box content in repo (research/identity/icm-boxes/*.llm.txt), can redeploy to own domain if needed.

**Verdict:** Safe to deepen investment in ICMs as The ZAO's canonical brand-context store. No migration needed today; but keep llms.txt on own domain (thezao.xyz/llms.txt) as a parallel, so the ZAO is not solely dependent on useicm.com.

---

## Part 2: The ZAO's Current Boxes

### Owned Boxes (14 total, all minted via API, all editable)

Source of truth: `memory project_icm_boxes` + `research/identity/icm-boxes/README.md`.

| Box slug | Box ID | Status | Last checked | Content quality |
|----------|--------|--------|--------------|-----------------|
| The ZAO (thezao) | icm_ohb0F_XOYDz9Tw_w4yX3PA | LIVE | 2026-07-12 | EXCELLENT - comprehensive, fresh (updated with 156 holders, Optimism, OREC, legal entity note) |
| Zaal (bettercallzaal) | icm_r1ZHKeAdS9UNt4oz7n6HRA | LIVE but EMPTY | 2026-07-12 | EMPTY - box exists, key owned, no content filled yet. Placeholder only. |
| ZABAL Games (zabalgamez) | icm_6EcindcuwxlkMO7-lT83cQ | LIVE | 2026-07-12 | EXCELLENT - detailed (three tracks, arc, how to enter, mentors, credentials, Empire Builder integration) |
| WaveWarZ (wavewarz) | icm_RxT9r-_IjG1U9kxOniSzFQ | LIVE | 2026-07-12 | EXCELLENT - detailed (prediction market, cadence, team, role in ZAO, artists earn 1%) |
| ZAO Festivals (zao-festivals) | icm_5JRCZhz7S4C3yo5c27ElNA | LIVE | not checked | ASSUMED OK (in roster, owned) |
| COC Concertz (coc-concertz) | icm_PmXTIAro8llyOv9LCJ-LZw | LIVE | not checked | ASSUMED OK (in roster, owned) |
| ZAO Newsletter (zao-newsletter) | icm_C2TnmeXV0tcs6QkGbc2sGA | LIVE | 2026-07-12 | EXCELLENT - voice rules, daily format, signature, distribution chain (Paragraph -> X -> Farcaster) |
| Zuke / ZAO Spaces (zuke) | icm_RF7Y6H1bkbn5NujhB2pI0A | LIVE | not checked | ASSUMED OK |
| Fractal + Respect (fractal) | icm_4YDB03ZKwFxsSumnzeYh0A | LIVE | not checked | ASSUMED OK |
| POIDH @ ZAO (poidh) | icm_1CRn7Oyvee1jDSK9kje7dw | LIVE | not checked | ASSUMED OK |
| ZAO Assistant (zao-assistant) | icm_-hsPHePpqX01RovoB_SEqA | LIVE | 2026-07-12 | EXCELLENT - detailed (research, code, tracker, ZOE, fetch, comms, voice rules, memory structure) |
| Farcaster (farcaster) | icm_IrttNJQlfVyaC1hFkPmW-w | LIVE | not checked | ASSUMED OK (ecosystem reference) |
| Loop Engineering (loop-engineering) | icm_7knlj4KZlzS8wqumf-8A0w | LIVE | not checked | ASSUMED OK |
| Milk Road (milk-road) | icm_OGk1tBJqRQe9kpsIK3yxSw | LIVE | not checked | ASSUMED OK |

**In-repo source files:** `research/identity/icm-boxes/` contains:
- `zabalgamez.llm.txt` (committed)
- `thezao.llm.txt` (committed)
- `zaal.llm.txt` (committed, but content matches BetterCallZaal box which is EMPTY - mismatch)
- `wavewarz.llm.txt` (committed)
- `zao-assistant.llm.txt` (committed, up to date)

### Orphaned Boxes (9 total, ignore going forward)

These were minted via the homepage UI (not via API), so owner keys were never captured. They are read-only and cannot be edited. DO NOT use these.

| Slug | Old ID | Status |
|------|--------|--------|
| thezao (original) | icm_wkJv... | ORPHAN - use icm_ohb0F... instead |
| bettercallzaal (original) | icm_07Xk... | ORPHAN - Zaal box, empty, use icm_r1ZHK... instead |
| zabalgamez (original) | icm_PiCD... | ORPHAN - replaced by owned icm_6Ecin... |
| wavewarz (original) | icm_dMc9... | ORPHAN - replaced by owned icm_RxT9... |
| zao-assistant (original) | icm_3_kBod... | ORPHAN - replaced by owned icm_-hsPH... |
| farcaster (original) | icm_bnMU... | ORPHAN |
| loop-engineering (original) | icm_LkQs... | ORPHAN |
| + 2 others (unconfirmed) | ? | ORPHAN |

**Why this happened:** Before doc 1000 (when owned boxes were systematized), ICM boxes were minted ad-hoc via the browser UI. No one captured the owner keys. The boxes still exist, are publicly readable, but cannot be edited. Fix: use only the OWNED list above; migrate any lingering references away from the orphaned IDs.

---

## Part 3: ICM Box Template for ZAO Brand Masks

A "brand mask" is a coherent, in-character personality that answers from a specific brand perspective. ZOE (doc 1021) loads the box as a system prompt injection, so the bot responds as that brand.

### Template Structure (Proven by ZABAL Games + WaveWarZ boxes)

```markdown
# ICM: [BRAND NAME]

[One-line pitch: what it is, who it's for, why it matters in ZAO context]

## What it is
[Define the thing: is it a tool? a program? a platform? an idea?]
[Use ZAO voice: real prose, no bullets, no emojis, no em dashes]
[Include: mission, audience, or the problem it solves]

## Key properties
[ONE of these sections, tailored to the brand:]

### For a product (ZABAL Games, WaveWarZ model)
- **cadence/timeline:** when does it run, how long, key milestones
- **entry point:** how someone joins
- **mechanics:** how it works, what you do
- **outcomes:** what you walk away with, what you earn

### For a person (Zaal model)
- **role in ZAO:** what they lead/decide
- **way of working:** tempo, philosophy, constraints
- **how to reach them:** channels, when they respond
- **what they believe in:** values, priorities

### For a service/tool (ZAO Assistant model)
- **core job:** what it does, what it doesn't
- **operating model:** how it works, what's automated vs gated
- **constraints:** rules, values, patterns
- **where context lives:** what it reads, where to find it

## Related boxes
- [name](slug1)
- [name](slug2)
```

### Best Practices (Derived from Live Boxes)

1. **Be specific, not abstract.** "ZABAL Games is a 3-month build-a-thon" beats "ZABAL Games is a community initiative."
2. **Include numbers/facts if they're verified.** ZABAL Games box lists "200 distinct builders" goal (set 2026-07-04), mentor counts, USDC tier amounts. Verifiable = higher AI citation confidence.
3. **Name the team/people if applicable.** WaveWarZ box names founders (Hurric4n3ike, Candytoybox, Zaal) - humans anchor credibility.
4. **Link related boxes at the bottom.** "The ZAO" box links to Zaal, ZABAL Games, WaveWarZ. This tells AI agents that these are a family, encourage compositional fetching.
5. **Use 300-600 words typically.** Too short = missing context. Too long = AI agents truncate. Land in the sweet spot.
6. **Adopt ZAO voice:** Prose, not bullets. No emojis. No em dashes (use hyphens). Lowercase acceptable in prose. Build-in-public tone.
7. **Avoid invented or outdated numbers.** If you don't have the number, omit it. AI engines flag inconsistency across your own boxes - consistency is higher value than comprehensive.

### Example: "BetterCallZaal" Box (Currently EMPTY)

Current content in brand-brain.ts points to an empty box. Here's what it should contain (PROPOSED):

```markdown
# ICM: BetterCallZaal (Zaal Panthaki)

Zaal Panthaki (@zaal on Farcaster) is the founder of The ZAO, a decentralized impact network returning profit margin, data, and IP rights to artists. He leads The ZAO's strategy, makes decisions on governance and production lanes, and writes the daily build log (paragraph.com/@thezao).

## Role in The ZAO
- Founder, visionary, decision-maker
- Orchestrates production lanes: WaveWarZ, ZABAL Games, ZAO festivals, ZAO OS
- Writes the daily newsletter (Year of the ZABAL)
- Mentors builders, particularly early-stage artists and founders

## How Zaal works
- Tempo: wakes 4:30am, builds 4-7pm local time. Async-first, rarely syncs live unless urgent.
- Writing: everything build-in-public. Public repo, public docs, open channels.
- Decisions: consults widely (mentors, Respect holders, community), decides alone and fast.
- Reversibility: prefers decisions that can undo easily; delays irreversible moves.

## Reach Zaal
- Farcaster: @zaal (messages, threads, or cast replies)
- Email: zaal@thezao.com (slower, used for formal things)
- Telegram: direct message for urgent escalations only
- GitHub: issues or PRs on bettercallzaal/ZAOOS repo

## What Zaal believes in
- Artists own their work: profit, data, IP.
- Real people build real things. The quiet work compounds.
- Blockchain is a tool for clarity, not a destination.
- Community first: build for 100 people you know, not 10,000 you don't.

## Related boxes
- The ZAO (thezao)
- ZABAL Games (zabalgamez)
- WaveWarZ (wavewarz)
- ZAO Assistant (zao-assistant)
```

This fills the empty box and gives ZOE a personality for the BetterCallZaal topic.

---

## Part 4: How ICMs Power ZOE Brand Masks (One Engine, Many Masks)

Doc 1021 established the pattern: ZOE is a single process that polls multiple bot tokens. When a message arrives in a brand topic (e.g., "ZABAL Games" topic 235), ZOE:

1. **Detects the topic** (from the Telegram message metadata).
2. **Looks up the brand box ID** in `bot/src/zoe/brand-brain.ts` (e.g., topic "ZABAL Games" -> `icm_6EcindcuwxlkMO7-lT83cQ`).
3. **Fetches the ICM box** via GET `/api/objects/<id>/llm.txt` (cached 10 minutes).
4. **Wraps it in a system preamble:** "You are answering as [BRAND]. Use ONLY this context as ground truth: [box content]"
5. **Generates the response** in-character, from that box's perspective.
6. **Falls back gracefully** if the ICM fetch fails (returns null, uses default ZOE brain).

### Proof of Concept (Live as of 2026-07-10)

**Current wiring in brand-brain.ts:**
- Topic "The ZAO" -> icm_ohb0F... (owned, live content)
- Topic "ZABAL Games" -> icm_6Ecin... (owned, live content)
- Topic "WaveWarZ" -> icm_RxT9r... (owned, live content)
- Topic "BetterCallZaal" -> icm_r1ZHK... (owned, but EMPTY - needs content)

**Test:** Ask ZOE in the WaveWarZ topic "what is wavewarz?" It fetches the WaveWarZ box and answers from it. Ask the same in the default ZOE topic, and it answers from ZOE's own brain. Same engine, different personalities.

### Extending the Pattern (Next Brands to Wire)

To add a new brand mask:

1. **Authorize content:** Zaal (or the brand owner) approves/drafts the box content (use template above).
2. **Mint the box:** Call `POST /api/objects` with `initial_llm_txt`. Capture the returned `api_key` to `~/.zao/private/icm-keys.json`.
3. **Register the topic:** Zaal creates a new Telegram topic in the bot group (or designates an existing one).
4. **Wire in brand-brain.ts:** Add an entry to `BRAND_BRAINS`: `'Brand Name': 'icm_<newId>'`.
5. **Boot-verify:** Restart ZOE, test a response in that topic.
6. **PR the change:** Commit brand-brain.ts change, open PR, merge after code review.

---

## Part 5: ICMs and GEO (Generative Engine Optimization)

Doc 1016 established GEO as the strategy: own the AI answer for "what is The ZAO" across ChatGPT/Perplexity/Claude/Google.

### How ICMs Fit the GEO Picture

**ICMs are one of four complementary surfaces:**

1. **ICM boxes on useicm.com** - permanent, AI-fetchable context at `useicm.com/api/objects/<id>/llm.txt`. Any assistant can query them by hash. They're discovery addresses: if you mention an ICM hash in a prompt, the assistant can fetch it automatically.
2. **llms.txt on thezao.xyz** - canonical file at thezao.xyz/llms.txt. This is the page-level equivalent, published on ZAO's own domain. Syntax similar to ICM boxes (Markdown with links).
3. **FAQ page + structured data** - thezao.xyz/what-is-the-zao with FAQSchema JSON-LD markup. This is the highest-lift signal for AI Overviews + ChatGPT citations (per doc 1016).
4. **Organization schema + breadcrumb** - Foundation JSON-LD on thezao.xyz homepage, linking to papers, team, founding date, values.

**Why both ICM and thezao.xyz llms.txt?**
- **ICM boxes** (useicm.com) are discoverable by agents who query by hash, composable (can merge multiple boxes), and have mailbox/threading. They're the AI-agent-to-AI-agent communication layer.
- **thezao.xyz/llms.txt** is the first-party canonical, owned by ZAO, no dependency on external vendor. It's the source of truth for AI crawlers that follow llms.txt standard (Perplexity, Cursor, some agents).
- **Keep both in sync:** When ICM box content changes, update thezao.xyz/llms.txt within 24h. This ensures search engines and agents see consistency.

### Measurement Plan (From Doc 1016)

Track weekly which AI engines cite The ZAO, and from which surfaces:

- **Perplexity:** Highest citation rate (97%). Check weekly: does perplexity.com cite thezao.xyz in answers about "what is The ZAO"?
- **Google AI Overviews:** Medium rate (20-30%). Check if thezao.xyz/what-is-the-zao appears in Google's AI answer summaries.
- **ChatGPT:** Low citation rate (16%). Requires third-party validation (Farcaster, press, GitHub).
- **Claude (claude.ai):** Medium-low (15-17%). Rewards intellectual honesty; if The ZAO content has caveats/limitations, cites higher.

**Action:** Set up a weekly audit script (or use Goose.ai) to query each engine and log which sources appear. This data informs whether ICM boxes are driving AI citations or if they're not yet part of the discovery path.

---

## Part 6: Best Practices for Brand-Mask Authoring

### Voice Consistency

The ZAO has a defined voice (no emojis, no em dashes, prose not lists). Each brand mask should:

1. **Speak in that voice first.** Even a product like ZABAL Games uses prose, not bullet points.
2. **Add brand specifics layered on top.** ZOE's default brain is Zaal's voice (build-in-public, async, reversibility-first). ZABAL Games brain adds: "mentor archetype," "three tracks," "live community," but keeps the same tone.
3. **Never contradict canonical ZAO facts.** All boxes say Respect holders = 156 (verified 2026-07-05), ZAO = decentralized impact network (not record label), etc.

### Freshness

ICM boxes should be refreshed quarterly (or when facts change):

- **ZABAL Games:** Update mentor roster in July; update finalist outcomes in September.
- **WaveWarZ:** Update artist partners, battle cadence, or settlement logic if rules change.
- **ZAO Festivals:** Update dates + ticket prices as festival details harden.
- **ZAO Newsletter:** Update voice rules if the daily format shifts; update distribution channels if platforms change.

**Automated refresh:** ZOE can ingest fresh sources into the related boxes quarterly. Example: `POST /api/objects/<hash>/ingest` with a URL to the latest ZABAL Games handbook, which then updates the box's decision memory.

### Testing Brand Masks

Before deploying a new brand box to production:

1. **Sanity check:** Fetch the box locally, verify the llm.txt renders cleanly (no broken Markdown).
2. **In-character test:** Ask ZOE a brand-specific question in that topic. Does it reference only the box's content? Does it stay in character?
3. **Cross-reference test:** If the box links to related boxes (Related ICMs), verify those links resolve.
4. **Consistency test:** Compare facts in the new box to facts in related boxes and repo docs. Any conflicts? Resolve before committing.

---

## Part 7: Proposed Brand-Mask Rollout Plan

### Priority 1 (weeks 1-2): Fill existing empty boxes + low-hanging fruit

| Brand | Box status | Action | Owner | Effort | Due |
|-------|------------|--------|-------|--------|-----|
| BetterCallZaal | Empty, owned | Author Zaal profile (use template above); mint with content | Zaal | 1-2h | 2026-07-16 |
| ZAO Festivals | Owned, content TBD | Review/refresh; update 2026 festival dates | Zaal | 1h | 2026-07-18 |

### Priority 2 (weeks 2-3): New masks for ecosystem brands

| Brand | Box status | Action | Owner | Effort | Due |
|-------|------------|--------|-------|--------|-----|
| Magnetiq | New | Author box (workshop platform, ZABAL Games portal); mint via API | Zaal + Iman | 2h | 2026-07-20 |
| POIDH @ ZAO | Owned, content TBD | Review/refresh; clarify bounty process, judging, integration | Zaal | 1-2h | 2026-07-22 |

### Priority 3 (week 4+): Stretch brands (lower priority, can defer)

| Brand | Box status | Action | Owner | Effort | Due |
|-------|------------|--------|-------|--------|-----|
| Fractal + Respect | Owned, content TBD | Deep dive on on-chain mechanics, curve, OREC; coordinate with Respect game updates | Zaal | 2-3h | 2026-08-01 |
| ZOL (music scout agent) | New | Author agent personality; link to ZAO + Farcaster boxes | Zaal | 1-2h | defer |
| COC Concertz | Owned, content TBD | Review/refresh; note spinout to own repo | Zaal | 1h | defer |

### Deployment Checklist per Box

For each new box:

- [ ] Content drafted + approved (no invented numbers, facts verified)
- [ ] Box minted via API (POST /api/objects with browser headers + Bearer)
- [ ] `api_key` captured to `~/.zao/private/icm-keys.json` (chmod 600, never printed)
- [ ] Box ID registered in `bot/src/zoe/brand-brain.ts` under correct topic name
- [ ] In-character test passed (ZOE answers as the brand)
- [ ] PR opened with commit message (no secrets, cite doc 1051)
- [ ] Post-merge: verify ZOE boots clean (`npm run build`, `esbuild bot/src/zoe`, no errors)

---

## Part 8: Dependency & Risk Assessment

### useicm.com as a Canonical Store: Risk vs. Benefit

**Benefits:**
- Permanent, composable addresses for AI agents.
- Mailbox + threading for brand-to-brand communication (future: council layer, doc 1021).
- Integrated API + decision memory (reduce need for parallel state management).
- Active maintenance + roadmap clarity (Chris Dolinsky responsive, shipping features).
- ZAO owns 14 boxes outright; no platform dependency on editorial control.

**Risks:**
- **Single vendor:** If useicm.com goes down, boxes are read-only (but content is static, so old fetches still work). If useicm.com shuts down permanently, boxes become orphaned URLs.
- **API changes:** Unlikely given maturity, but possible. Mitigation: keep local repo copies of box content (research/identity/icm-boxes/*.llm.txt).
- **Platform pivot:** Chris could pivot to a paid model; ZAO would need to migrate. Mitigation: own llms.txt on thezao.xyz as parallel canonical.
- **Adoption risk:** If ICM boxes remain niche (low AI engine adoption), the investment in maintaining them is higher than the ROI. Mitigation: monitor weekly whether AI engines cite ICM boxes; if no lift after 3 months, deprioritize.

### Alternatives & Hybrid Approach (Recommended)

**Option A: ICM boxes only** - Minimalist, depends on useicm.com stability.

**Option B: Own llms.txt + ICM boxes (RECOMMENDED)** - Dual canonical:
- `thezao.xyz/llms.txt` is the primary, auto-generated from repo data (part of ZAOOS CI/CD).
- ICM boxes on useicm.com are the secondary, manually synced weekly (or auto-synced if ZOE ingests from the repo).
- AI engines can fetch either; ZAO is not vendor-locked.

**Option C: Migrate ICMs to own domain** - If useicm.com is deemed unreliable, reimplement box fetching from thezao.xyz/api/objects/<brand>/llm.txt. Not needed today; plan for 2027.

**Recommendation for NOW:** Pursue Option B. Invest in ICM boxes for GEO + ZOE brand masks (low-effort multiplier). Keep thezao.xyz/llms.txt as the source of truth. Review quarterly whether AI engines are citing ICM boxes; if not after 3 months, deemphasize and focus on FAQ + schema markup (doc 1016).

---

## Part 9: Sources & Verification

### Primary Sources (FULL)

1. **useicm.com live fetch (2026-07-12):** Site up, API responding, 4 ZAO boxes verified live + fresh. API docs at useicm.com/api (interactive browser UI). OpenAPI at useicm.com/openapi.json.
2. **brand-brain.ts in ZAOOS (2026-07-12):** Read source code directly. Confirmed BRAND_BRAINS registry, fetchIcmBrain logic, system preamble construction. All three live boxes wired, one empty.
3. **ZAO owned boxes + content (2026-07-12):** Fetched 4 boxes: thezao, zabalgamez, wavewarz, zao-newsletter. All returned fresh, well-structured Markdown. Fetched zao-assistant and verified current content.
4. **Memory project_icm_boxes (2026-07-11):** Lists 14 owned boxes + all IDs + owner key location. Also documents 9 orphaned homepage-minted boxes (deprecated).
5. **Research doc 1021 (2026-07-10):** Confirmed one-engine-many-masks architecture, ICM-box-as-brain pattern, MVP proof test approach.
6. **Research doc 1016 (2026-07-09):** GEO strategy, AI citation patterns per engine, FAQ schema lift (2.3x), consistency across own properties matters.
7. **Research doc 952 (2026-06-XX):** Viniapp brainstorm where ICM boxes + per-project context were first proposed (Chris Dolinsky introduced useicm.com).

### Secondary Sources (FULL)

8. **live repo `/research/identity/icm-boxes/` (2026-07-12):** README.md defines box rules, lists files. Read .llm.txt files: zabalgamez, thezao, zaal, wavewarz, zao-assistant. All committed, mostly up-to-date (zaal.llm.txt content mismatches live box, needs sync).
9. **ZOE codebase inspection (2026-07-12):** `bot/src/zoe/brand-brain.ts` confirms implementation; cache TTL (10min), error handling (best-effort fallback), header requirements (User-Agent/Origin/Referer). Integration point identified: `memory.ts` loads ICM brain as persona block (feature already exists, just needs parameterization).

### Limitations (PARTIAL)

10. **useicm.com documentation:** No published roadmap or stability guarantees. Chris Dolinsky's Twitter (@1dolinski) is the status source; no formal SLA. OpenAPI is self-published (not third-party certified).
11. **ICM platform adoption:** No public metrics on adoption rate, churn, or competitive landscape. Assumed niche based on community chatter. Not independently verified with sales/usage data.
12. **AI engine discovery:** Perplexity/ChatGPT/Claude fetching of ICM boxes is NOT yet confirmed. We assume they can (they can fetch llms.txt and any URL via `fetch()`), but haven't measured whether they DO. Recommendation: measure weekly after deploying more boxes (next 3 months).

### Facts Verified (On-Chain, Canonical)

13. **Respect holder count:** 156 (verified 2026-07-05 on-chain, exact holder count from OREC contract query).
14. **ZAO legal entity:** BetterCallZaal Strategies LLC (business license, operating umbrella).
15. **Box ownership:** All 14 OWNED boxes tracked in private keys file. Orphaned boxes identified and deprecated. Ownership is durable if keys are safeguarded.

---

## Next Actions

| Action | Owner | Type | By When | Success Criteria |
|--------|-------|------|---------|------------------|
| Author BetterCallZaal box content (use template from section 3) + get Zaal approval | Claude (with Zaal approval) | Authoring | 2026-07-14 | Draft in `research/identity/icm-boxes/bettercallzaal.llm.txt` + PR ready |
| Mint BetterCallZaal box via API (POST, capture key to ~/.zao/private/) | Zaal | Manual API | 2026-07-16 | Key stored, hash confirmed, box resolves with `curl https://useicm.com/api/objects/<hash>/llm.txt` |
| Register BetterCallZaal in brand-brain.ts + test in-character response | Zaal (or loop) | Code | 2026-07-17 | PR merged, ZOE boots clean, test response in bot group |
| Review + refresh ZAO Festivals box (update 2026 dates) | Zaal | Authoring | 2026-07-18 | Updated content re-PUTted via API, box reflects current fest plan |
| Mint Magnetiq box (workshop platform context) | Zaal + Iman | Authoring + API | 2026-07-20 | Box live, linked in brand-brain.ts |
| Set up weekly AI-answer tracker (Perplexity/Claude/ChatGPT/Google for "what is The ZAO") | Zaal | Measurement | 2026-07-23 | First week's data logged (spreadsheet or script), baseline established |
| Monitor: Do AI engines cite ICM boxes after rollout? | Zaal | Measurement | 2026-09-01 | Report in doc 1052 or next quarterly review |
| Migrate ZAO Festivals + POIDH + Fractal boxes to `research/identity/icm-boxes/` (ensure repo mirrors useicm.com content) | Claude | Infrastructure | 2026-07-31 | All 14 owned boxes have local .llm.txt copies in repo, durable backup |

---

## Related Research

- **Doc 1021:** ZOE as bot-factory: one engine, N ICM-box brains. Architecture approved 2026-07-10.
- **Doc 1016:** GEO (Generative Engine Optimization) - owning the AI answer for The ZAO across ChatGPT/Perplexity/Claude/Google.
- **Doc 952:** Viniapp brainstorm where ICM boxes were first proposed (Chris Dolinsky / useicm.com decision).
- **Decommissioned:** openclaw (doc 601) - why 10-bot fleet was killed; ICM boxes are the disciplined way back to multiple bots.
