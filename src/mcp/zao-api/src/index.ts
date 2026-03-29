import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { tools, toolHandlers } from "./tools/index.js";
import { handleError } from "./lib/errors.js";

const server = new Server(
  { name: "zao-api", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = toolHandlers[name];

  if (!handler) {
    return { content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${name}` }) }] };
  }

  try {
    const result = await handler(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (err: unknown) {
    const { error, code } = handleError(err);
    return { content: [{ type: "text", text: JSON.stringify({ error, code }) }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
