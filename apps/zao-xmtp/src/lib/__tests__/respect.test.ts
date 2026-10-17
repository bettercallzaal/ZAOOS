import { describe, expect, it, vi } from 'vitest';
import { type CallResult, checkRespect, type MulticallClient, OG_RESPECT, ZOR_RESPECT } from '@/lib/respect';

const A = '0x1111111111111111111111111111111111111111';
const B = '0x2222222222222222222222222222222222222222';

const ok = (n: number): CallResult => ({ status: 'success', result: BigInt(n) });
const fail: CallResult = { status: 'failure' };

function clientReturning(results: CallResult[]): MulticallClient & { multicall: ReturnType<typeof vi.fn> } {
  return { multicall: vi.fn(async () => results) };
}

describe('checkRespect', () => {
  it('is a member with OG Respect only', async () => {
    const client = clientReturning([ok(5), ok(0)]);
    await expect(checkRespect([A], client)).resolves.toEqual({ status: 'member', address: A });
  });

  it('is a member with ZOR Respect only (both tokens count)', async () => {
    const client = clientReturning([ok(0), ok(1)]);
    await expect(checkRespect([A], client)).resolves.toEqual({ status: 'member', address: A });
  });

  it('finds Respect on the second address', async () => {
    const client = clientReturning([ok(0), ok(0), ok(0), ok(3)]);
    await expect(checkRespect([A, B], client)).resolves.toEqual({ status: 'member', address: B });
  });

  it('is not a member when every read succeeds at zero', async () => {
    const client = clientReturning([ok(0), ok(0), ok(0), ok(0)]);
    await expect(checkRespect([A, B], client)).resolves.toEqual({ status: 'not-member', checked: 2 });
  });

  it('is UNKNOWN, never not-a-member, when a read fails and nothing was found', async () => {
    const client = clientReturning([ok(0), fail]);
    const result = await checkRespect([A], client);
    expect(result.status).toBe('unknown');
  });

  it('trusts a positive read even if another read failed', async () => {
    const client = clientReturning([fail, fail, ok(2), ok(0)]);
    await expect(checkRespect([A, B], client)).resolves.toEqual({ status: 'member', address: B });
  });

  it('is UNKNOWN when the RPC call throws', async () => {
    const client: MulticallClient = {
      multicall: vi.fn(async () => {
        throw new Error('rpc down');
      }),
    };
    await expect(checkRespect([A], client)).resolves.toEqual({ status: 'unknown', reason: 'rpc down' });
  });

  it('is UNKNOWN when the result count does not match', async () => {
    const client = clientReturning([ok(0)]);
    expect((await checkRespect([A], client)).status).toBe('unknown');
  });

  it('dedupes addresses case-insensitively, drops invalid ones, and asks both contracts', async () => {
    const client = clientReturning([ok(0), ok(0)]);
    await checkRespect([A, A.toUpperCase().replace('0X', '0x'), 'not-an-address'], client);
    const { contracts } = client.multicall.mock.calls[0][0] as { contracts: { address: string }[] };
    expect(contracts.map((c) => c.address)).toEqual([OG_RESPECT, ZOR_RESPECT]);
  });

  it('is not a member with no addresses, without calling the chain', async () => {
    const client = clientReturning([]);
    await expect(checkRespect([], client)).resolves.toEqual({ status: 'not-member', checked: 0 });
    expect(client.multicall).not.toHaveBeenCalled();
  });
});
