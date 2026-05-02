// Empire Builder configuration for the ZABAL empire.
//
// Three distinct addresses, confirmed from /api/empires/<token> on 2026-05-02:
//   token       = the ERC-20 base_token, used for /leaderboards?tokenAddress=
//                 and /empire-rewards/<id>
//   treasury    = the empire's treasury / on-chain reward distributor address.
//                 Returned as `empire_address` from V3 API. Used for V3
//                 endpoints that take an empire reference.
//   owner       = the personal wallet that created the empire. Surfaced in
//                 the empires endpoint `owner` field. Useful for OWNER UI
//                 badges (the wallet that ran the manual UI distributions
//                 before write API exists).

export const ZABAL_TOKEN_ADDRESS = '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07' as const;

export const ZABAL_EMPIRE_TREASURY = '0xe0faa499d6711870211505bd9ae2105206af1462' as const;

export const ZABAL_OWNER = '0x7234c36A71ec237c2Ae7698e8916e0735001E9Af' as const;

export const EMPIRE_BUILDER_BASE_URL = 'https://empirebuilder.world/api' as const;

export const EMPIRE_BUILDER_CACHE_TTL_MS = 60 * 1000;

export const EMPIRE_BUILDER_FETCH_TIMEOUT_MS = 8000;
