# ICP Primer Localhost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-lesson single-page ICP primer at `tools/icp-primer/` that teaches Zaal Internet Computer Protocol basics with live mainnet widgets (anonymous canister call, Internet Identity login, ICRC-7 NFT read, pay-to-mint walkthrough).

**Architecture:** Plain HTML + ES modules, no build step. CDN-loaded `@dfinity/agent`, `@dfinity/auth-client`, `@dfinity/candid` via esm.sh. Shared singleton state + error helper. One module per widget. Served locally with `python3 -m http.server`.

**Tech Stack:** Vanilla HTML/CSS/JS, ES modules, `@dfinity/agent@2`, `@dfinity/auth-client@2`, `@dfinity/candid@2`, Python http.server for local hosting.

**Testing approach:** No unit test framework — per spec, manual browser verification after each task. Each task ends with "Open http://localhost:8765, do X, verify Y".

---

## File Structure

```
tools/icp-primer/
├── index.html           # page shell + 5 section containers
├── styles.css           # ZAO navy/gold theme, lesson cards, error UI
├── primer.js            # entry module, wires widgets to DOM, handles offline banner
├── widgets/
│   ├── state.js         # shared singleton { agent, authClient, identity }
│   ├── error.js         # wrapCall + renderError helpers
│   ├── ping.js          # Lesson 2 - anonymous ICP Ledger call
│   ├── ii.js            # Lesson 3 - Internet Identity login/logout
│   ├── icrc7.js         # Lesson 4 - ICRC-7 NFT read
│   └── flow.js          # Lesson 5 - pay-to-mint SVG animation
├── README.md            # how to run + what this is
└── .gitignore           # ignore anything local
```

Lessons 1 and 5 content lives inline in `index.html` (static text + diagram). Lessons 2, 3, 4 have minimal inline shell plus widget module that renders into a container div.

---

## Task 1: Scaffold directory, .gitignore, README

**Files:**
- Create: `tools/icp-primer/.gitignore`
- Create: `tools/icp-primer/README.md`
- Create: `tools/icp-primer/widgets/.gitkeep` (empty placeholder so widgets/ commits)

- [ ] **Step 1: Create the directory and placeholder**

Run:
```bash
mkdir -p "tools/icp-primer/widgets"
touch "tools/icp-primer/widgets/.gitkeep"
```

- [ ] **Step 2: Write `tools/icp-primer/.gitignore`**

```
# local python server state, editor swaps
*.swp
.DS_Store
__pycache__/
```

- [ ] **Step 3: Write `tools/icp-primer/README.md`**

```markdown
# ICP Primer (localhost)

A 10-minute primer on Internet Computer Protocol (ICP), built for Zaal
before prompting Caffeine.ai for the ZAO Stock 2026 NFT app.

## What's in it

5 lessons, top-to-bottom:

1. What ICP actually is (read-only)
2. Canisters 101 (live anonymous call to ICP Ledger)
3. Internet Identity live (real passkey login)
4. ICRC-7 NFTs live (real mainnet NFT read)
5. Pay-to-mint pattern (animated walkthrough)

## Run

```bash
cd tools/icp-primer
python3 -m http.server 8765
# open http://localhost:8765
```

That's it. No install. All ICP libraries load from esm.sh CDN.

## Tech

- Plain HTML + ES modules, no build step
- `@dfinity/agent@2`, `@dfinity/auth-client@2`, `@dfinity/candid@2`
- Theme: ZAO navy `#0a1628` + gold `#f5a623`

## Where this came from

- Spec: `docs/superpowers/specs/2026-04-23-icp-primer-localhost-design.md`
- Research context: `research/infrastructure/478-icp-caffeine-nft-purchase/`
```

- [ ] **Step 4: Verify files exist**

Run:
```bash
ls -la tools/icp-primer/ tools/icp-primer/widgets/
```

Expected: `.gitignore`, `README.md`, `widgets/.gitkeep` visible.

- [ ] **Step 5: Commit**

```bash
git add tools/icp-primer/
git commit -m "feat(icp-primer): scaffold directory + README"
```

---

## Task 2: Base HTML shell with 5 section placeholders

**Files:**
- Create: `tools/icp-primer/index.html`

- [ ] **Step 1: Write `tools/icp-primer/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>ICP Primer</title>
<link rel="stylesheet" href="styles.css" />
</head>
<body>
<header class="topbar">
  <div class="brand">ZAO - ICP Primer</div>
  <button id="ii-login" class="btn btn-gold">Login with Internet Identity</button>
</header>

<div id="offline-banner" class="banner banner-error" hidden>
  Can't reach ICP mainnet. Widgets disabled.
  <button id="offline-retry" class="btn btn-sm">Retry</button>
</div>

<main class="lessons">

  <section class="lesson" id="lesson-1">
    <div class="label">Lesson 1</div>
    <h2>What ICP actually is</h2>
    <ul class="hooks">
      <li>Cloud that's also a blockchain.</li>
      <li>Reverse gas: the app pays cycles, the user pays nothing.</li>
      <li>Frontend + backend + database all live in one canister on-chain.</li>
    </ul>
    <table class="compare">
      <thead><tr><th></th><th>Ethereum / Base</th><th>Internet Computer</th></tr></thead>
      <tbody>
        <tr><td>Identity</td><td>Wallet address</td><td>Principal</td></tr>
        <tr><td>Program</td><td>Smart contract</td><td>Canister (contract + server + db)</td></tr>
        <tr><td>Gas</td><td>User pays per tx</td><td>App prepays cycles</td></tr>
        <tr><td>Auth</td><td>MetaMask / seed phrase</td><td>Internet Identity (passkey)</td></tr>
        <tr><td>Hosting</td><td>Separate (Vercel, etc.)</td><td>Included in canister</td></tr>
      </tbody>
    </table>
  </section>

  <section class="lesson" id="lesson-2">
    <div class="label">Lesson 2</div>
    <h2>Canisters 101</h2>
    <ul class="hooks">
      <li>Canister = WASM module with its own state.</li>
      <li>Upgradeable, can hold terabytes, serves HTTP.</li>
    </ul>
    <div class="widget" id="widget-ping">
      <button class="btn btn-gold" id="ping-btn">Ping the ICP Ledger canister</button>
      <div class="widget-output" id="ping-output"></div>
    </div>
  </section>

  <section class="lesson" id="lesson-3">
    <div class="label">Lesson 3</div>
    <h2>Internet Identity live</h2>
    <ul class="hooks">
      <li>Passkey / Face ID. No seed phrase.</li>
      <li>Principal = your identity, scoped per app.</li>
    </ul>
    <div class="widget" id="widget-ii">
      <div class="widget-output" id="ii-output">Click "Login with Internet Identity" above to see your principal.</div>
    </div>
  </section>

  <section class="lesson" id="lesson-4">
    <div class="label">Lesson 4</div>
    <h2>ICRC-7 NFTs live</h2>
    <ul class="hooks">
      <li>ICRC-7 is the ICP equivalent of ERC-721.</li>
      <li>Every NFT lives inside a canister, queryable by anyone.</li>
    </ul>
    <div class="widget" id="widget-icrc7">
      <label for="icrc7-select">Pick a mainnet collection:</label>
      <select id="icrc7-select"></select>
      <button class="btn btn-gold" id="icrc7-btn">Read it</button>
      <div class="widget-output" id="icrc7-output"></div>
    </div>
  </section>

  <section class="lesson" id="lesson-5">
    <div class="label">Lesson 5</div>
    <h2>Pay-to-mint pattern</h2>
    <ul class="hooks">
      <li>ICRC-7 has no purchase primitive. You add one.</li>
      <li>Canister receives ICP via the ledger, verifies the block, then mints.</li>
    </ul>
    <div class="widget" id="widget-flow">
      <button class="btn btn-gold" id="flow-play">Play the flow</button>
      <svg id="flow-svg" viewBox="0 0 600 200" aria-hidden="true"></svg>
      <div class="widget-output" id="flow-caption">Press play to walk through the 4 steps.</div>
    </div>
    <p class="callout">This is what Caffeine.ai will scaffold when you prompt it for the ZAO Stock NFT sale.</p>
  </section>

</main>

<footer class="footer">
  Built 2026-04-23. Spec: <code>docs/superpowers/specs/2026-04-23-icp-primer-localhost-design.md</code>.
</footer>

<script type="module" src="primer.js"></script>
</body>
</html>
```

- [ ] **Step 2: Start server and verify shell loads**

Run:
```bash
cd tools/icp-primer && python3 -m http.server 8765 &
sleep 1 && curl -s http://localhost:8765 | head -20
```

Expected: HTML output starting with `<!DOCTYPE html>`.

- [ ] **Step 3: Open in browser (manual)**

Open `http://localhost:8765`. Expected: unstyled page with 5 visible lessons, empty select in Lesson 4, SVG empty rectangle in Lesson 5. Console errors about `styles.css` and `primer.js` not found are expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add tools/icp-primer/index.html
git commit -m "feat(icp-primer): base HTML shell with 5 lesson placeholders"
```

---

## Task 3: styles.css with ZAO theme

**Files:**
- Create: `tools/icp-primer/styles.css`

- [ ] **Step 1: Write `tools/icp-primer/styles.css`**

```css
:root {
  --navy: #0a1628;
  --navy-2: #0e1d35;
  --gold: #f5a623;
  --gold-dim: #b57c18;
  --text: #e8ecf3;
  --text-dim: #8a94a6;
  --error: #ff5c5c;
  --card: #10223c;
  --border: #1e324f;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--navy);
  color: var(--text);
  line-height: 1.5;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--navy-2);
  border-bottom: 1px solid var(--border);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.5px;
}

.banner {
  padding: 12px 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.banner-error {
  background: #3a1010;
  color: var(--error);
  border-bottom: 1px solid var(--error);
}

.btn {
  background: var(--gold);
  color: var(--navy);
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover { background: var(--gold-dim); }
.btn-gold { background: var(--gold); color: var(--navy); }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.lessons {
  max-width: 820px;
  margin: 24px auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lesson {
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--gold);
  border-radius: 8px;
  padding: 20px 24px;
}

.lesson h2 { margin: 8px 0 12px; color: var(--gold); }
.lesson .label {
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.hooks { padding-left: 18px; margin: 8px 0 16px; }
.hooks li { margin-bottom: 4px; }

.compare {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 14px;
}
.compare th, .compare td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
.compare th { color: var(--text-dim); font-weight: 500; }

.widget {
  margin-top: 12px;
  padding: 16px;
  background: var(--navy);
  border: 1px solid var(--border);
  border-radius: 6px;
}
.widget select, .widget label {
  margin-right: 8px;
  font-size: 14px;
}
.widget select {
  background: var(--navy-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
}
.widget-output {
  margin-top: 12px;
  font-family: "SF Mono", Monaco, monospace;
  font-size: 13px;
  color: var(--text-dim);
  white-space: pre-wrap;
  word-break: break-word;
}
.widget-output.error {
  color: var(--error);
  background: #220808;
  border: 1px solid var(--error);
  border-radius: 4px;
  padding: 10px;
}

.callout {
  margin-top: 12px;
  padding: 10px 14px;
  background: #1a2d4f;
  border-left: 3px solid var(--gold);
  color: var(--text);
  font-size: 14px;
  border-radius: 0 4px 4px 0;
}

.footer {
  max-width: 820px;
  margin: 32px auto;
  padding: 0 20px;
  font-size: 12px;
  color: var(--text-dim);
}

#flow-svg {
  width: 100%;
  height: 200px;
  background: var(--navy-2);
  border-radius: 4px;
  margin-top: 12px;
}

.token-card {
  display: inline-block;
  margin: 8px 8px 0 0;
  padding: 8px;
  background: var(--navy-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  width: 140px;
  vertical-align: top;
}
.token-card img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  background: #000;
  border-radius: 3px;
}
.token-card .tid {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 6px;
  word-break: break-all;
}
```

- [ ] **Step 2: Reload browser and verify**

Open `http://localhost:8765`. Expected: navy background, gold "ZAO - ICP Primer" brand top-left, sticky header with gold "Login with Internet Identity" button top-right, 5 cards with gold left border, readable text. Compare table in Lesson 1 renders. SVG box visible.

- [ ] **Step 3: Commit**

```bash
git add tools/icp-primer/styles.css
git commit -m "feat(icp-primer): ZAO navy/gold theme"
```

---

## Task 4: Shared state + error helpers

**Files:**
- Create: `tools/icp-primer/widgets/state.js`
- Create: `tools/icp-primer/widgets/error.js`

- [ ] **Step 1: Write `tools/icp-primer/widgets/state.js`**

```js
import { HttpAgent } from 'https://esm.sh/@dfinity/agent@2';

const IC_HOST = 'https://icp-api.io';

const state = {
  agent: null,
  authClient: null,
  identity: null,
};

export function getAnonymousAgent() {
  if (!state.agent) {
    state.agent = new HttpAgent({ host: IC_HOST });
  }
  return state.agent;
}

export function setAuthClient(authClient) {
  state.authClient = authClient;
  state.identity = authClient ? authClient.getIdentity() : null;
  window.dispatchEvent(new CustomEvent('ii:changed', {
    detail: { identity: state.identity },
  }));
}

export function clearAuthClient() {
  state.authClient = null;
  state.identity = null;
  window.dispatchEvent(new CustomEvent('ii:changed', {
    detail: { identity: null },
  }));
}

export function getAuthClient() {
  return state.authClient;
}

export function getIdentity() {
  return state.identity;
}

export const IC_HOST_URL = IC_HOST;
```

- [ ] **Step 2: Write `tools/icp-primer/widgets/error.js`**

```js
export async function wrapCall(fn, { outputEl, label }) {
  outputEl.classList.remove('error');
  outputEl.textContent = `Calling ${label}...`;
  try {
    const result = await fn();
    outputEl.classList.remove('error');
    return result;
  } catch (err) {
    renderError(outputEl, err, label);
    throw err;
  }
}

export function renderError(outputEl, err, label) {
  const message = err && err.message ? err.message : String(err);
  console.error(`[icp-primer] ${label} failed:`, err);
  outputEl.classList.add('error');
  outputEl.innerHTML = '';

  const p = document.createElement('div');
  p.textContent = `${label} failed: ${message}`;
  outputEl.appendChild(p);

  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.style.marginTop = '8px';
  btn.textContent = 'Copy debug info';
  btn.onclick = () => {
    const debug = JSON.stringify({
      label,
      message,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }, null, 2);
    navigator.clipboard.writeText(debug).then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy debug info'; }, 1500);
    });
  };
  outputEl.appendChild(btn);
}
```

- [ ] **Step 3: Verify no syntax errors**

Open the browser console on `http://localhost:8765` and run:
```js
await import('./widgets/state.js');
await import('./widgets/error.js');
```

Expected: both imports resolve to module objects without errors.

- [ ] **Step 4: Commit**

```bash
git add tools/icp-primer/widgets/state.js tools/icp-primer/widgets/error.js
git commit -m "feat(icp-primer): shared state + error helpers"
```

---

## Task 5: primer.js entry + offline banner

**Files:**
- Create: `tools/icp-primer/primer.js`

- [ ] **Step 1: Write `tools/icp-primer/primer.js`**

```js
import { IC_HOST_URL } from './widgets/state.js';

const banner = document.getElementById('offline-banner');
const retry = document.getElementById('offline-retry');

async function checkOnline() {
  try {
    const res = await fetch(`${IC_HOST_URL}/api/v2/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    banner.hidden = true;
    return true;
  } catch (err) {
    console.error('[icp-primer] mainnet check failed:', err);
    banner.hidden = false;
    return false;
  }
}

retry.addEventListener('click', () => {
  checkOnline();
});

await checkOnline();

// widgets wire up below as they land in later tasks
await import('./widgets/ping.js').catch((e) => console.error('ping load failed', e));
await import('./widgets/ii.js').catch((e) => console.error('ii load failed', e));
await import('./widgets/icrc7.js').catch((e) => console.error('icrc7 load failed', e));
await import('./widgets/flow.js').catch((e) => console.error('flow load failed', e));
```

- [ ] **Step 2: Reload + verify mainnet check**

Open `http://localhost:8765`. Expected: no offline banner (online). Console shows 4 `ping load failed` / `ii load failed` / etc. — those widget files don't exist yet; this is expected and will disappear as they're added. No other errors.

- [ ] **Step 3: Verify offline banner triggers**

In DevTools Network tab, set to "Offline". Hard refresh. Expected: red offline banner visible at top with "Retry" button. Click Retry with offline still on — banner remains. Toggle back online, click Retry — banner disappears.

- [ ] **Step 4: Commit**

```bash
git add tools/icp-primer/primer.js
git commit -m "feat(icp-primer): entry module + offline banner"
```

---

## Task 6: Lesson 2 ping widget (anonymous ICP Ledger call)

**Files:**
- Create: `tools/icp-primer/widgets/ping.js`

- [ ] **Step 1: Write `tools/icp-primer/widgets/ping.js`**

```js
import { Actor } from 'https://esm.sh/@dfinity/agent@2';
import { IDL } from 'https://esm.sh/@dfinity/candid@2';
import { getAnonymousAgent } from './state.js';
import { wrapCall } from './error.js';

const LEDGER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

const idlFactory = ({ IDL }) => IDL.Service({
  icrc1_name: IDL.Func([], [IDL.Text], ['query']),
  icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
  icrc1_total_supply: IDL.Func([], [IDL.Nat], ['query']),
});

const btn = document.getElementById('ping-btn');
const out = document.getElementById('ping-output');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  try {
    const actor = Actor.createActor(idlFactory, {
      agent: getAnonymousAgent(),
      canisterId: LEDGER_ID,
    });

    const [name, symbol, supply] = await wrapCall(
      () => Promise.all([
        actor.icrc1_name(),
        actor.icrc1_symbol(),
        actor.icrc1_total_supply(),
      ]),
      { outputEl: out, label: 'ICP Ledger query' }
    );

    out.classList.remove('error');
    out.textContent =
      `Ledger name:   ${name}\n` +
      `Symbol:        ${symbol}\n` +
      `Total supply:  ${supply.toString()} e8s\n` +
      `Canister:      ${LEDGER_ID}`;
  } catch (err) {
    // wrapCall already rendered the error
  } finally {
    btn.disabled = false;
  }
});
```

- [ ] **Step 2: Remove the primer.js catch stub note for ping**

No change — primer.js already dynamic-imports this module. Reload page.

- [ ] **Step 3: Verify live ping**

Open `http://localhost:8765`. Click "Ping the ICP Ledger canister" in Lesson 2. Expected output in the widget:
```
Ledger name:   Internet Computer
Symbol:        ICP
Total supply:  <some large number> e8s
Canister:      ryjl3-tyaaa-aaaaa-aaaba-cai
```

If the call fails, the error widget with "Copy debug info" button should render instead.

- [ ] **Step 4: Commit**

```bash
git add tools/icp-primer/widgets/ping.js
git commit -m "feat(icp-primer): lesson 2 live ICP ledger ping"
```

---

## Task 7: Lesson 3 Internet Identity login widget

**Files:**
- Create: `tools/icp-primer/widgets/ii.js`

- [ ] **Step 1: Write `tools/icp-primer/widgets/ii.js`**

```js
import { AuthClient } from 'https://esm.sh/@dfinity/auth-client@2';
import { setAuthClient, clearAuthClient, getIdentity } from './state.js';
import { renderError } from './error.js';

const II_URL = 'https://identity.ic0.app';
const MAX_TTL_NS = BigInt(7 * 24 * 60 * 60) * BigInt(1_000_000_000);

const btn = document.getElementById('ii-login');
const out = document.getElementById('ii-output');

let authClient = await AuthClient.create();

function truncatePrincipal(text) {
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

function renderLoggedIn(identity) {
  const principal = identity.getPrincipal().toText();
  out.classList.remove('error');
  out.textContent = '';

  const label = document.createElement('div');
  label.textContent = 'Your principal:';

  const code = document.createElement('div');
  code.style.marginTop = '6px';
  code.style.color = 'var(--gold)';
  code.title = principal;
  code.textContent = truncatePrincipal(principal);

  const logout = document.createElement('button');
  logout.className = 'btn btn-sm';
  logout.style.marginTop = '10px';
  logout.textContent = 'Logout';
  logout.onclick = async () => {
    await authClient.logout();
    clearAuthClient();
    renderLoggedOut();
  };

  out.append(label, code, logout);
  btn.textContent = 'Logged in';
  btn.disabled = true;
}

function renderLoggedOut() {
  btn.textContent = 'Login with Internet Identity';
  btn.disabled = false;
  out.classList.remove('error');
  out.textContent = 'Click "Login with Internet Identity" above to see your principal.';
}

if (await authClient.isAuthenticated()) {
  setAuthClient(authClient);
  renderLoggedIn(authClient.getIdentity());
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  btn.textContent = 'Opening II...';
  try {
    await new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: II_URL,
        maxTimeToLive: MAX_TTL_NS,
        onSuccess: resolve,
        onError: (msg) => reject(new Error(msg || 'Login failed')),
      });
    });
    setAuthClient(authClient);
    renderLoggedIn(authClient.getIdentity());
  } catch (err) {
    renderError(out, err, 'Internet Identity login');
    btn.disabled = false;
    btn.textContent = 'Login with Internet Identity';
  }
});
```

- [ ] **Step 2: Verify II login end-to-end (manual)**

Reload `http://localhost:8765`. Click "Login with Internet Identity" in the top bar. Expected: II popup opens at `https://identity.ic0.app`. Complete auth with an existing anchor or create a new one. After success: popup closes, top-bar button shows "Logged in" (disabled), Lesson 3 widget shows truncated principal in gold + "Logout" button.

- [ ] **Step 3: Verify persistence across refresh**

Hard-refresh the page. Expected: Lesson 3 widget still shows the logged-in state (II auth persists in IndexedDB via AuthClient).

- [ ] **Step 4: Verify logout**

Click "Logout" in Lesson 3. Expected: widget reverts to "Click Login..." message, top-bar button re-enables.

- [ ] **Step 5: Commit**

```bash
git add tools/icp-primer/widgets/ii.js
git commit -m "feat(icp-primer): lesson 3 internet identity login"
```

---

## Task 8: Lesson 4 ICRC-7 live read widget

**Files:**
- Create: `tools/icp-primer/widgets/icrc7.js`
- Modify: `tools/icp-primer/widgets/icrc7.js` (if canister IDs need adjustment during manual verify)

- [ ] **Step 1: Write `tools/icp-primer/widgets/icrc7.js`**

```js
import { Actor } from 'https://esm.sh/@dfinity/agent@2';
import { IDL } from 'https://esm.sh/@dfinity/candid@2';
import { getAnonymousAgent } from './state.js';
import { wrapCall } from './error.js';

// Candidate mainnet ICRC-7 canisters. If a given canister doesn't implement
// the full ICRC-7 surface the widget will show the error for that collection
// and let the user pick another. Update this list during manual verification.
const COLLECTIONS = [
  { id: '6uwoh-vaaaa-aaaap-ahjvq-cai', label: 'ICRC-7 collection A (verify live)' },
  { id: 'vvimt-yqaaa-aaaal-amjda-cai', label: 'ICRC-7 collection B (verify live)' },
  { id: 'jzg4e-6iaaa-aaaal-ajvsa-cai', label: 'ICRC-7 collection C (verify live)' },
];

const idlFactory = ({ IDL }) => {
  // Minimal Value variant — covers the common metadata payloads we render.
  const Value = IDL.Rec();
  Value.fill(
    IDL.Variant({
      Nat: IDL.Nat,
      Int: IDL.Int,
      Text: IDL.Text,
      Blob: IDL.Vec(IDL.Nat8),
      Array: IDL.Vec(Value),
      Map: IDL.Vec(IDL.Tuple(IDL.Text, Value)),
    })
  );
  const MetadataEntry = IDL.Tuple(IDL.Text, Value);
  return IDL.Service({
    icrc7_name: IDL.Func([], [IDL.Text], ['query']),
    icrc7_total_supply: IDL.Func([], [IDL.Nat], ['query']),
    icrc7_tokens: IDL.Func(
      [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
      [IDL.Vec(IDL.Nat)],
      ['query']
    ),
    icrc7_token_metadata: IDL.Func(
      [IDL.Vec(IDL.Nat)],
      [IDL.Vec(IDL.Opt(IDL.Vec(MetadataEntry)))],
      ['query']
    ),
  });
};

const select = document.getElementById('icrc7-select');
const btn = document.getElementById('icrc7-btn');
const out = document.getElementById('icrc7-output');

for (const c of COLLECTIONS) {
  const opt = document.createElement('option');
  opt.value = c.id;
  opt.textContent = `${c.label} (${c.id})`;
  select.appendChild(opt);
}

function pickImageUri(entries) {
  if (!entries) return null;
  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey.includes('image') || lowerKey.includes('url') || lowerKey.includes('uri'))) continue;
    if ('Text' in value) {
      const text = value.Text;
      if (text.startsWith('http://') || text.startsWith('https://')) return text;
    }
  }
  return null;
}

function renderTokens(name, supply, tokens, metadata) {
  out.classList.remove('error');
  out.innerHTML = '';

  const header = document.createElement('div');
  header.textContent = `Collection:   ${name}\nTotal supply: ${supply.toString()}\nShowing first ${tokens.length} token IDs:`;
  header.style.whiteSpace = 'pre';
  out.appendChild(header);

  const wrap = document.createElement('div');
  wrap.style.marginTop = '12px';
  for (let i = 0; i < tokens.length; i++) {
    const tokenId = tokens[i];
    const entries = metadata[i] && metadata[i].length > 0 ? metadata[i][0] : null;
    const img = pickImageUri(entries);

    const card = document.createElement('div');
    card.className = 'token-card';

    if (img) {
      const el = document.createElement('img');
      el.src = img;
      el.alt = `token ${tokenId}`;
      el.onerror = () => { el.style.display = 'none'; };
      card.appendChild(el);
    } else {
      const ph = document.createElement('div');
      ph.style.cssText = 'height:100px;background:#000;border-radius:3px;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:11px';
      ph.textContent = 'no http image';
      card.appendChild(ph);
    }

    const tid = document.createElement('div');
    tid.className = 'tid';
    tid.textContent = `#${tokenId.toString()}`;
    card.appendChild(tid);

    wrap.appendChild(card);
  }
  out.appendChild(wrap);
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  const canisterId = select.value;
  try {
    const actor = Actor.createActor(idlFactory, {
      agent: getAnonymousAgent(),
      canisterId,
    });

    const result = await wrapCall(
      async () => {
        const [name, supply, tokens] = await Promise.all([
          actor.icrc7_name(),
          actor.icrc7_total_supply(),
          actor.icrc7_tokens([], [BigInt(3)]),
        ]);
        const metadata = tokens.length
          ? await actor.icrc7_token_metadata(tokens)
          : [];
        return { name, supply, tokens, metadata };
      },
      { outputEl: out, label: `ICRC-7 ${canisterId}` }
    );

    renderTokens(result.name, result.supply, result.tokens, result.metadata);
  } catch (err) {
    // wrapCall rendered error
  } finally {
    btn.disabled = false;
  }
});
```

- [ ] **Step 2: Verify canister IDs live (manual)**

Open `http://localhost:8765`. For each of the 3 collections in the dropdown, select it and click "Read it". Expected: at least one returns a collection name + supply + 3 token cards. If all three fail:
1. Look up verified ICRC-7 mainnet collections via https://dashboard.internetcomputer.org or the Dfinity forum.
2. Edit `COLLECTIONS` array in `widgets/icrc7.js` — replace the failing IDs with known-good ones + readable labels.
3. Reload + retry. Proceed only when at least one collection renders tokens successfully.

- [ ] **Step 3: Commit**

```bash
git add tools/icp-primer/widgets/icrc7.js
git commit -m "feat(icp-primer): lesson 4 live ICRC-7 NFT read"
```

---

## Task 9: Lesson 5 pay-to-mint SVG animation

**Files:**
- Create: `tools/icp-primer/widgets/flow.js`

- [ ] **Step 1: Write `tools/icp-primer/widgets/flow.js`**

```js
const svg = document.getElementById('flow-svg');
const btn = document.getElementById('flow-play');
const caption = document.getElementById('flow-caption');

const NS = 'http://www.w3.org/2000/svg';

const NODES = [
  { x: 60, y: 100, label: 'User' },
  { x: 220, y: 100, label: 'ICP Ledger' },
  { x: 380, y: 100, label: 'ZAO Canister' },
  { x: 540, y: 100, label: 'NFT' },
];

const STEPS = [
  { from: 0, to: 1, text: 'Step 1: User sends 1 ICP to the ZAO canister principal (via ledger).' },
  { from: 1, to: 2, text: 'Step 2: Ledger writes the transfer block. Canister learns the block index.' },
  { from: 2, to: 2, text: 'Step 3: Canister verifies the block amount + memo = valid purchase.' },
  { from: 2, to: 3, text: 'Step 4: Canister calls its own icrcX_mint(tokenId, metadata) to the user principal.' },
];

function buildSvg() {
  svg.innerHTML = '';

  // arrows (drawn first so they sit under node circles)
  for (let i = 0; i < NODES.length - 1; i++) {
    const a = NODES[i];
    const b = NODES[i + 1];
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', a.x + 28);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x - 28);
    line.setAttribute('y2', b.y);
    line.setAttribute('stroke', '#1e324f');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('data-edge', String(i));
    svg.appendChild(line);
  }

  // nodes
  NODES.forEach((n, i) => {
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', n.x);
    circle.setAttribute('cy', n.y);
    circle.setAttribute('r', '28');
    circle.setAttribute('fill', '#10223c');
    circle.setAttribute('stroke', '#1e324f');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('data-node', String(i));
    svg.appendChild(circle);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', n.x);
    text.setAttribute('y', n.y + 4);
    text.setAttribute('fill', '#e8ecf3');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '11');
    text.textContent = n.label;
    svg.appendChild(text);
  });
}

function highlightStep(idx) {
  // reset
  svg.querySelectorAll('[data-node]').forEach((el) => {
    el.setAttribute('fill', '#10223c');
    el.setAttribute('stroke', '#1e324f');
  });
  svg.querySelectorAll('[data-edge]').forEach((el) => {
    el.setAttribute('stroke', '#1e324f');
    el.setAttribute('stroke-width', '2');
  });

  const step = STEPS[idx];
  const fromNode = svg.querySelector(`[data-node="${step.from}"]`);
  const toNode = svg.querySelector(`[data-node="${step.to}"]`);
  if (fromNode) fromNode.setAttribute('stroke', '#f5a623');
  if (toNode) toNode.setAttribute('stroke', '#f5a623');

  if (step.from !== step.to) {
    const edgeIdx = Math.min(step.from, step.to);
    const edge = svg.querySelector(`[data-edge="${edgeIdx}"]`);
    if (edge) {
      edge.setAttribute('stroke', '#f5a623');
      edge.setAttribute('stroke-width', '3');
    }
  }

  caption.textContent = step.text;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let playing = false;
btn.addEventListener('click', async () => {
  if (playing) return;
  playing = true;
  btn.disabled = true;
  btn.textContent = 'Playing...';
  buildSvg();
  for (let i = 0; i < STEPS.length; i++) {
    highlightStep(i);
    await sleep(1400);
  }
  caption.textContent = 'Done. This is what Caffeine will scaffold for the ZAO Stock sale.';
  btn.textContent = 'Play again';
  btn.disabled = false;
  playing = false;
});

// initial static render
buildSvg();
```

- [ ] **Step 2: Verify animation**

Reload `http://localhost:8765`. Scroll to Lesson 5. Click "Play the flow". Expected: 4 nodes render in the SVG (User -> ICP Ledger -> ZAO Canister -> NFT). On play, each step highlights one node pair in gold for ~1.4s, caption updates with the step text. After step 4 the caption shows "Done. This is what Caffeine will scaffold...", button shows "Play again". Clicking again replays the sequence.

- [ ] **Step 3: Commit**

```bash
git add tools/icp-primer/widgets/flow.js
git commit -m "feat(icp-primer): lesson 5 pay-to-mint SVG walkthrough"
```

---

## Task 10: Final verification pass + manual test script

**Files:** none modified — verification only.

- [ ] **Step 1: Restart the server fresh**

```bash
pkill -f "python3 -m http.server 8765" 2>/dev/null
cd tools/icp-primer && python3 -m http.server 8765 &
sleep 1
```

- [ ] **Step 2: Run the full manual test script**

Open `http://localhost:8765` with a hard refresh (Cmd+Shift+R). Walk through every check:

1. Network tab: `icp-api.io/api/v2/status` returns 200 on load.
2. Offline banner hidden.
3. Lesson 1: 3-bullet hooks + 5-row compare table render.
4. Lesson 2: click "Ping the ICP Ledger" -> see name + symbol + supply text output.
5. Lesson 3: pre-login shows "Click Login..." message.
6. Top bar: click "Login with Internet Identity" -> II popup opens -> complete login.
7. After login: Lesson 3 shows truncated principal in gold + "Logout".
8. Refresh page: Lesson 3 still logged in (IndexedDB persistence).
9. Lesson 4: dropdown has 3 collections. Pick one, click "Read it" -> see name + supply + 3 token cards. If all 3 collections fail, swap IDs per Task 8 Step 2.
10. Lesson 5: click "Play the flow" -> 4-step highlight animation runs.
11. DevTools -> Offline mode -> reload -> offline banner visible + widgets still present but live calls fail via `wrapCall` error render.
12. Click "Copy debug info" on an error -> clipboard contains JSON with label/message/userAgent/timestamp.
13. Back online + Retry -> banner hides.

- [ ] **Step 3: Cross-browser smoke**

Open `http://localhost:8765` in Safari and Firefox. In each: verify the page loads, II login completes, and 1 Lesson 4 read succeeds. Fix any browser-specific break if it hits.

- [ ] **Step 4: Secrets scan**

Run:
```bash
grep -rE '[0-9a-fA-F]{64}' tools/icp-primer/ || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Commit any test-driven fixes**

If Step 2 or 3 found issues you fixed in widget code, commit them now:

```bash
git add tools/icp-primer/
git commit -m "fix(icp-primer): manual verification fixes"
```

If no fixes were needed, skip.

---

## Task 11: Cross-link research doc 478 and close the loop

**Files:**
- Modify: `research/infrastructure/478-icp-caffeine-nft-purchase/README.md`

- [ ] **Step 1: Add primer pointer to doc 478**

Open `research/infrastructure/478-icp-caffeine-nft-purchase/README.md`. After the "Next Actions" section, append:

```markdown
## Warm-up: Local ICP Primer

Before prompting Caffeine, run the local primer at `tools/icp-primer/`:

```
cd tools/icp-primer && python3 -m http.server 8765
# open http://localhost:8765
```

5 lessons in ~10 minutes: what ICP is, canisters, live Internet Identity login,
live ICRC-7 NFT read, pay-to-mint walkthrough. Spec at
`docs/superpowers/specs/2026-04-23-icp-primer-localhost-design.md`.
Plan at `docs/superpowers/plans/2026-04-23-icp-primer-localhost.md`.
```

- [ ] **Step 2: Commit**

```bash
git add research/infrastructure/478-icp-caffeine-nft-purchase/README.md
git commit -m "docs(research): link ICP primer tool from doc 478"
```

- [ ] **Step 3: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "tools: ICP primer localhost teach page" --body "$(cat <<'EOF'
## Summary
- Adds `tools/icp-primer/` static HTML primer with 5 lessons on Internet Computer Protocol
- Live widgets: anonymous ICP Ledger ping, Internet Identity login, ICRC-7 NFT read, pay-to-mint SVG walkthrough
- Zero build: `python3 -m http.server 8765` inside the folder
- Cross-links research doc 478 (ICP + Caffeine NFT research)

## Test plan
- [ ] `cd tools/icp-primer && python3 -m http.server 8765` and open http://localhost:8765
- [ ] Lessons 1 renders with compare table
- [ ] Lesson 2: ledger ping returns name/symbol/supply
- [ ] Lesson 3: Internet Identity popup completes + principal shows + persists refresh
- [ ] Lesson 4: at least one collection renders 3 token cards
- [ ] Lesson 5: SVG animation plays all 4 steps
- [ ] DevTools offline: banner shows + widgets error cleanly
EOF
)"
```

---

## Self-Review

**Spec coverage check (skimmed against design doc):**

| Spec section | Covered by |
|--------------|-----------|
| File layout `tools/icp-primer/` | Task 1 |
| Tech stack (CDN libs) | Tasks 4, 6, 7, 8 (imports) |
| ZAO navy/gold theme | Task 3 |
| Linear scroll layout | Task 2 |
| Lesson 1 (read-only, compare table) | Task 2 HTML |
| Lesson 2 (canister ping) | Task 6 |
| Lesson 3 (II login) | Task 7 |
| Lesson 4 (ICRC-7 live read) | Task 8 |
| Lesson 5 (pay-to-mint SVG) | Task 9 |
| state.js shared singleton | Task 4 |
| error.js wrapCall + copy debug info | Task 4 |
| Offline detection banner | Task 5 |
| Error table (II cancel, canister throw, rate limit) | Task 4 `wrapCall` catches all; Task 7 handles cancel specifically |
| Manual test script | Task 10 Step 2 |
| Ship checklist | Task 10 Steps 2-4 + Task 11 push/PR |
| Secrets scan | Task 10 Step 4 |
| Cross-link to doc 478 | Task 11 |
| Graduation path note | Out of scope for this plan — covered in spec document itself |

**Placeholder scan:** No "TBD" / "TODO" / "similar to" / vague "add validation" text in tasks. Task 8 Step 2 calls out a specific contingency (canister ID swap) with an explicit procedure — not a placeholder.

**Type/symbol consistency check:** `getAnonymousAgent`, `setAuthClient`, `clearAuthClient`, `getIdentity`, `IC_HOST_URL` defined in Task 4, used consistently in Tasks 5, 6, 7, 8. `wrapCall({ outputEl, label })` signature matches in Tasks 6 and 8. `renderError(outputEl, err, label)` matches in Task 7. `#ping-btn`, `#ping-output`, `#ii-login`, `#ii-output`, `#icrc7-select`, `#icrc7-btn`, `#icrc7-output`, `#flow-play`, `#flow-svg`, `#flow-caption`, `#offline-banner`, `#offline-retry` — all defined in Task 2 HTML, referenced correctly in later widget tasks.

---
