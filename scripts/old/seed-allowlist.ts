import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const CSV_PATH = '/Users/zaalpanthaki/Downloads/ZAOOS.csv';

// Load env
const dotenv = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
for (const line of dotenv.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Reading CSV from:', CSV_PATH);
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csv.split('\n').filter((l) => l.trim());

  const entries = lines.map((line) => {
    const parts = line.split(',');
    const ign = parts[0]?.trim();
    const wallet = parts[1]?.trim().replace(/,+$/, '');
    return { ign, wallet_address: wallet };
  }).filter((e) => e.ign && e.wallet_address);

  console.log(`Found ${entries.length} entries`);

  const { data, error } = await supabase
    .from('allowlist')
    .upsert(entries, { onConflict: 'wallet_address', ignoreDuplicates: true })
    .select();

  if (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data?.length || 0} entries`);
}

seed().catch(console.error);
