// Empire Builder configuration for the ZABAL empire.
//
// ZABAL token (base_token): launched via Clanker on Base (doc 361).
// Empire address: the treasury / profile address used in empirebuilder.world URLs.
// These two addresses are distinct. The leaderboard discovery endpoint takes
// `tokenAddress` (base token); the empires endpoint takes `empire_id` which can be
// either the base token or the empire address depending on context. Code defensively.

export const ZABAL_TOKEN_ADDRESS = '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07' as const;

export const ZABAL_EMPIRE_ADDRESS = '0x7234c36A71ec237c2Ae7698e8916e0735001E9Af' as const;

export const EMPIRE_BUILDER_BASE_URL = 'https://empirebuilder.world/api' as const;

export const EMPIRE_BUILDER_CACHE_TTL_MS = 60 * 1000;

export const EMPIRE_BUILDER_FETCH_TIMEOUT_MS = 8000;
