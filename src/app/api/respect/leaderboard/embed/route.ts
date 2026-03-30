import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchLeaderboard, type RespectEntry } from '@/lib/respect/leaderboard';
import { logger } from '@/lib/logger';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  format: z.enum(['json', 'html']).default('json'),
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'X-Frame-Options': 'ALLOWALL',
  'Content-Security-Policy': 'frame-ancestors *',
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      format: searchParams.get('format') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { limit, format } = parsed.data;
    const result = await fetchLeaderboard();
    const entries = result.leaderboard.slice(0, limit);

    if (format === 'html') {
      const html = renderHTML(entries, result.stats.totalMembers);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...CORS_HEADERS,
        },
      });
    }

    return NextResponse.json(
      { leaderboard: entries, stats: result.stats },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    logger.error('Embed leaderboard error:', err);
    return NextResponse.json(
      { error: 'Failed to load leaderboard data' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Intentionally public endpoint — any origin can embed this data
type EmbedEntry = Pick<RespectEntry, 'rank' | 'name' | 'ogRespect' | 'zorRespect' | 'totalRespect'>;

function renderHTML(entries: EmbedEntry[], totalMembers: number): string {
  const rows = entries
    .map(
      (e) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a44;text-align:center;color:#f5a623;font-weight:600;">${e.rank}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a44;color:#e2e8f0;">${escapeHtml(e.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a44;text-align:right;color:#e2e8f0;">${e.ogRespect.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a44;text-align:right;color:#e2e8f0;">${e.zorRespect.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1a2a44;text-align:right;color:#f5a623;font-weight:600;">${e.totalRespect.toLocaleString()}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZAO Respect Leaderboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a1628;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e2e8f0;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 18px;
      color: #f5a623;
      font-weight: 700;
    }
    .header span {
      font-size: 12px;
      color: #8892a4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      padding: 8px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8892a4;
      border-bottom: 2px solid #1a2a44;
    }
    th:nth-child(1), th:nth-child(3), th:nth-child(4), th:nth-child(5) {
      text-align: right;
    }
    th:nth-child(1) { text-align: center; }
    .footer {
      margin-top: 12px;
      text-align: center;
      font-size: 11px;
      color: #8892a4;
    }
    .footer a {
      color: #f5a623;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ZAO Respect Leaderboard</h1>
    <span>Top ${entries.length} of ${totalMembers}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:center;">Rank</th>
        <th>Name</th>
        <th style="text-align:right;">OG Respect</th>
        <th style="text-align:right;">ZOR Respect</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
  <div class="footer">
    Powered by <a href="https://thezao.io" target="_blank" rel="noopener">The ZAO</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
