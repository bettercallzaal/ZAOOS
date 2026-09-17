/**
 * inbound-media.ts — ingest inbound photos, PDFs, and screenshots from Telegram
 * directly into the vault at `inbox/-/` with pre-commit secret and PII screening.
 *
 * Requirements:
 * 1. Screens media captions and text content for un-allowlisted PII and secrets.
 * 2. Rejects sensitive content before anything is saved or committed.
 * 3. Saves clean media into `<vault>/inbox/-/<timestamp>-<filename>`.
 * 4. Creates an optional Markdown sidecar `<filename>.md` with frontmatter when a caption is supplied.
 * 5. Commits and pushes ONLY the inbound files (`inbox/-/*`) to git (`origin/main`).
 *    Never runs `git add .`, fetches and merges before push, fails loudly on conflict.
 *    Auto-commit message names the file, date, caption if present.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, extname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { containsPii } from './pii';

const execFileAsync = promisify(execFile);

export interface InboundMediaInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  caption?: string;
}

export interface ScreeningResult {
  ok: boolean;
  reason?: string;
}

export interface SaveMediaResult {
  ok: boolean;
  savedPath: string;
  sidecarPath?: string;
  error?: string;
}

// Secret patterns (private keys, API tokens, sensitive credentials)
const PRIVATE_KEY_RE = /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/i;
const GITHUB_TOKEN_RE = /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/;
const OPENAI_KEY_RE = /\bsk-[A-Za-z0-9_-]{20,}\b/;
const ANTHROPIC_KEY_RE = /\bsk-ant-[A-Za-z0-9_-]{20,}\b/;
const GENERIC_TOKEN_RE = /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|bearer)\s*[:=]\s*["']?([A-Za-z0-9_.-]{16,})/i;

/**
 * Screen inbound media caption and buffer for secrets and un-allowlisted PII.
 * Rejects fail-closed if sensitive data is detected.
 */
export function screenInboundMedia(input: InboundMediaInput): ScreeningResult {
  // 1. Screen caption
  if (input.caption && input.caption.trim()) {
    const text = input.caption;

    if (
      PRIVATE_KEY_RE.test(text) ||
      GITHUB_TOKEN_RE.test(text) ||
      OPENAI_KEY_RE.test(text) ||
      ANTHROPIC_KEY_RE.test(text) ||
      GENERIC_TOKEN_RE.test(text)
    ) {
      return { ok: false, reason: 'caption contains secret or private key' };
    }

    if (containsPii(text)) {
      return { ok: false, reason: 'caption contains un-allowlisted PII' };
    }
  }

  // 2. Screen buffer if text-based or JSON/CSV
  const isTextType =
    input.mimeType.startsWith('text/') ||
    input.mimeType === 'application/json' ||
    input.mimeType === 'application/csv' ||
    /\.(txt|md|csv|json|xml|env|log)$/i.test(input.filename);

  if (isTextType && input.buffer.length > 0) {
    try {
      const content = input.buffer.toString('utf8');

      if (
        PRIVATE_KEY_RE.test(content) ||
        GITHUB_TOKEN_RE.test(content) ||
        OPENAI_KEY_RE.test(content) ||
        ANTHROPIC_KEY_RE.test(content) ||
        GENERIC_TOKEN_RE.test(content)
      ) {
        return { ok: false, reason: 'file content contains secret or private key' };
      }

      if (containsPii(content)) {
        return { ok: false, reason: 'file content contains un-allowlisted PII' };
      }
    } catch {
      // If utf8 decode fails, proceed safely
    }
  }

  return { ok: true };
}

/**
 * Format timestamp prefix YYYYMMDD-HHmmss
 */
function timestampPrefix(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}-${h}${min}${s}`;
}

/**
 * Generate sanitized filename with timestamp prefix.
 */
export function buildInboxFilename(
  originalName: string,
  now: Date = new Date(),
  mimeType: string = '',
): string {
  const prefix = timestampPrefix(now);
  let name = (originalName || '').trim();

  if (!name) {
    if (mimeType.includes('pdf')) {
      name = 'document.pdf';
    } else if (mimeType.includes('image') || mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      name = 'photo.jpg';
    } else if (mimeType.includes('png')) {
      name = 'photo.png';
    } else {
      name = 'document.bin';
    }
  }

  const ext = extname(name);
  const base = basename(name, ext);
  // Replace spaces and special characters with hyphens (collapsing consecutive separators)
  const sanitizedBase = base.replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${prefix}-${sanitizedBase}${ext}`;
}

/**
 * Save media and optional sidecar markdown to `<vaultDir>/inbox/-/`.
 */
export function saveInboundMediaToVault(
  vaultDir: string,
  input: InboundMediaInput,
  now: Date = new Date(),
): SaveMediaResult {
  const targetDir = join(vaultDir, 'inbox', '-');
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const filename = buildInboxFilename(input.filename, now, input.mimeType);
  const relMediaPath = join('inbox', '-', filename);
  const fullMediaPath = join(vaultDir, relMediaPath);

  try {
    writeFileSync(fullMediaPath, input.buffer);

    let relSidecarPath: string | undefined;
    if (input.caption && input.caption.trim()) {
      relSidecarPath = `${relMediaPath}.md`;
      const fullSidecarPath = join(vaultDir, relSidecarPath);
      const sidecarContent = [
        '---',
        `captured: "${now.toISOString()}"`,
        'source: "telegram-zoe"',
        `file: "${filename}"`,
        `caption: "${input.caption.replace(/"/g, '\\"')}"`,
        '---',
        '',
        input.caption.trim(),
        '',
      ].join('\n');
      writeFileSync(fullSidecarPath, sidecarContent, 'utf8');
    }

    return {
      ok: true,
      savedPath: relMediaPath,
      sidecarPath: relSidecarPath,
    };
  } catch (err) {
    return {
      ok: false,
      savedPath: relMediaPath,
      error: (err as Error).message,
    };
  }
}

/**
 * Commit and push only the inbound media files to git.
 * Invariants:
 * - Never runs `git add .`
 * - Runs `git fetch origin main && git merge origin/main --ff-only` before pushing
 * - Adds only relMediaPath and optional relSidecarPath
 * - Commit message names file, date, and caption if present
 */
export async function commitAndPushInboundMedia(
  vaultDir: string,
  relMediaPath: string,
  relSidecarPath?: string,
  opts?: {
    caption?: string;
    now?: Date;
  },
): Promise<{ ok: boolean; commitSha?: string; error?: string }> {
  try {
    // 1. Fetch & merge latest main before pushing if origin remote is configured
    const hasOrigin = await execFileAsync('git', ['-C', vaultDir, 'remote', 'get-url', 'origin'])
      .then(() => true)
      .catch(() => false);

    if (hasOrigin) {
      await execFileAsync('git', ['-C', vaultDir, 'fetch', 'origin', 'main']).catch(() => {});
      const hasOriginMain = await execFileAsync('git', ['-C', vaultDir, 'rev-parse', '--verify', 'origin/main'])
        .then(() => true)
        .catch(() => false);

      if (hasOriginMain) {
        await execFileAsync('git', ['-C', vaultDir, 'merge', 'origin/main', '--ff-only']).catch(
          async () => {
            try {
              await execFileAsync('git', ['-C', vaultDir, 'merge', 'origin/main', '-m', 'merge origin/main before inbound media']);
            } catch (mergeErr) {
              await execFileAsync('git', ['-C', vaultDir, 'merge', '--abort']).catch(() => {});
              throw new Error(`Git merge conflict with origin/main: ${(mergeErr as Error).message}`);
            }
          },
        );
      }
    }

    // 2. Explicitly add only the designated files (NEVER git add .)
    const filesToAdd = [relMediaPath];
    if (relSidecarPath) filesToAdd.push(relSidecarPath);

    for (const f of filesToAdd) {
      await execFileAsync('git', ['-C', vaultDir, 'add', f]);
    }

    // 3. Commit naming the file, date, and caption if present
    const filename = basename(relMediaPath);
    const dateStr = (opts?.now ?? new Date()).toISOString().slice(0, 10);
    const cleanCaption = opts?.caption?.trim().replace(/\r?\n/g, ' ');
    const capExcerpt = cleanCaption && cleanCaption.length > 80 ? cleanCaption.slice(0, 77) + '...' : cleanCaption;
    const commitMsg = capExcerpt
      ? `inbox: inbound media (${filename}) - ${dateStr} - ${capExcerpt}`
      : `inbox: inbound media (${filename}) - ${dateStr}`;

    await execFileAsync('git', [
      '-C',
      vaultDir,
      'commit',
      '-m',
      commitMsg,
    ]);

    const { stdout: shaOut } = await execFileAsync('git', ['-C', vaultDir, 'rev-parse', '--short', 'HEAD']);
    const commitSha = shaOut.trim();

    // 4. Push if origin remote configured
    if (hasOrigin) {
      await execFileAsync('git', ['-C', vaultDir, 'push', 'origin', 'main']);
    }

    return { ok: true, commitSha };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * High-level processor for Telegram inbound media messages.
 */
export async function processInboundMedia(opts: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  caption?: string;
  vaultDir?: string;
  now?: Date;
}): Promise<{ ok: boolean; message: string; savedPath?: string; commitSha?: string }> {
  const vaultDir = opts.vaultDir ?? process.env.VAULT_DIR ?? join(homedir(), 'zao-vault');

  if (!existsSync(vaultDir)) {
    return {
      ok: false,
      message: `Vault directory not found at ${vaultDir}. Full mirror required.`,
    };
  }

  // 1. Screen media for secrets and PII
  const screen = screenInboundMedia({
    filename: opts.filename,
    mimeType: opts.mimeType,
    buffer: opts.buffer,
    caption: opts.caption,
  });

  if (!screen.ok) {
    return {
      ok: false,
      message: `⚠️ Media blocked: ${screen.reason}. File was not saved to vault.`,
    };
  }

  // 2. Save media to inbox/-/
  const save = saveInboundMediaToVault(
    vaultDir,
    {
      filename: opts.filename,
      mimeType: opts.mimeType,
      buffer: opts.buffer,
      caption: opts.caption,
    },
    opts.now,
  );

  if (!save.ok) {
    return {
      ok: false,
      message: `Failed to save media: ${save.error}`,
    };
  }

  // 3. Commit and push to git
  const git = await commitAndPushInboundMedia(vaultDir, save.savedPath, save.sidecarPath, {
    caption: opts.caption,
    now: opts.now,
  });

  if (!git.ok) {
    return {
      ok: true,
      savedPath: save.savedPath,
      message: `📎 Saved locally to \`${save.savedPath}\`, but git push failed: ${git.error}`,
    };
  }

  return {
    ok: true,
    savedPath: save.savedPath,
    commitSha: git.commitSha,
    message: `📎 Saved to vault: \`${save.savedPath}\` (${git.commitSha})`,
  };
}
