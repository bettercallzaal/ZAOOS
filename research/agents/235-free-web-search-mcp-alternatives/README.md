# 235 - Free Web Search MCP Alternatives for AI Agents

**Date:** 2026-04-01
**Status:** Complete
**Context:** OpenClaw agent on $5/month VPS (Docker, Node.js). Need the best FREE web search option to replace Brave Search MCP.

---

## TL;DR Recommendation

**Best free option: DuckDuckGo MCP** -- zero cost, no API key, no signup, works today.
**Best quality free option: Tavily** -- 1,000 searches/month free, excellent result quality.
**Best unlimited self-hosted: SearXNG + MCP** -- completely free forever, but needs ~200MB RAM on VPS.

---

## 1. Brave Search API

| Detail | Value |
|--------|-------|
| **Free tier** | NO free tier for new users (removed Feb 2026). $5/month credit (~1,000 queries) requires attribution. Grandfathered users keep 2,000/month. |
| **MCP package** | `@anthropic/brave-search-mcp` (official) |
| **Paid pricing** | $5 per 1,000 queries |
| **Quality** | High -- independent index, not Google-dependent |
| **Verdict** | NOT free anymore for new users. Skip. |

Sources:
- [Brave drops free tier](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/)
- [Brave API pricing](https://api-dashboard.search.brave.com/documentation/pricing)

---

## 2. Tavily

| Detail | Value |
|--------|-------|
| **Free tier** | 1,000 API credits/month, no credit card required |
| **MCP package** | `tavily-mcp` (npm) |
| **Install** | `npx -y tavily-mcp@latest` or remote URL: `https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_KEY` |
| **Tools** | `tavily-search`, `tavily-extract`, `tavily-map`, `tavily-crawl` |
| **Quality** | Excellent -- purpose-built for AI agents, returns clean structured results |
| **Setup complexity** | Very low -- just need API key from tavily.com |
| **OpenClaw compatible** | Yes -- Node.js, runs via npx or remote URL |
| **Verdict** | STRONG PICK. 1,000/month is enough for moderate agent use. Best result quality in free tier. |

Sources:
- [Tavily pricing](https://www.tavily.com/pricing)
- [Tavily MCP docs](https://docs.tavily.com/documentation/mcp)
- [tavily-mcp GitHub](https://github.com/tavily-ai/tavily-mcp)

---

## 3. SearXNG (Self-Hosted)

| Detail | Value |
|--------|-------|
| **Free tier** | 100% free forever -- self-hosted, no API keys, no limits |
| **MCP package** | `mcp-searxng` (npm) -- also on Docker Hub as `isokoliuk/mcp-searxng` |
| **Install** | `npx -y mcp-searxng` or `docker pull isokoliuk/mcp-searxng:latest` |
| **SearXNG Docker** | `docker run -d --name searxng -p 32768:8080 searxng/searxng` |
| **Tools** | `searxng_web_search` (with pagination, time filter, language, safe search), `web_url_read` (content extraction to markdown) |
| **Quality** | Good -- aggregates 70+ search engines (Google, Bing, DuckDuckGo, etc.) |
| **Setup complexity** | Medium -- need to run SearXNG Docker container + MCP server |
| **RAM usage** | ~150-250MB for SearXNG container |
| **OpenClaw compatible** | Yes -- both are Docker containers, can run on same VPS |
| **Verdict** | BEST for unlimited free searches. Trade-off: uses RAM on your $5 VPS. |

Docker Compose for both SearXNG + MCP:
```yaml
services:
  searxng:
    image: searxng/searxng:latest
    ports:
      - "32768:8080"
    restart: unless-stopped
  mcp-searxng:
    image: isokoliuk/mcp-searxng:latest
    environment:
      - SEARXNG_URL=http://searxng:8080
```

Sources:
- [mcp-searxng GitHub](https://github.com/ihor-sokoliuk/mcp-searxng)
- [searxng-docker-for-mcp](https://github.com/janhq/searxng-docker-for-mcp)
- [SearXNG installation guide](https://dasroot.net/posts/2026/03/self-hosted-search-searxng-installation-configuration/)

---

## 4. DuckDuckGo MCP

| Detail | Value |
|--------|-------|
| **Free tier** | 100% free, no API key, no signup, no limits (aside from rate limiting) |
| **MCP package** | `duckduckgo-mcp-server` (Python/PyPI) |
| **Install** | `uvx duckduckgo-mcp-server` or `uv pip install duckduckgo-mcp-server` |
| **Tools** | Web search (30 req/min), content fetching (20 req/min) |
| **Quality** | Decent -- DuckDuckGo results, not as deep as Google/Brave |
| **Setup complexity** | Very low -- no API key needed at all |
| **OpenClaw compatible** | Yes -- Python, runs via uvx |
| **Caveat** | Uses DuckDuckGo HTML scraping (not official API). Could break if DDG changes HTML. Rate limited to 30 searches/min. |
| **Verdict** | EASIEST free option. Zero config. Good enough for most agent tasks. |

Alternative implementations:
- `Nipurn123/duckduckgo-mcp` -- claims "free unlimited" with CAPTCHA bypass
- `nickclyde/duckduckgo-mcp-server` -- most popular, well-maintained

Sources:
- [duckduckgo-mcp-server GitHub](https://github.com/nickclyde/duckduckgo-mcp-server)
- [DuckDuckGo MCP on PulseMCP](https://www.pulsemcp.com/servers/nickclyde-duckduckgo-search)

---

## 5. Serper.dev

| Detail | Value |
|--------|-------|
| **Free tier** | 2,500 one-time free queries (not monthly -- once they're gone, they're gone) |
| **Paid pricing** | $50 for 50K credits (valid 6 months) = $1/1K queries |
| **MCP package** | Community MCP servers exist, no official one |
| **Quality** | Excellent -- actual Google Search results |
| **Setup complexity** | Low -- API key from serper.dev |
| **OpenClaw compatible** | Yes |
| **Verdict** | Good for bootstrapping. 2,500 free queries last a while. Google-quality results. |

Sources:
- [Serper.dev](https://serper.dev/)
- [Serper alternatives comparison](https://www.buildmvpfast.com/alternatives/serper)

---

## 6. Exa.ai

| Detail | Value |
|--------|-------|
| **Free tier** | 1,000 credits (some sources say 2,000). One-time, no expiration. |
| **Paid pricing** | $7/1K requests (includes 10 results per search with content) |
| **MCP package** | Official `exa-mcp-server` exists |
| **Quality** | Excellent -- AI-native semantic search, best for finding specific content |
| **Setup complexity** | Low -- API key from exa.ai |
| **OpenClaw compatible** | Yes |
| **Verdict** | Small free bucket, great quality. Better for targeted research than general browsing. |

Sources:
- [Exa pricing](https://exa.ai/pricing)
- [Exa pricing update](https://exa.ai/docs/changelog/pricing-update)

---

## 7. Google Custom Search (Programmable Search Engine)

| Detail | Value |
|--------|-------|
| **Free tier** | 100 queries/day free (~3,000/month) |
| **Paid pricing** | $5 per 1,000 queries above free tier |
| **MCP package** | No official MCP server |
| **Quality** | Google-quality results |
| **CRITICAL WARNING** | NOT available to new customers. Existing customers have until Jan 1, 2027 before it shuts down. |
| **Verdict** | SKIP -- being deprecated. Don't build on this. |

Sources:
- [Google Custom Search API](https://developers.google.com/custom-search/v1/overview)
- [Google API limits](https://blog.expertrec.com/google-custom-search-api-daily-limit/)

---

## 8. Perplexity API

| Detail | Value |
|--------|-------|
| **Free tier** | NO free tier. Pay-as-you-go only. Pro subscribers get $5/month credit. |
| **Paid pricing** | Token-based, ~$1-3 per 1M input tokens |
| **MCP package** | Community servers exist |
| **Quality** | Excellent -- best for synthesized answers with citations |
| **Verdict** | SKIP for free use. No free tier for API. |

Sources:
- [Perplexity API pricing](https://docs.perplexity.ai/docs/getting-started/pricing)
- [Perplexity pricing breakdown](https://www.getaiperks.com/en/articles/perplexity-pricing)

---

## 9. Jina AI Reader

| Detail | Value |
|--------|-------|
| **Free tier** | 10 million token credits free. 500 req/min (read), 100 req/min (search). No API key needed for basic use. |
| **MCP package** | Official `jina-ai/MCP` (remote MCP server) |
| **Install** | Prepend `https://r.jina.ai/` to any URL for free content extraction. MCP: `npx` or remote server. |
| **Tools** | URL-to-markdown, web search, image search, embeddings, reranker |
| **Quality** | Excellent for content extraction. Search is decent. |
| **Setup complexity** | Very low -- works without API key |
| **OpenClaw compatible** | Yes |
| **Verdict** | STRONG complementary tool. Amazing for reading/extracting web content. Pair with DDG or Tavily for search. |

Sources:
- [Jina AI Reader](https://jina.ai/reader/)
- [Jina MCP GitHub](https://github.com/jina-ai/MCP)

---

## Comparison Matrix

| Option | Cost | Monthly Limit | API Key? | MCP Package | Quality | VPS Friendly | Recommended |
|--------|------|---------------|----------|-------------|---------|--------------|-------------|
| **DuckDuckGo** | FREE | Unlimited* | No | `duckduckgo-mcp-server` (Python) | Good | Yes | **YES** |
| **Tavily** | FREE | 1,000/month | Yes | `tavily-mcp` (Node) | Excellent | Yes | **YES** |
| **SearXNG** | FREE | Unlimited | No | `mcp-searxng` (Node/Docker) | Good+ | ~200MB RAM | **YES** |
| **Jina Reader** | FREE | 10M tokens | Optional | `jina-ai/MCP` | Excellent (extraction) | Yes | **YES (complement)** |
| **Serper.dev** | FREE | 2,500 one-time | Yes | Community | Excellent | Yes | Maybe |
| **Exa.ai** | FREE | 1,000 one-time | Yes | `exa-mcp-server` | Excellent | Yes | Maybe |
| **Brave Search** | $5/mo | ~1,000/month | Yes | Official | High | Yes | No |
| **Google CSE** | FREE | 100/day | Yes | None | Excellent | Yes | No (deprecated) |
| **Perplexity** | Paid | Pay-as-you-go | Yes | Community | Excellent | Yes | No |

*DuckDuckGo rate limited to 30 searches/min, but no monthly cap.

---

## Recommended Setup for OpenClaw on $5 VPS

### Option A: Zero-Cost Minimal (Recommended to start)
```
DuckDuckGo MCP (search) + Jina Reader (content extraction)
```
- Total cost: $0/month
- No API keys needed
- No extra containers
- Works immediately

### Option B: Best Quality Free
```
Tavily (search, 1,000/month) + Jina Reader (content extraction)
```
- Total cost: $0/month
- Needs Tavily API key (free signup)
- Best result quality in free tier
- 1,000 searches/month should be plenty for an agent

### Option C: Unlimited Self-Hosted
```
SearXNG + mcp-searxng (search) + Jina Reader (content extraction)
```
- Total cost: $0/month
- No API keys
- Unlimited searches
- Trade-off: ~200MB extra RAM on VPS
- Aggregates 70+ search engines

### Option D: Hybrid (Best of all worlds)
```
Tavily (primary, 1,000/month) + DuckDuckGo (overflow) + Jina Reader (extraction)
```
- Total cost: $0/month
- Use Tavily for important searches (better quality)
- Fall back to DuckDuckGo when Tavily credits run low
- Jina for reading/extracting specific pages

---

## Quick Setup for OpenClaw

### DuckDuckGo MCP (Python)
```json
{
  "mcpServers": {
    "duckduckgo": {
      "command": "uvx",
      "args": ["duckduckgo-mcp-server"]
    }
  }
}
```

### Tavily MCP (Node.js)
```json
{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": {
        "TAVILY_API_KEY": "tvly-xxxxxxxxxxxxx"
      }
    }
  }
}
```

### SearXNG + MCP (Docker)
```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "mcp-searxng"],
      "env": {
        "SEARXNG_URL": "http://localhost:32768"
      }
    }
  }
}
```
(Requires SearXNG container running: `docker run -d -p 32768:8080 searxng/searxng`)

### Jina AI Reader (Node.js, no key needed)
```json
{
  "mcpServers": {
    "jina": {
      "command": "npx",
      "args": ["-y", "@jina-ai/mcp"]
    }
  }
}
```
