# AI Memory Patterns

> Source: [Google Always-On Memory Agent](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/agents/always-on-memory-agent) | [claude-mem](https://github.com/thedotmack/claude-mem)

## Two Patterns for Persistent AI Memory

### Pattern 1: Implicit Memory (Always-On Agent)
AI **automatically extracts** facts from conversations. User never says "remember this."

```
User sends message
  → Retrieve relevant memories (semantic search)
  → Inject into prompt context
  → Generate response
  → Post-response: extraction LLM identifies new facts
  → Store/merge new facts
```

### Pattern 2: Explicit Memory (claude-mem / MCP)
AI uses **tool calls** to explicitly read/write memories.

```
Tools exposed:
  remember(key, value)   → store a memory
  recall(query)          → retrieve relevant memories
  forget(key)            → delete a memory
  list_memories()        → enumerate all
```

---

## How This Applies to ZAO OS

### Music Taste Memory

Auto-extract from user behavior and conversations:

| Signal | Category | Example |
|--------|----------|---------|
| Cast content | `genre_preference` | "I love lo-fi hip hop" → `{ genre: "lo-fi hip hop" }` |
| Track shares | `artist_interest` | Shares Tyler, the Creator → `{ artist: "Tyler, the Creator" }` |
| Listening patterns | `context_preference` | Plays chill music at night → `{ context: "evening", mood: "chill" }` |
| Collect/mint | `strong_preference` | Mints a Sound.xyz drop → high-confidence artist preference |
| Skip patterns | `negative_signal` | Skips country tracks → `{ genre: "country", sentiment: "dislike" }` |

### Social Memory

Cross-user patterns unique to a social app:

```typescript
interface SocialMemory {
  userIds: string[];           // the group/pair
  sharedPreferences: Memory[]; // "both love Kendrick"
  interactionHistory: Event[]; // past shares, reactions
  groupVibe: string;           // computed from overlap
}
```

---

## Data Model

```typescript
interface UserMemory {
  userId: string;
  category: 'genre' | 'artist' | 'mood' | 'context' | 'social' | 'event';
  key: string;
  value: any;
  confidence: number;       // 0-1
  source: 'implicit' | 'explicit' | 'behavioral';
  timestamp: Date;
  decayRate: number;         // memories fade unless reinforced
  reinforcementCount: number;
}
```

### Database Schema

```sql
CREATE TABLE user_memories (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,         -- ZID
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence FLOAT DEFAULT 0.5,
  source TEXT DEFAULT 'implicit',
  embedding VECTOR(1536),        -- for semantic search (pgvector)
  reinforcement_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memories_user ON user_memories(user_id);
CREATE INDEX idx_memories_embedding ON user_memories USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE social_memories (
  id SERIAL PRIMARY KEY,
  user_ids TEXT[] NOT NULL,
  shared_key TEXT NOT NULL,
  overlap_score FLOAT,
  computed_at TIMESTAMP DEFAULT NOW()
);
```

---

## Memory API

```
POST   /api/memory/{userId}/extract     -- implicit extraction from conversation
POST   /api/memory/{userId}/remember    -- explicit memory storage
GET    /api/memory/{userId}/recall?q=   -- semantic retrieval
GET    /api/memory/{userId}/profile     -- full taste profile
DELETE /api/memory/{userId}/forget      -- remove a memory
GET    /api/memory/social/{groupId}     -- shared group memory
GET    /api/memory/{userId}/context     -- formatted context for LLM prompt injection
```

---

## Consolidation Pipeline

Run periodically (daily/weekly):

1. **Merge duplicates** — "likes jazz" + "loves Coltrane" → "jazz fan, especially Coltrane"
2. **Increase confidence** on reinforced memories (repeated signals)
3. **Decay** old unreinforced memories
4. **Compute social overlaps** — find shared preferences between friends
5. **Generate taste embeddings** — update vector representations

```typescript
// Decay formula
function applyDecay(memory: UserMemory): number {
  const daysSince = (Date.now() - memory.updatedAt.getTime()) / 86400000;
  return memory.confidence * Math.pow(1 - memory.decayRate, daysSince / 30);
}
```

---

## Memory-Augmented Recommendations

```
1. User opens app
2. Fetch: recent memories + taste profile + social context
3. Inject into AI system prompt:
   "This user loves jazz and lo-fi, has been in a chill mood this week,
    and their friend just shared a new Thundercat track"
4. AI generates contextual feed:
   - Prioritize jazz/lo-fi tracks
   - Surface friend's Thundercat share
   - Suggest similar artists
```

---

## Implementation Recommendations

| Decision | Recommendation | Reason |
|----------|---------------|--------|
| Storage | PostgreSQL + pgvector | Structured data + vector search in one store |
| Extraction | Anthropic Claude API | Best at nuanced fact extraction |
| Embeddings | OpenAI `text-embedding-3-small` or local | Fast, cheap, good quality |
| Retrieval | Semantic search + category filter | Better than keyword for music context |
| Interface | MCP server (claude-mem pattern) | Clean separation, standard protocol |
| Privacy | User can view/edit/delete memories | Transparency builds trust |

---

## Key Takeaways for ZAO OS

- **Dual approach:** Auto-extract from behavior (implicit) + tool-based storage (explicit)
- **Behavioral signals > stated preferences** — what people listen to matters more than what they say
- **Social memory is the differentiator** — "you and your friend both love X" is powerful
- **Decay keeps it fresh** — old preferences fade unless reinforced
- **Privacy-first** — users can see and control their memory
- **pgvector** for semantic retrieval without external services
