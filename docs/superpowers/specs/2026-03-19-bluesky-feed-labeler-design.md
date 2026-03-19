# Bluesky Feed Generator + Labeler — Design Spec

> **Date:** March 19, 2026
> **Status:** Approved
> **Builds on:** Phase 1+2 Bluesky cross-posting (already built)

## Goal

Create a "ZAO Music" custom feed visible to all 40M Bluesky users + apply "ZAO Member" labels to member accounts.

## Architecture

Polling-based feed generator running as ZAO OS API routes (no separate server). Syncs every 15 minutes by fetching posts from known ZAO member DIDs.

## Data Flow

1. Admin adds member Bluesky handles via `/admin` or members connect in Settings
2. Sync endpoint fetches recent posts from each member DID via `@atproto/api`
3. Posts stored in `bluesky_feed_posts` table
4. Bluesky AppView calls `/api/bluesky/feed` → returns post URIs as feed skeleton
5. Labeler applies "ZAO Member" label to each member's DID

## New DB Tables

### bluesky_members
- `id` UUID PK
- `did` TEXT NOT NULL UNIQUE
- `handle` TEXT NOT NULL
- `user_id` UUID FK to users (nullable — for admin-added members without ZAO accounts)
- `added_by` TEXT (admin FID or 'self')
- `created_at` TIMESTAMPTZ

### bluesky_feed_posts
- `uri` TEXT PK (at:// URI)
- `did` TEXT NOT NULL
- `indexed_at` TIMESTAMPTZ
- `text_preview` TEXT (first 100 chars for admin view)

## New API Routes

- `GET /api/bluesky/feed` — public feed skeleton (called by Bluesky AppView)
- `POST /api/bluesky/sync` — admin: sync member posts
- `GET/POST/DELETE /api/bluesky/members` — admin: manage member list
- `POST /api/bluesky/label` — admin: apply/remove labels

## New Files

- `src/lib/bluesky/feed.ts` — feed generation + sync logic
- `src/lib/bluesky/labeler.ts` — label management
- `src/app/api/bluesky/feed/route.ts`
- `src/app/api/bluesky/sync/route.ts`
- `src/app/api/bluesky/members/route.ts`
- `src/app/api/bluesky/label/route.ts`
- `scripts/create-bluesky-tables.sql`
- `scripts/publish-bluesky-feed.ts`

## Feed Registration

One-time script publishes the feed record to the community Bluesky account as `app.bsky.feed.generator` with:
- `did`: service DID (did:web:zaoos.com)
- `displayName`: "ZAO Music"
- `description`: "Posts from ZAO community members — music artists building onchain"
- `feedUri`: `https://zaoos.com/api/bluesky/feed`

## Labeler

Uses `com.atproto.admin.emitModerationEvent` or direct label record creation to apply "ZAO Member" label. Simple self-label approach — no Ozone instance needed for MVP.
