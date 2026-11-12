-- Gym Log trainer portal foundation. Apply in Supabase SQL editor before enabling portal.
create extension if not exists pgcrypto;
create table if not exists public.trainer_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 subscription_status text not null default 'inactive'
   check (subscription_status in ('inactive','trialing','active','past_due','canceled')),
 created_at timestamptz not null default now()
);
create table if not exists public.trainer_clients (
 id uuid primary key default gen_random_uuid(),
 trainer_id uuid not null references public.trainer_profiles(user_id) on delete cascade,
 client_id uuid references auth.users(id) on delete cascade,
 invited_email text not null,
 status text not null default 'pending' check (status in ('pending','accepted','revoked')),
 created_at timestamptz not null default now(),
 accepted_at timestamptz,
 constraint trainer_client_distinct check (trainer_id is distinct from client_id)
);
create unique index if not exists trainer_client_email_unique on public.trainer_clients(trainer_id,lower(invited_email)) where status <> 'revoked';
create index if not exists trainer_clients_client_idx on public.trainer_clients(client_id);
alter table public.trainer_profiles enable row level security;
alter table public.trainer_clients enable row level security;
create policy "trainer profile own read" on public.trainer_profiles for select to authenticated using (user_id=auth.uid());
create policy "trainer profile own create" on public.trainer_profiles for insert to authenticated with check (user_id=auth.uid() and subscription_status='inactive');
create policy "trainer profile own edit" on public.trainer_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and subscription_status='inactive');
-- Subscription state is not editable by trainers: enforce via trigger, including on updates.
create or replace function public.trainer_profile_protect_billing() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.subscription_status is distinct from old.subscription_status and auth.role() <> 'service_role' then
  raise exception 'subscription status is server managed';
 end if;
 return new;
end $$;
create trigger trainer_profile_billing_guard before update on public.trainer_profiles for each row execute function public.trainer_profile_protect_billing();
create policy "trainer client relationship read" on public.trainer_clients for select to authenticated
 using (trainer_id=auth.uid() or client_id=auth.uid() or (status='pending' and lower(invited_email)=lower(coalesce(auth.jwt()->>'email',''))));
create policy "trainer invitation create" on public.trainer_clients for insert to authenticated
 with check (trainer_id=auth.uid() and client_id is null and status='pending' and length(trim(invited_email))>3);
create policy "trainer revoke invitation" on public.trainer_clients for delete to authenticated using (trainer_id=auth.uid());
-- Acceptance must be performed through a narrowly scoped function, not direct table updates.
create or replace function public.accept_trainer_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare invite public.trainer_clients;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into invite from public.trainer_clients where id=p_invitation_id and status='pending' for update;
 if not found or lower(invite.invited_email) <> lower(coalesce(auth.jwt()->>'email','')) then
  raise exception 'Invitation not found';
 end if;
 if invite.trainer_id=auth.uid() then raise exception 'Cannot invite yourself'; end if;
 update public.trainer_clients set client_id=auth.uid(), status='accepted', accepted_at=now() where id=p_invitation_id;
end $$;
revoke all on function public.accept_trainer_invitation(uuid) from public;
grant execute on function public.accept_trainer_invitation(uuid) to authenticated;
-- No trainer access to workout_backups: client calendar sharing requires a separate
-- consent-scoped workout sync table and RLS migration, intentionally not enabled here.
