# 68 — Alibaba Page Agent: In-Page AI Copilot for ZAO OS

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Evaluate Page Agent as an AI copilot layer inside ZAO OS — natural language control of the app UI

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use Page Agent?** | NOT YET — interesting for Phase 2+ but adds complexity. ZAO OS needs core features shipped first. |
| **Best use case** | Admin AI copilot: "approve next 5 proposals," "ban user X," "show governance stats" |
| **Integration** | One `<script>` tag or `npm install page-agent` — zero-build option available via CDN |
| **LLM cost concern** | Every DOM action = LLM call. USE server-proxied API key, never expose to client. |
| **Security** | Agent has full DOM access = full session access. ZAO's iron-session + Supabase RLS limits damage (agent can only do what user can do), but LLM API key must be server-proxied. |
| **When to add** | After /ecosystem page ships and governance is stable. Target: Phase 3 of agent rollout. |

---

## What Page Agent Is

**Page Agent** is a JavaScript in-page GUI agent by Alibaba that enables natural language control of web interfaces. Unlike Playwright/Selenium (server-side), it runs **inside the web page itself** as client-side JS.

**Stats:** 11.3K stars, MIT license, v1.5.11 (March 18, 2026), multiple releases per week.

### How It Works

1. Inject via `<script>` tag or npm import
2. User types natural language command ("Click the login button")
3. Page Agent **dehydrates the DOM** into compressed text (no screenshots, no OCR)
4. Sends text + instruction to configured LLM
5. LLM returns action (click element #7, type into #12)
6. Agent executes with visual feedback + human-in-the-loop approval
7. Loop until task complete (max 40 steps, 400ms between steps)

**Key innovation:** Text-based DOM dehydration instead of vision/screenshots. Cheaper in tokens, faster, works with any LLM (no multimodal required).

### Supported LLMs

Works with any OpenAI-compatible API: Qwen, GPT-4, **Claude**, Gemini, DeepSeek, Mistral, Ollama (local). Free testing API available via Aliyun-hosted Qwen.

---

## ZAO OS Integration Potential

| Use Case | How | Priority |
|----------|-----|----------|
| **Admin copilot** | "Show me all pending proposals," "Ban user FID 12345" | Medium |
| **Onboarding assistant** | Guide new members through wallet connect → Farcaster auth → XMTP setup | Medium |
| **Governance shortcuts** | "Vote yes on proposal 7," "Submit a new proposal about X" | Low |
| **Accessibility** | Voice/NL navigation for the entire app | Future |
| **QA testing** | Non-dev community members write natural language test scenarios | Future |

### Integration Code (when ready)

```tsx
// In a ZAO OS layout or admin page
import { PageAgent } from 'page-agent'

const agent = new PageAgent({
  model: 'claude-sonnet-4-6',
  baseURL: '/api/page-agent-proxy', // Server-proxied, never expose key
  language: 'en-US',
})
```

---

## Comparison with Alternatives

| Tool | Runs Where | Vision? | Token Cost | Multi-page | Best For |
|------|-----------|---------|------------|-----------|----------|
| **Page Agent** | Inside page (client JS) | No (text DOM) | Low | Via extension only | In-app AI copilot |
| **Browser Use** | Server (Python) | Optional | Higher | Yes | Full autonomous agent |
| **Stagehand** | Server (TypeScript) | Playwright | Medium | Yes | Surgical automation |
| **Playwright MCP** | Server | N/A | Medium | Yes | Tool-use for LLMs |

**Page Agent wins for ZAO** when we need an in-app copilot using the user's existing auth session.

---

## Limitations

- No drag/long-click support yet
- Single-page without Chrome extension
- Shadow DOM, canvas, iframes excluded
- WebGL2 dependency (crashes if disabled)
- CSP may block inline scripts on strict enterprise sites
- Every action = LLM call (costs accumulate)
- MCP support is beta only (v1.5.11)

---

## Sources

- [Page Agent GitHub](https://github.com/alibaba/page-agent) — 11.3K stars, MIT
- [Official Docs](https://alibaba.github.io/page-agent/)
- [npm: page-agent](https://www.npmjs.com/package/page-agent)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=47264138)
- [Bloomberg: Alibaba Creates AI Tool](https://www.bloomberg.com/news/articles/2026-03-16/alibaba-creates-ai-tool-for-companies-to-ride-china-agent-craze)
- [Chrome Extension](https://chromewebstore.google.com/detail/page-agent-ext/akldabonmimlicnjlflnapfeklbfemhj)
