import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { postCast } from '@/lib/farcaster/neynar';
import { ENV } from '@/lib/env';

/**
 * POST — Publish a governance-approved proposal to @thezao Farcaster account
 *
 * Called internally when a proposal reaches the Respect vote threshold.
 * Only admins can trigger this directly. Normal flow: vote route checks threshold → calls this.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  if (!ENV.ZAO_OFFICIAL_SIGNER_UUID || !ENV.ZAO_OFFICIAL_FID) {
    return NextResponse.json({ error: 'ZAO official signer not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { proposalId } = body;
  if (!proposalId) {
    return NextResponse.json({ error: 'proposalId required' }, { status: 400 });
  }

  // Fetch the proposal
  const { data: proposal, error: fetchError } = await supabaseAdmin
    .from('proposals')
    .select(`
      *,
      author:users!proposals_author_id_fkey(display_name, username, fid)
    `)
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  // Check if already published
  if (proposal.published_cast_hash) {
    return NextResponse.json({ error: 'Already published', cast_hash: proposal.published_cast_hash }, { status: 409 });
  }

  // Check Respect vote threshold
  const { data: votes } = await supabaseAdmin
    .from('proposal_votes')
    .select('vote, respect_weight')
    .eq('proposal_id', proposalId);

  const totalRespectFor = (votes || [])
    .filter((v: { vote: string }) => v.vote === 'for')
    .reduce((sum: number, v: { respect_weight: number | null }) => sum + (v.respect_weight || 0), 0);

  const threshold = proposal.respect_threshold || 1000;

  if (totalRespectFor < threshold) {
    return NextResponse.json({
      error: 'Threshold not met',
      current: totalRespectFor,
      threshold,
    }, { status: 400 });
  }

  // Build the cast text
  const authorName = proposal.author?.username || proposal.author?.display_name || 'ZAO member';
  const publishText = proposal.publish_text || proposal.description || proposal.title;

  // Truncate to Farcaster's 1024 char limit, leaving room for attribution
  const attribution = `\n\n— Proposed by @${authorName} • Approved by ZAO governance`;
  const maxTextLength = 1024 - attribution.length;
  const castText = publishText.length > maxTextLength
    ? publishText.slice(0, maxTextLength - 3) + '...' + attribution
    : publishText + attribution;

  try {
    // Publish to @thezao Farcaster account
    const result = await postCast(
      ENV.ZAO_OFFICIAL_SIGNER_UUID,
      castText,
      'zao', // post to /zao channel
      undefined, // no parent (top-level cast)
      undefined, // no embed hash
      proposal.publish_image_url ? [proposal.publish_image_url] : undefined,
    );

    const castHash = result?.cast?.hash;

    // Update proposal with published info
    await supabaseAdmin
      .from('proposals')
      .update({
        published_cast_hash: castHash,
        published_at: new Date().toISOString(),
        status: 'published',
      })
      .eq('id', proposalId);

    return NextResponse.json({
      success: true,
      cast_hash: castHash,
      text: castText,
      respect_votes: totalRespectFor,
      threshold,
    });
  } catch (err) {
    console.error('[publish/farcaster] Error:', err);
    return NextResponse.json({ error: 'Failed to publish cast' }, { status: 500 });
  }
}
