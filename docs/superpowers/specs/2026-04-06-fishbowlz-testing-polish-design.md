# FISHBOWLZ Testing Polish — Design Spec

> **Date:** 2026-04-06
> **Goal:** Ship 4 pushes that make FISHBOWLZ ready for real user testing: quick UX wins, error handling, app-wide issue reporter, and share modal.

---

## Batching Strategy

| Push | Features | Risk |
|------|----------|------|
| **Push 1** | Hand raise queue numbers, token gate error messages, room ended interstitial | Low — UI-only changes |
| **Push 2** | Browser/mic guidance banner, better error states | Low — additive, no logic changes |
| **Push 3** | App-wide GitHub issue reporter | Medium — new API route + GitHub integration |
| **Push 4** | Share modal upgrade | Low — new component, replaces simple button |

Each push is a separate commit so issues can be isolated and reverted independently.

---

## Push 1: Quick Wins

### Hand Raise Queue with Numbers

**File:** `src/app/fishbowlz/[id]/page.tsx`

- Sort hand raises by timestamp (already stored via `raised_at` or insertion order)
- Display position number next to each entry in the host's queue panel: `1. @username [Approve]`
- Listeners with a raised hand see their position: "You're #3 in queue" below the raise/lower button
- Host sees oldest-first ordering so they know who's been waiting longest

### Token Gate Error Messaging

**Files:** `src/app/fishbowlz/[id]/page.tsx`

- When join returns 403 with gating error, parse the `reason` field from the response
- Display an inline alert (not a toast) below the join button that persists until dismissed:
  - FC identity gate: "Your Farcaster quality score is {score}. This room requires {min}."
  - Token gate: "You need {minBalance} tokens to join. Connect your wallet or check your balance."
  - Generic fallback: "You don't meet the requirements to join this room."
- Alert styled as red/amber banner with border, matching dark theme

### Room Ended Interstitial

**File:** `src/app/fishbowlz/[id]/page.tsx`

- When polling detects `room.state === 'ended'`, instead of instant redirect:
  1. Show a centered overlay: "This fishbowl has ended"
  2. Display room title and host
  3. If transcript segments exist, show "View Transcript" link
  4. Auto-redirect countdown: "Redirecting in 5..." ticking down each second
  5. "Back to Rooms" button for immediate navigation
- `setAudioJoined(false)` immediately to disconnect audio

---

## Push 2: Browser/Mic Guidance + Error States

### Guidance Banner

**File:** `src/app/fishbowlz/[id]/page.tsx`

- Yellow info bar positioned between header and hot seats
- Contextual messages based on detection:
  - Non-Chrome browser (check `navigator.userAgent`): "Live transcription works best in Chrome. Audio works in all browsers."
  - First room visit (localStorage `fishbowlz-guidance-seen` flag): "Allow microphone access when prompted to join as a speaker."
- Dismissable with X button — stores dismissal in localStorage
- Auto-hides after user has successfully joined audio

### Better Error States

**Files:** `src/app/fishbowlz/[id]/page.tsx`, `src/components/spaces/HMSFishbowlRoom.tsx`

- HMS audio connection failure: "Check that your browser has microphone permission. Try refreshing." with retry button
- Room fetch error after 2 failed attempts: "This room may have been deleted." with back button
- Network errors on heartbeat/join: Toast "Connection issue. Retrying..." with automatic retry (already best-effort, just add user feedback)

---

## Push 3: App-Wide Issue Reporter

### Component: `src/components/feedback/IssueReporter.tsx`

- `"use client"` component
- Floating button in bottom-left corner: small bug icon + "Feedback" text
- Opposite side from bottom nav to avoid overlap
- Only renders for authenticated users (check session)
- Hidden on landing/login page

**Modal contents:**
- Type dropdown: Bug, Feature Request, Feedback
- Title field (required)
- Description textarea with placeholder: "What happened? What did you expect?"
- Auto-captured context shown as read-only chips: current page path, browser/OS, Farcaster username
- Optional screenshot: paste or upload an image
- Submit button with loading state
- Rate limit notice: "1 report per 5 minutes"

### API Route: `src/app/api/feedback/route.ts`

- POST handler, requires authenticated session
- Validates with Zod: type (enum), title (string, 5-200 chars), description (string, 10-2000 chars), screenshot (optional base64 string)
- Creates GitHub issue via `@octokit/rest`:
  - Repo: configured via `GITHUB_FEEDBACK_REPO` env var (e.g., `zaalpanthaki/zao-os`)
  - Title: `[{Type}] {title}`
  - Body: description + auto-context block (page URL, browser, OS, Farcaster username, timestamp)
  - Labels: `feedback`, `{type}` (kebab-case), page-derived tag (`fishbowlz`, `music`, `spaces`, `governance`, etc.)
  - Screenshot: embedded as base64 image in issue body if provided
- Server-side env var: `GITHUB_TOKEN` (PAT with `repo` scope) — never exposed to client
- Rate limit: 1 issue per FID per 5 minutes (check via Supabase or in-memory map)

### Layout Integration: `src/app/(auth)/layout.tsx`

- Import and render `<IssueReporter />` inside the auth layout so it appears on all authenticated pages

---

## Push 4: Share Modal

### Component: `src/components/shared/ShareModal.tsx`

- Reusable component: `<ShareModal url={string} title={string} description={string} isOpen={boolean} onClose={() => void} />`
- Grid of share options:

| Option | Implementation | Visibility |
|--------|---------------|------------|
| Copy Link | `navigator.clipboard.writeText(url)` with checkmark feedback | Always |
| Cast to Farcaster | `window.open('https://warpcast.com/~/compose?text=${encodeURIComponent(title)}&embeds[]=${encodeURIComponent(url)}')` | Always |
| Share to X | `window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}')` | Always |
| QR Code | `qrcode.react` package, renders inline in modal | Always |
| Native Share | `navigator.share({ title, text: description, url })` | Mobile only (feature-detect `navigator.share`) |

- Native Share shown as primary full-width button on mobile, above the grid
- Modal styled consistent with existing FISHBOWLZ modals (bg-[#1a2a4a], border-white/10, rounded-xl)

### New dependency: `qrcode.react`

- MIT license, 2.5K stars, lightweight
- `npm install qrcode.react`

### Integration in Room Page

**File:** `src/app/fishbowlz/[id]/page.tsx`

- Replace current copy-link button with share button that opens `<ShareModal>`
- Pass room URL (`{origin}/fishbowlz/{slug}`), title, and description

### OG Meta Tags

**File:** `src/app/fishbowlz/[id]/page.tsx` (or `layout.tsx`)

- Verify/add `generateMetadata` that returns:
  - `og:title` = room title
  - `og:description` = "LIVE — {n} in the fishbowl" when active, "Fishbowl ended" when ended
  - `og:image` = existing opengraph-image route

---

## Out of Scope

- Seed room: manual action before test, no code needed
- Push notifications for room invites
- Screenshot capture via `html2canvas` (complex, defer — just support paste/upload for now)
- Farcaster Frames integration for share previews
