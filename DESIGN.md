# ZAO OS Design System

> Dark-mode-native music community platform. Navy canvas, gold accent, content-first darkness where album art and member activity provide the color.

## Design Philosophy

ZAO OS follows **"content-first darkness"** — a near-black canvas where the UI recedes and user content (album art, member profiles, governance activity) becomes the visual focus. Borrowed from Spotify's theater-like approach and Linear's precision engineering, adapted for a gated music community.

**Core principles:**
1. **Dark native** — dark mode is the only mode, not an afterthought
2. **Gold means action** — the gold accent (#f5a623) appears only on interactive elements and active states
3. **Content provides color** — album art, profile images, and status indicators are the color palette
4. **Mobile first** — every component designed for thumb-reach on a phone, enhanced for desktop
5. **Dense but breathable** — compact information density with generous line-height and card padding

---

## Color Palette

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-navy` | `#0a1628` | Page background, deepest canvas |
| `--color-navy-light` | `#0d1b2a` | Card backgrounds, panels, sidebar |
| `--color-navy-lighter` | `#1a2a3a` | Elevated surfaces, modals, popovers, hover states |
| `--color-gold` | `#f5a623` | Primary accent — buttons, links, active tabs, highlights |
| `--color-gold-light` | `#ffd700` | Hover state for gold elements, active emphasis |

### Text Hierarchy

| Role | Color | Opacity | Usage |
|------|-------|---------|-------|
| Primary | `#ededed` | 100% | Headings, body text, labels |
| Secondary | `#a0aec0` | — | Descriptions, timestamps, helper text |
| Tertiary | `#64748b` | — | Placeholders, disabled states, metadata |
| Accent | `#f5a623` | 100% | Links, active navigation, interactive labels |
| On-gold | `#0a1628` | 100% | Text on gold backgrounds (buttons) |

### Semantic Colors

| Role | Color | Usage |
|------|-------|-------|
| Success | `#10b981` | Connected, approved, minted, synced |
| Warning | `#f59e0b` | Pending, expiring, needs attention |
| Error | `#ef4444` | Failed, rejected, disconnected |
| Info | `#3b82f6` | Informational badges, Farcaster blue |
| Respect | `#f5a623` | Respect score displays — same as gold (earned = gold) |

### Surface Elevation (Luminance Stepping)

Depth is communicated through background lightness, not shadows. Deeper = darker.

```
Layer 0 (page):     #0a1628  ← deepest
Layer 1 (card):     #0d1b2a
Layer 2 (elevated): #1a2a3a
Layer 3 (modal):    #1e3148  ← lightest
Border default:     rgba(255, 255, 255, 0.08)
Border hover:       rgba(255, 255, 255, 0.15)
Border active:      rgba(245, 166, 35, 0.3)  ← gold tint
```

---

## Typography

### Font Stack

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Inter is used everywhere. No serif fonts. No decorative fonts. The music and art provide the personality.

### Type Scale

| Level | Size | Weight | Letter-spacing | Line-height | Usage |
|-------|------|--------|----------------|-------------|-------|
| Display | 32px | 700 | -0.5px | 1.1 | Page titles ("Music", "Governance") |
| H1 | 24px | 600 | -0.3px | 1.2 | Section headers, room names |
| H2 | 20px | 600 | -0.2px | 1.3 | Card titles, track names |
| H3 | 16px | 600 | 0 | 1.4 | Subsection headers |
| Body | 14px | 400 | 0 | 1.5 | Default text, descriptions |
| Small | 13px | 400 | 0 | 1.4 | Secondary info, timestamps |
| Caption | 11px | 500 | 0.3px | 1.3 | Labels, badges, metadata |
| Mono | 13px | 400 | 0 | 1.5 | Addresses, hashes, code (font: monospace) |

### Typography Rules

- **Negative letter-spacing** on headings (Display, H1) — pulls type tighter for impact
- **Positive letter-spacing** on captions/labels — spreads tiny text for legibility
- **Weight 600** (semibold) is the default emphasis — not 700 bold (too heavy on dark backgrounds)
- **Never use font-weight 300** on dark backgrounds — too thin, accessibility issue
- **All-caps** only for badges and category labels, never for headings or body text

---

## Spacing System

Base unit: **4px**. All spacing is a multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Inline element gaps, icon padding |
| `space-2` | 8px | Between related items (label + value) |
| `space-3` | 12px | Between list items, compact card padding |
| `space-4` | 16px | Default card padding, section gaps |
| `space-5` | 20px | Between sections in a card |
| `space-6` | 24px | Between cards, major section breaks |
| `space-8` | 32px | Page section gaps |
| `space-10` | 40px | Major page divisions |
| `space-12` | 48px | Hero spacing, top-of-page breathing room |

### Card Padding

- **Compact card** (list items, queue entries): 12px
- **Standard card** (track card, proposal card): 16px
- **Feature card** (now playing, active room): 20px
- **Modal/dialog**: 24px

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 6px | Badges, small tags |
| `rounded-md` | 8px | Cards, inputs, buttons |
| `rounded-lg` | 12px | Modals, feature cards, images |
| `rounded-xl` | 16px | Large images, hero cards |
| `rounded-full` | 9999px | Pills, avatars, play button, FABs |

### Rules
- **Cards**: 8px radius (standard), 12px (featured/hero)
- **Buttons**: 8px (rectangular) or 9999px (pill — used for primary CTAs)
- **Avatars**: Always 9999px (circle)
- **Album art**: 8px radius (matches card radius, never circular)
- **Inputs**: 8px radius

---

## Shadows

Minimal shadow use. Dark themes communicate depth through background color, not shadows.

| Level | Shadow | Usage |
|-------|--------|-------|
| None | `none` | Default for most elements |
| Subtle | `0 1px 2px rgba(0,0,0,0.3)` | Slight lift for dropdown menus |
| Medium | `0 4px 12px rgba(0,0,0,0.4)` | Modals, popovers, floating player |
| Heavy | `0 8px 24px rgba(0,0,0,0.5)` | Overlay dialogs, full-screen modals |

**Gold glow** for primary CTAs on hover:
```css
box-shadow: 0 0 20px rgba(245, 166, 35, 0.15);
```

---

## Components

### Buttons

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `#f5a623` | `#0a1628` | none | Main CTA ("Submit", "Vote", "Play") |
| Primary hover | `#ffd700` | `#0a1628` | none | + gold glow shadow |
| Secondary | `transparent` | `#ededed` | `rgba(255,255,255,0.15)` | Alternative actions |
| Secondary hover | `rgba(255,255,255,0.05)` | `#ededed` | `rgba(255,255,255,0.25)` | |
| Ghost | `transparent` | `#a0aec0` | none | Tertiary actions, icon buttons |
| Danger | `#ef4444` | `#ffffff` | none | Destructive actions |
| Disabled | `rgba(255,255,255,0.05)` | `#64748b` | none | Inactive state |

**Button sizing:**
- Small: 32px height, 12px horizontal padding, 13px text
- Default: 40px height, 16px horizontal padding, 14px text
- Large: 48px height, 24px horizontal padding, 16px text

### Cards

```
Background: #0d1b2a (Layer 1)
Border: 1px solid rgba(255, 255, 255, 0.08)
Border-radius: 8px
Padding: 16px
Hover: border-color rgba(255, 255, 255, 0.15), background #0f1e30
Active/Selected: border-color rgba(245, 166, 35, 0.3)
```

**Track card specific:**
- Album art: 48px × 48px, 8px radius, left-aligned
- Track name: H3 (16px/600), single line, truncate with ellipsis
- Artist name: Small (13px/400), secondary color
- Duration: Caption (11px), right-aligned
- Play indicator: Gold dot or waveform animation

### Navigation

- **Mobile bottom nav**: 5 tabs, 56px height, gold active indicator
- **Desktop sidebar**: 240px width, navy-light background
- **Active state**: Gold text + gold left border (3px)
- **Inactive**: Secondary text color (#a0aec0)
- **Icons**: 20px, stroke-width 1.5, matching text color

### Inputs

```
Background: #0d1b2a
Border: 1px solid rgba(255, 255, 255, 0.15)
Border-radius: 8px
Padding: 10px 14px
Font: 14px Inter
Color: #ededed
Placeholder: #64748b
Focus: border-color #f5a623, box-shadow 0 0 0 2px rgba(245,166,35,0.15)
```

### Badges & Tags

```
Background: rgba(245, 166, 35, 0.15)  ← gold tint
Text: #f5a623
Border-radius: 6px
Padding: 2px 8px
Font: 11px / weight 500 / letter-spacing 0.3px
```

Status badge variants:
- **Active/Live**: green bg tint + green text
- **Pending**: amber bg tint + amber text
- **Closed/Ended**: gray bg tint + gray text
- **Respect score**: gold bg tint + gold text (always)

### Avatar

```
Size (small): 32px
Size (default): 40px
Size (large): 56px
Size (hero): 80px
Border-radius: 9999px (always circular)
Border: 2px solid rgba(255, 255, 255, 0.1)
Fallback: Gold gradient background with white initials
```

### Now Playing Bar (Mobile)

```
Position: fixed bottom, above nav
Height: 64px
Background: #0d1b2a with backdrop-blur(12px)
Border-top: 1px solid rgba(255, 255, 255, 0.08)
Album art: 44px, 6px radius
Track name: 14px/600 white, truncate
Artist: 12px/400 secondary
Progress: 2px gold bar at top edge
Controls: play/pause (gold), skip (secondary)
```

---

## Motion & Animation

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Hover transitions | 150ms | ease-out | Color, border, shadow changes |
| Page transitions | 200ms | ease-in-out | Route changes |
| Modals | 200ms | ease-out | Scale(0.95) → scale(1) + fade |
| Slide panels | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Drawer, expanded player |
| Loading pulse | 1.5s | ease-in-out | Skeleton shimmer |
| Playing indicator | 400ms | ease-in-out | Waveform bars animation |

**Rules:**
- Never animate longer than 300ms for UI responses
- Use `transform` and `opacity` only for 60fps animations
- Reduce motion when `prefers-reduced-motion: reduce` is set
- No bounce, no elastic — everything is clean and direct

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav, full-width cards |
| Tablet | 640–1024px | 2 columns, sidebar collapses |
| Desktop | > 1024px | 3 columns, persistent sidebar, expanded player |

**Mobile-first rules:**
- Bottom navigation (56px) on mobile, sidebar on desktop
- Now Playing bar always visible when music is playing
- Cards are full-width on mobile, grid on desktop
- Touch targets minimum 44px × 44px
- Swipe gestures for player controls, queue management

---

## Dark Theme Patterns

### Do

- Use background luminance (darker = deeper, lighter = elevated) for depth
- Apply gold accent sparingly — only interactive/active elements
- Let album art, profile images, and content provide visual variety
- Use `rgba(255,255,255,0.08)` borders — never solid gray lines
- Apply `backdrop-filter: blur(12px)` on floating elements over content

### Don't

- Use pure white `#ffffff` for text — use `#ededed` (softer on dark backgrounds)
- Apply shadows heavier than `rgba(0,0,0,0.5)` — dark theme doesn't need heavy shadows
- Use gold on non-interactive elements (decorative gold = visual noise)
- Create light/bright surfaces that break the dark theater effect
- Use gradients on backgrounds — flat dark colors only

---

## Music-Specific Patterns

### Album Art Treatment
- Always show at the card's native border-radius (8px), never circular
- On hover: slight scale(1.02) with 150ms transition
- In Now Playing: larger display (200px+ on desktop, 280px expanded)
- Use as color source: extract dominant color for subtle background tints on track pages

### Audio Waveform
- Playing indicator: 3 bars, gold (#f5a623), 400ms staggered animation
- Waveform visualization: gold bars on navy background
- Binaural beats: softer gold-to-amber gradient for ambient context

### Queue & Playlist
- Drag handle: 6 dots pattern, secondary color
- Currently playing: gold left border + subtle gold background tint
- Up next: standard card style
- Played: reduced opacity (0.5)

---

## Accessibility

- **Contrast ratio**: Gold on navy = 5.2:1 (passes WCAG AA for normal text)
- **Focus indicators**: 2px gold outline with 2px offset on all interactive elements
- **Touch targets**: Minimum 44px × 44px on mobile
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Screen reader**: All icons have aria-labels, all images have alt text
- **Keyboard navigation**: Full tab order, Enter/Space for activation, Escape for dismiss

---

## File Reference

| File | Purpose |
|------|---------|
| `src/app/globals.css` | CSS custom properties, base styles |
| `community.config.ts` | Color tokens, branding |
| `src/providers/audio/PlayerProvider.tsx` | Now Playing state, MediaSession |
| `src/components/music/` | 30+ music components following these patterns |
| `src/components/spaces/` | 40+ Spaces components |

---

*Design system for ZAO OS — a gated Farcaster music community. Adapted from Spotify's content-first darkness and Linear's precision engineering. MIT License.*
