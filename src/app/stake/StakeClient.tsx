'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useSendCalls } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { ZABAL_STAKING_CONTRACT, STAKING_ABI } from '@/lib/staking/contract';
import { TOKENS } from '@/lib/agents/types';

const ERC20_APPROVE_ABI = [{
  inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
  name: 'approve',
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'nonpayable',
  type: 'function',
}] as const;

const PRESETS = [
  { label: '100M', value: '100000000' },
  { label: '500M', value: '500000000' },
  { label: '1B', value: '1000000000' },
];

export default function StakeClient() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('100000000');
  const { sendCalls, isPending } = useSendCalls();

  const { data: conviction } = useReadContract({
    address: ZABAL_STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getConviction',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ZABAL_STAKING_CONTRACT },
  });

  const { data: staked } = useReadContract({
    address: ZABAL_STAKING_CONTRACT as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ZABAL_STAKING_CONTRACT },
  });

  function handleStake() {
    if (!ZABAL_STAKING_CONTRACT) return;
    const amt = parseUnits(amount, 18);
    sendCalls({
      calls: [
        {
          to: TOKENS.ZABAL as `0x${string}`,
          data: encodeFunctionData({
            abi: ERC20_APPROVE_ABI,
            functionName: 'approve',
            args: [ZABAL_STAKING_CONTRACT as `0x${string}`, amt],
          }),
        },
        {
          to: ZABAL_STAKING_CONTRACT as `0x${string}`,
          data: encodeFunctionData({
            abi: STAKING_ABI,
            functionName: 'stake',
            args: [amt],
          }),
        },
      ],
    });
  }

  if (!ZABAL_STAKING_CONTRACT) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <p className="text-gray-400 text-sm">Staking contract not configured yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Stake ZABAL</h1>
      <p className="text-gray-400 text-sm mb-6">
        Earn conviction. More tokens x more time = more governance weight + reward multiplier.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Your Conviction</div>
          <div className="text-[#f5a623] text-lg font-bold font-mono">
            {conviction ? (Number(conviction) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </div>
        </div>
        <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">ZABAL Staked</div>
          <div className="text-white text-lg font-bold font-mono">
            {staked ? formatUnits(staked, 18).split('.')[0] : '0'}
          </div>
        </div>
      </div>

      {/* Amount presets */}
      <div className="flex gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setAmount(p.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              amount === p.value
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-[#1a2a3a] text-gray-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stake button */}
      <button
        onClick={handleStake}
        disabled={!isConnected || isPending}
        className="w-full py-3 rounded-xl bg-[#f5a623] text-[#0a1628] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Confirming...' : `Stake ${Number(amount).toLocaleString()} ZABAL`}
      </button>

      {!isConnected && (
        <p className="text-center text-gray-500 text-xs mt-3">
          Open in Farcaster to connect wallet
        </p>
      )}

      {/* Conviction info */}
      <div className="mt-8 bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08]">
        <h3 className="text-white text-sm font-bold mb-2">How Conviction Works</h3>
        <p className="text-gray-400 text-xs leading-relaxed">
          Conviction = tokens staked x seconds held. Stake 100M ZABAL for 30 days = 259T conviction.
          Higher conviction = higher reward multiplier from the ZAO Oracle. Unstake anytime -- conviction earned stays.
        </p>
      </div>
    </div>
  );
}
