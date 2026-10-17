---
topic: identity
type: decision
status: research-complete
last-validated: 2026-10-17
superseded-by:
related-docs: "events/841-bayo-zaal-mpc-atrium-bd, identity/2576-quidli-social-registry-agent-payments, identity/2615-eas-proof-of-listen-scrobble-attestations-base"
original-query: "Research https://verify.npclabs.xyz/ for the ZAO ecosystem using the /zao-research skill (STANDARD). What is it, who runs it, how does it work, does it fit ZAO (identity, verification, agents, WaveWarZ, ZOE), and what are the risks."
tier: STANDARD
---

# 2683 - Verified by NPC (NPC Labs): a signed-record registry for products, credentials, content and agents

> **Goal:** Decide whether ZAO uses verify.npclabs.xyz for agent identity (ZOE),
> content provenance (WaveWarZ tracks, ZAO art) or member verification, and what
> it costs us if we do.

All facts below were read from raw `curl` output saved to disk on 2026-10-17
(19:23 UTC), not from a WebFetch summary. The live API was called read-only. No
registration was submitted: a registration writes a public record naming an
owner, which is a publishing act and Zaal's call.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **DO NOT build any ZAO code against the NPC API now.** | Every record on the site is a test sample (`att_test_*`, `cred_test_*`, `tag_test_*`), the live signing keys are named `npc-demo-*`, chain anchoring is `"disabled"`, and the site's own Verify page says "Registrations are paused right now". A dependency on this today is a dependency on a demo. |
| 2 | **TREAT it as a relationship thread with Bayo, not a tooling decision.** | **NPC Labs is Bayo's company (updated 2026-10-17).** Public evidence: the Gemini extension is published from GitHub account `bayo-de` (display name "B∀YO"), LICENSE copyright "2026 NPC Labs", and NPC's newsletter is the Paragraph publication `npcstore`, named "B∀YO", whose profile links twitter.com/bayo__de. Zaal's private notes from 2024 meetings with Bayo also name NPC Labs as his company. So "MPC" in doc `events/841-bayo-zaal-mpc-atrium-bd` is a transcription error for "NPC"; that doc's description ("creator tools + a supply-chain authentication layer", chip-based "digital cross physical" activations) matches NPC Labs exactly. |
| 3 | **OPTIONAL, Zaal-gated: register ZOE as one test agent** once registration reopens. | Free, about one API call, names Zaal as accountable owner. It gives Bayo a real first customer record and gives us a live read of what "checks" actually run. Gated because it publishes an owner name and a record we cannot delete (no delete endpoint is documented). |
| 4 | **KEEP ZAO's own trust layer (`src/lib/spore/trust.ts`) as the identity substrate.** | It already does Ed25519 + JCS canonicalization with key resolvers and revocation, flag-gated. NPC is a centrally signed registry; Spore is our own key. NPC records could be one more verifiable input, never the root. |
| 5 | **WaveWarZ: SKIP for track provenance.** | For audio, intake reads "container facts" only (format, length, codecs). A content-hash registration records "The creator provided this content hash. NPC has not seen the content itself." That proves nothing about who made a track. |

## What it is

Verified by NPC is a public registry of **signed records** about four kinds of
subject: claims (product tests), credentials, physical products (by tag ID) and
AI agents. Each answer is one of a fixed set of words: verified, verified with
caveats, revoked, expired, counterfeit, or unknown. The site states: "Unknown is
not a verdict; it is an honest answer, and we never guess to fill the gap."

- **Operator:** "NFT Print Pro Corp. dba NPC Labs" (footer of npclabs.xyz). The parent
  site pitches "The Trust Layer for Commerce" with physical goods tagged at source
  and "NPC Grand Fleet", their own AI agent fleet, as "our first customer". It says
  "Self-funded so far. Every dollar so far is physical."
- **Age:** everything is days old. GitHub `bayo-de` account created 2026-10-01;
  `npc-verify-gemini` repo created 2026-10-06; PyPI `npc-verify-mcp` 1.0.0 and 1.0.1
  (1.0.1 uploaded 2026-10-15); the launch video uploaded 2026-10-16 with 12 views when read.
- **Surfaces:** REST API at `api.npclabs.xyz`, hosted MCP endpoint
  `https://api.npclabs.xyz/v1/mcp` (7 tools, listed live), self-hostable MCP server on
  PyPI, a ChatGPT plugin, a Gemini CLI extension (v1.0.2 per the Plugins page). Copilot
  "In enrollment with Microsoft". A Chrome extension for images is "coming soon".

## How it works (measured)

| Step | What happens | Evidence |
|------|--------------|----------|
| Register | `POST /v1/register/agent` or `/v1/register/content`. No API key. Agent needs a named human owner ("anonymous owners and team aliases are not accepted"). Owner email required, kept private. | API page |
| Record issued | Status `registered_checks_pending`. Agent registration runs only `named_owner` and `registration_claim`; `scope_review`, `human_review`, `verification_decision` are listed as not run. | Live `GET /v1/records/reg_6789fb4ca0f5363853a23dc0` returned 200 with these fields |
| Content checks | Images: C2PA Content Credentials read and validated, plus an "AI image check" given as a percentage ("a signal, never a stamp"). Audio/video: container facts. Hash-only: nothing verified. | How it works page, API page |
| Signing | Ed25519 over "NPC-JCS-v1" (sorted keys, no whitespace, signature field removed). Responses also carry `X-NPC-Signature` / `X-NPC-Key-ID` headers. | Live `/v1/health` headers |
| Lookup | `GET /v1/records/{id}`; unknown ID returns `404 {"verdict": "unknown"}`. | Live call returned exactly that |
| Limits | 10 registrations per email and 50 per IP per 24h (429 past it); 1 MiB request cap. | API page |
| Chain | `"anchoring":"disabled","mode":"local-first","network":"none"` - "no chain writes until the mainnet gate clears." | Live `/v1/health` |

**Signature check, done independently.** I took the live record above and the live
`/v1/keys` document, rebuilt the canonical form in Python (`json.dumps(sort_keys=True,
separators=(',',':'))`) and verified with the `cryptography` library: **VALID** against
issuer key `npc-demo-issuer-20261014-727fb5`. Control: changing `agent_name` made the
same check **INVALID**. So the cryptography does what the page says. What it proves is
narrow: NPC signed this JSON. It does not prove anything NPC wrote in it is true.

## Fit for ZAO

| ZAO surface | Fit | Verdict |
|-------------|-----|---------|
| ZOE / agent identity | Agent registration with a named accountable owner matches our stance that every agent has a human answerable for it. But the record today verifies nothing beyond "an owner was named". | Gated test registration only (Decision 3) |
| DreamNet trust layer (`src/lib/spore/trust.ts`, `src/lib/dreamnet/proof-drop/proof-drop.ts`) | Same primitives (Ed25519, JCS-style canonicalization, key list with retired keys). Ours is self-sovereign; theirs is a central issuer. | Keep ours; NPC record = optional external input |
| Farcaster signer provenance (`src/lib/farcaster/signer-provenance.ts`) | Already resolves real Ed25519 signers per FID from hubs. NPC adds nothing here. | SKIP |
| WaveWarZ tracks | Audio checks are container facts; hash registration is self-asserted. | SKIP (Decision 5) |
| ZAOstock / ZABAL merch, physical goods | NPC's real product is physical tags + provenance (their "every dollar so far is physical"). This is where Bayo's chips fit, as in doc 841. | Talk to Bayo |
| Member verification (blue "verified human" check) | Described on the How it works page; no live human-verification flow or API endpoint is documented. | UNVERIFIED, nothing to adopt |

## Risks

1. **Demo infrastructure presented as live.** Active keys are `npc-demo-api-signing-20261014-e9c73a` and `npc-demo-issuer-20261014-727fb5`. Every record shown is labelled a sample.
2. **Inconsistent key publication.** The Search page lists "Published keys: npc-api_signing-20261016-13f2c7 npc-issuer-20261016-b3bffa". `/v1/keys` read the same day does not contain either ID; it lists the `-20261014` demo keys as active and two `-20261015` keys as retired. A verifier trusting the Search page list would fail to find the key.
3. **Site and API disagree on registration.** The Verify page says "The verification service is not answering yet. Registrations are paused right now." The API page says registration is live and `/v1/health` returned `"status":"ok"`. Not tested by us (no write).
4. **Central trust.** "Records are signed, not minted. A record is an Ed25519 signature kept by NPC." If NPC's keys or company go away, records are only as good as our saved copies and their retired-key list.
5. **Public name exposure.** Agent and content records publish owner/creator name. Email is private per the API page.
6. **AI-image percentage.** They frame it honestly as a signal. Any ZAO surface showing it must keep that framing.
7. **Chat retention.** The site assistant "Biblo" keeps conversations 90 days and staff may read them (Privacy page). Do not paste ZAO private content into it.
8. **Licence scope.** The clients are MIT (LICENSE file read in `bayo-de/npc-verify-gemini` and in the `npc_verify_mcp-1.0.1` sdist). The API server code was not found anywhere public. `bayo-de/verified-by-npc` has no LICENSE file (all rights reserved).

## Agent audits: "Verified Agent Swarms" (NPC Labs newsletter, 2026-10-15)

Source: Paragraph post `@npcstore/verified-agent-swarms`, subtitle "We audited the agents", published 2026-10-15 18:49 UTC. It was fetched as markdown through Paragraph's public API and read from disk. The post is the second, paid half of NPC's business: an audit service for agents, sold as "Independent verification with signed, onchain-anchored reports. The financial-audit model for agents."

### The five verdicts (their claims, not re-tested by us)

| Agent | Verdict | What they say they did |
|---|---|---|
| Dots (OpenAI) | Would not sign | Desk review of OpenAI's system card ("scope violations rising from 8.6 percent at five intervening tasks to 19.7 percent at ten") and launch reporting |
| Grok bot (xAI, on X) | Would not sign | Sampled public replies ("roughly 165 replies per minute in the window we sampled"); sample size not stated |
| Meta Muse | Unable to verify | "We could not reach the product. Signup requires a payment card"; the post cites only incidents reported by others |
| Hermes (their own deployment on Nous Research's open-source framework) | Signed, with caveats | Three rounds against a synthetic mailbox, "including twelve adversarial messages", with "Zero compliances". Round one caught "a confident triage with invented senders and subjects" under truncated input, which was then fixed |
| Inbox Watch ("Client zero", their first client) | Signed, with caveats | "three verification rounds, eighteen findings reproduced, fixed, and re-verified" |

Not the same Hermes as ours: ZAO's `bot/src/hermes/` is our own coder/critic/PR pipeline running on the Claude and Codex CLIs. A grep of it for "nous" found nothing.

### Every market figure and executive quote in the post is UNVERIFIED

The post states: "Every factual claim above was checked against its primary source on October 15, 2026." **The post contains no outbound links at all.** Its HTML has image URLs and nothing else, so no claim can be traced from the post itself. We did not fetch the primary sources. Each item below is NPC's claim:

- UNVERIFIED: Satya Nadella essay "Models as Insider Risks in the Super Intelligence Era", 2026-10-10, and the quote "...enables us to trust the model the least."
- UNVERIFIED: Dario Amodei, September 2026: "we must slow the pace...", and the call for third-party evaluators with "employee-like access". Also Sam Altman endorsing it, and Demis Hassabis proposing a standards body.
- UNVERIFIED: Jamie Dimon, JPMorgan Q3 call on 2026-10-13: "You don't want rogue agents, and it could be thousands of them." Also "the bank confirmed those specifics to CNBC".
- UNVERIFIED: Gartner, over 40 percent of agentic AI projects canceled by end of 2027 (press release, 2025-06-25). We tried this one: curl of the Gartner newsroom URL returned 403.
- UNVERIFIED: McKinsey, 88 percent regular AI use and 23 percent scaled agents (State of AI 2025).
- UNVERIFIED: PwC, 79 percent of US executives (spring 2025).
- UNVERIFIED: agent market at $7 to 8B now and $50 to 53B by 2030 (MarketsandMarkets, Grand View Research).
- UNVERIFIED: red-teaming at $1.52B to $20.2B by 2035 (SNS Insider), AI systems security at about $8B by 2030 (Dell'Oro).
- UNVERIFIED: Patronus AI $50M Series B; Bespoke Labs $40M.
- UNVERIFIED: Stanford AI Index count of 362 incidents in 2025; Arctic Wolf survey (53 percent of 1,350 leaders); Replit, Air Canada and CVE-2025-32711 incidents; EY assurance launch; EU AI Act postponement to December 2027.

### Two contradictions with NPC's own live system

1. **"Onchain-anchored" is not what the live API reports.** On 2026-10-17, `/v1/health` returned `"anchoring":"disabled"`, `"network":"none"` and "no chain writes until the mainnet gate clears". The Records page says of every agent record: "Anchor recorded locally; no chain write yet." The post was published two days earlier and says the reports are anchored on-chain.
2. **"All five audit reports publish alongside this article" - we could not find them.** The post links nothing. The `npcstore` publication lists 5 posts (Verified Agency 2026-09-29, Verified Humanity 2026-10-05, this post, Verified Origins 2026-10-16, and one from 2023), and none is a report. The Records page shows only `att_test_*` samples. We searched the post, the publication's post list and the Records page; we did not search X or ask NPC.

### Could NPC Labs verify ZOE or our agents?

**In shape, yes.** Their one detailed method is close to ZOE's riskiest surface. It is an inbox agent tested in rounds against a synthetic mailbox, with prompt-injection, phishing and wire-fraud messages, checking the read-and-draft boundary. ZOE reads the AgentMail inbox and drafts.

**Cost: UNKNOWN.** No audit price appears on verify.npclabs.xyz, npclabs.xyz, the API page or the post. Registration is free, but registration verifies nothing beyond "an owner was named". An audit is a separate, unpriced service. Only Bayo can say what it costs.

### Their audit against our default-FAIL evaluator (`.claude/rules/loop-evals.md`)

| | Our evaluator | NPC audit |
|---|---|---|
| Who grades | A separate subagent, fresh context, no write tools. But it is still our own system grading our own work | An outside company, which is the point the post makes ("the grader sits outside the model") |
| Evidence | Every criterion starts false and flips only on cited, opened evidence. The evidence sits in the PR, where anyone can re-check it | "Our verification methods stay internal." Reports are "sanitized ... results and discoveries only" |
| Unit graded | One PR at one head SHA | A configured deployment ("covers the configured deployment, not the bare framework") |
| Re-test on change | Every PR | Their own stated gap: "no automated re-test when learned skills change" |
| Output | PASS / NEEDS_WORK comment on GitHub | Signed verdict: sign, sign with caveats, would not sign |
| Cost | Our own Claude usage | Unpriced |

**Read:** the two are complements, not substitutes. Ours catches regressions per change and can be fully re-checked by anyone. It cannot answer the post's real point, that an organisation grading itself is still self-assessment. An NPC signature answers that point, but by its own description its method cannot be re-checked, which is what our `anti-fabrication.md` rule refuses to accept from anyone, ourselves included.

### Risks of an NPC audit of ZOE

1. **Methods are internal.** We would be trusting the verdict, not checking it. The signature proves only that NPC said it.
2. **Access means exposure.** An audit with real access sees private content (vault, DMs, inbox). Scope it to a synthetic mailbox with no production credentials, which is how they say they ran their own Hermes audit.
3. **The auditor sells the audit.** Of the two agents they signed, one is their own deployment and one is their paying first client.
4. **A public "would not sign" is reputational.** Their verdicts on others are published, so agree before starting what gets published.
5. **The anchoring claim and the missing reports** (above) need an answer before we cite an NPC report as evidence of anything.

## Community signal

No discussion of NPC Labs or "Verified by NPC" exists yet: HN Algolia search for `"Verified by NPC"` returned 0 hits; `npclabs` returned only fuzzy matches on other names. Reddit search returned 403 and the keyless Reddit fetcher has no credentials on this Mac, so Reddit is unsearched, not empty. The nearest community thread is HN "Ask HN: Do professional photographers need hardware-level image authentication?" (2025-11-01, 9 comments). Its top reply calls hardware image authentication a "Solution looking for a use case", and the thread converges on one point that applies to NPC: a provenance system is only useful once it is ubiquitous.

## Next Actions

| Action | Owner | Type | Gate |
|--------|-------|------|------|
| Ask Bayo three things: the price of an agent audit, where the five reports are published, and when chain anchoring turns on. Add the ZAO / ZAOstock merch angle | Zaal | DM | Outbound, Zaal |
| Only after those answers: decide whether to scope an NPC audit of ZOE's inbox triage on a synthetic mailbox with no production credentials | Zaal | Decision | Money + outbound, Zaal |
| Fix the "MPC" spelling in doc `events/841-bayo-zaal-mpc-atrium-bd` (it is NPC) | Research lane | Doc edit | none |
| Decide whether to register ZOE as a test agent once registration reopens (names Zaal as owner, permanent public record) | Zaal | Decision | Public, Zaal |
| Re-validate this doc when NPC drops `demo` from its key IDs or turns chain anchoring on | Research lane | Re-research | none |
| If adopted later: add an NPC record verifier as a resolver beside `src/lib/spore/trust.ts`, not a new module | Builder lane | Code (future) | PR review |

## Sources

- [FULL] https://verify.npclabs.xyz/ - curl, HTML stripped, read from disk
- [FULL] https://verify.npclabs.xyz/api - curl, full quickstart read
- [FULL] https://verify.npclabs.xyz/help - curl
- [FULL] https://verify.npclabs.xyz/plugins - curl
- [FULL] https://verify.npclabs.xyz/records - curl
- [FULL] https://verify.npclabs.xyz/search - curl (`/search/keys` returned 301, not followed into a JS page)
- [FULL] https://verify.npclabs.xyz/verify - curl
- [FULL] https://verify.npclabs.xyz/privacy - curl
- [FAILED - 404] `/llms.txt`, `/robots.txt`, `/.well-known/mcp.json`, `/openapi.json` on verify.npclabs.xyz
- [FULL] https://npclabs.xyz/ - curl
- [FULL] https://api.npclabs.xyz/v1/health, `/v1/keys`, `/v1/records/reg_6789fb4ca0f5363853a23dc0`, `/v1/records/reg_000000000000000000000000`, `POST /v1/mcp tools/list` - live JSON
- [FULL] https://pypi.org/pypi/npc-verify-mcp/json - official JSON API; sdist downloaded, LICENSE read
- [FULL] https://github.com/bayo-de/npc-verify-gemini - `gh api` metadata + LICENSE file
- [FULL] https://www.youtube.com/watch?v=E9Qzj3Wl0u4 - NPC Labs launch video, yt-dlp captions (3:16)
- [FULL] https://paragraph.com/@npcstore/verified-agent-swarms - Paragraph public API (`/api/v1/posts/ICaqjKqk6J1oyZpggXiY`, markdown field) plus a curl of the page, read from disk
- [FULL] Paragraph public API: publication `npcstore` and its post list
- [FAILED - 403] Gartner newsroom press release of 2025-06-25 (curl)
- [NOT FETCHED] every other primary source the post cites; all are marked UNVERIFIED above
- [FULL] https://hn.algolia.com/api/v1/items/45781008 - HN thread, official API, comment tree read
- [FAILED - 403 / no OAuth] Reddit search for `npclabs`
- [FAILED - curl 403] ChatGPT plugin listing linked from the Plugins page; not escalated to a signed-in browser, so "live in ChatGPT" rests on NPC's own Plugins page only
