import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

interface ResearchDoc {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  status: string;
  date: string;
  summary: string;
  related: string[];
  code_paths: string[];
}

interface KnowledgeIndex {
  version: number;
  generated: string;
  doc_count: number;
  docs: ResearchDoc[];
}

let knowledgeIndex: KnowledgeIndex | null = null;
let researchDir = "/home/zaal/openclaw-workspace/zaoos/research";

async function loadIndex(): Promise<KnowledgeIndex> {
  if (knowledgeIndex) return knowledgeIndex;
  const raw = await readFile(
    join(researchDir, "_graph", "KNOWLEDGE.json"),
    "utf-8",
  );
  knowledgeIndex = JSON.parse(raw) as KnowledgeIndex;
  return knowledgeIndex;
}

function docDirName(doc: ResearchDoc): string {
  return `${doc.id}-${doc.slug}`;
}

async function readDocContent(doc: ResearchDoc): Promise<string> {
  const dir = join(researchDir, docDirName(doc));
  const readmePath = join(dir, "README.md");
  try {
    return await readFile(readmePath, "utf-8");
  } catch {
    // Try alternate naming patterns
    const files = await readdir(dir).catch(() => [] as string[]);
    const md = files.find((f: string) => f.endsWith(".md"));
    if (md) return await readFile(join(dir, md), "utf-8");
    return `(No content found in ${dir})`;
  }
}

function searchDocs(
  docs: ResearchDoc[],
  query: string,
  category?: string,
  limit = 10,
): ResearchDoc[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  let filtered = docs;
  if (category) {
    filtered = filtered.filter((d) => d.category === category);
  }

  const scored = filtered.map((doc) => {
    const haystack =
      `${doc.title} ${doc.summary} ${doc.tags.join(" ")} ${doc.category}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (doc.title.toLowerCase().includes(term)) score += 3;
      if (doc.summary.toLowerCase().includes(term)) score += 2;
      if (doc.tags.some((t) => t.toLowerCase().includes(term))) score += 2;
      if (haystack.includes(term)) score += 1;
    }
    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.doc);
}

const plugin = definePlugin({
  async setup(ctx: any) {
    const config = ctx.config ?? {};
    if (config.researchDir) {
      researchDir = config.researchDir;
    }

    ctx.tools.register(
      "search-research",
      {},
      async (params: { query: string; category?: string; limit?: number }) => {
        const index = await loadIndex();
        const results = searchDocs(
          index.docs,
          params.query,
          params.category,
          params.limit ?? 10,
        );

        if (results.length === 0) {
          return {
            content: `No research docs found for "${params.query}"${params.category ? ` in category "${params.category}"` : ""}.`,
          };
        }

        const lines = results.map(
          (d) =>
            `- **[${d.id}] ${d.title}** (${d.category}) — ${d.summary}`,
        );
        return {
          content: `Found ${results.length} research doc(s):\n\n${lines.join("\n")}`,
          data: { results: results.map((d) => ({ id: d.id, slug: d.slug, title: d.title, category: d.category })) },
        };
      },
    );

    ctx.tools.register(
      "read-research-doc",
      {},
      async (params: { id: string }) => {
        const index = await loadIndex();
        const doc = index.docs.find(
          (d) => d.id === params.id || d.slug === params.id,
        );
        if (!doc) {
          return {
            content: `Research doc "${params.id}" not found. Use search-research to find docs.`,
          };
        }

        const content = await readDocContent(doc);
        return {
          content: `# ${doc.title}\n\n**ID:** ${doc.id} | **Category:** ${doc.category} | **Status:** ${doc.status} | **Date:** ${doc.date}\n**Tags:** ${doc.tags.join(", ")}\n\n---\n\n${content}`,
          data: { id: doc.id, slug: doc.slug, title: doc.title },
        };
      },
    );

    ctx.tools.register(
      "list-research-categories",
      {},
      async () => {
        const index = await loadIndex();
        const cats = new Map<string, number>();
        for (const doc of index.docs) {
          cats.set(doc.category, (cats.get(doc.category) ?? 0) + 1);
        }
        const lines = [...cats.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => `- **${cat}**: ${count} docs`);

        return {
          content: `Research categories (${cats.size} total):\n\n${lines.join("\n")}`,
          data: { categories: Object.fromEntries(cats) },
        };
      },
    );

    ctx.tools.register(
      "research-stats",
      {},
      async () => {
        const index = await loadIndex();
        const cats = new Set(index.docs.map((d) => d.category));
        const tags = new Set(index.docs.flatMap((d) => d.tags));
        const byStatus = new Map<string, number>();
        for (const doc of index.docs) {
          byStatus.set(doc.status, (byStatus.get(doc.status) ?? 0) + 1);
        }
        const recent = [...index.docs]
          .sort((a, b) => Number(b.id) - Number(a.id))
          .slice(0, 5);

        return {
          content: [
            `**Research Library Stats**`,
            `- Total documents: ${index.doc_count}`,
            `- Categories: ${cats.size}`,
            `- Unique tags: ${tags.size}`,
            `- By status: ${[...byStatus.entries()].map(([s, c]) => `${s}(${c})`).join(", ")}`,
            `- Last generated: ${index.generated}`,
            ``,
            `**5 Most Recent:**`,
            ...recent.map(
              (d) => `- [${d.id}] ${d.title} (${d.category})`,
            ),
          ].join("\n"),
          data: {
            docCount: index.doc_count,
            categories: cats.size,
            tags: tags.size,
          },
        };
      },
    );

    ctx.logger.info("ZAO Research Library plugin loaded", {
      researchDir,
    });
  },
});

runWorker(plugin, import.meta.url);
