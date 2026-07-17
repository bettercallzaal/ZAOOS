/**
 * ZAI — Discord Live Voice-Capture + Q&A Bot
 *
 * ZAI (ZAO Assistant/Companion) captures live Discord voice conversations,
 * transcribes them in real-time via Groq Whisper, and answers questions
 * about the ongoing discussion via Claude.
 *
 * Slash commands:
 *   /join - bot joins the invoker's voice channel, starts capturing
 *   /ask <question> - answer a question about the conversation
 *   /summary - post a summary + action items
 *   /stop - end capture, post transcript, save to file
 *
 * Run via:
 *   pnpm tsx src/zai/index.ts
 *   OR: systemd user unit zai-bot.service
 */

import { config as loadEnv } from 'dotenv';
loadEnv({ path: process.env.ZAI_ENV_FILE || `${process.env.HOME}/.zao/private/discord.env` });

import { Client, GatewayIntentBits, ChannelType, InteractionType, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { loadConfig, isConfigured } from './config';
import { startVoiceCapture, formatTranscript, saveSessionTranscript } from './voice-capture';
import { answerQuestion, summarizeTranscript } from './llm-handler';
import type { CaptureSession } from './types';
import { randomBytes } from 'node:crypto';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
});

// Map of guildId -> active session
const activeSessions = new Map<string, CaptureSession>();

// Track captured transcript lines per session for /ask and /summary
const transcriptParts = new Map<string, string[]>();

/**
 * Register slash commands on startup.
 */
client.on('ready', async () => {
  if (!client.user) return;

  console.log(`ZAI ready as ${client.user.tag}`);

  // Register commands globally (production would use guild-specific for testing)
  try {
    await client.application?.commands.set([
      {
        name: 'join',
        description: 'Start capturing this voice channel',
        type: 1, // CHAT_INPUT
      },
      {
        name: 'ask',
        description: 'Ask a question about the current conversation',
        type: 1,
        options: [
          {
            name: 'question',
            description: 'Your question about the conversation',
            type: 3, // STRING
            required: true,
          },
        ],
      },
      {
        name: 'summary',
        description: 'Post a summary of the conversation so far',
        type: 1,
      },
      {
        name: 'stop',
        description: 'Stop capturing and save the transcript',
        type: 1,
      },
    ]);
    console.log('Slash commands registered');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

/**
 * Handle slash command interactions.
 */
client.on('interactionCreate', async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: 'This command only works in servers', ephemeral: true });
    return;
  }

  try {
    switch (interaction.commandName) {
      case 'join':
        await handleJoin(interaction);
        break;
      case 'ask':
        await handleAsk(interaction);
        break;
      case 'summary':
        await handleSummary(interaction);
        break;
      case 'stop':
        await handleStop(interaction);
        break;
    }
  } catch (err) {
    console.error(`Command ${interaction.commandName} failed:`, err);
    const content =
      err instanceof Error
        ? `Error: ${err.message.slice(0, 100)}`
        : 'An error occurred';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
});

/**
 * /join - connect to invoker's voice channel and start capturing.
 */
async function handleJoin(interaction: any) {
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    await interaction.reply({ content: 'You must be in a voice channel to use /join', ephemeral: true });
    return;
  }

  const guildId = interaction.guildId!;
  if (activeSessions.has(guildId)) {
    await interaction.reply({
      content: 'A capture session is already active in this server',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  // Create session
  const sessionId = randomBytes(8).toString('hex');
  const session: CaptureSession = {
    sessionId,
    guildId,
    channelId: voiceChannel.id,
    textChannelId: interaction.channelId,
    startTime: new Date(),
    speakers: new Map(),
    transcript: [],
    isActive: true,
  };

  activeSessions.set(guildId, session);
  transcriptParts.set(sessionId, []);

  // Connect to voice channel
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  });

  // Start capturing with callback for each transcribed line
  const stopCapture = startVoiceCapture(
    connection,
    session,
    async (line) => {
      transcriptParts.get(sessionId)?.push(`[${line.speaker}] ${line.text}`);

      // Post periodic updates to text channel (throttled)
      const parts = transcriptParts.get(sessionId);
      if (parts && parts.length % 5 === 0) {
        try {
          const textChannel = await client.channels.fetch(interaction.channelId);
          if (textChannel?.isTextBased()) {
            const recent = parts.slice(-3).join('\n');
            const embed = new EmbedBuilder()
              .setColor('#f5a623')
              .setTitle('Live Transcription Update')
              .setDescription(recent || 'Listening...')
              .setFooter({ text: `Session ${sessionId.slice(0, 8)}` });
            await (textChannel as any).send({ embeds: [embed] });
          }
        } catch (err) {
          console.error('Failed to post update:', err);
        }
      }
    },
  );

  // Store cleanup function so /stop can call it
  (activeSessions.get(guildId) as any)._stopCapture = stopCapture;

  await interaction.editReply({
    content: `Started capturing in ${voiceChannel.name}. Use /ask, /summary, or /stop.`,
  });
}

/**
 * /ask <question> - answer a question about the conversation.
 */
async function handleAsk(interaction: any) {
  const guildId = interaction.guildId!;
  const session = activeSessions.get(guildId);

  if (!session) {
    await interaction.reply({
      content: 'No active capture session. Use /join first.',
      ephemeral: true,
    });
    return;
  }

  const question = interaction.options.getString('question')!;
  await interaction.deferReply();

  try {
    const { answer } = await answerQuestion(question, session.transcript);

    const embed = new EmbedBuilder()
      .setColor('#f5a623')
      .setTitle('ZAI Answer')
      .setDescription(answer)
      .setFooter({ text: `Confidence: ${session.transcript.length > 20 ? 'high' : 'medium'}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({
      content: `Could not answer: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
  }
}

/**
 * /summary - post a summary of the conversation.
 */
async function handleSummary(interaction: any) {
  const guildId = interaction.guildId!;
  const session = activeSessions.get(guildId);

  if (!session) {
    await interaction.reply({
      content: 'No active capture session. Use /join first.',
      ephemeral: true,
    });
    return;
  }

  if (session.transcript.length === 0) {
    await interaction.reply({
      content: 'No transcript yet. Please wait for some conversation to be captured.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const summary = await summarizeTranscript(session.transcript);

    const embed = new EmbedBuilder()
      .setColor('#f5a623')
      .setTitle(summary.title)
      .setDescription(summary.overview)
      .addFields(
        summary.actionItems.length > 0
          ? { name: 'Action Items', value: summary.actionItems.join('\n'), inline: false }
          : { name: 'Action Items', value: '(none)', inline: false },
      )
      .addFields({
        name: 'Key Topics',
        value: summary.keyTopics.join(', ') || '(still capturing)',
        inline: false,
      })
      .setFooter({ text: `Duration: ${summary.duration}m` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({
      content: `Could not summarize: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
  }
}

/**
 * /stop - end capture, post transcript, save to file.
 */
async function handleStop(interaction: any) {
  const guildId = interaction.guildId!;
  const session = activeSessions.get(guildId) as any;

  if (!session) {
    await interaction.reply({
      content: 'No active capture session.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  // Stop voice capture
  if (session._stopCapture) {
    session._stopCapture();
  }
  session.isActive = false;

  try {
    // Save transcript to file
    const filePath = await saveSessionTranscript(session);

    // Post full transcript
    const transcript = formatTranscript(session.transcript);
    const textChannel = await client.channels.fetch(interaction.channelId);

    if (textChannel?.isTextBased()) {
      const chunks = splitMessage(transcript, 2000);
      for (const chunk of chunks) {
        await (textChannel as any).send(`\`\`\`\n${chunk}\n\`\`\``);
      }
    }

    activeSessions.delete(guildId);
    transcriptParts.delete(session.sessionId);

    await interaction.editReply({
      content: `Capture stopped. Transcript saved to \`${filePath}\`. ${session.transcript.length} lines captured.`,
    });
  } catch (err) {
    await interaction.editReply({
      content: `Stop failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
  }
}

/**
 * Split a long message into chunks for Discord's 2000 char limit.
 */
function splitMessage(message: string, limit: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const line of message.split('\n')) {
    if ((current + line).length > limit) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Main boot.
 */
async function main() {
  if (!isConfigured()) {
    console.error(
      'ZAI not configured. Set DISCORD_CAPTURE_TOKEN, ZAAL_GUILD_ID, GROQ_API_KEY, and ANTHROPIC_API_KEY.',
    );
    process.exit(1);
  }

  const config = loadConfig();
  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
