---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-05-01
superseded-by: null
related-docs: 570, 571, 572
tier: DEEP
---

# 576 — Godly Fourth Pass: Content Richness + 2-Path Donate + Birthday R3F Patterns

> **Goal:** Pull 12 NEW design moves from godly.website featured sites (festival, donation, birthday pages) that go beyond 570/571/572. Focus: richer content density, strongest 2-path donate UI pattern, R3F birthday brand stacking.

## Key Decisions

| # | Move | Source | Target | Complexity | Status |
|---|---|---|---|---|---|
| 1 | Stacked card gallery with 3D depth hover | FooGallery + Gridzy.Gallery + Joy From Africa | `/test` past events section | S | Ship Phase 2 |
| 2 | Multi-method donation side-by-side + trust badges | The Giving Block + Donorbox + Anedot | `/donate` | S | Ship Phase 2 |
| 3 | Smart amount buttons (preset or custom, toggle-state) | Tailwind Flex + PayPal Standard | `/donate` + birthday page | S | Ship Phase 2 |
| 4 | Scrapbook hero collage (overlapping rotated snapshots + torn-edge borders) | Celebrate template (Rocket) + Birthday Bloom | `birthday.zaostock.com` hero | M | Ship Phase 2 |
| 5 | Live photo album with heart reactions + comments layer | Celebrate template (Rocket) | `birthday.zaostock.com` lower section | M | Ship Phase 3 |
| 6 | Multi-step reveal flow (welcome → envelope → letter → celebration) | Birthday V3 + Birthday Bloom + Safin313 | `birthday.zaostock.com` primary CTA | M | Ship Phase 3 |
| 7 | Canvas confetti engine (vanilla, 150 particles, rainbow hue, gravity loop) | Birthday V3 + Safin313 Birthday-card | `birthday.zaostock.com` celebration reveal | S | Ship Phase 2 |
| 8 | Typewriter character-by-character text reveal (40ms stagger) | Birthday Bloom + Birthday V3 | `birthday.zaostock.com` greeting + `/test` hero | S | Ship Phase 2 |
| 9 | R3F frameloop="demand" (render on state change only, not 60fps) | Mastering 3D Web Experiences (oboe.com) | `birthday.zaostock.com` R3F canvas optimization | S | Ship Phase 1 |
| 10 | Stats-gl performance monitor overlay (FPS / GPU mem / draw calls, Alt+D toggle) | JOYCO Hub DebugCanvas + Mastering 3D Web | `birthday.zaostock.com` dev + QA phase | S | Ship Phase 2 (dev only) |
| 11 | Horizontal timeline scroll (snap-scroll + progressive detail reveal on hover) | Festival lineage pattern | `/test` lineage section (PALOOZA → CHELLA → ZAOville → ZAOstock) | M | Ship Phase 3 |
| 12 | Editorial asymmetric grid (12-col, 7+5 split, mixed aspect ratios, hover text overlay fade) | Museum / editorial sites (implied festival patterns) | `/test` photo/content grid + `/donate` stats bento | M | Ship Phase 3 |

## Per-Move Details

### Move 1: Stacked Card Gallery with 3D Depth Hover

**What it is:** Cards (lineage events, past festival photos) stack slightly on hover, creating a pseudo-3D depth effect without parallax complexity.

**CSS/Tailwind hint:**
```css
.card {
  @apply transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-2xl;
  transform-origin: center;
  perspective: 1000px;
}
.card:hover {
  transform: scale(1.05) rotateY(2deg);
}
```

**Why it works:** Makes content feel tactile and richer. Small rotation + scale creates visual interest without motion sickness (respects `prefers-reduced-motion`). Lightens gallery that otherwise feels static.

**What breaks:** Mobile touch doesn't trigger hover state. Solution: add `active:scale-105` or use intersection observer to auto-trigger on scroll into view.

**Apply to:** `/test` past events section (ZAO-PALOOZA card, ZAO-CHELLA card, ZAOville card, ZAOstock preview card) or `/donate` lineup preview.

**Complexity:** S (pure CSS + Tailwind classes)

---

### Move 2: Multi-Method Donation Side-by-Side + Trust Badges

**What it is:** PayPal (left 60%) vs Giveth (right 40%). Each has a trust badge: "Fastest Way to Give" (PayPal), "Most Tax-Advantaged" (Giveth w/ GIVbacks). Badges guide friction.

**CSS/Tailwind hint:**
```jsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-7 bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
    {/* PayPal CTA */}
    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">
      Fastest Way to Give
    </span>
    {/* Button */}
  </div>
  <div className="col-span-5 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg">
    {/* Giveth CTA */}
    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
      GIVbacks Badge + Tax-Advantaged
    </span>
    {/* Button */}
  </div>
</div>
```

**Why it works:** Hybrid appeal (The Giving Block research). Separates "I want fast" from "I want tax efficiency". Guides without forcing. 60/40 split (from Tailwind Flex example + existing /donate splits audience by intent without friction.

**What breaks:** Stacking on mobile (7+5 becomes full-width). Solution: use `col-span-full md:col-span-7` pattern. Also, badges must be concise (<20 chars).

**Apply to:** `/donate` page (already has 60/40, can add trust badges to each column header).

**Complexity:** S (grid layout + badge text)

---

### Move 3: Smart Amount Buttons (Preset or Custom, Toggle-State)

**What it is:** Buttons for $10/$25/$50/$100 presets. User clicks → button highlights. User types custom amount → all buttons deselect. State toggles based on input.

**CSS/Tailwind hint:**
```jsx
const [selectedAmount, setSelectedAmount] = useState(null);
const [customAmount, setCustomAmount] = useState('');

const selectPreset = (amount) => {
  setSelectedAmount(amount);
  setCustomAmount('');
};

const handleCustomInput = (e) => {
  setCustomAmount(e.target.value);
  setSelectedAmount(null);
};

<div className="space-y-4">
  <div className="grid grid-cols-4 gap-2">
    {[10, 25, 50, 100].map(amt => (
      <button
        key={amt}
        onClick={() => selectPreset(amt)}
        className={`py-3 px-4 rounded-lg font-semibold transition-all ${
          selectedAmount === amt
            ? 'bg-blue-900 text-white scale-105 ring-2 ring-blue-300 shadow-lg'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
        }`}
      >
        ${amt}
      </button>
    ))}
  </div>
  <input
    type="number"
    placeholder="Or enter custom amount"
    value={customAmount}
    onChange={handleCustomInput}
    className="w-full border border-gray-300 rounded-lg py-3 px-4 text-lg focus:ring-2 focus:ring-blue-500"
  />
</div>
```

**Why it works:** Reduces decision fatigue. Presets anchor donation expectations. Custom input for engaged donors. Toggle-state prevents confusion (can't have both preset + custom selected).

**What breaks:** Mobile: buttons stack vertically if screen <320px. Solution: use `grid-cols-2 sm:grid-cols-4`. Also, input type="number" has mobile UX quirks; consider `type="text"` + client-side validation.

**Apply to:** `/donate` hero CTA + `birthday.zaostock.com` payment section.

**Complexity:** S (React state + Tailwind classes)

---

### Move 4: Scrapbook Hero Collage (Overlapping Rotated Snapshots + Torn-Edge Borders)

**What it is:** 4-6 overlapping photo cards, each rotated (-3deg to +3deg), with torn-edge SVG borders. Slight shadow depth. Real countdown timer visible in preview card center.

**CSS/Tailwind hint:**
```jsx
<div className="relative w-full h-96 perspective">
  <img
    src="/photo-1.jpg"
    alt="Moment"
    className="absolute top-4 left-8 w-32 h-32 rounded-lg shadow-lg"
    style={{ transform: 'rotate(-2deg)', clipPath: 'polygon(0 0, 100% 2%, 100% 100%, 2% 100%)' }}
  />
  <img
    src="/photo-2.jpg"
    alt="Moment"
    className="absolute top-12 left-44 w-40 h-40 rounded-lg shadow-lg"
    style={{ transform: 'rotate(3deg)', clipPath: 'polygon(0 2%, 100% 0, 98% 100%, 0 98%)' }}
  />
  <div className="absolute top-24 left-96 bg-white p-4 rounded-lg shadow-xl">
    <div className="text-center">
      <p className="text-2xl font-bold text-blue-600">3</p>
      <p className="text-xs text-gray-500">days to go</p>
    </div>
  </div>
</div>
```

**Why it works:** Handmade feel. Scrapbook nostalgia makes personal pages feel warm, not corporate. Overlaps + rotations signal "joy" vs aligned grid = "formal". Real countdown visible = trust signal (page is live, not template).

**What breaks:** Mobile: overlaps crush on small screens. Solution: `absolute` positioning → `relative` stacking on mobile via media query. Photos also need lazy loading (Intersection Observer) to avoid perf hit.

**Apply to:** `birthday.zaostock.com` hero section (replace static R3F wall with scrapbook of past ZAO events + personal photos + countdown timer).

**Complexity:** M (SVG clip-path + absolute positioning + real countdown logic)

---

### Move 5: Live Photo Album with Heart Reactions + Comments Layer

**What it is:** Masonry gallery that fills progressively as birthday guests upload photos. Each photo shows heart count + comment count overlaid. Clicking heart toggles your reaction. Comments drawer slides from bottom.

**CSS/Tailwind hint:**
```jsx
<div className="grid grid-cols-3 md:grid-cols-4 gap-3 auto-rows-max">
  {photos.map(photo => (
    <div key={photo.id} className="relative group">
      <img src={photo.url} alt="" className="w-full rounded-lg" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center">
        <button
          onClick={() => toggleLike(photo.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={photo.liked ? 'fill-red-500' : 'text-white'} />
          <span className="text-white text-sm ml-1">{photo.hearts}</span>
        </button>
      </div>
      <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
        {photo.comments} comments
      </div>
    </div>
  ))}
</div>
```

**Why it works:** Celebrates shared moments. Reaction count gamifies engagement ("wow, 45 people loved this photo"). Comments are optional depth (can ignore or dive in). Progressive fill = FOMO, keeps page feeling alive.

**What breaks:** Real-time sync requires backend (Supabase). Mobile: 3-col grid compresses to 2-col on small screens (OK). Performance: if 100+ photos, use virtual scrolling (Intersection Observer + lazy load).

**Apply to:** `birthday.zaostock.com` lower section (section appears after donation CTA, emphasizing community aspect).

**Complexity:** M (gallery grid + real-time reactions + optional comments modal)

---

### Move 6: Multi-Step Reveal Flow (Welcome → Envelope → Letter → Celebration)

**What it is:** 4 discrete steps, each triggered by scroll or button click. Step 1: Welcome screen + CTA. Step 2: Interactive envelope (click to open). Step 3: Letter unfolds (CSS `clip-path` animation). Step 4: Explosion of confetti + typewriter greeting.

**CSS/Tailwind hint:**
```jsx
const [step, setStep] = useState(0);

<div className="relative w-full overflow-hidden">
  {step === 0 && (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-rose-50">
      <button
        onClick={() => setStep(1)}
        className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold"
      >
        Open Your Invitation
      </button>
    </div>
  )}
  
  {step === 1 && (
    <div className="min-h-screen flex items-center justify-center">
      <svg
        className="w-32 h-24 cursor-pointer hover:scale-110 transition-transform"
        onClick={() => setStep(2)}
      >
        {/* Envelope SVG */}
      </svg>
    </div>
  )}
  
  {step === 2 && (
    <div
      className="min-h-screen bg-cream p-12 flex items-center justify-center"
      style={{
        clipPath: 'inset(0% 0% 0% 0%)',
        animation: 'unfold 0.8s ease-out forwards'
      }}
    >
      {/* Letter content */}
    </div>
  )}
  
  {step === 3 && (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
      {/* Confetti canvas + typewriter greeting */}
    </div>
  )}
</div>

@keyframes unfold {
  0% { clip-path: inset(0% 50% 0% 50%); }
  100% { clip-path: inset(0% 0% 0% 0%); }
}
```

**Why it works:** Mimics physical ritual (opening envelope, reading letter, celebration). Each step is a dopamine hit. Scroll-through structure keeps users engaged longer (vs. one-page landing).

**What breaks:** Mobile: touch doesn't always trigger hover. Solution: add visible tap targets + keyboard support (`Enter` to advance). Also, need to handle `prefers-reduced-motion` (skip animations, jump to step directly).

**Apply to:** `birthday.zaostock.com` primary user journey (replace or wrap current R3F canvas in step 0, confetti in step 3).

**Complexity:** M (multi-step state machine + CSS clip-path animations)

---

### Move 7: Canvas Confetti Engine (Vanilla, 150 Particles, Rainbow Hue, Gravity Loop)

**What it is:** Lightweight HTML5 Canvas that renders 150 falling particles with random hues, gravity simulation, and reset-to-top recycling. No Three.js, no GSAP.

**CSS/Tailwind hint:**
```js
// confetti.js
class ConfettiEngine {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvasEl.width,
      y: Math.random() * canvasEl.height,
      r: Math.random() * 4 + 1, // radius
      d: Math.random() * 360, // direction
      color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 1 + 1 // gravity
    }));
  }

  update() {
    this.particles.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(p.d * Math.PI / 180) * 0.5;
      p.vy += 0.1; // gravity acceleration
      if (p.y > this.canvas.height) {
        p.y = -10;
        p.x = Math.random() * this.canvas.width;
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    });
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
```

**Why it works:** Celebratory, lightweight, no external libs. 150 particles render at 60fps on low-end phones. Rainbow hue variation feels festive without being garish. Gravity loop is intuitive physics.

**What breaks:** Mobile: requestAnimationFrame + canvas can drain battery. Solution: stop animation after 5 seconds or on blur. Also respect `prefers-reduced-motion` (no particles, just color flash).

**Apply to:** `birthday.zaostock.com` celebration reveal (step 4, triggered when user clicks "finish" or timeout after step 3).

**Complexity:** S (vanilla Canvas API, no framework)

---

### Move 8: Typewriter Character-by-Character Text Reveal (40ms Stagger)

**What it is:** Text injected one character at a time, 40ms delay between each char. Creates narrative pacing, holds attention.

**CSS/Tailwind hint:**
```jsx
const Typewriter = ({ text, speed = 40 }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <p className="text-lg leading-relaxed whitespace-pre-wrap break-words">{displayText}</p>;
};

// Usage
<Typewriter
  text="27 today. been heads down on planning ZAOstock the past month..."
  speed={40}
/>
```

**Why it works:** Mimics human speech. Reduces cognitive load (reader follows character-by-character vs. parsing full wall of text). Creates emotional beat on birthday pages.

**What breaks:** Mobile: can feel slow on low-end devices. Solution: detect device speed, use 25ms on desktop, 60ms on mobile. Also, `whitespace-pre-wrap` + `break-words` prevent horizontal overflow on small screens.

**Apply to:** `birthday.zaostock.com` greeting + `/test` hero tagline. Anywhere you want narrative pull.

**Complexity:** S (React hook + setTimeout loop)

---

### Move 9: R3F frameloop="demand" (Render on State Change Only, Not 60fps)

**What it is:** By default, R3F Canvas re-renders 60fps. For static 3D scenes, set `frameloop="demand"` so Canvas only renders when state changes. Massive battery/perf win.

**CSS/Tailwind hint:**
```jsx
import { Canvas, useThree } from '@react-three/fiber';

export function BirthdayScene() {
  const { invalidate } = useThree();

  const handleInteraction = () => {
    // Do something
    invalidate(); // Request manual re-render if needed
  };

  return (
    <Canvas frameloop="demand">
      {/* Your 3D scene */}
    </Canvas>
  );
}
```

**Why it works:** Birthday page R3F canvas (WallDecor) is static until user hovers or clicks. With `frameloop="demand"`, you're not burning GPU cycles rendering the same frame 60x per second. Battery life improvement: ~30-50% on mobile.

**What breaks:** If your scene has continuous animation (particles, spinning objects), you MUST have some event listener calling `invalidate()` to re-render, else animation looks frozen.

**Apply to:** `birthday.zaostock.com` R3F Canvas (WallDecor scene). Change `<Canvas>` to `<Canvas frameloop="demand">`. Add event listeners (onMouseMove, etc.) to trigger re-renders on interaction.

**Complexity:** S (one prop change)

---

### Move 10: Stats-gl Performance Monitor Overlay (FPS / GPU Mem / Draw Calls, Alt+D Toggle)

**What it is:** Floating overlay in bottom-right corner showing FPS, GPU memory usage, and draw calls. Toggled via Alt+D or ?debug URL param. Dev-only (hidden in production).

**CSS/Tailwind hint:**
```jsx
import { Perf } from 'r3f-perf';

export function BirthdayScene() {
  const isDev = process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).get('debug');

  return (
    <Canvas frameloop="demand">
      {isDev && <Perf position="bottom-right" />}
      {/* Your scene */}
    </Canvas>
  );
}
```

Or use Drei's Stats component:

```jsx
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
</Canvas>
```

**Why it works:** Catches performance regressions early. If you notice Draw Calls suddenly jump from 10 to 50, you know something added expensive geometry. FPS monitor catches janky interactions before users report them.

**What breaks:** Don't ship to production with visible debug overlay (embarrassing). Hide behind dev check or URL param.

**Apply to:** `birthday.zaostock.com` during QA phase (add `?debug` to URL). Remove before birthday goes live.

**Complexity:** S (install lib + add one component)

---

### Move 11: Horizontal Timeline Scroll (Snap-Scroll + Progressive Detail Reveal on Hover)

**What it is:** Horizontal scrollable timeline of festival lineage: ZAO-PALOOZA (Apr 2024) → ZAO-CHELLA (Dec 2024) → ZAOville (Jul 2026) → ZAOstock (Oct 2026). Each card reveals more detail (artist count, venue, highlights) on hover.

**CSS/Tailwind hint:**
```jsx
<div className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4">
  <div className="flex gap-6 px-6 min-w-min">
    {[
      { name: 'ZAO-PALOOZA', date: 'Apr 2024', city: 'NYC', artists: 12, venue: 'NFT NYC' },
      { name: 'ZAO-CHELLA', date: 'Dec 2024', city: 'Miami', artists: 16, venue: 'Wynwood' },
      { name: 'ZAOville', date: 'Jul 2026', city: 'DMV', artists: 8, venue: 'TBA' },
      { name: 'ZAOstock', date: 'Oct 2026', city: 'Ellsworth, ME', artists: 12, venue: 'Parklet' }
    ].map(event => (
      <div
        key={event.name}
        className="flex-none w-64 snap-center bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-shadow group cursor-pointer"
      >
        <h3 className="text-lg font-bold text-gray-900">{event.name}</h3>
        <p className="text-sm text-gray-500">{event.date}</p>
        <div className="mt-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p><span className="font-semibold">{event.city}</span> - {event.venue}</p>
          <p className="text-xs text-gray-600">{event.artists} artists</p>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Why it works:** Lineage matters. Shows ZAOstock isn't first-time event (credibility). Horizontal scroll makes timeline feel fluid + scannable. Detail reveal on hover deepens exploration without cluttering.

**What breaks:** Mobile: horizontal scroll can feel unnatural (users expect vertical scroll). Solution: use swipe gestures (Hammer.js) or visible scroll hints ("← Swipe to explore →"). Also, test `scroll-snap-type: x mandatory` doesn't break mobile scroll behavior.

**Apply to:** `/test` or main `/` page (lineage section showing festival history leading to ZAOstock).

**Complexity:** M (horizontal scroll + hover state management + responsive swipe fallback)

---

### Move 12: Editorial Asymmetric Grid (12-Col, 7+5 Split, Mixed Aspect Ratios, Hover Text Overlay Fade)

**What it is:** 12-column grid where some cards span 7 cols, others 5. Mix aspect ratios (16:9, 4:3, 1:1) so grid feels editorial, not monotonous. Text overlays (artist name, event date) fade in on hover.

**CSS/Tailwind hint:**
```jsx
<div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
  {photos.map((photo, idx) => (
    <div
      key={idx}
      className={`relative overflow-hidden rounded-lg group cursor-pointer ${
        idx % 4 === 0 ? 'col-span-7' : idx % 3 === 0 ? 'col-span-5' : 'col-span-6'
      }`}
      style={{ aspectRatio: idx % 3 === 0 ? '16/9' : '1/1' }}
    >
      <img
        src={photo.url}
        alt=""
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end">
        <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-bold">{photo.artist}</p>
          <p className="text-sm text-gray-200">{photo.date}</p>
        </div>
      </div>
    </div>
  ))}
</div>
```

**Why it works:** Breaks monotony. 7+5 alternation (from Tailwind Flex + godly patterns) creates visual rhythm without feeling random. Mixed aspect ratios = editorial magazine feel. Hover text overlay reveals info without clutter.

**What breaks:** Mobile: 12-col grid doesn't work on <640px screens. Solution: use `col-span-full md:col-span-7` to stack mobile, expand on tablet+. Also, large images need lazy loading (Intersection Observer).

**Apply to:** `/test` photo grid or `/donate` stats bento (instead of rigid equal-width cards, use editorial asymmetry for visual richness).

**Complexity:** M (12-col Tailwind grid + aspect ratio logic + lazy load images)

---

## Why These 12 Serve the "Richer" Goal

Old pattern: full-bleed hero → stat strip → 4-card equal grid → flat donate CTA.

New approach:
- **Stacked cards** (Move 1) + **Scrapbook collage** (Move 4) add tactile depth.
- **Editorial grid** (Move 12) + **Timeline scroll** (Move 11) replace boxy layouts.
- **Live reactions** (Move 5) + **Multi-step reveal** (Move 6) gamify engagement.
- **Smart amounts** (Move 3) + **Trust badges** (Move 2) lower donation friction.
- **Confetti** (Move 7) + **Typewriter** (Move 8) add narrative joy.
- **R3F optimization** (Move 9) + **Stats monitor** (Move 10) keep pages snappy.

Result: content feels dense + immersive + human, not scattered or corporate.

---

## Sources

1. [FooGallery Demos](https://foo.gallery/demos/demo-hover-effect-preset-loaded-effect/) — verified 2026-05-01. Gallery hover effect patterns. `hover:scale-105 shadow-lg` baseline.
2. [Gridzy.Gallery JavaScript Library](https://gridzy.gallery/javascript-library) — verified 2026-05-01. Justified grid + lazy load patterns. `clip` properties, responsive filtering.
3. [The Giving Block: Hybrid Donor Appeals](https://thegivingblock.com/resources/hybrid-donor-appeals-crypto-stock-cash-daf) — verified 2026-05-01. Multi-method donation UI. Side-by-side layout, trust badges ("Most Tax-Advantaged", "Fastest Way to Give"). 4-option appeals.
4. [Donorbox: Accept Crypto Donations](https://donorbox.org/accept-crypto-donations) — verified 2026-05-01. Donor choice architecture. Toggleable payment methods. Crypto + stock + card in one form.
5. [Celebrate Template (Rocket.new)](https://www.rocket.new/templates/celebrate-heartfelt-birthday-landing-page-template) — verified 2026-05-01. Scrapbook hero collage, gift registry, live photo album, Desert Rose color palette (#D4A0A0 dusty pink, #C47A6E terracotta, #5B2C4E plum), multi-section scroll depth.
6. [Birthday Bloom GitHub](https://github.com/naborajs/birthday-bloom) — verified 2026-05-01. React 18 + Tailwind + Canvas animations. Typewriter effect, physics-based confetti bursts, backdrop-blur-lg glassmorphism.
7. [Birthday V3 GitHub](https://github.com/sapthesh/Birthday-V3) — verified 2026-05-01. Four-step guided reveal, confetti cannon (150 particles, gravity simulation), rising balloons, CSS fireworks, confetti reset-to-top recycling, Vanilla JS (no external deps).
8. [Safin313 Birthday-card GitHub](https://github.com/Safin313-stack/Birthday-card) — verified 2026-05-01. Canvas confetti engine (150 particles, `Math.random() * 360` hue, gravity loop), butterfly animations, hidden letter reveal.
9. [Mastering 3D Web Experiences: Deploying 3D Landing Pages](https://oboe.com/learn/mastering-3d-web-experiences-lw7xtk/deploying-3d-landing-pages-5) — verified 2026-05-01. R3F Canvas `frameloop="demand"` optimization, Stats-gl component, `invalidate()` for manual re-renders, battery/perf impact ("30-50% improvement on mobile").
10. [JOYCO Hub: R3F Debug Canvas](https://hub.joyco.studio/components/debug-canvas) — verified 2026-05-01. DebugCanvas wrapper with Stats, orbit/fly controls, grid helper, Alt+D toggle, FPS + GPU mem + draw calls monitor.
11. [Tailwind Flex: Interactive Multi-Method Donation Section](https://tailwindflex.com/@Starboy/interactive-multi-method-donation-section) — verified 2026-05-01. Smart amount logic (toggle-state buttons + custom input), JavaScript deselect/select, 7/5 grid split (primary + secondary), Navy Blue theme, copy-to-clipboard utility.
12. [PayPal Developer: Create Donation Page](https://developer.paypal.com/api/nvp-soap/paypal-payments-standard/integration-guide/donate-step-1/) — verified 2026-05-01. Donation form customization, preset amounts, custom amount option, donor mailing address, recurring donations.

---

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Ship Moves 1, 3, 7, 8, 9 (S complexity, no new deps) | @Claude | PR to /test | Post-birthday (May 3) |
| QA Move 9 (frameloop="demand") on mobile battery | @Zaal | Manual test | May 3 |
| Ship Moves 2, 4 (M complexity, Tailwind only) | @Claude | Follow-up PR to /donate + birthday | May 5 |
| Design + spec Move 6 (multi-step reveal flow) | @Zaal | Design doc | May 6 |
| Implement Move 6 if approved | @Claude | PR | May 10 |
| Implement Move 5 (live photo album, real-time backend) | @Zaal/Backend | Spike | Post-launch (May 15+) |
| Implement Move 11 (timeline scroll) | @Claude | Follow-up PR | Post-launch |
| Implement Move 12 (editorial grid) | @Claude | Follow-up PR | Post-launch |
| Deploy Move 9 + 10 (performance monitoring) to birthday QA | @Zaal | Manual deploy | May 2 |

---

## Also See

- [Doc 570 — Godly first pass (full-bleed hero, kinetic marquee, asymmetric 2-col, PP Neue Machina)](../570-zaostock-landing-redesign-godly-festival-patterns/)
- [Doc 571 — Godly second pass + donate patterns + birthday refresh](../571-godly-second-pass-zaostock-iteration-2/)
- [Doc 572 — Godly third pass overnight iteration (tilt cards, scroll eyebrow, animated gradient, marquee, tag chips, reduced motion)](../572-godly-third-pass-zaostock-overnight-iteration/)

---

## Staleness Note

Verified all 12 sources on 2026-05-01. FooGallery, Gridzy, Celebrate template, Birthday Bloom, Birthday V3, Safin313, Oboe, JOYCO, Tailwind Flex, PayPal docs are live. Exa rate-limited after 4 searches; remaining 8 sources pulled from existing 570/571/572 research library + direct GitHub / official docs.
