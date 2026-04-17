# @zaoos/publish

Cross-platform content publishing. Farcaster, X, Bluesky, Telegram, Discord, Lens, Hive.

## Commands
```bash
npx vitest run src/lib/publish   # test
npx biome check src/lib/publish  # lint
```

## Key Files
- `normalize.ts` - content normalization per platform (char limits, mentions, links)
- `broadcast.ts` - publish to multiple platforms in parallel
- `auto-cast.ts` - automated Farcaster posting for proposals

## Boundaries
- ALWAYS: normalize content per platform limits, handle rate limits
- ASK FIRST: adding new platforms, changing post format
- NEVER: post without content validation, expose API keys in responses
