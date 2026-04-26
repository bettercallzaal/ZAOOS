---
topic: business
type: guide
status: research-complete
last-validated: 2026-04-25
related-docs: 485, 474, 470, 432, 264, 311, 051, 363, 475, 498, 506
tier: DEEP
---

# 526 - Distribution Is Hard V3, Applied: Per-Entity Playbooks for the ZAO Stack

> **Goal:** Take V3 (jlcolton) principles already extracted in doc 485 and turn them into concrete distribution playbooks for every shipping ZAO entity as of 2026-04-25 - ZAO OS, ZAOstock, ZAO Music, the new ZAO Devz dual-bot stack, Hermes, BCZ Strategies, and the paused FISHBOWLZ.

## Why This Doc Exists (Not 485)

Doc 485 distilled V3's principles. Doc 474 fixed the canonical ZAO ICP after FounderCheck flagged it BLOCK. This doc is the third stage: **per-entity operating playbook**. Each ZAO entity has its own best-fit customer, its own job-to-be-done, its own first-believers cluster, and its own "where they whisper about the problem" channel. Treating them as one bucket is the broad-targeting failure V3 calls out (Snapdeal, Paytm Mall, The Messenger).

V3 keeps repeating: "If everyone's your customer, no one is." ZAO has six shipping surfaces and one paused one. They need six plans, not one.

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| One distribution doc for all ZAO entities? | KILL - per-entity playbooks below. Each gets its own best-fit customer, job, channel set, magic-words log. |
| Apply V3 "before-state trigger" gate to every new ZAO product? | USE - no new ZAO surface ships until N=10 first believers can describe a recent specific failure + workaround tried. Wire into `/worksession` + FounderCheck (doc 474). |
| Behavioral-state filter in interview log? | USE - tag every captured pain phrase as `mid_failure | anticipating | theorizing`. Mid-failure phrases get 10x weight in messaging. Add column to `research/community/pain-log-{YYYYMM}.md` (new). |
| Build-in-public the ZAO Devz bot stack itself? | USE - the dual-bot Coder/Critic loop IS distribution content. Cast every PR open + critic-score in /base + /agents + LinkedIn. Pattern = ShipFast 1K to 45K Twitter arc translated to Farcaster. |
| Replace ZAOstock "find artists" with "open submission" framing? | LOCKED IN per memory `project_zaostock_open_call.md` - distribution job for ZAOstock is "indie artist gets booked at curated festival", not "find artists." The open call IS the distribution mechanism. |
| Hermes critic bot = independent product or feature of Devz? | KEEP as critic-only feature for now, separate Telegram identity. V3: don't try to serve two best-fit customers. Hermes-as-standalone gets its own playbook only after Devz hits N=10 paying believers. |
| Re-launch FISHBOWLZ post Juke partnership? | DO NOT until V3 audit passes per `feedback_no_unauthorized_commitments.md`. Audio-room job is being done by Juke (doc - nickysap). FISHBOWLZ failed at the job layer, not the tech layer. Revisit only with a different job. |
| Cross-post ZAO Music releases (Cipher = #1) before V3 audit? | BLOCK - apply V3 ch4 "post the pain not the product" first. Pre-release: 10 cypher participants describe their before-state in their own words, post those, watch who self-IDs as next-cypher participant. |

## V3 to ZAO Entity Map (One Sentence Each)

V3 says: "I'm building for [role] who struggles with [pain], has tried [workarounds], and is looking for [desired outcome]. I can reach them through [channel]."

| Entity | Best-Fit Customer | Job (Functional + Emotional + Social) | Channel Where They Whisper |
|---|---|---|---|
| **ZAO OS** | Independent musician, 100-10k monthly listeners, no label, releasing monthly, crypto-curious not native, owns/controls masters | F: distribute new releases to listeners who actually care; E: feel less alone vs. label rosters; S: be seen as part of a serious indie collective | Bandcamp comment threads, Spotify-for-Artists subreddits, /music + /rcrdshp + /spinamp on Farcaster (doc 474) |
| **ZAOstock** | Independent Maine + Northeast US artist with a real live set, frustrated by pay-to-play festival circuits + Spotify economics | F: get a booked, paid stage at a curated festival on Oct 3 with venue infra handled; E: feel respected as an artist not a content unit; S: be associated with The Art of Ellsworth + ZAO Festivals umbrella (memory `project_zao_festivals_umbrella.md`) | Steve Peer rolodex (doc - `project_steve_peer.md`), Roddy Parklet circle, local Ellsworth/Bar Harbor venues, Maine indie press, `@ZAOstockTeamBot` on Telegram for current submitters |
| **ZAO Music (DBA)** | ZAO member who has shipped music before, ready to release Cipher = #1, will collaborate with DCoop / GodCloud / Iman team (doc 475) | F: actually release a track that gets distributed via DistroKid + 0xSplits + BMI without the major-label tax; E: prove the label-less model works; S: be on the founding ZAO Music release roster | Internal Discord/Telegram first - this is supply-side distribution, the job is to land the release pipeline before broadcasting it |
| **ZAO Devz / Hermes (dual-bot)** | Engineer building agentic dev tools, frustrated by single-agent Claude Code review blind spots, has tried PR linters and code review GPTs and finds them shallow | F: get a Coder + Critic loop running on real git issues with a numeric score before merge; E: trust your own automation enough to ship Friday; S: be seen on /agents + /base as someone shipping multi-agent infra not vibes | /base + /agents on Farcaster, Hacker News (when you have a numeric "Critic scored 87/100" hook), LinkedIn HSLC posts (doc 264), the dev's existing Telegram + GitHub graph |
| **BCZ Strategies (agency)** | Maine local business with low Google rank, knows they need digital marketing but has been burned by an agency before, owner-operator with under 10 employees | F: get more inbound from the same physical zip code without paying $3k/month retainer; E: stop feeling left behind by digital natives; S: be the bar/restaurant/shop that actually adapted to 2026 | Local Ellsworth/Bar Harbor walk-ins + cold pitch (memory `project_bcz_consulting_apr10.md`), Maine small-biz Slack/FB groups, NOT Farcaster |
| **FISHBOWLZ (paused)** | N/A - the audio-room job is now Juke's (per `project_fishbowlz_deprecated.md`). Re-entering needs a different job, not a different feature set. | N/A | N/A |

## Per-Entity Playbook (V3 Loop, ZAO-Specific)

### ZAO OS

V3 chapter 1 loop: talk-capture-share-watch-iterate. Already partly running via fractal + Empire Builder + cross-post. Sharpen by:

1. Pain-log every ZAO member onboarding call. Capture exact phrase. Tag behavioral state.
2. Ship one cast per week to /music using a member's exact pain phrase, not ZAO marketing copy. Reference `feedback_brainstorm_before_writing.md` - brainstorm with Zaal first.
3. Drop the "crypto-first" framing in any external copy (per doc 432 Tricky Buddha context: music first, community second, tech third).
4. Magic-words to listen for and amplify: "I dropped a track and got 12 plays," "I'm tired of begging for playlist adds," "my masters are mine but the audience isn't."

What NOT to do: post in /founders, lead with "Base chain," show ZAO governance UI to a non-tech artist on first contact.

### ZAOstock (Oct 3 2026, Franklin St Parklet)

V3 chapter 2 first-believers playbook applied to a real-world music festival:

1. **First believers = the 17 already-signed-up artists** (per `feedback_no_regenerate_codes.md`). They are the proof, NOT the marketing target. Treat as co-creators.
2. **Open call as distribution**: per `project_zaostock_open_call.md` the submission form IS the distribution mechanism. Cutoff approx 1 month before event = early Sept 2026. Frame as "submit your set" not "find artists."
3. **Co-treatment-plan move (V3 oncology pattern)**: every booked artist gets a personal social rollout + 1-pager from `/onepager` skill + named slot. Mirrors how Pfizer became Stormboard's first vertical.
4. **Pre-event V3 test**: post 3 casts using exact submitter pain phrases ("I keep paying $50 to a venue and getting 3 friends in the door"). Watch who self-IDs.
5. Roddy Ehrlenbach meeting Tue 2026-04-28 (memory `project_roddy_parklet_contact.md`) is the venue gate. Distribution plan locks AFTER that meeting, not before.

What NOT to do: invent reward thresholds in DMs (`feedback_no_unauthorized_commitments.md`), pick dates beyond Oct 3 + 4/28 (`feedback_no_unilateral_dates.md`), promise gate-mechanic benefits without Zaal sign-off, brand it crypto-first.

### ZAO Music (Cipher release #1)

V3 chapter 4 "test before you build" + chapter 6 jobs framework:

1. Concierge-MVP the release (V3 Food on the Table pattern): manually walk Cipher through DistroKid + 0xSplits + BMI registration once, document each step in `research/music/`, BEFORE building any tooling around it.
2. Pre-sale evidence gate: 10 ZAO members say "I'd ship my next track this way too" with a specific reason (their last bad release experience). If under 10, do not productize.
3. Functional job: distribute + collect + split. Emotional job: prove label-less works. Social job: be a founder release.
4. Distribution = supply-side first - team (DCoop / GodCloud / Iman per doc 475), THEN external once one full release is in market with real numbers.

What NOT to do: license to CD Baby or Revelator (memory `project_zao_music_entity.md` - major-owned 2026), market the pipeline before one release ships, treat this as a software product.

### ZAO Devz Bot Stack (live 2026-04-24, dual-bot in DEVZ Telegram)

V3 chapter 7 distribution-first founder playbook applied to the bot stack itself. The bot's behavior IS the marketing.

1. **The product output IS the distribution** (V3 Whatmore pattern): every Coder + Critic exchange in the DEVZ Telegram is a public-grade demo. Pipe top-rated runs to a `bot/runs/` archive, redact secrets per `.claude/rules/secret-hygiene.md`, and produce a weekly "Critic scored these 5 PRs" cast.
2. **Build-in-public hook formulas (doc 264 HSLC)**:
   - "Critic scored my Friday PR 42/100. Coder retried. Score 87. Here's the diff."
   - "Two bots reviewed each other's work this week. One found a SQL injection the other missed."
   - "Hermes uses Claude Code CLI on Max sub, not API. Saved $X this month vs API billing." (per `feedback_prefer_claude_max_subscription.md` + `project_zaostock_bot_live.md`)
3. **First believers = QuadWork users + Zlank cohort** (memory `project_zlank.md`) - they already get the multi-agent value prop. Start there, not Hacker News.
4. **Channel set**: /agents + /base on Farcaster, LinkedIn HSLC posts every 2 weeks, GitHub README with score-graphs, NOT generic /founders.
5. **Behavioral-state filter**: only count pain phrases from devs in mid-failure ("my single-agent code review just merged a regression yesterday"). Theorizing pain ("review tooling could be better") = noise.

What NOT to do: pitch to non-engineers, lead with the dual-bot architecture diagram (lead with the score number), market Hermes separately yet, cross-post to merged PRs (`feedback_no_merged_pr_code.md`).

### Hermes (Critic role only, for now)

V3 says: don't pick a second best-fit customer until the first one has 10 paying believers. Hermes stays inside the Devz bot stack as the critic identity. No standalone playbook until Devz proves out.

When/if Hermes spins out: best-fit customer = "engineer who tried Claude Code review and wants a second opinion before merge." Same magic words as Devz but flip emphasis to review-quality not loop-velocity. Revisit Q3 2026.

### BCZ Strategies

V3 chapter 5 best-fit customer + chapter 7 fieldwork mindset (Calacanis). Per memory `project_bcz_consulting_apr10.md` + `project_bcz_agency.md`:

1. Field work, not Farcaster. Walk into 10 Maine local businesses with rank-3+ Google placement. Ask V3's 5-question interview: "walk me through last time a customer didn't find you online."
2. Pain-log exact phrases. Magic words to expect: "I bought a Yelp ad and nothing happened," "my last agency ghosted me after 60 days," "my kid set up my Instagram three years ago."
3. Job: more inbound from same zip code. Emotional: stop feeling left behind. Social: be the local biz that adapted.
4. Distribution mechanism = ZAO community as the workforce. The agency model IS distribution-first because the supply side is pre-built.
5. Pricing test: $5 paid-validation V3 move - charge $50 for a 1-hour audit on the cold pitch. Seven yeses = real, three yeses = signal, zero yeses = wrong job.

What NOT to do: lead with crypto, price like a SF agency, target tech-forward businesses (V3 first-believer = the most-frustrated, not the most-sophisticated).

### FISHBOWLZ (paused)

Per `project_fishbowlz_deprecated.md` - paused 2026-04-16 for Juke partnership. V3 lesson when revisiting: the audio-room functional job is now Juke's. Re-entry needs a NEW job, e.g. "fishbowl-style accountability circles for ZAO contributors" (closer to doc - `project_zao_contribution_circles.md`). Do not re-spin under the old job.

## Magic Words Listening Log (Per Entity)

V3 says: write down their exact phrases. Add them to messaging verbatim. Below = phrases already heard or to listen for, ZAO-specific. Add weekly to `research/community/pain-log-{YYYYMM}.md`.

| Entity | Mid-Failure phrase to listen for | Active-Workaround signal | Don't-build-around (Vague Dissatisfaction) |
|---|---|---|---|
| ZAO OS | "I dropped my track yesterday and Spotify gave me 14 plays" | "I'm running 4 different distro accounts to track payouts" | "social media could be better for artists" |
| ZAOstock | "Last festival I paid to play and lost $200" | "I email 30 venues a month manually" | "Maine needs more music events" |
| ZAO Music | "DistroKid took 9% on my last release and BMI lost my registration" | "I have a Google Sheet of my royalty splits" | "the music industry sucks" |
| ZAO Devz | "Claude reviewed my PR Friday, merged Saturday, broke prod Monday" | "I run 2 review passes manually before merging" | "AI code review needs work" |
| BCZ | "I paid Yelp $400 last month for 1 call" | "My nephew runs my Instagram on weekends" | "I should do more digital" |

## Behavioral-State Weighting (Doc Food Labs Pattern)

V3 calls this out explicitly: a mid-failure signal is worth 10x a theorizing one. Tag every entry in the pain log:

- `mid_failure` - happening this week, source can quote the dollar/time cost. Weight 10.
- `anticipating` - happened recently, worried it repeats. Weight 3.
- `theorizing` - heard about it, hasn't lived it. Weight 0.5 (almost noise).
- `paid_and_failing` - top-tier signal, V3 strongest. Weight 15.
- `active_workaround` - they built a manual fix. Weight 8.

Apply this filter before any ZAO surface ships outbound copy. Generic-pain copy = Snapdeal failure mode.

## 30-Day Distribution Sprint Per Entity (Concrete Calendar)

Run weekly. Each entity owner does the four-week loop. Output goes into `research/community/pain-log-{YYYYMM}.md` + a per-entity cast/post calendar.

| Week | All Entities Do |
|---|---|
| W1 | 10 conversations. Capture 3 magic phrases per convo. Tag behavioral state. |
| W2 | Pattern review. Pick top phrase by behavioral-state weight. |
| W3 | 3 casts/posts using that phrase verbatim, on the entity's channel set. Track DMs. |
| W4 | Refine best-fit customer one-sentence. Ship one update based on top pattern. Document for build-in-public. |

Do NOT batch entities. ZAO OS sprint and ZAOstock sprint and Devz sprint run in parallel with separate logs.

## Cross-Links

- [Doc 485](../485-distribution-is-hard-v3-jlcolton/) - V3 principles extraction (canonical summary of source material)
- [Doc 474](../474-foundercheck-block-icp-resolution/) - Canonical ZAO ICP, channel correction, FounderCheck BLOCK fix
- [Doc 470](../470-behavioral-intervention-vs-financial-literacy-zao/) - Why education-only fails (0.1% behavior change), where ZAO's wedge actually is
- [Doc 432](../../community/432-zao-master-context-tricky-buddha/) - Music first, community second, tech third positioning
- [Doc 264](../264-linkedin-build-in-public-playbook/) - HSLC post structure, hook formulas, anti-AI-slop hooks
- [Doc 311](../../311-vibe-coded-apps-marketing-playbook/) - Adjacent vibe-coded marketing playbook
- [Doc 051](../../community/051-zao-whitepaper-2026/) - Whitepaper canonical artist-first language
- [Doc 363](../../community/363-zao-stock-people-brands-2026/) - ZAOstock people + brands
- [Doc 475](../475-zao-music-entity/) - ZAO Music DBA + team + Cipher = release #1
- [Doc 498](../498-zlank-unified-sdk-concept/) - Zlank cohort, source of Devz bot first believers
- [Doc 506](../../dev-workflows/506-trae-ai-solo-bytedance-coding-agent/) - SKIP-but-steal patterns for bot stack

## Specific Numbers Anchored

- **17** ZAOstock artists already signed up (memory `feedback_no_regenerate_codes.md`)
- **188** ZAO members today, primary ICP source (`project_four_pillars.md`)
- **$0.003** Spotify per-play, $33 per 10k plays - the streaming pain anchor (whitepaper doc 051)
- **90+ weeks** fractal meetings running, real revealed-preference WTP evidence (doc 106 + 474)
- **0.1%** behavior change from standalone education (doc 470 168-study meta) - drives the "distribute-with-them not teach-them" wedge
- **10** minimum first-believer N before any ZAO surface ships outbound copy (V3 ch4 + ch5)
- **15** weight on paid-and-failing pain signals vs 0.5 on theorizing (Dog Food Labs pattern)
- **2026-04-28** Roddy Parklet meeting - distribution plan for ZAOstock locks AFTER, not before
- **2026-10-03** ZAOstock event date (memory `project_zao_stock_confirmed.md`)
- **early-Sept 2026** ZAOstock open-call cutoff (~1 month before event per `project_zaostock_open_call.md`)

## Risks

- Per-entity playbooks require per-entity owners. Today Zaal owns most. Without delegating one playbook to a community member, all six become bottlenecked on one calendar.
- Magic-words logs require discipline. If the pain-log doesn't get filled weekly, the system reverts to whiteboard messaging (V3 Housing.com failure mode).
- Build-in-public for the bot stack assumes Devz output is share-grade. Secret hygiene per `.claude/rules/secret-hygiene.md` MUST run on every redacted run before public posting. One leaked deployer key undoes the entire distribution surface.
- BCZ field work is offline labor. V3 doesn't scale this for you - it has to be done in person. Calendar accordingly.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Create `research/community/pain-log-202604.md` with behavioral-state column | Zaal + ZOE | New file + skill update | This week |
| Wire FounderCheck-style 4Q gate into `/worksession` skill so every new `ws/` branch captures best-fit customer one-sentence + recent failure + workaround + channel | Zaal | Skill edit at `~/.claude/skills/worksession/skill.md` | After Roddy meeting |
| Add `bot/runs/` redacted-archive output for ZAO Devz dual-bot Coder/Critic exchanges | ZAO Devz bot maintainer | PR to bot/ | Within next 5 commits |
| Cast ZAOstock submitter-pain phrase verbatim in 3 places (/music, ZAO Telegram, Maine Slack) | Zaal | Manual cast | Wait until after Roddy 4/28 venue confirmation |
| Pre-validate Cipher release with 10 ZAO members before any tooling - V3 concierge MVP | Zaal + ZAO Music team (DCoop, GodCloud, Iman) | 1:1 calls + pain log | Before Cipher release |
| BCZ field test: 10 cold walk-in pitches in Ellsworth/Bar Harbor, capture exact phrases | Zaal | Field work | Within 30 days |
| Promote this doc + Doc 474 + Doc 485 to top of `research/business/README.md` GTM index | Zaal | README edit | Same day as merge |
| Re-evaluate FISHBOWLZ re-entry only when a NEW job hypothesis exists, not a new feature | Zaal | Block until proposed | No earlier than Q3 2026 |

## Sources

- [Distribution Is Hard V3 - jlcolton](https://github.com/jlcolton/distribution-is-hard) - source book V3, full text ingested in this session
- [FounderCheck mini-app on Farcaster](https://farcaster.xyz/miniapps/Qe6jQvs9RG_o/foundercheck) - 4Q diagnostic referenced in V3 + doc 474
- [Doc 485 - V3 principles extraction (2026-04-23)](../485-distribution-is-hard-v3-jlcolton/) - in-repo
- [Doc 474 - FounderCheck BLOCK ICP fix (2026-04-22)](../474-foundercheck-block-icp-resolution/) - in-repo
- [Doc 264 - LinkedIn HSLC build-in-public playbook (2026-04-01)](../264-linkedin-build-in-public-playbook/) - in-repo
- [Marc Louvion ShipFast](https://shipfa.st/) - 1K-to-45K Twitter, $50K MRR in 40 days, V3 ch1
- [Buffer Open](https://buffer.com/open) - transparency-as-distribution arc, V3 ch1
- [Pieter Levels @levelsio](https://x.com/levelsio) - 40+ products, distribution-as-default, V3 ch7
- [Theodore Levitt JTBD origin](https://hbr.org/1960/07/marketing-myopia) - V3 ch6 quarter-inch-hole quote
