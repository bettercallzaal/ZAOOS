/**
 * farcaster-server.ts - ZOE's first MCP TOOL-AGENT (a "harness just for one tool").
 *
 * Instead of ZOE calling the Farcaster read client inline, this wraps
 * `farcaster/read-node.ts` as a standalone MCP server. ZOE (the orchestrator)
 * reaches out to it as an MCP client (`farcaster-client.ts`) and calls its
 * tools over stdio. This is Part A of the agent-spawning checklist: the
 * tool-agent pattern, proven end-to-end with one real tool.
 *
 * Read-only by construction - read-node.ts is a read client that cannot post.
 * Runnable standalone (the client spawns it):
 *   tsx bot/src/zoe/mcp/farcaster-server.ts
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { castsByFid, nodeInfo } from '../farcaster/read-node';

/**
 * MCP tool result shape (subset used here). The index signature matches the
 * SDK's CallToolResult (which allows extra fields), so these handlers are
 * assignable to registerTool. Exported so tests can assert content directly.
 */
export interface ToolTextResult {
  content: Array<{ type: 'text'; text: string }>;
  [key: string]: unknown;
}

/** Handler for `casts_by_fid` - wraps read-node so it's unit-testable off the network. */
export async function castsByFidHandler(args: { fid: number; pageSize: number }): Promise<ToolTextResult> {
  const data = await castsByFid(args.fid, args.pageSize);
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

/** Handler for `node_info`. */
export async function nodeInfoHandler(): Promise<ToolTextResult> {
  const info = await nodeInfo();
  return { content: [{ type: 'text', text: JSON.stringify(info) }] };
}

export function buildServer(): McpServer {
  const server = new McpServer({ name: 'zao-farcaster-read', version: '0.1.0' });
  server.registerTool(
    'casts_by_fid',
    {
      title: 'Recent casts by FID',
      description: 'Fetch the most recent casts for a Farcaster user by their FID (read-only).',
      inputSchema: {
        fid: z.number().int().positive(),
        pageSize: z.number().int().min(1).max(100).default(10),
      },
    },
    ({ fid, pageSize }) => castsByFidHandler({ fid, pageSize }),
  );
  server.registerTool(
    'node_info',
    {
      title: 'Farcaster read-node info',
      description: 'Return the Farcaster read node sync info (maxHeight, blockDelay).',
      inputSchema: {},
    },
    () => nodeInfoHandler(),
  );
  return server;
}

async function main(): Promise<void> {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only start the stdio server when this file is the entry point - importing it
// (e.g. from a test) must NOT open a stdio connection.
const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (invokedPath === import.meta.url) {
  main().catch((err) => {
    console.error('[farcaster-mcp] fatal:', err);
    process.exit(1);
  });
}
