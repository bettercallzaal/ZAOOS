---
topic: community
type: market-research
status: research-complete
last-validated: 2026-08-11
superseded-by:
related-docs: 625, 992, 1534, 1092, 533
original-query: "Research unique/novel opportunities to use POIDH (the on-chain bounty protocol) to spread and promote The ZAO's various projects and sub-brands (WaveWarZ, COC Concertz, FISHBOWLZ, ZABAL Gamez, The ZAO itself) - beyond the partnership-outreach angle already covered in zpoidh's docs/PARTNERSHIP-TARGETS.md and docs/GENERAL-BOUNTY-BOARD.md. Focus on: novel bounty formats or mechanics other POIDH issuers have used that BCZ hasn't tried yet, cross-promotion patterns (using a POIDH bounty about one ZAO project to drive discovery of another), and any POIDH ecosystem features/integrations (albums, OPEN vs SOLO, multi-chain) that could be repurposed for propagation rather than just task completion."
tier: STANDARD
---

# 2266 - POIDH as a cross-project propagation engine (not just a bounty tool)

> **Goal:** Find real, unused mechanics - POIDH's own features and other issuers' actual campaigns - that BCZ/ZAO could use to spread WaveWarZ, COC Concertz, FISHBOWLZ, and ZABAL Gamez to each other's audiences, not just to run one-off task bounties.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Biggest opportunity | **ACTIVATE the already-written playbook, don't invent a new one.** Doc 625 (2026-05-21) has 18 ready-to-post POIDH bounty templates spanning ZAO Stock, WaveWarZ, Fractal Monday, COC Concertz, and BCZ personal. Verified live 2026-08-11: zero of the WaveWarZ/COC Concertz/Fractal/ZAO-Stock templates have ever been cast - `wwbase` and `cocconcertz` repos have no POIDH bounty history at all (one code-reuse mention in `cocconcertz/docs/coc7-prep-checklist.md`, not a live bounty). Only the BCZ/ZABAL Gamez line (R1-R7) ever materialized. The propagation gap isn't "what ideas exist" - it's that 13 of 18 pre-written templates for OTHER ZAO projects are still sitting unused 3 months later. |
| Album strategy | **DECIDE the album question before scaling to more brands.** `org.config.json`'s `farcaster_album` is `"wethemmedia"` - confirmed live in `data/claims.json`: all 3 cast BCZ bounties (R1/R2/R3) land in POIDH's `wethemmedia` album, not a ZAO-owned one. Doc 625 recommends the opposite: everything under `poidh.xyz/a/thezao` as "the ZAO bounty resume," with per-brand sub-albums (`/a/wavewarz`) only once a sub-brand has 10+ bounties of its own. Current state is a hybrid nobody chose deliberately - it's WTM's audition-format lineage carried through, not a propagation decision. Pick one: keep riding WTM's album (real audience, but Zaal says WTM is "less active right now" per this session) or start `/a/thezao` now, before volume makes a switch costly. |
| Untried amplification mechanic | **USE the whale-catalyst-deposit pattern** - a recognizable wallet publicly adding funds to an already-live OPEN bounty mid-window. Confirmed real and documented in BCZ's own `bettercallzaal.com/poidh-bounty-best-practices.html`: Jesse Pollak added 0.25 ETH to a $5 bounty (POIDH bounty 906) and "triggered a submission wave + amplified signal in /poidh." BCZ has run one OPEN bounty (R4) but never as a live-amplification play - no publicized catalyst deposit mid-window. This is the single most POIDH-native mechanic for cross-project propagation: have a WaveWarZ-recognized wallet catalyst-deposit into a ZABAL Gamez bounty (or vice versa) mid-window, cast about it from both project accounts. |
| Untried cross-brand-homage format | **USE a bounty about one ZAO project that structurally requires referencing a sister project.** Precedent found on POIDH itself: a community bounty ("HIGHER logo on Strava," bounty 473 on Degen) was explicitly built as an homage to another brand's earlier challenge, cross-pollinating both audiences through the bounty's own framing. BCZ has never run a bounty where the submission requirement itself bridges two ZAO sub-brands (e.g. "clip a WaveWarZ battle moment that name-drops ZABAL Gamez" or "COC Concertz show photo + one sentence on how it connects to The ZAO"). |
| Meta-bounty for idea generation | **RUN a "best POIDH bounty idea" meta-bounty**, Kenny's own pattern for POIDH itself: a monthly ~$100 open bounty where the prize is "whoever proposes the most creative/whimsical/community-enriching bounty idea wins the pot," per Kenny's 2026-05-05 BCZ YapZ interview (Ep 19). This crowdsources propagation ideas directly from ZAO's own community instead of staff/agent ideation - the literal answer to "what unique bounty ideas exist" becomes a bounty itself. |
| Agent-run bounty reference architecture | **STUDY, don't yet copy, poidh-sentinel** (`github.com/0x94t3z/poidh-sentinel`, open source) - a fully autonomous Farcaster-mini-app agent that creates POIDH bounties from natural-language chat, cron-polls submissions every minute, AI-evaluates proof (deterministic pre-scorer + OCR + vision + LLM), and resolves winners on-chain with no human step after deployment. R7's own README already frames it as "the trust-ladder first step for ZOL toward money actions... without ever holding funds" - poidh-sentinel is proof the full autonomous version is buildable today, and its human-gated subset (suggest + evaluate + recommend, human confirms `acceptClaim`) is a closer match to ZAO's stated approval-gated ethos (doc 992). Worth a read-through before ZOL's next trust-ladder step, not a build-now item. |
| Format ZAO hasn't touched | **CONSIDER a cross-app integration bounty**, modeled on Log a Dog x POIDH (`logadog.xyz/poidh`, ran July 4-6 2026): a partner app handles the primary action (logging/proof on their own onchain app), POIDH is layered on top purely as the prize/payout rail, with the partner app's own audience discovering POIDH (and by extension ZAO) as a side effect. This is the inverse of BCZ's current model (BCZ owns the bounty AND the content) - it's a distribution play where the OTHER app's users are the ones who find ZAO. |

## Findings

### 1. The real gap: an unused playbook, not a missing idea (grounded in ZAO's own repos)

Doc 625 (`research/community/625-poidh-zao-bounty-playbook/`, last-validated 2026-05-21) already contains 18 fully-specified bounty templates split across ZAO Stock (5), WaveWarZ (4), Fractal Monday (3), COC Concertz (2), and BCZ personal (4) - complete with prize tiers (TIER A 0.005-0.01 ETH proof-of-attendance through TIER D 0.1-0.3 ETH campaign-grade), NFT series naming conventions (`WaveWarZ Battle Photog Season 1 #007`, `COC Witness #NNN`), and a checklist workflow. This session verified directly against the WaveWarZ (`wavewarz-dj-wavy-mobile`) and COC Concertz (`cocconcertz/CoCConcertZ`) local repos: neither has ANY live POIDH bounty history. `grep -rli poidh` across both returns nothing for WaveWarZ and exactly one hit for COC Concertz - a code-reuse note in `docs/coc7-prep-checklist.md` ("patterns from zabalartsubmission + zpoidh"), not an actual cast bounty.

Meanwhile BCZ's own line (zpoidh repo) shipped R1 through R7 in the same window doc 625 covers. The infrastructure, the templates, and the operational muscle memory (judging discipline, NFT naming, cross-post checklist) all exist. What never happened is casting even one of the 13 non-BCZ templates. This is the single highest-leverage move available: it requires zero new research, zero new tooling, only a decision to run WaveWarZ Template #6 ("Battle Photog") or COC Concertz Template #13 ("Show Witness") using the exact same `docs/create-bounty.html` tool zpoidh already built for BCZ's own rounds.

### 2. Album fragmentation is real, undecided, and directly shapes propagation

POIDH's album system (per Gitcoin's writeup, confirmed live) works like "subreddit-style collections for organizing bounties by theme, community, or purpose" - the canonical example is `poidh.xyz/a/publicgoods`. Doc 625 explicitly recommends ZAO consolidate everything under `poidh.xyz/a/thezao` to build a compounding "bounty resume," with per-sub-brand albums only once a sub-brand independently clears 10 bounties.

Checked against the live repo (`data/claims.json`, `org.config.json`): every BCZ bounty cast so far (R1 1151, R2 1166, R3 1180) carries `"album": "wethemmedia"`, matching `org.config.json`'s `farcaster_album: "wethemmedia"` field. This isn't a bug - `docs.poidh.xyz`'s ICM box notes BCZ's format is explicitly "We-Them-Media (WTM) audition style," so the album choice is lineage from the format, not an accident. But it also means every BCZ POIDH bounty's permanent on-chain home is WTM's album, not a ZAO-owned one - at exactly the moment (per this session) WTM is "less active right now." If WaveWarZ or COC Concertz bounties get cast using the same `farcaster_album` default, they'd ALSO land in `wethemmedia`'s album rather than building a ZAO or per-brand resume. This is a genuine decision point sitting unexamined in the config, not a research gap - worth resolving before scaling bounty volume across more sub-brands.

### 3. POIDH's own amplification mechanics, confirmed real

`words.poidh.xyz`'s own v2 writeup (poidh's official blog, 2024-05-08) confirms Open Bounties are POIDH's only native multi-party mechanic: anyone can add funds after creation, contributors get proportional voting rights, and a claim needs >50% weighted approval once external contributors exist (else it degrades to solo-style direct accept). Contributors can withdraw any time voting isn't active; the bounty issuer can cancel any time except during an active vote.

BCZ's own best-practices doc (`bettercallzaal.com/poidh-bounty-best-practices.html`) documents two concrete amplification wins already observed in the wild: the Haberdashery's $30K Guinness-record kickflip bounty (many contributors stacking into one pot, "each becomes a promoter," 100K+ views) and Jesse Pollak's public 0.25 ETH deposit onto a $5 bounty ("public deposit by recognizable wallet triggers a submission wave"). BCZ has run one OPEN-format round (R4, per `org.config.json`'s `rounds` array) but never specifically staged a public catalyst deposit mid-window from a recognizable wallet - that's the unused half of the mechanic.

### 4. Real cross-brand-homage precedent exists on POIDH itself

Farcaster user Yorki cast a POIDH bounty (Degen chain, bounty 473, 2024) explicitly framed as inspired by another brand's earlier challenge ("this bounty idea inspired by @esdotge @higherathletics from the challenge to make a HIGHER logo on Strava... I actually wanted to make a DEGEN logo at Strava"). The bounty's own description does the cross-pollination work - anyone who finds it via the HIGHER/Strava connection discovers Degen, and vice versa. BCZ's rounds so far are all self-contained (a ZABAL Gamez bounty about ZABAL Gamez); none structurally require touching a second ZAO brand.

### 5. Kenny's own meta-bounty format (unreleased-to-BCZ pattern)

In his 2026-05-05 BCZ YapZ interview (Ep 19, full transcript reviewed), Kenny described POIDH's internal practice: a recurring ~$100/month open bounty where the prize goes to whoever proposes "the bounty which inspires the most creative, whimsical, or community enriching claims" - anyone can add funds to boost the pot, and the winning IDEA becomes the next real bounty. BCZ has never run this format - every BCZ round to date pays for a deliverable (a clip, a fix), never for a bounty CONCEPT itself.

### 6. Autonomous agent-run bounties are a proven, open-source pattern

`github.com/0x94t3z/poidh-sentinel` is a live, open-source Farcaster mini-app that runs the full POIDH bounty lifecycle autonomously: natural-language bounty creation via chat mention, cron-based submission polling (every minute), a deterministic-plus-vision-AI-plus-LLM evaluation pipeline, and on-chain winner resolution with "no human step after deployment." It also runs a secondary "is this AI-generated" forensic check using dual-pass `gpt-4o` calls. This directly relates to R7's stated framing (`rounds/r7/README.md`) of itself as "the trust-ladder first step for ZOL toward money actions... without ever holding funds" - poidh-sentinel proves the fully-autonomous end state is real and shippable today; its architecture (especially the human-gated subset - suggest + evaluate + recommend, human still calls `acceptClaim`) is the closer analog to ZAO's documented approval-gated posting model (doc 992's clipper-agent decision: "Auto-post? NO for now... a human fires").

### 7. Partner-app-hosted POIDH bounties: an inversion worth naming

`logadog.xyz/poidh` ran a live Fourth-of-July campaign (July 4-6, 2026) where Log a Dog (an onchain hot-dog-eating-proof app) handled the primary action and POIDH was layered on top purely as the ETH prize/payout rail - "Log a Dog handles the onchain proof. POIDH handles the bounty payout." Participants discover POIDH (and whoever POIDH's visible partners are) as a side effect of using Log a Dog, not the other way around. ZAO's current model is the opposite - BCZ owns both the bounty and the underlying content (a clip about a ZAO episode). No ZAO project has been the "hosting app" in a Log-a-Dog-style arrangement where an OUTSIDE audience discovers ZAO via the payout layer.

### 8. Comparison: why POIDH stays primary for ZAO's propagation plays specifically

| Dimension | POIDH | Bountycaster |
|---|---|---|
| Funding model | On-chain escrow (smart contract) | Off-chain, peer-to-peer, honor system |
| Trust | Trustless escrow, protocol-enforced payout | Issuer can ghost |
| NFT artifact / brand asset | Yes - claim NFT + album system | None |
| Discoverability surface | `/poidh` channel + permanent album | `@bountybot`-indexed casts only |
| Mini App / inline distribution | Yes, Frame v2 `launch_frame` - every cast is a tappable launcher | No native frame |

(Table sourced from doc 625's own comparison, reconfirmed live against `docs.poidh.xyz` and Bountycaster's public materials.) POIDH's album + NFT system is specifically what makes it the right tool for propagation (a compounding, ownable brand asset) versus Bountycaster, which is better suited to one-off bilateral-trust bounties without a visual artifact.

## Also See

- [Doc 625 - POIDH x ZAO Bounty Playbook](../625-poidh-zao-bounty-playbook/) - the 18 unused templates this doc's top recommendation is about activating
- [Doc 992 - Live clipper agent for ZAO streams](../../agents/992-live-clipper-agent-creator-ops/) - the clip-to-POIDH pipeline R5's own README already cites; human-gated posting precedent relevant to Finding 6
- [Doc 1534 - ZAO Devz Bounty Campaign](../../technology/1534-zao-devz-bounty-campaign/) - a similar propagation attempt (R8 WaveWarZ mini-app bounty, R9 marketplace bounty) proposed 2026-07-18 for a Jul 25-Aug 15 window that has now passed uncast - same activation gap as Finding 1, different sub-brands (mini app / marketplace bounties, not clip bounties)
- [Doc 1092 - Web3media POIDH bounty options](../../business/1092-web3media-poidh-bounty-options/) - BCZ's own first-bounty decision doc, same album/EOA/prize-tier questions this doc revisits at cross-brand scale
- zpoidh repo (`bettercallzaal/zpoidh`) - `docs/PARTNERSHIP-TARGETS.md`, `docs/GENERAL-BOUNTY-BOARD.md` - the outreach-target research this doc was explicitly scoped to go beyond

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide album strategy: keep `wethemmedia`, switch to `/a/thezao`, or start per-brand albums now (shipped = `org.config.json`'s `farcaster_album` field updated + a one-line note on why) | @Zaal | Decision | 2026-08-18 |
| Cast one non-BCZ template from doc 625 as a real test (WaveWarZ Battle Photog or COC Concertz Show Witness) via `docs/create-bounty.html` (shipped = live bounty ID on poidh.xyz) | @Zaal | Task | 2026-08-25 |
| Run a public whale-catalyst-deposit moment on the next OPEN-format ZABAL Gamez bounty, publicized from a second ZAO-recognized wallet (shipped = a bounty page showing a mid-window contributor add + a cast calling it out) | @Zaal | Task | wontfix until next OPEN round is cast |
| Read poidh-sentinel's evaluation pipeline (`github.com/0x94t3z/poidh-sentinel`) as reference architecture before ZOL's next money-adjacent step (shipped = a one-paragraph note in R7's closeout on what ZOL would/wouldn't adopt) | @Zaal | Task | 2026-08-22 |

## Sources

- [FULL] Doc 625 - POIDH x ZAO Bounty Playbook (ZAO OS V1 internal research, 2026-05-21) - `research/community/625-poidh-zao-bounty-playbook/README.md`
- [FULL] Doc 992 - Live clipper agent for ZAO streams (ZAO OS V1 internal research, 2026-07-08) - `research/agents/992-live-clipper-agent-creator-ops/README.md`
- [FULL] Doc 1534 - ZAO Devz Bounty Campaign (ZAO OS V1 internal research, 2026-07-18) - `research/technology/1534-zao-devz-bounty-campaign/README.md`
- [FULL] `bettercallzaal.com/poidh-bounty-best-practices.html` - BCZ's own best-practices doc (Jesse Pollak whale-deposit example, Haberdashery kickflip, cross-post discipline)
- [FULL] words.poidh.xyz - "how poidh v2 open bounties work" (official protocol blog, 2024-05-08) - open bounty contributor/voting/withdrawal mechanics
- [FULL] docs.poidh.xyz - POIDH v3 official docs (contracts, chains, features)
- [PARTIAL - search highlights only, not the full page] Gitcoin - poidh app listing (`gitcoin.co/apps/poidh`) - album system description, $65K funding volume, Public Goods Album description
- [FULL] github.com/0x94t3z/poidh-sentinel - README (autonomous POIDH bounty agent architecture)
- [PARTIAL - Farcaster cast highlight only] Yorki on Farcaster (`farcaster.xyz/yorki/0xb84de9aa`, 2024-07-10) - cross-brand-homage bounty example (HIGHER/Strava -> Degen)
- [FULL] BCZ YapZ Ep 19 w/ Kenny (bczyapz.com/ep/2026-05-05-kenny-poidh, transcript) - Kenny's internal meta-bounty format, "SMART goals for POIDH" framing
- [PARTIAL - search highlight only] logadog.xyz/poidh - Log a Dog x POIDH Fourth of July campaign page
- [FULL] zpoidh repo, verified live 2026-08-11 - `org.config.json`, `data/claims.json` (album field per bounty), `wavewarz-dj-wavy-mobile` + `cocconcertz/CoCConcertZ` local repos (grep for any POIDH usage)
