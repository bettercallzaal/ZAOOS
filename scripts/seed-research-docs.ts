import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_BASE = 'https://github.com/zaalpanthaki/ZAO-OS-V1/tree/main';

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
    // Category headers like "### Farcaster Protocol & Ecosystem"
    const categoryMatch = line.match(/^###\s+(.+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Try link format: - [Title](NN-slug/) or - [Title](NN-slug/README.md)
    const linkMatch = line.match(/[-*]\s+\[(.+?)\]\((\d+)-([^)/]+)/);
    if (linkMatch) {
      const title = linkMatch[1].trim();
      const num = parseInt(linkMatch[2], 10);
      const slug = `${linkMatch[2]}-${linkMatch[3]}`;
      entries.push({
        id: num,
        title,
        category: currentCategory,
        path: `research/${slug}`,
        github_url: `${GITHUB_BASE}/research/${slug}/README.md`,
      });
      continue;
    }

    // Try plain format: - **01** — Title or - 01 — Title
    const plainMatch = line.match(/[-*]\s+\*?\*?(\d+)\*?\*?\s*[—–-]\s*(.+)/);
    if (plainMatch) {
      const num = parseInt(plainMatch[1], 10);
      const title = plainMatch[2].replace(/\[|\]|\(.*\)/g, '').trim();
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      entries.push({
        id: num,
        title,
        category: currentCategory,
        path: `research/${String(num).padStart(2, '0')}-${slug}`,
        github_url: `${GITHUB_BASE}/research/${String(num).padStart(2, '0')}-${slug}/README.md`,
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

  console.log(`Parsed ${unique.length} research docs`);

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
