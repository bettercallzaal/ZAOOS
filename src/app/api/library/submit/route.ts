import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { librarySubmitSchema } from '@/lib/validation/library-schemas';
import { isUrl, extractOGMetadata } from '@/lib/library/og-extract';
import { generateResearchSummary } from '@/lib/library/minimax';
import { moderateContent } from '@/lib/moderation/moderate';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.fid) {
    return NextResponse.json({ error: 'Farcaster account required to submit' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = librarySubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { input, note, tags } = parsed.data;
    const fid = session.fid;

    // Detect URL vs freeform topic
    const urlDetected = isUrl(input);
    let url: string | null = null;
    let topic: string = input;
    let ogTitle: string | null = null;
    let ogDescription: string | null = null;
    let ogImage: string | null = null;

    // Extract OG metadata if URL
    if (urlDetected) {
      url = input.trim();
      const og = await extractOGMetadata(url);
      ogTitle = og.ogTitle;
      ogDescription = og.ogDescription;
      ogImage = og.ogImage;
      // Use OG title as topic, fallback to URL
      topic = ogTitle || url;
    }

    // Moderate content
    const textToModerate = [topic, note].filter(Boolean).join(' ');
    const modResult = await moderateContent(textToModerate);
    if (modResult.action === 'hide') {
      return NextResponse.json(
        { error: 'Content flagged by moderation' },
        { status: 400 },
      );
    }

    // Insert entry with pending AI status
    const { data: entry, error: insertError } = await supabaseAdmin
      .from('research_entries')
      .insert({
        fid,
        url,
        topic,
        note: note || null,
        tags: tags || [],
        og_title: ogTitle,
        og_description: ogDescription,
        og_image: ogImage,
        ai_status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Generate AI summary (awaited so Vercel doesn't kill the function)
    const summaryContent = [
      topic,
      ogDescription && `Description: ${ogDescription}`,
      note && `Submitter note: ${note}`,
      url && `URL: ${url}`,
    ].filter(Boolean).join('\n');

    const aiResult = await generateResearchSummary(summaryContent);

    // Update entry with AI summary
    await supabaseAdmin
      .from('research_entries')
      .update({
        ai_summary: aiResult.summary,
        ai_status: aiResult.summary ? 'complete' : 'failed',
      })
      .eq('id', entry.id);

    return NextResponse.json({
      success: true,
      entry: {
        ...entry,
        ai_summary: aiResult.summary,
        ai_status: aiResult.summary ? 'complete' : 'failed',
      },
    });
  } catch (error) {
    console.error('[library/submit] Error:', error);
    return NextResponse.json({ error: 'Failed to submit entry' }, { status: 500 });
  }
}
