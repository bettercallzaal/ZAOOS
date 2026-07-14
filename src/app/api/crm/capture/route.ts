import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deriveContactSlug, hasStableContactKey, type InteractionType } from '@/lib/crm/types';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Public CRM form capture endpoint. Accepts POST requests from Webflow forms
 * (or any form) and writes leads to the crm_contacts table. Hardened with:
 * - Honeypot field to block basic spam
 * - Simple rate-limiting by source IP
 * - CORS restricted to configured origins
 * - Optional token-based auth
 * - Zod validation before DB write
 *
 * Webflow usage: set the form action to POST /api/crm/capture with these fields:
 * - name (required)
 * - email (optional but recommended)
 * - message or notes (optional, captures as private_notes)
 * - source (optional, defaults to 'webflow-form')
 * - honeypot (hidden field, must be empty)
 *
 * Responds with {ok: true} on success, or {error: '...'} on failure.
 * Never exposes service keys or logs raw emails.
 */

// In-memory rate limit map: IP -> array of timestamps (ms)
// Purged every 5 minutes to avoid unbounded memory growth.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 per minute per IP

setInterval(() => {
  rateLimitMap.clear();
}, 5 * 60 * 1000);

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf;
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  // Keep only recent timestamps
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // rate limited
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true; // allowed
}

function checkToken(req: NextRequest): boolean {
  if (!ENV.CRM_CAPTURE_TOKEN) return true; // no token required
  const queryToken = req.nextUrl.searchParams.get('token');
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const provided = queryToken || bearerToken;
  return provided === ENV.CRM_CAPTURE_TOKEN;
}

function checkCors(req: NextRequest): boolean {
  const origin = req.headers.get('origin') || '';
  // Allow thezao.com and its subdomains, plus localhost for dev
  const allowedOrigins = [
    'https://thezao.com',
    'https://www.thezao.com',
    'https://app.thezao.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  return allowedOrigins.some(
    (allowed) => origin === allowed || origin.endsWith('.thezao.com'),
  );
}

const captureSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).optional().or(z.literal('')),
  message: z.string().max(8000).optional().or(z.literal('')),
  notes: z.string().max(8000).optional().or(z.literal('')),
  source: z.string().max(64).default('webflow-form'),
  honeypot: z.string().max(0), // must be empty string
  company: z.string().max(200).optional().or(z.literal('')),
  role: z.string().max(200).optional().or(z.literal('')),
});

type CaptureRequest = z.infer<typeof captureSchema>;

async function uniqueNameSlug(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  base: string,
): Promise<string> {
  const { data } = await supabase.from('crm_contacts').select('slug').like('slug', `${base}%`);
  const taken = new Set((data ?? []).map((r) => (r as { slug: string | null }).slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''),
  ) as Partial<T>;
}

export async function POST(req: NextRequest) {
  try {
    // CORS check
    if (!checkCors(req)) {
      return NextResponse.json(
        { error: 'CORS: origin not allowed' },
        { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    // Rate limit check
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in 1 minute.' },
        { status: 429 },
      );
    }

    // Token check
    if (!checkToken(req)) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData().catch(() => null);
    const raw = formData
      ? Object.fromEntries(formData.entries())
      : await req.json().catch(() => null);

    const parsed = captureSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error('[crm/capture] validation failed:', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 },
      );
    }

    const data = parsed.data as CaptureRequest;

    // Extract fields for the contact
    const contactData = {
      name: data.name,
      email: data.email || undefined,
      org: data.company || undefined,
      role: data.role || undefined,
      private_notes: (data.message || data.notes || undefined) as string | undefined,
      source: data.source,
    };

    const supabase = getSupabaseAdmin();

    // Determine slug: email is stable key, name is not
    const hasStable = !!contactData.email;
    let slug: string;
    if (hasStable) {
      // Email-based slug: email-domain (e.g., john-doe-example-com)
      const [local] = contactData.email!.split('@');
      slug = `${local}-${contactData.email!.split('@')[1]?.replace(/\./g, '-')}`.slice(0, 64);
    } else {
      // Name-based slug: must be uniquified (C-M2)
      const baseSlug = contactData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
      slug = await uniqueNameSlug(supabase, baseSlug);
    }

    // Upsert the contact
    const contactRow = compact({
      name: contactData.name,
      slug,
      email: contactData.email,
      org: contactData.org,
      role: contactData.role,
      private_notes: contactData.private_notes,
    });

    const conflictTarget = hasStable ? 'email' : undefined; // only upsert on email if stable

    let upsertQuery = supabase
      .from('crm_contacts')
      .select('id, slug')
      .single();

    if (hasStable && contactData.email) {
      // Upsert by email (stable)
      const { data: existing } = await supabase
        .from('crm_contacts')
        .select('id, slug')
        .eq('email', contactData.email)
        .single();

      if (existing) {
        // Update existing
        const { error: updateErr } = await supabase
          .from('crm_contacts')
          .update({
            ...contactRow,
            updated_at: new Date().toISOString(),
          })
          .eq('email', contactData.email);

        if (updateErr) {
          logger.error('[crm/capture] update failed:', updateErr);
          return NextResponse.json({ ok: true }); // soft-fail: don't expose internal errors
        }
      } else {
        // Insert new
        const { error: insertErr } = await supabase
          .from('crm_contacts')
          .insert([contactRow]);

        if (insertErr) {
          logger.error('[crm/capture] insert failed:', insertErr);
          return NextResponse.json({ ok: true }); // soft-fail
        }
      }
    } else {
      // Insert only (name-based, no upsert)
      const { error: insertErr } = await supabase
        .from('crm_contacts')
        .insert([contactRow]);

      if (insertErr) {
        logger.error('[crm/capture] insert failed:', insertErr);
        return NextResponse.json({ ok: true }); // soft-fail
      }
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': req.headers.get('origin') || '',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    );
  } catch (error: unknown) {
    logger.error('[crm/capture] unexpected error:', error);
    return NextResponse.json({ ok: true }, { status: 200 }); // soft-fail: never expose errors
  }
}

export async function OPTIONS(req: NextRequest) {
  if (!checkCors(req)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': req.headers.get('origin') || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * CRM export is intentionally locked (C-E1). Contact data is private.
 * GET requests are rejected to prevent data dumps.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { error: 'CRM export is not available - contact data is private' },
    { status: 405 },
  );
}
