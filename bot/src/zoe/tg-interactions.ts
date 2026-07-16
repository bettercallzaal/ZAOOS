/**
 * tg-interactions.ts - 6 new Telegram interaction features for ZOE.
 *
 * 1. VOICE-NOTE ANSWERS: when Zaal replies to a question with a voice note,
 *    transcribe and treat as answer [answer:qid]
 * 2. REACTIONS AS ACTIONS: message reactions -> thumbs-up/+1 = approve, checkmark = done, fire = urgent
 * 3. FILE/PHOTO/LINK auto-route: classify intent (research/task/meeting/fyi) with GUESS+TAG
 * 4. REPLY-TO-ROUTE: thread replies to specific ZOE messages by message ID
 * 5. BOT COMMANDS: /pulse /agenda /list mirror board state
 * 6. BATCH-ANSWER: parse "1:A 2:best 3:skip" against open questions
 *
 * All handlers are pure + injected for testability. Integrated into index.ts
 * via bot.on() + bot.command().
 */

import { Context } from 'grammy';
import type { Message } from 'grammy/types';
import { pushRecent, readHuman, type ChatScope } from './memory';
import { transcribeTelegramFile } from './transcribe';
import { parseQuestionCallback, TYPE_SENTINEL, encodeQuestion } from './questions';
import type { ParsedQuestion } from './questions';
import { getContextForMessage } from './message-context';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

// Feature 1: VOICE-NOTE ANSWERS
// Detect when Zaal replies to a pending question with a voice note.
// If reply_to_message exists and there's a pending question for that thread,
// transcribe the voice and route it as [answer:qid].

export interface VoiceAnswerDeps {
  transcribe: (token: string, fileId: string) => Promise<string>;
  getPendingQuestion: (chatId: number) => string | undefined; // returns qid if pending
  logAnswer: (text: string, scope: ChatScope) => Promise<void>;
}

/**
 * Handle a voice message that may be answering a pending question.
 * If reply_to_message points to a question message, transcribe + route as answer.
 * If no pending question, fall back to generic voice handling.
 */
export async function handleVoiceAnswer(
  ctx: Context,
  deps: {
    botToken: string;
    transcribe: (token: string, fileId: string) => Promise<string>;
    isFromZaal: boolean;
    chatId: number;
    zaalBotzGroupId?: number;
    pendingQuestions: Map<number, string>; // chatId -> qid
  },
): Promise<{ handled: boolean; qid?: string; transcript?: string; error?: string }> {
  if (!deps.isFromZaal) {
    return { handled: false };
  }

  const fileId = ctx.message?.voice?.file_id ?? ctx.message?.audio?.file_id;
  if (!fileId) {
    return { handled: false };
  }

  const replyToId = ctx.message?.reply_to_message?.message_id;
  const awaitingQid = deps.pendingQuestions.get(deps.chatId);

  // Only handle if there's a pending question OR it's a reply to a question message
  if (!awaitingQid && !replyToId) {
    return { handled: false };
  }

  let transcript: string;
  try {
    transcript = await deps.transcribe(deps.botToken, fileId);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { handled: true, error: errMsg };
  }

  if (!transcript) {
    return { handled: true, error: 'voice note was empty' };
  }

  const qid = awaitingQid || 'voice-reply';

  // Log as [answer:qid] in the same format as button answers
  const logText = `[answer:${qid}] ${transcript}`;
  const scope: ChatScope = deps.chatId > 0 ? 'private' : `group-${deps.chatId}`;

  try {
    // Log to recent/ so orchestrator session picks it up
    await pushRecent(
      { from: 'zaal', text: logText, sender: 'voice-answer' },
      String(deps.zaalBotzGroupId ?? deps.chatId),
    );
  } catch {
    // continue even if log fails (best-effort)
  }

  if (awaitingQid) {
    deps.pendingQuestions.delete(deps.chatId);
  }

  return { handled: true, qid, transcript };
}

// Feature 2: REACTIONS AS ACTIONS
// message_reaction updates: thumbs-up/+1 = approve/ack, checkmark = done, fire = urgent.
// Only act on Zaal's reactions.

export interface ReactionActionDeps {
  unpin: (chatId: number, messageId: number) => Promise<void>;
  markDone: (taskId: string, status: 'done') => Promise<void>;
  getTaskForMessage: (messageId: number) => Promise<string | null>; // messageId -> taskId
  ping: (queueName: string, reason: string) => Promise<void>;
}

export async function handleMessageReaction(
  ctx: Context,
  deps: {
    isFromZaal: boolean;
    zaalId: number;
    reactions: {
      unpin: (chatId: number, messageId: number) => Promise<void>;
      markDone: (taskId: string, status: 'done') => Promise<void>;
      getTaskForMessage: (messageId: number) => Promise<string | null>;
      ping: (queueName: string, reason: string) => Promise<void>;
    };
  },
): Promise<{ handled: boolean; action?: string; error?: string }> {
  if (!deps.isFromZaal) {
    return { handled: false };
  }

  const msgReaction = ctx.messageReaction;
  if (!msgReaction) {
    return { handled: false };
  }

  const messageId = msgReaction.message_id;
  const chatId = ctx.chat?.id;
  if (!chatId) {
    return { handled: false };
  }

  // Extract emoji from reactions array
  const emojis: string[] = [];
  if (msgReaction.new_reaction) {
    for (const react of msgReaction.new_reaction) {
      if ('emoji' in react && typeof react.emoji === 'string') {
        emojis.push(react.emoji);
      }
    }
  }

  // Process each emoji
  for (const emoji of emojis) {
    try {
      if (emoji === '👍' || emoji === '+1' || emoji === '1️⃣') {
        // Approve/ack - unpin the message
        await deps.reactions.unpin(chatId, messageId);
        return { handled: true, action: 'approve' };
      }

      if (emoji === '✅' || emoji === '✓' || emoji === '☑️') {
        // Mark done - if tied to a task, mark it done
        const taskId = await deps.reactions.getTaskForMessage(messageId);
        if (taskId) {
          await deps.reactions.markDone(taskId, 'done');
          await deps.reactions.unpin(chatId, messageId);
        }
        return { handled: true, action: 'mark-done' };
      }

      if (emoji === '🔥' || emoji === '⚡' || emoji === '❗') {
        // Mark urgent - ping the urgent queue
        await deps.reactions.ping('urgent', `message ${messageId} marked urgent via reaction`);
        return { handled: true, action: 'mark-urgent' };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { handled: true, error: errMsg };
    }
  }

  return { handled: true };
}

// Feature 3: FILE/PHOTO/LINK auto-route
// Classify intent from file/photo/link + route with GUESS+TAG.
// Research link -> concierge research path
// Task-shaped -> create board row
// Meeting media -> flag for /meeting

export type IntentClassification = 'research' | 'task' | 'meeting' | 'fyi';

export async function classifyIntent(
  text: string,
  hasFile: boolean,
  hasPhoto: boolean,
  hasUrl: boolean,
): Promise<IntentClassification> {
  // Heuristics for classification
  const lower = text.toLowerCase();

  if (lower.includes('research') || lower.includes('article') || hasUrl) {
    return 'research';
  }
  if (lower.includes('meeting') || lower.includes('calendar') || hasPhoto) {
    return 'meeting';
  }
  if (lower.includes('task') || lower.includes('todo') || lower.includes('do:')) {
    return 'task';
  }

  // Default based on media type
  if (hasFile) return 'task';
  if (hasPhoto) return 'meeting';
  if (hasUrl) return 'research';

  return 'fyi';
}

export async function handleAutoRoute(
  ctx: Context,
  deps: {
    isFromZaal: boolean;
    downloadFile: (fileId: string, destDir: string) => Promise<string>;
    extractUrl: (text: string) => string | null;
  },
): Promise<{ handled: boolean; intent?: IntentClassification; guess?: string; error?: string }> {
  if (!deps.isFromZaal) {
    return { handled: false };
  }

  const message = ctx.message;
  if (!message) {
    return { handled: false };
  }

  const hasPhoto = !!message.photo;
  const hasFile = !!message.document;
  const text = message.caption || message.text || '';
  const url = deps.extractUrl(text);
  const hasUrl = !!url;

  // Only handle if there's a file, photo, or URL
  if (!hasPhoto && !hasFile && !hasUrl) {
    return { handled: false };
  }

  const intent = await classifyIntent(text, hasFile, hasPhoto, hasUrl);

  // Auto-route based on intent
  let action = '';
  switch (intent) {
    case 'research':
      action = 'auto-routed to research - correct with a tap';
      break;
    case 'task':
      action = 'auto-routed to task queue - correct with a tap';
      break;
    case 'meeting':
      action = 'auto-routed to meeting intake - correct with a tap';
      break;
    case 'fyi':
      action = 'auto-routed as FYI - correct with a tap';
      break;
  }

  try {
    // Log the guess to recent/
    const guess = `[classify:${intent}] ${text || url || '(media)'}`;
    await pushRecent(
      { from: 'zaal', text: guess, sender: 'auto-classify' },
      String(ctx.chat.id),
    );
  } catch {
    // continue even if log fails
  }

  return { handled: true, intent, guess: action };
}

// Feature 4: REPLY-TO-ROUTE
// When Zaal REPLIES to a specific ZOE message, thread his text to that message's item.
// Use replied-to message id to look up which qid/task it belongs to from persistent storage.

export async function handleReplyRoute(
  ctx: Context,
  deps: {
    isFromZaal: boolean;
  },
): Promise<{ handled: boolean; contextType?: string; id?: string; error?: string }> {
  if (!deps.isFromZaal) {
    return { handled: false };
  }

  const replyToId = ctx.message?.reply_to_message?.message_id;
  const text = ctx.message?.text || '';

  if (!replyToId || !text) {
    return { handled: false };
  }

  try {
    const context = await getContextForMessage(replyToId);
    if (!context) {
      return { handled: false };
    }

    if (context.qid) {
      // Thread to question
      const logText = `[answer:${context.qid}] ${text}`;
      try {
        await pushRecent(
          { from: 'zaal', text: logText, sender: 'reply-thread' },
          String(ctx.chat.id),
        );
      } catch {
        // continue
      }
      return { handled: true, contextType: 'question', id: context.qid };
    }

    if (context.taskId) {
      // Thread to task
      const logText = `[task-reply:${context.taskId}] ${text}`;
      try {
        await pushRecent(
          { from: 'zaal', text: logText, sender: 'reply-thread' },
          String(ctx.chat.id),
        );
      } catch {
        // continue
      }
      return { handled: true, contextType: 'task', id: context.taskId };
    }

    return { handled: false };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { handled: false, error: errMsg };
  }
}

// Feature 5: BOT COMMANDS (/pulse /agenda /list)
// Mirror ~/bin/zao-pulse and ~/bin/zao-agenda output to Telegram.

export interface BoardItem {
  id: string;
  title: string;
  status: 'open' | 'done' | 'archived';
  priority?: 'urgent' | 'normal' | 'low';
  assignee?: string;
}

export async function getBoardState(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<BoardItem[]> {
  // Fetch from board API (via Supabase or cowork REST)
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/board_items?status=neq.archived`, {
      headers: { Authorization: `Bearer ${supabaseKey}` },
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch {
    return [];
  }
}

export async function formatPulse(items: BoardItem[]): Promise<string> {
  const open = items.filter((i) => i.status === 'open');
  const urgent = open.filter((i) => i.priority === 'urgent');

  let out = 'PULSE\n\n';
  if (urgent.length > 0) {
    out += `URGENT (${urgent.length}):\n`;
    for (const item of urgent.slice(0, 5)) {
      out += `- ${item.title}\n`;
    }
    out += '\n';
  }

  out += `OPEN (${open.length}):\n`;
  for (const item of open.slice(0, 10)) {
    out += `- ${item.title}\n`;
  }

  return out;
}

export async function formatAgenda(items: BoardItem[]): Promise<string> {
  const open = items.filter((i) => i.status === 'open').sort((a, b) => {
    const aPri = a.priority === 'urgent' ? 0 : a.priority === 'normal' ? 1 : 2;
    const bPri = b.priority === 'urgent' ? 0 : b.priority === 'normal' ? 1 : 2;
    return aPri - bPri;
  });

  let out = 'AGENDA\n\n';
  for (const item of open.slice(0, 20)) {
    const pri = item.priority === 'urgent' ? '[URGENT] ' : '';
    out += `${pri}${item.title}\n`;
  }

  return out;
}

// Feature 6: BATCH-ANSWER
// Parse "1:A 2:best 3:skip" and resolve each against open questions.

export interface OpenQuestion {
  qid: string;
  options: string[];
  text: string;
}

export interface BatchAnswer {
  qid: string;
  choice: number | string;
  value: string;
}

export function parseBatchAnswer(text: string): BatchAnswer[] {
  const answers: BatchAnswer[] = [];
  const lines = text.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const match = line.match(/^(\d+|[a-z]+):(.+)$/i);
    if (!match) continue;

    const [, id, value] = match;
    const isNumeric = /^\d+$/.test(id);
    const choice = isNumeric ? parseInt(id, 10) : id;

    answers.push({
      qid: `batch-${id}`,
      choice,
      value: value.trim(),
    });
  }

  return answers;
}

export async function handleBatchAnswer(
  text: string,
  deps: {
    openQuestions: OpenQuestion[];
    log: (text: string) => Promise<void>;
  },
): Promise<{ processed: number; errors: string[] }> {
  const answers = parseBatchAnswer(text);
  const errors: string[] = [];

  for (const answer of answers) {
    try {
      // Map the choice to a question option
      const qIndex =
        typeof answer.choice === 'number'
          ? answer.choice - 1
          : deps.openQuestions.findIndex((q) => q.qid === answer.qid);

      if (qIndex < 0 || qIndex >= deps.openQuestions.length) {
        errors.push(`Question ${answer.choice} not found`);
        continue;
      }

      const q = deps.openQuestions[qIndex];

      // Log the answer
      const logText = `[answer:${q.qid}] ${answer.value}`;
      await deps.log(logText);
    } catch (err) {
      errors.push((err instanceof Error ? err.message : String(err)).slice(0, 100));
    }
  }

  return { processed: answers.length - errors.length, errors };
}
