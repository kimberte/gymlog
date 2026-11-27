create table if not exists public.gym_log_owner_alerts(id uuid primary key default gen_random_uuid(),event_key text not null unique,kind text not null,subject text not null,body text not null,created_at timestamptz not null default now(),state text not null default 'pending',lease timestamptz);
alter table public.gym_log_owner_alerts enable row level security;
revoke all on public.gym_log_owner_alerts from public,anon,authenticated;
grant select,insert,update,delete on public.gym_log_owner_alerts to service_role;
create index if not exists gym_log_owner_alerts_pending on public.gym_log_owner_alerts(created_at) where state in ('pending','processing');
create or replace function public.queue_gym_log_feedback(p_user uuid,p_category text,p_message text) returns boolean language plpgsql security definer set search_path='' as $$
declare address text;
begin
 if p_user is null or p_category not in ('Issue','Feature suggestion','Trainer coaching','Billing','Other') or length(trim(coalesce(p_message,''))) not between 10 and 4000 then return false;end if;
 select email into address from auth.users where id=p_user and email_confirmed_at is not null;
 if address is null then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,527));
 if (select count(*) from public.gym_log_owner_alerts where kind='feedback' and event_key like 'feedback:'||p_user::text||':%' and created_at>now()-interval '1 hour')>=3 then return false;end if;
 insert into public.gym_log_owner_alerts(event_key,kind,subject,body) values('feedback:'||p_user::text||':'||gen_random_uuid()::text,'feedback','Gym Log feedback: '||p_category,'From: '||address||E'\n\n'||trim(p_message));return true;
end $$;
revoke all on function public.queue_gym_log_feedback(uuid,text,text) from public,anon,authenticated;
grant execute on function public.queue_gym_log_feedback(uuid,text,text) to service_role;

create or replace function private.gym_log_signup_alert() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is not null and new.email is not null and (tg_op='INSERT' or old.email_confirmed_at is null) then
 insert into public.gym_log_owner_alerts(event_key,kind,subject,body) values('signup:'||new.id::text,'signup','Gym Log: new verified user','Verified user: '||new.email) on conflict(event_key) do nothing;
 end if;return new;
end $$;
revoke all on function private.gym_log_signup_alert() from public,anon,authenticated;
drop trigger if exists gym_log_signup_alert on auth.users;
create trigger gym_log_signup_alert after insert or update of email_confirmed_at on auth.users for each row execute function private.gym_log_signup_alert();

create or replace function private.gym_log_trainer_trial_alert() returns trigger language plpgsql security definer set search_path='' as $$
declare address text;
begin
 if new.subscription_status='trialing' and new.trial_started_at is not null then
 select email into address from auth.users where id=new.user_id;
 insert into public.gym_log_owner_alerts(event_key,kind,subject,body) values('trainer-trial:'||new.user_id::text,'trainer_trial','Gym Log: new 30-day trainer trial','Trainer: '||coalesce(address,'Unknown')||E'\nTrial ends: '||coalesce(new.trial_ends_at::text,'Unknown')) on conflict(event_key) do nothing;
 end if;return new;
end $$;
revoke all on function private.gym_log_trainer_trial_alert() from public,anon,authenticated;
drop trigger if exists gym_log_trainer_trial_alert on public.trainer_profiles;
create trigger gym_log_trainer_trial_alert after insert or update of trial_started_at on public.trainer_profiles for each row execute function private.gym_log_trainer_trial_alert();

create or replace function private.gym_log_stripe_trial_alert() returns trigger language plpgsql security definer set search_path='' as $$
declare address text;
begin
 if new.status='trialing' and new.stripe_subscription_id is not null then
 select email into address from auth.users where id=new.trainer_id;
 insert into public.gym_log_owner_alerts(event_key,kind,subject,body) values('stripe-trial:'||new.stripe_subscription_id,'stripe_trial','Gym Log: Stripe subscription trial','Trainer: '||coalesce(address,'Unknown')||E'\nPlan: '||coalesce(new.plan,'Unknown')||E'\nTrial ends: '||coalesce(new.trial_ends_at::text,'Unknown')) on conflict(event_key) do nothing;
 end if;return new;
end $$;
revoke all on function private.gym_log_stripe_trial_alert() from public,anon,authenticated;
drop trigger if exists gym_log_stripe_trial_alert on public.trainer_billing;
create trigger gym_log_stripe_trial_alert after insert or update of status on public.trainer_billing for each row execute function private.gym_log_stripe_trial_alert();

create or replace function public.queue_gym_log_stripe_payment(p_customer text,p_subscription text,p_invoice text,p_amount bigint,p_currency text) returns boolean language plpgsql security definer set search_path='' as $$
declare b public.trainer_billing%rowtype;address text;
begin
 if p_amount<=0 or p_invoice is null then return false;end if;
 select * into b from public.trainer_billing where stripe_customer_id=p_customer and stripe_subscription_id=p_subscription;
 if not found then return false;end if;
 select email into address from auth.users where id=b.trainer_id;
 insert into public.gym_log_owner_alerts(event_key,kind,subject,body) values('stripe-payment:'||p_invoice,'stripe_purchase','Gym Log: trainer subscription payment','Trainer: '||coalesce(address,'Unknown')||E'\nPlan: '||coalesce(b.plan,'Unknown')||E'\nPaid: '||to_char(p_amount::numeric/100,'FM999999990.00')||' '||upper(p_currency)||E'\nInvoice: '||p_invoice) on conflict(event_key) do nothing;
 return true;
end $$;
revoke all on function public.queue_gym_log_stripe_payment(text,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.queue_gym_log_stripe_payment(text,text,text,bigint,text) to service_role;