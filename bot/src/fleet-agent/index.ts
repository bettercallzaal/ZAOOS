/**
 * zao-fleet-agent — host supervisor for the cowork control plane (doc 800 Phase 2).
 *
 * Why it exists: a *stopped* bot can't poll for its own "start", so one tiny
 * always-on agent polls the host command queue and runs the lifecycle op. It is
 * deliberately minimal and SAFE:
 *   - It only ever runs `systemctl --user <op> <unit>` via execFile (NO shell),
 *     where <op> is whitelisted to start|stop|restart and <unit> is whitelisted
 *     to the three known units. Nothing from the command is interpolated into a
 *     shell; an unknown op or unit is refused.
 *   - It pulls only host-scoped commands (?scope=host), authed by its own "fleet"
 *     bot token, and reports each outcome back.
 *
 * Per CLAUDE.md ("no new agent process without a doc + Zaal approval"), this ships
 * disabled. Enable it explicitly (see the handoff). It uses the shared cowork
 * client, so its env is COWORK_API_URL + COWORK_BOT_TOKEN (the fleet token).
 */
import { config as loadEnv } from 'dotenv';
loadEnv();

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { coworkEnabled, getHostCommands, postCommandResult, type BotCommand } from '../lib/cowork';

const execFileAsync = promisify(execFile);

// Hard whitelist — the entire authority of this agent.
const ALLOWED_OPS = new Set(['start', 'stop', 'restart']);
const UNIT_BY_BOT: Record<string, string> = {
  zoe: 'zoe-bot',
  zaodevz: 'zao-devz-stack',
  zaostock: 'zaostock-bot',
};
const ALLOWED_UNITS = new Set(Object.values(UNIT_BY_BOT));

const POLL_MS = Number(process.env.FLEET_POLL_MS ?? '15000');

async function runOp(op: string, unit: string): Promise<{ ok: boolean; output: string }> {
  if (!ALLOWED_OPS.has(op)) return { ok: false, output: `op not allowed: ${op}` };
  if (!ALLOWED_UNITS.has(unit)) return { ok: false, output: `unit not allowed: ${unit}` };
  try {
    // Fixed arg vector, no shell: the op + unit are both whitelisted literals.
    const { stdout, stderr } = await execFileAsync('systemctl', ['--user', op, unit], {
      timeout: 30_000,
    });
    return { ok: true, output: `${stdout}${stderr}`.trim() || `${op} ${unit} ok` };
  } catch (err) {
    return { ok: false, output: err instanceof Error ? err.message : 'systemctl failed' };
  }
}

async function handle(cmd: BotCommand): Promise<void> {
  const unit = UNIT_BY_BOT[cmd.bot] ?? '';
  if (!unit) {
    await postCommandResult(cmd.id, 'error', { error: `unknown bot: ${cmd.bot}` });
    return;
  }
  const r = await runOp(cmd.command, unit);
  console.log(`[fleet-agent] ${cmd.command} ${unit} -> ${r.ok ? 'ok' : 'error'}: ${r.output}`);
  await postCommandResult(cmd.id, r.ok ? 'done' : 'error', { unit, output: r.output });
}

async function tick(): Promise<void> {
  try {
    const res = await getHostCommands();
    if (!res.ok || !res.data?.commands?.length) return;
    for (const cmd of res.data.commands) {
      await handle(cmd);
    }
  } catch (err) {
    console.error('[fleet-agent] tick error:', err instanceof Error ? err.message : err);
  }
}

async function main(): Promise<void> {
  if (!coworkEnabled()) {
    console.error('[fleet-agent] COWORK_API_URL / COWORK_BOT_TOKEN not set - refusing to start.');
    process.exit(1);
  }
  console.log(`[fleet-agent] starting - polling host commands every ${POLL_MS}ms`);
  await tick();
  setInterval(() => void tick(), POLL_MS);
}

void main();
