/**
 * CSV Importer for Webflow CRM migration.
 *
 * Reads a CSV export from Webflow (or any CSV with common contact fields),
 * maps columns flexibly (case-insensitive), and upserts contacts into the
 * crm_contacts table. Dedupes by email; ignores rows with no name/email.
 *
 * Usage:
 *   npx tsx scripts/import-webflow-crm.ts <path-to-csv> [--dry-run]
 *
 * Example:
 *   npx tsx scripts/import-webflow-crm.ts ~/Downloads/webflow-contacts.csv --dry-run
 *   npx tsx scripts/import-webflow-crm.ts ~/Downloads/webflow-contacts.csv
 *
 * The script:
 * 1. Reads the CSV file
 * 2. Maps common Webflow headers to our CRM schema (flexible matching)
 * 3. Validates each row (name required, email optional)
 * 4. In dry-run mode: prints what would be imported
 * 5. Otherwise: upserts each row into crm_contacts by email (or inserts if no email)
 * 6. Prints a summary (imported, updated, skipped, errors)
 *
 * Environment:
 * - SUPABASE_SERVICE_ROLE_KEY: required for DB access
 * - NEXT_PUBLIC_SUPABASE_URL: required for DB access
 *
 * Safety guardrails:
 * - Dry-run by default (add the actual file arg to import)
 * - Never wipes existing data (upsert/insert only)
 * - Logs each row as it processes
 * - Prints summary at the end
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

interface CrmContact {
  name: string;
  email?: string;
  org?: string;
  role?: string;
  private_notes?: string;
  location?: string;
  category?: string;
  tags?: string[];
}

interface ImportRow extends CrmContact {
  slug: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

// Column name mapping: match various Webflow/common CSV headers to our schema
const COLUMN_MAPPING: Record<string, string[]> = {
  name: ['name', 'full name', 'fullname', 'contact name', 'first name'],
  email: ['email', 'email address', 'e-mail'],
  org: ['org', 'organization', 'company', 'company name'],
  role: ['role', 'title', 'job title', 'position'],
  private_notes: ['notes', 'message', 'comments', 'description', 'bio'],
  location: ['location', 'city', 'address', 'region'],
  category: ['category', 'type', 'segment', 'industry'],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findColumnIndex(headers: string[], targets: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const target of targets) {
    const idx = normalized.indexOf(normalizeHeader(target));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length < 1) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parse (handles quoted fields loosely)
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length && j < cells.length; j++) {
      if (cells[j]) {
        row[headers[j]] = cells[j];
      }
    }
    if (Object.keys(row).length > 0) {
      rows.push(row);
    }
  }
  return rows;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function mapRow(
  rawRow: Record<string, string>,
  headers: string[],
): CrmContact | null {
  // Find column indices using flexible mapping
  const nameIdx = findColumnIndex(headers, COLUMN_MAPPING.name);
  if (nameIdx < 0) return null; // name is required

  const cells = Object.values(rawRow);
  const name = cells[nameIdx]?.trim();
  if (!name) return null;

  const contact: CrmContact = { name };

  const emailIdx = findColumnIndex(headers, COLUMN_MAPPING.email);
  if (emailIdx >= 0 && cells[emailIdx]) {
    contact.email = cells[emailIdx].trim().toLowerCase();
  }

  const orgIdx = findColumnIndex(headers, COLUMN_MAPPING.org);
  if (orgIdx >= 0 && cells[orgIdx]) {
    contact.org = cells[orgIdx].trim();
  }

  const roleIdx = findColumnIndex(headers, COLUMN_MAPPING.role);
  if (roleIdx >= 0 && cells[roleIdx]) {
    contact.role = cells[roleIdx].trim();
  }

  const notesIdx = findColumnIndex(headers, COLUMN_MAPPING.private_notes);
  if (notesIdx >= 0 && cells[notesIdx]) {
    contact.private_notes = cells[notesIdx].trim();
  }

  const locationIdx = findColumnIndex(headers, COLUMN_MAPPING.location);
  if (locationIdx >= 0 && cells[locationIdx]) {
    contact.location = cells[locationIdx].trim();
  }

  const categoryIdx = findColumnIndex(headers, COLUMN_MAPPING.category);
  if (categoryIdx >= 0 && cells[categoryIdx]) {
    contact.category = cells[categoryIdx].trim();
  }

  return contact;
}

async function importCSV(filePath: string, dryRun: boolean): Promise<ImportSummary> {
  const summary: ImportSummary = {
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  // Read file
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return summary;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const rawRows = parseCSV(content);

  if (rawRows.length === 0) {
    console.error('No rows found in CSV');
    return summary;
  }

  console.log(`Parsed ${rawRows.length} rows from ${path.basename(filePath)}`);
  console.log('');

  // Map rows to contacts
  const headerLine = content.split('\n')[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const contacts: ImportRow[] = [];
  const seenEmails = new Set<string>();

  for (const rawRow of rawRows) {
    summary.total++;
    const contact = mapRow(rawRow, headers);

    if (!contact) {
      summary.skipped++;
      console.log(`[SKIP] Row ${summary.total}: missing name`);
      continue;
    }

    // Dedupe by email within this batch
    if (contact.email && seenEmails.has(contact.email)) {
      summary.skipped++;
      console.log(`[SKIP] Row ${summary.total}: duplicate email in batch (${contact.email})`);
      continue;
    }
    if (contact.email) {
      seenEmails.add(contact.email);
    }

    const slug = contact.email
      ? `${contact.email.split('@')[0]}-${contact.email.split('@')[1]?.replace(/\./g, '-')}`.slice(0, 64)
      : slugify(contact.name);

    contacts.push({ ...contact, slug });
  }

  console.log(`Mapped ${contacts.length} valid contacts`);
  console.log('');

  if (dryRun) {
    console.log('DRY RUN - would import:');
    for (const contact of contacts) {
      console.log(`  - ${contact.name} (${contact.email || 'no email'})`);
    }
    console.log('');
    summary.imported = contacts.length;
    return summary;
  }

  // Connect to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars',
    );
    return summary;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Upsert each contact
  for (const contact of contacts) {
    try {
      const row = {
        name: contact.name,
        slug: contact.slug,
        email: contact.email,
        org: contact.org,
        role: contact.role,
        private_notes: contact.private_notes,
        location: contact.location,
        category: contact.category,
      };

      if (contact.email) {
        // Check if exists by email
        const { data: existing } = await supabase
          .from('crm_contacts')
          .select('id')
          .eq('email', contact.email)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('crm_contacts')
            .update({ ...row, updated_at: new Date().toISOString() })
            .eq('email', contact.email);

          if (error) {
            summary.errors++;
            summary.errorDetails.push(`${contact.name}: update failed - ${error.message}`);
            console.log(
              `[ERROR] ${contact.name} (${contact.email}): update failed - ${error.message}`,
            );
          } else {
            summary.updated++;
            console.log(`[UPDATE] ${contact.name} (${contact.email})`);
          }
        } else {
          // Insert new
          const { error } = await supabase.from('crm_contacts').insert([row]);

          if (error) {
            summary.errors++;
            summary.errorDetails.push(`${contact.name}: insert failed - ${error.message}`);
            console.log(
              `[ERROR] ${contact.name} (${contact.email}): insert failed - ${error.message}`,
            );
          } else {
            summary.imported++;
            console.log(`[IMPORT] ${contact.name} (${contact.email})`);
          }
        }
      } else {
        // No email: just insert with name-based slug
        const { error } = await supabase.from('crm_contacts').insert([row]);

        if (error) {
          summary.errors++;
          summary.errorDetails.push(`${contact.name}: insert failed - ${error.message}`);
          console.log(`[ERROR] ${contact.name}: insert failed - ${error.message}`);
        } else {
          summary.imported++;
          console.log(`[IMPORT] ${contact.name} (no email)`);
        }
      }
    } catch (err: unknown) {
      summary.errors++;
      const msg = err instanceof Error ? err.message : String(err);
      summary.errorDetails.push(`${contact.name}: ${msg}`);
      console.log(`[ERROR] ${contact.name}: ${msg}`);
    }
  }

  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  let csvPath = '';
  let dryRun = true;

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--')) {
      // ignore other flags
    } else if (!csvPath) {
      csvPath = arg;
      dryRun = false; // if a file is provided, default to actual import (unless --dry-run)
    }
  }

  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import-webflow-crm.ts <csv-file> [--dry-run]');
    console.error('');
    console.error('Examples:');
    console.error(
      '  npx tsx scripts/import-webflow-crm.ts ~/Downloads/webflow-contacts.csv --dry-run',
    );
    console.error('  npx tsx scripts/import-webflow-crm.ts ~/Downloads/webflow-contacts.csv');
    process.exit(1);
  }

  console.log(`Importing from: ${csvPath}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
  console.log('');

  const summary = await importCSV(csvPath, dryRun);

  console.log('');
  console.log('=== SUMMARY ===');
  console.log(`Total rows:    ${summary.total}`);
  console.log(`Imported:      ${summary.imported}`);
  console.log(`Updated:       ${summary.updated}`);
  console.log(`Skipped:       ${summary.skipped}`);
  console.log(`Errors:        ${summary.errors}`);

  if (summary.errorDetails.length > 0) {
    console.log('');
    console.log('Error details:');
    for (const detail of summary.errorDetails) {
      console.log(`  - ${detail}`);
    }
  }

  if (!dryRun) {
    console.log('');
    console.log('Import complete. To revert, run:');
    console.log('  DELETE FROM crm_contacts WHERE email IN (<list of imported emails>)');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
