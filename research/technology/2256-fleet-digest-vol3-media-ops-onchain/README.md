# 2256 - Fleet digest vol. 3: media ops + onchain infra (Aug 8-9 2026)

Ten fleet-relay briefs preserved. Volume 3 of the series: doc 2238 (vol 1, general research), doc 2252 (vol 2, the self-hosted media stack blueprint). Sections 1-7 extend the doc-2252 stack; 8-10 are onchain/agent infrastructure. Sources were cited in-session; conclusions recorded here.

## 1. Live clipping on the 1660 alongside an active encode

- Three resources, two scarce: NVENC is dedicated silicon (stream + replay buffer fit under the 8-session cap); CUDA is idle during talk-show streams; VRAM 6GB is the wall (OBS ~1.5GB + whisper turbo-int8 ~1.5GB fits).
- Rule: LIVE = SENSORS, POST = PROCESSING. Live path: chat-velocity spikes (CPU, ~50 lines, the 80% signal), audio-RMS/laughter (CPU), !clip redeems, optional VAD-chunked turbo-int8 keyword marks - all appending to a timestamped marks.json next to the recording. Post-stream (GPU free): full transcription, LLM scoring of marked windows (cost-ladder routing), MediaPipe/YOLO 9:16 reframe, NVENC renders. Nothing live may touch the encoder or >1.5GB VRAM.

## 2. Livepeer keyless agent MCP - free image/video gen in the pipeline

- The Livepeer Cloud SPE Community Gateway (dream-gateway.livepeer.cloud) is keyless and free for experimentation; the agent MCP connector exposes the AI network to agents as tools. zaalclip's design already names this engine.
- Pipelines: text-to-image (RealVisXL Lightning warm), image-to-image/video, upscale, audio-to-text (whisper-large-v3), TTS, LLM, SAM2 segmentation.
- Fits: the ZM thumbnail debt (598 items, no custom art) - templated background gen + upscale batches at $0; motion promos via image-to-video; SAM2 speaker cutouts for reframes. Does not fit: transcription (local is better + privacy rule), clip cutting (local ffmpeg), anything deadline-bound (community gateway = no SLA; production = paid/self-hosted gateway). ZOE can call it directly via MCP - thumbnail backfill is a natural agent task with human-review folder.

## 3. Local Ollama as the ZAO research index (semantic search over research/)

- Corpus ~2,250 docs = ~25MB of vectors: trivial. Stack: nomic-embed-text (137M/768d/8K ctx) via Ollama + sqlite-vec + SQLite FTS5 in one file, hybrid ranking (RRF) with the existing search-index.json as third signal.
- CRITICAL implementation detail: nomic requires task prefixes - embed chunks as "search_document: ..." and queries as "search_query: ..." or retrieval quality silently degrades.
- Chunking: heading-bounded 512-1024 tokens + one weighted title/summary chunk per doc; content-hash incremental re-embeds nightly.
- Two interfaces: zao-search CLI (an evening) and an MCP server exposing search_research - so every CC session and ZOE query the index as a 50ms tool call instead of grep subagent sweeps. Extension: same index over ZM transcripts (timestamped chunks).

## 4. ComfyUI on 6GB - thumbnails and brand assets

- Constraints: 6GB VRAM (--lowvram cuts 40-50%), Turing = 2-4x slower (overnight-batch tool, not interactive), 16xx fp16 quirk (auto-handled; --force-fp32 fallback if black images).
- Ladder: SD1.5 comfortable; SDXL Lightning 1024px = the workhorse; Flux GGUF Q3/Q4 = best reachable quality, slow (hero images; the 1660 is called a sweet spot for Q3-Q4); ESRGAN upscalers trivial (the secret: gen small, 4x upscale); video = use Livepeer lane instead.
- Workflow: NEVER diffuse text/logos - SDXL Lightning background (palette-templated prompts, navy #141e27/gold #e0ddaa) -> 4x upscale -> composite title text + marks in code (PIL). ComfyUI workflow JSON per show = reproducible brand templates (seeds/ControlNet - what the Livepeer gateway can't do). SD1.5 style LoRA trainable locally; SDXL LoRA needs cloud.
- Scheduling: diffusion is CUDA+VRAM hungry - never alongside live encode; n8n idle-hours batch, same calendar as transcription.

## 5. Computer use / desktop agents on Windows for remote ops

- The ladder: (1) services/APIs/n8n (the doc-2252 stack is deliberately headless-controllable), (2) PowerShell/SSH over Tailscale, (3) structured GUI automation (pywinauto/Windows UIA - element tree, deterministic), (4) vision-based computer use (Claude computer_20251124, beta computer-use-2025-11-24; client harness on the box takes screenshots + executes actions; send 1080p). Pixels are the LAST resort.
- Blast radius rules for desktop-h2ov6da: separate Windows user for agent sessions (not the streaming account), no stored credentials in that profile, human gates on irreversible clicks, on-screen content is untrusted input (prompt injection via video titles), record agent sessions (OBS as audit log).
- Verdict: tiers 1-2 cover ~95% of ops. Genuine tier-4 cases: YouTube Studio no-API actions, installer dialogs, future GUI-only tools. Keep it the exception harness.

## 6. Farcaster-native clip distribution

- Platform reality: Neynar owns the protocol + Snapchain + primary API since Jan 2026. Posting = managed signers + publish-cast.
- The real work is HLS: Farcaster clients expect STREAMED video (m3u8), not raw mp4 - poster transcodes (one ffmpeg/NVENC command) and hosts (S3/CDN bucket already priced in vol 2; or Livepeer Studio - recommended in the FC video spec).
- Limits: 2 embeds x 256 bytes per cast (video + ZM page link); Farcaster Pro $120/yr = 4 embeds + 10K chars (decision for Zaal: clip + page + POIDH bounty in one cast). 1080p ceiling; duration caps are client-enforced - verify in-client before standardizing (not publicly indexed).
- What performs: native playback >> link-outs (autoplay vs thumbnail); channel-first (/zao) casts that say something; short vertical moments; consistency over virality - maps onto the daily ZM hour burn-down. Wiring: approved clip -> HLS -> host -> zaalcaster/Neynar cast to /zao -> ZM link embed -> flip dist.socials.

## 7. WoL, power resilience, remote recovery (the not-in-the-room kit)

- Recovery ladder: self-healing services -> Tailscale soft remote -> WoL -> power-cycle -> IP-KVM (BIOS-level console).
- WoL truths: magic packets are L2 broadcast (don't route; Tailscale doesn't carry them) - need an on-LAN sender (router UI, a Pi, or the KVM itself); BIOS WoL on, NIC magic-packet on, Fast Startup off, DHCP reservation.
- Power: BIOS "Restore on AC Loss = Power On" (the single most important setting); UPS with USB signaling (graceful shutdown + auto-return); ROUTER AND MODEM ON THE UPS TOO (healthy PC behind dead network gear = unreachable).
- Hard rungs: locally-controlled smart plug + AC-restore = $15 remote hard reboot; IP-KVM = the real remote-hands: JetKVM (~$70-100, ATX power extension, native Tailscale), NanoKVM <$50, GL.iNet Comet, PiKVM - four of five support Tailscale officially.
- Traps: BitLocker recovery prompts (configure auto-unlock or a reboot strands the box), NIC power-saving kills WoL, untested assumptions - monthly pull-the-plug drill + one deliberate hang recovered via KVM.
- The kit: UPS ~$80 + JetKVM w/ ATX ~$100 + three settings = ~$180 for never-drive-over ops.

## 8. Uniswap v4 flash accounting / EIP-1153 (what makes hooks possible)

- EIP-1153 (Dencun): TSTORE/TLOAD - per-transaction transient storage at ~100 gas. v4 builds flash accounting on it: all ops inside an unlock callback on the singleton PoolManager adjust per-address per-currency DELTAS (IOUs) instead of transferring; at unlock-close every delta must net to zero (take()/settle()) or the tx reverts. Four-pool route = 2 transfers instead of 8.
- Why hooks exist: a hook is just another delta participant - fee skims, subsidies, custom curves (return-delta/no-op variants) cost delta edits, not transfers; the net-zero gate at the boundary is the single settlement check. ERC-6909 claims keep balances inside the PoolManager for near-zero-transfer operation.
- Security shift: the hook is part of the pool's trust surface - "which hook does this pool run" is now due diligence. ZAO angle: a WaveWarZ-style EVM market or Sparkz pool = a v4 hook; per-trade artist splits become delta adjustments.

## 9. EIP-8130 native AA on Base (Vibenet) - bundler infra obituary, dated

- What: "AA by Account Configuration" - one new AA_TX_TYPE validated by the protocol + an Account Configuration system contract at the same CREATE2 address cross-chain. No bundlers, no new opcodes. Batching, sponsorship (SPONSOR_PAYER), pay-gas-in-any-token, portability = native. Numbers: sponsored USDC transfer 125K -> 46K gas (-63%), tx bytes -83% vs 4337.
- Status: live on Vibenet devnet now; Base mainnet in the Cobalt upgrade THIS SEPTEMBER; other OP Stack chains later this year (Optimism lags Base).
- For ZAO onboarding: kills the INFRA (bundler endpoints, EntryPoint UserOps, paymaster contracts, CDP/Pimlico line items), not the economics (treasury still funds sponsorship) and not yet (wallet adoption + Sept timeline). 4337 accounts upgrade in place - additive. Actions: test on Vibenet, keep the onboarding AA layer thin/swappable, budget bundler services as a shrinking line item by Q4. Solana (WaveWarZ) untouched; L1 is the separate 8141/7701 track.

## 10. ERC-7579 Smart Sessions - revocable ZOE scopes without waiting on 7715

- The question splits on WHOSE account: for ZAO-OWNED accounts, 7579 + SmartSessions (Rhinestone x Biconomy module) delivers TODAY - session keys scoped by policy (target contracts, function selectors, value caps, expiry), revocable in one on-chain call, on Safe7579/Nexus/Kernel accounts. 7715 is a wallet RPC standard - only needed to request permissions from THIRD-PARTY wallets.
- ZOE design: one session per task class ("POIDH payouts: this contract, <=0.03 ETH, expires Friday"; "x402 spends: USDC <=$5/day") - compromised key's blast radius = its policy. Three-layer defense with x402 upto caps + human gates.
- 7715 status: still draft (Apr 2026) but shipping anyway - MetaMask Advanced Permissions build on it, live on Celo, Agent Wallet pushing it. Member-side delegation ("let ZOE claim my Respect") waits for that lane; design the request surface now, build later.
- Interaction with 8130: session-style authority survives the native-AA transition; keep the session-management layer thin, don't couple deep to one module vendor's SDK.

## Where everything lives (the review map)

- Doc 2238 - vol 1: MEV/L2s, Solidity exploit classes, ZK tooling, x402+3009, prediction markets, 8004+Sparkz, x402 v2 schemes, Tailscale remote access, OBS automation, Jellyfin + YouTube-constraints addendum.
- Doc 2252 - vol 2: the self-hosted media stack blueprint (AI cost ladder + Ollama catalog/privacy, MediaMTX, Owncast, ffplayout, overlays, SRT/WHIP, PeerTube) with build order.
- Doc 2256 (this) - vol 3: live clipping, Livepeer MCP, research semantic index, ComfyUI, computer use, Farcaster clips, WoL/recovery kit, v4 flash accounting, EIP-8130, ERC-7579 sessions.
- zao-media repo - the ZM archive itself: README (handoff doc), docs/media-universe.md (master map), docs/future-roadmap.md (top-3 gaps + blueprint pointer), catalogs, tracker.
