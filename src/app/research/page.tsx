import { Metadata } from 'next';
import Link from 'next/link';
import { readdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Research Library · ZAO OS',
  description: 'ZAO ecosystem research documents — architecture, integrations, and technical decisions.',
};

const RESEARCH_ROOT = join(process.cwd(), 'research');

interface ResearchEntry {
  slug: string;
  title: string;
}

async function getResearchDocs(): Promise<ResearchEntry[]> {
  const entries: ResearchEntry[] = [];
  try {
    const dirs = await readdir(RESEARCH_ROOT, { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      if (dir.name.startsWith('.') || dir.name === 'node_modules') continue;

      // Try to read the README to extract the title
      try {
        const { readFile } = await import('fs/promises');
        const content = await readFile(join(RESEARCH_ROOT, dir.name, 'README.md'), 'utf-8');
        const title = content.match(/^#\s+(.+)$/m)?.[1] || dir.name;
        entries.push({ slug: dir.name, title });
      } catch {
        // No README — still list the directory
        entries.push({ slug: dir.name, title: dir.name });
      }
    }
  } catch {
    // research dir doesn't exist or isn't readable
  }

  return entries.sort((a, b) => a.slug.localeCompare(b.slug));
}

export default async function ResearchIndex() {
  const docs = await getResearchDocs();

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/portal" className="text-xs text-gray-400 hover:text-[#f5a623]">
            ← Back to Portal
          </Link>
          <a
            href="https://github.com/bettercallzaal/ZAOOS/tree/main/research"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            View on GitHub ↗
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#f5a623] to-[#ffd700] bg-clip-text text-transparent mb-2">
          Research Library
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {docs.length} research documents covering architecture, integrations, and technical decisions.
        </p>

        {docs.length === 0 ? (
          <p className="text-gray-500 text-sm">No research documents found.</p>
        ) : (
          <div className="space-y-1">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/research/${doc.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06] transition-colors group"
              >
                <span className="text-[#f5a623]/50 text-xs font-mono w-10 shrink-0 text-right">
                  {doc.slug.match(/^\d+/)?.[0] || '—'}
                </span>
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors truncate">
                  {doc.title}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
