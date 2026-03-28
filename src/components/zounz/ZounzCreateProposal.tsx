'use client';

import { useState } from 'react';
import { parseEther, isAddress } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ZOUNZ_GOVERNOR, ZOUNZ_TREASURY, governorAbi } from '@/lib/zounz/contracts';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  proposalThreshold: number;
  votingPower: number;
}

type ProposalType = 'text' | 'transfer';

const INPUT_CLASS =
  'w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50';

export default function ZounzCreateProposal({
  onClose,
  onSuccess,
  proposalThreshold,
  votingPower,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState<ProposalType>('text');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [validationError, setValidationError] = useState('');

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const canPropose = votingPower >= proposalThreshold;

  function validate(): string | null {
    if (!title.trim()) return 'Title is required.';
    if (!description.trim()) return 'Description is required.';
    if (proposalType === 'transfer') {
      if (!transferTo.trim() || !isAddress(transferTo.trim())) {
        return 'A valid recipient address is required.';
      }
      const amount = parseFloat(transferAmount);
      if (!transferAmount.trim() || isNaN(amount) || amount <= 0) {
        return 'A positive ETH amount is required.';
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }

    const formattedDescription = `# ${title.trim()}\n\n${description.trim()}`;

    let targets: `0x${string}`[];
    let values: bigint[];
    let calldatas: `0x${string}`[];

    if (proposalType === 'text') {
      targets = [ZOUNZ_TREASURY as `0x${string}`];
      values = [BigInt(0)];
      calldatas = ['0x' as `0x${string}`];
    } else {
      targets = [transferTo.trim() as `0x${string}`];
      values = [parseEther(transferAmount.trim())];
      calldatas = ['0x' as `0x${string}`];
    }

    writeContract({
      address: ZOUNZ_GOVERNOR,
      abi: governorAbi,
      functionName: 'propose',
      args: [targets, values, calldatas, formattedDescription],
      chainId: 8453, // Base
    });
  }

  // Call onSuccess once confirmed
  if (isConfirmed) {
    onSuccess();
  }

  function getWriteErrorMessage(error: Error | null): string {
    if (!error) return '';
    const msg = error.message ?? '';
    if (msg.includes('User rejected') || msg.includes('user rejected')) {
      return 'Transaction was rejected.';
    }
    if (msg.includes('insufficient') || msg.includes('below threshold')) {
      return 'Insufficient voting power to propose.';
    }
    return 'Transaction failed. Please try again.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#f5a623]/20 bg-[#0d1b2a] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">New On-Chain Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Voting power gate */}
        {!canPropose && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            You need at least <strong>{proposalThreshold}</strong> voting power to create a
            proposal. You currently have <strong>{votingPower}</strong>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short, descriptive proposal title"
              className={INPUT_CLASS}
              disabled={!canPropose || isPending || isConfirming}
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Full proposal details — what, why, and how."
              rows={5}
              className={`${INPUT_CLASS} resize-none`}
              disabled={!canPropose || isPending || isConfirming}
            />
          </div>

          {/* Proposal type toggle */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">Proposal Type</label>
            <div className="flex gap-2">
              {(['text', 'transfer'] as ProposalType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProposalType(type)}
                  disabled={!canPropose || isPending || isConfirming}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    proposalType === type
                      ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                      : 'border-gray-700/50 bg-[#0a1628] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {type === 'text' ? 'Text Proposal' : 'Treasury Transfer'}
                </button>
              ))}
            </div>
          </div>

          {/* Treasury transfer fields */}
          {proposalType === 'transfer' && (
            <div className="space-y-3 rounded-lg border border-gray-700/40 bg-[#0a1628]/60 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  placeholder="0x..."
                  className={INPUT_CLASS}
                  disabled={!canPropose || isPending || isConfirming}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="any"
                  className={INPUT_CLASS}
                  disabled={!canPropose || isPending || isConfirming}
                />
              </div>
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}

          {/* Write contract error */}
          {writeError && (
            <p className="text-sm text-red-400">{getWriteErrorMessage(writeError)}</p>
          )}

          {/* Transaction status */}
          {isPending && (
            <p className="text-sm text-[#f5a623]/80">
              Waiting for wallet confirmation...
            </p>
          )}
          {isConfirming && (
            <p className="text-sm text-[#f5a623]/80">
              Transaction submitted — waiting for on-chain confirmation...
            </p>
          )}
          {isConfirmed && (
            <p className="text-sm text-green-400">Proposal created successfully!</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700/50 bg-transparent px-4 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
              disabled={isPending || isConfirming}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canPropose || isPending || isConfirming || isConfirmed}
              className="flex-1 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending
                ? 'Confirm in Wallet...'
                : isConfirming
                  ? 'Confirming...'
                  : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
