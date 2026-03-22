'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { optimism } from 'viem/chains';

const HATS_CONTRACT = '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137' as const;

// Minimal ABI for mintHat — just the function we need
const MINT_HAT_ABI = [
  {
    name: 'mintHat',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_hatId', type: 'uint256' },
      { name: '_wearer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface HatNode {
  id: string;
  prettyId: string;
  label: string;
  maxSupply: number;
  supply: number;
  isActive: boolean;
  children: HatNode[];
}

interface TreeData {
  treeId: number;
  root: HatNode | null;
  totalHats: number;
}

function flattenTree(node: HatNode): HatNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

export default function HatManager() {
  const { address, isConnected, chain } = useAccount();
  const [tree, setTree] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Mint form state
  const [selectedHat, setSelectedHat] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [mintSuccess, setMintSuccess] = useState('');

  // Wagmi write contract
  const { data: txHash, writeContract, isPending: isMinting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Load tree data
  useEffect(() => {
    fetch('/api/hats/tree')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setTree)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Check if connected wallet is a Configurator
  useEffect(() => {
    if (!address) {
      queueMicrotask(() => setIsAdmin(false));
      return;
    }
    fetch(`/api/hats/check?wallet=${address}`)
      .then((res) => res.json())
      .then((data) => {
        const roles: { label: string }[] = data.roles || [];
        setIsAdmin(roles.some((r) =>
          r.label === 'Configurator' || r.label === 'ZAO'
        ));
      })
      .catch(() => setIsAdmin(false));
  }, [address]);

  // Show success on confirmation
  useEffect(() => {
    if (isConfirmed) {
      queueMicrotask(() => {
        setMintSuccess(`Hat minted successfully! Tx: ${txHash?.slice(0, 10)}...`);
        setMintAddress('');
      });
      // Refresh tree data
      fetch('/api/hats/tree')
        .then((res) => res.json())
        .then(setTree)
        .catch(() => {});
    }
  }, [isConfirmed, txHash]);

  const handleMint = () => {
    if (!selectedHat || !mintAddress || !isConnected) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(mintAddress)) {
      setError('Invalid wallet address');
      return;
    }

    setError('');
    setMintSuccess('');
    writeContract({
      address: HATS_CONTRACT,
      abi: MINT_HAT_ABI,
      functionName: 'mintHat',
      args: [BigInt(selectedHat), mintAddress as `0x${string}`],
      chainId: optimism.id,
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading hat management...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-sm text-gray-400 mb-2">Connect your wallet to manage hats</p>
        <p className="text-xs text-gray-600">Only Configurator hat wearers can mint and manage hats.</p>
      </div>
    );
  }

  if (chain?.id !== optimism.id) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-6 border border-yellow-500/30 text-center">
        <p className="text-sm text-yellow-400">Switch to Optimism to manage hats</p>
        <p className="text-xs text-gray-500 mt-1">Hat management requires Optimism network.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-sm text-gray-400">You don&apos;t have Configurator access</p>
        <p className="text-xs text-gray-600 mt-1">
          Only Top Hat or Configurator wearers can manage hats.
        </p>
      </div>
    );
  }

  const allHats = tree?.root ? flattenTree(tree.root).filter((h) => h.isActive) : [];

  return (
    <div className="space-y-6">
      {/* Admin status */}
      <div className="bg-[#f5a623]/10 rounded-xl p-4 border border-[#f5a623]/30">
        <div className="flex items-center gap-2">
          <span className="text-[#f5a623] text-sm font-medium">Configurator Access</span>
          <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded-full">Active</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      {/* Mint Hat Form */}
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Mint Hat to Address</p>

        <select
          value={selectedHat}
          onChange={(e) => setSelectedHat(e.target.value)}
          className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 border-0 focus:ring-1 focus:ring-[#f5a623]"
        >
          <option value="">Select a hat...</option>
          {allHats.map((hat) => (
            <option key={hat.id} value={hat.id}>
              {hat.label} ({hat.supply}/{hat.maxSupply})
            </option>
          ))}
        </select>

        <input
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          placeholder="Recipient wallet address (0x...)"
          className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
        />

        {selectedHat && (
          <div className="text-[10px] text-gray-600">
            {(() => {
              const hat = allHats.find((h) => h.id === selectedHat);
              if (!hat) return null;
              if (hat.supply >= hat.maxSupply) return <span className="text-red-400">Hat is at max supply ({hat.maxSupply})</span>;
              return <span>Supply: {hat.supply}/{hat.maxSupply} — {hat.maxSupply - hat.supply} remaining</span>;
            })()}
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
        {writeError && <p className="text-xs text-red-400">{writeError.message.split('\n')[0]}</p>}
        {mintSuccess && <p className="text-xs text-green-400">{mintSuccess}</p>}

        <button
          onClick={handleMint}
          disabled={!selectedHat || !mintAddress || isMinting || isConfirming}
          className="w-full bg-[#f5a623] text-[#0a1628] text-sm font-medium py-2.5 rounded-lg hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
        >
          {isMinting
            ? 'Confirm in wallet...'
            : isConfirming
              ? 'Confirming on-chain...'
              : 'Mint Hat'}
        </button>
      </div>

      {/* Hat Overview */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Hat Overview</p>
        <div className="space-y-2">
          {allHats.map((hat) => (
            <div
              key={hat.id}
              className="flex items-center justify-between px-4 py-3 bg-[#0d1b2a] rounded-xl border border-gray-800"
            >
              <div>
                <p className="text-sm text-white font-medium">{hat.label}</p>
                <p className="text-[10px] text-gray-600 font-mono">{hat.prettyId.slice(0, 18)}...</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${
                  hat.supply >= hat.maxSupply ? 'text-red-400' : hat.supply > 0 ? 'text-[#f5a623]' : 'text-gray-500'
                }`}>
                  {hat.supply}/{hat.maxSupply}
                </span>
                <p className="text-[10px] text-gray-600">wearers</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Transactions execute on Optimism. Gas fees apply.
      </p>
    </div>
  );
}
