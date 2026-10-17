import { beforeEach, describe, expect, it, vi } from 'vitest';

const { result } = vi.hoisted(() => ({ result: { data: null as unknown, error: null as unknown } }));
vi.mock('@/lib/db', () => {
  const chain = {
    from: () => chain,
    update: () => chain,
    eq: () => chain,
    select: async () => result,
  };
  return { db: () => chain };
});

import { MemberNotInDirectoryError, setXmtpAddress, XmtpAddressTakenError } from '@/lib/directory';

const ADDR = '0x1111111111111111111111111111111111111111';

describe('setXmtpAddress', () => {
  beforeEach(() => {
    result.data = null;
    result.error = null;
  });

  it('resolves when one row was updated', async () => {
    result.data = [{ fid: 1 }];
    await expect(setXmtpAddress(1, ADDR)).resolves.toBeUndefined();
  });

  it('throws MemberNotInDirectoryError when the update matched no row (was a silent no-op)', async () => {
    result.data = [];
    await expect(setXmtpAddress(1, ADDR)).rejects.toBeInstanceOf(MemberNotInDirectoryError);
  });

  it('throws XmtpAddressTakenError on a unique violation', async () => {
    result.error = { code: '23505', message: 'duplicate key' };
    await expect(setXmtpAddress(1, ADDR)).rejects.toBeInstanceOf(XmtpAddressTakenError);
  });

  it('throws on any other database error', async () => {
    result.error = { code: 'XX000', message: 'boom' };
    await expect(setXmtpAddress(1, ADDR)).rejects.toThrow('members_seen update failed: boom');
  });
});
