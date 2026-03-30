'use client';

import { useState } from 'react';

export interface GateConfig {
  type: 'erc20' | 'erc721' | 'erc1155';
  contractAddress: string;
  chainId: number;
  minBalance?: string;
  tokenId?: string;
}

interface TokenGateSectionProps {
  value: GateConfig | null;
  onChange: (gate: GateConfig | null) => void;
  disabled?: boolean;
}

const TOKEN_TYPES = [
  { id: 'erc20' as const, label: 'ERC-20', description: 'Fungible token' },
  { id: 'erc721' as const, label: 'NFT (ERC-721)', description: 'Any NFT from collection' },
  { id: 'erc1155' as const, label: 'ERC-1155', description: 'Semi-fungible token' },
];

const CHAINS = [
  { id: 8453, label: 'Base' },
  { id: 1, label: 'Ethereum' },
  { id: 10, label: 'Optimism' },
];

export function TokenGateSection({ value, onChange, disabled }: TokenGateSectionProps) {
  const [enabled, setEnabled] = useState(!!value);

  const handleToggle = () => {
    if (enabled) {
      setEnabled(false);
      onChange(null);
    } else {
      setEnabled(true);
      onChange({ type: 'erc721', contractAddress: '', chainId: 8453 });
    }
  };

  const update = (partial: Partial<GateConfig>) => {
    if (!value) return;
    onChange({ ...value, ...partial });
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Token Gate
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable token gate"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            enabled ? 'bg-[#f5a623]' : 'bg-gray-700'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3 p-3 bg-[#0a1628] border border-gray-700/50 rounded-xl">
          <p className="text-gray-500 text-xs">
            Require a token to join this room
          </p>

          {/* Token type */}
          <div className="grid grid-cols-3 gap-1.5">
            {TOKEN_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ type: t.id })}
                disabled={disabled}
                className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  value?.type === t.id
                    ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30'
                    : 'bg-[#0d1b2a] text-gray-500 border border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Chain */}
          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">
              Chain
            </label>
            <select
              value={value?.chainId || 8453}
              onChange={(e) => update({ chainId: Number(e.target.value) })}
              disabled={disabled}
              className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:border-[#f5a623] focus:outline-none"
            >
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Contract address */}
          <div>
            <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">
              Contract Address
            </label>
            <input
              type="text"
              value={value?.contractAddress || ''}
              onChange={(e) => update({ contractAddress: e.target.value })}
              placeholder="0x..."
              disabled={disabled}
              className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-[#f5a623] focus:outline-none"
            />
          </div>

          {/* Min balance for ERC-20 */}
          {value?.type === 'erc20' && (
            <div>
              <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">
                Minimum Balance (raw units)
              </label>
              <input
                type="text"
                value={value?.minBalance || ''}
                onChange={(e) => update({ minBalance: e.target.value })}
                placeholder="1000000000000000000"
                disabled={disabled}
                className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-[#f5a623] focus:outline-none"
              />
            </div>
          )}

          {/* Token ID for ERC-1155 */}
          {value?.type === 'erc1155' && (
            <div>
              <label className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">
                Token ID
              </label>
              <input
                type="text"
                value={value?.tokenId || ''}
                onChange={(e) => update({ tokenId: e.target.value })}
                placeholder="1"
                disabled={disabled}
                className="w-full bg-[#0d1b2a] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-[#f5a623] focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
