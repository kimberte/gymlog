create table if not exists public.trainer_billing (
 trainer_id uuid primary key references auth.users(id) on delete cascade,
 stripe_customer_id text unique,
 stripe_subscription_id text unique,
 plan text check (plan in ('coach','growing_coach')),
 status text not null default 'inactive',
 current_period_end timestamptz,
 trial_ends_at timestamptz,
 cancel_at_period_end boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.trainer_billing enable row level security;
drop policy if exists "Trainer can read own billing" on public.trainer_billing;
create policy "Trainer can read own billing" on public.trainer_billing for select to authenticated using (trainer_id=(select auth.uid()));
grant select on public.trainer_billing to authenticated;
revoke insert,update,delete on public.trainer_billing from anon,authenticated;
create index if not exists trainer_billing_subscription_idx on public.trainer_billing(stripe_subscription_id);