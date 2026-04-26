import { config } from 'dotenv';

// Load .env.local (Next.js convention)
config({ path: '.env.local' });

type MinimaxMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const apiKey = requireEnv('MINIMAX_API_KEY');
  const endpoint = process.env.MINIMAX_API_URL || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.7';

  const promptFromFlag = getArgValue('--prompt') || getArgValue('-p');
  const system = getArgValue('--system');
  const temperatureRaw = getArgValue('--temperature');
  const maxTokensRaw = getArgValue('--max-tokens');

  const prompt = (promptFromFlag ?? (await readStdin())).trim();
  if (!prompt) {
    throw new Error('No prompt provided. Pass --prompt "..." or pipe stdin.');
  }

  const messages: MinimaxMessage[] = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const temperature = temperatureRaw ? Number(temperatureRaw) : undefined;
  const maxTokens = maxTokensRaw ? Number(maxTokensRaw) : undefined;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      ...(typeof temperature === 'number' && Number.isFinite(temperature) ? { temperature } : {}),
      ...(typeof maxTokens === 'number' && Number.isFinite(maxTokens) ? { max_tokens: maxTokens } : {}),
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Minimax request failed: ${res.status} ${text}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  process.stdout.write(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  process.stdout.write('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
