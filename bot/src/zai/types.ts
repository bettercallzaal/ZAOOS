import { z } from 'zod';

export const DiscordCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join'),
  }),
  z.object({
    type: z.literal('ask'),
    question: z.string().min(1),
  }),
  z.object({
    type: z.literal('summary'),
  }),
  z.object({
    type: z.literal('stop'),
  }),
]);

export type DiscordCommand = z.infer<typeof DiscordCommandSchema>;

export interface CaptureSession {
  sessionId: string;
  guildId: string;
  channelId: string;
  textChannelId: string;
  startTime: Date;
  speakers: Map<string, SpeakerData>;
  transcript: TranscriptLine[];
  isActive: boolean;
}

export interface SpeakerData {
  userId: string;
  username: string;
  audioChunks: Uint8Array[];
  totalDuration: number;
}

export interface TranscriptLine {
  timestamp: Date;
  speaker: string;
  userId: string;
  text: string;
}

export interface TranscriptSummary {
  title: string;
  overview: string;
  actionItems: string[];
  keyTopics: string[];
  duration: number;
}
