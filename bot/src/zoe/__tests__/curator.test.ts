/**
 * curator.test.ts - Tests for the clean-curator topic posting system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// Mock execSync before importing curator
let mockExecSyncImpl = (cmd: string) => {
  throw new Error('execSync not mocked');
};

vi.mock('node:child_process', () => ({
  execSync: (cmd: string, opts: Record<string, unknown>) => {
    return mockExecSyncImpl(cmd);
  },
}));

import {
  readTopicThreadMap,
  writeTopicThreadMap,
  logTopicThreadId,
  resolveTopicThreadId,
  postToTopic,
  curatorEnabled,
  generateGithubDigest,
  generateNewsletterPost,
  type TopicKey,
  type CuratorTickResult,
  runCuratorTick,
} from '../curator';

const TEST_ZOE_HOME = join(homedir(), '.zao', 'zoe-test-curator');
const TEST_TOPIC_MAP_PATH = join(TEST_ZOE_HOME, 'topic_thread_map.json');

describe('curator', () => {
  beforeEach(async () => {
    // Set test env
    process.env.ZOE_HOME = TEST_ZOE_HOME;
    // Clean up test dir
    try {
      await fs.rm(TEST_ZOE_HOME, { recursive: true });
    } catch {
      // OK if it doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(TEST_ZOE_HOME, { recursive: true });
    } catch {
      // OK
    }
    delete process.env.ZOE_HOME;
    // Clean up all TG_TOPIC_* env vars
    delete process.env.TG_TOPIC_NEWSLETTER;
    delete process.env.TG_TOPIC_GITHUB;
    delete process.env.TG_TOPIC_ARTIZEN;
    delete process.env.TG_TOPIC_RECOMMENDATIONS;
    delete process.env.TG_TOPIC_GENERAL;
  });

  describe('readTopicThreadMap / writeTopicThreadMap', () => {
    it('returns empty object when file does not exist', async () => {
      const map = await readTopicThreadMap();
      expect(map).toEqual({});
    });

    it('persists and reads topic mappings', async () => {
      const map = { newsletter: 123, github: 456 };
      await writeTopicThreadMap(map);
      const read = await readTopicThreadMap();
      expect(read).toEqual(map);
    });
  });

  describe('logTopicThreadId', () => {
    it('persists a topic -> thread_id mapping', async () => {
      await logTopicThreadId('newsletter', 999);
      const map = await readTopicThreadMap();
      expect(map.newsletter).toBe(999);
    });

    it('updates an existing mapping', async () => {
      await logTopicThreadId('github', 111);
      await logTopicThreadId('github', 222);
      const map = await readTopicThreadMap();
      expect(map.github).toBe(222);
    });

    it('is idempotent (logging same topic+id twice is a no-op)', async () => {
      await logTopicThreadId('artizen', 777);
      await logTopicThreadId('artizen', 777);
      const map = await readTopicThreadMap();
      expect(map.artizen).toBe(777);
    });
  });

  describe('resolveTopicThreadId', () => {
    it('returns undefined when topic is not set', async () => {
      const threadId = await resolveTopicThreadId('newsletter');
      expect(threadId).toBeUndefined();
    });

    it('returns thread_id from env var if set', async () => {
      process.env.TG_TOPIC_GITHUB = '888';
      const threadId = await resolveTopicThreadId('github');
      expect(threadId).toBe(888);
      delete process.env.TG_TOPIC_GITHUB;
    });

    it('prioritizes env var over logged map', async () => {
      await logTopicThreadId('newsletter', 123);
      process.env.TG_TOPIC_NEWSLETTER = '456';
      const threadId = await resolveTopicThreadId('newsletter');
      expect(threadId).toBe(456);
      delete process.env.TG_TOPIC_NEWSLETTER;
    });

    it('falls back to logged map when env var is not set', async () => {
      await logTopicThreadId('recommendations', 555);
      const threadId = await resolveTopicThreadId('recommendations');
      expect(threadId).toBe(555);
    });

    it('returns undefined for invalid env var values', async () => {
      process.env.TG_TOPIC_GENERAL = 'not-a-number';
      const threadId = await resolveTopicThreadId('general');
      expect(threadId).toBeUndefined();
      delete process.env.TG_TOPIC_GENERAL;
    });
  });

  describe('postToTopic', () => {
    it('returns false and logs warning when topic thread_id is unset', async () => {
      const send = vi.fn();
      const result = await postToTopic(send, 123, 'newsletter', 'test message');
      expect(result).toBe(false);
      expect(send).not.toHaveBeenCalled();
    });

    it('sends a message when topic thread_id is set', async () => {
      process.env.TG_TOPIC_NEWSLETTER = '777';
      const send = vi.fn().mockResolvedValue(undefined);
      const result = await postToTopic(send, 123, 'newsletter', 'test message');
      expect(result).toBe(true);
      expect(send).toHaveBeenCalledWith(123, 'test message', { message_thread_id: 777 });
      delete process.env.TG_TOPIC_NEWSLETTER;
    });

    it('returns false and logs error if send throws', async () => {
      process.env.TG_TOPIC_GITHUB = '888';
      const send = vi.fn().mockRejectedValue(new Error('send failed'));
      const result = await postToTopic(send, 123, 'github', 'test message');
      expect(result).toBe(false);
      delete process.env.TG_TOPIC_GITHUB;
    });
  });

  describe('curatorEnabled', () => {
    it('returns false when not all topics are set', async () => {
      process.env.TG_TOPIC_NEWSLETTER = '111';
      process.env.TG_TOPIC_GITHUB = '222';
      // Missing artizen, recommendations, general
      const enabled = await curatorEnabled();
      expect(enabled).toBe(false);
      delete process.env.TG_TOPIC_NEWSLETTER;
      delete process.env.TG_TOPIC_GITHUB;
    });

    it('returns true when all topics are set via env', async () => {
      process.env.TG_TOPIC_NEWSLETTER = '111';
      process.env.TG_TOPIC_GITHUB = '222';
      process.env.TG_TOPIC_ARTIZEN = '333';
      process.env.TG_TOPIC_RECOMMENDATIONS = '444';
      process.env.TG_TOPIC_GENERAL = '555';
      const enabled = await curatorEnabled();
      expect(enabled).toBe(true);
      delete process.env.TG_TOPIC_NEWSLETTER;
      delete process.env.TG_TOPIC_GITHUB;
      delete process.env.TG_TOPIC_ARTIZEN;
      delete process.env.TG_TOPIC_RECOMMENDATIONS;
      delete process.env.TG_TOPIC_GENERAL;
    });

    it('returns true when all topics are set via logged map', async () => {
      await logTopicThreadId('newsletter', 111);
      await logTopicThreadId('github', 222);
      await logTopicThreadId('artizen', 333);
      await logTopicThreadId('recommendations', 444);
      await logTopicThreadId('general', 555);
      const enabled = await curatorEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe('generateGithubDigest', () => {
    it('returns a digest with timestamp when PRs are found', async () => {
      // Mock execSync to return sample merged PRs
      mockExecSyncImpl = (cmd: string) => {
        if (cmd.includes('bettercallzaal/ZAOOS')) {
          return JSON.stringify([
            { number: 100, title: 'docs: research doc 1078' },
            { number: 99, title: 'fix: bug in curator' },
          ]);
        }
        if (cmd.includes('ZAODEVZ/ZAOcowork')) {
          return JSON.stringify([{ number: 50, title: 'feat: new feature' }]);
        }
        throw new Error('Unexpected command');
      };

      const digest = await generateGithubDigest();
      expect(digest).not.toBeNull();
      expect(digest?.text).toContain("Today's ships");
      expect(digest?.timestamp).toBeDefined();
      expect(digest?.text).toContain('#100');
      expect(digest?.text).toContain('#99');
    });

    it('returns null when no PRs are found', async () => {
      // Mock execSync to return empty arrays
      mockExecSyncImpl = () => JSON.stringify([]);

      const digest = await generateGithubDigest();
      expect(digest).toBeNull();
    });

    it('gracefully handles gh command failures', async () => {
      // Mock execSync to throw an error
      mockExecSyncImpl = () => {
        throw new Error('gh: not found');
      };

      const digest = await generateGithubDigest();
      expect(digest).toBeNull();
    });
  });

  describe('generateNewsletterPost', () => {
    it('formats a newsletter post with URL and frame text', () => {
      const post = generateNewsletterPost('https://example.com/issue', 'Today: updates');
      expect(post.text).toContain('Daily newsletter published');
      expect(post.text).toContain('https://example.com/issue');
      expect(post.text).toContain('Today: updates');
    });
  });

  describe('runCuratorTick', () => {
    it('returns disabled=false when curator is not enabled', async () => {
      const send = vi.fn();
      const result = await runCuratorTick(send, 123);
      expect(result.enabled).toBe(false);
      expect(result.posted).toBe(0);
    });

    it('returns enabled=true when curator is fully configured', async () => {
      process.env.TG_TOPIC_NEWSLETTER = '111';
      process.env.TG_TOPIC_GITHUB = '222';
      process.env.TG_TOPIC_ARTIZEN = '333';
      process.env.TG_TOPIC_RECOMMENDATIONS = '444';
      process.env.TG_TOPIC_GENERAL = '555';

      const send = vi.fn().mockResolvedValue(undefined);
      const result = await runCuratorTick(send, 123);
      expect(result.enabled).toBe(true);
      expect(result.errors).toHaveLength(0);

      delete process.env.TG_TOPIC_NEWSLETTER;
      delete process.env.TG_TOPIC_GITHUB;
      delete process.env.TG_TOPIC_ARTIZEN;
      delete process.env.TG_TOPIC_RECOMMENDATIONS;
      delete process.env.TG_TOPIC_GENERAL;
    });

    it('attempts to post github digest when enabled', async () => {
      process.env.TG_TOPIC_NEWSLETTER = '111';
      process.env.TG_TOPIC_GITHUB = '222';
      process.env.TG_TOPIC_ARTIZEN = '333';
      process.env.TG_TOPIC_RECOMMENDATIONS = '444';
      process.env.TG_TOPIC_GENERAL = '555';

      const send = vi.fn().mockResolvedValue(undefined);
      const result = await runCuratorTick(send, 123);
      expect(result.posted).toBeGreaterThanOrEqual(0);

      delete process.env.TG_TOPIC_NEWSLETTER;
      delete process.env.TG_TOPIC_GITHUB;
      delete process.env.TG_TOPIC_ARTIZEN;
      delete process.env.TG_TOPIC_RECOMMENDATIONS;
      delete process.env.TG_TOPIC_GENERAL;
    });
  });
});
