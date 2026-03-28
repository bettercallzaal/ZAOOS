import { TurboFactory } from '@ardrive/turbo-sdk';
import { Readable } from 'stream';

/** Matches JWKInterface from @ardrive/turbo-sdk (RSA-PSS private key for Arweave) */
interface ArweaveJWK {
  kty: string;
  e: string;
  n: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
}

const UDL_LICENSE_TX = 'yRj4a5KMctX_uOmKWCFJIjmY8DeJcusVk6-HzLiM_t8';

export const LICENSE_PRESETS = {
  community: {
    'Commercial-Use': 'Allowed-With-Credit',
    'Derivation': 'Allowed-With-Credit',
  },
  collectible: {
    'Commercial-Use': 'Allowed-With-Credit',
    'Derivation': 'Allowed-With-RevenueShare-25%',
  },
  premium: {
    'Commercial-Use': 'Disallowed',
    'Derivation': 'Disallowed',
    'Access-Fee': 'One-Time-0.001',
  },
  open: {
    'Commercial-Use': 'Allowed',
    'Derivation': 'Allowed',
  },
} as const;

export type LicensePreset = keyof typeof LICENSE_PRESETS;

function getTurboClient() {
  const keyStr = process.env.ARWEAVE_WALLET_KEY;
  if (!keyStr) throw new Error('ARWEAVE_WALLET_KEY not configured');

  let jwk: ArweaveJWK;
  try {
    jwk = JSON.parse(keyStr) as ArweaveJWK;
  } catch {
    jwk = JSON.parse(Buffer.from(keyStr, 'base64').toString('utf-8')) as ArweaveJWK;
  }

  return TurboFactory.authenticated({ privateKey: jwk });
}

export interface UploadResult {
  txId: string;
  url: string;
  arUri: string;
}

export async function uploadToArweave(
  buffer: Buffer,
  contentType: string,
  tags: { name: string; value: string }[]
): Promise<UploadResult> {
  const turbo = getTurboClient();

  const receipt = await turbo.uploadFile({
    fileStreamFactory: () => Readable.from(buffer),
    fileSizeFactory: () => buffer.length,
    dataItemOpts: {
      tags: [
        { name: 'Content-Type', value: contentType },
        ...tags,
      ],
    },
  });

  return {
    txId: receipt.id,
    url: `https://arweave.net/${receipt.id}`,
    arUri: `ar://${receipt.id}`,
  };
}

export function buildMusicTags(opts: {
  title: string;
  artist: string;
  genre?: string;
  description?: string;
  coverTxId?: string;
  licensePreset: LicensePreset;
}): { name: string; value: string }[] {
  const licenseTags = LICENSE_PRESETS[opts.licensePreset];

  const tags: { name: string; value: string }[] = [
    { name: 'App-Name', value: 'ZAO-OS' },
    { name: 'App-Version', value: '1.0.0' },
    { name: 'Type', value: 'music-track' },
    { name: 'Title', value: opts.title },
    { name: 'Artist', value: opts.artist },
    { name: 'License', value: UDL_LICENSE_TX },
  ];

  if (opts.genre) tags.push({ name: 'Genre', value: opts.genre });
  if (opts.description) tags.push({ name: 'Description', value: opts.description });
  if (opts.coverTxId) tags.push({ name: 'Thumbnail', value: opts.coverTxId });

  for (const [key, value] of Object.entries(licenseTags)) {
    tags.push({ name: key, value });
  }

  return tags;
}

export function isArweaveConfigured(): boolean {
  return !!process.env.ARWEAVE_WALLET_KEY;
}
