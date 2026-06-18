/**
 * Persistence for the no-login scrapers - a thin server-side cache over the
 * public.scrape_cache table (see scripts/20260618_scrape_cache.sql).
 *
 * One row per (source, key); `data` is the validated scraper output as JSONB.
 * Writes go through supabaseAdmin (service role) - never call from the browser.
 *
 * Failures are returned as typed results and logged, never silently swallowed.
 */

import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export type ScrapeCacheSource = 'x' | 'wavewarz-artist' | 'wavewarz-battles' | 'farcaster';

export interface CacheWriteResult {
  ok: boolean;
  error?: string;
}

const TABLE = 'scrape_cache';

/** Upsert a scraper result into the cache. Returns a typed result, never throws. */
export async function cacheScrape(
  source: ScrapeCacheSource,
  key: string,
  data: unknown,
): Promise<CacheWriteResult> {
  if (!key) return { ok: false, error: 'missing key' };
  try {
    const { error } = await supabaseAdmin
      .from(TABLE)
      .upsert(
        { source, key, data, scraped_at: new Date().toISOString() },
        { onConflict: 'source,key' },
      );
    if (error) {
      logger.warn(`[scrape-persist] upsert ${source}/${key} failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[scrape-persist] upsert ${source}/${key} threw: ${message}`);
    return { ok: false, error: message };
  }
}

export interface CachedScrape<T> {
  data: T;
  scrapedAt: string;
}

/** Read a cached scraper result. Returns null when missing or on error. */
export async function getCachedScrape<T = unknown>(
  source: ScrapeCacheSource,
  key: string,
): Promise<CachedScrape<T> | null> {
  if (!key) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('data, scraped_at')
      .eq('source', source)
      .eq('key', key)
      .maybeSingle();
    if (error) {
      logger.warn(`[scrape-persist] read ${source}/${key} failed: ${error.message}`);
      return null;
    }
    if (!data) return null;
    return { data: data.data as T, scrapedAt: data.scraped_at as string };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[scrape-persist] read ${source}/${key} threw: ${message}`);
    return null;
  }
}
