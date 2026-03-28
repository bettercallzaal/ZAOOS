import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { getSessionData } from '@/lib/auth/session';
import { ZOUNZ_GOVERNOR, ZOUNZ_TOKEN } from '@/lib/zounz/contracts';

// Nouns Builder Goldsky subgraph (may be 404 — falls back to getLogs)
const SUBGRAPH_URL =
  'https://api.goldsky.com/api/public/project_clkk1ucdyf6ak38svcatie21s/subgraphs/nouns-builder-base-mainnet/stable/gn';

// Viem client for Base mainnet — fallback data source
const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// ProposalCreated(bytes32,address,address[],uint256[],bytes[],string,uint256,uint256,uint256)
const PROPOSAL_CREATED_ABI = parseAbiItem(
  'event ProposalCreated(bytes32 proposalId, address proposer, address[] targets, uint256[] values, bytes[] calldatas, string description, uint256 voteStart, uint256 voteEnd, uint256 proposalThreshold, uint256 quorumVotes)'
);

// ProposalCanceled, ProposalVetoed, ProposalExecuted events
const PROPOSAL_CANCELED_ABI = parseAbiItem('event ProposalCanceled(bytes32 proposalId)');
const PROPOSAL_VETOED_ABI = parseAbiItem('event ProposalVetoed(bytes32 proposalId)');
const PROPOSAL_EXECUTED_ABI = parseAbiItem('event ProposalExecuted(bytes32 proposalId)');

interface SubgraphProposal {
  proposalId: string;
  proposalNumber: number;
  title: string;
  description: string;
  proposer: { id: string };
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  voteStart: string;
  voteEnd: string;
  status: string;
  timeCreated: string;
  executableFrom: string | null;
  expiresAt: string | null;
}

export interface ZounzProposal {
  proposalId: string;
  proposalNumber: number;
  title: string;
  description: string;
  proposer: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  status: string;
  voteStart: number;
  voteEnd: number;
  timeCreated: number;
}

/**
 * GET /api/zounz/proposals/list
 * Fetches the 30 most recent ZOUNZ governance proposals with vote counts and status.
 * Primary: Nouns Builder Goldsky subgraph.
 * Fallback: Viem getLogs on the Governor contract (ProposalCreated events).
 */
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Primary: try subgraph ---
    const subgraphResult = await trySubgraph();
    if (subgraphResult !== null) {
      return NextResponse.json(
        { proposals: subgraphResult, total: subgraphResult.length },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
      );
    }

    // --- Fallback: read ProposalCreated events via getLogs ---
    const logsResult = await tryGetLogs();
    if (logsResult !== null) {
      return NextResponse.json(
        { proposals: logsResult, total: logsResult.length, source: 'onchain' },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
      );
    }

    // Both sources failed — graceful degradation
    return NextResponse.json(
      { proposals: [], error: 'Proposal data temporarily unavailable', total: 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error('[zounz/proposals/list] Unhandled error:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Subgraph fetch
// ---------------------------------------------------------------------------
async function trySubgraph(): Promise<ZounzProposal[] | null> {
  // Nouns Builder subgraph indexes DAOs by their token contract address (lowercase)
  const tokenAddress = ZOUNZ_TOKEN.toLowerCase();

  const query = `{
    dao(id: "${tokenAddress}") {
      proposals(orderBy: timeCreated, orderDirection: desc, first: 30) {
        proposalId
        proposalNumber
        title
        description
        proposer { id }
        forVotes
        againstVotes
        abstainVotes
        voteStart
        voteEnd
        status
        timeCreated
        executableFrom
        expiresAt
      }
    }
  }`;

  try {
    const res = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn('[zounz/proposals/list] Subgraph HTTP error:', res.status);
      return null;
    }

    const data = await res.json();

    // If the DAO wasn't found by token address, try the Governor address
    let rawProposals: SubgraphProposal[] | null = data?.data?.dao?.proposals ?? null;

    if (!rawProposals) {
      // Retry with Governor address
      const govQuery = query.replace(tokenAddress, ZOUNZ_GOVERNOR.toLowerCase());
      const govRes = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: govQuery }),
        signal: AbortSignal.timeout(10000),
      });
      if (govRes.ok) {
        const govData = await govRes.json();
        rawProposals = govData?.data?.dao?.proposals ?? null;
      }
    }

    if (!rawProposals) {
      console.warn('[zounz/proposals/list] Subgraph returned no DAO data');
      return null;
    }

    return rawProposals.map((p, idx) => ({
      proposalId: p.proposalId,
      proposalNumber: p.proposalNumber ?? idx + 1,
      title: p.title || extractTitle(p.description),
      description: p.description || '',
      proposer: p.proposer?.id || '0x0',
      forVotes: Number(p.forVotes),
      againstVotes: Number(p.againstVotes),
      abstainVotes: Number(p.abstainVotes),
      status: formatStatus(p.status),
      voteStart: Number(p.voteStart),
      voteEnd: Number(p.voteEnd),
      timeCreated: Number(p.timeCreated),
    }));
  } catch (err) {
    console.warn('[zounz/proposals/list] Subgraph fetch failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// On-chain fallback via Viem getLogs
// ---------------------------------------------------------------------------
async function tryGetLogs(): Promise<ZounzProposal[] | null> {
  try {
    // Fetch the last ~50k blocks (~7 days on Base at ~2s/block)
    const latestBlock = await client.getBlockNumber();
    const fromBlock = latestBlock > BigInt(200_000) ? latestBlock - BigInt(200_000) : BigInt(0);

    // Get all terminal-state proposal IDs in parallel with ProposalCreated
    const [createdLogs, canceledLogs, vetoedLogs, executedLogs] = await Promise.allSettled([
      client.getLogs({
        address: ZOUNZ_GOVERNOR,
        event: PROPOSAL_CREATED_ABI,
        fromBlock,
        toBlock: latestBlock,
      }),
      client.getLogs({
        address: ZOUNZ_GOVERNOR,
        event: PROPOSAL_CANCELED_ABI,
        fromBlock,
        toBlock: latestBlock,
      }),
      client.getLogs({
        address: ZOUNZ_GOVERNOR,
        event: PROPOSAL_VETOED_ABI,
        fromBlock,
        toBlock: latestBlock,
      }),
      client.getLogs({
        address: ZOUNZ_GOVERNOR,
        event: PROPOSAL_EXECUTED_ABI,
        fromBlock,
        toBlock: latestBlock,
      }),
    ]);

    if (createdLogs.status === 'rejected') {
      console.warn('[zounz/proposals/list] getLogs failed:', createdLogs.reason);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    // Build sets of terminal-state proposal IDs
    const canceledIds = new Set<string>(
      canceledLogs.status === 'fulfilled'
        ? canceledLogs.value.map(l => (l.args as { proposalId: string }).proposalId)
        : []
    );
    const vetoedIds = new Set<string>(
      vetoedLogs.status === 'fulfilled'
        ? vetoedLogs.value.map(l => (l.args as { proposalId: string }).proposalId)
        : []
    );
    const executedIds = new Set<string>(
      executedLogs.status === 'fulfilled'
        ? executedLogs.value.map(l => (l.args as { proposalId: string }).proposalId)
        : []
    );

    // Sort created logs newest-first, take 30
    const sorted = [...createdLogs.value]
      .sort((a, b) => Number(b.blockNumber - a.blockNumber))
      .slice(0, 30);

    const proposals: ZounzProposal[] = sorted.map((log, idx) => {
      const args = log.args as {
        proposalId: string;
        proposer: string;
        description: string;
        voteStart: bigint;
        voteEnd: bigint;
      };

      const proposalId = args.proposalId;
      const voteStart = Number(args.voteStart);
      const voteEnd = Number(args.voteEnd);

      // Derive status from event data and timestamps
      let status = 'Unknown';
      if (canceledIds.has(proposalId)) {
        status = 'Canceled';
      } else if (vetoedIds.has(proposalId)) {
        status = 'Vetoed';
      } else if (executedIds.has(proposalId)) {
        status = 'Executed';
      } else if (now < voteStart) {
        status = 'Pending';
      } else if (now <= voteEnd) {
        status = 'Active';
      } else {
        // Vote ended — we'd need proposalVotes to know Succeeded/Defeated, default Ended
        status = 'Ended';
      }

      return {
        proposalId,
        proposalNumber: sorted.length - idx, // approximate descending order
        title: extractTitle(args.description),
        description: args.description || '',
        proposer: args.proposer || '0x0',
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
        status,
        voteStart,
        voteEnd,
        timeCreated: 0, // block timestamp not readily available without extra RPC calls
      };
    });

    return proposals;
  } catch (err) {
    console.warn('[zounz/proposals/list] getLogs fallback failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function extractTitle(description: string): string {
  if (!description) return 'Untitled';
  // Nouns Builder proposals use "# Title\n\nBody" markdown
  const match = description.match(/^#\s+(.+)/m);
  if (match) return match[1].trim();
  return description.slice(0, 80) + (description.length > 80 ? '...' : '');
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    CANCELED: 'Canceled',
    DEFEATED: 'Defeated',
    SUCCEEDED: 'Succeeded',
    QUEUED: 'Queued',
    EXPIRED: 'Expired',
    EXECUTED: 'Executed',
    VETOED: 'Vetoed',
  };
  return map[status?.toUpperCase()] ?? status ?? 'Unknown';
}
