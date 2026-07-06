import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { base, mainnet, optimism } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';

export function getWagmiConfig() {
  return createConfig({
    chains: [mainnet, base, optimism],
    connectors: [
      injected(),
      ...(projectId ? [walletConnect({ projectId })] : []),
      coinbaseWallet({ appName: 'ZAO OS' }),
    ],
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [optimism.id]: http(),
    },
  });
}
