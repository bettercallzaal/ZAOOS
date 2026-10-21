'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { parseAbi, verifyMessage } from 'viem';
import { useAccount, useReadContracts, useSignMessage } from 'wagmi';
import { optimism } from 'wagmi/chains';
import { communityConfig } from '@/../community.config';
import { readMemberBalances } from '@/lib/respect/onchainBalances';
import { buildSignInMessage, formatRespect, TCG_DROP } from '@/lib/tcg/drop';

const ogAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
const zorAbi = parseAbi(['function balanceOf(address, uint256) view returns (uint256)']);

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function RespectBalances({ address }: { address: `0x${string}` }) {
  const { respect } = communityConfig;
  const { data, isPending, isError } = useReadContracts({
    allowFailure: true,
    contracts: [
      {
        chainId: optimism.id,
        address: respect.ogContract,
        abi: ogAbi,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        chainId: optimism.id,
        address: respect.zorContract,
        abi: zorAbi,
        functionName: 'balanceOf',
        args: [address, respect.zorTokenId],
      },
    ],
  });

  if (isPending) return <p className="text-gray-400 text-sm">Reading Respect on Optimism...</p>;

  // A failed read is shown as unknown, never as 0 (same rule as the Respect sync).
  const balances = data && !isError ? readMemberBalances(data[0], data[1]) : null;
  const show = (key: 'og' | 'zor', value: number) =>
    !balances || balances.failed.includes(key) ? 'Could not read' : formatRespect(value);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">OG Respect</div>
        <div className="text-[#f5a623] text-lg font-bold font-mono">
          {show('og', balances?.onchainOg ?? 0)}
        </div>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">ZOR Respect</div>
        <div className="text-white text-lg font-bold font-mono">
          {show('zor', balances?.onchainZor ?? 0)}
        </div>
      </div>
    </div>
  );
}

export default function TcgDropClient() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [signedFor, setSignedFor] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const signedIn = !!address && signedFor === address;

  async function handleSignIn() {
    if (!address) return;
    setSignError(null);
    try {
      const message = buildSignInMessage(address, newNonce(), new Date());
      const signature = await signMessageAsync({ message });
      const valid = await verifyMessage({ address, message, signature });
      if (valid) setSignedFor(address);
      else setSignError('That signature did not match this wallet.');
    } catch (error: unknown) {
      setSignError(
        error instanceof Error ? error.message.split('\n')[0] : 'Signing was cancelled.',
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 max-w-md mx-auto">
      <p className="text-[#f5a623] text-xs uppercase tracking-wider mb-2">The ZAO</p>
      <h1 className="text-2xl font-bold text-white mb-2">{TCG_DROP.cardName}</h1>
      <p className="text-gray-400 text-sm mb-6">
        Buy {TCG_DROP.song.title} by {TCG_DROP.song.artist} on WaveZ Station and get:
      </p>

      <ul className="space-y-2 mb-6">
        {TCG_DROP.perks.map((perk) => (
          <li
            key={perk}
            className="bg-[#0d1b2a] rounded-xl px-4 py-3 border border-white/[0.08] text-sm text-white"
          >
            {perk}
          </li>
        ))}
      </ul>

      <a
        href={TCG_DROP.song.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3 rounded-xl bg-[#f5a623] text-[#0a1628] font-bold text-sm text-center mb-8"
      >
        Buy the song on WaveZ Station
      </a>

      <div className="aspect-[5/7] w-full rounded-2xl border border-dashed border-[#f5a623]/40 flex flex-col items-center justify-center text-center p-6 mb-2">
        <p className="text-white font-semibold mb-1">Card art coming soon</p>
        <p className="text-gray-400 text-sm">
          Art by {TCG_DROP.cardArtist.name} ({TCG_DROP.cardArtist.handle})
        </p>
      </div>
      <p className="text-gray-500 text-xs text-center mb-8">
        Song by {TCG_DROP.song.artist}. Card art by {TCG_DROP.cardArtist.name}.
      </p>

      <section className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-4">
        <h2 className="text-white font-semibold">Your ZAO Respect</h2>
        {!isConnected || !address ? (
          <>
            <p className="text-gray-400 text-sm">
              Connect a wallet to see your Respect. Reading it is free and sends nothing.
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  type="button"
                  onClick={openConnectModal}
                  className="w-full py-3 rounded-xl border border-[#f5a623]/40 text-[#f5a623] font-medium text-sm hover:bg-[#f5a623]/10"
                >
                  Connect wallet
                </button>
              )}
            </ConnectButton.Custom>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-xs font-mono break-all">{address}</p>
            <RespectBalances address={address} />
            {signedIn ? (
              <p className="text-green-400 text-sm">Signed in. This wallet is yours.</p>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigning}
                className="w-full py-3 rounded-xl bg-[#1a2a3a] text-white font-medium text-sm disabled:opacity-50"
              >
                {isSigning ? 'Check your wallet...' : 'Sign in (free, no transaction)'}
              </button>
            )}
            {signError && <p className="text-red-400 text-xs">{signError}</p>}
          </>
        )}
      </section>
    </div>
  );
}
