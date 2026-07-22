/**
 * Executive Cortex API - strategic advisory interface.
 *
 * GET /api/cortex?decision=<kind>
 *
 * Session-gated endpoint for querying the Cortex's strategic recommendations.
 * The Cortex reads Spine + Grids (read-only) and returns immutable DecisionReceipts.
 *
 * Query parameters:
 * - decision: 'most_important_now' | 'top_5_priorities' | 'what_is_blocking' | etc.
 * - (future) context: 'goals' | 'grids' | 'spine' to specify input sources
 *
 * Request body (POST) or query:
 * - goals: array of Goal objects (for MVP; later will read from a goals table)
 * - edges: array of WorkDependencyEdge objects
 *
 * Returns a DecisionReceipt or an error.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import {
  decideMostImportantNow,
  decideTop5Priorities,
  decideWhatIsBlocking,
  decideWhatCanBeDelayed,
  decideWhatNeedsApproval,
  decideWhatCanParallelize,
} from '@/lib/cortex/decision-engine';
import type { Goal, WorkDependencyEdge } from '@/lib/cortex/types';

const decisionKinds = [
  'most_important_now',
  'top_5_priorities',
  'what_is_blocking',
  'what_can_be_delayed',
  'what_needs_approval',
  'what_can_parallelize',
] as const;

const goalSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['mission', 'objective', 'task']),
  parentId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['backlog', 'ready', 'in_progress', 'blocked', 'completed', 'cancelled']),
  percentComplete: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  notes: z.string().optional(),
});

const edgeSchema = z.object({
  from: z.string().uuid(),
  to: z.string().uuid(),
  kind: z.enum(['blocks', 'context', 'approval']),
  reason: z.string().optional(),
});

const querySchema = z.object({
  decision: z.enum(decisionKinds),
});

const bodySchema = z.object({
  goals: z.array(goalSchema),
  edges: z.array(edgeSchema),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check session
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query
  const parsed = querySchema.safeParse({
    decision: request.nextUrl.searchParams.get('decision') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // For MVP: goals and edges must come from the request body (via POST with body, or hardcoded for testing)
    // TODO: When a goals table exists, fetch from there instead of requiring body.

    // For now, return a placeholder response indicating we're ready
    const decision = parsed.data.decision;

    return NextResponse.json({
      success: true,
      decision,
      message: 'Executive Cortex is live. POST /api/cortex with goals + edges to get strategic recommendations.',
      status: 'ready',
      availableDecisions: decisionKinds,
    });
  } catch (error: unknown) {
    logger.error('[cortex] failed', error);
    return NextResponse.json({ error: 'Failed to process cortex request' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check session
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query
  const queryParsed = querySchema.safeParse({
    decision: request.nextUrl.searchParams.get('decision') ?? '',
  });
  if (!queryParsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: queryParsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // Parse body
    const bodyText = await request.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const bodyParsed = bodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: bodyParsed.error.flatten() },
        { status: 400 },
      );
    }

    const { goals, edges } = bodyParsed.data;
    const decision = queryParsed.data.decision;

    // Dispatch to the appropriate decision function
    let receipt;
    switch (decision) {
      case 'most_important_now':
        receipt = await decideMostImportantNow(goals as Goal[], edges as WorkDependencyEdge[]);
        break;
      case 'top_5_priorities':
        receipt = await decideTop5Priorities(goals as Goal[], edges as WorkDependencyEdge[]);
        break;
      case 'what_is_blocking':
        receipt = await decideWhatIsBlocking(goals as Goal[], edges as WorkDependencyEdge[]);
        break;
      case 'what_can_be_delayed':
        receipt = await decideWhatCanBeDelayed(goals as Goal[], edges as WorkDependencyEdge[]);
        break;
      case 'what_needs_approval':
        receipt = await decideWhatNeedsApproval(goals as Goal[], edges as WorkDependencyEdge[]);
        break;
      case 'what_can_parallelize':
        receipt = await decideWhatCanParallelize(goals as Goal[], edges as WorkDependencyEdge[]);
        break;
      default:
        return NextResponse.json({ error: 'Unknown decision kind' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: receipt });
  } catch (error: unknown) {
    logger.error('[cortex] decision failed', error);
    return NextResponse.json({ error: 'Failed to make decision' }, { status: 500 });
  }
}
