-- Trainer SaaS notification foundation.
-- Live Supabase migration: trainer_notification_preferences_and_inbox
create table if not exists public.trainer_notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 workout_assigned boolean not null default true,
 workout_updated boolean not null default true,
 workout_completed boolean not null default true,
 email_enabled boolean not null default true,
 push_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.trainer_notification_preferences enable row level security;
create policy "Owners read trainer notification preferences" on public.trainer_notification_preferences for select to authenticated using ((select auth.uid())=user_id);
create policy "Owners insert trainer notification preferences" on public.trainer_notification_preferences for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Owners update trainer notification preferences" on public.trainer_notification_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create table if not exists public.trainer_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 client_id uuid references auth.users(id) on delete set null,
 event_type text not null check (event_type in ('workout_assigned','workout_updated','workout_completed')),
 title text not null,
 body text not null default '',
 date_key text,
 event_key text unique,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists trainer_notifications_recipient_idx on public.trainer_notifications(recipient_id,created_at desc);
alter table public.trainer_notifications enable row level security;
create policy "Recipients read notifications" on public.trainer_notifications for select to authenticated using ((select auth.uid())=recipient_id);
create policy "Recipients mark notifications read" on public.trainer_notifications for update to authenticated using ((select auth.uid())=recipient_id) with check ((select auth.uid())=recipient_id);
revoke insert, delete on public.trainer_notifications from anon, authenticated;
grant select,insert,update on public.trainer_notification_preferences to authenticated;
grant select,update on public.trainer_notifications to authenticated;
