import { MCPServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HindsightClient } from '@vectorize-io/hindsight-client';

const HINDSIGHT_API_URL = process.env.HINDSIGHT_API_URL || 'http://localhost:8888';

const hindsight = new HindsightClient({
  baseUrl: HINDSIGHT_API_URL,
});

const server = new MCPServer({
  name: 'ZAO OS Hindsight Memory',
  version: '1.0.0',
  tools: [
    {
      name: 'memory_retain',
      description: 'Store a memory event for a user',
      inputSchema: {
        type: 'object',
        properties: {
          bank_id: { type: 'string', description: 'User FID or wallet address' },
          content: { type: 'string', description: 'Memory content to store' },
          event_type: { type: 'string', description: 'Type: cast | track_share | respect | room_participation | profile_update' },
          metadata: { type: 'object', description: 'Additional structured data' },
        },
        required: ['bank_id', 'content', 'event_type'],
      },
      handler: async ({ bank_id, content, event_type, metadata }) => {
        await hindsight.retain(bank_id, content, {
          metadata: { eventType: event_type, ...metadata },
        });
        return { success: true };
      },
    },
    {
      name: 'memory_recall',
      description: 'Search for relevant memories for a user',
      inputSchema: {
        type: 'object',
        properties: {
          bank_id: { type: 'string', description: 'User FID or wallet address' },
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results', default: 10 },
        },
        required: ['bank_id', 'query'],
      },
      handler: async ({ bank_id, query, limit = 10 }) => {
        const results = await hindsight.recall(bank_id, query, { limit });
        return { memories: results };
      },
    },
    {
      name: 'memory_reflect',
      description: 'Synthesize insights from a user\'s memories',
      inputSchema: {
        type: 'object',
        properties: {
          bank_id: { type: 'string', description: 'User FID or wallet address' },
          prompt: { type: 'string', description: 'Reflection prompt' },
        },
        required: ['bank_id', 'prompt'],
      },
      handler: async ({ bank_id, prompt }) => {
        const result = await hindsight.reflect(bank_id, prompt);
        return { reflection: result };
      },
    },
  ],
});

const transport = new StdioServerTransport();
server.connect(transport);
