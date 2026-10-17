/**
 * Farcaster hub reads: a member's verified Ethereum addresses and profile.
 *
 * Keyless HTTP API. The default hub is the one ZAOOS uses as its first hub
 * (`src/lib/farcaster/signer-provenance.ts` DEFAULT_HUB_URL). Response shapes
 * checked live against it on 2026-10-17.
 *
 * `null` means the hub could not be read. An empty array means it was read and
 * the FID has no verified Ethereum addresses. Callers must not treat the two
 * the same.
 */

export const DEFAULT_HUB_URL = 'https://haatz.quilibrium.com';
const MAX_PAGES = 5;

export type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

interface HubOptions {
  hubUrl?: string;
  fetcher?: Fetcher;
}

interface HubMessage {
  data?: {
    verificationAddAddressBody?: { address?: string; protocol?: string };
    userDataBody?: { type?: string; value?: string };
  };
}

interface HubPage {
  messages?: HubMessage[];
  nextPageToken?: string;
}

async function readPages(path: string, opts: HubOptions): Promise<HubMessage[] | null> {
  const hubUrl = (opts.hubUrl || DEFAULT_HUB_URL).replace(/\/$/, '');
  const fetcher: Fetcher = opts.fetcher ?? ((url) => fetch(url, { cache: 'no-store' }));
  const out: HubMessage[] = [];
  let pageToken = '';
  for (let page = 0; page < MAX_PAGES; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${hubUrl}${path}${pageToken ? `${sep}pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    try {
      const res = await fetcher(url);
      if (!res.ok) return null;
      const body = (await res.json()) as HubPage;
      if (!body || !Array.isArray(body.messages)) return null;
      out.push(...body.messages);
      if (!body.nextPageToken) return out;
      pageToken = body.nextPageToken;
    } catch {
      return null;
    }
  }
  return out;
}

/** Verified Ethereum addresses for a FID, lowercased. `null` = hub unreadable. */
export async function getVerifiedEthAddresses(
  fid: number,
  opts: HubOptions = {},
): Promise<string[] | null> {
  const messages = await readPages(`/v1/verificationsByFid?fid=${fid}`, opts);
  if (messages === null) return null;
  const addresses = new Set<string>();
  for (const m of messages) {
    const body = m.data?.verificationAddAddressBody;
    if (body?.protocol === 'PROTOCOL_ETHEREUM' && body.address) {
      addresses.add(body.address.toLowerCase());
    }
  }
  return [...addresses];
}

export interface HubProfile {
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

/** Username, display name and avatar. Missing or unreadable fields are null. */
export async function getProfile(fid: number, opts: HubOptions = {}): Promise<HubProfile> {
  const messages = (await readPages(`/v1/userDataByFid?fid=${fid}`, opts)) ?? [];
  const profile: HubProfile = { username: null, displayName: null, pfpUrl: null };
  for (const m of messages) {
    const body = m.data?.userDataBody;
    if (!body?.value) continue;
    if (body.type === 'USER_DATA_TYPE_USERNAME') profile.username = body.value;
    else if (body.type === 'USER_DATA_TYPE_DISPLAY') profile.displayName = body.value;
    else if (body.type === 'USER_DATA_TYPE_PFP') profile.pfpUrl = body.value;
  }
  return profile;
}
