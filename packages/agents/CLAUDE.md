# @zaoos/agents

Autonomous ZABAL trading agents (VAULT, BANKER, DEALER) on Base chain.

## Commands
```bash
npx vitest run src/lib/agents   # test
npx biome check src/lib/agents  # lint
```

## Key Files
- `runner.ts` - shared buy/burn/stake/post logic
- `wallet.ts` - Privy TEE signing with auth recovery
- `swap.ts` - 0x Swap API (10s timeout, throws on failure)
- `types.ts` - TOKENS, BURN_ADDRESS, ZABAL_STAKING_CONTRACT

## Boundaries
- ALWAYS: validate swap quotes, check daily budget, log events
- ASK FIRST: trade amounts, burn percentage, staking params
- NEVER: expose Privy wallet IDs, skip budget checks, hardcode prices
