---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-03
related-docs: 173, 250, 489, 591, 599
tier: STANDARD
---

# 599b - Adrienne's Stack: GMFC101 (Eliza-free Farcaster Agent) + Word-A-Day (Mini App w/ Token + AI Eval)

> **Goal:** Lift two production-deployed patterns from @adrienne (paragraph.xyz) - one Farcaster AI agent stack, one daily-drop mini app - and map both to existing ZAO building blocks.

## Recommendations First

| Decision | Reasoning |
|----------|-----------|
| LIFT GMFC101 stack as cheaper reference for ZAO Hermes bot RAG layer | Deepgram + Pinecone + Neynar + Render = ~$60/mo. Eliza-free. Beats current ZAO Hermes inference cost. |
| LIFT Word-A-Day pattern (daily-drop + AI eval + token gate) for ZAO Jukebox v2 | Already in jukebox brainstorm (memory project_zao_jukebox_brainstorm). Word-A-Day is proof the pattern keeps people posting daily. |
| FOLLOW @adrienne / @warpee.eth on Farcaster | Both have shipping cadence and willingness to share stack. Worth a connection. |

## Pattern 1: GMFC101 Farcaster AI Agent (Eliza-free)

### Architecture

Two systems, no framework:

1. **Transcript Pipeline** - YouTube videos -> embeddings -> vector DB
2. **Bot API** - Neynar webhook on mention -> RAG query -> GPT-4 response -> reply cast

### Stack

| Layer | Tool | Cost |
|-------|------|------|
| Transcription | Deepgram | usage-based |
| Embeddings | OpenAI text-embedding-ada-002 | per token |
| Vector DB | Pinecone (free tier) | $0 |
| Webhook | Neynar | $9/mo |
| Inference | OpenAI GPT-4 | ~$10-20/mo |
| Hosting | Render (free hobby tier) | $0 |
| IDE | Cursor Pro | $20/mo |
| Total | | ~$59-69/mo (mostly tools, not infra) |

### Why "Without Eliza"

Builder quote: *"it felt like overkill for what I wanted to do."* RAG > fine-tuning when the corpus is bounded (one creator's video archive). External knowledge base = zero retraining when content updates.

### Map to ZAO Hermes Bot

ZAO already has `bot/src/hermes/` with PM queries and natural-language commands. GMFC101 pattern adds:

1. **Corpus ingestion**: ZAO has hours of YapZ Bonfire transcripts (`content/yapz-bonfire-ingest/*.md`, 18+ files in May 2026 main). Deepgram + Pinecone could index them.
2. **Webhook on mention**: ZAO Hermes today triggers via slash commands. Adding Neynar webhook = passive listening on @hermes mentions in /thezao channel.
3. **RAG over ZAO research**: 599 docs in `/research/`. Vector index would let Hermes answer "what did we conclude about Believe blocking Suno?" with citations.

ZAO advantage: Claude Code CLI (Max sub auth) replaces direct OpenAI API for inference. Pattern stays, swap GPT-4 -> Claude.

## Pattern 2: Word-A-Day Mini App

### Mechanics

| Step | What |
|------|------|
| 1 | Daily word drops with definition + usage example |
| 2 | Player posts the word naturally in a Farcaster cast |
| 3 | AI evaluates: mastery + authenticity + originality |
| 4 | Streaks + leaderboard for progression |

Token: `$wordaday`. Minimum balance required to participate. No rewards - access-only.

### Why It Works

User testimonial (from word-a-day.com): *"This mini app is incredible. It's become one of the main reasons I'm posting on Farcaster every day."*

Token-gated participation + AI judging + daily cadence = retention loop. Doesn't require new content from creator daily; the WORD is content, players generate the surrounding cast.

### Map to ZAO Jukebox

Existing brainstorm (memory: `project_zao_jukebox_brainstorm`, doc at `docs/superpowers/specs/2026-04-29-zao-jukebox-design.md`):

| ZAO Jukebox Spec | Word-A-Day Parallel |
|------------------|---------------------|
| Weekly mystery-mint | Daily word drop |
| $1 USDC pull | $wordaday balance gate |
| Win = NFT + $1 ZABAL rebate | Streak + leaderboard |
| Listen-gate | Cast-gate (you must post the word) |

Word-A-Day proves daily > weekly for retention if the action is low-friction. Consider a daily ZAO music drop variant alongside the weekly mystery-mint.

### Mini App Distribution

Built on Farcaster mini app SDK. ZAO has 591 (production audit) + 173 (integration) + 250 (llms.txt). All infra is in place; this is a content + AI-eval addition, not a platform addition.

## Also See

- [Doc 173](../173-farcaster-miniapps-integration/) - Mini app integration
- [Doc 250](../250-farcaster-miniapps-llms-txt-2026/) - llms.txt for mini apps
- [Doc 489](../489-hypersnap-farcaster-node-cassonmars/) - Self-host Farcaster infra
- [Doc 591](../591-miniapp-production-audit/) - Production audit lessons
- [Doc 599](../../events/599-inbox-digest-2026-05-03/) - parent
- [Doc 599c](../../agents/599c-hermes-agent-prior-art-reddit/) - Hermes Agent prior art

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Spike: Pinecone-indexed YapZ Bonfire corpus | @Zaal | Side spike | Anytime |
| Add Neynar webhook listener to bot/src/hermes/ for @hermes mentions | @Zaal | Bot feature | Backlog |
| Re-open zao-jukebox-design.md, add daily-drop variant alongside weekly mystery-mint | @Zaal | Spec edit | Next jukebox session |
| Follow @adrienne on Farcaster | @Zaal | Social | Today |

## Sources

- [Adrienne paragraph.xyz - "How I built GMFC101"](https://paragraph.com/@adrienne/how-i-built-gmfc101-a-farcaster-ai-agent-trained-on-video-content-without-eliza)
- [Word-A-Day landing](https://www.word-a-day.com/)
- [GM Farcaster ep361](https://www.gmfarcaster.com/episodes/ep361)
- [@warpee.eth Farcaster](https://farcaster.xyz/warpee.eth)
- [@adrienne Farcaster](https://farcaster.xyz/adrienne)
