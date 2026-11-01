-- Rollback of 20261101-member-public-profile.sql. Deletes every member's opt-in choices.
-- With the columns gone, the public routes fail closed and show no members.
-- RLS and the revoke stay in place: service-role-only is the intended state.

begin;

drop index if exists public.idx_users_public_name;

alter table public.users
  drop constraint if exists users_public_fields_need_name_check,
  drop constraint if exists users_public_fields_known_check,
  drop constraint if exists users_public_name_check,
  drop column if exists public_fields,
  drop column if exists public_name;

commit;
