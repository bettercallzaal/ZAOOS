# 416 - Native App Distribution: TestFlight + Play Store for ZAO OS

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Get ZAO OS onto iOS (TestFlight) and Android (Play Store internal track) with easiest possible API integration for the composable OS architecture

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Native wrapper** | USE Capacitor 8 (v8.3.0, March 2026). Wraps existing Next.js app with zero rewrite. Server URL mode for development, static export for production builds |
| **iOS distribution** | USE TestFlight. 10,000 external testers, no UDIDs needed, 24-48hr review. $99/yr Apple Developer Program |
| **Android distribution** | USE Google Play internal testing track. 100 testers, instant availability. $25 one-time Google Play Developer fee |
| **Android bonus** | ALSO do TWA via PWABuilder/Bubblewrap. 1 day effort, additional distribution channel, Chrome engine |
| **Expo** | SKIP. Cannot wrap Next.js. Requires full React Native rewrite. Expo DOM Components allow incremental migration but don't solve the "wrap existing app" problem |
| **Tauri Mobile** | SKIP. Plugin ecosystem too thin, Rust requirement, no server URL mode (see doc 218) |
| **React Native** | SKIP for now. 3-6 month rewrite not justified. Revisit at 1000+ mobile users |
| **PWABuilder for iOS** | SKIP. High Apple rejection rate (Guideline 4.2) without native features. Capacitor is more reliable path |
| **Background audio** | USE Capawesome Audio Player plugin. Solves the iOS background audio wall that PWA cannot |
| **Push notifications** | USE @capacitor/push-notifications (APNs + FCM). Replaces Web Push with native delivery |
| **Wallet connection** | USE existing Wagmi + WalletConnect v2. Works in Capacitor WebView via deep links |
| **API-first for OS modules** | USE existing `/api/[feature]/` routes. Native app consumes same APIs as web. Each module is already API-accessible |

---

## Comparison: Distribution Paths

| Path | Platform | Testers | Review Time | Cost | Effort | ZAO Action |
|------|----------|---------|-------------|------|--------|------------|
| **TestFlight** | iOS | 10,000 external, unlimited internal | 24-48hr (first build) | $99/yr | 2-3 weeks | **DO** |
| **Play Store Internal** | Android | 100 | Instant | $25 one-time | 1-2 weeks | **DO** |
| **Play Store Closed** | Android | 12+ (14-day requirement) | Hours | $25 (same) | Same | Do after internal |
| **TWA (Bubblewrap)** | Android | Unlimited (Play Store) | Days | $25 (same) | 1 day | **DO** |
| **PWABuilder iOS** | iOS | App Store | Weeks + rejections | $99 (same) | 1-2 weeks | SKIP |
| **Direct APK** | Android | Unlimited (sideload) | None | Free | 1 day | DO for testing |

## TestFlight: Step-by-Step

### Prerequisites
- Apple Developer Program ($99/yr) - enroll at developer.apple.com
- Mac with Xcode 26.0+ installed
- Capacitor iOS project generated

### Process

```bash
# 1. Generate Capacitor iOS project
npm install @capacitor/core @capacitor/cli
npx cap init "ZAO OS" "com.zaoos.app" --web-dir=out
npx cap add ios

# 2. Build Next.js static export
# next.config.ts: output: 'export', images: { unoptimized: true }
npm run build

# 3. Sync web assets to native project
npx cap sync ios

# 4. Open in Xcode
npx cap open ios
```

### In Xcode
1. Set Bundle Identifier: `com.zaoos.app`
2. Select your Apple Developer Team
3. Set Deployment Target: iOS 16.0+
4. Archive: Product > Archive
5. Distribute: Organizer > Distribute App > TestFlight Internal Only (first time)
6. Upload to App Store Connect

### In App Store Connect
1. Navigate to TestFlight tab
2. **Internal testing:** Add team members (unlimited). Available immediately, no review.
3. **External testing:** Create a group, add testers by email. First build requires Apple review (24-48hr). Subsequent builds auto-approve if no significant changes.
4. Testers receive email with TestFlight link. They install TestFlight app, then install ZAO OS.

### TestFlight Limits
- 10,000 external testers per app
- Unlimited internal testers (App Store Connect users)
- Builds expire after 90 days
- 6 builds per 24 hours upload limit
- No UDIDs needed (TestFlight handles provisioning)

## Google Play: Step-by-Step

### Prerequisites
- Google Play Developer account ($25 one-time)
- Android Studio Otter 2025.2.1+ 
- Capacitor Android project generated

### Process

```bash
# 1. Generate Capacitor Android project
npx cap add android

# 2. Sync web assets
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

### In Android Studio
1. Set Application ID: `com.zaoos.app`
2. Build > Generate Signed APK/Bundle
3. Create keystore (first time only, SAVE THIS)
4. Build AAB (Android App Bundle) for Play Store, or APK for direct distribution

### In Google Play Console
1. Create new app
2. Navigate to Testing > Internal testing
3. Create a release, upload AAB
4. Add testers by email (up to 100)
5. Testers receive Play Store link, install directly

### Google Play Testing Tracks

| Track | Testers | Review | Purpose |
|-------|---------|--------|---------|
| **Internal** | 100 | None | Fastest, immediate |
| **Closed** | 12+ required | Hours | Needed to unlock production |
| **Open** | Unlimited | Hours-days | Public beta |
| **Production** | Everyone | Days | Full release |

**Important:** New personal developer accounts MUST use closed testing (12 testers, 14 days) before unlocking production access. Internal testing alone doesn't count.

### Direct APK Sideloading (No Play Store)
```bash
# Build debug APK
cd android && ./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
# Share via link, Discord, Telegram - users enable "Install from unknown sources"
```

## Capacitor 8 Configuration for ZAO OS

### capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaoos.app',
  appName: 'ZAO OS',
  webDir: 'out',  // Next.js static export directory
  server: {
    // Development: point to local dev server
    // url: 'http://localhost:3000',
    // Production: use bundled static export
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0a1628',
  },
  android: {
    backgroundColor: '#0a1628',
  },
};

export default config;
```

### next.config.ts changes for Capacitor build

```typescript
// Add to next.config.ts for native builds only
// Use a flag: CAPACITOR_BUILD=true npm run build
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  ...(isCapacitorBuild && {
    output: 'export',
    images: { unoptimized: true },
  }),
};
```

### Server URL Mode (Development Only)

For local development, Capacitor can point at the dev server:

```typescript
server: {
  url: 'http://192.168.1.X:3000',  // local IP, not localhost
  cleartext: true,  // allow HTTP for dev
}
```

This keeps all API routes, SSR, and middleware working during development. For production, use static export.

### The Static Export Problem

Static export (`output: 'export'`) loses:
- API routes (must be deployed separately or use external API)
- Server-side rendering
- Middleware (rate limiting, CORS)
- Server components

**Solution for ZAO OS:** Two deployment modes:
1. **Web (zaoos.com):** Full Next.js with SSR, API routes, middleware
2. **Native app:** Static export that calls `zaoos.com/api/*` for all server operations

The native app is a client-only shell that uses the deployed API. This is the cleanest architecture and aligns with the composable OS vision - each module's API is already accessible over HTTP.

## How This Fits the Composable OS (Doc 415)

The native app IS a shell - just like the phone/desktop/dashboard shells from doc 415:

```
Web Shells:     Phone | Desktop | Dashboard | Feed
Native Shells:  iOS App | Android App

All shells consume the same:
  - App manifest (which apps to show)
  - Core APIs (zaoos.com/api/*)
  - User preferences (pinned apps, widgets, startup)
```

The native shell adds:
- Background audio (Capawesome plugin)
- Native push notifications (APNs/FCM)
- App Store presence
- Deep link handling

But renders the same app modules via WebView or static export.

### API-First Architecture Benefit

Because every feature already has `/api/[feature]/` routes:

```
Chat    → /api/chat/*        → works from web OR native
Music   → /api/music/*       → works from web OR native  
XMTP    → /api/messages/*    → works from web OR native
Agents  → /api/agents/*      → works from web OR native
Spaces  → /api/stream/*      → works from web OR native
```

The native app doesn't need special backend work. It's another client of the same API.

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Developer | $25 | One-time |
| Capacitor | Free (MIT) | - |
| Capawesome Audio Player | Free (MIT) | - |
| TestFlight | Free (included) | - |
| Play Store Internal Testing | Free (included) | - |
| **Total Year 1** | **$124** | |
| **Total Year 2+** | **$99** | |

## Implementation Timeline

| Phase | What | Time | Depends On |
|-------|------|------|------------|
| 1 | Apple + Google developer accounts | 1 day | $124 |
| 2 | Capacitor init + iOS/Android projects | 2 days | Accounts |
| 3 | Static export build mode | 1 day | Phase 2 |
| 4 | Background audio plugin | 3 days | Phase 2 |
| 5 | Push notifications | 2 days | Phase 2 |
| 6 | TestFlight submission | 1 day | Phase 3-4 |
| 7 | Play Store internal track | 1 day | Phase 3 |
| 8 | TWA via Bubblewrap | 1 day | PWA manifest |
| 9 | Testing on physical devices | 3-5 days | Phase 6-7 |
| **Total** | | **2-3 weeks** | |

---

## ZAO Ecosystem Integration

### Codebase Files Affected

| File | Change |
|------|--------|
| `capacitor.config.ts` | NEW - Capacitor configuration |
| `next.config.ts` | ADD conditional static export for CAPACITOR_BUILD |
| `package.json` | ADD @capacitor/core, @capacitor/cli, @capacitor/push-notifications |
| `ios/` | NEW - Xcode project (generated by Capacitor) |
| `android/` | NEW - Android Studio project (generated by Capacitor) |
| `src/providers/audio/PlayerProvider.tsx` | MODIFY - detect Capacitor, delegate to native audio |
| `src/lib/push/` | MODIFY - use native push when in Capacitor |
| `src/lib/os/shells.ts` | ADD ios-app and android-app shell types |
| `public/manifest.json` | Already exists, good baseline |
| `.gitignore` | ADD ios/, android/ build artifacts |

### Existing Assets That Help

- `public/manifest.json` - PWA manifest already configured
- `src/components/pwa/ServiceWorkerRegistration.tsx` - service worker exists
- `src/lib/push/vapid.ts` - Web Push infrastructure exists
- `src/providers/audio/PlayerProvider.tsx` - audio player with MediaSession
- `src/providers/audio/HTMLAudioProvider.tsx` - crossfade engine (needs native adapter)
- All 301 API routes - already API-first, native app just consumes them

---

## Sources

- [Apple TestFlight Overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [iOS App Distribution Guide 2026](https://foresightmobile.com/blog/ios-app-distribution-guide-2026)
- [Google Play Testing Tracks](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Google Play 12 Testers Closed Testing Guide](https://primetestlab.com/blog/google-play-12-testers-closed-testing-guide)
- [Capacitor 8 Updating Guide](https://capacitorjs.com/docs/updating/8-0)
- [Building Next.js + Capacitor Native App](https://capgo.app/blog/building-a-native-mobile-app-with-nextjs-and-capacitor/)
- [Apple Developer Program Pricing](https://developer.apple.com/support/compare-memberships/)
- [Expo DOM Components](https://docs.expo.dev/guides/dom-components/)
- [Doc 218: Mobile App Strategy](../218-mobile-app-strategy-pwa-native/) - Original research, still accurate, Capacitor recommended
- [Doc 415: Composable OS Architecture](../415-composable-os-architecture/) - Shell + Apps + Core layer design
