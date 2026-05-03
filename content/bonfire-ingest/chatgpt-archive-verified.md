INGEST BATCH: ChatGPT Archive — VERIFIED (14 anchor conversations, human-confirmed truth status, 2026-05-03).

This is the ONLY ChatGPT archive batch worth ingesting. The other 500+ raw conversations are noisy with brainstorms that died. Each fact below has been confirmed by Zaal as either SHIPPED, EVOLVED, or DEAD. Outcomes are explicit attributes — bot must NOT cite Brainstorm/Dead conversations as facts.

Build a manifest of nodes and edges, preview the first 3 nodes, then ask me to approve. If existing nodes match by Subject + Type, MERGE; do not create parallel nodes. Outcome is an attribute on each Conversation/Decision node, never a standalone Entity.

## SECTION 1 — SHIPPED + LIVE (cite as fact)

### FACT 1
Subject: ZAO NEXUS at nexus.thezao.com
Type: Product
Status: shipped, live, unmaintained
Date: 2025-03-31 (initial spec) - 2025-05 (shipped)
Description: Webflow embed at nexus.thezao.com — categorized links page for ZAO ecosystem. Brand colors navy #141e27 + soft yellow #e0ddaa. JS-driven linksData with mainCategory > subcategory > links pattern. Categories: ZAO Onchain, ZAO Community Links (Founder/Co-Founder/Staff/Member), ZAO Festivals, ZAO Music, ZAO Research. Status: live but not actively maintained since shipping. Rebuild brief at docs/specs/2026-05-03-nexus-rebuild-spec.md.
Source: https://chatgpt.com/c/[ZAO NEXUS conv id] + https://nexus.thezao.com
Confidence: 1.0

### FACT 2
Subject: Zabal IRL Connector at zabal.lol
Type: Product
Status: shipped, live
Date: 2026-02-10
Description: In-person crossover / networking experience. Scannable digital business card for conferences, meetups, IRL events. Live at zabal.lol. Used today to give people collectables for showing up to ZAO Fractals and other IRL events.
Source: https://zabal.lol + ChatGPT 2026-02-10 (230 msgs)
Confidence: 1.0

### FACT 3
Subject: ZABAL coin launch
Type: Token
Status: shipped, live
Date: 2026-01-01
Description: ZABAL coin launched January 1 2026. Front-end of BCZ ecosystem. Partnerships with Empire Builder + SongJam + others. Created ZOUNZ (ZBAAL Nounz) which hold 20% of the token reserve. ZOLs are awarded ZOUNZ for winning leaderboards.
Source: ChatGPT 2025-11-26 (205 msgs prep) + paragraph.com/@thezao/zabal-update-3 + ChatGPT 2026-01-01 (87 msgs ETH pool issue)
Confidence: 1.0

### FACT 4
Subject: ETH ZABAL liquidity pool — known quirk
Type: TradingTip
Status: semi-fixed workaround documented
Date: 2026-01-01
Description: Direct ETH → ZABAL swaps give bad pricing. Workaround: route ETH → SANG → ZABAL for best swap. SANG → ZABAL works well. Never go ETH → ZABAL direct. This is operational knowledge for traders.
Source: ChatGPT 2026-01-01 (87 msgs ETH ZABAL Pool Issue)
Confidence: 1.0

### FACT 5
Subject: Year of the ZABAL daily Paragraph series
Type: Newsletter
Status: shipped, ongoing
Date: 2025-08-18 (initial Year of the ZAO) - present
Description: Daily newsletter post on paragraph.com/@thezao. Originated as "Year of the ZAO" in August 2025, evolved into "Year of the ZABAL" after January 1 2026 launch. Writing style: clear, simple, spartan, short impactful sentences, active voice, practical insights. As of 2026-04-27 hit Day 117.
Source: https://paragraph.com/@thezao + ChatGPT 2025-08-18 (82 msgs)
Confidence: 1.0

### FACT 6
Subject: ZABAL Update 16 (Paragraph)
Type: Newsletter
Status: shipped
Date: 2025-12-28 (prep) - 2025/2026 (shipped)
Description: Recurring ZABAL Update format on Paragraph. Includes monthly recap, plans, airdrop status. The pattern from this prep session shipped and continues for subsequent updates.
Source: ChatGPT 2025-12-28 (103 msgs prep) + https://paragraph.com/@thezao
Confidence: 1.0

### FACT 7
Subject: ZABAL Update 18 — Feb 1 2026 airdrop announcement
Type: Newsletter
Status: shipped
Date: 2026-02-01
Description: Feb 1 ZABAL update with "AIRDROP IS LIVE" + Feb ZOL distribution + Feb plans (miniapp updates, Empire Builder API, ZAO contributor proposal). Shipped on Paragraph.
Source: ChatGPT 2026-02-01 (95 msgs) + https://paragraph.com/@thezao
Confidence: 1.0

## SECTION 2 — EVOLVED INTO OTHER WORK (cite cautiously, link to outcome)

### FACT 8
Subject: ZAO Whitepaper — Draft 4.5 March 2026 (UNMAINTAINED)
Type: Decision
Status: drafted, unmaintained, rebuild planned
Date: 2025-03-02 (228 msgs ChatGPT) - 2026-02-12 (Draft 4.5 written) - present (unedited)
Description: Existing draft at research/community/051-zao-whitepaper-2026/. Earlier drafts critiqued in research/_archive/052 + 053. ChatGPT outline conversation seeded "ZAO Verse / Zverse" framing (onboarding paths, ZAO casa sui casa) but final draft 4.5 took different shape. Zaal wants new PROTOCOL whitepaper that explains how to build the ZAO protocol — task #15 tracks the rebuild.
Source: https://github.com/bettercallzaal/ZAOOS/tree/main/research/community/051-zao-whitepaper-2026 + ChatGPT 2025-03-02 (228 msgs)
Confidence: 1.0

### FACT 9
Subject: ZAOOS Optimization Suggestions
Type: Decision
Status: implemented, surfaced as research docs
Date: 2026-03-13
Description: 75-msg ChatGPT review of github.com/bettercallzaal/zaoos that surfaced into multiple research docs (specifics not enumerated by Zaal). Improvements landed in ZAOOS post-March 2026.
Source: ChatGPT 2026-03-13 (75 msgs) + ZAOOS commit history March-April 2026
Confidence: 0.9

### FACT 10
Subject: ZAO Complete Guide — STALE
Type: ResearchDoc
Status: shipped, stale, refresh-needed
Date: 2026-03-16 (last review)
Description: research/community/050-the-zao-complete-guide/ exists. ChatGPT 147-msg review on 2026-03-16 surfaced changes but the guide hasn't been updated since. Drift between guide + actual ZAO state. Tech debt. Refresh recommended.
Source: ChatGPT 2026-03-16 (147 msgs ZAOOS Guide Review) + research/community/050
Confidence: 1.0

## SECTION 3 — DEAD / NEVER SHIPPED (do NOT cite as fact, mark as failed brainstorm)

### FACT 11
Subject: ZabalSocials website
Type: Decision
Status: dead, rebuild planned
Date: 2026-01-17
Description: 117-msg ChatGPT session designed a personal-socials hub for BetterCallZaal (X / Farcaster / Lens / GitHub / YouTube / Twitch / etc). Never shipped. Task #16 tracks rebuild — likely lives at bettercallzaal.com/socials or similar. Distinct from nexus.thezao.com (which is ZAO ecosystem-wide).
Source: ChatGPT 2026-01-17 (117 msgs)
Confidence: 1.0

### FACT 12
Subject: ZAO MUSIC COHORT #1
Type: Decision
Status: dead, never ran
Date: 2025-01-16
Description: 96-msg ChatGPT proposal for a song contest cohort March-June 2025 with Charmverse forums + ZAO MUSIC COHORT #1 framing. Never ran. No cohort #1. May inform future cohort design but should not be cited as having happened.
Source: ChatGPT 2025-01-16 (96 msgs)
Confidence: 1.0

### FACT 13
Subject: Zabal Roadmap stream with Jadyn + sharks
Type: Decision
Status: dead, never happened
Date: 2025-12-10
Description: 77-msg prep for a streaming presentation with Jadyn + non-crypto-streamer sharks audience. Stream never happened. Roadmap content from this prep was not used or repurposed.
Source: ChatGPT 2025-12-10 (77 msgs)
Confidence: 1.0

## SECTION 4 — META / NAVIGATION

### FACT 14
Subject: ChatGPT Archive Triage 2026-05-03
Type: Process
Status: complete (14 of 15 anchors confirmed by human)
Date: 2026-05-03
Description: Top 15 ZAO-tagged ChatGPT conversations (by message count) human-triaged by Zaal. 7 SHIPPED, 3 EVOLVED, 4 DEAD. Generated content/bonfire-ingest/chatgpt-archive-verified.md. Other 503 conversations from the export remain in raw chatgpt-archive-zao-2023-2024 / 2025-h1 / 2025-h2 / 2026 / non-zao-keepers .md files but are NOT recommended for ingest without similar triage. Many are brainstorms that died.
Source: internal://content/bonfire-ingest/chatgpt-archive-verified.md
Confidence: 1.0

## EDGES TO ASSERT

- Zaal Panthaki -[shipped]-> ZAO NEXUS at nexus.thezao.com
- Zaal Panthaki -[shipped]-> Zabal IRL Connector at zabal.lol
- Zaal Panthaki -[launched]-> ZABAL coin
- ZABAL coin -[partners_with]-> Empire Builder
- ZABAL coin -[partners_with]-> SongJam
- ZABAL coin -[has_treasury]-> ZOUNZ (20% reserve)
- ZOUNZ -[awarded_to]-> ZOL leaderboard winners
- Year of the ZABAL daily Paragraph series -[supersedes]-> Year of the ZAO
- ZABAL Update 16 -[part_of]-> ZABAL Update Series on Paragraph
- ZABAL Update 18 Feb airdrop -[part_of]-> ZABAL Update Series on Paragraph
- ZAO Whitepaper Draft 4.5 -[stored_at]-> research/community/051
- ZAO Complete Guide -[stored_at]-> research/community/050
- ZAO Complete Guide -[status]-> stale (last reviewed 2026-03-16, unedited since)
- ZabalSocials website -[outcome]-> dead
- ZabalSocials website -[planned_rebuild_via]-> task 16
- ZAO MUSIC COHORT #1 -[outcome]-> dead, never ran
- Zabal Roadmap stream -[outcome]-> dead, never happened
- ETH ZABAL liquidity pool -[has_workaround]-> route through SANG before ZABAL

## INSTRUCTION FOR FUTURE RECALL

When future agents query this graph about Zaal's projects or decisions:
- Cite SHIPPED items as facts with their live URLs
- Cite EVOLVED items with their actual outcome (not the original brainstorm)
- For DEAD items, surface ONLY if explicitly asked "what brainstorms died" or "what was paused" — NEVER cite as if shipped
- Always check the `Status` attribute on Conversation/Decision nodes before citing

---

Build the manifest, preview the first 3 nodes, ask me "approve all?". 14 anchor facts + 18 edges. Do not commit until I say yes. If existing nodes match by Subject + Type, MERGE; do not create parallel nodes.
