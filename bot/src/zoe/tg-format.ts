/**
 * tg-format.ts - make ZOE's outbound text readable in Telegram.
 *
 * WHY: ZOE's replies are written by a model that thinks in Markdown, and the
 * bot sends them with no parse_mode, so Telegram shows the raw characters:
 * `**bold**`, `## Heading`, and pipe tables that wrap into noise on a phone.
 * Zaal, 4 Nov 2026, of a markdown table: "I can't read this at all in
 * telegram". Vault decisions item 193 puts readable formatting right after the
 * alarm and planner fixes.
 *
 * WHAT: v1 converts to plain text that reads well with NO parse_mode, so
 * nothing can fail to parse (a bad entity makes Telegram reject the whole
 * send):
 *   - pipe tables become one line per row, "Header: value; Header: value"
 *   - **bold**, __bold__, `code` and heading hashes lose their markers
 *   - fenced code keeps its content and drops the ``` lines
 *   - [text](url) becomes "text (url)"
 *   - "* item" bullets become "- item"; a --- rule line is dropped
 * A payload that already sets parse_mode or entities is the sender's own
 * formatting and passes untouched (needs-zaal-digest.ts sends Markdown).
 *
 * WHERE: at egress, as a Bot API transformer, the same placement and the same
 * reason as installAgentMarkupGuard (agent-markup.ts): a boundary each caller
 * must remember is a boundary one caller forgets.
 */

import type { Bot, Context } from 'grammy';

const SEPARATOR_ROW = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 2;
}

function cells(line: string): string[] {
  return line.trim().slice(1, -1).split('|').map((c) => inline(c.trim()));
}

/** A block of consecutive pipe-table lines, rendered one line per data row. */
function renderTable(lines: string[]): string[] {
  const rows = lines.filter((l) => !SEPARATOR_ROW.test(l)).map(cells);
  const hasHeader = lines.length > 1 && SEPARATOR_ROW.test(lines[1]);
  if (!hasHeader) return rows.map((r) => `- ${r.filter(Boolean).join('; ')}`);
  const [head, ...body] = rows;
  if (body.length === 0) return [head.filter(Boolean).join('; ')];
  return body.map((r) => {
    const parts = r.map((v, i) => (head[i] ? `${head[i]}: ${v}` : v)).filter((p) => p.replace(/:\s*$/, '').length > 0);
    return `- ${parts.join('; ')}`;
  });
}

function inline(line: string): string {
  return line
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/(^|[^\w])__([^_\n]+)__(?=[^\w]|$)/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1');
}

/**
 * Markdown to Telegram-readable plain text. Pure. Text with no Markdown comes
 * back unchanged, so the transformer is a no-op on plain sends.
 */
export function toTelegramPlain(text: string): string {
  const out: string[] = [];
  const lines = text.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    if (isTableRow(line)) {
      const block: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) block.push(lines[i++]);
      i--;
      out.push(...renderTable(block));
      continue;
    }
    // A horizontal rule (---, ***, ___) is decoration; it reads as noise.
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
      // Dropping it can leave two blank lines in a row; keep one.
      if (out.length > 0 && out[out.length - 1].trim() === '' && lines[i + 1]?.trim() === '') i++;
      continue;
    }
    const heading = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      out.push(inline(heading[1]));
      continue;
    }
    out.push(inline(line.replace(/^(\s*)\*\s+/, '$1- ')));
  }
  return out.join('\n');
}

const TEXT_FIELDS = {
  sendMessage: 'text',
  editMessageText: 'text',
  sendPhoto: 'caption',
  sendDocument: 'caption',
  sendVideo: 'caption',
} as const;

/** The rewritten body for one outbound payload, or null to pass it as is. Pure. */
export function formatOutboundPayload(method: string, payload: Record<string, unknown>): { field: string; text: string } | null {
  const field = TEXT_FIELDS[method as keyof typeof TEXT_FIELDS];
  if (!field) return null;
  if (payload.parse_mode !== undefined || payload.entities !== undefined || payload.caption_entities !== undefined) return null;
  const body = payload[field];
  if (typeof body !== 'string') return null;
  const text = toTelegramPlain(body);
  return text === body ? null : { field, text };
}

/** Install on ZOE's bot at boot, beside installAgentMarkupGuard. */
export function installTelegramFormat(bot: Bot<Context>): void {
  bot.api.config.use(async (prev, method, payload, signal) => {
    const p = payload as Record<string, unknown>;
    const change = formatOutboundPayload(method, p);
    if (change) p[change.field] = change.text;
    return prev(method, payload, signal);
  });
}
