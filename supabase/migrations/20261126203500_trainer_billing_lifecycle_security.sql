alter table public.trainer_billing add column if not exists checkout_lease_until timestamptz, add column if not exists checkout_lease_id uuid, add column if not exists stripe_subscription_created bigint, add column if not exists stripe_observed_at timestamptz, add column if not exists risk_hold boolean not null default false;

create or replace function private.trainer_entitlement(p_id uuid) returns integer language sql stable security definer set search_path='' as $$
 select coalesce((select case
 when p.subscription_status='complimentary' then 2147483647
 when coalesce(b.risk_hold,false) then 0
 when b.stripe_subscription_id is not null then case when b.status in ('active','trialing') and b.current_period_end>now() then case b.plan when 'coach' then 20 when 'growing_coach' then 50 else 0 end else 0 end
 when p.trial_ends_at>now() and p.subscription_status='trialing' and p.trial_terms_accepted_at is not null then 20 else 0 end
 from public.trainer_profiles p left join public.trainer_billing b on b.trainer_id=p.user_id where p.user_id=p_id),0)
$$;
revoke all on function private.trainer_entitlement(uuid) from public,anon,authenticated;

create or replace function private.enforce_trainer_membership() returns trigger language plpgsql security definer set search_path='' as $$
declare tid uuid; cap integer; used integer;
begin
 tid:=case when tg_op='DELETE' then old.trainer_id else new.trainer_id end;
 if tg_table_name='trainer_clients' then
   if tg_op='DELETE' then return old; end if;
   if tg_op='UPDATE' and new.status is not distinct from old.status and auth.uid() is distinct from tid then return new;end if;
   if tg_op='UPDATE' and new.status not in ('pending','accepted') then return new;end if;
   perform pg_advisory_xact_lock(hashtextextended(tid::text,73));
   cap:=private.trainer_entitlement(tid);
   if cap=0 then raise exception 'Trainer subscription required';end if;
   select count(*) into used from public.trainer_clients where trainer_id=tid and status in ('pending','accepted');
   if tg_op='INSERT' then
     if used>=cap then raise exception 'Trainer client limit reached';end if;
   elsif used>cap or (old.status not in ('pending','accepted') and used>=cap) then raise exception 'Trainer client limit reached';end if;
 elsif auth.uid()=tid then
   perform pg_advisory_xact_lock(hashtextextended(tid::text,73));
   cap:=private.trainer_entitlement(tid);
   if cap=0 then raise exception 'Trainer subscription required';end if;
   if tg_op<>'DELETE' and (select count(*) from public.trainer_clients where trainer_id=tid and status in ('pending','accepted'))>cap then raise exception 'Reduce your client roster or upgrade your plan before making changes';end if;
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end $$;

alter policy "Trainer and client read approved plans" on public.trainer_planned_workouts using ((client_id=(select auth.uid()) or (trainer_id=(select auth.uid()) and (select public.my_trainer_entitlement())>0)) and exists(select 1 from public.trainer_clients tc where tc.trainer_id=trainer_planned_workouts.trainer_id and tc.client_id=trainer_planned_workouts.client_id and tc.status='accepted'));

create or replace function public.get_trainer_client_calendar(p_client_id uuid,p_from text,p_to text) returns table(date_key text,title text,entries jsonb) language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or private.trainer_entitlement(auth.uid())=0 then raise exception 'Trainer subscription required';end if;
 if not exists(select 1 from public.trainer_clients tc where tc.trainer_id=auth.uid() and tc.client_id=p_client_id and tc.status='accepted') then raise exception 'Client calendar access not approved';end if;
 if p_from !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or p_to !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or p_to<p_from or p_to::date-p_from::date>62 then raise exception 'Invalid calendar range';end if;
 return query select w.date_key,w.title,w.entries from public.workout_days w where w.user_id=p_client_id and w.date_key between p_from and p_to order by w.date_key;
end $$;
revoke execute on function public.start_trainer_trial(text,boolean) from public,anon;
grant execute on function public.start_trainer_trial(text,boolean) to authenticated;

create or replace function public.claim_trainer_checkout(p_trainer uuid,p_lease uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not exists(select 1 from public.trainer_profiles where user_id=p_trainer and subscription_status<>'complimentary' and trial_terms_accepted_at is not null) then return false;end if;
 insert into public.trainer_billing(trainer_id) values(p_trainer) on conflict do nothing;
 update public.trainer_billing set checkout_lease_id=p_lease,checkout_lease_until=now()+interval '2 minutes' where trainer_id=p_trainer and not risk_hold and (checkout_lease_until is null or checkout_lease_until<now());
 get diagnostics n=row_count;return n=1;
end $$;
revoke all on function public.claim_trainer_checkout(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_trainer_checkout(uuid,uuid) to service_role;

create or replace function public.sync_trainer_subscription(p_customer text,p_subscription text,p_created bigint,p_observed timestamptz,p_plan text,p_status text,p_period timestamptz,p_trial timestamptz,p_cancel boolean) returns boolean language plpgsql security definer set search_path='' as $$
declare b public.trainer_billing%rowtype;
begin
 select * into b from public.trainer_billing where stripe_customer_id=p_customer for update;
 if not found or exists(select 1 from public.trainer_profiles p where p.user_id=b.trainer_id and p.subscription_status='complimentary') then return false;end if;
 if p_plan not in ('coach','growing_coach') or p_plan is null then return false;end if;
 if b.stripe_subscription_id is not null and b.stripe_subscription_id<>p_subscription then
   if b.stripe_subscription_created is null or b.stripe_subscription_created>=p_created or b.status not in ('canceled','incomplete_expired') then return false;end if;
 elsif b.stripe_observed_at is not null and b.stripe_observed_at>p_observed then return false;end if;
 update public.trainer_billing set stripe_subscription_id=p_subscription,stripe_subscription_created=p_created,stripe_observed_at=p_observed,plan=p_plan,status=p_status,current_period_end=p_period,trial_ends_at=p_trial,cancel_at_period_end=p_cancel,updated_at=now() where trainer_id=b.trainer_id;
 return true;
end $$;
revoke all on function public.sync_trainer_subscription(text,text,bigint,timestamptz,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.sync_trainer_subscription(text,text,bigint,timestamptz,text,text,timestamptz,timestamptz,boolean) to service_role;

create table if not exists public.trainer_billing_risk_events(event_id text primary key,trainer_id uuid not null references public.trainer_billing(trainer_id) on delete cascade,event_type text not null,stripe_subscription_id text not null,created_at timestamptz not null default now());
alter table public.trainer_billing_risk_events enable row level security;
revoke all on public.trainer_billing_risk_events from public,anon,authenticated;
grant all on public.trainer_billing_risk_events to service_role;

create or replace function public.record_trainer_billing_risk(p_event text,p_kind text,p_customer text,p_subscription text) returns boolean language plpgsql security definer set search_path='' as $$
declare tid uuid;
begin
 select trainer_id into tid from public.trainer_billing where stripe_customer_id=p_customer and stripe_subscription_id=p_subscription for update;
 if not found then return false;end if;
 insert into public.trainer_billing_risk_events(event_id,trainer_id,event_type,stripe_subscription_id) values(p_event,tid,p_kind,p_subscription) on conflict do nothing;
 if found and p_kind in ('charge.dispute.created','radar.early_fraud_warning.created') then update public.trainer_billing set risk_hold=true,updated_at=now() where trainer_id=tid;end if;
 return true;
end $$;
revoke all on function public.record_trainer_billing_risk(text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_trainer_billing_risk(text,text,text,text) to service_role;