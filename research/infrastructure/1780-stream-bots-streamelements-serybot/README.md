---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-07-21
superseded-by:
related-docs: 1773
original-query: "Building stream bots + overlay widgets for the ZAO community - custom widget build guide extending doc 1773 (streamer tools). Research StreamElements custom widgets + sery.bot. Map ideas to ZAO use cases (COC Concertz, WaveWarZ). Understand integration with ZAO stack."
tier: STANDARD
---

# 1005 - Building Stream Bots + Overlay Widgets for the ZAO Community

> **Goal:** Hands-on build guide for stream bots and overlay widgets that serve ZAO streamers. Map StreamElements custom widgets and sery.bot to ZAO use cases (live battle overlays, Respect tickers, now-playing widgets, call-to-action). Identify the simplest first bot to ship, OSS-first alternatives, and integration points with the ZAO stack.

---

## TL;DR

| Question | Answer |
|----------|--------|
| **StreamElements custom widgets** | HTML/CSS/JS overlays you build and drop into a stream via browser source. Live data via `onEventReceived` events (tips, follows, subs) or `onWidgetLoad` session data. Fields are user-editable config (color pickers, text inputs, dropdowns). No server-side code required. |
| **sery.bot** | A hosted Twitch moderation bot (anti-hate raid, anti-follow-bot, spam defense). Not an overlay tool or general bot framework - it's a safety/chat-protection service. Forever free, 250k+ streamers. Not what overlay-building needs. |
| **Stream bots for ZAO** | A "now battling" overlay (WaveWarZ), Farcaster channel chat display, Respect/tip ticker, live "join the ZAO" call-to-action. StreamElements custom widgets are the right tool. |
| **Integration with ZAO stack** | Custom widget calls a ZAO API endpoint that returns live Farcaster /zao feed, Respect balances, WaveWarZ battle state. Widget refreshes on a timer or on StreamElements event. |
| **Lean first bot** | **A "Now Playing + Battle Status" overlay widget.** Shows current WaveWarZ battle or artist (pulled from ZAOOS API) + a Respect tip ticker. Builds in <4 hours. Real artifact: a ZAO artist/fan can drop it into OBS in 90 seconds. |
| **Open vs paid** | StreamElements is free for custom widgets (no lock-in - it's just HTML/CSS/JS you own). sery.bot is free. OSS alternatives exist but less integrated. |

---

## Part 1: StreamElements Custom Overlay Widgets - Verified Build

**Data source:** StreamElements Docs - First Custom Widget (FULL fetch)

### What It Is

A StreamElements custom overlay widget is a self-contained HTML/CSS/JS component you write once and drop into any Twitch stream via an OBS browser source. It runs in a sandboxed iframe, receives live Twitch events in real-time, and updates the overlay without server-side code.

### The Build Structure

A custom widget has four tabs in the StreamElements Overlay Editor:

| Tab | What | Example |
|-----|------|---------|
| **HTML** | DOM markup + external imports (CDN scripts, stylesheets) | `<div id="ticker"></div>`, `<script src="..."></script>` |
| **CSS** | All styling; animations and transitions supported | `#ticker { color: {{textColor}}; }` |
| **JavaScript** | Pure JS (no Node/bundler); runs in protected sandbox | `window.addEventListener('onEventReceived', ...)` |
| **Fields** | JSON config that becomes UI controls in the Overlay Editor | Color pickers, text inputs, dropdowns, sliders |

### Receiving Live Data

Two key events fire automatically:

1. **onWidgetLoad** - Fires once on widget init. Includes field values, channel info, follower count, latest subscriber.
2. **onEventReceived** - Fires for EVERY live event (follow, subscribe, tip, cheer, raid). Payload includes `listener` (event type) and `event` (name, amount, message).

### Example: Simple Tip Ticker

```javascript
window.addEventListener('onEventReceived', (obj) => {
  const event = obj.detail.event;
  
  if (event.listener === 'tip') {
    const tipDiv = document.createElement('div');
    tipDiv.textContent = `${event.name} tipped $${event.amount}!`;
    document.body.appendChild(tipDiv);
    setTimeout(() => tipDiv.remove(), 5000);
  }
});
```

### Field Types (User-Editable Config)

In the FIELDS tab, define config WITHOUT code edits:

```json
[
  {
    "type": "text",
    "fieldname": "title",
    "label": "Ticker Title",
    "default": "ZAO Respect"
  },
  {
    "type": "colorpicker",
    "fieldname": "backgroundColor",
    "label": "Background Color",
    "default": "#0a1628"
  },
  {
    "type": "slider",
    "fieldname": "fontSize",
    "label": "Font Size (px)",
    "min": 12,
    "max": 48,
    "default": 24
  }
]
```

Reference fields in HTML/CSS via `{{fieldName}}`.

### Limitations

- Client-side only - no server secrets
- If you need private data (Respect balances, battle state), call a PUBLIC API endpoint from the widget
- Sandbox allows `window.fetch()` but requires CORS headers
- No persistent state across refreshes - POST to backend if needed
- Documentation may drift - use `console.log()` to inspect live values

---

## Part 2: sery.bot - What It Actually Is

**Data source:** sery.bot search results + docs.sery.bot (PARTIAL - site requires JS)

### The Honest Answer

sery.bot is NOT an overlay bot or a general bot-building framework. It's a hosted Twitch moderation service that protects streamers from hate raids, follow bots, and spam. Live since 2018, 250k+ streamers, forever free.

| Feature | What It Does |
|---------|--------------|
| Hate Raid Defense | Auto-detects and bans bot accounts during hate raids |
| Follow Bot Defense | Blocks fake followers, maintains bot list |
| Spam Protection | Removes spam messages |
| Integration | Add @Sery_Bot to Twitch channel |
| Multi-platform | Twitch only, no expansion plans |

### Why Not Overlay

sery.bot operates in chat protection, not overlay rendering. It doesn't build overlays, serve live data to video sources, or provide a bot framework.

**But:** sery.bot could be a companion service (keep ZAO chat clean during COC Concertz), though it's orthogonal to custom-widget building.

---

## Part 3: Stream Bots & Overlays for ZAO

### Use Cases & Widget Ideas

| Idea | Shows | Tool | Data Source | Time |
|------|-------|------|-------------|------|
| **Now Playing + Battle** | Current WaveWarZ battle + last Respect tip | StreamElements widget | ZAOOS API `/api/wavewarz/current` + `/api/respect/tips` | 3-4h |
| **Farcaster /zao Chat** | Live /zao channel posts + icons | StreamElements widget | Neynar API | 4-5h |
| **Respect Ticker** | Rolling: "Iman: 50 Respect" (auto-fade) | StreamElements widget | ZAOOS API, poll 5s | 2-3h |
| **Join ZAO CTA** | Animated: Farcaster link, Discord (cycles 30s) | StreamElements widget | Static config | 1-2h |
| **Member Directory** | Top Respect holders, avatar, rank | StreamElements widget | Supabase public read | 5-6h |
| **Battle Hype Meter** | Vote tally bar chart (real-time) | StreamElements widget | ZAOOS API, refresh 2s | 4-5h |

### Integration with ZAO Stack

Data flow:

```
OBS Browser Source
  ↓
StreamElements Widget (HTML/CSS/JS)
  ↓
fetch("https://zaoos.example.com/api/wavewarz/current")
  ↓
ZAOOS Backend (next/app/api/*)
  ↓
Supabase (RLS) + Neynar (Farcaster)
  ↓
Widget updates DOM
```

#### Example: Pulling WaveWarZ Battle Status

**Widget JavaScript:**

```javascript
const ZAOOS_API = 'https://zaoos.example.com';

async function fetchBattleStatus() {
  const res = await fetch(`${ZAOOS_API}/api/wavewarz/current`);
  const data = await res.json();
  
  document.getElementById('artist1').textContent = data.artist1_name;
  document.getElementById('artist1-votes').textContent = data.artist1_votes;
  document.getElementById('artist2').textContent = data.artist2_name;
  document.getElementById('artist2-votes').textContent = data.artist2_votes;
}

fetchBattleStatus();
setInterval(fetchBattleStatus, 3000);
```

**Corresponding ZAOOS API route:**

```typescript
// src/app/api/wavewarz/current/route.ts
export async function GET() {
  const battle = await supabase
    .from('wavewarz_battles')
    .select('artist1_name, artist1_votes, artist2_name, artist2_votes')
    .eq('status', 'active')
    .single();
  
  return NextResponse.json(battle.data);
}
```

#### CORS & Security

- Widgets run in StreamElements' iframe. CORS must allow StreamElements' domain.
- Don't expose SUPABASE_SERVICE_ROLE_KEY in widget. Only call public APIs or authenticated endpoints.
- Rate-limit polling if many viewers poll simultaneously.

---

## Part 4: The Lean First Bot - "Now Playing + Respect Ticker"

### Why This One

1. Ship in <4 hours
2. Real artifact - ZAO artists use it THIS MONTH during COC Concertz
3. Showcases both pieces - StreamElements widget + ZAO API
4. Drop into OBS in 90 seconds

### Build Outline

#### Step 1: Create API Endpoint (1-2h)

**File:** `src/app/api/stream-overlay/status/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET() {
  try {
    const { data: battle } = await supabase
      .from('wavewarz_battles')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: tips } = await supabase
      .from('respect_tips')
      .select('tipper_name, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      battle: battle || null,
      tips: tips || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stream status' },
      { status: 500 }
    );
  }
}
```

#### Step 2: Build StreamElements Widget (2-3h)

**HTML:**

```html
<div id="container">
  <div id="battle-status">
    <h2>Now Playing</h2>
    <div id="battle-content">Loading...</div>
  </div>
  <div id="ticker">
    <h2>Respect Ticker</h2>
    <div id="ticker-content"></div>
  </div>
</div>
```

**CSS:**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#container {
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #0a1628, #1a2d3d);
  color: #f5a623;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
}

#battle-status {
  border-bottom: 2px solid #f5a623;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.battle-artists {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.artist {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: rgba(245, 166, 35, 0.1);
  border-radius: 4px;
}

.artist-votes {
  font-size: 24px;
  color: #f5a623;
  font-weight: bold;
}

.tip-item {
  padding: 8px;
  margin: 5px 0;
  background: rgba(245, 166, 35, 0.15);
  border-left: 3px solid #f5a623;
  animation: slideIn 0.3s ease-out;
  font-size: 14px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**JavaScript:**

```javascript
const ZAOOS_API = 'https://zaoos.example.com';
let lastTips = [];

async function updateStatus() {
  try {
    const res = await fetch(`${ZAOOS_API}/api/stream-overlay/status`);
    const data = await res.json();

    if (data.battle) {
      const battleHTML = `
        <div class="battle-artists">
          <div class="artist">
            <div class="artist-name">${data.battle.artist1_name}</div>
            <div class="artist-votes">${data.battle.artist1_votes}</div>
          </div>
          <div class="artist">
            <div class="artist-name">${data.battle.artist2_name}</div>
            <div class="artist-votes">${data.battle.artist2_votes}</div>
          </div>
        </div>
      `;
      document.getElementById('battle-content').innerHTML = battleHTML;
    } else {
      document.getElementById('battle-content').innerHTML = 'No active battle';
    }

    const newTips = data.tips.filter(
      t => !lastTips.find(lt => lt.created_at === t.created_at)
    );
    
    if (newTips.length > 0) {
      const tickerContent = document.getElementById('ticker-content');
      newTips.reverse().forEach(tip => {
        const tipEl = document.createElement('div');
        tipEl.className = 'tip-item';
        tipEl.textContent = `${tip.tipper_name} tipped ${tip.amount} Respect`;
        tickerContent.insertBefore(tipEl, tickerContent.firstChild);
      });
      
      while (tickerContent.children.length > 5) {
        tickerContent.removeChild(tickerContent.lastChild);
      }
    }
    
    lastTips = data.tips;
  } catch (error) {
    console.error('Failed to fetch status:', error);
  }
}

updateStatus();
setInterval(updateStatus, 3000);
```

#### Step 3: Deploy to StreamElements (30min)

1. Log in to StreamElements
2. Create new Custom Widget in Overlay Editor
3. Paste HTML, CSS, JS into tabs
4. Set API URL in JS (or use Field for it)
5. Save and add to OBS browser source
6. Test with WaveWarZ battle + Respect tip

#### Step 4: Add Fields for Streamer Config (30min)

```json
[
  {
    "type": "text",
    "fieldname": "apiUrl",
    "label": "ZAOOS API URL",
    "default": "https://zaoos.example.com"
  },
  {
    "type": "colorpicker",
    "fieldname": "accentColor",
    "label": "Accent Color",
    "default": "#f5a623"
  },
  {
    "type": "slider",
    "fieldname": "pollIntervalSeconds",
    "label": "Poll Interval (seconds)",
    "min": 1,
    "max": 30,
    "default": 3
  }
]
```

---

## Part 5: Open vs Paid / Self-Hosting

### StreamElements Custom Widgets

- Ownership: You own the HTML/CSS/JS
- Cost: Free, no tiers
- Portability: Code is yours, portable to any host
- Alternatives: Owncast (OSS), OBS browser source + raw HTML, custom OBS plugin (C++)

### sery.bot

- Cost: Free
- Type: Hosted service (closed-source)
- Ownership: Use via Twitch integration

### Recommendation for ZAO

Build on StreamElements custom widgets:
1. Code is yours (no lock-in)
2. Zero cost
3. Every streamer has OBS
4. Forkable to ZAOOS or zao-streamer-kit repo

Self-hosting alternative: Keep .html file in repo. Streamers clone, run `npm run dev`, open `http://localhost:3000/overlays/now-playing.html` in OBS.

---

## Part 6: Integration Checklist

### API Endpoints Needed (ZAOOS)

- [ ] GET /api/stream-overlay/status (battle + tips)
- [ ] GET /api/wavewarz/current (active battle)
- [ ] GET /api/respect/recent?limit=N (recent tips)
- [ ] GET /api/farcaster/zao-feed?limit=N (/zao posts)

### Widget Assets Needed

- [ ] now-playing.html (widget code)
- [ ] now-playing-fields.json (config fields)

### Docs Needed

- [ ] STREAMER-SETUP.md (90-second add-to-OBS guide)
- [ ] API.md (overlay endpoint spec)
- [ ] CUSTOMIZE.md (fork/restyle guide)

### Testing

- [ ] Widget fetches live data, no errors
- [ ] Handles API down gracefully
- [ ] ZAO brand (dark navy #0a1628 + gold #f5a623)

---

## Part 7: First Iteration - Ship Path

### Week 1
1. Create `/api/stream-overlay/status` endpoint
2. Write + test StreamElements widget
3. Deploy to StreamElements
4. Test with live COC Concertz or demo

### Week 2
1. Gather streamer feedback
2. Iterate (fix CORS, optimize polling, layout)
3. Document in ZAOOS README or zao-streamer-kit

### Measure
- ZAO artists use it during streams this month
- API <500ms response
- Zero CORS errors in console

---

## Also See

- Doc 1773 - The parent streamer tools doc
- StreamElements Docs - Full custom widget reference
- Neynar API - Farcaster feed integration

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create `/api/stream-overlay/status` endpoint + test | Builder | Code | 2026-07-25 |
| Build + test "Now Playing + Respect Ticker" widget | Builder | Code | 2026-07-25 |
| Deploy widget to StreamElements + test in OBS | Zaal | Manual | 2026-07-26 |
| Write STREAMER-SETUP.md | Zaal | Docs | 2026-07-28 |
| Test with live stream + gather feedback | Zaal | Test | 2026-08-01 |
| Iterate based on feedback | Builder | Code | 2026-08-05 |
| Open PR to ZAOOS / zao-streamer-kit | Builder | PR | 2026-08-08 |
