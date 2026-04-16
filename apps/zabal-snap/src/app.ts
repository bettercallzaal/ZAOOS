import { Hono } from 'hono';
import { registerSnapHandler } from '@farcaster/snap-hono';
import { getDashboardData, getTopRecipients } from './token.js';
import { buildDashboardPage } from './pages/dashboard.js';
import { buildActivityPage } from './pages/activity.js';

const app = new Hono();

function getBaseUrl(req: Request): string {
  if (process.env.SNAP_PUBLIC_BASE_URL) {
    return process.env.SNAP_PUBLIC_BASE_URL;
  }
  const forwarded = req.headers.get('x-forwarded-host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  if (forwarded) {
    return `${proto}://${forwarded}`;
  }
  const host = req.headers.get('host') ?? 'localhost:3003';
  return `http://${host}`;
}

// ── Dashboard (landing page) ───────────────────────────────

registerSnapHandler(app, async (ctx) => {
  const baseUrl = getBaseUrl(ctx.request);

  if (ctx.action.type === 'get') {
    const data = await getDashboardData();
    return buildDashboardPage(data, baseUrl);
  }

  // POST to root = "Back" from activity page
  const data = await getDashboardData();
  return buildDashboardPage(data, baseUrl);
});

// ── Activity page ──────────────────────────────────────────

registerSnapHandler(
  app,
  async (ctx) => {
    const baseUrl = getBaseUrl(ctx.request);
    const recipients = await getTopRecipients(5);
    return buildActivityPage(recipients, baseUrl);
  },
  { path: '/activity' },
);

export default app;
