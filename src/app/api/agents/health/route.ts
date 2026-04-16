import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/agents/health
 *
 * Pre-flight check: verify all agent infrastructure is configured
 * before funding wallets or enabling trading.
 * No auth required -- read-only status check.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Privy configured?
  checks.privy = {
    ok: !!(process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET),
    detail: process.env.PRIVY_APP_ID
      ? `App ID: ${process.env.PRIVY_APP_ID.slice(0, 8)}...`
      : 'PRIVY_APP_ID missing',
  };

  // 2. Wallet IDs set?
  const wallets = ['VAULT', 'BANKER', 'DEALER'] as const;
  for (const name of wallets) {
    const key = `${name}_WALLET_ID`;
    const val = process.env[key];
    checks[`wallet_${name.toLowerCase()}`] = {
      ok: !!val,
      detail: val ? `${val.slice(0, 8)}...` : `${key} missing`,
    };
  }

  // 3. 0x API key?
  checks.zx_api = {
    ok: !!process.env.ZX_API_KEY,
    detail: process.env.ZX_API_KEY
      ? `Key: ${process.env.ZX_API_KEY.slice(0, 8)}...`
      : 'ZX_API_KEY missing',
  };

  // 4. Supabase agent_config table exists + has rows?
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('agent_config')
      .select('name, trading_enabled, wallet_address')
      .order('name');

    if (error) {
      checks.supabase = { ok: false, detail: `Query failed: ${error.message}` };
    } else if (!data || data.length === 0) {
      checks.supabase = { ok: false, detail: 'agent_config table empty. Run seed-agent-config.sql' };
    } else {
      checks.supabase = { ok: true, detail: `${data.length} agents configured` };
      for (const row of data) {
        checks[`config_${row.name.toLowerCase()}`] = {
          ok: row.trading_enabled && !!row.wallet_address,
          detail: `trading=${row.trading_enabled}, wallet=${row.wallet_address ? 'set' : 'empty'}`,
        };
      }
    }
  } catch (err) {
    checks.supabase = {
      ok: false,
      detail: err instanceof Error ? err.message : 'Supabase connection failed',
    };
  }

  // 5. Cron secret?
  checks.cron_secret = {
    ok: !!process.env.CRON_SECRET,
    detail: process.env.CRON_SECRET ? 'Set' : 'CRON_SECRET missing',
  };

  // 6. Farcaster posting?
  checks.farcaster = {
    ok: !!(process.env.ZAO_OFFICIAL_SIGNER_UUID && process.env.ZAO_OFFICIAL_NEYNAR_API_KEY),
    detail: process.env.ZAO_OFFICIAL_SIGNER_UUID ? 'Signer configured' : 'ZAO_OFFICIAL_SIGNER_UUID missing (posts will silently fail)',
  };

  // Summary
  const total = Object.keys(checks).length;
  const passing = Object.values(checks).filter((c) => c.ok).length;
  const allOk = passing === total;

  return NextResponse.json({
    status: allOk ? 'ready' : 'not_ready',
    passing: `${passing}/${total}`,
    checks,
    action: allOk
      ? 'All checks pass. Fund wallets and enable trading.'
      : 'Fix failing checks before activating agents.',
  });
}
