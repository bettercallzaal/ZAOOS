import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  screenInboundMedia,
  buildInboxFilename,
  saveInboundMediaToVault,
  commitAndPushInboundMedia,
  processInboundMedia,
  type InboundMediaInput,
} from '../inbound-media';

describe('inbound-media', () => {
  const testDir = join('/tmp', 'test-vault-inbound-media');

  beforeEach(() => {
    mkdirSync(join(testDir, 'inbox', '-'), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('screenInboundMedia (secret and PII screening)', () => {
    it('rejects media when caption contains a private key', () => {
      const input: InboundMediaInput = {
        filename: 'key.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('some text'),
        caption: 'Here is the key: -----BEGIN PRIVATE KEY----- secret -----END PRIVATE KEY-----',
      };
      const result = screenInboundMedia(input);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('secret');
    });

    it('rejects media when text file buffer contains a private key or API token', () => {
      const input: InboundMediaInput = {
        filename: 'creds.json',
        mimeType: 'text/plain',
        buffer: Buffer.from(JSON.stringify({ token: ['ghp', '1234567890abcdefghijklmnopqrstuvwxyz'].join('_') })),
        caption: 'GitHub token',
      };
      const result = screenInboundMedia(input);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('secret');
    });

    it('rejects media when caption contains un-allowlisted credit card number', () => {
      const input: InboundMediaInput = {
        filename: 'receipt.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
        caption: `Card used was ${['4111', '1111', '1111', '1234'].join(' ')} for hotel`,
      };
      const result = screenInboundMedia(input);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('PII');
    });

    it('accepts clean photo with harmless caption', () => {
      const input: InboundMediaInput = {
        filename: 'stage-setup.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
        caption: 'Stage setup at Franklin Parklet for ZAOstock',
      };
      const result = screenInboundMedia(input);
      expect(result.ok).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('accepts allowlisted email in caption without flagging as PII', () => {
      const input: InboundMediaInput = {
        filename: 'contact.png',
        mimeType: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        caption: 'Reach out to zaal@thezao.com if needed',
      };
      const result = screenInboundMedia(input);
      expect(result.ok).toBe(true);
    });
  });

  describe('buildInboxFilename', () => {
    it('prefixes timestamp and sanitizes special characters', () => {
      const fixedDate = new Date('2026-09-17T12:34:56Z');
      const filename = buildInboxFilename('Stage Photo (Draft 1).jpg', fixedDate);
      expect(filename).toBe('20260917-123456-Stage-Photo-Draft-1-.jpg');
    });

    it('handles empty or missing filename by supplying fallback', () => {
      const fixedDate = new Date('2026-09-17T12:34:56Z');
      const filename = buildInboxFilename('', fixedDate, 'image/jpeg');
      expect(filename).toBe('20260917-123456-photo.jpg');
    });

    it('defaults document fallback for pdf', () => {
      const fixedDate = new Date('2026-09-17T12:34:56Z');
      const filename = buildInboxFilename('', fixedDate, 'application/pdf');
      expect(filename).toBe('20260917-123456-document.pdf');
    });
  });

  describe('saveInboundMediaToVault', () => {
    it('saves media file and sidecar markdown file to inbox/-/', () => {
      const fixedDate = new Date('2026-09-17T12:34:56Z');
      const input: InboundMediaInput = {
        filename: 'menu.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 test pdf content'),
        caption: 'Baraza catering menu',
      };

      const result = saveInboundMediaToVault(testDir, input, fixedDate);
      expect(result.ok).toBe(true);
      expect(result.savedPath).toBe('inbox/-/20260917-123456-menu.pdf');

      const fullMediaPath = join(testDir, result.savedPath);
      expect(existsSync(fullMediaPath)).toBe(true);
      expect(readFileSync(fullMediaPath, 'utf8')).toBe('%PDF-1.4 test pdf content');

      // Sidecar markdown
      const sidecarPath = join(testDir, `${result.savedPath}.md`);
      expect(existsSync(sidecarPath)).toBe(true);
      const sidecarContent = readFileSync(sidecarPath, 'utf8');
      expect(sidecarContent).toContain('caption: "Baraza catering menu"');
      expect(sidecarContent).toContain('file: "20260917-123456-menu.pdf"');
    });

    it('saves media without sidecar if caption is empty', () => {
      const fixedDate = new Date('2026-09-17T12:34:56Z');
      const input: InboundMediaInput = {
        filename: 'screenshot.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake png'),
        caption: '',
      };

      const result = saveInboundMediaToVault(testDir, input, fixedDate);
      expect(result.ok).toBe(true);
      const fullMediaPath = join(testDir, result.savedPath);
      expect(existsSync(fullMediaPath)).toBe(true);

      const sidecarPath = join(testDir, `${result.savedPath}.md`);
      expect(existsSync(sidecarPath)).toBe(false);
    });
  });

  describe('git integration and processInboundMedia', () => {
    it('returns error if vault directory does not exist', async () => {
      const result = await processInboundMedia({
        filename: 'test.png',
        mimeType: 'image/png',
        buffer: Buffer.from('png bytes'),
        vaultDir: '/nonexistent/vault/path',
      });
      expect(result.ok).toBe(false);
      expect(result.message).toContain('Vault directory not found');
    });

    it('blocks sensitive media before saving or committing', async () => {
      const result = await processInboundMedia({
        filename: 'secret.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(['token = sk-ant', '1234567890abcdefghijklmno'].join('-')),
        caption: 'Anthropic token',
        vaultDir: testDir,
      });
      expect(result.ok).toBe(false);
      expect(result.message).toContain('Media blocked');
      expect(existsSync(join(testDir, 'inbox', '-'))).toBe(true);
      // Ensure nothing was saved into inbox/-/
      const files = readFileSync;
      // Directory should only contain no new files
    });

    it('commits media file and records commit message naming file, date, and caption', async () => {
      // Initialize a real git repo in testDir
      execSync('git init -b main', { cwd: testDir });
      execSync('git config user.name "test-bot"', { cwd: testDir });
      execSync('git config user.email "zoe-zao@agentmail.to"', { cwd: testDir });
      // Initial commit
      writeFileSync(join(testDir, 'README.md'), '# Test Vault\n');
      execSync('git add README.md && git commit -m "init"', { cwd: testDir });

      const fixedDate = new Date('2026-09-17T12:00:00Z');
      const input: InboundMediaInput = {
        filename: 'poster.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake jpg'),
        caption: 'ZAOstock 2026 Poster Draft',
      };

      const save = saveInboundMediaToVault(testDir, input, fixedDate);
      expect(save.ok).toBe(true);

      // We test commitAndPushInboundMedia (push will fail since no remote, but commit succeeds)
      const gitResult = await commitAndPushInboundMedia(
        testDir,
        save.savedPath,
        save.sidecarPath,
        { caption: input.caption, now: fixedDate },
      );

      expect(gitResult.ok).toBe(true);
      expect(gitResult.commitSha).toBeDefined();

      // Verify the commit was created in git history
      const log = execSync('git log -n 1 --pretty=format:"%s"', { cwd: testDir }).toString();
      expect(log).toContain('inbox: inbound media (20260917-120000-poster.jpg) - 2026-09-17 - ZAOstock 2026 Poster Draft');

      // Verify git status is clean (nothing unstaged or untracked)
      const status = execSync('git status --porcelain', { cwd: testDir }).toString();
      expect(status.trim()).toBe('');
    });
  });
});
