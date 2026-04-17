import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readFile } from 'fs/promises';
import { join } from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string[] }>;
}

const RESEARCH_ROOT = join(process.cwd(), 'research');

async function readDoc(slugParts: string[]): Promise<string | null> {
  const relPath = slugParts.join('/');
  if (relPath.includes('..')) return null;
  try {
    const content = await readFile(join(RESEARCH_ROOT, relPath, 'README.md'), 'utf-8');
    return content;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await readDoc(slug);
  if (!content) return { title: 'Research not found' };
  const title = content.match(/^#\s+(.+)$/m)?.[1] || slug.join('/');
  return {
    title: `${title} · ZAO Research`,
    description: `ZAO ecosystem research doc: ${title}`,
  };
}

export default async function ResearchDoc({ params }: Props) {
  const { slug } = await params;
  const content = await readDoc(slug);
  if (!content) notFound();

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock/team" className="text-xs text-gray-400 hover:text-[#f5a623]">← Back to Dashboard</Link>
          <a
            href={`https://github.com/bettercallzaal/ZAOOS/tree/main/research/${slug.join('/')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            View on GitHub ↗
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <article className="prose-zao">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>

      <style>{`
        .prose-zao h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.01em; color: white; margin-top: 0; margin-bottom: 1rem; }
        .prose-zao h2 { font-size: 1.25rem; font-weight: 700; color: #f5a623; margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem; }
        .prose-zao h3 { font-size: 1rem; font-weight: 700; color: white; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-zao p { color: #d1d5db; line-height: 1.7; margin: 0.75rem 0; font-size: 0.95rem; }
        .prose-zao strong { color: white; font-weight: 600; }
        .prose-zao em { color: #e5e7eb; }
        .prose-zao a { color: #f5a623; text-decoration: underline; }
        .prose-zao a:hover { color: #ffd700; }
        .prose-zao code { background: rgba(245, 166, 35, 0.1); color: #f5a623; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; }
        .prose-zao pre { background: #0d1b2a; border: 1px solid rgba(255,255,255,0.08); border-radius: 0.5rem; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .prose-zao pre code { background: transparent; color: #e5e7eb; padding: 0; }
        .prose-zao ul, .prose-zao ol { color: #d1d5db; margin: 0.75rem 0; padding-left: 1.5rem; }
        .prose-zao li { margin: 0.35rem 0; line-height: 1.6; font-size: 0.95rem; }
        .prose-zao table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
        .prose-zao th { background: rgba(245, 166, 35, 0.08); color: #f5a623; font-weight: 700; text-align: left; padding: 0.6rem 0.75rem; border-bottom: 2px solid rgba(245, 166, 35, 0.3); }
        .prose-zao td { color: #d1d5db; padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
        .prose-zao blockquote { border-left: 3px solid #f5a623; padding-left: 1rem; color: #9ca3af; font-style: italic; margin: 1rem 0; }
        .prose-zao hr { border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 2rem 0; }
      `}</style>
    </div>
  );
}
