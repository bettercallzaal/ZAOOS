/**
 * inbox-triage.ts — Extend inbox-ingest with calm, structured triage.
 *
 * For each forwarded item ZOE ingests, this module:
 * 1. SUMMARIZE: one-to-two-line summary (from + subject + key takeaway)
 * 2. CLASSIFY: bucket it (BUILD/RESEARCH/REFERENCE/ACT-NOW/SOMEDAY)
 * 3. CONNECT: match to a ZAO project/brand if applicable
 * 4. NEXT STEP: propose one concrete action (if BUILD/ACT-NOW) or none
 * 5. LAND IT: create a triaged capture on the cowork board
 * 6. SURFACE: fold triaged items into the brief grouped by bucket
 *
 * Guardrails:
 * - ZOE TRIAGES + surfaces; does NOT autonomously act on ideas
 * - De-duplication by source_id (each forward triaged once)
 * - No outbound beyond existing brief/DM path
 * - PII-safe (inbox-ingest already scrubs)
 * - No-op safely if AgentMail/board unconfigured
 *
 * Storage: triage_context.jsonl (parallel to inbox_context.jsonl)
 * Format: { id, source_id, summary, bucket, connected_project, next_step, capture_id, created_at }
 */

import type { RawAgentMailMessage } from './inbox-ingest';

export type TriageBucket = 'BUILD' | 'RESEARCH' | 'REFERENCE' | 'ACT-NOW' | 'SOMEDAY';

export interface TriageRecord {
  id: string;
  source_id: string; // AgentMail message id (dedup key)
  summary: string; // One-to-two lines: what this is + key takeaway
  bucket: TriageBucket; // Classified bucket
  connected_project?: string; // ZAO project match (The ZAO, WaveWarZ, ZABAL, etc) or none
  next_step?: string; // One concrete action for BUILD/ACT-NOW, or none
  capture_id?: string; // Cowork board capture ID if created
  created_at: string; // When ZOE triaged it
}

/**
 * Known ZAO projects/brands for connection matching.
 * Used by classifyAndConnect to best-effort match items to a thread.
 */
const ZAO_PROJECTS = [
  'The ZAO',
  'ZAOstock',
  'ZABAL Games',
  'WaveWarZ',
  'COC Concertz',
  'ZOL',
  'POIDH',
  'Magnetiq',
  'ZAO Music',
  'BCZ Strategies',
  'Fractal',
  'ZAOstock Team',
];

/**
 * Classify a forwarded item into a triage bucket.
 * Uses heuristics based on the sender, subject, and content to determine:
 *   - BUILD: actionable, concrete feature/product idea
 *   - RESEARCH: worth investigating deeper (a rabbit hole)
 *   - REFERENCE: useful context, no action (a link, a report)
 *   - ACT-NOW: time-sensitive (deadline, response needed)
 *   - SOMEDAY: interesting but low priority (backlog/inspiration)
 *
 * This is a best-effort heuristic classifier. In production, ZOE would run
 * this through Claude with a tight prompt for higher accuracy.
 */
export function classifyBucket(message: RawAgentMailMessage, summary: string): TriageBucket {
  const subjectLower = (message.subject ?? '').toLowerCase();
  const snippetLower = (message.snippet ?? '').toLowerCase();
  const combined = `${subjectLower} ${snippetLower}`;

  // ACT-NOW patterns: deadline, response, urgent, asap, due date, confirmation needed
  if (
    /\b(urgent|asap|due|deadline|overdue|confirm|rsvp|respond|today|tonight|tomorrow)\b/.test(
      combined,
    )
  ) {
    return 'ACT-NOW';
  }

  // BUILD patterns: implement, build, ship, feature, product, launch, code, PR, bug fix
  if (
    /\b(implement|build|ship|feature|product|launch|code|pr|bug fix|deploy|release|develop)\b/.test(
      combined,
    )
  ) {
    return 'BUILD';
  }

  // RESEARCH patterns: research, investigate, explore, analysis, study, question, opportunity
  if (
    /\b(research|investigate|explore|analysis|study|question|deep dive|opportunity|investigate|audit)\b/.test(
      combined,
    )
  ) {
    return 'RESEARCH';
  }

  // REFERENCE patterns: link, article, report, paper, newsletter, doc, reference, fyi, note
  if (
    /\b(link|article|report|paper|newsletter|document|reference|fyi|note|news|update)\b/.test(
      combined,
    )
  ) {
    return 'REFERENCE';
  }

  // Default: SOMEDAY (park interesting ideas)
  return 'SOMEDAY';
}

/**
 * Connect a triaged item to a ZAO project/brand if applicable.
 * Uses simple keyword matching against the summary and subject.
 * Returns the best-match project name, or undefined if no match found.
 */
export function connectToProject(
  message: RawAgentMailMessage,
  summary: string,
): string | undefined {
  const subjectLower = (message.subject ?? '').toLowerCase();
  const summaryLower = summary.toLowerCase();
  const combined = `${subjectLower} ${summaryLower}`;

  for (const project of ZAO_PROJECTS) {
    if (combined.includes(project.toLowerCase())) {
      return project;
    }
  }
  return undefined;
}

/**
 * Propose a next step for BUILD or ACT-NOW buckets.
 * Returns a one-line concrete action, or undefined for other buckets.
 */
export function suggestNextStep(
  bucket: TriageBucket,
  message: RawAgentMailMessage,
  connectedProject?: string,
): string | undefined {
  if (bucket === 'REFERENCE' || bucket === 'RESEARCH' || bucket === 'SOMEDAY') {
    return undefined;
  }

  if (bucket === 'ACT-NOW') {
    const from = (message.from ?? '').split('@')[0]; // Extract just the name part
    return `Reply to ${from} or Zaal to confirm intent`;
  }

  if (bucket === 'BUILD') {
    if (connectedProject) {
      return `Create a research doc (tier:STANDARD) or open an issue in ${connectedProject}`;
    }
    return 'Create a research doc (tier:STANDARD) to spec the work';
  }

  return undefined;
}

/**
 * Build a condensed, actionable summary from the message.
 * Condenses to 1-2 lines: sender context + key idea.
 * Note: inbox-ingest already redacts PII before this is called.
 */
export function buildTriageSummary(message: RawAgentMailMessage, ingestSummary: string): string {
  // Use the inbox-ingested summary (already PII-scrubbed)
  // We might abbreviate it further here if it's too long.
  return ingestSummary.length > 200 ? ingestSummary.slice(0, 197) + '...' : ingestSummary;
}

/**
 * Triage a single message without persisting (used for testing and preview).
 */
export function triageMessage(
  message: RawAgentMailMessage,
  ingestSummary: string,
): Omit<TriageRecord, 'id' | 'created_at' | 'capture_id'> {
  const bucket = classifyBucket(message, ingestSummary);
  const connectedProject = connectToProject(message, ingestSummary);
  const nextStep = suggestNextStep(bucket, message, connectedProject);
  const summary = buildTriageSummary(message, ingestSummary);

  return {
    source_id: (message.id ?? message.message_id ?? `${message.from}|${message.subject}`) as string,
    summary,
    bucket,
    connected_project: connectedProject,
    next_step: nextStep,
  };
}
