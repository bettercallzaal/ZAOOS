import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/** GET - a one-time nonce for Sign In With Farcaster, kept in the session cookie. */
export async function GET() {
  try {
    const session = await getSession();
    const nonce = crypto.randomBytes(16).toString('hex');
    session.nonce = nonce;
    await session.save();
    return NextResponse.json({ nonce });
  } catch (error: unknown) {
    console.error('[auth/nonce]', error);
    return NextResponse.json({ error: 'Could not start sign-in' }, { status: 500 });
  }
}
