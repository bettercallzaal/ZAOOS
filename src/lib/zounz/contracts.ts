/**
 * ZOUNZ / Nouns Builder contract ABIs and addresses on Base.
 *
 * Builder deploys 5 contracts per DAO. We need Token + Auction.
 * The Token contract has a reference to the Auction contract.
 */

import { parseAbi } from 'viem';

// ZOUNZ contracts on Base (from nouns.build)
export const ZOUNZ_TOKEN = '0xCB80Ef04DA68667c9a4450013BDD69269842c883' as const;
export const ZOUNZ_AUCTION = '0xb2d43035c1d8b84bc816a5044335340dbf214bfb' as const;
export const ZOUNZ_GOVERNOR = '0x9d98ec4ba9f10c942932cbde7747a3448e56817f' as const;
export const ZOUNZ_TREASURY = '0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f' as const;

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

// Nouns Builder Governor ABI (subset we need)
export const governorAbi = parseAbi([
  'function proposalCount() view returns (uint256)',
  'function state(bytes32 proposalId) view returns (uint8)',
  'function getVotes(address account) view returns (uint256)',
  'function proposalThreshold() view returns (uint256)',
  'function quorum() view returns (uint256)',
  'function proposalVotes(bytes32 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function proposals(bytes32 proposalId) view returns (address proposer, uint32 timeCreated, uint16 againstVotes, uint16 forVotes, uint16 abstainVotes, uint16 voteStart, uint32 voteEnd, uint32 proposalThreshold, uint32 quorumVotes, bool executed, bool canceled, bool vetoed)',
  'function castVote(bytes32 proposalId, uint256 support) returns (uint256)',
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (bytes32)',
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
