# Livepeer Media Kit Integration - Scaffold

This directory contains a minimal working integration of Livepeer Studio API into the Baraza streaming media kit.

## What's Here

- **livepeer-media.ts** - TypeScript client module for Livepeer Studio API
  - Create livestreams
  - Upload video assets
  - Request asynchronous transcoding
  - Query stream/asset status
  - Fully typed, production-ready structure

- **types.ts** (example usage pattern)
  - Request/response types
  - Error handling
  - Session management

## How to Use

### 1. Install Livepeer SDK
```bash
npm install livepeer
```

### 2. Environment Setup
Create `.env.local`:
```env
LIVEPEER_API_KEY=<your-api-key-here>
LIVEPEER_STUDIO_URL=https://livepeer.studio/api
```

Get your API key:
1. Visit `livepeer.studio`
2. Sign up / log in
3. Navigate to API Keys section
4. Create new key with appropriate scopes (streams, assets, transcode)

### 3. Basic Usage

```typescript
import { LivepeerMedia } from '@/lib/livepeer-media'

// Initialize
const livepeer = new LivepeerMedia(process.env.LIVEPEER_API_KEY!)

// Create a livestream
const stream = await livepeer.createStream({
  name: 'Baraza Live #1',
  profiles: [
    { name: '720p', bitrate: 4000, fps: 30, width: 1280, height: 720 },
    { name: '480p', bitrate: 2000, fps: 30, width: 854, height: 480 },
    { name: '360p', bitrate: 1000, fps: 30, width: 640, height: 360 },
  ],
})

console.log('Stream created:', stream.id, stream.streamKey, stream.playbackId)

// Upload an asset
const uploadUrl = await livepeer.requestUpload('baraza-demo.mp4')
// Then PUT your file to uploadUrl.url
const asset = await livepeer.pollAssetStatus(uploadUrl.assetId)

// Transcode with multiple profiles
const transcode = await livepeer.transcodeAsset(asset.id, {
  profiles: [
    { name: '720p', bitrate: 4000, fps: 30, width: 1280, height: 720 },
    { name: '480p', bitrate: 2000, fps: 30, width: 854, height: 480 },
  ],
})

console.log('Transcode started:', transcode.taskId)
```

## Integration Points in Baraza

### 1. Sparkz Creator Toggle
When `enableMediaGeneration` is true on a Sparkz creator:

```typescript
// In POST /api/baraza/stream/create
const livepeer = new LivepeerMedia(process.env.LIVEPEER_API_KEY!)
const stream = await livepeer.createStream({
  name: `${creatorName} Stream`,
  profiles: BARAZA_DEFAULT_PROFILES, // defined in constants
})
// Return stream.playbackId to creator dashboard
```

### 2. Asset Upload Pipeline
When creator uploads a clip to Sparkz:

```typescript
// In POST /api/baraza/upload/request
const uploadUrl = await livepeer.requestUpload(filename)
// Return uploadUrl.url to client for direct upload

// Then via webhook or polling:
// In POST /api/baraza/upload/finalize
const asset = await livepeer.pollAssetStatus(uploadUrl.assetId)
if (asset.status === 'ready') {
  // Trigger transcode if auto-transcode enabled
  await livepeer.transcodeAsset(asset.id, { profiles: [...] })
}
```

### 3. Cost Tracking
Instrument cost per operation:

```typescript
const costModel = {
  uploadGB: 0.05,
  transcodeMinute: 0.10,
  deliveryGB: 0.08,
}

const estimatedCost = (
  (fileSize / 1024 / 1024 / 1024) * costModel.uploadGB +
  (durationMinutes) * costModel.transcodeMinute
)
```

## Error Handling

The module exports error types:
- `LivepeerError` - API errors (4xx, 5xx)
- `LivepeerTimeoutError` - polling timeout (asset not ready in time)
- `LivepeerValidationError` - invalid input (missing required fields)

Always wrap calls in try/catch:

```typescript
try {
  const stream = await livepeer.createStream({ name: 'Test' })
} catch (error) {
  if (error instanceof LivepeerValidationError) {
    // Handle bad input
  } else if (error instanceof LivepeerTimeoutError) {
    // Retry or notify user
  } else {
    // Unexpected error
    logger.error('Livepeer error:', error)
  }
}
```

## Next Steps

1. **Test this module** against a real Livepeer Studio API key
2. **Integrate with Sparkz** creator config schema
3. **Add Daydream AI** generative routes (phase 2)
4. **Instrument costs** and billing reconciliation
5. **Deploy to staging** for Baraza TV testing with Aziz

## References

- [Livepeer Studio API Docs](https://docs.livepeer.studio/)
- [Livepeer SDK (npm)](https://www.npmjs.com/package/livepeer)
- [Livepeer API Reference](https://docs.livepeer.studio/reference/api)
- Parent research doc: `research/infrastructure/1782-livepeer-baraza-integration/README.md`

