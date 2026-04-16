import { serve } from '@hono/node-server';
import app from './app.js';

const port = 3003;
console.log(`ZABAL Snap running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
