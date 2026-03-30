// src/app/api/admin/apo/run/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runAPO } from '@/lib/apo/engine';
import type { PromptConfig } from '@/lib/apo/types';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/lib/logger';

const RequestSchema = z.object({
  promptName: z.string().min(1),
  rounds: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { promptName, rounds } = parsed.data;

  try {
    const configPath = path.join(
      process.cwd(),
      'scripts',
      'apo-prompts',
      `${promptName}.json`,
    );

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: `Prompt config not found: ${promptName}` },
        { status: 404 },
      );
    }

    const config: PromptConfig = JSON.parse(
      fs.readFileSync(configPath, 'utf-8'),
    );
    if (rounds) config.maxRounds = rounds;

    const result = await runAPO(config);
    return NextResponse.json(result);
  } catch (err) {
    logger.error('[apo/run] Error:', err);
    return NextResponse.json(
      { error: 'APO optimization failed' },
      { status: 500 },
    );
  }
}
