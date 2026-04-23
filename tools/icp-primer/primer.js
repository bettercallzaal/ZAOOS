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
