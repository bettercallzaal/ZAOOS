# FISHBOWLZ Testing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 4 independent pushes that make FISHBOWLZ ready for real user testing: quick UX wins, error handling, app-wide issue reporter, and share modal.

**Architecture:** Each push is a separate commit targeting different files. Push 1 modifies the room detail page for hand raise numbers, token gate errors, and room-ended interstitial. Push 2 adds browser guidance and better error states. Push 3 creates a new IssueReporter component + API route. Push 4 creates a ShareModal component with Web Share API, Farcaster, X, and QR code.

**Tech Stack:** Next.js App Router, Supabase, Tailwind CSS v4, `qrcode.react`, `@octokit/rest`

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/app/fishbowlz/[id]/page.tsx` | Modify | Hand raise numbers, token gate error alert, room-ended interstitial, browser guidance banner, share modal integration |
| `src/components/spaces/HMSFishbowlRoom.tsx` | Modify | Better HMS error messages |
| `src/components/feedback/IssueReporter.tsx` | Create | App-wide floating feedback/bug report component |
| `src/app/api/feedback/route.ts` | Create | GitHub issue creation via Octokit |
| `src/app/(auth)/layout.tsx` | Modify | Mount IssueReporter |
| `src/components/shared/ShareModal.tsx` | Create | Reusable share modal with 5 share options |

---

### Task 1: Push 1a — Hand Raise Queue Numbers

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx:674-709`

- [ ] **Step 1: Add queue position to host's hand raise list**

In the hand raise queue section (line 674), replace the current `room.hand_raises.map` block. The hand raises are already sorted chronologically by insertion order (joinedAt is set on raise). Add position numbers and wait time:

```tsx
{/* Hand raise queue — host only */}
{isHost && room.hand_raises && room.hand_raises.length > 0 && (
  <div className="mt-4 p-3 bg-[#1a2a4a] rounded-xl border border-[#f5a623]/20">
    <h4 className="text-xs font-semibold text-[#f5a623] uppercase tracking-wider mb-2">
      ✋ Hand Raises ({room.hand_raises.length})
    </h4>
    <div className="space-y-2">
      {room.hand_raises.map((r, index) => (
        <div key={r.fid} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#f5a623] bg-[#f5a623]/10 w-6 h-6 rounded-full flex items-center justify-center">
              {index + 1}
            </span>
            <span className="text-sm text-white">@{r.username}</span>
            <span className="text-[10px] text-gray-500">{timeAgo(r.joinedAt)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'approve_hand', targetFid: r.fid }),
                });
                if (res.ok) {
                  toast(`@${r.username} approved to hot seat`, 'success');
                  await fetchRoom();
                } else {
                  const err = await res.json().catch(() => ({}));
                  toast(err.error || 'Failed to approve', 'error');
                }
              }}
              className="text-xs px-2 py-1 bg-[#f5a623]/15 text-[#ffd700] rounded hover:bg-[#f5a623]/25 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Show listener their queue position**

After the hand raise toggle button (around line 634), add a position indicator. Find the `{room.hand_raises?.some((r) => r.fid === user?.fid) ? '✋ Hand Raised' : '✋ Raise Hand'}` button and add this right after the closing `</button>`:

```tsx
{room.hand_raises?.some((r) => r.fid === user?.fid) && (
  <span className="text-xs text-[#f5a623]">
    You&apos;re #{(room.hand_raises?.findIndex((r) => r.fid === user?.fid) ?? 0) + 1} in queue
  </span>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

---

### Task 2: Push 1b — Token Gate Error Messaging

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx`

- [ ] **Step 1: Add gateError state**

After the existing state declarations (around line 132, after `const [copied, setCopied] = useState(false);`), add:

```tsx
const [gateError, setGateError] = useState<{ message: string; details?: string } | null>(null);
```

- [ ] **Step 2: Update joinAsSpeaker to parse gate errors**

Replace the `joinAsSpeaker` function (lines 292-311) with:

```tsx
const joinAsSpeaker = async () => {
  if (!user || joining) return;
  setJoining(true);
  setGateError(null);
  try {
    const res = await fetch(`/api/fishbowlz/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join_speaker', fid: user.fid, username: user.username }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 403 && errData.reason) {
        // Gating error — show inline persistent alert
        const score = errData.score ? ` Your score: ${errData.score}.` : '';
        setGateError({
          message: errData.error || 'You don\'t meet the requirements to join.',
          details: errData.reason + score,
        });
      } else {
        toast(errData.error || 'Failed to join', 'error');
      }
      return;
    }
    await fetchRoom();
    setAudioJoined(true);
  } finally {
    setJoining(false);
  }
};
```

- [ ] **Step 3: Render inline gate error alert**

Add this right before the join controls section (before line 580, the `{/* Join Controls */}` comment):

```tsx
{gateError && (
  <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm text-red-400 font-medium">{gateError.message}</p>
        {gateError.details && (
          <p className="text-xs text-red-400/70 mt-1">{gateError.details}</p>
        )}
      </div>
      <button
        onClick={() => setGateError(null)}
        className="text-red-400/50 hover:text-red-400 text-xs shrink-0"
      >
        ✕
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

---

### Task 3: Push 1c — Room Ended Interstitial

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx`

- [ ] **Step 1: Add ended overlay state**

After the `gateError` state, add:

```tsx
const [showEndedOverlay, setShowEndedOverlay] = useState(false);
const [endedCountdown, setEndedCountdown] = useState(5);
const endedRoomRef = useRef<FishbowlRoom | null>(null);
```

Also add `useRef` to the existing import from `react` if not already there (it already is — line 3).

- [ ] **Step 2: Replace the instant redirect in fetchRoom**

Replace the room-ended detection block (lines 150-166) with:

```tsx
if (data.state === 'ended') {
  setAudioJoined(false);
  setRoom((prev) => {
    if (prev && prev.state === 'active') {
      const wasParticipating =
        prev.current_speakers?.some((s) => s.fid === user?.fid) ||
        prev.current_listeners?.some((l) => l.fid === user?.fid);
      if (wasParticipating) {
        endedRoomRef.current = data;
        setShowEndedOverlay(true);
      }
    }
    return data;
  });
  return;
}
```

- [ ] **Step 3: Add countdown effect**

Add this useEffect after the auto-scroll transcript effect (after line 267):

```tsx
// Countdown for ended room interstitial
useEffect(() => {
  if (!showEndedOverlay) return;
  if (endedCountdown <= 0) {
    router.push('/fishbowlz');
    return;
  }
  const timer = setTimeout(() => setEndedCountdown((c) => c - 1), 1000);
  return () => clearTimeout(timer);
}, [showEndedOverlay, endedCountdown, router]);
```

- [ ] **Step 4: Add the ended overlay UI**

Add this right before the closing `showEndConfirm` modal (before line 820):

```tsx
{showEndedOverlay && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-[#1a2a4a] rounded-xl p-6 w-full max-w-sm border border-white/10 text-center">
      <div className="text-4xl mb-3">🐟</div>
      <h2 className="text-lg font-bold mb-1">This fishbowl has ended</h2>
      <p className="text-sm text-gray-400 mb-1">
        {endedRoomRef.current?.title || room?.title}
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Hosted by @{endedRoomRef.current?.host_username || room?.host_username}
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/fishbowlz')}
          className="w-full bg-[#f5a623] text-[#0a1628] font-semibold py-2.5 rounded-lg hover:bg-[#d4941f] transition-colors"
        >
          Back to Rooms
        </button>
        {transcripts.length > 0 && (
          <button
            onClick={() => {
              setShowEndedOverlay(false);
              setEndedCountdown(0);
            }}
            className="w-full border border-white/20 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            View Transcript
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-3">Redirecting in {endedCountdown}...</p>
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify and commit Push 1**

```bash
npx tsc --noEmit && npx eslint "src/app/fishbowlz/[id]/page.tsx" --quiet
```

Expected: 0 errors

```bash
git add "src/app/fishbowlz/[id]/page.tsx"
git commit -m "feat: FISHBOWLZ push 1 — hand raise queue numbers, token gate errors, room ended interstitial"
```

---

### Task 4: Push 2a — Browser/Mic Guidance Banner

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx`

- [ ] **Step 1: Add guidance state and detection logic**

After the existing state declarations, add:

```tsx
const [guidanceDismissed, setGuidanceDismissed] = useState(false);

const isChrome = typeof navigator !== 'undefined' && /Chrome/.test(navigator.userAgent) && !/Edge|OPR/.test(navigator.userAgent);
const showGuidance = !guidanceDismissed && !isSpeaker && !isListener && room?.state === 'active';
const guidanceMessage = !isChrome
  ? 'Live transcription works best in Chrome. Audio works in all browsers.'
  : 'Allow microphone access when prompted to join as a speaker.';
```

Check localStorage on mount — add this useEffect:

```tsx
useEffect(() => {
  if (typeof window !== 'undefined' && localStorage.getItem('fishbowlz-guidance-dismissed')) {
    setGuidanceDismissed(true);
  }
}, []);
```

- [ ] **Step 2: Render the banner**

Add this right after the header div's closing tag (after line 432, before the `flex-1 flex flex-col lg:flex-row` div):

```tsx
{showGuidance && (
  <div className="bg-[#f5a623]/10 border-b border-[#f5a623]/20 px-4 py-2 flex items-center justify-between gap-2">
    <p className="text-xs text-[#f5a623]">💡 {guidanceMessage}</p>
    <button
      onClick={() => {
        setGuidanceDismissed(true);
        localStorage.setItem('fishbowlz-guidance-dismissed', '1');
      }}
      className="text-[#f5a623]/50 hover:text-[#f5a623] text-xs shrink-0"
    >
      ✕
    </button>
  </div>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

---

### Task 5: Push 2b — Better HMS Error Messages

**Files:**
- Modify: `src/components/spaces/HMSFishbowlRoom.tsx:193-204`

- [ ] **Step 1: Improve the error UI**

Replace the error block (lines 193-204) with:

```tsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 px-4">
      <p className="text-red-400 text-sm text-center">{error}</p>
      <p className="text-gray-500 text-xs text-center max-w-xs">
        Check that your browser has microphone permission enabled. If the problem persists, try refreshing the page.
      </p>
      <button
        onClick={retryJoin}
        className="px-4 py-1.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-xs font-medium hover:bg-[#d4941f] transition-colors"
      >
        Retry Connection
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit Push 2**

```bash
npx tsc --noEmit && npx eslint "src/app/fishbowlz/[id]/page.tsx" src/components/spaces/HMSFishbowlRoom.tsx --quiet
```

Expected: 0 errors

```bash
git add "src/app/fishbowlz/[id]/page.tsx" src/components/spaces/HMSFishbowlRoom.tsx
git commit -m "feat: FISHBOWLZ push 2 — browser/mic guidance banner + better HMS error messages"
```

---

### Task 6: Push 3a — Issue Reporter API Route

**Files:**
- Create: `src/app/api/feedback/route.ts`

- [ ] **Step 1: Install octokit**

```bash
npm install @octokit/rest
```

- [ ] **Step 2: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'feedback']),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  page: z.string().max(200),
  browser: z.string().max(200).optional(),
  screenshot: z.string().max(5_000_000).optional(), // ~3.5MB base64
});

const LABEL_MAP: Record<string, string> = {
  bug: 'bug',
  feature: 'enhancement',
  feedback: 'feedback',
};

// Simple in-memory rate limit (per FID, 1 per 5 min)
const rateLimitMap = new Map<number, number>();

function getPageLabel(path: string): string {
  const segment = path.split('/').filter(Boolean)[0] || 'general';
  const known = ['fishbowlz', 'music', 'spaces', 'governance', 'social', 'chat', 'messages', 'settings', 'members'];
  return known.includes(segment) ? segment : 'general';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const lastSubmit = rateLimitMap.get(session.fid);
    if (lastSubmit && Date.now() - lastSubmit < 5 * 60 * 1000) {
      const waitSec = Math.ceil((5 * 60 * 1000 - (Date.now() - lastSubmit)) / 1000);
      return NextResponse.json({ error: `Please wait ${waitSec}s before submitting again` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { type, title, description, page, browser, screenshot } = parsed.data;

    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_FEEDBACK_REPO || 'zaalpanthaki/zao-os';
    if (!githubToken) {
      console.error('GITHUB_TOKEN not configured');
      return NextResponse.json({ error: 'Feedback system not configured' }, { status: 503 });
    }

    const [owner, repoName] = repo.split('/');
    const octokit = new Octokit({ auth: githubToken });

    const pageLabel = getPageLabel(page);
    const contextBlock = [
      '---',
      `**Page:** \`${page}\``,
      `**Browser:** ${browser || 'Unknown'}`,
      `**User:** @${session.username || 'fid:' + session.fid}`,
      `**Timestamp:** ${new Date().toISOString()}`,
      '---',
    ].join('\n');

    let issueBody = `${description}\n\n${contextBlock}`;

    if (screenshot) {
      issueBody += `\n\n**Screenshot:**\n![screenshot](${screenshot})`;
    }

    issueBody += '\n\n*Submitted via ZAO OS in-app feedback*';

    const labels = ['feedback', LABEL_MAP[type], pageLabel].filter(Boolean);

    const { data: issue } = await octokit.issues.create({
      owner,
      repo: repoName,
      title: `[${type.charAt(0).toUpperCase() + type.slice(1)}] ${title}`,
      body: issueBody,
      labels,
    });

    rateLimitMap.set(session.fid, Date.now());

    return NextResponse.json({ success: true, issueUrl: issue.html_url, issueNumber: issue.number });
  } catch (err) {
    console.error('Feedback submission error:', err);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

---

### Task 7: Push 3b — Issue Reporter Component

**Files:**
- Create: `src/components/feedback/IssueReporter.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type FeedbackType = 'bug' | 'feature' | 'feedback';

export function IssueReporter() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't render for unauthenticated users or on landing page
  if (!user || pathname === '/') return null;

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setResult({ success: false, message: 'Image must be under 3MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const browser = `${navigator.userAgent.slice(0, 150)}`;
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          page: pathname,
          browser,
          screenshot: screenshot || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Submitted! (#${data.issueNumber})` });
        setTitle('');
        setDescription('');
        setScreenshot(null);
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'Failed to submit' });
      }
    } catch {
      setResult({ success: false, message: 'Network error. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setIsOpen(false);
    setResult(null);
    setTitle('');
    setDescription('');
    setScreenshot(null);
    setType('bug');
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 bg-[#1a2a4a] border border-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-all text-xs flex items-center gap-1.5 md:bottom-6"
      >
        <span>🐛</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#1a2a4a] rounded-t-xl sm:rounded-xl p-5 w-full sm:max-w-md border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Report an Issue</h2>
              <button onClick={reset} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              {(['bug', 'feature', 'feedback'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    type === t
                      ? 'bg-[#f5a623] text-[#0a1628]'
                      : 'bg-[#0a1628] border border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'bug' ? '🐛 Bug' : t === 'feature' ? '💡 Feature' : '💬 Feedback'}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Short title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] text-sm min-h-[44px]"
              maxLength={200}
            />

            {/* Description */}
            <textarea
              placeholder="What happened? What did you expect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] resize-none text-sm"
              rows={4}
              maxLength={2000}
            />

            {/* Context chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                📍 {pathname}
              </span>
              <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                👤 @{user.username}
              </span>
            </div>

            {/* Screenshot */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshot}
                className="hidden"
              />
              {screenshot ? (
                <div className="relative">
                  <img src={screenshot} alt="Screenshot" className="w-full h-32 object-cover rounded-lg border border-white/10" />
                  <button
                    onClick={() => setScreenshot(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-white/20 rounded-lg py-3 text-xs text-gray-500 hover:text-gray-400 hover:border-white/30 transition-colors"
                >
                  📷 Attach screenshot (optional)
                </button>
              )}
            </div>

            {/* Result message */}
            {result && (
              <div className={`text-xs mb-3 px-3 py-2 rounded-lg ${result.success ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                {result.message}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !description.trim()}
              className="w-full bg-[#f5a623] text-[#0a1628] font-semibold py-3 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>

            <p className="text-[10px] text-gray-600 text-center mt-2">
              1 report per 5 minutes
            </p>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Mount in auth layout**

In `src/app/(auth)/layout.tsx`, add the import and render it:

Add import:
```typescript
import { IssueReporter } from '@/components/feedback/IssueReporter';
```

Add `<IssueReporter />` right after `<PWAInstallPrompt />` (before the closing `</div>`):
```tsx
<PWAInstallPrompt />
<IssueReporter />
```

- [ ] **Step 3: Verify and commit Push 3**

```bash
npx tsc --noEmit && npx eslint src/app/api/feedback/route.ts src/components/feedback/IssueReporter.tsx "src/app/(auth)/layout.tsx" --quiet
```

Expected: 0 errors

```bash
git add src/app/api/feedback/route.ts src/components/feedback/IssueReporter.tsx "src/app/(auth)/layout.tsx"
git commit -m "feat: app-wide issue reporter — floating feedback button + GitHub issue creation"
```

---

### Task 8: Push 4a — Share Modal Component

**Files:**
- Create: `src/components/shared/ShareModal.tsx`

- [ ] **Step 1: Install qrcode.react**

```bash
npm install qrcode.react
```

- [ ] **Step 2: Create the ShareModal component**

```tsx
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  url: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ url, title, description, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToFarcaster = () => {
    const text = encodeURIComponent(title);
    const embed = encodeURIComponent(url);
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${embed}`, '_blank');
  };

  const shareToX = () => {
    const text = encodeURIComponent(`${title}`);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: description || title, url });
    } catch {
      // User cancelled or not supported — ignore
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#1a2a4a] rounded-t-xl sm:rounded-xl p-5 w-full sm:max-w-sm border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Share</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Native share — mobile primary */}
        {canNativeShare && (
          <button
            onClick={nativeShare}
            className="w-full bg-[#f5a623] text-[#0a1628] font-semibold py-3 rounded-lg hover:bg-[#d4941f] transition-colors mb-3 min-h-[44px]"
          >
            📤 Share...
          </button>
        )}

        {/* Share options grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={shareToFarcaster}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>🟣</span>
            <span>Farcaster</span>
          </button>

          <button
            onClick={shareToX}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>𝕏</span>
            <span>Post to X</span>
          </button>

          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 bg-[#0a1628] border border-white/10 rounded-lg px-4 py-3 text-sm hover:bg-white/5 transition-colors min-h-[44px]"
          >
            <span>📱</span>
            <span>QR Code</span>
          </button>
        </div>

        {/* QR Code — shown on toggle */}
        {showQR && (
          <div className="mt-3 flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={url} size={180} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors

---

### Task 9: Push 4b — Integrate Share Modal in Room Page

**Files:**
- Modify: `src/app/fishbowlz/[id]/page.tsx`

- [ ] **Step 1: Import ShareModal and add state**

Add import at the top of the file:

```typescript
import { ShareModal } from '@/components/shared/ShareModal';
```

After the existing state declarations, add:

```tsx
const [showShare, setShowShare] = useState(false);
```

- [ ] **Step 2: Replace share button with modal trigger**

Replace the current share button (lines 398-404):

```tsx
<button
  onClick={copyShareLink}
  className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
  title="Copy room link"
>
  {copied ? '✓ Copied' : '🔗 Share'}
</button>
```

With:

```tsx
<button
  onClick={() => setShowShare(true)}
  className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
  title="Share room"
>
  🔗 Share
</button>
```

- [ ] **Step 3: Render ShareModal**

Add this right before the `showEndedOverlay` modal (before the ended overlay block):

```tsx
{room && (
  <ShareModal
    url={typeof window !== 'undefined' ? `${window.location.origin}/fishbowlz/${room.slug || roomId}` : ''}
    title={`Join "${room.title}" on FISHBOWLZ`}
    description={room.description || `A live fishbowl hosted by @${room.host_username}`}
    isOpen={showShare}
    onClose={() => setShowShare(false)}
  />
)}
```

- [ ] **Step 4: Remove unused copyShareLink function and copied state**

Delete the `copyShareLink` function (lines 269-276) and the `copied` state declaration (`const [copied, setCopied] = useState(false);` at line 132).

- [ ] **Step 5: Verify, build, and commit Push 4**

```bash
npx tsc --noEmit && npx eslint "src/app/fishbowlz/[id]/page.tsx" src/components/shared/ShareModal.tsx --quiet && npm run build
```

Expected: 0 errors, build succeeds

```bash
git add "src/app/fishbowlz/[id]/page.tsx" src/components/shared/ShareModal.tsx package.json package-lock.json
git commit -m "feat: FISHBOWLZ share modal — Farcaster, X, QR code, native share + copy link"
```

---

### Task 10: Final Verification + Push

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 2: Push all commits**

```bash
git push
```
