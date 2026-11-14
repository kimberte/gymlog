-- Trainer-approved plans and consent-based client connections.
create table if not exists public.trainer_planned_workouts (
 id uuid primary key default gen_random_uuid(),
 trainer_id uuid not null references public.trainer_profiles(user_id) on delete cascade,
 client_id uuid not null references auth.users(id) on delete cascade,
 date_key text not null check (date_key ~ '^\\d{4}-\\d{2}-\\d{2}$'),
 title text not null check (length(trim(title))>0),
 exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(exercises)='array'),
 completed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (trainer_id,client_id,date_key)
);
alter table public.trainer_planned_workouts enable row level security;
create policy "Trainer and client read approved plans" on public.trainer_planned_workouts for select to authenticated using (((select auth.uid())=trainer_id or (select auth.uid())=client_id) and exists(select 1 from public.trainer_clients tc where tc.trainer_id=trainer_planned_workouts.trainer_id and tc.client_id=trainer_planned_workouts.client_id and tc.status='accepted'));
create policy "Trainer adds approved client plans" on public.trainer_planned_workouts for insert to authenticated with check ((select auth.uid())=trainer_id and exists(select 1 from public.trainer_clients tc where tc.trainer_id=trainer_planned_workouts.trainer_id and tc.client_id=trainer_planned_workouts.client_id and tc.status='accepted'));
create policy "Trainer updates approved client plans" on public.trainer_planned_workouts for update to authenticated using ((select auth.uid())=trainer_id and exists(select 1 from public.trainer_clients tc where tc.trainer_id=trainer_planned_workouts.trainer_id and tc.client_id=trainer_planned_workouts.client_id and tc.status='accepted')) with check ((select auth.uid())=trainer_id and exists(select 1 from public.trainer_clients tc where tc.trainer_id=trainer_planned_workouts.trainer_id and tc.client_id=trainer_planned_workouts.client_id and tc.status='accepted'));
create policy "Trainer removes approved client plans" on public.trainer_planned_workouts for delete to authenticated using ((select auth.uid())=trainer_id and exists(select 1 from public.trainer_clients tc where tc.trainer_id=trainer_planned_workouts.trainer_id and tc.client_id=trainer_planned_workouts.client_id and tc.status='accepted'));
create policy "Invited client accepts own link" on public.trainer_clients for update to authenticated using (status='pending' and client_id is null and lower(invited_email)=lower(coalesce((select auth.jwt())->>'email',''))) with check (status='accepted' and client_id=(select auth.uid()) and lower(invited_email)=lower(coalesce((select auth.jwt())->>'email','')));
grant select,insert,update,delete on public.trainer_planned_workouts to authenticated;
revoke update on public.trainer_clients from authenticated;
grant update (client_id,status,accepted_at) on public.trainer_clients to authenticated;
revoke update on public.trainer_profiles from authenticated;
grant update (display_name) on public.trainer_profiles to authenticated;
