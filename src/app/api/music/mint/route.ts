import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { uploadToArweave, buildMusicTags, isArweaveConfigured } from '@/lib/music/arweave';
import type { LicensePreset } from '@/lib/music/arweave';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const MetadataSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  genre: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  licensePreset: z.enum(['community', 'collectible', 'premium', 'open']).default('collectible'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isArweaveConfigured()) {
      return NextResponse.json({ error: 'Arweave not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const coverFile = formData.get('cover') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }
    if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
      return NextResponse.json({ error: `Invalid audio type: ${audioFile.type}. Allowed: MP3, MP4, WAV, FLAC, OGG, AAC` }, { status: 400 });
    }
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 50MB)' }, { status: 400 });
    }

    if (coverFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
        return NextResponse.json({ error: `Invalid image type: ${coverFile.type}` }, { status: 400 });
      }
      if (coverFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Cover image too large (max 5MB)' }, { status: 400 });
      }
    }

    if (!metadataStr) {
      return NextResponse.json({ error: 'Metadata required' }, { status: 400 });
    }

    let metadataJson: unknown;
    try {
      metadataJson = JSON.parse(metadataStr);
    } catch {
      return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 });
    }

    const parsed = MetadataSchema.safeParse(metadataJson);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid metadata', details: parsed.error.flatten() }, { status: 400 });
    }

    const metadata = parsed.data;

    // 1. Upload cover art first (if provided)
    let coverTxId: string | undefined;
    let coverUrl: string | undefined;
    if (coverFile) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverResult = await uploadToArweave(coverBuffer, coverFile.type, [
        { name: 'App-Name', value: 'ZAO-OS' },
        { name: 'Type', value: 'music-cover' },
        { name: 'Title', value: `${metadata.title} — Cover` },
      ]);
      coverTxId = coverResult.txId;
      coverUrl = coverResult.url;
    }

    // 2. Upload audio with full metadata tags + license
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const tags = buildMusicTags({
      title: metadata.title,
      artist: metadata.artist,
      genre: metadata.genre,
      description: metadata.description,
      coverTxId,
      licensePreset: metadata.licensePreset as LicensePreset,
    });

    const audioResult = await uploadToArweave(audioBuffer, audioFile.type, tags);

    // 3. Store in Supabase
    const { data: asset, error: dbError } = await supabaseAdmin
      .from('arweave_assets')
      .insert({
        fid: session.fid,
        arweave_tx_id: audioResult.txId,
        title: metadata.title,
        artist: metadata.artist,
        content_type: audioFile.type,
        cover_tx_id: coverTxId || null,
        genre: metadata.genre || null,
        description: metadata.description || null,
        license_preset: metadata.licensePreset,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[music/mint] DB error:', dbError);
    }

    return NextResponse.json({
      success: true,
      asset: {
        id: asset?.id || null,
        txId: audioResult.txId,
        url: audioResult.url,
        arUri: audioResult.arUri,
        coverUrl: coverUrl || null,
        bazarUrl: `https://bazar.arweave.net/#/asset/${audioResult.txId}`,
      },
    });
  } catch (error) {
    console.error('[music/mint] Error:', error);
    const message = error instanceof Error ? error.message : 'Mint failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
