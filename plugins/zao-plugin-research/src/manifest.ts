export default {
  id: "zao.research-library",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "ZAO Research Library",
  description:
    "Exposes the ZAO OS research library (190+ docs) to agents via search, browse, and read tools.",
  author: "ZAO <team@zaoos.com>",
  categories: ["knowledge"] as const,

  capabilities: [
    "agent.tools.register",
    "http.outbound",
  ],

  entrypoints: {
    worker: "./dist/worker.js",
  },

  instanceConfigSchema: {
    type: "object" as const,
    properties: {
      researchDir: {
        type: "string" as const,
        description: "Absolute path to the research/ directory",
        default: "/home/zaal/openclaw-workspace/zaoos/research",
      },
    },
  },

  tools: [
    {
      name: "search-research",
      displayName: "Search Research Library",
      description:
        "Full-text search across all ZAO OS research documents. Returns matching doc summaries.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string" as const,
            description: "Search query (keywords, topic, or question)",
          },
          category: {
            type: "string" as const,
            description:
              "Optional category filter: farcaster, music, onchain-distribution, community, identity-governance, ai-agent, cross-platform, infrastructure, apis, wavewarz, security, dev-workflows, other",
          },
          limit: {
            type: "number" as const,
            description: "Max results to return (default 10)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "read-research-doc",
      displayName: "Read Research Document",
      description:
        "Read the full content of a research document by its ID or slug.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          id: {
            type: "string" as const,
            description:
              'Document ID (e.g. "001") or slug (e.g. "farcaster-protocol")',
          },
        },
        required: ["id"],
      },
    },
    {
      name: "list-research-categories",
      displayName: "List Research Categories",
      description:
        "List all research categories with doc counts and descriptions.",
      parametersSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "research-stats",
      displayName: "Research Library Stats",
      description:
        "Get statistics about the research library: total docs, categories, recent additions.",
      parametersSchema: {
        type: "object" as const,
        properties: {},
      },
    },
  ],
};
