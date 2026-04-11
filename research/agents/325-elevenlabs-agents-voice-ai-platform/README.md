# 325 - ElevenLabs Agents: Voice AI Platform for ZAO OS

> **Status:** Research complete
> **Date:** 2026-04-11
> **Goal:** Deep dive into ElevenLabs Agents (formerly Conversational AI) for building a voice agent with Zaal's Professional Voice Clone for The ZAO community
> **Related:** [Doc 323 - ElevenLabs API Full Capabilities](../../music/323-elevenlabs-api-full-capabilities/)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Agent platform | USE ElevenAgents - mature platform, sub-100ms TTS latency, full SDK for React/Next.js |
| Voice clone as agent voice | YES - Professional Voice Clone works directly as agent voice. Just select "Bettercallzaal" in agent config |
| LLM backend | USE Claude 3.5/3.7 Sonnet (supported natively) or custom LLM via OpenAI-compatible API |
| Knowledge base | USE RAG - upload ZAO docs, FAQ, member info. 20MB limit on Creator plan, ~500ms added latency |
| Deployment | USE React SDK (`@elevenlabs/react`) embedded in ZAO OS + signed URL auth for gated access |
| Spaces integration | POSSIBLE via Stream Video SDK's Vision Agents framework + ElevenLabs TTS plugin |
| Phone number | DEFER - SIP trunking available but not needed for community use case |
| Music playback | NOT YET - Music API integration with Agents "coming soon" per ElevenLabs |

---

## 1. ElevenAgents Architecture

### Pipeline Flow

```
User speaks -> ASR (Speech-to-Text) -> LLM (reasoning + tools) -> TTS (voice synthesis) -> User hears
```

Four coordinated components:

1. **Speech Recognition (ASR)** - Fine-tuned STT model, ~150ms real-time latency
2. **Language Model (LLM)** - Your choice of GPT-4o, Claude 3.7 Sonnet, Gemini 2.5 Flash, or custom
3. **Text-to-Speech (TTS)** - Flash v2.5 at ~75ms latency, 5,000+ voices, 70+ languages
4. **Turn-Taking Model** - Proprietary model that analyzes conversational cues ("um", "ah"), knows when to interrupt vs wait

### Supported LLMs (Built-in)

| Provider | Models |
|----------|--------|
| Anthropic | Claude 3.7 Sonnet, Claude 3.5 Sonnet v1/v2, Claude 3 Haiku |
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo |
| Google | Gemini 2.5 Flash, Gemini 2.0 Flash/Lite, Gemini 1.5 Pro/Flash |
| Custom | Any OpenAI-compatible API (Llama, DeepSeek, etc. via Groq/Together/Cloudflare) |

**LLM Cascading:** Agents can fall back through a sequence of models if one is unavailable. Default cascade: Gemini 2.5 Flash -> Gemini 2.0 Flash -> Claude 3.7 Sonnet -> GPT-4o.

### Multimodal (Conversational AI 2.0)

Agents can handle voice, text, or both simultaneously. Define once, deploy as voice-only, voice+text, or chat-only. Users can switch mid-conversation (e.g., speak a question, type an email address).

---

## 2. Professional Voice Clone as Agent Voice

**YES, this works.** After cloning your voice, you simply select it as the agent's voice in the dashboard or via API.

### Zaal's Setup (from Doc 323)

| Asset | Detail |
|-------|--------|
| Voice Clone | "Bettercallzaal" - Professional Voice Clone |
| Training Data | 1 hour 21 minutes (8 audio files, 842.9 MB) |
| Quality Tier | "Better" (Good=30min, Better=1hr, Best=2hr) |
| Language | English / American |
| Account | On Logesh's workspace (logesh@songam.space) |

### Voice Models for Agents

| Model | Latency | Languages | Best For |
|-------|---------|-----------|----------|
| Flash v2.5 | ~75ms | 32 languages | Real-time conversation (recommended) |
| Multilingual v2 | Higher | 29 languages | Premium quality, polished output |
| v3 | Not real-time | 70+ languages | Expressive/emotional (NOT for agents) |

**Recommendation:** Use Flash v2.5 for the agent voice to keep latency low. The Professional Voice Clone works with all models.

---

## 3. Custom Tools / Webhooks - Connecting to ZAO OS Backend

### Tool Types

1. **Server Tools (Webhooks)** - Call your Next.js API routes during conversation
2. **Client Tools** - Execute JavaScript in the user's browser (React component updates)
3. **MCP Tools** - Model Context Protocol servers providing tools and resources
4. **System Tools** - Built-in: end call, language detection, agent transfer, transfer to number, skip turn, voicemail detection, DTMF tones

### Server Tools (Webhook) Configuration

Connect your ZAO OS API routes as agent tools:

- **HTTP Methods:** GET, POST, PUT, PATCH
- **URL:** Your API endpoint (e.g., `https://zaoos.com/api/members/lookup`)
- **Parameters:** Path, query, and body params - generated dynamically by the LLM based on conversation
- **Content Types:** `application/json` or `application/x-www-form-urlencoded`
- **Auth Methods:** OAuth2 Client Credentials, OAuth2 JWT, Basic Auth, Bearer Token, Custom Headers

### Example ZAO OS Tools to Build

```
Tool: "lookup_member"
URL: POST https://zaoos.com/api/agent/member-lookup
Body: { "name": "{name}" }  // LLM fills from conversation
Response: member profile, respect score, role

Tool: "get_upcoming_events"
URL: GET https://zaoos.com/api/agent/events
Response: next fractal meeting, COC Concertz, ZAO Stock date

Tool: "check_respect_balance"
URL: POST https://zaoos.com/api/agent/respect
Body: { "fid": "{farcaster_id}" }
Response: OG Respect, ZOR Respect, total

Tool: "get_now_playing"
URL: GET https://zaoos.com/api/agent/now-playing
Response: current track, queue, who submitted it
```

### Client Tools (Browser-Side)

Register tools that run in the user's React app:

```tsx
clientTools: {
  navigate_to_page: (params: { page: string }) => {
    router.push(params.page);
    return 'Navigated to ' + params.page;
  },
  show_member_profile: (params: { fid: number }) => {
    openProfileDrawer(params.fid);
    return 'Profile opened';
  },
}
```

### Post-Call Webhooks

Trigger workflows after a call ends - log conversation to Supabase, update member engagement metrics, send follow-up messages.

---

## 4. Knowledge Base / RAG

### How It Works

1. Upload documents to the agent's knowledge base
2. Documents are automatically indexed (embedding model: e5_mistral_7b_instruct)
3. During conversation, user query is reformulated for optimal retrieval
4. Semantic search finds relevant chunks
5. Retrieved context is injected into the LLM prompt
6. Agent responds with grounded, source-backed answers

### Storage Limits by Plan

| Plan | Limit |
|------|-------|
| Free | 1 MB |
| Starter | 2 MB |
| **Creator** | **20 MB** |
| Pro | 100 MB |
| Scale | 500 MB |

### What to Upload for ZAO Agent

| Document | Contents | Priority |
|----------|----------|----------|
| ZAO Complete Guide | Doc 050 - mission, pillars, membership, culture | P0 |
| ZAO Whitepaper | Doc 051 - Draft 4.5, tokenomics, governance | P0 |
| Member Directory | Names, roles, FIDs, specialties | P0 |
| FAQ | Common questions about joining, Respect, events | P0 |
| Event Calendar | COC Concertz, ZAO Stock, fractal meetings | P1 |
| Governance Rules | How proposals work, voting thresholds, Respect weights | P1 |
| Music Player Guide | How to submit songs, queue system, curation | P2 |

### Performance Notes

- RAG adds ~500ms latency per response
- Documents < 500 bytes go into prompt directly (no RAG needed)
- Can configure max chunks retrieved and vector distance thresholds
- Test thoroughly after adding docs - too much context can hurt quality

---

## 5. Deployment Options

### Option A: React SDK Embed (Recommended for ZAO OS)

```bash
npm install @elevenlabs/react
```

```tsx
// src/components/agent/ZaoVoiceAgent.tsx
'use client';

import { ConversationProvider, useConversation } from '@elevenlabs/react';

function AgentUI() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected to Zaal agent'),
    onMessage: (msg) => console.log('Message:', msg),
    onError: (err) => console.error('Agent error:', err),
  });

  const startConversation = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    // Use signed URL for gated access
    const res = await fetch('/api/agent/signed-url');
    const { signedUrl } = await res.json();
    await conversation.startSession({ signedUrl });
  };

  return (
    <div>
      <button onClick={startConversation}>Talk to Zaal AI</button>
      <p>Status: {conversation.status}</p>
      <p>{conversation.isSpeaking ? 'Speaking...' : 'Listening...'}</p>
    </div>
  );
}

// API route for signed URL (keeps API key server-side)
// src/app/api/agent/signed-url/route.ts
export async function GET() {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
    { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! } }
  );
  const data = await response.json();
  return NextResponse.json({ signedUrl: data.signed_url });
}
```

### Option B: Widget Embed (Quick & Dirty)

Paste a `<script>` tag + custom element. No React code needed. But:
- Requires public agent (no auth)
- Limited styling control
- Not gated to ZAO members

### Option C: Phone Number (SIP Trunk)

- Buy a number or connect existing via Twilio, Telnyx, Plivo
- Agent answers calls automatically
- Supports outbound calling and batch calls
- Audio codecs: G711 8kHz or G722 16kHz
- **Use case:** "Call the ZAO hotline to talk to Zaal AI" - cool but not priority

### Option D: API-Only (WebSocket/WebRTC)

- Full control, build completely custom UI
- WebRTC for voice (best echo cancellation), WebSocket for text-only
- Connection type auto-detected based on mode

### Recommended Approach for ZAO OS

1. Create agent in ElevenLabs dashboard with Bettercallzaal voice
2. Add knowledge base (ZAO docs, FAQ, member info)
3. Configure server tools pointing to ZAO OS API routes
4. Use React SDK with signed URL auth (gated behind ZAO membership)
5. Deploy as a component in the ZAO OS sidebar or dedicated page

---

## 6. Can an Agent Join a Voice Call / Spaces Room?

**Yes, with engineering work.** Two paths:

### Path A: Stream Video SDK + Vision Agents (Best Fit for ZAO OS)

ZAO OS already uses Stream Video SDK for Spaces. Stream has an official ElevenLabs TTS integration via the Vision Agents framework:

```python
# Vision Agents framework (Python server-side)
from vision_agents import Agent
from vision_agents.plugins import elevenlabs

tts = elevenlabs.TTS(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
    voice_id="BETTERCALLZAAL_VOICE_ID",
    model_id="eleven_multilingual_v2"
)

agent = Agent(tts=tts, llm=your_llm, stt=your_stt)
call = await agent.create_call("audio_room", "zao-spaces-room-id")

async with agent.join(call):
    @agent.subscribe("participant_joined")
    async def greet(event):
        await agent.say("Welcome to the ZAO Spaces room!")
    
    await agent.simple_response("Be a helpful co-host...")
```

**Limitation:** Vision Agents is Python-based. Would need a separate Python service or serverless function alongside the Next.js app.

### Path B: LiveKit + ElevenLabs Plugin

LiveKit has `livekit-plugins-elevenlabs` for TTS. Since Stream uses LiveKit internally for WebRTC, there may be a bridge. Less direct than Path A.

### Path C: Raw WebRTC Audio Piping

Use ElevenLabs WebRTC conversation output and pipe audio into a Stream call participant. Most complex, most flexible.

**Bottom line:** An agent CAN join Spaces rooms as a participant using Zaal's voice. Path A (Vision Agents) is the most direct since ZAO OS already uses Stream.

---

## 7. Pricing (Creator Plan)

### Monthly Cost Breakdown

| Item | Included | Overage |
|------|----------|---------|
| Plan | $22/month ($11/mo on annual) | - |
| Conversational AI | 250 minutes/month | $0.12/minute |
| TTS Characters | 100,000 chars/month | ~$0.30/1k chars |
| Dubbing | 50 minutes/month | $0.60/minute |
| Transcription | Per usage | $0.40/hour |

### Cost Estimate for ZAO (188 members)

Assuming ~50% of members try the agent, average 3-minute conversation:

- 94 members x 3 min = 282 minutes/month
- 250 included + 32 overage = $22 base + $3.84 overage = **~$26/month**
- Add LLM costs (10-30% markup): **~$29-34/month total**

If usage is lighter (20% of members, 2 min avg):
- 38 x 2 = 76 minutes - well within the 250 included
- **$22/month flat**

### LLM Cost Note

ElevenLabs passes through LLM costs. Using Claude 3.5 Sonnet or GPT-4o Mini keeps this low. Gemini 2.0 Flash is cheapest.

---

## 8. Latency

### End-to-End Pipeline

| Stage | Latency |
|-------|---------|
| Speech-to-Text (ASR) | ~150ms |
| LLM reasoning | 200-500ms (model dependent) |
| Text-to-Speech (Flash v2.5) | ~75ms |
| Network overhead | 50-100ms |
| **Total round-trip** | **~475-825ms** |

### Optimization Tips

- Use Flash v2.5 (not v3) for TTS - 75ms vs seconds
- Use Gemini 2.5 Flash or GPT-4o Mini for fastest LLM response
- RAG adds ~500ms - keep knowledge base focused
- WebRTC mode has better echo cancellation than WebSocket
- Minimize tool calls per turn (each adds network round-trip)
- Keep system prompt concise

### Real-World Feel

Sub-second response time feels natural in conversation. The turn-taking model handles "um"s and pauses intelligently, so the agent doesn't cut people off.

---

## 9. Music Playback During Conversation

**Not natively supported yet.** The Music API integration with Agents Platform is "coming soon" per ElevenLabs.

### Workarounds

1. **Client tool approach:** Agent triggers a client-side tool that plays audio in the browser
   ```tsx
   clientTools: {
     play_song: (params: { trackUrl: string }) => {
       audioPlayer.play(params.trackUrl);
       return 'Playing track';
     }
   }
   ```

2. **Recommendation via text:** Agent recommends songs, user clicks to play in ZAO OS player

3. **TTS song intro:** Agent speaks "Here's a song by [artist]..." then triggers playback via client tool

**Future:** When ElevenLabs ships Music API + Agents integration, the agent could generate and play AI music mid-conversation using Zaal's cloned singing voice.

---

## 10. Multi-Language Support

**Full support.** The Professional Voice Clone maintains Zaal's vocal characteristics across all supported languages.

- Flash v2.5: 32 languages at 75ms latency
- Multilingual v2: 29 languages, premium quality
- Automatic language detection: agent detects what language the user speaks and responds in kind

### Languages Include

English, Spanish, French, German, Japanese, Chinese, Korean, Portuguese, Italian, Arabic, Russian, Hindi, Indonesian, Dutch, Turkish, Polish, and 15+ more.

### ZAO Use Case

A Spanish-speaking member could talk to the agent in Spanish and hear Zaal's voice responding in Spanish - same vocal characteristics, different language. Powerful for global community building.

---

## 11. SDK Options

### JavaScript / TypeScript

| Package | Use Case |
|---------|----------|
| `@elevenlabs/react` | React/Next.js apps (hooks + provider) |
| `@elevenlabs/client` | Vanilla JS/TS, base for frameworks |
| React Native SDK | iOS/Android mobile apps |

### Python

| Package | Use Case |
|---------|----------|
| `elevenlabs` (pip) | Server-side agent, scripts, bots |
| `elevenlabs[pyaudio]` | Real-time audio I/O |

### Native Mobile

| SDK | Platform |
|-----|----------|
| Swift SDK | iOS |
| Kotlin SDK | Android |

### React SDK Key Components

```tsx
// Provider (wrap your app)
<ConversationProvider onConnect={} onError={} serverLocation="us">

// Hooks (use in components)
useConversation()           // All-in-one (re-renders on any change)
useConversationControls()   // Actions only (no re-renders)
useConversationStatus()     // Connection status + messages
useConversationMode()       // Speaking/listening state
useConversationInput()      // Mute controls

// Dynamic tool registration
useConversationClientTool('toolName', handler)
```

### Key Features

- WebRTC-based audio streaming (low latency, echo cancellation)
- Event-driven lifecycle (onConnect, onDisconnect, onMessage, onError, onModeChange, onVadScore)
- Audio visualization (getInputVolume, getOutputVolume, frequency data)
- Device switching mid-conversation
- Controlled mute state
- Text-only mode (skips mic permissions)
- Conversation overrides at runtime (change prompt, voice, language)

---

## 12. Real Examples of Creator/Community Voice Agents

### Notable Deployments

- **Deutsche Telekom** - 24/7 customer support agents handling large call volumes
- **Klarna** - Agentic support at scale
- **Chess.com** - Voice agents for player interaction
- **Meta** - Voice AI integration
- **TrueCrime AI** - Simulate guest speakers, re-enact testimonials with emotion
- **Indie authors** - AI narrators for audiobooks with expressive voices
- **Language learning apps** - Interactive dialogues with varying accents

### Platform Scale (as of Feb 2026)

- $500M Series D at $11B valuation
- $330M ARR, 175% YoY growth
- 41% of Fortune 500 as customers
- 1M+ hours of AI-generated audio
- 250,000+ agents built on the platform

### Teaching Assistant Example

One creator cloned their voice and built an AI teaching assistant that:
- Speaks in the creator's voice
- Answers student questions from a knowledge base
- Runs 24/7 without the creator being present
- Students reported it felt like talking to the actual teacher

This is the exact pattern for ZAO - Zaal's voice answering community questions 24/7.

---

## 13. Existing Agents on the Account

Six agents are already configured on the ElevenLabs account (logesh@songam.space):

| Agent | Likely Purpose |
|-------|----------------|
| **bettercallzaal** | Zaal's personal agent / demo |
| **Farcaster** | Farcaster-aware agent for social interactions |
| **Buddo** | Unknown - possibly a pet/companion agent |
| **Songam Host** | Music hosting agent for Songam platform |
| **Pet App** | Pet-related application agent |
| **ADAM** | Unknown - possibly an admin or assistant agent |

### What We Can Learn

- The account already has multiple agents configured, so the workflow is proven
- "Farcaster" agent suggests social-media-aware agents are already being explored
- "Songam Host" is closest to the ZAO use case (music community hosting)
- We should review each agent's system prompt, tools, and knowledge base to understand what works

### Action Items

1. Log into ElevenLabs dashboard and review each agent's configuration
2. Check which voice each uses (likely Bettercallzaal for most)
3. Review system prompts for reusable patterns
4. Check if any have tools configured that we can adapt
5. Consider consolidating into a single "ZAO Agent" with the best patterns from each

---

## Implementation Plan for ZAO OS

### Phase 1: Basic Voice Agent (1-2 days)

1. Create new agent "ZAO Guide" in dashboard
2. Select Bettercallzaal voice + Flash v2.5 model
3. Choose Claude 3.5 Sonnet as LLM
4. Write system prompt (ZAO mission, personality, boundaries)
5. Upload knowledge base (ZAO Complete Guide, FAQ)
6. Test in dashboard
7. Add React SDK to ZAO OS (`@elevenlabs/react`)
8. Build `ZaoVoiceAgent` component with signed URL auth
9. Gate behind membership check
10. Deploy

### Phase 2: Tool Integration (2-3 days)

1. Build API routes: `/api/agent/member-lookup`, `/api/agent/events`, `/api/agent/respect`
2. Configure as server tools in ElevenLabs dashboard
3. Add client tools: navigate, open profile, play song
4. Test tool calling with various conversation scenarios

### Phase 3: Spaces Integration (1 week)

1. Set up Vision Agents Python service
2. Configure ElevenLabs TTS with Bettercallzaal voice
3. Connect to Stream Video SDK rooms
4. Implement agent join/leave for Spaces rooms
5. Add greeting, co-hosting, and Q&A capabilities

### Env Vars Needed

```bash
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_AGENT_ID=agent_...
ELEVENLABS_VOICE_ID=...  # Bettercallzaal voice ID
```

---

## Sources

- [ElevenAgents Overview](https://elevenlabs.io/docs/eleven-agents/overview)
- [ElevenLabs Agents Platform](https://elevenlabs.io/agents)
- [React SDK Documentation](https://elevenlabs.io/docs/eleven-agents/libraries/react)
- [Server Tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/server-tools)
- [Knowledge Base / RAG](https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/rag)
- [Custom LLM Integration](https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm)
- [Next.js Quickstart](https://elevenlabs.io/docs/eleven-agents/guides/quickstarts/next-js)
- [Widget Customization](https://elevenlabs.io/docs/agents-platform/customization/widget)
- [SIP Trunking](https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-trunking)
- [Conversational AI 2.0 Announcement](https://elevenlabs.io/blog/conversational-ai-2-0)
- [Multimodal Conversational AI](https://elevenlabs.io/blog/introducing-multimodal-conversational-ai)
- [WebRTC Support](https://elevenlabs.io/blog/conversational-ai-webrtc)
- [Claude 3.7 Sonnet Integration](https://elevenlabs.io/blog/introducing-claude-37-sonnet-in-elevenlabs-conversational-ai)
- [Stream + ElevenLabs Integration](https://getstream.io/blog/elevenlabs-tts-vision-integration/)
- [Professional Voice Cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [Pricing Breakdown (Flexprice)](https://flexprice.io/blog/elevenlabs-pricing-breakdown)
- [Pricing Review (Cekura)](https://www.cekura.ai/blogs/elevenlabs-pricing)
- [ElevenLabs Complete Guide 2026 (Medium)](https://medium.com/the-ai-entrepreneurs/elevenlabs-in-2026-the-complete-guide-to-v3-agents-music-and-scribe-7f3c3bdfd201)
- [Latency Optimization](https://elevenlabs.io/docs/best-practices/latency-optimization)
- [Voice Cloning Deep Dive](https://elevenlabs.io/blog/voice-cloning-deep-dive)
- [Python SDK](https://elevenlabs.io/docs/eleven-agents/libraries/python)
- [LiveKit ElevenLabs Plugin](https://docs.livekit.io/agents/integrations/elevenlabs/)
- [Developer Trends 2026](https://elevenlabs.io/blog/voice-agents-and-conversational-ai-new-developer-trends-2025)
