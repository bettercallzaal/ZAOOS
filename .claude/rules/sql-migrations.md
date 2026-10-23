---
description: Rules for SQL migrations that create Supabase tables
globs: scripts/**/*.sql,supabase/**/*.sql
---

# SQL Migration Conventions

mechanism: none yet (since 2026-10-23, board card 10559)

- A migration that creates a table in the `public` schema grants access to it explicitly, in the same file. From 2026-10-30 Supabase gives new public tables no default grants, so a table without them returns `42501 permission denied` through the Data API (https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically). Existing tables keep their grants.
- Grant only the roles the table needs. A server-only table grants `service_role` alone; never grant `anon` write access by habit.
- Enable row level security in the same migration, with its policies: `alter table public.<name> enable row level security;`.
- Adding a column to an existing table needs no new grant.

```sql
create table public.example (...);
grant select, insert, update, delete on public.example to service_role;
alter table public.example enable row level security;
```
