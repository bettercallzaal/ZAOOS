import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import manifest from "./manifest.js";

const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

interface PluginConfig {
  neynarApiKey: string;
  signerUuid?: string;
  defaultChannelId?: string;
}

interface NeynarCast {
  hash: string;
  author: { fid: number; username: string; display_name: string };
  text: string;
  timestamp: string;
  reactions: { likes_count: number; recasts_count: number };
  replies: { count: number };
  channel?: { id: string; name: string };
  embeds?: Array<{ url?: string }>;
}

let config: PluginConfig = { neynarApiKey: "" };

function toolMeta(name: string) {
  const tool = manifest.tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return {
    displayName: tool.displayName,
    description: tool.description,
    parametersSchema: tool.parametersSchema,
  };
}

async function neynarGet(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${NEYNAR_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": config.neynarApiKey,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Neynar API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function neynarPost(
  path: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${NEYNAR_BASE}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": config.neynarApiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Neynar API error ${res.status}: ${text}`);
  }
  return res.json();
}

function formatCast(cast: NeynarCast): string {
  const channel = cast.channel ? ` in /${cast.channel.id}` : "";
  return [
    `**@${cast.author.username}**${channel} — ${cast.timestamp}`,
    cast.text,
    `> likes: ${cast.reactions.likes_count}  recasts: ${cast.reactions.recasts_count}  replies: ${cast.replies.count}  |  \`${cast.hash.slice(0, 10)}\``,
  ].join("\n");
}

const plugin = definePlugin({
  async setup(ctx) {
    const rawConfig = (await ctx.config.get()) as Record<string, unknown>;
    if (typeof rawConfig.neynarApiKey !== "string" || !rawConfig.neynarApiKey) {
      ctx.logger.error("neynarApiKey is required in plugin config");
      return;
    }
    config = {
      neynarApiKey: rawConfig.neynarApiKey,
      signerUuid:
        typeof rawConfig.signerUuid === "string"
          ? rawConfig.signerUuid
          : undefined,
      defaultChannelId:
        typeof rawConfig.defaultChannelId === "string"
          ? rawConfig.defaultChannelId
          : undefined,
    };

    // --- Inbound tools ---

    ctx.tools.register(
      "search-farcaster-casts",
      toolMeta("search-farcaster-casts"),
      async (raw: unknown) => {
        const params = raw as {
          query: string;
          channelId?: string;
          authorFid?: number;
          limit?: number;
        };
        const limit = Math.min(params.limit ?? 10, 25);

        const queryParams: Record<string, string> = {
          q: params.query,
          limit: String(limit),
        };
        if (params.channelId) queryParams.channel_id = params.channelId;
        if (params.authorFid)
          queryParams.author_fid = String(params.authorFid);

        const data = (await neynarGet("/cast/search", queryParams)) as {
          result: { casts: NeynarCast[] };
        };
        const casts = data.result.casts;

        if (casts.length === 0) {
          return { content: `No casts found for "${params.query}".` };
        }

        return {
          content: `Found ${casts.length} cast(s):\n\n${casts.map(formatCast).join("\n\n---\n\n")}`,
          data: {
            count: casts.length,
            casts: casts.map((c) => ({
              hash: c.hash,
              author: c.author.username,
              fid: c.author.fid,
              text: c.text.slice(0, 200),
              timestamp: c.timestamp,
            })),
          },
        };
      },
    );

    ctx.tools.register(
      "get-farcaster-cast",
      toolMeta("get-farcaster-cast"),
      async (raw: unknown) => {
        const params = raw as { hash: string };
        const data = (await neynarGet("/cast", {
          identifier: params.hash,
          type: "hash",
        })) as { cast: NeynarCast };
        const cast = data.cast;

        return {
          content: formatCast(cast),
          data: {
            hash: cast.hash,
            author: cast.author.username,
            fid: cast.author.fid,
            text: cast.text,
            timestamp: cast.timestamp,
            likes: cast.reactions.likes_count,
            recasts: cast.reactions.recasts_count,
            replies: cast.replies.count,
          },
        };
      },
    );

    ctx.tools.register(
      "watch-farcaster-channel",
      toolMeta("watch-farcaster-channel"),
      async (raw: unknown) => {
        const params = raw as { channelId: string; limit?: number };
        const limit = Math.min(params.limit ?? 10, 25);

        const data = (await neynarGet("/feed/channels", {
          channel_ids: params.channelId,
          limit: String(limit),
          with_recasts: "false",
        })) as { casts: NeynarCast[] };
        const casts = data.casts;

        if (!casts || casts.length === 0) {
          return {
            content: `No recent casts in /${params.channelId}.`,
          };
        }

        return {
          content: `Latest ${casts.length} cast(s) in /${params.channelId}:\n\n${casts.map(formatCast).join("\n\n---\n\n")}`,
          data: {
            channelId: params.channelId,
            count: casts.length,
            casts: casts.map((c) => ({
              hash: c.hash,
              author: c.author.username,
              fid: c.author.fid,
              text: c.text.slice(0, 200),
              timestamp: c.timestamp,
            })),
          },
        };
      },
    );

    // --- Outbound tools ---

    ctx.tools.register(
      "post-farcaster-cast",
      toolMeta("post-farcaster-cast"),
      async (raw: unknown) => {
        const params = raw as {
          text: string;
          channelId?: string;
          embeds?: Array<{ url?: string }>;
        };
        if (!config.signerUuid) {
          return {
            content:
              "Cannot post: signerUuid is not configured. Add it to the plugin instance config.",
          };
        }

        if (params.text.length > 320) {
          return {
            content: `Cast text too long (${params.text.length}/320 chars). Shorten the text.`,
          };
        }

        const channelId = params.channelId ?? config.defaultChannelId;

        const body: Record<string, unknown> = {
          signer_uuid: config.signerUuid,
          text: params.text,
        };
        if (channelId) body.channel_id = channelId;
        if (params.embeds?.length) body.embeds = params.embeds;

        const data = (await neynarPost("/cast", body)) as {
          cast: NeynarCast;
        };

        return {
          content: `Cast posted successfully${channelId ? ` in /${channelId}` : ""}.\nHash: \`${data.cast.hash}\``,
          data: { hash: data.cast.hash },
        };
      },
    );

    ctx.tools.register(
      "reply-farcaster-cast",
      toolMeta("reply-farcaster-cast"),
      async (raw: unknown) => {
        const params = raw as {
          parentHash: string;
          text: string;
          embeds?: Array<{ url?: string }>;
        };
        if (!config.signerUuid) {
          return {
            content:
              "Cannot reply: signerUuid is not configured. Add it to the plugin instance config.",
          };
        }

        if (params.text.length > 320) {
          return {
            content: `Reply text too long (${params.text.length}/320 chars). Shorten the text.`,
          };
        }

        const body: Record<string, unknown> = {
          signer_uuid: config.signerUuid,
          text: params.text,
          parent: params.parentHash,
        };
        if (params.embeds?.length) body.embeds = params.embeds;

        const data = (await neynarPost("/cast", body)) as {
          cast: NeynarCast;
        };

        return {
          content: `Reply posted successfully.\nHash: \`${data.cast.hash}\``,
          data: { hash: data.cast.hash, parentHash: params.parentHash },
        };
      },
    );

    ctx.logger.info("ZAO Farcaster Notifications plugin loaded");
  },
});

runWorker(plugin, import.meta.url);
