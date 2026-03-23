# SongJam Audio Spaces Embed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed SongJam's ZABAL audio spaces as a prominent, full-page iframe in ZAO OS so members can host and join live audio rooms without leaving the app.

**Architecture:** Create a dedicated `/spaces` route with a near-fullscreen SongJam iframe. Fix iframe permissions so microphone/camera work for audio participation. Update navigation to make Spaces easily discoverable. Clean up the duplicate SongJam entry in the Ecosystem panel.

**Tech Stack:** Next.js App Router, iframe with `allow` permissions, existing community.config.ts partner data.

**Research:** See `research/119-songjam-audio-spaces-embed/README.md` for full technical analysis.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/(auth)/spaces/page.tsx` | **Create** | Full-page SongJam iframe route |
| `src/components/navigation/BottomNav.tsx` | **Modify** | Add Spaces to MORE_ITEMS, update MORE_MATCH_PATHS |
| `src/components/ecosystem/EcosystemPanel.tsx` | **Modify** | Fix iframe permissions, make SongJam link to /spaces instead of inline iframe |
| `src/app/(auth)/ecosystem/page.tsx` | **Modify** | Make SongJam card link to /spaces instead of external URL |
| `community.config.ts` | **Modify** | Update SongJam description to mention audio spaces |

---

### Task 1: Create the `/spaces` route page

**Files:**
- Create: `src/app/(auth)/spaces/page.tsx`

- [ ] **Step 1: Create the spaces page component**

```tsx
'use client';

import Link from 'next/link';
import { NotificationBell } from '@/components/navigation/NotificationBell';

const SONGJAM_URL = 'https://songjam.space/zabal';

export default function SpacesPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm text-gray-300">Spaces</h2>
            <span className="text-[10px] text-gray-600">powered by SongJam</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={SONGJAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition-colors"
            >
              Open in new tab
            </a>
            <div className="md:hidden"><NotificationBell /></div>
            <Link href="/home" className="text-xs text-gray-500 hover:text-white md:hidden">Back</Link>
          </div>
        </div>
      </header>

      <div className="flex-1 relative pb-14 min-h-[400px]">
        <iframe
          src={SONGJAM_URL}
          title="SongJam — ZABAL Audio Spaces"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation allow-modals"
          allow="microphone; camera; clipboard-write; autoplay"
          loading="lazy"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page loads**

Run: `npm run dev` then navigate to `http://localhost:3000/spaces`
Expected: Full-page SongJam embed with header, iframe fills remaining viewport height. The iframe should load `songjam.space/zabal`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/spaces/page.tsx
git commit -m "feat: add dedicated /spaces route for SongJam audio spaces embed"
```

---

### Task 2: Add Spaces to navigation

**Files:**
- Modify: `src/components/navigation/BottomNav.tsx:59-70`

- [ ] **Step 1: Add Spaces to MORE_ITEMS and MORE_MATCH_PATHS**

In `src/components/navigation/BottomNav.tsx`, add Spaces as the second item in MORE_ITEMS (after Social, before Ecosystem):

Replace:
```tsx
const MORE_ITEMS = [
  { label: 'Social', href: '/social', icon: '👥' },
  { label: 'Ecosystem', href: '/ecosystem', icon: '🌐' },
  { label: 'Calls', href: '/calls', icon: '📞' },
  { label: 'WaveWarZ', href: '/wavewarz', icon: '⚔️' },
```

With:
```tsx
const MORE_ITEMS = [
  { label: 'Social', href: '/social', icon: '👥' },
  { label: 'Spaces', href: '/spaces', icon: '🎙️' },
  { label: 'Ecosystem', href: '/ecosystem', icon: '🌐' },
  { label: 'Calls', href: '/calls', icon: '📞' },
  { label: 'WaveWarZ', href: '/wavewarz', icon: '⚔️' },
```

> **Note:** Desktop nav shows `MORE_ITEMS.slice(0, 4)` inline. After this change, the desktop inline items become: Social, Spaces, Ecosystem, Calls. WaveWarZ moves to the overflow dropdown. This is intentional — Spaces is higher priority than WaveWarZ.

Then update MORE_MATCH_PATHS on line 70:

Replace:
```tsx
const MORE_MATCH_PATHS = ['/ecosystem', '/tools', '/contribute', '/settings', '/social', '/wavewarz', '/directory', '/calls'];
```

With:
```tsx
const MORE_MATCH_PATHS = ['/ecosystem', '/tools', '/contribute', '/settings', '/social', '/spaces', '/wavewarz', '/directory', '/calls'];
```

- [ ] **Step 2: Verify navigation works**

Run: `npm run dev`, open mobile view, tap "More" in bottom nav.
Expected: "Spaces" appears with microphone emoji between Social and Ecosystem. Tapping it navigates to `/spaces` and loads the SongJam iframe.

On desktop: Spaces should appear in the top nav secondary items (first 4 of MORE_ITEMS are shown inline — Social, Spaces, Ecosystem, Calls).

- [ ] **Step 3: Commit**

```bash
git add src/components/navigation/BottomNav.tsx
git commit -m "feat: add Spaces to bottom nav and desktop nav"
```

---

### Task 3: Fix iframe permissions in EcosystemPanel

**Files:**
- Modify: `src/components/ecosystem/EcosystemPanel.tsx:120-122`

The existing iframe for ALL partners is missing microphone/camera permissions. Fix it and also make SongJam link to the new `/spaces` route instead of embedding inline.

- [ ] **Step 1: Update EMBED_URLS to make SongJam internal**

In `src/components/ecosystem/EcosystemPanel.tsx`, change SongJam's URL to internal route:

Replace:
```tsx
const EMBED_URLS: Record<string, string> = {
  'SongJam': 'https://songjam.space/zabal',
```

With:
```tsx
const EMBED_URLS: Record<string, string> = {
  'SongJam': '/spaces',
```

This makes SongJam render as an internal `<Link>` (the component already handles internal URLs with `startsWith('/')` on line 53), navigating directly to the new full-page Spaces route instead of embedding a tiny iframe in the accordion.

- [ ] **Step 2: Fix iframe permissions for remaining external embeds**

On lines 120-122, fix the `sandbox` and `allow` attributes for the iframe that serves other partners:

Replace:
```tsx
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                    loading="lazy"
                    allow="clipboard-write"
```

With:
```tsx
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation allow-modals"
                    loading="lazy"
                    allow="clipboard-write; microphone; camera; autoplay"
```

- [ ] **Step 3: Verify EcosystemPanel changes**

Run: `npm run dev`, navigate to Ecosystem (via sidebar/panel).
Expected:
- SongJam card now shows an arrow icon (internal link) and navigates to `/spaces` when tapped
- Other partner iframes still work when expanded
- No console errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ecosystem/EcosystemPanel.tsx
git commit -m "fix: SongJam links to /spaces route, fix iframe permissions for audio"
```

---

### Task 4: Update Ecosystem page to link SongJam to /spaces

**Files:**
- Modify: `src/app/(auth)/ecosystem/page.tsx:17-18`

- [ ] **Step 1: Update ZABAL_URLS for SongJam**

Replace:
```tsx
const ZABAL_URLS: Record<string, string> = {
  'SongJam': 'https://songjam.space/zabal',
```

With:
```tsx
const ZABAL_URLS: Record<string, string> = {
  'SongJam': '/spaces',
```

The ecosystem page already handles internal URLs with `startsWith('/')` on line 49, rendering a `<Link>` with an internal arrow icon.

- [ ] **Step 2: Verify ecosystem page**

Run: `npm run dev`, navigate to `/ecosystem`.
Expected: SongJam card shows internal arrow icon and navigates to `/spaces`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/ecosystem/page.tsx
git commit -m "fix: ecosystem page SongJam card links to /spaces route"
```

---

### Task 5: Update community.config.ts SongJam description

**Files:**
- Modify: `community.config.ts:79-82`

- [ ] **Step 1: Update SongJam partner description**

Replace:
```tsx
    {
      name: 'SongJam',
      description: 'Mention leaderboard — track who talks about ZABAL across Farcaster.',
      url: 'https://songjam.space/zabal',
      icon: 'music',
    },
```

With:
```tsx
    {
      name: 'SongJam',
      description: 'Live audio spaces & ZABAL mention leaderboard — host rooms, earn points.',
      url: 'https://songjam.space/zabal',
      icon: 'music',
    },
```

Keep the external `url` as the canonical reference (used as fallback and for "Open in new tab" links). The EMBED_URLS / ZABAL_URLS overrides in the components now route to `/spaces`.

- [ ] **Step 2: Verify description shows in both ecosystem surfaces**

Run: `npm run dev`, check:
1. EcosystemPanel (sidebar) — SongJam card shows updated description
2. `/ecosystem` page — SongJam card shows updated description

- [ ] **Step 3: Commit**

```bash
git add community.config.ts
git commit -m "docs: update SongJam description to mention audio spaces"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full flow test**

Test the complete flow on mobile viewport (375px wide):
1. Tap "More" in bottom nav → see "Spaces" with microphone emoji
2. Tap "Spaces" → full-page SongJam iframe loads, header shows "Spaces — powered by SongJam"
3. Navigate to another page → come back to Spaces → iframe reloads (expected, iframes don't persist)
4. Go to Ecosystem (from More menu) → SongJam card is an internal link → tapping navigates to `/spaces`
5. "Open in new tab" link in Spaces header → opens `songjam.space/zabal` in new browser tab

- [ ] **Step 2: Desktop flow test**

Test on desktop (1280px+ wide):
1. Top nav shows "Spaces" as one of the secondary items
2. Clicking navigates to `/spaces` with full-page iframe
3. Ecosystem panel in sidebar → SongJam card links to `/spaces`

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds with no type errors.

---

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| SongJam access | Buried in Ecosystem accordion, tiny iframe | Dedicated `/spaces` route, full-page iframe |
| Audio permissions | `allow="clipboard-write"` (broken) | `allow="microphone; camera; clipboard-write; autoplay"` |
| Navigation | Not in nav | In "More" menu (mobile) + secondary nav (desktop) |
| Ecosystem cards | SongJam opens external or inline iframe | SongJam navigates to `/spaces` |
| Description | "Mention leaderboard" only | "Live audio spaces & ZABAL mention leaderboard" |
