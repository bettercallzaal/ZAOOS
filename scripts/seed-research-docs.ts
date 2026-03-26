import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env.local (Next.js doesn't auto-load env outside of next dev/build)
config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_BASE = 'https://github.com/bettercallzaal/ZAOOS/tree/main';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface DocEntry {
  id: number;
  title: string;
  category: string;
  path: string;
  github_url: string;
}

async function main() {
  const readmePath = resolve(__dirname, '../research/README.md');
  const content = readFileSync(readmePath, 'utf-8');

  const entries: DocEntry[] = [];
  let currentCategory = 'Uncategorized';

  const lines = content.split('\n');

  for (const line of lines) {
    // Category headers: "## Farcaster Protocol & Ecosystem"
    const categoryMatch = line.match(/^##\s+([^#].+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Table row format: | [NN](./NN-slug/) | **Title** | Summary |
    // Match: | [number](./path/) | **title** |
    const tableMatch = line.match(
      /\|\s*\[(\d+)\]\(\.\/(\d+-[^)/]+)\/?[^)]*\)\s*\|\s*\*?\*?([^|*]+)\*?\*?\s*\|/
    );
    if (tableMatch) {
      const num = parseInt(tableMatch[1], 10);
      const slug = tableMatch[2].replace(/\/$/, ''); // remove trailing slash
      const title = tableMatch[3].trim();
      entries.push({
        id: num,
        title,
        category: currentCategory,
        path: `research/${slug}`,
        github_url: `${GITHUB_BASE}/research/${slug}/README.md`,
      });
      continue;
    }

    // Fallback: list format - [Title](NN-slug/)
    const listMatch = line.match(/[-*]\s+\[(.+?)\]\(\.?\/?(\d+)-([^)/]+)/);
    if (listMatch) {
      const title = listMatch[1].trim();
      const num = parseInt(listMatch[2], 10);
      const slug = `${listMatch[2]}-${listMatch[3]}`;
      entries.push({
        id: num,
        title,
        category: currentCategory,
        path: `research/${slug}`,
        github_url: `${GITHUB_BASE}/research/${slug}/README.md`,
      });
    }
  }

  // Deduplicate by id (keep first occurrence)
  const seen = new Set<number>();
  const unique = entries.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  console.log(`Parsed ${unique.length} research docs from ${lines.length} lines`);

  if (unique.length > 0) {
    console.log(`Categories found: ${[...new Set(unique.map(e => e.category))].join(', ')}`);
    console.log(`First 5: ${unique.slice(0, 5).map(e => `${e.id}: ${e.title}`).join(', ')}`);
  }

  if (unique.length === 0) {
    console.error('No docs found — check research/README.md format');
    process.exit(1);
  }

  // Upsert into research_docs
  const { error } = await supabase
    .from('research_docs')
    .upsert(unique, { onConflict: 'id' });

  if (error) {
    console.error('Failed to seed:', error);
    process.exit(1);
  }

  console.log(`Seeded ${unique.length} docs into research_docs table`);
}

main();
