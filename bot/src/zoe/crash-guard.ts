/**
 * crash-guard.ts - fail-loud process lifecycle and crash reporting for ZOE.
 *
 * Requirements:
 * 1. An uncaught exception or fatal rejection sends an emergency alert to Zaal
 *    on Telegram before exiting, so a crash is a message on his phone, not a
 *    silent gap in the journal.
 * 2. On SIGTERM/SIGINT (e.g. autodeploy or service restart), cleans up and
 *    exits 0, preventing systemd from reporting status 143 as an exit-code failure.
 */

export interface CrashGuardDeps {
  botToken?: string;
  zaalId?: number;
  onExit?: (code: number) => void;
  fetchFn?: typeof fetch;
}

export function formatCrashAlert(err: unknown, unit = 'zoe-bot'): string {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(1, 4).join('\n') : '';
  const now = new Date().toISOString();
  return (
    `ALERT: ${unit} CRASHED at ${now}\n` +
    `Error: ${message}\n` +
    (stack ? `Stack:\n${stack}\n` : '') +
    `Supervisor (systemd) will restart unit with backoff.`
  );
}

export async function sendEmergencyAlert(
  text: string,
  deps: CrashGuardDeps = {},
): Promise<boolean> {
  const token =
    deps.botToken ||
    process.env.ZOE_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN;
  const chatId =
    deps.zaalId ||
    Number(process.env.ZAAL_TELEGRAM_ID || process.env.DEV_TELEGRAM_ID);
  if (!token || !chatId) return false;

  const fetchImpl = deps.fetchFn || globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
      }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function installCrashGuard(deps: CrashGuardDeps = {}): () => void {
  const exitFn = deps.onExit || ((code: number) => process.exit(code));
  let isExiting = false;

  const onUncaughtException = (err: Error) => {
    if (isExiting) return;
    isExiting = true;
    console.error('[zoe/crash-guard] uncaughtException:', err);
    const alertText = formatCrashAlert(err);
    void sendEmergencyAlert(alertText, deps).finally(() => {
      exitFn(1);
    });
  };

  const onUnhandledRejection = (reason: unknown) => {
    console.error('[zoe/crash-guard] unhandledRejection:', reason);
    const alertText = formatCrashAlert(reason);
    void sendEmergencyAlert(alertText, deps);
  };

  const onSigterm = () => {
    console.log('[zoe/crash-guard] SIGTERM received - shutting down cleanly');
    exitFn(0);
  };

  const onSigint = () => {
    console.log('[zoe/crash-guard] SIGINT received - shutting down cleanly');
    exitFn(0);
  };

  process.on('uncaughtException', onUncaughtException);
  process.on('unhandledRejection', onUnhandledRejection);
  process.on('SIGTERM', onSigterm);
  process.on('SIGINT', onSigint);

  return () => {
    process.off('uncaughtException', onUncaughtException);
    process.off('unhandledRejection', onUnhandledRejection);
    process.off('SIGTERM', onSigterm);
    process.off('SIGINT', onSigint);
  };
}
