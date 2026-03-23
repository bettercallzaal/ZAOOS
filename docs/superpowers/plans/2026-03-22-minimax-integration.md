# Plan: Minimax Integration for Claude Code Terminal

> **Goal:** Integrate Minimax API as an alternative LLM that can be invoked directly from Claude Code terminal within ZAO OS, allowing Claude to orchestrate Minimax for generation tasks.

**Date:** 2026-03-22  
**Effort:** 1-2 hours  
**Dependencies:** Claude Code access, Minimax API key

---

## Summary

- **What:** Add Minimax as a callable LLM from Claude Code terminal
- **Why:** Provide alternative LLM option for content generation and tasks
- **How:** Create API route + Claude Code command that forwards requests

---

## Implementation Details

### ✅ Completed
1. **Environment Variables** (in `.env.local` and `src/lib/env.ts`)
   - `MINIMAX_API_KEY` - Your Minimax API key
   - `MINIMAX_MODEL` - Model name (default: MiniMax-M2.7)
   - `MINIMAX_API_URL` - API endpoint (default: https://api.minimaxi.com/v1/text/chatcompletion_v2)

2. **API Route** (`/api/chat/minimax`)
   - Accepts messages array and optional parameters
   - Validates with Zod
   - Forwards to Minimax using ENV vars
   - Returns response or errors

3. **Claude Code Command** (`/minimax`)
   - Metadata: `.claude/commands/minimax.md`
   - Implementation: `.claude/commands/minimax.ts`
   - Usage: `/minimax "prompt"` with optional flags

---

## How to Use

1. **Add API key to `.env.local`:**
   ```
   MINIMAX_API_KEY=your_key_here
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Use in Claude Code:**
   ```
   /minimax "What is Farcaster?"
   /minimax "Explain frames" --system "You are a Farcaster expert"
   /minimax "Write a poem" --temperature 0.9 --max_tokens 100
   ```

---

## Architecture

```
Claude Code Terminal
       ↓
  /minimax command
       ↓
  .claude/commands/minimax.ts
       ↓
  POST /api/chat/minimax
       ↓
  Minimax API
       ↓
  Response to Claude Code
```

---

## Future Enhancements

- Add Minimax to the chat UI as a selectable provider
- Support streaming responses
- Add Minimax to other parts of the app (API routes, scripts)
- Add more Minimax models (abab5.5-chat, etc.)

---

## Testing Checklist

- [ ] Add MINIMAX_API_KEY to `.env.local`
- [ ] Run `npm run dev`
- [ ] Test basic prompt: `/minimax "test"`
- [ ] Test with system message
- [ ] Test with temperature/max_tokens
- [ ] Verify error handling with invalid key

---

## Related Files

- `scripts/minimax-chat.ts` - Standalone CLI script
- `src/app/api/chat/minimax/route.ts` - API route
- `.claude/commands/minimax.md` - Command metadata
- `.claude/commands/minimax.ts` - Command implementation
- `src/lib/env.ts` - Environment variables
