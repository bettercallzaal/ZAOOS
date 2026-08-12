/**
 * bus-upload.ts - upload files to the DreamNet federation bus.
 *
 * Tenant-side file upload for the DreamNet federation canary. Wraps the bus
 * `/files/upload` endpoint and computes a sha256 hash over the exact bytes
 * sent - our own copy so the later verification against a receipt is
 * meaningful (we trust our own hash more than a partner's report of what we sent).
 *
 * This is PURE except for the network call and file I/O. The hash computation
 * happens locally before any send, and is returned alongside the bus response
 * so the caller can verify a receipt's contentHash against it later.
 *
 * HONEST WHEN UNCONFIGURED. Like bus-send.ts, if BUS_URL / BUS_TOKEN are not
 * set, this returns a clear message showing what would have been sent, rather
 * than silently failing.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { BusConfig } from './bus-send';
import { busConfig, busConfigured } from './bus-send';

export interface FileUploadResult {
  ok: boolean;
  /** The message to show Zaal or a handler. Always present. */
  reply: string;
  /** Bus response ID, if upload succeeded. */
  fileId?: string;
  /** The sha256 hash we computed locally over the exact bytes sent. */
  sha256?: string;
  /** Set when upload failed or was impossible, for logs. */
  reason?: string;
}

/**
 * Upload a local file to the bus and return both the bus response and the
 * sha256 hash computed locally. The hash is what makes verification meaningful:
 * when a receipt arrives claiming a contentHash, we compare against our own
 * hash, not what the partner claims to have received.
 *
 * `filePath` must be readable as binary. The file's full contents are hashed
 * and sent; the hash is computed over exactly those bytes, so a receipt
 * claiming a different hash proves tampering.
 */
export async function uploadFileToBus(
  filePath: string,
  filename: string,
  cfg: BusConfig = busConfig(),
  readFileImpl: typeof readFile = readFile,
  fetchImpl: typeof fetch = fetch,
): Promise<FileUploadResult> {
  if (!filename || filename.trim().length === 0) {
    return { ok: false, reply: 'Filename cannot be empty.', reason: 'empty_filename' };
  }

  if (!busConfigured(cfg)) {
    return {
      ok: false,
      reason: 'unconfigured',
      reply:
        'Bus not connected - BUS_URL and BUS_TOKEN are not set, so this did not upload.\n\n' +
        `Would have uploaded ${filename} from ${filePath}\n\n` +
        'Set both on the VPS and try again.',
    };
  }

  try {
    const fileBytes = await readFileImpl(filePath);
    const sha256 = createHash('sha256').update(fileBytes).digest('hex');

    const res = await fetchImpl(`${cfg.url!.replace(/\/$/, '')}/files/upload?name=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${cfg.token}`,
      },
      body: fileBytes,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return {
        ok: false,
        reason: `http ${res.status}`,
        reply: `Bus rejected the upload (${res.status}). The file is safe - try again or check the bus.`,
      };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    const fileId = data.id ? String(data.id) : undefined;
    const idDisplay = fileId ? ` (id ${fileId.slice(0, 8)})` : '';

    return {
      ok: true,
      reply: `Uploaded ${filename}${idDisplay}.`,
      fileId,
      sha256,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        reason: 'timeout',
        reply: 'Upload timed out. The file is safe - try again.',
      };
    }
    const msg = err instanceof Error ? err.message : 'request failed';
    return {
      ok: false,
      reason: msg,
      reply: `Could not upload to the bus: ${msg.slice(0, 120)}\n\nThe file is safe - try again.`,
    };
  }
}

/**
 * Compute sha256 over a local file without uploading. Useful for testing or
 * for pre-computing a hash before deciding whether to upload.
 */
export async function hashFile(
  filePath: string,
  readFileImpl: typeof readFile = readFile,
): Promise<string> {
  const fileBytes = await readFileImpl(filePath);
  return createHash('sha256').update(fileBytes).digest('hex');
}
