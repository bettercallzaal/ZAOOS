import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { communityIssueSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'http://localhost:3100';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY || '';
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || '';
const PAPERCLIP_CEO_AGENT_ID = process.env.PAPERCLIP_CEO_AGENT_ID || '';

/**
 * GET — List community-submitted issues
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 50);
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0', 10), 0);

  const { data, error, count } = await supabaseAdmin
    .from('community_issues')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Community issues fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }

  return NextResponse.json({ issues: data || [], total: count || 0 });
}

/**
 * POST — Submit a new community issue
 * Saves to Supabase AND forwards to Paperclip CEO agent
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = communityIssueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, type, priority } = parsed.data;

  // Save to Supabase
  const { data: issue, error: dbError } = await supabaseAdmin
    .from('community_issues')
    .insert({
      title,
      description,
      type,
      priority,
      submitted_by_fid: session.fid,
      submitted_by_username: session.username || null,
      status: 'submitted',
    })
    .select()
    .single();

  if (dbError) {
    logger.error('Community issue insert error:', dbError);
    return NextResponse.json({ error: 'Failed to save issue' }, { status: 500 });
  }

  // Forward to Paperclip CEO agent (non-blocking)
  if (PAPERCLIP_API_URL && PAPERCLIP_COMPANY_ID) {
    try {
      const paperclipDescription = [
        `## Community Issue from @${session.username || `FID:${session.fid}`}`,
        `**Type:** ${type} | **Priority:** ${priority}`,
        '',
        description,
        '',
        `---`,
        `Submitted via ZAO OS community issue form.`,
        `Supabase ID: ${issue.id}`,
        `Submitter FID: ${session.fid}`,
      ].join('\n');

      const paperclipBody: Record<string, unknown> = {
        title: `[Community] ${title}`,
        description: paperclipDescription,
        status: 'todo',
        priority: priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'medium',
      };

      // Assign to CEO if configured
      if (PAPERCLIP_CEO_AGENT_ID) {
        paperclipBody.assigneeAgentId = PAPERCLIP_CEO_AGENT_ID;
      }

      const paperclipRes = await fetch(
        `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(PAPERCLIP_API_KEY ? { 'Authorization': `Bearer ${PAPERCLIP_API_KEY}` } : {}),
          },
          body: JSON.stringify(paperclipBody),
        }
      );

      if (paperclipRes.ok) {
        const paperclipIssue = await paperclipRes.json();
        // Update Supabase record with Paperclip issue ID
        await supabaseAdmin
          .from('community_issues')
          .update({ paperclip_issue_id: paperclipIssue.id || paperclipIssue.identifier })
          .eq('id', issue.id);
      }
    } catch (err) {
      // Non-blocking — log but don't fail the request
      logger.error('Paperclip forwarding error:', err);
    }
  }

  return NextResponse.json({ issue, message: 'Issue submitted successfully' }, { status: 201 });
}
