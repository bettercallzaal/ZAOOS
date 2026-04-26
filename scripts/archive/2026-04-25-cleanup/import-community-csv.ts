import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CSV_PATH = '/Users/zaalpanthaki/Downloads/The ZAO - Community Members - 649692e084fd981c08d16c42.csv';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());

  // Skip header
  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const name = fields[0]?.trim();

    // Skip empty names, HTML fragments, draft rows
    if (!name || name.startsWith('<') || name.startsWith('src=') || name.startsWith('>') || name.includes('iframe')) {
      skipped++;
      continue;
    }
    if (fields[5]?.trim().toLowerCase() === 'true') {
      // Draft = true, skip
      skipped++;
      continue;
    }

    const slug = (fields[1]?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const biography = fields[11] ? stripHtml(fields[11]) : null;
    const category = (fields[12]?.trim() || 'musician').toLowerCase();
    const isNotable = fields[13]?.trim().toLowerCase() === 'true';

    const profile = {
      name,
      slug,
      cover_image_url: fields[9]?.trim() || null,
      thumbnail_url: fields[10]?.trim() || null,
      biography: biography && biography.length > 0 ? biography : null,
      category,
      is_notable: isNotable,
      website: fields[14]?.trim() || null,
      instagram: fields[15]?.trim() || null,
      twitter: fields[16]?.trim() || null,
      tiktok: fields[17]?.trim() || null,
      spotify: fields[18]?.trim() || null,
      youtube: fields[19]?.trim() || null,
      apple_music: fields[20]?.trim() || null,
      amazon_music: fields[21]?.trim() || null,
      youtube_music: fields[22]?.trim() || null,
      twitch: fields[23]?.trim() || null,
    };

    const { error } = await supabase
      .from('community_profiles')
      .upsert(profile, { onConflict: 'slug' });

    if (error) {
      console.error(`  Failed: ${name} — ${error.message}`);
    } else {
      imported++;
      const socials = [profile.twitter && 'X', profile.instagram && 'IG', profile.spotify && 'SP', profile.soundcloud && 'SC'].filter(Boolean);
      console.log(`  Imported: ${name} (${category})${socials.length ? ' [' + socials.join(', ') + ']' : ''}`);
    }
  }

  console.log(`\nDone: ${imported} imported, ${skipped} skipped`);
}

main().catch(console.error);
