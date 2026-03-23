#!/usr/bin/env -S npx tsx

import { ENV } from '../../src/lib/env.js';

const args = process.argv.slice(2);
const promptArg = args.find((arg, i) => (arg === '--prompt' || arg === '-p') && args[i + 1]) || args[0];
const systemArg = args.find((arg, i) => arg === '--system' && args[i + 1]);
const tempArg = args.find((arg, i) => arg === '--temperature' && args[i + 1]);
const maxTokensArg = args.find((arg, i) => arg === '--max_tokens' && args[i + 1]);

if (!promptArg) {
  console.error('Usage: /minimax "<prompt>" [--system "system message"] [--temperature 0.7] [--max_tokens 500]');
  process.exit(1);
}

const prompt = promptArg.startsWith('"') ? promptArg.slice(1, -1) : promptArg;
const system = systemArg ? args[args.indexOf(systemArg) + 1] : undefined;
const temperature = tempArg ? Number(args[args.indexOf(tempArg) + 1]) : undefined;
const max_tokens = maxTokensArg ? Number(args[args.indexOf(maxTokensArg) + 1]) : undefined;

const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
if (system) messages.push({ role: 'system', content: system });
messages.push({ role: 'user', content: prompt });

async function callMinimax() {
  if (!ENV.MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  const endpoint = 'http://localhost:3000/api/chat/minimax';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: ENV.MINIMAX_MODEL,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(max_tokens !== undefined ? { max_tokens } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Minimax API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data;
}

callMinimax()
  .then((data) => {
    if (data?.choices?.[0]?.message?.content) {
      console.log(data.choices[0].message.content);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
