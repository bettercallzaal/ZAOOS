import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET — Debug endpoint to test the publish threshold flow
 * Shows exactly what's happening at each step
 * Admin only, temporary for debugging
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const proposalId = req.nextUrl.searchParams.get('id');
  if (!proposalId) {
    // List all proposals with publish info
    const { data: proposals, error } = await supabaseAdmin
      .from('proposals')
      .select('id, title, status, publish_text, published_cast_hash, respect_threshold')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ proposals, error });
  }

  const steps: Record<string, unknown> = {};

  // Step 1: Get proposal
  const { data: proposal, error: propErr } = await supabaseAdmin
    .from('proposals')
    .select('id, title, status, publish_text, published_cast_hash, respect_threshold')
    .eq('id', proposalId)
    .single();

  steps.proposal = proposal;
  steps.proposalError = propErr;

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found', steps });
  }

  // Step 2: Check votes
  const { data: votes, error: votesErr } = await supabaseAdmin
    .from('proposal_votes')
    .select('vote, respect_weight')
    .eq('proposal_id', proposalId);

  const totalRespectFor = (votes || [])
    .filter((v: { vote: string }) => v.vote === 'for')
    .reduce((sum: number, v: { respect_weight: number | null }) => sum + (v.respect_weight || 0), 0);

  const threshold = proposal.respect_threshold || 1000;

  steps.votes = votes;
  steps.votesError = votesErr;
  steps.totalRespectFor = totalRespectFor;
  steps.threshold = threshold;
  steps.thresholdMet = totalRespectFor >= threshold;
  steps.alreadyPublished = !!proposal.published_cast_hash;

  // Step 3: Check publishing capability (boolean only, no secrets)
  const ENV = await import('@/lib/env').then((m) => m.ENV);
  steps.farcasterPublishReady = !!(ENV.ZAO_OFFICIAL_SIGNER_UUID && ENV.ZAO_OFFICIAL_FID);
  steps.blueskyPublishReady = !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD);

  // Step 4: Try Bluesky publish if threshold met
  if (totalRespectFor >= threshold && !proposal.published_cast_hash) {
    steps.action = 'WOULD PUBLISH';

    const publishText = proposal.publish_text || `${proposal.title}`;

    // Try Bluesky
    try {
      const { postToBluesky } = await import('@/lib/bluesky/client');
      const bskyUri = await postToBluesky(
        publishText + '\n\n— Approved by ZAO governance',
        'https://zaoos.com/governance',
      );
      steps.blueskyResult = bskyUri;
      steps.blueskySuccess = !!bskyUri;

      if (bskyUri) {
        // Mark as published
        await supabaseAdmin
          .from('proposals')
          .update({
            published_cast_hash: 'bluesky-only',
            published_bluesky_uri: bskyUri,
            published_at: new Date().toISOString(),
            status: 'published',
          })
          .eq('id', proposalId);
        steps.dbUpdate = 'Published!';
      }
    } catch (err) {
      steps.blueskyError = err instanceof Error ? err.message : String(err);
    }
  } else {
    steps.action = totalRespectFor < threshold ? 'BELOW THRESHOLD' : 'ALREADY PUBLISHED';
  }

  return NextResponse.json(steps);
}
