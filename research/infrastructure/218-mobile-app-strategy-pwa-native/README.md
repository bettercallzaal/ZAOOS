# 218 — Mobile App Strategy: PWA, Capacitor, React Native, Expo, Tauri, TWA

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Evaluate all viable paths for shipping ZAO OS as a mobile app — from PWA optimization to full native rebuild — with focus on background audio, mic access, wallet connection, and App Store distribution.

---

## Executive Summary

ZAO OS already ships as a PWA with manifest, install prompt, and MediaSession lock screen controls. The critical gap is **iOS background audio** — music stops when the app is backgrounded or the screen locks. This single limitation drives the entire mobile strategy decision.

**Recommendation:** A phased approach.

1. **Now:** Optimize the existing PWA (service worker, offline caching, push notifications)
2. **Next (Q2 2026):** Capacitor wrapper for App Store presence + background audio
3. **Later (if needed):** React Native rebuild only if Capacitor WebView performance becomes a bottleneck

Capacitor is the clear winner for ZAO OS because it wraps the existing Next.js codebase with zero rewrite, adds native background audio and push notifications, and gets the app into both App Stores. A full React Native rebuild is not justified until the user base demands native-level performance that a WebView cannot deliver.

---

## Comparison Table

| Dimension | PWA (Optimized) | Capacitor | React Native | Expo | Tauri Mobile | TWA |
|---|---|---|---|---|---|---|
| **Dev effort** | 1-2 weeks | 2-4 weeks | 3-6 months | 2-4 months | 2-4 months | 1 week |
| **Code reuse** | 100% | 95-100% | 20-40% | 20-40% | 60-80% | 100% |
| **iOS App Store** | No | Yes | Yes | Yes | Yes | No |
| **Google Play Store** | No (see TWA) | Yes | Yes | Yes | Yes | Yes |
| **Background audio (iOS)** | No | Yes (native plugin) | Yes (native) | Yes (expo-av) | Yes (native plugin) | No |
| **Background audio (Android)** | Yes (MediaSession) | Yes | Yes | Yes | Yes | Yes |
| **Push notifications** | Partial (iOS 16.4+ Home Screen only) | Full native | Full native | Full native | Full native | Delegated from Chrome |
| **Camera/mic access** | Yes (WebRTC) | Yes (native + WebRTC) | Yes (native) | Yes (native) | Yes (native) | Yes (WebRTC) |
| **Wallet connection** | WalletConnect (browser) | WalletConnect (deep links) | Reown AppKit (native) | Reown AppKit (native) | WalletConnect (WebView) | WalletConnect (browser) |
| **Offline support** | Service worker caching | Service worker + native | Full native offline | Full native offline | Service worker + native | Service worker caching |
| **Performance** | WebView | WebView (native shell) | Native UI rendering | Native UI rendering | WebView (WRY/WebKit) | Chrome engine |
| **Hot reload** | Instant (web) | Instant (web layer) | Fast Refresh | Fast Refresh | HMR to device | Instant (web) |
| **Maintenance burden** | Low | Low-Medium | High | Medium | Medium-High | Very Low |
| **Maturity** | Mature | Mature (v8) | Mature | Mature | Young (v2, Oct 2024) | Mature |

---

## 1. PWA Optimization

### What ZAO OS Already Has
- `public/manifest.json` with standalone display, icons, theme color
- `PWAInstallPrompt.tsx` component with iOS detection, deferred prompt, auto-dismiss
- MediaSession API with all 8 action handlers (play, pause, next, previous, seek forward/back, seek to, stop)
- Wake Lock API to prevent screen dimming during playback
- Farcaster Mini App embed metadata

### What Is Missing
- **No service worker** — no offline caching, no background sync, no push notification infrastructure
- **No Web Push** — no subscription management, no notification delivery
- **No offline page** — app is blank without network

### Recommended PWA Improvements

#### Service Worker with Serwist
Serwist is the maintained successor to `next-pwa` (which used Workbox). It is the current recommendation for Next.js PWA setup in 2026.

```
npm install @serwist/next @serwist/precaching @serwist/sw
```

Key capability: precache app shell, cache API responses with stale-while-revalidate, serve offline fallback page.

**Caveat:** Serwist requires Webpack, not Turbopack. The dev server can still use Turbopack, but `next build` must use Webpack when Serwist is configured.

#### Web Push Notifications
- Supported on iOS 16.4+ (Safari) but **only for Home Screen installed PWAs**
- Requires explicit user permission — opt-in rates are roughly 3x lower than native push
- No badge count support on iOS, no silent push, no background delivery when app is closed
- Android/Chrome: full support, reliable delivery

#### Manifest Enhancements
- Add `id` field for stable app identity across updates
- Add `screenshots` array for richer install UI on Android
- Add `shortcuts` for quick actions from home screen icon
- Add `share_target` to receive shared content from other apps

### The iOS Background Audio Wall

This is the dealbreaker for a music-first app:

- **iOS Safari/PWA kills audio when the app is backgrounded or the screen locks.** The `<audio>` element stops. The MediaSession API provides lock screen controls but cannot keep audio alive in the background.
- Neither the Media Session API nor the Web Audio API is available in a service worker — they require the page context to stay alive.
- The Wake Lock API prevents screen dimming but does not prevent the OS from suspending the web context.
- **Android is fine** — MediaSession + service worker keeps audio playing in the background.

**Bottom line:** PWA optimization is worth doing for Android users and for the install/offline experience, but it cannot solve the core problem of iOS background audio. This alone justifies a native wrapper.

### Effort Estimate
- Service worker + offline caching: 3-5 days
- Web Push notification infrastructure: 3-5 days
- Manifest enhancements: 1 day
- **Total: 1-2 weeks**

---

## 2. Capacitor (Recommended)

### What It Is
Capacitor (by Ionic, now at v8) wraps your existing web app in a native WebView container. It generates Xcode and Android Studio projects, provides a plugin system for native APIs, and lets you submit to both App Stores. Your Next.js code runs as-is inside the WebView.

### Why It Fits ZAO OS

1. **Zero rewrite** — the entire Next.js app runs inside the native shell
2. **Background audio solved** — native audio plugins bypass iOS WebView limitations
3. **App Store distribution** — both iOS and Android
4. **Tailwind, React Query, all hooks work unchanged** — it is still a web app
5. **Supabase, XMTP, Neynar all work** — no SDK compatibility issues
6. **Incremental adoption** — start with the wrapper, add native plugins as needed

### How It Works
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init` — generates `capacitor.config.ts`
3. `next build && next export` (static export) or point Capacitor at the deployed URL
4. `npx cap add ios && npx cap add android` — generates native projects
5. `npx cap sync` — copies web assets to native projects
6. Open in Xcode / Android Studio, build, and run

### Key Consideration: Static Export vs Server URL

Capacitor can work two ways with Next.js:
- **Static export** (`output: 'export'`): bundles the app into the native shell. Fastest, fully offline-capable. But loses SSR, API routes, middleware — everything server-side.
- **Server URL mode**: points the WebView at your deployed `zaoos.com`. Keeps all server features. Requires network. Updates are instant (no App Store review for web changes).

**For ZAO OS:** Server URL mode is the right choice. ZAO OS relies heavily on API routes, middleware rate limiting, and server-side session management. The native shell provides background audio, push notifications, and App Store presence while the web layer handles everything else.

### Background Audio

The **Capawesome Audio Player** plugin provides:
- Background audio playback on iOS and Android
- Lock screen controls / notification media controls
- Play, pause, seek, volume, playback rate
- Loop support

Configuration requires enabling Background Modes > Audio, AirPlay, and Picture in Picture in the Xcode project.

Alternative: `@capacitor-community/native-audio` or `@mediagrid/capacitor-native-audio` with OS notification support.

**Architecture decision:** Use the native audio plugin for the primary music player. The existing `HTMLAudioProvider.tsx` dual-element crossfade engine would need to be adapted — either delegate playback to the native layer when running in Capacitor, or use the native plugin only for background keepalive while the web audio handles crossfade.

### Push Notifications
`@capacitor/push-notifications` provides full native push on both platforms. APNs (iOS) and FCM (Android). Replaces the Web Push approach entirely with higher opt-in rates and reliable delivery.

### Wallet Connection
WalletConnect works in Capacitor via deep links. When the user initiates a wallet connection, the native shell can open MetaMask/Rainbow/Coinbase Wallet via deep link, and the wallet app redirects back after signing. The existing Wagmi setup works — WalletConnect v2 handles the communication.

There is an open Capacitor community proposal for a dedicated WalletConnect plugin, but the web-based WalletConnect flow already works in WebView with deep link support.

### Camera/Mic for Audio Rooms
WebRTC works in Capacitor's WebView. The existing 100ms and Stream.io audio room integrations should work as-is. For enhanced mic access, `@capacitor-community/media` or native plugins can be added.

### App Store Considerations
- **Apple:** NFT viewing allowed. Token-gated content OK if tokens are purchased outside the app. 30% commission on digital goods sold through IAP. ZAO OS does not sell digital goods in-app, so this is not an issue.
- **Google:** More permissive with blockchain apps. Crypto wallet connections allowed. Digital goods can be sold outside Play billing.

### Effort Estimate
- Capacitor setup + native project generation: 2-3 days
- Background audio plugin integration + PlayerProvider adapter: 3-5 days
- Push notification setup (APNs + FCM): 2-3 days
- Testing on physical devices + App Store submission: 3-5 days
- **Total: 2-4 weeks**

---

## 3. React Native (Full Rebuild)

### What It Is
React Native renders native UI components (not WebView). You write React code, but it produces actual iOS UIKit / Android native views. This gives the best performance but requires rewriting the entire UI layer.

### The Case For It
- True native performance — 60fps scrolling, native gestures, native navigation
- `react-native-track-player` is the gold standard for music apps — background playback, lock screen controls, queue management, all native
- Full access to every device API without plugin wrappers
- Largest mobile React ecosystem

### The Case Against It (For ZAO OS)
- **3-6 month rewrite** — 30+ music components, chat, messaging, governance, admin, social features
- **Divergent codebases** — web and mobile become separate projects with shared logic at best
- Tailwind CSS does not work in React Native (NativeWind exists but is a subset)
- Next.js API routes, middleware, server components — none of this carries over
- XMTP SDK has React Native support but requires separate integration
- Supabase works in React Native but needs `@supabase/supabase-js` with AsyncStorage adapter
- **Solo developer** — maintaining two codebases is not sustainable

### What You Would Reuse
- Business logic (API calls, data transforms, validation schemas)
- Type definitions
- React Query hooks (with adapter)
- State management patterns

### What You Would Rewrite
- Every component (JSX is similar but no HTML elements — `<View>`, `<Text>`, `<ScrollView>`)
- All styling (StyleSheet.create or NativeWind instead of Tailwind)
- Navigation (React Navigation instead of Next.js App Router)
- Audio player (react-native-track-player instead of HTMLAudioProvider)
- Auth flow (no cookies — use secure storage)

### Effort Estimate
- Core navigation + auth: 2-3 weeks
- Music player with react-native-track-player: 2-3 weeks
- Chat + messaging: 2-3 weeks
- Social features, governance, admin: 4-6 weeks
- Testing + App Store submission: 2-3 weeks
- **Total: 3-6 months full-time**

---

## 4. Expo (Managed React Native)

### What It Is
Expo is a framework built on top of React Native that provides a managed workflow — no Xcode or Android Studio required for most development. It handles native builds in the cloud (EAS Build), provides a curated set of native modules (expo-av, expo-camera, expo-notifications), and supports over-the-air updates.

### Advantages Over Bare React Native
- **No Xcode/Android Studio** for daily development — `npx expo start` and test on device via Expo Go
- **EAS Build** — cloud builds for iOS and Android without a Mac for Android builds
- **expo-av** — audio playback with `staysActiveInBackground: true` and `playsInSilentModeIOS: true`
- **expo-notifications** — unified push notification API
- **Over-the-air updates** — push JS bundle updates without App Store review
- **Config plugins** — extend native config from `app.json` without touching native code

### Disadvantages
- Same rewrite effort as React Native (it IS React Native)
- `expo-av` is less feature-rich than `react-native-track-player` for advanced music player needs — track player requires a custom dev client (ejecting from Expo Go)
- Some Capacitor-only plugins have no Expo equivalent
- Expo Go has limitations — custom native modules require `npx expo prebuild` (bare workflow)

### Background Audio
```
Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  shouldDuckAndroid: true,
})
```

For advanced features (queue management, lock screen controls, gapless playback), `react-native-track-player` with a custom Expo dev client is recommended.

### Effort Estimate
- Same as React Native: **3-6 months** (Expo saves setup time but not rewrite time)
- Slight advantage: EAS Build saves CI/CD setup, OTA updates reduce App Store friction

---

## 5. Tauri Mobile

### What It Is
Tauri is a Rust-based framework for building desktop and mobile apps using web technologies. Tauri 2.0 (stable October 2024) added iOS and Android support. Like Capacitor, it wraps a WebView, but the backend is Rust instead of Java/Swift. The WebView is WRY (WebKit on iOS/macOS, WebView2 on Windows, WebKitGTK on Linux).

### Audio Plugin Ecosystem
- `tauri-plugin-native-audio` — native playback with background support, lock screen controls, Media3 ExoPlayer (Android), AVPlayer (iOS)
- `tauri-plugin-media-toolkit` — media editing, playback, and analysis
- `tauri-plugin-musickit` — Apple MusicKit integration

### Advantages
- Smaller binary size than Capacitor or Electron
- Rust backend is fast and memory-safe
- HMR works on mobile emulators
- Plugin system supports Swift (iOS) and Kotlin (Android)

### Disadvantages for ZAO OS
- **Young mobile ecosystem** — stable for only ~18 months, far fewer plugins than Capacitor
- **Rust requirement** — backend plugins must be written in Rust, Swift, or Kotlin. ZAO OS team has no Rust experience.
- **Smaller community** — fewer Stack Overflow answers, fewer tutorials, fewer battle-tested production apps
- **No equivalent to Capacitor's server URL mode** — Tauri expects to bundle the frontend, which means losing Next.js server features or building a complex proxy layer
- **Web3/wallet plugins do not exist** — would need to build from scratch
- **Next.js integration is less documented** than Capacitor

### Verdict
Tauri Mobile is promising technology but premature for ZAO OS. The plugin ecosystem is too thin, the community too small, and the Rust requirement adds complexity without clear benefit over Capacitor. Revisit in 12-18 months.

### Effort Estimate
- Setup + Rust toolchain + native projects: 1-2 weeks
- Audio plugin integration: 1-2 weeks
- Wallet connection (custom plugin): 2-4 weeks
- Testing + submission: 1-2 weeks
- **Total: 2-4 months** (with significant unknowns)

---

## 6. TWA (Trusted Web Activity)

### What It Is
TWA is an Android-only mechanism to publish a PWA in the Google Play Store. It uses Chrome's rendering engine (not a WebView) to display your web app in a full-screen native container. No browser UI is shown. The app is essentially a thin Android wrapper that opens your PWA URL.

### How It Works
1. Meet Lighthouse PWA score of 80+
2. Set up Digital Asset Links (verify domain ownership)
3. Package with **Bubblewrap** (Google Chrome Labs CLI) or **PWA Builder** (Microsoft GUI)
4. Submit the generated AAB to Google Play

### Advantages
- **Minimal effort** — 1 day to package, 1 week including Play Store review
- **Zero code changes** — your PWA runs as-is
- **Chrome engine** — same performance as the web app
- **Push notification delegation** — Chrome push notifications work through the TWA
- **Instant updates** — web deployments update the app immediately, no Play Store review

### Disadvantages
- **Android only** — Apple does not support TWA or any equivalent
- **No background audio beyond what the PWA supports** — TWA does not add native capabilities
- **Chrome dependency** — user must have Chrome installed (99%+ of Android users do)
- **Play Store discovery** — app competes with native apps but has no native features

### Verdict
TWA is a quick win for Android Play Store presence. It should be done alongside the Capacitor work since it takes minimal effort and provides an additional distribution channel. However, it does not solve the iOS problem at all.

### Effort Estimate
- Bubblewrap setup + Digital Asset Links: 1 day
- Play Store listing + review: 3-5 days
- **Total: ~1 week**

---

## ZAO OS-Specific Considerations

### Music Player (Background Audio)

| Approach | iOS Background Audio | Lock Screen Controls | Crossfade | Queue Management |
|---|---|---|---|---|
| **PWA** | No | MediaSession (unreliable) | Web Audio API | JavaScript |
| **Capacitor + native plugin** | Yes | Native (reliable) | Hybrid (web + native) | Hybrid |
| **React Native + track-player** | Yes | Native (reliable) | Native | Native |
| **Tauri + native-audio** | Yes | Native (reliable) | Unknown | Plugin-dependent |

The Capacitor approach requires an adapter layer: detect if running in Capacitor (`Capacitor.isNativePlatform()`), and if so, delegate playback to the native audio plugin while keeping the web UI. The crossfade engine in `HTMLAudioProvider.tsx` is the trickiest part — it uses dual `<audio>` elements. Options:
- **Option A:** Use native plugin for primary playback, web audio only for crossfade transition effects (compromise)
- **Option B:** Keep web audio for everything but use a silent native audio session to prevent iOS from killing the WebView audio context (hack, may not be reliable)
- **Option C:** Rewrite crossfade in native (significant effort, probably not worth it for Capacitor)

### Audio Rooms (Mic Access)

WebRTC mic access works in both Capacitor WebView and PWA. The existing 100ms / Stream.io integrations should work without changes in Capacitor. For React Native, the 100ms and Stream SDKs have dedicated React Native packages.

### Wallet Connection (WalletConnect)

| Approach | How It Works |
|---|---|
| **PWA** | WalletConnect QR code or mobile deep link. Works today. |
| **Capacitor** | WalletConnect deep links. Native shell handles app-to-app communication. Wagmi works. |
| **React Native** | Reown AppKit (@reown/appkit-ethers-react-native). Dedicated SDK. Better UX with mobile linking. |

ZAO OS uses Wagmi + Viem for wallet integration. In Capacitor, this continues to work — WalletConnect v2 handles the communication, and the native shell enables smooth deep link flows between the app and wallet apps (MetaMask, Rainbow, Coinbase Wallet).

### Farcaster Integration
- **Sign In With Farcaster (SIWF):** Works in Capacitor WebView. The auth flow redirects to Farcaster client apps via deep link.
- **Neynar API calls:** All server-side, unaffected by client platform.
- **Farcaster Mini App:** ZAO OS already has Mini App metadata. The Capacitor app and the Mini App are complementary distribution channels.

---

## Recommended Phased Plan

### Phase 1: PWA Optimization (Now — 1-2 weeks)
- Add Serwist service worker for offline caching and app shell precaching
- Implement Web Push notifications (Supabase for subscription storage)
- Enhance manifest (screenshots, shortcuts, share_target)
- Add offline fallback page
- **Result:** Better Android experience, offline capability, push notifications for Home Screen users

### Phase 2: Capacitor Wrapper (Q2 2026 — 2-4 weeks)
- Initialize Capacitor with server URL mode pointing to `zaoos.com`
- Integrate Capawesome Audio Player for background audio
- Set up native push notifications (APNs + FCM)
- Build PlayerProvider adapter to delegate to native audio when in Capacitor
- Submit to App Store and Play Store
- **Result:** iOS background audio solved, App Store presence, native push

### Phase 3: TWA for Google Play (Alongside Phase 2 — 1 week)
- Package PWA with Bubblewrap
- Submit to Google Play as TWA
- **Result:** Additional Android distribution channel with zero maintenance

### Phase 4: Evaluate React Native (Only If Needed — 2027+)
- Only if Capacitor WebView performance becomes a user complaint
- Only if the user base grows to justify the maintenance of two codebases
- Only if native-specific features (e.g., advanced haptics, ARKit integration) become product requirements
- **Trigger:** 1,000+ active mobile users reporting WebView performance issues

---

## Sources

### PWA and iOS Limitations
- [PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Progressive Web Apps on iOS — Complete Guide 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Safari PWA Limitations on iOS](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios/)
- [What We Learned About PWAs and Audio Playback](https://blog.prototyp.digital/what-we-learned-about-pwas-and-audio-playback/)
- [PWA vs Native App — 2026 Comparison Table](https://progressier.com/pwa-vs-native-app-comparison-table)
- [Media Session API in Service Worker Discussion (W3C)](https://github.com/w3c/mediasession/issues/232)
- [iOS Web Apps and Media Session API](https://dbushell.com/2023/03/20/ios-pwa-media-session-api/)

### Service Worker and Serwist
- [Building a PWA in Next.js with Serwist](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7)
- [Build a Next.js 16 PWA with True Offline Support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Next.js PWA Setup Guide](https://dev.to/rakibcloud/progressive-web-app-pwa-setup-guide-for-nextjs-15-complete-step-by-step-walkthrough-2b85)

### Capacitor
- [Convert Next.js App to iOS and Android with Capacitor 8](https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/)
- [Building a Native Mobile App with Next.js and Capacitor](https://devdactic.com/nextjs-and-capacitor)
- [Capacitor Official Site](https://capacitorjs.com/)
- [Next.js + Capacitor Starter](https://nextnative.dev/blog/capacitor-mobile-app)
- [Capawesome Audio Player Plugin](https://capawesome.io/plugins/audio-player/)
- [capacitor-community/native-audio](https://github.com/capacitor-community/native-audio)
- [@mediagrid/capacitor-native-audio](https://www.npmjs.com/package/@mediagrid/capacitor-native-audio)

### React Native and Expo
- [PWA vs Native App — When to Build](https://www.magicbell.com/blog/pwa-vs-native-app-when-to-build-installable-progressive-web-app)
- [Native vs Hybrid vs PWA Apps — 2026 Guide](https://natively.dev/articles/native-hybrid-pwa-comparison)
- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [React Native Track Player with Expo](https://medium.com/@gionata.brunel/implementing-react-native-track-player-with-expo-including-lock-screen-part-1-ios-9552fea5178c)
- [expo-av vs react-native-track-player Comparison](https://npm-compare.com/expo-av,react-native-sound,react-native-track-player)

### Tauri Mobile
- [Tauri 2.0 Stable Release](https://v2.tauri.app/blog/tauri-20/)
- [tauri-plugin-native-audio](https://github.com/uvarov-frontend/tauri-plugin-native-audio)
- [tauri-plugin-media-toolkit](https://github.com/brenogonzaga/tauri-plugin-media-toolkit)
- [Tauri Mobile Plugin Development](https://v2.tauri.app/develop/plugins/develop-mobile/)

### TWA (Trusted Web Activity)
- [Publishing PWA to App Store and Google Play 2026](https://www.mobiloud.com/blog/publishing-pwa-app-store)
- [Android Trusted Web Activities Overview](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities)
- [Adding Your PWA to Google Play](https://developers.google.com/codelabs/pwa-in-play)
- [Bubblewrap — PWA to Play Store Guide](https://www.thinktecture.com/en/pwa/twa-bubblewrap/)

### Wallet Connection
- [WalletConnect React Native Modal](https://github.com/WalletConnect/modal-react-native)
- [Reown AppKit for React Native](https://medium.com/@abd.sialvi64/how-i-integrated-walletconnect-using-reown-appkit-in-react-native-cli-87255ba092a6)
- [Capacitor WalletConnect Proposal](https://github.com/capacitor-community/proposals/issues/163)
- [Web3 on Mobile with WalletConnect](https://medium.com/@ancilartech/web3-on-mobile-bridging-the-gap-with-walletconnect-and-in-app-browsers-3c86cba2f942)
