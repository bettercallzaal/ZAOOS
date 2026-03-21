import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

export const SOLANA_NETWORK = 'mainnet-beta' as const;
export const SOLANA_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);

export function getSolanaWallets() {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];
}
