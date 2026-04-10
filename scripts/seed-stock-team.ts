import { createClient } from '@supabase/supabase-js';
import { scryptSync, randomBytes } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars. Run with: npx tsx scripts/seed-stock-team.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const TEAM = [
  { name: 'Zaal', role: 'Curation / Community / Local Logistics', scope: 'Artist lineup, promo, venue, permits, Heart of Ellsworth relationship', password: 'CHANGE_ME_1' },
  { name: 'FailOften', role: 'Technical Build / Funding Structure', scope: 'Installations, visuals, production tech, grant/sponsor paths via NMC/ENTERACT', password: 'CHANGE_ME_2' },
  { name: 'AttaBotty', role: 'Production / Sponsorships / Event-Day Ops', scope: 'On-site production, staging, sound coordination, sponsor outreach', password: 'CHANGE_ME_3' },
  { name: 'DaNici', role: 'TBD', scope: '', password: 'CHANGE_ME_4' },
  { name: 'Hurric4n3Ike', role: 'Live Entertainment', scope: 'WaveWarZ, live performances, DJ sets', password: 'CHANGE_ME_5' },
  { name: 'DCoop', role: 'ZAOVille (DMV)', scope: 'DMV coordination, separate team/venue/artists', password: 'CHANGE_ME_6' },
];

async function seed() {
  console.log('Seeding stock team members...\n');
  console.log('=== SAVE THESE PASSWORDS - SHARE VIA DM ===\n');

  for (const member of TEAM) {
    const password = member.password.startsWith('CHANGE_ME')
      ? randomBytes(4).toString('hex')
      : member.password;

    const password_hash = hashPassword(password);

    const { error } = await supabase
      .from('stock_team_members')
      .upsert({ name: member.name, password_hash, role: member.role, scope: member.scope }, { onConflict: 'name' });

    if (error) {
      console.error(`Failed to seed ${member.name}:`, error.message);
    } else {
      console.log(`${member.name}: ${password}`);
    }
  }

  console.log('\n=== DONE ===');
}

seed();
