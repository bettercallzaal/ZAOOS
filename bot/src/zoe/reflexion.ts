/**
 * reflexion.ts - Letta-style self-improving memory layer (doc 759 Gap 4 +
 * project_zoe_orchestrator_locked Q4 = B+ hybrid).
 *
 * Flow per locked Q4:
 *   1. After evening reflection (9pm EST), Zaal's answers land in working memory.
 *   2. reflexion runs - diffs today's answers against human.md + persona.md.
 *   3. For each candidate memory update, score CONFIDENCE 0-100.
 *   4. HIGH-CONFIDENCE (>= 80) patches: emit y/n prompt to Zaal via Telegram.
 *      On y, ZOE writes the patch herself (B half of hybrid).
 *   5. LOW-CONFIDENCE patches: emit voice-note REQUEST to Zaal FIRST.
 *      Zaal sends voice note explaining intent. Next reflexion turn drafts
 *      patch from voice note transcript, then y/n.
 *
 * Voice-note-as-clarification is a NEW ZOE design rule from Q4 - apply
 * anywhere ZOE is unsure of intent on a load-bearing edit, not just human.md.
 *
 * Sibling of:
 *   - bot/src/zoe/reflect.ts (the ask-3-questions side; this is the
 *     learn-from-answers side)
 *   - bot/src/zoe/critics/* (critics score outputs; reflexion drafts edits)
 *   - bot/src/hermes/runner.ts (the patch-from-learning analog on the
 *     code-fix side, eventually fed by Gap 5 learn.ts)
 */

import { callClaudeCli } from '../hermes/claude-cli';
import { ZOE_DEFAULT_MODEL, ZOE_HARD_MODEL } from './types';
import type { ZoeContext } from './types';

export type MemoryFile = 'human.md' | 'persona.md';
export type Confidence = 'high' | 'medium' | 'low';

/** A single proposed change to a memory file. */
export interface ProposedPatch {
  /** Stable id used in Telegram approval flow ("approve patch-1" / "no patch-2"). */
  id: string;
  /** Which memory file this patches. */
  target: MemoryFile;
  /** Section heading or anchor in the file (e.g. "## Schedule", "## Projects"). */
  section: string;
  /** Confidence ZOE has in the patch being correct. */
  confidence: Confidence;
  /** Numeric confidence 0-100 (used for sorting + threshold checks). */
  confidence_score: number;
  /** One-line description of what changes. */
  summary: string;
  /** Suggested diff. Replace style: { before, after }. Append style: { after } only. */
  before?: string;
  after: string;
  /** Why ZOE thinks this patch is needed (quote from reflection answer + reasoning). */
  rationale: string;
}

export interface ReflectionAnswers {
  /** What Zaal said shipped today. */
  shipped: string;
  /** What Zaal said is stuck. */
  stuck: string;
  /** Tomorrow's first task per Zaal. */
  tomorrow_first: string;
  /** Free-form additional context Zaal added. */
  extra?: string;
}

export interface ReflexionInput {
  answers: ReflectionAnswers;
  /** Current contents of human.md. */
  human_md: string;
  /** Current contents of persona.md. */
  persona_md: string;
  /** ZOE runtime context. */
  context: ZoeContext;
  /** Optional voice-note transcript for follow-up turns (clarifies prior low-confidence patch). */
  voiceNoteTranscript?: string;
  /** If voiceNoteTranscript is set, this is the patch id it clarifies. */
  voiceNoteClarifiesPatchId?: string;
}

export interface ReflexionPlan {
  /** All proposed patches across both files. */
  patches: ProposedPatch[];
  /** Patches that hit the high-confidence bar - emit y/n directly. */
  highConfidence: ProposedPatch[];
  /** Patches that need voice-note clarification first. */
  needsVoiceNote: ProposedPatch[];
  /** Summary ZOE will Telegram to Zaal. */
  approval_message: string;
  /** Voice-note request ZOE will Telegram (if any low-confidence patches). */
  voice_note_request: string | null;
}

export interface ReflexionResult {
  plan: ReflexionPlan;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  rawText: string;
}

/** Threshold to skip voice-note clarification + go straight to y/n. */
const HIGH_CONFIDENCE_THRESHOLD = 80;

/** Threshold below which we suppress the patch entirely (too noisy). */
const SKIP_PATCH_THRESHOLD = 40;

const REFLEXION_SYSTEM_PROMPT = `You are ZOE's reflexion layer - the Letta-style self-improvement step that runs after Zaal's evening reflection.

Your job: read Zaal's reflection answers, compare them to the current human.md and persona.md memory blocks, propose memory patches with calibrated confidence scores.

CONFIDENCE CALIBRATION:

HIGH (80-100): The reflection answer DIRECTLY contradicts or extends current memory in a non-ambiguous way. Example: human.md says "Zaal is at Jackson Labs" + reflection says "started at Riverside today" -> high-confidence patch to update the workplace.

MEDIUM (50-79): The answer SUGGESTS a memory update but ZOE isn't sure which file / section / wording. Example: Zaal mentions a new project name but it's not clear if it's a one-off mention or a sustained focus.

LOW (40-50): ZOE detects relevance but cannot draft the patch confidently. Caller will request a voice note from Zaal to clarify.

SKIP (<40): Too noisy to propose. Do not include in output.

ANTI-FABRICATION (HARDEST RULE):
Per feedback_no_sub_agent_context_fabrication: NEVER invent specifics (dates, amounts, names, project status) when drafting patch bodies. Quote Zaal verbatim from the reflection answer or mark as TBD. If you cannot find a specific in the answer, do not invent it.

VOICE-NOTE CLARIFICATION FLOW:
If voice_note_transcript is provided in the input, use it to refine a prior low-confidence patch. The voice note is Zaal's explicit intent. If the voice note contradicts the prior draft, draft fresh - do not anchor on the prior draft.

OUTPUT FORMAT (exact JSON, no prose, no code fences):

{
  "patches": [
    {
      "id": "patch-1",
      "target": "human.md" | "persona.md",
      "section": "<section heading or anchor>",
      "confidence_score": <0-100>,
      "summary": "<one-line description of the change>",
      "before": "<exact text being replaced, or null if append-only>",
      "after": "<new text>",
      "rationale": "<one-line: which reflection answer + why this patch>"
    }
  ]
}

If no patches needed, return {"patches": []}.

Output ONLY the JSON object as the last thing in your message. No preamble, no code fences.`;

/** Render the JSON-ready input for the Claude CLI. */
function buildUserPrompt(input: ReflexionInput): string {
  const voiceNoteBlock = input.voiceNoteTranscript
    ? `\n\nVoice note transcript (clarifies prior patch ${input.voiceNoteClarifiesPatchId ?? 'unknown'}):\n${input.voiceNoteTranscript}`
    : '';
  return [
    `Today is ${input.context.current_date}.`,
    ``,
    `Reflection answers:`,
    `- shipped: ${input.answers.shipped}`,
    `- stuck: ${input.answers.stuck}`,
    `- tomorrow_first: ${input.answers.tomorrow_first}`,
    input.answers.extra ? `- extra: ${input.answers.extra}` : '',
    ``,
    `Current human.md:`,
    '```',
    input.human_md,
    '```',
    ``,
    `Current persona.md:`,
    '```',
    input.persona_md,
    '```',
    voiceNoteBlock,
    ``,
    `Return ONLY the patches JSON per the system prompt format.`,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

/** Map numeric confidence to discrete label. */
export function confidenceLabel(score: number): Confidence {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/** Find last JSON object in a text string (tolerant to fence wrapping). */
function extractPlanJson(text: string): Array<Record<string, unknown>> {
  const fenceMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  let candidate: string | null = fenceMatch ? fenceMatch[1] : null;
  if (!candidate) {
    const trimmed = text.trimEnd();
    let depth = 0;
    let end = -1;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      const ch = trimmed[i];
      if (ch === '}') {
        if (depth === 0) end = i;
        depth++;
      } else if (ch === '{') {
        depth--;
        if (depth === 0 && end !== -1) {
          candidate = trimmed.slice(i, end + 1);
          break;
        }
      }
    }
  }
  if (!candidate) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const patchesRaw = (parsed as Record<string, unknown>).patches;
  if (!Array.isArray(patchesRaw)) return [];
  return patchesRaw.filter((p): p is Record<string, unknown> => !!p && typeof p === 'object');
}

/** Validate + narrow a raw patch into ProposedPatch. Drops malformed entries. */
function coercePatch(raw: Record<string, unknown>, idx: number): ProposedPatch | null {
  const id = typeof raw.id === 'string' && raw.id ? raw.id : `patch-${idx + 1}`;
  const targetRaw = typeof raw.target === 'string' ? raw.target : '';
  if (targetRaw !== 'human.md' && targetRaw !== 'persona.md') return null;
  const target: MemoryFile = targetRaw;
  const section = typeof raw.section === 'string' ? raw.section : '';
  const confidence_score =
    typeof raw.confidence_score === 'number'
      ? Math.max(0, Math.min(100, Math.round(raw.confidence_score)))
      : 0;
  const summary = typeof raw.summary === 'string' ? raw.summary : '';
  const before = typeof raw.before === 'string' ? raw.before : undefined;
  const after = typeof raw.after === 'string' ? raw.after : '';
  const rationale = typeof raw.rationale === 'string' ? raw.rationale : '';
  if (!summary || !after) return null;
  if (confidence_score < SKIP_PATCH_THRESHOLD) return null;
  return {
    id,
    target,
    section,
    confidence: confidenceLabel(confidence_score),
    confidence_score,
    summary,
    before,
    after,
    rationale,
  };
}

/** Pure-function build of the Telegram approval-message text. */
export function renderApprovalMessage(highConfidence: ProposedPatch[]): string {
  if (highConfidence.length === 0) {
    return 'No high-confidence memory patches from tonight\'s reflection. Nothing to approve.';
  }
  const lines: string[] = [];
  lines.push(`I have ${highConfidence.length} memory patch${highConfidence.length === 1 ? '' : 'es'} from tonight\'s reflection. Approve each:`);
  lines.push('');
  for (const p of highConfidence) {
    lines.push(`${p.id} (${p.target} -> ${p.section || 'no section'}): ${p.summary}`);
    if (p.before) {
      lines.push(`  - was: ${truncate(p.before, 120)}`);
    }
    lines.push(`  - now: ${truncate(p.after, 200)}`);
    lines.push('');
  }
  lines.push(`Reply "y patch-1 patch-2" to approve specific ids, "y all" to approve all, or "n" to skip all.`);
  return lines.join('\n');
}

/** Pure-function build of the voice-note request message. */
export function renderVoiceNoteRequest(needsVoiceNote: ProposedPatch[]): string {
  if (needsVoiceNote.length === 0) return '';
  const lines: string[] = [];
  lines.push(`${needsVoiceNote.length} low-confidence memory patch${needsVoiceNote.length === 1 ? '' : 'es'} from tonight - need a voice note to clarify intent:`);
  lines.push('');
  for (const p of needsVoiceNote) {
    lines.push(`${p.id} (${p.target} -> ${p.section || 'no section'}): ${p.summary}`);
    lines.push(`  - rationale: ${p.rationale}`);
    lines.push(`  - tentative patch: ${truncate(p.after, 150)}`);
    lines.push('');
  }
  lines.push(`Send a voice note explaining what you actually want for each. I\'ll redraft + y/n.`);
  return lines.join('\n');
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

/**
 * Reflexion: read Zaal's reflection answers, propose memory patches.
 *
 * Caller (scheduler.ts or concierge.ts) wires the output:
 *   - approval_message -> Telegram message to Zaal
 *   - voice_note_request -> separate Telegram message asking for voice note
 *   - On y reply for a patch id: write patch to ~/.zao/zoe/{human,persona}.md
 *   - On voice note reply: re-run reflexion with voiceNoteTranscript set
 */
export async function runReflexion(input: ReflexionInput): Promise<ReflexionResult> {
  // Voice-note clarification turns escalate to Opus - intent might be subtle.
  const model = input.voiceNoteTranscript ? ZOE_HARD_MODEL : ZOE_DEFAULT_MODEL;
  const userPrompt = buildUserPrompt(input);

  const result = await callClaudeCli({
    model,
    prompt: userPrompt,
    cwd: input.context.workspace_dir,
    appendSystemPrompt: REFLEXION_SYSTEM_PROMPT,
    allowedTools: [],
    disallowedTools: ['Bash', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'WebFetch', 'Task'],
    permissionMode: 'default',
    outputFormat: 'json',
    bare: false,
  });

  const rawPatches = extractPlanJson(result.text);
  const patches: ProposedPatch[] = rawPatches
    .map((p, i) => coercePatch(p, i))
    .filter((p): p is ProposedPatch => p !== null)
    .sort((a, b) => b.confidence_score - a.confidence_score);

  const highConfidence = patches.filter((p) => p.confidence === 'high');
  const needsVoiceNote = patches.filter((p) => p.confidence === 'low');

  const plan: ReflexionPlan = {
    patches,
    highConfidence,
    needsVoiceNote,
    approval_message: renderApprovalMessage(highConfidence),
    voice_note_request: needsVoiceNote.length > 0 ? renderVoiceNoteRequest(needsVoiceNote) : null,
  };

  return {
    plan,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.totalCostUsd,
    durationMs: result.durationMs,
    rawText: result.text,
  };
}

/**
 * Apply an approved patch to the in-memory string. Returns the new file
 * content. Caller persists via memory.ts seedFile().
 *
 * Pure function - no IO. Easier to test.
 */
export function applyPatch(currentContent: string, patch: ProposedPatch): string {
  if (patch.before === undefined || patch.before === '') {
    // Append-only: add after a trailing newline.
    const sep = currentContent.endsWith('\n') ? '' : '\n';
    return `${currentContent}${sep}${patch.after}\n`;
  }
  // Replace-style: find + replace first occurrence.
  const idx = currentContent.indexOf(patch.before);
  if (idx < 0) {
    // before block not found - fall through to append-only with a marker.
    const sep = currentContent.endsWith('\n') ? '' : '\n';
    return `${currentContent}${sep}\n<!-- reflexion patch ${patch.id}: before-block not found, appended -->\n${patch.after}\n`;
  }
  return currentContent.slice(0, idx) + patch.after + currentContent.slice(idx + patch.before.length);
}
