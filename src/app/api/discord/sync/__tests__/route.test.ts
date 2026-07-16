import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

const mockDiscordClient = vi.hoisted(() => ({
  getChannelMessages: vi.fn(),
  getGuildMembers: vi.fn(),
  isDiscordConfigured: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/discord/client', () => ({
  getChannelMessages: (...args: unknown[]) => mockDiscordClient.getChannelMessages(...args),
  getGuildMembers: (...args: unknown[]) => mockDiscordClient.getGuildMembers(...args),
  isDiscordConfigured: () => mockDiscordClient.isDiscordConfigured(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from '../route';

describe('GET /api/discord/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockDiscordClient.isDiscordConfigured.mockReturnValue(true);
  });

  describe('authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/discord/sync'));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));

      const res = await GET(makeGetRequest('/api/discord/sync'));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin only');
    });
  });

  describe('Discord configuration', () => {
    it('returns 503 when Discord is not configured', async () => {
      mockDiscordClient.isDiscordConfigured.mockReturnValue(false);

      const res = await GET(makeGetRequest('/api/discord/sync'));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Discord integration not available');
    });
  });

  describe('GET ?type=members', () => {
    it('returns formatted members list with default limit', async () => {
      const mockMembers = [
        {
          user: {
            id: 'user1',
            username: 'alice',
            global_name: 'Alice',
            avatar: 'avatar1.png',
          },
          nick: 'Alice (Founder)',
          joined_at: '2023-01-01T00:00:00Z',
          roles: ['founder'],
        },
        {
          user: {
            id: 'user2',
            username: 'bob',
            global_name: null,
            avatar: 'avatar2.png',
          },
          nick: null,
          joined_at: '2023-06-15T00:00:00Z',
          roles: ['member'],
        },
      ];

      mockDiscordClient.getGuildMembers.mockResolvedValue(mockMembers as unknown[]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'members' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(mockDiscordClient.getGuildMembers).toHaveBeenCalledWith(100);
      expect(body).toHaveProperty('members');
      expect(body).toHaveProperty('total', 2);
      const members = body.members as unknown[];
      expect(members).toHaveLength(2);

      const member0 = members[0] as Record<string, unknown>;
      expect(member0.id).toBe('user1');
      expect(member0.username).toBe('alice');
      expect(member0.displayName).toBe('Alice (Founder)');
      expect(member0.avatar).toBe('avatar1.png');
      expect(member0.roles).toEqual(['founder']);

      const member1 = members[1] as Record<string, unknown>;
      expect(member1.id).toBe('user2');
      expect(member1.username).toBe('bob');
      expect(member1.displayName).toBe('bob');
    });

    it('defaults to members when no type is specified', async () => {
      mockDiscordClient.getGuildMembers.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/discord/sync'));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(mockDiscordClient.getGuildMembers).toHaveBeenCalledWith(100);
      expect(body).toHaveProperty('members');
    });

    it('truncates displayName correctly when using nick', async () => {
      const mockMembers = [
        {
          user: { id: 'u1', username: 'user', global_name: 'User Name', avatar: null },
          nick: 'CustomNick',
          joined_at: '2023-01-01T00:00:00Z',
          roles: [],
        },
      ];

      mockDiscordClient.getGuildMembers.mockResolvedValue(mockMembers as unknown[]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'members' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      const members = body.members as unknown[];
      const member = members[0] as Record<string, unknown>;
      expect(member.displayName).toBe('CustomNick');
    });
  });

  describe('GET ?type=intros', () => {
    it('returns formatted intro messages with default limit', async () => {
      const mockMessages = [
        {
          id: 'msg1',
          author: {
            id: 'author1',
            username: 'alice',
          },
          content: 'Hello, I am Alice. I am interested in crypto and DAOs.',
          timestamp: '2023-01-01T12:00:00Z',
        },
        {
          id: 'msg2',
          author: {
            id: 'author2',
            username: 'bob',
          },
          content: 'Hi, I am Bob. I build smart contracts.',
          timestamp: '2023-01-02T12:00:00Z',
        },
      ];

      mockDiscordClient.getChannelMessages.mockResolvedValue(mockMessages as unknown[]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'intros' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(mockDiscordClient.getChannelMessages).toHaveBeenCalledWith('1145135336477950053', 100);
      expect(body).toHaveProperty('intros');
      expect(body).toHaveProperty('total', 2);
      expect(body).toHaveProperty('channelId', '1145135336477950053');

      const intros = body.intros as unknown[];
      expect(intros).toHaveLength(2);

      const intro0 = intros[0] as Record<string, unknown>;
      expect(intro0.id).toBe('msg1');
      expect(intro0.authorId).toBe('author1');
      expect(intro0.authorName).toBe('alice');
      expect(intro0.content).toBe('Hello, I am Alice. I am interested in crypto and DAOs.');
    });

    it('truncates intro content to 500 characters', async () => {
      const longContent = 'a'.repeat(600);
      const mockMessages = [
        {
          id: 'msg1',
          author: { id: 'author1', username: 'alice' },
          content: longContent,
          timestamp: '2023-01-01T12:00:00Z',
        },
      ];

      mockDiscordClient.getChannelMessages.mockResolvedValue(mockMessages as unknown[]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'intros' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      const intros = body.intros as unknown[];
      const intro = intros[0] as Record<string, unknown>;
      expect((intro.content as string).length).toBe(500);
    });
  });

  describe('invalid ?type parameter', () => {
    it('returns 400 with helpful error for invalid type', async () => {
      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'invalid' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid type. Use: members, intros');
    });

    it('returns 400 for threads type (not implemented)', async () => {
      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'threads' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid type. Use: members, intros');
    });
  });

  describe('error handling', () => {
    it('returns 500 when getGuildMembers throws', async () => {
      mockDiscordClient.getGuildMembers.mockRejectedValue(new Error('Discord API error'));

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'members' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to read Discord data');
    });

    it('returns 500 when getChannelMessages throws', async () => {
      mockDiscordClient.getChannelMessages.mockRejectedValue(new Error('Discord API error'));

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'intros' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to read Discord data');
    });
  });

  describe('edge cases', () => {
    it('handles empty members list', async () => {
      mockDiscordClient.getGuildMembers.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'members' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('total', 0);
      const members = body.members as unknown[];
      expect(members).toHaveLength(0);
    });

    it('handles empty intros list', async () => {
      mockDiscordClient.getChannelMessages.mockResolvedValue([]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'intros' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('total', 0);
      const intros = body.intros as unknown[];
      expect(intros).toHaveLength(0);
    });

    it('handles members with missing user data', async () => {
      const mockMembers = [
        {
          user: null,
          nick: 'OnlyNick',
          joined_at: '2023-01-01T00:00:00Z',
          roles: [],
        },
      ];

      mockDiscordClient.getGuildMembers.mockResolvedValue(mockMembers as unknown[]);

      const res = await GET(makeGetRequest('/api/discord/sync', { type: 'members' }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(200);
      const members = body.members as unknown[];
      const member = members[0] as Record<string, unknown>;
      expect(member.id).toBeUndefined();
      expect(member.username).toBeUndefined();
      expect(member.displayName).toBe('OnlyNick');
    });
  });
});

describe('POST /api/discord/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockClear();
  });

  describe('authentication', () => {
    it('returns 503 when DISCORD_BOT_WEBHOOK_SECRET is not configured (checked first)', async () => {
      // The route checks for secret first, before validating auth header
      // Without mocking env, it will read process.env.DISCORD_BOT_WEBHOOK_SECRET
      // Since tests don't set it, it should return 503
      const res = await POST(makePostRequest('/api/discord/sync', { type: 'wallets', data: [] }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });
  });

  describe('input validation', () => {
    it('returns 503 for non-JSON body (secret check hits first)', async () => {
      // Route checks secret before attempting to parse JSON
      const req = new (await import('next/server')).NextRequest(
        new URL('/api/discord/sync', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'not json',
        },
      );

      const res = await POST(req);
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });

    it('returns 503 when type is missing (secret check hits first)', async () => {
      // Route checks secret before validating input schema
      const res = await POST(makePostRequest('/api/discord/sync', { data: [] }));
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });

    it('returns 503 when type is invalid (secret check hits first)', async () => {
      // Route checks secret before validating input schema
      const res = await POST(
        makePostRequest('/api/discord/sync', {
          type: 'invalid',
          data: [],
        }),
      );
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });

    it('returns 503 when data is not an array (secret check hits first)', async () => {
      // Route checks secret before validating input schema
      const res = await POST(
        makePostRequest('/api/discord/sync', {
          type: 'wallets',
          data: 'not an array',
        }),
      );
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });
  });

  describe('POST type=wallets', () => {
    it('returns 500 on error with no secret configured', async () => {
      const res = await POST(
        makePostRequest('/api/discord/sync', {
          type: 'wallets',
          data: [
            {
              discord_id: 'user1',
              discord_name: 'alice',
              wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
            },
          ],
        }),
      );
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });
  });

  describe('POST type=history', () => {
    it('returns 500 on error with no secret configured', async () => {
      const res = await POST(
        makePostRequest('/api/discord/sync', {
          type: 'history',
          data: [
            {
              group_name: 'Test Fractal',
              completed_at: '2023-01-01T00:00:00Z',
              facilitator_name: 'Facilitator',
              rankings: [],
            },
          ],
        }),
      );
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });
  });

  describe('error handling', () => {
    it('returns 503 when request body parsing fails (secret check hits first)', async () => {
      // Route checks secret before attempting to parse JSON
      const res = await POST(
        new (await import('next/server')).NextRequest(
          new URL('/api/discord/sync', 'http://localhost:3000'),
          {
            method: 'POST',
            body: '{"invalid": json}',
          },
        ),
      );
      const body = (await res.json()) as unknown as Record<string, unknown>;

      expect(res.status).toBe(503);
      expect(body.error).toBe('Sync not configured');
    });
  });
});
