import { NextResponse } from 'next/server';

/**
 * POST /api/publish/lens — STUB until Lens packages are installed (Sprint 7).
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Lens publishing not yet available — Sprint 7' },
    { status: 501 },
  );
}
