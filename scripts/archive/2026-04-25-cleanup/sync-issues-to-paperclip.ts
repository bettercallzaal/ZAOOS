/**
 * Sync community issues from Supabase → Paperclip
 *
 * Run: npx tsx scripts/sync-issues-to-paperclip.ts
 *
 * Checks Supabase for new community_issues (status = 'submitted', no paperclip_issue_id)
 * and creates them in Paperclip assigned to CEO Main.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Next.js convention)
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PAPERCLIP_API = process.env.PAPERCLIP_API_URL || 'http://localhost:3100';
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || '87907405-fd72-4875-9fa0-f61a9e3f1448';
const CEO_AGENT_ID = process.env.PAPERCLIP_CEO_AGENT_ID || '0a7e214f-d849-40de-b4e9-98de0933008f';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sync() {
  // Fetch unsynced issues
  const { data: issues, error } = await supabase
    .from('community_issues')
    .select('*')
    .eq('status', 'submitted')
    .is('paperclip_issue_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase fetch error:', error.message);
    return;
  }

  if (!issues || issues.length === 0) {
    console.log('No new issues to sync.');
    return;
  }

  console.log(`Found ${issues.length} new issue(s) to sync.\n`);

  for (const issue of issues) {
    const description = [
      `## Community Issue from @${issue.submitted_by_username || `FID:${issue.submitted_by_fid}`}`,
      `**Type:** ${issue.type} | **Priority:** ${issue.priority}`,
      '',
      issue.description,
      '',
      `---`,
      `Submitted via ZAO OS community issue form.`,
      `Supabase ID: ${issue.id}`,
      `Submitter FID: ${issue.submitted_by_fid}`,
    ].join('\n');

    try {
      const res = await fetch(`${PAPERCLIP_API}/api/companies/${COMPANY_ID}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Community] ${issue.title}`,
          description,
          status: 'todo',
          priority: issue.priority === 'high' ? 'high' : issue.priority === 'low' ? 'low' : 'medium',
          assigneeAgentId: CEO_AGENT_ID,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`  Failed to create Paperclip issue for "${issue.title}": ${res.status} ${text}`);
        continue;
      }

      const paperclipIssue = await res.json();
      const identifier = paperclipIssue.identifier || paperclipIssue.id;

      // Update Supabase with Paperclip ID
      await supabase
        .from('community_issues')
        .update({
          paperclip_issue_id: identifier,
          status: 'triaged',
        })
        .eq('id', issue.id);

      console.log(`  ✓ "${issue.title}" → Paperclip ${identifier} (assigned to CEO)`);
    } catch (err) {
      console.error(`  ✗ "${issue.title}" — Paperclip unreachable:`, (err as Error).message);
    }
  }

  console.log('\nSync complete.');
}

sync();
