/**
 * NameStone API client for gasless ENS subnames under thezao.eth
 *
 * Docs: https://namestone.com/docs
 * All subnames are off-chain (CCIP-Read / ERC-3668) — zero gas.
 */

import { ENV } from '@/lib/env';

const NAMESTONE_BASE = 'https://namestone.xyz/api/public_v1';
const DOMAIN = 'thezao.eth';

function getHeaders(): HeadersInit {
  const key = ENV.NAMESTONE_API_KEY;
  if (!key) throw new Error('NAMESTONE_API_KEY not configured');
  return {
    'Content-Type': 'application/json',
    'Authorization': key,
  };
}

// ── Validation ──

const NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

export function isValidSubname(name: string): boolean {
  if (name.length < 1 || name.length > 63) return false;
  if (name.length === 1) return /^[a-z0-9]$/.test(name);
  return NAME_REGEX.test(name);
}

export function sanitizeSubname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

// ── Types ──

export interface NameStoneSubname {
  name: string;
  domain: string;
  address: string;
  text_records?: Record<string, string>;
}

export interface NameStoneResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

// ── Create ──

export async function createSubname(
  name: string,
  address: string,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean; fullName: string; error?: string }> {
  const sanitized = sanitizeSubname(name);
  if (!isValidSubname(sanitized)) {
    return { success: false, fullName: '', error: `Invalid subname: "${name}"` };
  }

  const fullName = `${sanitized}.${DOMAIN}`;

  try {
    const res = await fetch(`${NAMESTONE_BASE}/set-name`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        domain: DOMAIN,
        name: sanitized,
        address,
        text_records: textRecords || {},
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, fullName, error: `NameStone API error (${res.status}): ${body}` };
    }

    return { success: true, fullName };
  } catch (err) {
    return { success: false, fullName, error: `NameStone request failed: ${(err as Error).message}` };
  }
}

// ── Create with conflict resolution ──

export async function createSubnameWithFallback(
  name: string,
  address: string,
  zid: number | null,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean; fullName: string; error?: string }> {
  // Try primary name first
  const result = await createSubname(name, address, textRecords);
  if (result.success) return result;

  // If conflict and we have a ZID, try name-zid
  if (zid && result.error?.includes('409')) {
    const fallback = `${sanitizeSubname(name)}-${zid}`;
    return createSubname(fallback, address, textRecords);
  }

  return result;
}

// ── Batch Create ──

export async function batchCreateSubnames(
  names: { name: string; address: string; zid: number | null; textRecords?: Record<string, string> }[],
): Promise<{ created: string[]; failed: { name: string; error: string }[] }> {
  const created: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const entry of names) {
    const result = await createSubnameWithFallback(
      entry.name,
      entry.address,
      entry.zid,
      entry.textRecords,
    );
    if (result.success) {
      created.push(result.fullName);
    } else {
      failed.push({ name: entry.name, error: result.error || 'Unknown error' });
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  return { created, failed };
}

// ── List ──

export async function listSubnames(): Promise<NameStoneSubname[]> {
  try {
    const res = await fetch(
      `${NAMESTONE_BASE}/get-names?domain=${DOMAIN}`,
      { headers: getHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ── Search ──

export async function searchSubnames(query: string): Promise<NameStoneSubname[]> {
  try {
    const res = await fetch(
      `${NAMESTONE_BASE}/search-names?domain=${DOMAIN}&name=${encodeURIComponent(query)}`,
      { headers: getHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ── Delete ──

export async function deleteSubname(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${NAMESTONE_BASE}/delete-name`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ domain: DOMAIN, name: sanitizeSubname(name) }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Delete failed (${res.status}): ${body}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── Update (delete + recreate) ──

export async function updateSubname(
  oldName: string,
  newName: string,
  address: string,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean; fullName: string; error?: string }> {
  const delResult = await deleteSubname(oldName);
  if (!delResult.success) {
    return { success: false, fullName: '', error: `Failed to delete old name: ${delResult.error}` };
  }

  return createSubname(newName, address, textRecords);
}

// ── Build default text records for a member ──

export function buildMemberTextRecords(member: {
  username?: string | null;
  pfpUrl?: string | null;
  bio?: string | null;
}): Record<string, string> {
  const records: Record<string, string> = {};
  if (member.username) records.url = `https://zaoos.com/members/${member.username}`;
  if (member.pfpUrl) records.avatar = member.pfpUrl;
  records.description = member.bio || 'ZAO Member';
  return records;
}
