/**
 * ZOUNZ / Nouns Builder contract ABIs and addresses on Base.
 *
 * Builder deploys 5 contracts per DAO. We need Token + Auction.
 * The Token contract has a reference to the Auction contract.
 */

import { parseAbi } from 'viem';

// ZOUNZ Token contract on Base (from nouns.build URL)
export const ZOUNZ_TOKEN = '0xCB80Ef04DA68667c9a4450013BDD69269842c883' as const;

// Nouns Builder Auction ABI (subset we need)
export const auctionAbi = parseAbi([
  // Read current auction state
  'function auction() view returns (uint256 tokenId, uint256 highestBid, address highestBidder, uint40 startTime, uint40 endTime, bool settled)',
  // Place a bid (payable)
  'function createBid(uint256 tokenId) payable',
  // Settle current auction and start new one
  'function settleCurrentAndCreateNewAuction()',
  // Minimum bid increment percentage (e.g., 10 = 10%)
  'function minBidIncrement() view returns (uint256)',
  // Reserve price
  'function reservePrice() view returns (uint256)',
  // Duration
  'function duration() view returns (uint256)',
  // Paused state
  'function paused() view returns (bool)',
]);

// Nouns Builder Token ABI (subset we need)
export const tokenAbi = parseAbi([
  // Get auction contract address
  'function auction() view returns (address)',
  // Get token URI for metadata
  'function tokenURI(uint256 tokenId) view returns (string)',
  // Total supply
  'function totalSupply() view returns (uint256)',
  // Owner of a token
  'function ownerOf(uint256 tokenId) view returns (address)',
  // Token name
  'function name() view returns (string)',
  // Get contract image
  'function contractURI() view returns (string)',
]);
