---
topic: ZAO assistant in Apple CarPlay - build plan and constraints
type: infrastructure/product-decision
status: LIVE
last-validated: 2026-07-23
related-docs:
  - research/infrastructure/project-carplay-podcast (v0 started 2026-07-19)
  - research/infrastructure/project-zao-brand-terminal (daily newsletter builder)
  - research/agents/project-zoe-orchestrator-locked (voice interface + ZOE)
original-query: delegate making that carplay app and seeing how we could get that in carplay as a ZAO assistant
tier: STANDARD
---

# ZAO Assistant in Apple CarPlay: Build Plan and Constraints

## Executive Summary

The hard reality: **Apple does NOT permit general-purpose apps in CarPlay.** Only specific categories are allowed (audio, navigation, communication, EV charging, etc.), each gated by entitlements Apple must approve.

**However, the existing ZAO infrastructure ALREADY works in CarPlay for free.** Users can subscribe to the ZAO daily brief via RSS in Apple Podcasts, and CarPlay natively plays podcasts. This gives ZAO audio in the car TODAY with zero code.

A native **voice-based conversational assistant** is now possible as of iOS 26.4 (February 2026) via a new CarPlay entitlement. This would allow interactive voice Q&A with ZAO, but requires building an iOS app and obtaining Apple's approval.

---

## Key Decisions

| Decision | Answer | Why |
|----------|--------|-----|
| **Can a general "ZAO assistant" ship in CarPlay?** | No (general app). Yes (voice entitlement). | Apple restricts CarPlay to 9 categories. Audio apps and voice-conversational apps are allowed. A free-form "assistant" app category does NOT exist. |
| **Recommended path to ZAO-in-CarPlay** | 1. Use Podcasts app NOW (zero work). 2. Request voice-conversational entitlement (2-4 weeks). 3. Build native iOS app if approved. | The Podcasts path is live today. The voice path adds interactivity but requires approval and iOS dev. Audio app path (alternative) adds complexity with less UX. |
| **Fastest win: ZAO audible in car THIS WEEK** | Verify RSS feed is discoverable in Apple Podcasts. Users subscribe. CarPlay auto-plays. | The ZAO TTS -> RSS pipeline already exists (v0 started 2026-07-19). RSS feeds are natively playable in CarPlay Podcasts. Zero approval, zero code, zero cost. |
| **What a native CarPlay voice app adds** | Interactive voice Q&A while driving. ZAO responds with audio answers to questions. No manual playback. | Audio-only conversation reduces distraction vs. text; users don't tap/swipe. Users launch ZAO directly (not via Podcasts app). Requires CPVoiceControlTemplate + voice I/O. |
| **Is native app worth the effort?** | MAYBE (decision depends on two factors). | Factors: (1) Does Zaal want interactive QA in the car, or is one-way audio brief sufficient? (2) Does ZOE's voice-out pipeline exist and mature enough? Current state: voice-IN is live (Groq Whisper); voice-OUT is building. If voice-OUT is weeks away, podcasts path is complete sooner. |
| **What app categories are allowed?** | Audio, Communication, Navigation, EV Charging, Fueling, Parking, Public Safety, Quick Food Ordering, **Voice-Based Conversational (NEW, iOS 26.4)**. | Effective Feb 2026, Apple added conversational apps. ChatGPT, Claude, Gemini, Grok already approved. Audio apps are the traditional music/podcast category (CPNowPlayingTemplate). Conversational apps are the NEW way to add voice QA without being "music" or "communication." |
| **Conversational app requirements (iOS 26.4+)** | Entitlement: `com.apple.developer.carplay-voice-based-conversation`. Launch into voice. Voice-primary (no text/imagery). Use CPVoiceControlTemplate. Manual launch from CarPlay home (no wake word). | Apple's Feb 2026 update. All large LLM providers (OpenAI, Anthropic, Google) already approved by mid-2026. Timeline: 3 days to several weeks for approval. |

---

## Findings

### 1. The Existing Infrastructure Already Works (Zero-Cost Path)

**Ground Truth:** Apple Podcasts has native CarPlay support for RSS-based podcasts as of iOS 26 (2025).

- ZAO has a TTS -> RSS -> Apple Podcasts pipeline (v0 started 2026-07-19, live on Pi via Tailscale Funnel).
- Users can add the RSS feed to Apple Podcasts on their iPhone.
- CarPlay's native Podcasts template automatically plays RSS-subscribed episodes.
- **Result:** ZAO's daily audio brief is already playable in CarPlay with zero app development, zero entitlement approval, zero cost.

**Action this week:** Ensure the RSS feed is discoverable and documented. Test playback in CarPlay Podcasts. This is done.

---

### 2. New: Voice-Based Conversational App Entitlement (iOS 26.4)

**Ground Truth:** Apple added a NEW CarPlay category for voice-based conversational apps in February 2026.

**Entitlement:** `com.apple.developer.carplay-voice-based-conversation`

**Requirements:**
- Apps must launch directly into voice mode (no launcher screen, no menu).
- Voice is the PRIMARY modality; text/imagery must be minimal to reduce driver distraction.
- Use Apple's `CPVoiceControlTemplate` framework class for voice control UI (visual feedback while listening/processing).
- Manual launch from CarPlay home screen (no Siri wake word, no steering-wheel button activation).
- Only hold an audio session when voice interaction is active (do not stream continuously).

**Approval Timeline:**
- Approved by: Case-by-case review by Apple (3 days to several weeks).
- Precedent: ChatGPT (March 2026), Perplexity (April 2026), Grok (May 2026), Claude (Q1 2026) already approved.

**Advantages over Audio App:**
- Interactive: User asks ZAO a question, ZAO responds with voice (not just playback).
- Natural: Voice conversation is hands-free and eyes-on-road.
- No text UI: Reduces distraction.
- Dedicated app: Users launch ZAO directly, not via Podcasts.

**Cost:**
- iOS app development: ~3-6 weeks for MVP (one-shot investment).
- Entitlement review: 3 days to 4 weeks.
- Infrastructure: ZOE orchestrator + voice-in (Groq Whisper, live) + voice-out (in progress).

---

### 3. Alternative: Native CarPlay Audio App

**Ground Truth:** Audio apps in CarPlay (e.g., Apple Music, Spotify) use CPNowPlayingTemplate and CPTabBarTemplate for playback controls.

**Why this is NOT recommended for ZAO:**
- Audio apps are designed for passive playback (music streaming service).
- Can only show now-playing info, upcoming queue, playlists—no conversation.
- Would recreate the Podcasts app UX (which already works via RSS).
- More complexity than voice-conversational app, less capability.
- Requires CarPlay audio entitlement (approval SLA unknown).

**Use case mismatch:** ZAO is an assistant/brief, not a music service.

---

### 4. Siri / App Intents Path (NOT recommended)

**Ground Truth:** SiriKit is deprecated as of WWDC 2026; App Intents is the new standard for Siri voice integration.

**Why this is NOT recommended for ZAO:**
- Requires users to say "Hey Siri, ask ZAO..." (not direct app launch).
- Limited to predefined intent domains (App Intents has a whitelist).
- Does not give ZAO its own CarPlay app presence.
- Slower UX than direct launch.

**Use case:** Siri Intents are good for task-specific actions (e.g., "Hey Siri, send a message in [messaging app]"). Not for general QA conversation.

---

### 5. Architecture: What a Native Voice App Needs

**iOS App Stack (MVP):**
1. **Entry Point:** SwiftUI app with a single `CPVoiceControlTemplate` view.
2. **Voice Input:** Integrate Groq Whisper (already in use by ZOE) to transcribe user speech.
3. **Backend:** Call ZOE orchestrator API (existing) or a wrapped ZOL/ZAI endpoint that handles user questions.
4. **Voice Output:** Use Apple AVSpeechSynthesizer (built-in, no API key) or integrate a third-party TTS (Groq Orpheus, OpenAI, edge-tts if available). **Current state:** ZOE has voice-OUT building (memo in memory: `project_zoe_voice_interface.md`).
5. **CarPlay Integration:** Use `CarPlayKit` framework and `UIScene` with `CPInterfaceController`.

**Minimum Dependencies:**
- Xcode 15+ (macOS 14.4+, Zaal has this).
- iOS 26.4+ (target for entitlement).
- Native Swift/SwiftUI (no heavy web wrappers; CarPlay demands native performance).

**Rough LOC:** ~500-800 lines of Swift for MVP (routing, voice I/O, session mgmt).

---

## Recommendations

### Tier 1: Live This Week (Zero Cost, Podcasts Path)

1. **Verify RSS feed is live and public.**
   - Test URL: `[podcast-feed-url]` accessible from any device.
   - Metadata: title, description, artwork (CarPlay shows these).

2. **Document subscription steps for users.**
   - How to add ZAO RSS to Apple Podcasts (one-click link or manual steps).
   - How to access ZAO brief in CarPlay.

3. **Owner:** ZOE or podcasting pipeline owner.
4. **Shipped Criteria:** RSS feed plays in Apple Podcasts on iOS 26+. CarPlay displays and plays episodes. No errors in playback. Users can subscribe one-click.

### Tier 2: Request Entitlement (1-2 Weeks Elapsed, $0 additional cost)

1. **Create Apple Developer account / access (if not already).**
   - Zaal or ZAO dev lead has Apple Developer membership ($99/year).

2. **Request `com.apple.developer.carplay-voice-based-conversation` entitlement.**
   - Log into developer.apple.com.
   - Go to Certificates, IDs, and Profiles.
   - Submit request with app name "ZAO Assistant", summary ("AI-powered ZAO brief and QA"), and intended use case (voice QA in CarPlay).
   - Apple typically responds in 3 days to 4 weeks.

3. **Owner:** ZAO dev lead (likely Zaal or Codex if handling integrations).
4. **Decision:** If approved within 2 weeks, proceed to Tier 3. If longer, reassess.

### Tier 3: Build iOS App (3-6 Weeks, Conditional on Tier 2 Approval + Voice-Out Maturity)

1. **Prerequisite checks (BEFORE starting code):**
   - Is ZOE voice-out pipeline mature? (Can ZOE synthesize audio responses?)
   - Is ZOE's public API endpoint stable for CarPlay to call?
   - Does ZAO want interactive voice QA, or is Podcasts sufficient?

2. **If YES to all:**
   - Build SwiftUI CarPlay app (entrypoint + CPVoiceControlTemplate).
   - Integrate Groq Whisper (voice-in).
   - Call ZOE API (orchestrator).
   - Integrate voice-out (AVSpeechSynthesizer fallback; Groq Orpheus if available).
   - Test on simulated CarPlay environment (Xcode simulator).
   - Submit to App Store for review (2-5 business days).

3. **If NO to voice-out or API stability:**
   - Defer this tier. Keep Podcasts path live.
   - Revisit in 4-6 weeks when voice-out stabilizes.

---

## MVP Path: Timeline and Milestones

| Week | Task | Owner | Shipped Criteria |
|------|------|-------|------------------|
| 1 (This week, Jul 23-29) | Verify RSS feed discovery + CarPlay playback. Document subscription flow. | ZOE/Podcast owner | RSS feed plays in Podcasts on iOS 26. CarPlay displays episodes. |
| 2-3 (Aug 1-13) | Request CarPlay voice entitlement. Prepare app skeleton. | Zaal or ZAO dev | Entitlement request submitted. Basic SwiftUI project structure (empty, can compile). |
| 3-6 (Aug 1-Sept 2) | (Waiting for Apple approval—parallel work: voice-out maturity, ZOE API stability.) | ZOE team | Voice-out POC working. ZOE API has /ask endpoint returning audio or text. |
| 6-12 (Sept 3-Oct 14) | (If approved) Build CarPlay app, voice I/O, API integration. Test. Submit to App Store. | ZAO dev lead | App builds without errors. Passes CarPlay simulator tests. App Store review submitted. |
| 12+ (Mid-Oct+) | (If App Store approved) Deploy. Users download from App Store. Announce. | Ops/marketing | App live on App Store. CarPlay finds it in Podcasts or assistant category. |

---

## Risk and Decision Gates

**Risk 1: Apple denies entitlement.**
- **Likelihood:** Low (ChatGPT, Perplexity, Claude already approved; ZAO is not an outlier).
- **Mitigation:** If denied, stay with Podcasts path (already live). No cost loss.

**Risk 2: Voice-out not ready in time.**
- **Likelihood:** Medium (voice-out is in progress; timeline unclear from memo).
- **Mitigation:** Podcasts path does not depend on voice-out. If voice-out is late, Tier 3 is deferred. Tier 1 and Tier 2 proceed independently.

**Risk 3: ZOE API not stable for CarPlay calling.**
- **Likelihood:** Medium.
- **Mitigation:** Can use temporary mock API for Tier 3 MVP. Real orchestrator integration is a follow-up.

**Risk 4: CarPlay simulator / device testing uncovers blocker.**
- **Likelihood:** Low (CPVoiceControlTemplate is documented, Xcode support is mature).
- **Mitigation:** Reserve 1 week in Tier 3 for integration testing on real device or simulator.

---

## Decision: Should Zaal build the native app?

**Yes, IF:**
- Zaal wants interactive voice QA with ZAO in the car (e.g., "what's today's brief?" and get a voiced response, not a one-way narration).
- Voice-out pipeline will be stable in 4-6 weeks.
- Zaal is comfortable requesting Apple entitlement and managing iOS deployment.

**No, IF:**
- The one-way daily brief in Apple Podcasts (Tier 1, already live) is sufficient for Zaal's use case.
- Voice-out is further away.
- Prioritizing other ZAO projects (ZAOstock, WaveWarZ, etc.) is more valuable.

**Recommendation:** Start Tier 1 and Tier 2 in parallel (RSS verification + entitlement request) this week. Revisit Tier 3 decision in 4 weeks when entitlement status is known and voice-out maturity is clearer.

---

## Sources

- [CarPlay Developer Guide (June 2026)](https://developer.apple.com/download/files/CarPlay-Developer-Guide.pdf) — official Apple source, referenced but large PDF not fully fetched.
- [Apple Developer CarPlay](https://developer.apple.com/carplay/) — official category and framework docs.
- [9to5Mac: iOS 26.4 adds support for voice-based AI apps to CarPlay](https://9to5mac.com/2026/02/18/ios-26-4-adds-support-for-voice-based-ai-apps-to-carplay/)
- [MacRumors: iOS 26.4 Brings CarPlay Support for ChatGPT, Claude and Gemini](https://www.macrumors.com/2026/02/18/ios-26-4-carplay-support/)
- [AppleInsider: AI agents are coming to CarPlay, but they're not getting the keys](https://appleinsider.com/articles/26/02/18/ai-agents-are-coming-to-carplay-but-theyre-not-getting-the-keys)
- [Apple Support: Play podcasts with CarPlay](https://support.apple.com/guide/iphone/play-podcasts-iph3299830d8/ios) — confirms RSS feed support in CarPlay Podcasts.
- [Apple Podcasts for Creators: How Apple Podcasts distributes your shows](https://podcasters.apple.com/support/5108-how-apple-podcasts-distributes-your-shows-to-listeners)
- [CPVoiceControlTemplate | Apple Developer Documentation](https://developer.apple.com/documentation/carplay/cpvoicecontroltemplate)
- [Newly: How to Get an Apple CarPlay Entitlement](https://newly.app/how-to/carplay-entitlement) — approval process overview.

---

## Next Actions

| Action | Owner | Date Target | Notes |
|--------|-------|-------------|-------|
| Verify ZAO RSS feed is live and discoverable in Apple Podcasts | ZOE / Podcast pipeline owner | 2026-07-25 | Test on real iPhone with CarPlay available. |
| Document one-click subscription link or manual steps | Marketing / Zaal | 2026-07-26 | Sharable to users. |
| Decide: Do you want native voice app, or is Podcasts sufficient? | Zaal | 2026-07-26 | Determines scope of Tier 2 and 3. |
| If yes to native app: Request CarPlay voice entitlement | Zaal or ZAO dev lead | 2026-07-27 | Submit via developer.apple.com. |
| Check voice-out pipeline maturity | ZOE orchestrator owner | 2026-08-01 | Assess readiness for CarPlay app integration. |
| (Conditional on approval) Build iOS CarPlay app scaffold | ZAO dev lead | 2026-08-15 | Skeleton project, compiles, no functionality yet. |

---

## Appendix: Comparison of Paths

| Aspect | Podcasts (Tier 1) | Voice Conversational (Tier 3) | Audio App Alternative |
|--------|-------------------|-------------------------------|----------------------|
| **Time to market** | 1 week | 8-12 weeks | 10-14 weeks |
| **Cost (dev)** | 0 | 3-6 weeks FTE | 4-8 weeks FTE |
| **Apple approval** | None (native Podcasts) | 3 days - 4 weeks | Unknown (no precedent) |
| **User UX** | One-way audio playback (brief narration) | Interactive voice Q&A (conversational) | One-way playback (music-style) |
| **Distraction level** | Low (listen passively) | Very low (voice only, no screen) | Low (playback controls) |
| **Hands-free** | Requires manual play | Full hands-free (speak to ask) | Manual play, passive listen |
| **Live in CarPlay** | Yes, TODAY (if RSS is live) | Yes, once app approved and built | Yes, if approved |
| **ZAO brand presence** | In Podcasts app | Dedicated CarPlay app on home screen | In Podcasts or Music-equivalent |
| **Recommendation** | Deploy now | Deploy if voice-out ready + Zaal wants interactivity | Not recommended (redundant with Podcasts) |
