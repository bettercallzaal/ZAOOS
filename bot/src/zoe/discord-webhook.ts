/**
 * Discord webhook poster for ZOE status feed parity (doc 1135 Stage 1a).
 *
 * Posts ZOE status updates (morning brief, research publish, agent ticks) to a
 * Discord channel via an incoming webhook. Zero Discord bot required — just an
 * HTTP POST to a webhook URL.
 *
 * Activation: set DISCORD_WEBHOOK_STATUS env var to the webhook URL from
 * Discord Server Settings → Integrations → Webhooks → Create webhook → Copy URL.
 * No-ops silently when the env var is unset (PR-only; activates after Zaal's Stage 0).
 */

const ZAO_GOLD = 0xf5a623;

export interface DiscordStatusMessage {
  title: string;
  body: string;
  emoji?: string;
  fields?: Array<{ name: string; value: string }>;
}

/**
 * Post a status embed to the configured Discord webhook channel.
 * Returns true on success, false on any error (caller should log, not throw).
 */
export async function postStatusToDiscord(msg: DiscordStatusMessage): Promise<boolean> {
  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_STATUS;
  if (!WEBHOOK_URL) return false;

  const label = msg.emoji ? `${msg.emoji} ${msg.title}` : msg.title;

  const embed: Record<string, unknown> = {
    title: label,
    description: msg.body.slice(0, 4096),
    color: ZAO_GOLD,
    timestamp: new Date().toISOString(),
  };

  if (msg.fields?.length) {
    embed.fields = msg.fields.map((f) => ({ name: f.name, value: f.value.slice(0, 1024), inline: true }));
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      console.error(`[zoe/discord-webhook] post failed: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[zoe/discord-webhook] post error:', (err as Error).message);
    return false;
  }
}

/**
 * Convenience wrapper: post a morning brief (or any long text) as a Discord embed.
 * Truncates the body to Discord's 4096-char embed description limit.
 */
export async function postBriefToDiscord(briefText: string): Promise<boolean> {
  return postStatusToDiscord({
    title: 'ZOE Morning Brief',
    body: briefText,
    emoji: '☀️',
  });
}
