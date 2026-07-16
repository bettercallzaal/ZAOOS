import { describe, it, expect, vi } from 'vitest';
import { extractFirstUrl, normalizeUrl, wasResearched } from '../research-dedupe';

describe('research-dedupe', () => {
  describe('extractFirstUrl', () => {
    it('extracts a URL from text', () => {
      expect(extractFirstUrl('research this https://example.com/page')).toBe(
        'https://example.com/page',
      );
    });

    it('returns null if no URL present', () => {
      expect(extractFirstUrl('just some text without a link')).toBeNull();
    });

    it('extracts http URLs', () => {
      expect(extractFirstUrl('check out http://example.com')).toBe('http://example.com');
    });

    it('extracts only the first URL when multiple present', () => {
      expect(extractFirstUrl('https://first.com and https://second.com')).toBe(
        'https://first.com',
      );
    });

    it('stops at whitespace', () => {
      expect(extractFirstUrl('analyze https://example.com/path some other text')).toBe(
        'https://example.com/path',
      );
    });
  });

  describe('normalizeUrl', () => {
    it('normalizes https to same as http', () => {
      expect(normalizeUrl('https://example.com/path')).toBe('example.com/path');
      expect(normalizeUrl('http://example.com/path')).toBe('example.com/path');
    });

    it('lowercases the host', () => {
      expect(normalizeUrl('https://EXAMPLE.COM/path')).toBe('example.com/path');
      expect(normalizeUrl('https://Example.Com/Path')).toBe('example.com/path');
    });

    it('strips trailing slash from path', () => {
      expect(normalizeUrl('https://example.com/path/')).toBe('example.com/path');
    });

    it('removes query strings', () => {
      expect(normalizeUrl('https://example.com/path?query=value&other=1')).toBe(
        'example.com/path',
      );
    });

    it('removes fragments', () => {
      expect(normalizeUrl('https://example.com/path#section')).toBe('example.com/path');
    });

    it('handles all together: protocol + host case + trailing slash + query + fragment', () => {
      expect(normalizeUrl('HTTPS://EXAMPLE.COM/path/?q=1&x=2#section')).toBe(
        'example.com/path',
      );
    });

    it('handles malformed URLs by doing basic cleanup', () => {
      // If URL parsing fails, it falls back to simple string manipulation
      const result = normalizeUrl('not-a-real-url');
      expect(result).toBe('not-a-real-url'); // No https:// to strip, just lowercased
    });

    it('preserves path structure', () => {
      expect(normalizeUrl('https://example.com/a/b/c')).toBe('example.com/a/b/c');
    });
  });

  describe('wasResearched', () => {
    it('returns false if URL not found in any doc', async () => {
      const mockReadFile = vi.fn().mockRejectedValue(new Error('not found'));
      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business', 'dev-workflows'];
        return []; // No docs in these categories
      });

      const result = await wasResearched(
        'https://example.com/test',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(false);
    });

    it('returns true when URL is found in a README', async () => {
      const mockReadFile = vi.fn(async (path: string) => {
        if (path.includes('123-test')) {
          return `---\ntopic: business\n---\n\n# Test Doc\n\nFound the URL: https://example.com/test in this doc`;
        }
        throw new Error('not found');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business'];
        if (path.includes('/research/business')) return ['123-test'];
        return [];
      });

      const result = await wasResearched(
        'https://example.com/test',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(true);
    });

    it('normalizes URLs before comparing (protocol difference)', async () => {
      const mockReadFile = vi.fn(async (path: string) => {
        if (path.includes('456-test')) {
          return `---\n---\n\nFound http://example.com/path here`;
        }
        throw new Error('not found');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business'];
        if (path.includes('/research/business')) return ['456-test'];
        return [];
      });

      // Query with https, doc has http - should still match
      const result = await wasResearched(
        'https://example.com/path',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(true);
    });

    it('normalizes URLs before comparing (trailing slash difference)', async () => {
      const mockReadFile = vi.fn(async (path: string) => {
        if (path.includes('789-test')) {
          return `---\n---\n\nResearched: https://EXAMPLE.COM/path/`;
        }
        throw new Error('not found');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['infrastructure'];
        if (path.includes('/research/infrastructure')) return ['789-test'];
        return [];
      });

      // Query without trailing slash, doc has it - should still match
      const result = await wasResearched(
        'https://example.com/path',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(true);
    });

    it('normalizes URLs before comparing (query string difference)', async () => {
      const mockReadFile = vi.fn(async (path: string) => {
        if (path.includes('111-test')) {
          return `---\n---\n\nhttps://example.com/page?old=param&was=here`;
        }
        throw new Error('not found');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['dev-workflows'];
        if (path.includes('/research/dev-workflows')) return ['111-test'];
        return [];
      });

      // Query with different params, same path - should match
      const result = await wasResearched(
        'https://example.com/page?new=param',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(true);
    });

    it('skips archive and meta directories (_archive, .hidden)', async () => {
      const mockReadFile = vi.fn();
      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['_archive', '.hidden', 'business'];
        return []; // Don't have docs in real categories
      });

      const result = await wasResearched(
        'https://example.com/test',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );

      // Should have tried to list _archive and .hidden but skipped them
      expect(mockReaddir).toHaveBeenCalledWith('/fake/research');
      // Should not have called readFile at all since no real docs exist
      expect(mockReadFile).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('returns false if research directory does not exist', async () => {
      const mockReadFile = vi.fn();
      const mockReaddir = vi.fn(async () => {
        throw new Error('ENOENT: directory does not exist');
      });

      const result = await wasResearched(
        'https://example.com/test',
        '/nonexistent/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(false);
    });

    it('returns false if a category directory cannot be read', async () => {
      const mockReadFile = vi.fn();
      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business', 'broken-category'];
        // broken-category fails to list
        throw new Error('permission denied');
      });

      const result = await wasResearched(
        'https://example.com/test',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(false);
    });

    it('continues checking other docs if one README read fails', async () => {
      let callCount = 0;
      const mockReadFile = vi.fn(async (path: string) => {
        callCount++;
        if (path.includes('111-fail')) {
          throw new Error('cannot read');
        }
        if (path.includes('222-success')) {
          return `---\n---\n\nFound https://example.com/found`;
        }
        throw new Error('not found');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business'];
        if (path.includes('/research/business')) return ['111-fail', '222-success'];
        return [];
      });

      const result = await wasResearched(
        'https://example.com/found',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(true);
      // Should have tried to read both, despite the first failing
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });

    it('checks original-query frontmatter field for URL match', async () => {
      const mockReadFile = vi.fn(async (path: string) => {
        if (path.includes('333-test')) {
          return `---\noriginal-query: "https://example.com/original"\n---\n\n# Doc\n\nContent here`;
        }
        throw new Error('not found');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business'];
        if (path.includes('/research/business')) return ['333-test'];
        return [];
      });

      const result = await wasResearched(
        'https://example.com/original',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(true);
    });

    it('fails-open (returns false) on unexpected errors', async () => {
      const mockReadFile = vi.fn(async () => {
        throw new Error('unexpected error');
      });

      const mockReaddir = vi.fn(async (path: string) => {
        if (path.endsWith('research')) return ['business'];
        throw new Error('unexpected error');
      });

      const result = await wasResearched(
        'https://example.com/test',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(false);
    });

    it('handles empty normalized URL gracefully', async () => {
      const mockReadFile = vi.fn();
      const mockReaddir = vi.fn();

      // A URL that normalizes to empty string
      const result = await wasResearched(
        'http://',
        '/fake/research',
        mockReadFile,
        mockReaddir,
      );
      expect(result).toBe(false);
      // Should not have called readdir if URL normalized to empty
      expect(mockReaddir).not.toHaveBeenCalled();
    });
  });
});
