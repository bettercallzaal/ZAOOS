// src/app/api/admin/apo/prompts/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const promptsDir = path.join(process.cwd(), 'scripts', 'apo-prompts');
    const files = fs
      .readdirSync(promptsDir)
      .filter((f) => f.endsWith('.json'));

    const prompts = files.map((f) => {
      const config = JSON.parse(
        fs.readFileSync(path.join(promptsDir, f), 'utf-8'),
      );
      return {
        name: config.name,
        description: config.description,
        testCaseCount: config.testCases?.length ?? 0,
      };
    });

    return NextResponse.json({ prompts });
  } catch (err) {
    console.error('[apo/prompts] Error:', err);
    return NextResponse.json(
      { error: 'Failed to list prompts' },
      { status: 500 },
    );
  }
}
