# Newsletter Draft — May 20, 2026 (Wednesday)

*Draft in Zaal's voice — Year of the ZABAL. Build-in-public. For ZAO community + anyone watching.*

---

**Yesterday a real API token ended up in a GitHub PR.**

Not in production, not in a deployed config — in a test fixture. GitHub Secret Scanning caught it in seconds. I closed the PR, deleted the branch, rotated the token through BotFather. The whole incident was maybe 15 minutes. But it matters enough to write about publicly because building-in-public includes the mistakes.

What came next is the ZAO pattern: we didn't just fix it, we built the system that prevents the next one. PR #568 ships a `secret_scan.py` module — 25+ regex patterns, HIGH/MED/LOW severity tiers, a classifier that distinguishes real high-entropy values from template placeholders like `KEY=your_key_here`. Going forward every Bonfire content ingest (research docs, newsletters, memory files, Telegram transcripts) routes through `IngestPipeline.preflight()` before anything reaches the graph. One incident, one layer of permanent protection.

**The ZAOscribe Discord pivot shipped as a research doc.**

We've been circling on how to capture coworking sessions without a 5-step voice-memo workflow. Tried Telegram, hit a 4096-char limit. Researched Discord. Turned out Discord's `@discordjs/voice` library gives you per-speaker audio streams natively — one `.opus` file per speaker per utterance, no diarization layer, no third-party model. CraigChat has been running this architecture for 270+ years of audio annually on MIT license. PR #566 locks Discord as the production approach: 34-hour build, 7 phases, each shipping a demoable commit. The `/meeting` skill shipped the same day as the research — it's the manual workflow layer for today's cowork sessions while ZAOscribe gets built.

**There's a fund literally called "ZAO Fund."**

PR #569 landed tonight: Telamon Ardavanis co-founded Edge City and curates the Artizen "ZAO Fund for Emerging Culture" Season 6. Edge Esmeralda is May 30–June 27 in Healdsburg CA — 11 days out. The single ask is a 30-min 1:1. I'm sending the X DM today.

---

**MINDFUL MOMENT**

Three things shipped today that look unrelated: a security scanner, a Discord bot spec, and an outreach brief. The thread connecting them is the same one connecting everything this week — *making things legible before they can scale*.

The secret scanner doesn't just protect the Bonfire ingest. It defines what "safe to publish" means for any ZAO content, which is the prerequisite for automating anything at volume. ZAOscribe is the same move: you can't scale cowork capture without a reliable per-speaker record, which means the 5-step manual workflow was always going to be the ceiling. And the Telamon brief is legibility for a relationship — knowing what he cares about (emerging culture, pluralistic communities, open protocols) before walking into that DM.

The pattern this week has been: audit what exists, clarify what it means, then build what's next. That's not overhead. That's the difference between fast and fast-and-then-rewrite.

---

*The ZAO is 188 members on Base. Building at the intersection of music, culture, and onchain coordination.*
*Follow the build: @bettercallzaal on Farcaster.*
