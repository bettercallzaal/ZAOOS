# Attack Surface Map — ZAO OS

## Entry Points

### Authentication (Critical)
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/auth/verify` | GET | None | Nonce generation |
| `/api/auth/verify` | POST | None | SIWF signature verification → session |
| `/api/auth/siwe` | GET | None | Nonce generation |
| `/api/auth/siwe` | POST | None | SIWE signature verification → session |
| `/api/auth/register` | POST | None | New FID registration (allowlist gated) |
| `/api/auth/session` | GET | Session | Returns session data |
| `/api/auth/logout` | POST | Session | Destroys session |
| `/api/auth/signer` | POST | Session | Creates Neynar managed signer |
| `/api/auth/signer/status` | GET | Session | Polls signer approval status |
| `/api/auth/signer/save` | POST | Session | Saves approved signer to session |
| `/api/miniapp/auth` | GET | Bearer JWT | QuickAuth mini app login |

### Webhooks (High — External Callers)
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/webhooks/neynar` | POST | HMAC-SHA512 | Cast ingestion — verified |
| `/api/miniapp/webhook` | POST | None (shape + FID check) | Notification token management — **unverified** |

### Chat (High — User-Generated Content)
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/chat/send` | POST | Session + Signer | Post Farcaster cast |
| `/api/chat/messages` | GET | Session | Fetch channel feed |
| `/api/chat/search` | GET | Session | Search casts |
| `/api/chat/react` | POST/DELETE | Session + Signer | Like/recast |
| `/api/chat/hide` | POST | Admin | Hide message |
| `/api/chat/thread/[hash]` | GET | Session | Fetch thread |
| `/api/chat/schedule` | GET/POST/DELETE/PATCH | Session + Signer | Scheduled casts |

### Governance (High — State-Changing)
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/proposals` | GET/POST/PATCH | Session (PATCH: Admin) | Proposal CRUD |
| `/api/proposals/vote` | POST | Session | Vote with on-chain weight |
| `/api/proposals/comment` | GET/POST | Session | Proposal comments |

### Admin (Critical — Privileged)
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/admin/allowlist` | GET/POST/DELETE | Admin | Manage allowlist |
| `/api/admin/users` | GET/POST/PATCH/DELETE | Admin | Full user CRUD |
| `/api/admin/users/import` | POST | Admin | Bulk import from allowlist |
| `/api/admin/upload` | POST | Admin | CSV file upload |
| `/api/admin/backfill` | POST | Admin | Neynar batch lookup |
| `/api/admin/hidden` | GET | Admin | View hidden messages |
| `/api/admin/search-users` | GET | Admin | Farcaster user search |
| `/api/admin/respect-import` | POST | Admin | Airtable data import |

### User Data
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/users/[fid]` | GET | Session | User profile (any FID) |
| `/api/users/profile` | GET/PATCH | Session | Own profile CRUD |
| `/api/users/follow` | POST/DELETE | Session + Signer | Follow/unfollow |
| `/api/users/wallet` | GET | Session | Own wallet addresses |
| `/api/users/xmtp-address` | POST | Session | Save XMTP address |
| `/api/users/messaging-prefs` | GET/PATCH | Session | Messaging preferences |
| `/api/users/[fid]/followers` | GET | Session | Follower list |
| `/api/users/[fid]/following` | GET | Session | Following list |
| `/api/search/users` | GET | Session | User search |

### Other
| Endpoint | Method | Auth | Risk |
|----------|--------|------|------|
| `/api/upload` | POST | Session | Image upload (5MB max) |
| `/api/notifications` | GET/PATCH | Session | Notification management |
| `/api/members` | GET | Session | Member list |
| `/api/following/online` | GET | Session | Online following |
| `/api/respect/*` | GET/POST | Session/Admin | Respect data |
| `/api/music/*` | GET/POST | Session | Music features |
| `/api/social/*` | GET | Session | Social graph |
| `/api/hats/*` | GET | Session | Hats Protocol queries |

## Data Flows

```
User Input → API Route → Zod Validation → Session Check → Supabase Query → Response
                                              ↓
                                    Neynar API (Farcaster)
                                              ↓
                                    Optimism RPC (on-chain)
```

## Abuse Paths

1. **Mini app webhook abuse** → spoof notification token updates for arbitrary FIDs
2. **Rate limit bypass via IP rotation** → brute force auth endpoints
3. **Admin search ilike injection** → manipulate search patterns in admin user listing
4. **Scheduled cast processing** → PATCH endpoint processes due casts for current user (no cron auth)
5. **Vote weight manipulation** → vote, change wallet, re-vote with different weight (upsert allows re-voting)
