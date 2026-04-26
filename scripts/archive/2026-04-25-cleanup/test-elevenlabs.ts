/**
 * ElevenLabs API Test Script
 * Tests: API connection, voice clone, TTS, and lists available voices
 *
 * Usage: npx tsx scripts/test-elevenlabs.ts
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const BASE_URL = 'https://api.elevenlabs.io/v1';

if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env.local');
  process.exit(1);
}

async function testConnection() {
  console.log('\n=== 1. Testing API Connection ===');
  const res = await fetch(`${BASE_URL}/user`, {
    headers: { 'xi-api-key': API_KEY! },
  });
  if (!res.ok) {
    console.error(`API connection failed: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    return false;
  }
  const user = await res.json();
  console.log(`Connected! Account: ${user.subscription?.tier || 'unknown'}`);
  console.log(`Characters used: ${user.subscription?.character_count || 0} / ${user.subscription?.character_limit || 0}`);
  return true;
}

async function listVoices() {
  console.log('\n=== 2. Listing All Voices ===');
  const res = await fetch(`${BASE_URL}/voices`, {
    headers: { 'xi-api-key': API_KEY! },
  });
  if (!res.ok) {
    console.error(`Failed to list voices: ${res.status}`);
    return;
  }
  const data = await res.json();
  console.log(`\nFound ${data.voices.length} voices:\n`);

  const yourClone = data.voices.find((v: any) => v.voice_id === VOICE_ID);
  if (yourClone) {
    console.log(`YOUR CLONE: "${yourClone.name}" (${yourClone.voice_id})`);
    console.log(`  Category: ${yourClone.category}`);
    console.log(`  Labels: ${JSON.stringify(yourClone.labels)}`);
    console.log('');
  }

  // Group by category
  const premade = data.voices.filter((v: any) => v.category === 'premade' || v.category === 'professional');
  const cloned = data.voices.filter((v: any) => v.category === 'cloned');

  console.log('--- Your Cloned Voices ---');
  for (const v of cloned) {
    console.log(`  ${v.name} | ${v.voice_id} | ${JSON.stringify(v.labels || {})}`);
  }

  console.log('\n--- Premade/Library Voices ---');
  for (const v of premade) {
    const gender = v.labels?.gender || 'unknown';
    const accent = v.labels?.accent || '';
    const desc = v.labels?.description || '';
    const useCase = v.labels?.use_case || '';
    console.log(`  ${v.name} | ${gender} | ${accent} | ${desc} | ${useCase} | ${v.voice_id}`);
  }
}

async function searchFemaleVoices() {
  console.log('\n=== 3. Searching Voice Library for Female Voices ===');
  // Search the shared voice library for high-quality female voices good for music
  const params = new URLSearchParams({
    gender: 'female',
    use_cases: 'entertainment',
    page_size: '20',
    sort: 'usage_character_count_change_from_7_days_ago',
  });

  const res = await fetch(`${BASE_URL}/shared-voices?${params}`, {
    headers: { 'xi-api-key': API_KEY! },
  });
  if (!res.ok) {
    console.error(`Voice library search failed: ${res.status}`);
    const body = await res.text();
    console.error(body);
    return;
  }
  const data = await res.json();
  console.log(`\nTop ${data.voices?.length || 0} trending female entertainment voices:\n`);

  for (const v of (data.voices || [])) {
    const accent = v.accent || '';
    const desc = v.description || '';
    const age = v.age || '';
    console.log(`  ${v.name} | ${age} | ${accent} | ${v.voice_id}`);
    if (desc) console.log(`    "${desc.slice(0, 100)}"`);
    console.log(`    Clones: ${v.cloned_by_count || 0} | Rate: ${v.rate || 0}/5`);
    console.log('');
  }
}

async function testTTS() {
  if (!VOICE_ID) {
    console.log('\n=== 4. Skipping TTS test (no VOICE_ID) ===');
    return;
  }

  console.log('\n=== 4. Testing Text-to-Speech with Bettercallzaal ===');
  const res = await fetch(`${BASE_URL}/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Yo, this is Zaal from The ZAO. Summer of 26 is coming. Pull up to Maine.',
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.3,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    console.error(`TTS failed: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    return;
  }

  const audioBuffer = await res.arrayBuffer();
  const fs = await import('fs');
  const path = await import('path');
  const outPath = path.join(process.cwd(), 'test-output-tts.mp3');
  fs.writeFileSync(outPath, Buffer.from(audioBuffer));
  console.log(`TTS audio saved to: ${outPath}`);
  console.log(`File size: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);
}

async function testMusicPlan() {
  console.log('\n=== 5. Testing Music Plan Generation (FREE - no credits) ===');
  const res = await fetch(`${BASE_URL}/music/plan`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: 'An upbeat summer hip-hop anthem about coming to Maine for a music festival called ZAO Stock, 118 BPM, male rap vocals with catchy chorus hook',
    }),
  });

  if (!res.ok) {
    console.error(`Music plan failed: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    return;
  }

  const plan = await res.json();
  console.log('\nGenerated composition plan:');
  console.log(JSON.stringify(plan, null, 2));
}

async function main() {
  console.log('ElevenLabs API Test Suite');
  console.log('========================');

  // Skip user check if permission not granted - go straight to voices
  await testConnection().catch(() => console.log('(User read not permitted - skipping)'));

  await listVoices();
  await searchFemaleVoices();
  await testTTS();
  await testMusicPlan();

  console.log('\n========================');
  console.log('All tests complete!');
}

main().catch(console.error);
