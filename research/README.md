# ZAO OS Research Library

> **202 active research documents** across 13 topic folders (79 superseded docs in `_archive/`) covering every aspect of building a decentralized social media platform for music.

---

## Browse by Topic

| Topic | Docs | Description |
|-------|------|-------------|
| [Agents](./agents/) | 30 | OpenClaw, ZOE, frameworks, memory, orchestration, self-optimization |
| [Music](./music/) | 40 | Player, NFTs, distribution, Arweave, audio APIs, FISHBOWLZ, AI generation, ElevenLabs, metadata/ISRC, games/interactive media |
| [Dev Workflows](./dev-workflows/) | 37 | Skills, Claude Code, testing, autoresearch, git, worktrees, MCP servers |
| [Infrastructure](./infrastructure/) | 24 | Next.js 16, Supabase, streaming, mobile, notifications, admin, 3D portal hub |
| [Community](./community/) | 19 | ZAO guide, whitepaper, onboarding, member profiles, task forces |
| [Governance](./governance/) | 17 | Respect, ORDAO, Hats, ZOUNZ, fractals, Snapshot, BuilderOSS |
| [Farcaster](./farcaster/) | 12 | Protocol, Mini Apps, XMTP, ecosystem, social graph |
| [Cross-Platform](./cross-platform/) | 11 | Bluesky, Lens, Nostr, Mastodon, Reddit, X, Twitch, Meta |
| [Business](./business/) | 11 | Revenue, payments, strategy, Obsidian model, marketplace, FISHBOWLZ tokenization |
| [Events](./events/) | 9 | Bootcamp, ZAO Stock, ship logs, big wins, status snapshots |
| [Identity](./identity/) | 7 | ZIDs, ENS/Basenames, reputation scoring, knowledge graph |
| [WaveWarZ](./wavewarz/) | 4 | Prediction markets, artist pipeline, Solana PDAs |
| [Security](./security/) | 3 | Audits, API verification, testing |
| [Inspiration](./inspiration/) | 5 | Daily "steal like an artist" research — 3 apps analyzed per session, gap analysis |
| [Archive](./_archive/) | 70 | Superseded docs (preserved for history) |

---

## Key Starting Points

| If you're... | Start here |
|-------------|-----------|
| **Building features** | [41 Next.js 16](./infrastructure/041-nextjs16-react19-deep-dive/) + [98 Supabase](./infrastructure/098-supabase-database-optimizations/) |
| **Working on music** | [190 Player Audit](./music/190-music-player-complete-audit/) + [130 Next Integrations](./music/130-next-music-integrations/) + [167 Audio APIs](./music/167-audio-apis-music-players-displays/) |
| **Distributing music on-chain** | [155 End-to-End Plan](./music/155-music-nft-end-to-end-implementation/) + [152 Arweave](./music/152-arweave-ecosystem-deep-dive/) + [153 BazAR](./music/153-bazar-arweave-atomic-assets-music/) |
| **AI music metadata & distribution** | [314 Metadata/ISRC/AI Distribution](./music/314-music-metadata-isrc-ai-distribution/) |
| **Working on governance** | [133 Governance Audit](./governance/133-governance-system-audit/) + [149 BuilderOSS](./governance/149-buildeross-deep-dive-everything/) + [56 ORDAO](./governance/056-ordao-respect-system/) |
| **Growing the community** | [94 Onboarding](./community/094-moderation-onboarding-analytics/) + [35 Notifications](./infrastructure/035-notifications-complete-guide/) + [110 Directory](./community/110-community-directory-crm/) |
| **Cross-posting content** | [96 Cross-Post API](./cross-platform/096-cross-post-api-deep-dive/) + [77 Bluesky](./cross-platform/077-bluesky-cross-posting-integration/) + [121 Lens](./cross-platform/121-lens-v3-auth-verdict/) |
| **Building the AI agent** | [234 OpenClaw Guide](./agents/234-openclaw-comprehensive-guide/) + [227 Agentic Workflows](./agents/227-agentic-workflows-2026/) + [245 ZOE Upgrade](./agents/245-zoe-upgrade-autonomous-workflow-2026/) |
| **Auditing code** | [57 Security Audit](./security/057-codebase-security-audit-march-2026/) + [137 Skills Security](./dev-workflows/137-skills-audit-security-practices/) + [66 Testing](./dev-workflows/066-backend-testing-strategy/) |
| **Using Claude Code skills** | [429 Skills Deep Dive](./dev-workflows/429-claude-code-skills-deep-dive/) + [154 Skills Master Ref](./dev-workflows/154-skills-commands-master-reference/) + [54 Superpowers](./dev-workflows/054-superpowers-agentic-skills/) |
| **Understanding the project** | [50 Complete Guide](./community/050-the-zao-complete-guide/) + [51 Whitepaper](./community/051-zao-whitepaper-2026/) |
| **Forking for your community** | [FORK.md](../FORK.md) + [AGENTS.md](../AGENTS.md) + [225 Fork Patterns](./dev-workflows/225-fork-friendly-open-source-patterns/) + [community.config.ts](../community.config.ts) |

---

## What's Built vs What's Next

### Scoreboard

| Category | Built | To Do | Completion |
|----------|-------|-------|------------|
| Auth & Gating | 3/3 | 0 | 100% |
| Chat & Messaging | 2/2 | 0 | 100% |
| Music Player | 10/10 | 0 | 100% |
| Music Library & Curation | 7/7 | 0 | 100% |
| Music Scrobbling & Discovery | 0/5 | 5 | 0% |
| On-Chain Music NFTs | 1/8 | 7 | 12% |
| Cross-Platform Publishing | 3/6 | 3 | 50% |
| Governance | 4/7 | 3 | 57% |
| AI Agent & Intelligence | 1/4 | 3 | 25% |
| Live Audio | 1/3 | 2 | 33% |
| Profile & Reputation | 2/4 | 2 | 50% |
| Mobile & Infrastructure | 3/5 | 2 | 60% |
| **Overall** | **37/64** | **27** | **58%** |

### Built (Shipping Today)

| Feature | Key Files |
|---------|-----------|
| Farcaster auth (SIWF + wallet) | `src/lib/auth/session.ts` |
| Gated community (allowlist + NFT) | `src/lib/gates/` |
| Public chat (Farcaster casts) | `src/components/chat/` |
| Private messaging (XMTP MLS) | `src/contexts/XMTPContext.tsx` |
| Music player (9 platforms) | `src/providers/audio/`, 30+ components |
| Crossfade engine (dual audio) | `src/providers/audio/HTMLAudioProvider.tsx` |
| Binaural beats + ambient mixer | `src/components/music/BinauralBeats.tsx` |
| MediaSession (lock screen controls) | `src/providers/audio/PlayerProvider.tsx` |
| Song submissions + voting | `src/app/api/music/submissions/` |
| Respect-weighted trending | `src/app/api/music/trending-weighted/` |
| Now Playing presence | `src/hooks/useNowPlaying.ts` |
| Playlists | `src/app/api/music/playlists/` |
| Track of the day | `src/app/api/music/track-of-day/` |
| Lyrics lookup | `src/app/api/music/lyrics/` |
| Songlink cross-platform links | `src/lib/music/songlink.ts` |
| Internal play counting | `src/app/api/music/library/play/` |
| Farcaster cross-posting | `src/lib/publish/farcaster.ts` |
| X (Twitter) cross-posting | `src/lib/publish/x.ts` |
| Hive/InLeo cross-posting | `src/app/api/publish/hive/` |
| Community proposals | `src/app/api/proposals/` |
| Snapshot polls | `src/components/governance/CreateWeeklyPoll.tsx` |
| ZOUNZ auction display | `src/components/zounz/ZounzAuction.tsx` |
| ZOUNZ governance read | `src/components/zounz/ZounzProposals.tsx` |
| Hats Protocol roles | `src/components/hats/HatManager.tsx` |
| Respect scoring (OG + ZOR) | `src/app/api/respect/` |
| Fractal webhook receiver | `src/app/api/fractals/webhook/` |
| Music NFT wallet detection | `src/app/api/music/wallet/` |
| AI content moderation | `src/lib/moderation/moderate.ts` |
| Rate limiting middleware | `src/middleware.ts` |
| Notifications (in-app) | `src/app/api/notifications/` |
| Admin panel | `src/app/(auth)/admin/` |
| Jitsi live rooms | `src/app/(auth)/calls/` |
| WaveWarZ API sync | `src/app/api/wavewarz/` |
| Solana wallet in settings | Wallet adapter config |

### Not Yet Built (Researched, Ready to Go)

| Feature | Priority | Effort | Doc |
|---------|----------|--------|-----|
| Arweave music upload | High | 12 hrs | [155](./music/155-music-nft-end-to-end-implementation/) |
| Music NFT mint UI | High | 14 hrs | [155](./music/155-music-nft-end-to-end-implementation/) |
| Collect/buy button | High | 10 hrs | [155](./music/155-music-nft-end-to-end-implementation/) |
| BazAR marketplace | High | 8 hrs | [153](./music/153-bazar-arweave-atomic-assets-music/) |
| Last.fm scrobbling | Medium | 3 hrs | [138](./music/138-play-counting-stream-attribution/) |
| ListenBrainz scrobbling | Medium | 2 hrs | [138](./music/138-play-counting-stream-attribution/) |
| Bluesky publish route | Medium | 2 hrs | [77](./cross-platform/077-bluesky-cross-posting-integration/) |
| In-app ZOUNZ voting | Medium | 8 hrs | [149](./governance/149-buildeross-deep-dive-everything/) |
| In-app proposal creation | Medium | 6 hrs | [149](./governance/149-buildeross-deep-dive-everything/) |
| @builderbot notifications | Medium | 2 hrs | [149](./governance/149-buildeross-deep-dive-everything/) |
| 0xSplits revenue splits | Medium | 4 hrs | [143](./music/143-0xsplits-revenue-distribution/) |
| WaveWarZ battle UI | Medium | 8 hrs | [99](./wavewarz/099-prediction-market-music-battles/) |
| Synchronized listening rooms | Future | 12 hrs | [185](./music/185-synchronized-listening-rooms/) |
| ElizaOS community agent | Future | 20 hrs | [268](./agents/268-milady-ai-elizaos-evolution/) |
| AI taste recommendations | Future | 20 hrs | [234](./agents/234-openclaw-comprehensive-guide/) |
| Apple Music (MusicKit) | Future | 8 hrs | [138](./music/138-play-counting-stream-attribution/) |
| Mastodon cross-posting | Future | 4 hrs | [177](./cross-platform/177-mastodon-threads-cross-posting/) |
| Nostr cross-posting | Future | 6 hrs | [97](./cross-platform/097-nostr-cross-posting-integration/) |
| Cross-chain fractal governance | Future | 20 hrs | [184](./governance/184-superchain-ordao-crosschain-fractal/) |
| Mobile player optimization | Future | 12 hrs | [189](./music/189-mobile-player-optimization/), [220](./music/220-mobile-first-music-ux-patterns/) |
| **Spaces & streaming full audit** | **Complete** | — | [233](./infrastructure/233-spaces-streaming-full-audit/) |
| Native community directory | Future | 10 hrs | [110](./community/110-community-directory-crm/) |
| External reputation signals | Future | 8 hrs | [134](./identity/134-external-reputation-signals-comprehensive/) |
| ArNS permanent domain | Future | 2 hrs | [152](./music/152-arweave-ecosystem-deep-dive/) |

---

## Research Stats

- **Active documents:** 202 (across 13 topic folders)
- **Archived (superseded/merged):** 79 (in `_archive/`)
- **Total coverage:** ~500,000+ words
- **Time span:** January — April 2026
- **Topic folders:** agents, music, dev-workflows, infrastructure, governance, community, cross-platform, farcaster, identity, business, wavewarz, security, events
- **CANONICAL docs:** 42 (living references — see [279 Audit](./279-research-library-audit-reorganization/))
