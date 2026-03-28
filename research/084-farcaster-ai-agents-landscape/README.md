# 84 — Farcaster AI Agents Landscape (March 2026)

> **Status:** Research complete
> **Date:** March 19, 2026

## Context

Deep research on the full landscape of AI agents, bots, and automated accounts on Farcaster as of March 2026. Conducted for building a ZAO community bot.

---

## 1. Major Structural Change: Neynar Acquires Farcaster (January 2026)

On January 21, 2026, Neynar acquired Farcaster from Merkle. Founders Dan Romero and Varun Srinivasan stepped back. Neynar now maintains the protocol, runs the Farcaster client app, and operates Clanker.

**What this means for bot builders:**
- Neynar is now both the protocol maintainer AND the primary API provider -- a single point of contact
- A new builder-focused roadmap is expected
- No immediate product changes to Farcaster, Neynar APIs, or Clanker
- Centralization concerns exist: user data remains onchain, but application control sits with one company
- Farcaster generated only $1.84M in Q4 2025 revenue (down 85% YoY), motivating this shift

**Sources:**
- https://neynar.com/blog/neynar-is-acquiring-farcaster
- https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app
- https://www.coindesk.com/business/2026/01/21/farcaster-founders-step-back-as-neynar-acquires-struggling-crypto-social-app

---

## 2. Catalog of Known AI Agents & Bots on Farcaster

### Tier 1: Major Agents

**Clanker (Token Bot)**
- What: AI-powered autonomous agent for no-code ERC-20 token deployment on Base
- How: Users tag @clanker in a Farcaster cast, describe their token idea in natural language. Clanker deploys the token, creates a Uniswap V3 liquidity pool, locks LP forever
- Scale: Over $7.62B all-time trading volume, 21,870 tokens created on a single day (Feb 2, 2026), $364M daily trading volume ATH
- Revenue: 1% fee on trades; 80% of LP fees go to token creators; protocol uses remainder for CLANKER buybacks
- Tech: Audited smart contracts, Clanker v4 introduced modular contract architecture and dynamic fee mechanisms
- Farcaster acquired Clanker in Oct 2025 (now under Neynar)
- Sources: https://coinmarketcap.com/cmc-ai/tokenbot-2/what-is/, https://clanker.gitbook.io/clanker-documentation/general/token-deployments/farcaster-bot-deployments

**Aether**
- What: AI agent focused on art collaboration, NFTs, and community building
- How: Creates and sells NFTs, issues bounties on Bountycaster, manages treasury, deploys tokens via Clanker
- Scale: NFT minted ~466K times, 6.8K+ token holders, treasury >$254K from NFTs, crypto donations, and onchain subscriptions
- Notable: Issued 59 bounties worth >$1,600 on Bountycaster, created Luminous ($LUM) token, invested in the HIGHER community
- Source: https://www.bankless.com/farcaster-ai-agents-hub

**AIXBT**
- What: Trading alpha / sentiment analysis agent
- How: Scans social graphs on Farcaster, X, and Lens to spot early trends; provides market insights
- Scale: Market value approached $100M
- Source: https://www.aicoin.com/en/article/431385

**Bankr**
- What: Onchain AI assistant for crypto trading via natural language
- How: Users type commands like "buy $100 of ETH" or "send 0.05 ETH to a friend" directly in casts. Supports swaps, bridges, sends across Base and Solana
- Key: Eliminates app-switching; everything happens through social platform messages
- Source: https://www.gate.com/learn/articles/what-is-bankr-bot/9357, https://www.publish0x.com/bankrbot/why-bankrbot-is-one-of-the-most-powerful-crypto-tools-you-re-xokgerk

**A0x (Onchain Minds)**
- What: No-code platform to build, tokenize, and deploy social media AI agents
- How: Creates "Onchain Minds" that operate across Farcaster, X, and Telegram
- Source: https://bingx.com/en/learn/article/top-ai-agent-projects-in-base-ecosystem

### Tier 2: Utility Agents

**Gina (@askgina.eth)**
- What: Onchain AI assistant for crypto data and news
- How: Tag in a cast to get crypto information
- Source: https://www.bankless.com/farcaster-ai-agents-hub

**Atlas**
- What: Farcaster information agent
- How: Tag to get Farcaster-specific data and information
- Source: https://www.bankless.com/farcaster-ai-agents-hub

**Bracky**
- What: Sports betting agent
- Source: https://neynar.com/blog/building-ai-agents-on-farcaster

**@indexer**
- What: AI-powered social search engine on Farcaster
- Source: https://github.com/a16z/awesome-farcaster

**@degenbot**
- What: AI-powered tracker for DEGEN swaps on Farcaster
- Source: https://github.com/a16z/awesome-farcaster

**@remindme**
- What: Reply to any cast with "@remindme Number Day or Month or Year" to be reminded later
- Source: https://github.com/a16z/awesome-farcaster

**Neynar AI**
- What: Neynar's own AI agent, available as a mini app and in-feed agent
- How: Tag @neynar in a cast; triggered via Neynar webhook
- Source: https://neynar.com/blog/neynar-ai-the-lifecycle-of-a-response

**Bountycaster**
- What: Bounties app built on Farcaster (used by Aether and others)
- Source: https://www.bankless.com/farcaster-ai-agents-hub

**TrueCastAgent**
- What: Powers prediction markets mini app on Farcaster
- Source: https://github.com/phdargen/trueCastAgent

**Farcaster Support Agent**
- What: AI agent trained on Farcaster docs, accessible via XMTP
- Source: https://github.com/gregfromstl/farcaster-support-agent

**Caster Agents Framework V3**
- What: TypeScript framework for automated Farcaster agents -- monitors mentions, processes commands, deploys Clanker tokens, maintains user rankings
- Source: https://github.com/casteragents/Caster-Agents-Framework-V3

### Tier 3: Music-Adjacent (Relevant to ZAO)

**Sonata**
- What: Music client/aggregator on Farcaster; aggregates Spotify, YouTube, SoundCloud, and Sound.xyz links shared on Farcaster
- Token: NOTES token used for curation
- Subscription: Sonata Pro on Hypersub
- Source: https://github.com/Coop-Records/sonata, https://www.hypersub.xyz/s/sonata-pro-67yrngu0y0ow

**Sound.xyz Integration**
- What: Web3 music NFT platform that lets users share songs/playlists to Farcaster
- Source: https://sound.mirror.xyz/qxhwUOAcvy1WB4v6z9iD1MC2H0uV7iGmwqlixDn3GOg

**No dedicated music AI agent exists on Farcaster as of March 2026.** This is a clear opportunity for ZAO.

---

## 3. Farcaster Bot Policy & Rules

**There is no official centralized bot policy.** Farcaster uses a decentralized moderation approach:

### What's Allowed
- A Farcaster bot is just a regular Farcaster account -- no special status or restrictions
- Automated replies based on @mentions are standard and accepted
- Bots can post, reply, like, recast, follow, and interact with channels
- Agents are explicitly supported by the ecosystem (Neynar has an "Agents and bots" section in their dev portal)

### Anti-Spam Mechanisms
1. **Storage Rent**: Accounts must pay storage rent (~$0.30/unit as of July 2025, previously $7/unit). Each unit lasts 1 year. This serves as an economic anti-spam barrier.
2. **Cast Volume Limits**: Accounts creating >1,000 casts/24h need 20% of past 24h cast volume in available storage
3. **Frame-Based Filtering**: Apps can filter bot interactions using onchain criteria (e.g., NFT holdings)
4. **Channel Moderation**: Channel owners can set 20+ composable moderation rules, including anti-sybil controls
5. **Community Self-Policing**: Open-source design lets users build their own bot-detection/exclusion tools

### Known Issues
- Bot activity reportedly inflates DAU metrics (reported 40K-60K DAUs, but only ~4,360 Power Badge holders)
- Some users report "shadow-banning" concerns
- Vitalik Buterin publicly commented on increased spam levels
- ModBot (https://modbot.sh/) exists as a channel moderation helper

**Sources:**
- https://www.dlnews.com/articles/web3/farcaster-users-could-use-frames-and-nfts-to-stop-bots/
- https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/
- https://docs.neynar.com/docs/how-to-create-a-farcaster-bot

---

## 4. How Neynar Supports Bot Development

### Signer Options for Bots

Neynar offers three signer approaches:

| Signer Type | Best For | Cost | Notes |
|---|---|---|---|
| **Sign In with Neynar (SIWN)** | Most apps, user-facing | Free | Pre-onboarded 35K+ users, plug-and-play |
| **Neynar-Managed Signers** | Bots, agents, custom branding | Free (no gas) | Neynar stores keys, you get full API access. Recommended for bots. |
| **Developer-Managed Signers** | Maximum control | Highest burden | You store keys and sign messages yourself |

**For a ZAO bot: Use Neynar-Managed Signers.** Navigate to dev portal > "Agents and bots" > "use existing account" > connect bot wallet > receive signer UUID.

### Bot Setup Flow
1. Create a Farcaster account for the bot
2. Get a Neynar API key
3. Register a managed signer via the Neynar dev portal
4. Use the signer UUID + API key to publish casts via the SDK
5. Set up webhooks for mention detection and reply triggers

### Webhooks
- Trigger on specific Farcaster events (mentions, replies, follows)
- Available on Professional plan ($49/mo) and above
- Neynar AI's own agent uses this: webhook fires when @neynar is tagged, calls an API, generates response

### API Pricing (March 2026)

| Plan | Price | Compute Units | Webhooks | Key Limits |
|---|---|---|---|---|
| **Free** | $0 | 200K | No | Basic read/write |
| **Starter** | $9/mo | 1M | No | Read/write, 300 RPM |
| **Professional** | $49/mo | 10M | Yes | 600 RPM, indexer-as-a-service |
| **Enterprise** | $249/mo | 60M | Yes | 1200 RPM, SQL playground, custom pipelines |
| **Custom** | Contact | Custom | Yes | Custom |

### Rate Limits

| Plan | Per-Endpoint | Global (all APIs) |
|---|---|---|
| Starter | 300 RPM / 5 RPS | 500 RPM |
| Growth | 600 RPM / 10 RPS | 1000 RPM |
| Scale | 1200 RPM / 20 RPS | 2000 RPM |

- /validate, /signer, and signer/developer_managed APIs are exempt from global limits
- Cast search is more restricted: 60-240 RPM depending on plan
- Frame validation: 5K-20K RPM depending on plan
- Rate limits are request-based, independent of credit/compute unit usage

### Cast Volume Limits (Protocol-Level)
- <1,000 casts/24h: No restrictions
- >1,000 casts/24h: Must have 20% of past 24h volume in available storage

**Source:** https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis, https://docs.neynar.com/docs/which-signer-should-you-use-and-why

---

## 5. Frameworks for Building Farcaster Bots

### ElizaOS (Recommended for ZAO)

**Current state:** ElizaOS + Virtuals Protocol are the standard frameworks for building autonomous AI agents as of early 2026. ElizaOS has 90+ plugins, managing over $25M in AUM across deployed bots, with ecosystem partners at $20B+ combined market cap.

**Farcaster Plugin (`@elizaos/plugin-farcaster`)**

Features:
- Autonomous publishing with configurable intervals (POST_INTERVAL_MIN/MAX, default 90-180 min)
- Mention monitoring and auto-reply (FARCASTER_POLL_INTERVAL, default 2 min)
- Like, recast, follow automation
- Dry-run mode for testing without live posting
- Built-in caching for profiles and cast data
- Context-aware responses with memory/conversation tracking
- Channel-specific posting
- Cross-platform coordination (Discord, Telegram, X, Farcaster simultaneously)

Required env vars:
```
FARCASTER_NEYNAR_API_KEY=your-neynar-api-key
FARCASTER_SIGNER_UUID=your-signer-uuid  (from Neynar managed signer)
FARCASTER_FID=12345
```

Optional env vars:
```
FARCASTER_DRY_RUN=false          # Test mode
MAX_CAST_LENGTH=320              # Character limit
FARCASTER_POLL_INTERVAL=2        # Mention check frequency (minutes)
ENABLE_POST=true                 # Toggle autonomous posting
POST_INTERVAL_MIN=90             # Min minutes between posts
POST_INTERVAL_MAX=180            # Max minutes between posts
ENABLE_ACTION_PROCESSING=false   # Like/recast automation
ACTION_INTERVAL=5                # Action processing frequency (minutes)
POST_IMMEDIATELY=false           # Post on startup
MAX_ACTIONS_PROCESSING=1         # Interactions per cycle
```

Architecture:
1. **FarcasterClient** -- Core Neynar API communication
2. **FarcasterPostManager** -- Automated scheduling and cast generation
3. **FarcasterInteractionManager** -- Mention and reply orchestration
4. **Memory Systems** -- Conversation context storage

Character config:
```typescript
import { Character } from "@elizaos/core";
import { farcasterPlugin } from "@elizaos/plugin-farcaster";

export const character: Character = {
  name: "ZAOBot",
  plugins: [farcasterPlugin],
  bio: "The ZAO community music agent",
  description: "I help discover and share music in the ZAO community"
};
```

Custom templates: `farcasterPostTemplate`, `farcasterMessageHandlerTemplate`, `farcasterShouldRespondTemplate`

Error handling: Implement retry with exponential backoff for rate limits. Validate cast length (320 char max).

**Note:** The old `client-farcaster` package is archived. Use `@elizaos/plugin-farcaster` (renamed with plugin- prefix).

**Sources:**
- https://github.com/elizaos-plugins/client-farcaster
- https://docs.elizaos.ai/plugin-registry/platform/farcaster/examples
- https://www.npmjs.com/package/@elizaos/plugin-farcaster

### Neynar SDK (Direct)

Simpler approach for custom bots without ElizaOS:
- `@neynar/nodejs-sdk` npm package
- PM2 for process management
- Direct webhook handling
- Good for focused, single-purpose bots (like gm_bot)
- Source: https://docs.neynar.com/docs/how-to-create-a-farcaster-bot

### Caster Agents Framework V3
- TypeScript framework specifically for Farcaster agents
- Monitors mentions, processes commands, deploys tokens, tracks rankings
- Source: https://github.com/casteragents/Caster-Agents-Framework-V3

### Botcaster
- Farcaster bot framework by BigWhaleLabs
- Source: https://github.com/BigWhaleLabs/botcaster

### Custom (Direct Hub + Neynar)
- Some builders use farcaster-agent for autonomous account creation and casting
- ~$1 of crypto to create and operate an account
- Source: https://github.com/rishavmukherji/farcaster-agent

---

## 6. Farcaster Mini Apps + Agent Integration

Mini Apps (formerly Frames v2) are HTML/CSS/JS apps that run inside the Farcaster feed.

### Agent-Relevant Capabilities
- **SDK**: `@farcaster/miniapp-sdk` provides Ethereum Provider (EIP-1193), Quick Auth (Sign in with Farcaster + JWT), notifications
- **Agent Checklist**: Official documentation at https://miniapps.farcaster.xyz/docs/guides/agents-checklist
- **Manifest**: Must be at `/.well-known/farcaster.json` with `fc:miniapp` meta tags
- **Ready Signal**: Apps must call `sdk.actions.ready()` after initialization
- **Embed Metadata**: Version "1", imageUrl (3:2 ratio), button title max 32 chars

### Key Rules for AI Agents Building Mini Apps
- NEVER reference Frames v1 syntax (`fc:frame:image`, `fc:frame:button`)
- Use `fc:miniapp` meta tags, not `fc:frame`
- Always verify fields against official SDK schema
- Use `miniapp` or `frame` (not `frames`) in manifests

### Examples
- **TrueCastAgent**: Powers prediction markets mini app
- **Neynar AI**: In-feed mini app agent

**Source:** https://miniapps.farcaster.xyz/docs/guides/agents-checklist

---

## 7. Cost Structure for Bot Accounts

### One-Time Costs
- **FID Registration**: Requires renting 1 storage unit (~$0.30 in ETH as of July 2025)
- **Storage Rent**: ~$0.30/unit/year (was $7/unit before July 2025 repricing)

### Ongoing Costs
- **Neynar API**: $0 (Free, 200K compute units) to $249/mo (Enterprise, 60M compute units)
- **For a community bot**: Professional plan at $49/mo is the sweet spot (webhooks required for mention-triggered replies)
- **LLM costs**: Depends on model (GPT-4o, Claude, etc.) -- typically $5-50/mo for a community bot
- **Hosting**: Standard server costs for the bot process (Vercel, Railway, etc.)

### Total Estimated Cost for ZAO Bot
- FID registration: ~$0.30 one-time
- Storage: ~$0.30/year
- Neynar Professional: $49/mo
- LLM API: ~$10-30/mo
- Hosting: ~$5-20/mo
- **Total: ~$65-100/month**

---

## 8. Best Practices for Community Bots

### Do
- **Be helpful, not promotional**: "Winning in niche channels is not about volume; it is about relevance, proof, and consistent helpfulness"
- **Respond to mentions only**: Don't spam feeds with unsolicited posts. Trigger on @mentions and direct replies
- **Keep cast frequency reasonable**: ElizaOS defaults to 90-180 minute intervals between autonomous posts -- this is a good baseline
- **Use dry-run mode first**: Test all behavior before going live (`FARCASTER_DRY_RUN=true`)
- **Tag people and channels**: Direct new users to relevant accounts and communities
- **Show expertise transparently**: "State your role and scope when relevant"
- **Disclose bot nature**: Make it clear the account is automated
- **Gate interactions**: Use onchain criteria (token holdings, NFTs) to filter who can interact
- **Channel-specific behavior**: Configure different response styles per channel

### Don't
- **Don't auto-reply to everything**: Only respond when tagged or when genuinely relevant
- **Don't over-automate relationships**: "Automate logging and reminders, not relationship-building"
- **Don't treat Farcaster as a distribution channel**: It's a "trust channel"
- **Don't spam likes/recasts**: Keep `MAX_ACTIONS_PROCESSING` low (1 per cycle)
- **Don't exceed cast volume limits**: Stay well under 1,000 casts/24h
- **Don't ignore context**: Use memory systems to maintain conversation threading
- **Don't post generic content**: Tie responses to exact thread context

---

## 9. Notable Failures & Anti-Patterns to Avoid

1. **Bot-inflated metrics**: Farcaster's reported 40K-60K DAUs include significant bot activity; only ~4,360 Power Badge holders are genuinely active. Don't contribute to metric inflation.

2. **Generic engagement farming**: Bots that like/recast everything get noticed and blocked. The community actively experiments with bot-exclusion methods.

3. **Shadow-banning risk**: Despite decentralization claims, some users report being shadow-banned. Keep bot behavior within normal parameters.

4. **Ignoring storage economics**: If your bot posts too frequently without enough storage units, casts get rejected. Monitor storage.

5. **Over-reliance on single provider**: Neynar now controls both the protocol and API layer. Consider building with awareness of this centralization risk.

6. **Token-first approach**: Agents that launch tokens without genuine utility (like many Clanker-spawned tokens) face community backlash. Build utility first.

7. **Ignoring Frames v1/v2 migration**: Using outdated Frames v1 syntax will break. Always use Mini App patterns (`fc:miniapp` tags).

---

## 10. ZAO Bot Opportunity Analysis

### Gap in the Market
**No music-focused AI agent exists on Farcaster.** Sonata is a music client/aggregator but is not an AI agent. Sound.xyz has integration but no bot. This is a clear opportunity.

### What a ZAO Bot Could Do
1. **Music Discovery**: Surface and recommend music shared in the /music channel and ZAO community
2. **Onboarding Assistant**: Help new members understand ZAO, answer questions (like the Farcaster Support Agent does for Farcaster docs, but trained on ZAO content)
3. **Community Engagement**: Welcome new members, highlight contributions, facilitate introductions
4. **Respect Token Integration**: Because Farcaster accounts have linked wallets, the bot can check Respect token holdings and tailor interactions
5. **XMTP Bridge**: Like the Farcaster Support Agent (accessible via XMTP), enable private conversations
6. **Event Notifications**: Announce governance proposals, voting deadlines, new music submissions
7. **Curation**: Help surface the best music submissions using community signals

### Recommended Stack
- **Framework**: ElizaOS with `@elizaos/plugin-farcaster`
- **API**: Neynar Professional plan ($49/mo)
- **LLM**: Claude or GPT-4o for response generation
- **Signer**: Neynar-managed signer
- **Hosting**: Same infra as ZAO OS (Vercel + background worker)
- **Knowledge Base**: Train on ZAO research docs (research/ directory), community.config.ts, and Farcaster /music channel content

### Implementation Priority
1. Mention-triggered Q&A (respond when tagged with ZAO questions)
2. Channel monitoring (watch /music for interesting shares)
3. Scheduled community updates (governance votes, new members)
4. Music recommendation engine (surface tracks based on community engagement)

---

## Sources Index

### Primary Documentation
- [Neynar Bot Creation Guide](https://docs.neynar.com/docs/how-to-create-a-farcaster-bot)
- [Neynar Rate Limits](https://docs.neynar.com/reference/what-are-the-rate-limits-on-neynar-apis)
- [Neynar Signer Selection Guide](https://docs.neynar.com/docs/which-signer-should-you-use-and-why)
- [Farcaster Mini Apps Agent Checklist](https://miniapps.farcaster.xyz/docs/guides/agents-checklist)
- [Farcaster Storage Registry Docs](https://docs.farcaster.xyz/reference/contracts/reference/storage-registry)
- [ElizaOS Farcaster Plugin](https://github.com/elizaos-plugins/client-farcaster)
- [ElizaOS Farcaster Examples](https://docs.elizaos.ai/plugin-registry/platform/farcaster/examples)
- [Clanker Documentation](https://clanker.gitbook.io/clanker-documentation/general/token-deployments/farcaster-bot-deployments)

### Analysis & News
- [Neynar Acquires Farcaster (Jan 2026)](https://neynar.com/blog/neynar-is-acquiring-farcaster)
- [Farcaster: The Next Big AI Agents Hub (Bankless)](https://www.bankless.com/farcaster-ai-agents-hub)
- [Building AI Agents on Farcaster (Neynar Blog)](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [Farcaster in 2025: The Protocol Paradox](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/)
- [Farcaster 2026: Game-Changing Potential of AI Agents](https://app.t2.world/article/cm6driew61299193tymcl5g6ikvh)
- [Why AI Agents Will Make Farcaster the Next Big Thing](https://medium.com/@drizzleshine/why-ai-agents-will-make-farcaster-the-next-big-thing-in-social-media-1f0d773bb09d)
- [Top Base AI Agent Projects 2026](https://bingx.com/en/learn/article/top-ai-agent-projects-in-base-ecosystem)
- [Bots Invading Farcaster (DL News)](https://www.dlnews.com/articles/web3/farcaster-users-could-use-frames-and-nfts-to-stop-bots/)
- [What is Clanker (CoinMarketCap)](https://coinmarketcap.com/cmc-ai/tokenbot-2/what-is/)
- [Farcaster Acquisition Explained](https://web.ourcryptotalk.com/blog/farcaster-acquisition-explained)

### Code & Frameworks
- [Neynar Farcaster Examples (GitHub)](https://github.com/neynarxyz/farcaster-examples)
- [Caster Agents Framework V3](https://github.com/casteragents/Caster-Agents-Framework-V3)
- [Botcaster Framework](https://github.com/BigWhaleLabs/botcaster)
- [Farcaster Agent (Autonomous)](https://github.com/rishavmukherji/farcaster-agent)
- [Farcaster Support Agent (XMTP)](https://github.com/gregfromstl/farcaster-support-agent)
- [Sonata Music Client](https://github.com/Coop-Records/sonata)
- [TrueCastAgent (Prediction Markets)](https://github.com/phdargen/trueCastAgent)
- [Awesome Farcaster (a16z)](https://github.com/a16z/awesome-farcaster)
- [ElizaOS Plugin Registry (npm)](https://www.npmjs.com/package/@elizaos/plugin-farcaster)

### Music on Farcaster
- [Farcaster x Base x Music (Coopahtroopa)](https://investinmusic.substack.com/p/farcaster-x-base-x-music)
- [Sound.xyz Farcaster Integration](https://sound.mirror.xyz/qxhwUOAcvy1WB4v6z9iD1MC2H0uV7iGmwqlixDn3GOg)
- [Sonata Pro (Hypersub)](https://www.hypersub.xyz/s/sonata-pro-67yrngu0y0ow)
- [Farcaster /music Channel](https://farcaster.xyz/~/channel/music)
