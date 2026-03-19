'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatEther, parseEther, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ZOUNZ_TOKEN, ZOUNZ_AUCTION, tokenAbi, auctionAbi } from '@/lib/zounz/contracts';

interface AuctionState {
  tokenId: bigint;
  highestBid: bigint;
  highestBidder: string;
  startTime: number;
  endTime: number;
  settled: boolean;
}

interface TokenMeta {
  name: string;
  image: string;
  description: string;
}

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function useCountdown(endTime: number) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = endTime * 1000 - Date.now();
      if (diff <= 0) {
        setTimeLeft('Auction ended');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

export default function ZounzAuction() {
  const { address, isConnected } = useAccount();
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [auctionAddress] = useState<`0x${string}`>(ZOUNZ_AUCTION);
  const [tokenMeta, setTokenMeta] = useState<TokenMeta | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minBidIncrement, setMinBidIncrement] = useState(10n);
  const [reservePrice, setReservePrice] = useState(0n);

  const { writeContract, data: txHash, isPending: isBidding, error: bidError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Fetch current auction state
  const fetchAuction = useCallback(async () => {
    const addr = auctionAddress;

    try {
      const [auctionData, minIncrement, reserve] = await Promise.all([
        client.readContract({
          address: addr,
          abi: auctionAbi,
          functionName: 'auction',
        }),
        client.readContract({
          address: addr,
          abi: auctionAbi,
          functionName: 'minBidIncrement',
        }).catch(() => 10n),
        client.readContract({
          address: addr,
          abi: auctionAbi,
          functionName: 'reservePrice',
        }).catch(() => 0n),
      ]);

      const [tokenId, highestBid, highestBidder, startTime, endTime, settled] = auctionData as [bigint, bigint, string, number, number, boolean];

      setAuction({ tokenId, highestBid, highestBidder, startTime, endTime, settled });
      setMinBidIncrement(minIncrement as bigint);
      setReservePrice(reserve as bigint);

      // Fetch token metadata
      try {
        const uri = await client.readContract({
          address: ZOUNZ_TOKEN,
          abi: tokenAbi,
          functionName: 'tokenURI',
          args: [tokenId],
        });
        // tokenURI returns a data URI or HTTPS URL
        const uriStr = uri as string;
        if (uriStr.startsWith('data:application/json;base64,')) {
          const json = JSON.parse(atob(uriStr.replace('data:application/json;base64,', '')));
          setTokenMeta({ name: json.name || `ZOUNZ #${tokenId}`, image: json.image || '', description: json.description || '' });
        } else if (uriStr.startsWith('http')) {
          const res = await fetch(uriStr);
          const json = await res.json();
          setTokenMeta({ name: json.name || `ZOUNZ #${tokenId}`, image: json.image || '', description: json.description || '' });
        } else {
          setTokenMeta({ name: `ZOUNZ #${tokenId}`, image: '', description: '' });
        }
      } catch {
        setTokenMeta({ name: `ZOUNZ #${tokenId}`, image: '', description: '' });
      }

      setLoading(false);
    } catch (err) {
      console.error('[zounz] Auction fetch error:', err);
      setError('Failed to load auction');
      setLoading(false);
    }
  }, [auctionAddress]);

  // Initial load
  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  // Refresh auction every 15 seconds
  useEffect(() => {
    if (!auctionAddress) return;
    const interval = setInterval(() => fetchAuction(), 15000);
    return () => clearInterval(interval);
  }, [auctionAddress, fetchAuction]);

  // Refresh after confirmed bid
  useEffect(() => {
    if (isConfirmed) {
      setBidAmount('');
      fetchAuction();
    }
  }, [isConfirmed, fetchAuction]);

  const timeLeft = useCountdown(auction?.endTime || 0);
  const isEnded = auction ? auction.endTime * 1000 < Date.now() : false;

  const minNextBid = auction
    ? auction.highestBid > 0n
      ? auction.highestBid + (auction.highestBid * minBidIncrement) / 100n
      : reservePrice > 0n ? reservePrice : parseEther('0.001')
    : 0n;

  const handleBid = () => {
    if (!auctionAddress || !auction || !bidAmount) return;
    writeContract({
      address: auctionAddress,
      abi: auctionAbi,
      functionName: 'createBid',
      args: [auction.tokenId],
      value: parseEther(bidAmount),
      chain: base,
    });
  };

  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-6 text-center">
        <div className="w-6 h-6 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading ZOUNZ auction...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <a
          href="https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#f5a623] hover:text-[#ffd700] mt-2 inline-block"
        >
          View on nouns.build
        </a>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
      {/* NFT Image */}
      {tokenMeta?.image && (
        <div className="aspect-square bg-[#0a1628] flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tokenMeta.image}
            alt={tokenMeta.name}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Title + Token ID */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {tokenMeta?.name || `ZOUNZ #${auction?.tokenId?.toString()}`}
          </h3>
          <a
            href={`https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883/${auction?.tokenId?.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition-colors"
          >
            nouns.build
          </a>
        </div>

        {/* Auction Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0a1628] rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Current Bid</p>
            <p className="text-lg font-bold text-white">
              {auction?.highestBid ? `${formatEther(auction.highestBid)} ETH` : 'No bids'}
            </p>
            {auction?.highestBidder && auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                by {shortAddr(auction.highestBidder)}
                {auction.highestBidder.toLowerCase() === address?.toLowerCase() && (
                  <span className="text-[#f5a623] ml-1">(you)</span>
                )}
              </p>
            )}
          </div>
          <div className="bg-[#0a1628] rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Time Left</p>
            <p className={`text-lg font-bold ${isEnded ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Bid Input */}
        {!isEnded && !auction?.settled && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.001"
                  min={formatEther(minNextBid)}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`${formatEther(minNextBid)} ETH min`}
                  className="w-full bg-[#1a2a3a] text-white text-sm rounded-lg px-3 py-2.5 pr-12 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
                  disabled={isBidding || isConfirming}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ETH</span>
              </div>
              <button
                onClick={handleBid}
                disabled={!isConnected || !bidAmount || isBidding || isConfirming || parseEther(bidAmount || '0') < minNextBid}
                className="bg-[#f5a623] text-[#0a1628] font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBidding ? 'Bidding...' : isConfirming ? 'Confirming...' : 'Bid'}
              </button>
            </div>
            {!isConnected && (
              <p className="text-[10px] text-gray-500">Connect your wallet to bid</p>
            )}
            {bidError && (
              <p className="text-[10px] text-red-400">{bidError.message?.split('\n')[0] || 'Bid failed'}</p>
            )}
            {isConfirmed && (
              <p className="text-[10px] text-green-400">Bid placed successfully!</p>
            )}
          </div>
        )}

        {/* Settled / Ended state */}
        {(isEnded || auction?.settled) && (
          <div className="bg-[#0a1628] rounded-lg p-3 text-center">
            <p className="text-sm text-gray-400">
              {auction?.settled ? 'Auction settled' : 'Auction ended — waiting for settlement'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-[10px] text-gray-600">ZABAL Nouns DAO on Base</span>
          <span className="text-[10px] text-gray-600">Min increment: {minBidIncrement.toString()}%</span>
        </div>
      </div>
    </div>
  );
}
