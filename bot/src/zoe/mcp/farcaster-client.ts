/**
 * farcaster-client.ts - ZOE reaches the Farcaster read TOOL-AGENT via MCP.
 *
 * Instead of importing read-node directly, ZOE spawns the farcaster-read MCP
 * server (a tool-agent) and calls its tools over stdio. First ZOE <-> tool-agent
 * link (agent-spawning checklist, Part A). The agent is TEMPORARY here: spawned
 * per call session and torn down on close (the "temp agent" lifecycle).
 *
 * A permanent variant would keep one client connection warm across many calls;
 * this proves the pattern with the simplest (per-call) lifecycle first.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SERVER_PATH = join(dirname(fileURLToPath(import.meta.url)), 'farcaster-server.ts');

/**
 * Open a client connected to the Farcaster read tool-agent (spawns it via tsx),
 * run `fn`, then tear the agent down. Errors from the tool surface to the caller.
 */
export async function withFarcasterAgent<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const transport = new StdioClientTransport({
    command: process.env.ZOE_TSX_BIN ?? 'tsx',
    args: [SERVER_PATH],
    env: process.env as Record<string, string>,
  });
  const client = new Client({ name: 'zoe', version: '0.1.0' });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

/** Fetch recent casts by FID THROUGH the tool-agent (not inline). */
export async function castsByFidViaAgent(fid: number, pageSize = 10): Promise<unknown> {
  return withFarcasterAgent((client) =>
    client.callTool({ name: 'casts_by_fid', arguments: { fid, pageSize } }),
  );
}

/** List the tools the Farcaster tool-agent exposes (proves discovery works). */
export async function listFarcasterAgentTools(): Promise<string[]> {
  return withFarcasterAgent(async (client) => {
    const res = await client.listTools();
    return res.tools.map((t) => t.name);
  });
}
