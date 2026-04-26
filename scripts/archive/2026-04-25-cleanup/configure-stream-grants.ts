/**
 * One-time script to configure Stream.io audio_room call type grants.
 * Run with: npx tsx scripts/configure-stream-grants.ts
 *
 * This sets per-role permissions that can't be configured in the dashboard UI.
 */
import { StreamClient } from '@stream-io/node-sdk';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error('Missing NEXT_PUBLIC_STREAM_API_KEY or STREAM_API_SECRET in env');
  process.exit(1);
}

const client = new StreamClient(apiKey, apiSecret);

async function configureGrants() {
  console.log('Configuring audio_room call type grants...\n');

  try {
    await client.video.updateCallType({
      name: 'audio_room',
      grants: {
        // Host: full control
        host: [
          'send-audio',
          'send-video',
          'screenshare',
          'end-call',
          'mute-users',
          'pin-for-everyone',
          'join-backstage',
          'join-call',
          'read-call',
          'create-call',
          'create-reaction',
          'start-record-call',
          'stop-record-call',
          'start-broadcast-call',
          'stop-broadcast-call',
          'start-transcription-call',
          'stop-transcription-call',
          'update-call',
          'update-call-member',
          'update-call-permissions',
          'update-call-settings',
        ],
        // Regular users: can join, listen, react, request to speak
        user: [
          'join-call',
          'read-call',
          'create-reaction',
        ],
        // Call members (invited): same as user + can request audio
        'call_member': [
          'join-call',
          'read-call',
          'create-reaction',
        ],
      },
      // Only update grants — settings already configured in dashboard
    });

    console.log('audio_room grants configured successfully!\n');
    console.log('Host permissions:');
    console.log('  - send-audio, send-video, screenshare');
    console.log('  - end-call, mute-users, kick-user, block-users');
    console.log('  - pin-for-everyone, join-backstage');
    console.log('  - start/stop recording, broadcasting, transcription');
    console.log('  - update call settings and permissions\n');
    console.log('User permissions:');
    console.log('  - join-call, read-call, create-reaction');
    console.log('  - Must request send-audio permission to speak\n');
  } catch (err) {
    console.error('Failed to configure grants:', err);
    process.exit(1);
  }
}

configureGrants();
