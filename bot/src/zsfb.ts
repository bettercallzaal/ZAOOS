// /zsfb <comment> - low-friction ZAOstock /test feedback intake
//
// Open to all team members (not admin-gated like /fix). Saves to
// suggestions with a [zsfb:<section>] prefix so the dashboard + Hermes
// can filter for /test feedback specifically.
//
// Section auto-detected from keywords. If none match, tagged 'general'. The
// section keyword is a hint for downstream triage, not a hard label - Hermes
// always reads the full text.
//
// Why prefix vs new column: suggestions schema is shared with /idea +
// public submissions. Adding a column would require a migration and would
// fragment the suggestion pool. Prefix is reversible, dashboard-friendly, and
// keeps everything in one bucket.

import { db } from './supabase';
import { logBotActivity } from './activity';
import type { TeamMember } from './auth';

const SECTION_KEYWORDS: Array<{ section: string; pattern: RegExp }> = [
  { section: 'hero', pattern: /\b(hero|top|first|opening|tagline)\b/i },
  { section: 'lineup', pattern: /\b(lineup|artists?|band|dj|performer|set list)\b/i },
  { section: 'sponsors', pattern: /\b(sponsor|sponsorship|partner with us|main stage sponsor|broadcast|year.round)\b/i },
  { section: 'partners', pattern: /\b(partners?|fractured atlas|enteract|heart of ellsworth|town of ellsworth|poc)\b/i },
  { section: 'vibes', pattern: /\b(vibe|photo|gallery|image|visual)\b/i },
  { section: 'about', pattern: /\b(about|story|why|maine|acadia)\b/i },
  { section: 'where', pattern: /\b(where|location|map|parklet|franklin street|ellsworth)\b/i },
  { section: 'team', pattern: /\b(team|mosaic|members?|roster)\b/i },
  { section: 'rsvp', pattern: /\b(rsvp|join|get on the list|volunteer|sign up)\b/i },
  { section: 'lineage', pattern: /\b(lineage|past events?|paloo?za|chella|zaoville|history)\b/i },
  { section: 'donate', pattern: /\b(donate|donation|paypal|giveth|crypto|fiat)\b/i },
  { section: 'sticky', pattern: /\b(sticky|dock|floating|bottom bar)\b/i },
];

export function detectSection(text: string): string {
  for (const { section, pattern } of SECTION_KEYWORDS) {
    if (pattern.test(text)) return section;
  }
  return 'general';
}

export async function addZsFb(member: TeamMember, text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    return [
      'Say something after /zsfb - what should we change on /test?',
      '',
      'Examples:',
      '  /zsfb hero copy too long, drop the second sentence',
      '  /zsfb sponsors section feels short, add a one-liner about why we do tiers',
      '  /zsfb lineage cards need more breathing room on mobile',
    ].join('\n');
  }

  const section = detectSection(trimmed);
  const tagged = `[zsfb:${section}] ${trimmed}`;

  const { data, error } = await db()
    .from('suggestions')
    .insert({
      name: member.name,
      contact: `tg:${member.id}`,
      suggestion: tagged,
    })
    .select('id')
    .single();

  if (error) return `Could not save: ${error.message}`;

  await logBotActivity({
    actorId: member.id,
    entityType: 'member',
    entityId: member.id,
    action: 'zsfb_add',
    newValue: `[${section}] ${trimmed.slice(0, 180)}`,
  });

  return [
    `Got it - logged under ${section}. id ${data.id.slice(0, 8)}.`,
    `I'll surface it in the daily digest. Want it shipped now? Run /zsedit with the same text.`,
  ].join('\n');
}
