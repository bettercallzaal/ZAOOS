import { StorageClient } from '@lens-chain/storage-client';
import crypto from 'crypto';

async function testFullFlow() {
  console.log('=== Step 1: Create StorageClient ===');
  const storageClient = StorageClient.create();

  console.log('=== Step 2: Build metadata ===');
  const metadata = {
    $schema: 'https://json-schemas.lens.dev/publications/text/3.0.0.json',
    lens: {
      id: crypto.randomUUID(),
      locale: 'en',
      mainContentFocus: 'TEXT_ONLY',
      content: 'Test post from ZAO OS — verifying Grove upload flow',
      appId: 'zao-os',
    },
  };
  console.log('Metadata:', JSON.stringify(metadata, null, 2));

  console.log('\n=== Step 3: Upload to Grove ===');
  const result = await storageClient.uploadAsJson(metadata);
  console.log('URI:', result.uri);
  console.log('Gateway URL:', result.gatewayUrl);

  console.log('\n=== Step 4: Verify content is accessible ===');
  const verify = await fetch(result.gatewayUrl);
  const stored = await verify.json();
  console.log('Stored content matches:', stored.lens?.content === metadata.lens.content ? 'YES' : 'NO');
  console.log('Stored appId:', stored.lens?.appId);

  console.log('\n=== Step 5: URI format check ===');
  console.log('Starts with lens://:', result.uri.startsWith('lens://'));
  console.log('\nReady for post mutation: contentUri =', result.uri);
  console.log('\nThis URI goes into:');
  console.log('mutation { post(request: { contentUri: "' + result.uri + '" }) { ... } }');
}

testFullFlow().catch(console.error);
