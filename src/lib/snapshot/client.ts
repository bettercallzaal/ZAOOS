'use server';

/**
 * Snapshot GraphQL client for reading polls/proposals.
 *
 * Note: creating proposals and voting require wallet signatures on the
 * client side (via @snapshot-labs/snapshot.js Client712), so those
 * operations happen in components, not here.
 */

import { communityConfig } from '@/../community.config';

/* ── Types ─────────────────────────────────────────────────────── */

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  state: 'active' | 'closed' | 'pending';
  scores: number[];
  scores_total: number;
  votes: number;
  type: string;
}

/* ── Helpers ───────────────────────────────────────────────────── */

const GRAPHQL_URL = communityConfig.snapshot.graphqlUrl;
const SPACE = communityConfig.snapshot.space;

async function gqlQuery<T>(query: string): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    next: { revalidate: 60 }, // cache for 60s on the server
  });

  if (!res.ok) {
    throw new Error(`Snapshot GraphQL error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Snapshot GraphQL: ${json.errors[0]?.message ?? 'Unknown error'}`);
  }

  return json.data as T;
}

/* ── Public API ────────────────────────────────────────────────── */

/**
 * Fetch currently active proposals for the ZAO Snapshot space.
 */
export async function fetchActivePolls(): Promise<SnapshotProposal[]> {
  const data = await gqlQuery<{ proposals: SnapshotProposal[] }>(`
    {
      proposals(
        where: { space: "${SPACE}", state: "active" }
        orderBy: "created"
        orderDirection: desc
        first: 10
      ) {
        id title body choices start end state
        scores scores_total votes type
      }
    }
  `);
  return data.proposals;
}

/**
 * Fetch recent proposals (any state) for the ZAO Snapshot space.
 */
export async function fetchRecentPolls(limit = 20): Promise<SnapshotProposal[]> {
  const data = await gqlQuery<{ proposals: SnapshotProposal[] }>(`
    {
      proposals(
        where: { space: "${SPACE}" }
        orderBy: "created"
        orderDirection: desc
        first: ${limit}
      ) {
        id title body choices start end state
        scores scores_total votes type
      }
    }
  `);
  return data.proposals;
}

/**
 * Fetch detailed results for a single proposal.
 */
export async function fetchPollResults(proposalId: string): Promise<SnapshotProposal | null> {
  const data = await gqlQuery<{ proposal: SnapshotProposal | null }>(`
    {
      proposal(id: "${proposalId}") {
        id title body choices start end state
        scores scores_total votes type
      }
    }
  `);
  return data.proposal;
}
