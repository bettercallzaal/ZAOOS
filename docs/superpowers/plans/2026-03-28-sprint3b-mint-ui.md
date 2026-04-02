# Sprint 3B: Mint UI Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3-screen mint wizard for ZAO artists to upload MP3 + cover art, choose license/price, and mint to Arweave — all in-app

**Architecture:** Client-side wizard component with 3 steps (Upload → License/Price → Confirm & Mint). Submits FormData to existing `POST /api/music/mint` route. No Arweave wallet needed from artists (server-side upload via app wallet).

**Tech Stack:** React 19, next/dynamic, FormData API, existing mint route

---

## Task 1: LicensePicker Component

**Files:**
- Create: `src/components/music/LicensePicker.tsx`

A radio-button selector for the 4 UDL license presets. Each option shows a brief human-readable description.

- [ ] **Step 1: Create the component**

```typescript
// src/components/music/LicensePicker.tsx
'use client';

interface LicensePickerProps {
  value: string;
  onChange: (preset: string) => void;
}

const PRESETS = [
  {
    id: 'collectible',
    name: 'Collectible',
    desc: 'Free to listen, buy to own. 25% royalty on remixes.',
    badge: 'Recommended',
  },
  {
    id: 'community',
    name: 'Community Share',
    desc: 'Free with credit. Others can remix with attribution.',
    badge: null,
  },
  {
    id: 'premium',
    name: 'Premium',
    desc: 'Pay to access. No remixing or commercial use.',
    badge: null,
  },
  {
    id: 'open',
    name: 'Open',
    desc: 'Full creative commons. Anyone can use freely.',
    badge: null,
  },
] as const;

export default function LicensePicker({ value, onChange }: LicensePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">How should people use your music?</p>
      {PRESETS.map(preset => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
            value === preset.id
              ? 'bg-[#f5a623]/10 border-[#f5a623]/40 text-white'
              : 'bg-[#0a1628] border-gray-800 text-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
              value === preset.id ? 'border-[#f5a623] bg-[#f5a623]' : 'border-gray-600'
            }`} />
            <span className="text-sm font-medium">{preset.name}</span>
            {preset.badge && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623]">{preset.badge}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 ml-5">{preset.desc}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/music/LicensePicker.tsx
git commit -m "feat: add UDL license preset picker component"
```

---

## Task 2: MintSuccess Component

**Files:**
- Create: `src/components/music/MintSuccess.tsx`

Post-mint success screen with share links.

- [ ] **Step 1: Create the component**

```typescript
// src/components/music/MintSuccess.tsx
'use client';

interface MintSuccessProps {
  title: string;
  artist: string;
  txId: string;
  coverUrl: string | null;
  bazarUrl: string;
  onClose: () => void;
}

export default function MintSuccess({ title, artist, txId, coverUrl, bazarUrl, onClose }: MintSuccessProps) {
  const arweaveUrl = `https://arweave.net/${txId}`;

  return (
    <div className="text-center py-6">
      {/* Cover art */}
      {coverUrl && (
        <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden mb-4 ring-2 ring-[#f5a623]/40">
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <p className="text-lg font-bold text-green-400 mb-1">Minted to the Permaweb</p>
      <p className="text-sm text-white">{title}</p>
      <p className="text-xs text-gray-500 mb-1">by {artist}</p>
      <p className="text-[10px] text-gray-600 font-mono mb-6">ar://{txId.slice(0, 12)}...{txId.slice(-6)}</p>

      <div className="space-y-2 max-w-xs mx-auto">
        <a
          href={bazarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium hover:bg-[#f5a623]/90 transition-colors text-center"
        >
          View on BazAR
        </a>
        <a
          href={arweaveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm hover:bg-white/5 transition-colors text-center"
        >
          View on Arweave
        </a>
        <button
          onClick={onClose}
          className="block w-full px-4 py-2.5 rounded-lg text-gray-500 text-sm hover:text-white transition-colors text-center"
        >
          Done
        </button>
      </div>

      <p className="text-[9px] text-gray-600 mt-6">
        Stored permanently on Arweave — 200+ years guaranteed
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/music/MintSuccess.tsx
git commit -m "feat: add mint success screen with share links"
```

---

## Task 3: MintTrack 3-Screen Wizard

**Files:**
- Create: `src/components/music/MintTrack.tsx`

The main wizard. 3 steps:
1. Upload (audio file + cover art + title/artist/genre/description)
2. License & Price (LicensePicker + price options + edition size)
3. Confirm & Mint (preview + submit to /api/music/mint)

- [ ] **Step 1: Create the wizard component**

Key implementation details:
- State: `step` (1/2/3), `audioFile`, `coverFile`, `metadata` object, `minting`, `result`
- Step 1: file drag/drop inputs, title/artist/genre/description fields
- Step 2: LicensePicker component, price radio buttons (Free / 1 $U / 5 $U / Custom)
- Step 3: Preview card with all info, "Mint & List" button
- On submit: build FormData with audio + cover + JSON metadata, POST to `/api/music/mint`
- On success: show MintSuccess component
- Progress indicator: step dots at top
- Back/Next navigation buttons

The component should be a modal (same pattern as ZounzCreateProposal):
```typescript
interface MintTrackProps {
  isOpen: boolean;
  onClose: () => void;
}
```

Use the existing genre tags from SongSubmit: `['Hip-Hop', 'R&B', 'Electronic', 'Lo-Fi', 'Jazz', 'Afrobeats', 'Soul', 'Experimental']`

File inputs should accept:
- Audio: `.mp3,.mp4,.wav,.flac,.ogg,.aac` (max 50MB)
- Cover: `.jpg,.jpeg,.png,.webp,.gif` (max 5MB)

Style: ZAO dark theme (`#0a1628` bg, `#0d1b2a` card, `#f5a623` gold primary)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep error | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/components/music/MintTrack.tsx
git commit -m "feat: add 3-screen mint wizard for Arweave music upload"
```

---

## Task 4: Add Mint Entry Point to Music Page

**Files:**
- Modify: `src/app/(auth)/music/page.tsx` or the music sidebar/nav

Find where the music page or sidebar is and add a "Mint Track" button that opens the MintTrack modal. Use `next/dynamic` to lazy-load it.

- [ ] **Step 1: Find the music page/sidebar**

Search for the music page entry point. Look for files like:
- `src/app/(auth)/music/page.tsx`
- `src/components/music/MusicSidebar.tsx`
- `src/components/navigation/` for nav items

- [ ] **Step 2: Add the mint button + modal**

```typescript
import dynamic from 'next/dynamic';
const MintTrack = dynamic(() => import('@/components/music/MintTrack'), { ssr: false });

// Add state:
const [showMint, setShowMint] = useState(false);

// Add button in appropriate location:
<button
  onClick={() => setShowMint(true)}
  className="px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium hover:bg-[#f5a623]/90 transition-colors"
>
  Mint Track
</button>

// Add modal:
{showMint && <MintTrack isOpen={showMint} onClose={() => setShowMint(false)} />}
```

- [ ] **Step 3: Commit**

```bash
git add [modified file] && git commit -m "feat: add Mint Track button to music page"
```

---

## Summary

| Task | Feature | Files | Est. |
|------|---------|-------|------|
| 1 | LicensePicker | 1 new component | 5 min |
| 2 | MintSuccess | 1 new component | 5 min |
| 3 | MintTrack wizard | 1 new component | 20 min |
| 4 | Entry point | 1 edit | 10 min |

**Total: 3 new files, 1 edit, ~40 minutes**
