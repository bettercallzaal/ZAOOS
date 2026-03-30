const manifest = {
  id: "zao.farcaster-notifications",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "ZAO Farcaster Notifications",
  description:
    "Bidirectional Farcaster integration for Paperclip agents — search, read, and post casts via Neynar API.",
  author: "ZAO <team@zaoos.com>",
  categories: ["automation"] as const,

  capabilities: ["agent.tools.register", "http.outbound"],

  entrypoints: {
    worker: "./dist/worker.js",
  },

  instanceConfigSchema: {
    type: "object" as const,
    properties: {
      neynarApiKey: {
        type: "string" as const,
        description: "Neynar API key",
      },
      signerUuid: {
        type: "string" as const,
        description: "Neynar managed signer UUID for posting",
      },
      defaultChannelId: {
        type: "string" as const,
        description: "Default channel to post to (e.g. zaos)",
      },
    },
    required: ["neynarApiKey"],
  },

  tools: [
    {
      name: "search-farcaster-casts",
      displayName: "Search Farcaster Casts",
      description:
        "Search recent Farcaster casts by keyword, channel, or user FID via Neynar API.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string" as const,
            description: "Search query (keywords or phrase)",
          },
          channelId: {
            type: "string" as const,
            description: "Filter by channel ID (e.g. zaos)",
          },
          authorFid: {
            type: "number" as const,
            description: "Filter by author FID",
          },
          limit: {
            type: "number" as const,
            description: "Max results to return (default 10, max 25)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get-farcaster-cast",
      displayName: "Get Farcaster Cast",
      description: "Fetch a single Farcaster cast by its hash.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          hash: {
            type: "string" as const,
            description: "Cast hash (0x-prefixed)",
          },
        },
        required: ["hash"],
      },
    },
    {
      name: "watch-farcaster-channel",
      displayName: "Watch Farcaster Channel",
      description:
        "Fetch the latest casts from a Farcaster channel. Returns recent activity to surface to the agent.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          channelId: {
            type: "string" as const,
            description: "Channel ID to watch (e.g. zaos, music)",
          },
          limit: {
            type: "number" as const,
            description: "Number of recent casts to return (default 10, max 25)",
          },
        },
        required: ["channelId"],
      },
    },
    {
      name: "post-farcaster-cast",
      displayName: "Post Farcaster Cast",
      description:
        "Post a new cast to Farcaster via Neynar. Requires signer UUID in plugin config.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          text: {
            type: "string" as const,
            description: "Cast text content (max 320 characters)",
          },
          channelId: {
            type: "string" as const,
            description:
              "Channel to post in. Falls back to defaultChannelId from config.",
          },
          embeds: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                url: { type: "string" as const },
              },
            },
            description: "Optional URL embeds",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "reply-farcaster-cast",
      displayName: "Reply to Farcaster Cast",
      description: "Reply to an existing Farcaster cast. Requires signer UUID in plugin config.",
      parametersSchema: {
        type: "object" as const,
        properties: {
          parentHash: {
            type: "string" as const,
            description: "Hash of the cast to reply to (0x-prefixed)",
          },
          text: {
            type: "string" as const,
            description: "Reply text content (max 320 characters)",
          },
          embeds: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                url: { type: "string" as const },
              },
            },
            description: "Optional URL embeds",
          },
        },
        required: ["parentHash", "text"],
      },
    },
  ],
};

export default manifest;
