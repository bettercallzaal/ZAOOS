import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface OnePagerMeta {
  slug: string;
  title: string;
  audience: string;
  purpose: string;
  meeting_date?: string;
  meeting_location?: string;
  date: string;
  status: 'draft' | 'review' | 'final' | 'sent' | 'archived';
  visibility: 'internal' | 'public';
  version: number;
  authors?: string;
  reviewers?: string;
}

export interface OnePager extends OnePagerMeta {
  body: string;
}

const ROOT = path.join(process.cwd(), 'ZAO-STOCK', 'onepagers');

function safeReadDir(): string[] {
  try {
    return fs
      .readdirSync(ROOT)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('.'));
  } catch {
    return [];
  }
}

function parseFile(filename: string): OnePager | null {
  try {
    const slug = filename.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(ROOT, filename), 'utf8');
    const { data, content } = matter(raw);
    if (!data.title) return null;
    return {
      slug,
      title: String(data.title),
      audience: String(data.audience ?? ''),
      purpose: String(data.purpose ?? ''),
      meeting_date: data.meeting_date ? String(data.meeting_date) : undefined,
      meeting_location: data.meeting_location ? String(data.meeting_location) : undefined,
      date: data.date ? String(data.date) : '',
      status: (data.status ?? 'draft') as OnePagerMeta['status'],
      visibility: (data.visibility ?? 'internal') as OnePagerMeta['visibility'],
      version: typeof data.version === 'number' ? data.version : 1,
      authors: data.authors ? String(data.authors) : undefined,
      reviewers: data.reviewers ? String(data.reviewers) : undefined,
      body: content,
    };
  } catch {
    return null;
  }
}

export function listOnePagers(): OnePagerMeta[] {
  const files = safeReadDir();
  const pagers: OnePagerMeta[] = [];
  for (const f of files) {
    const p = parseFile(f);
    if (p) {
      const { body: _body, ...meta } = p;
      void _body;
      pagers.push(meta);
    }
  }
  return pagers.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export function getOnePager(slug: string): OnePager | null {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return null;
  const filename = `${slug}.md`;
  const target = path.join(ROOT, filename);
  if (!target.startsWith(ROOT)) return null; // path traversal guard
  return parseFile(filename);
}
