create or replace function private.trainer_entitlement(p_id uuid) returns integer language sql stable security definer set search_path='' as $$
 select coalesce((select case when p.subscription_status='complimentary' then 2147483647 when b.status in ('active','trialing') and b.current_period_end>now() then case b.plan when 'coach' then 20 when 'growing_coach' then 50 else 0 end when p.trial_ends_at>now() and p.subscription_status='trialing' then 20 else 0 end from public.trainer_profiles p left join public.trainer_billing b on b.trainer_id=p.user_id where p.user_id=p_id),0)
$$;
revoke all on function private.trainer_entitlement(uuid) from public,anon,authenticated;
create or replace function public.my_trainer_entitlement() returns integer language sql stable security definer set search_path='' as $$select private.trainer_entitlement(auth.uid())$$;
revoke all on function public.my_trainer_entitlement() from public,anon;
grant execute on function public.my_trainer_entitlement() to authenticated;
create or replace function private.enforce_trainer_membership() returns trigger language plpgsql security definer set search_path='' as $$
declare tid uuid; cap integer; used integer;
begin
 tid:=case when tg_op='DELETE' then old.trainer_id else new.trainer_id end;
 if tg_table_name='trainer_clients' then
   if tg_op='DELETE' then return old; end if;
   if tg_op='UPDATE' and new.status is not distinct from old.status and auth.uid() is distinct from tid then return new; end if;
   perform pg_advisory_xact_lock(hashtextextended(tid::text,73));
   cap:=private.trainer_entitlement(tid);
   if cap=0 then raise exception 'Trainer subscription required'; end if;
   if tg_op='INSERT' then
     select count(*) into used from public.trainer_clients where trainer_id=tid and status in ('pending','accepted');
     if used>=cap then raise exception 'Trainer client limit reached'; end if;
   end if;
 elsif auth.uid()=tid then
   if private.trainer_entitlement(tid)=0 then raise exception 'Trainer subscription required'; end if;
 end if;
 if tg_op='DELETE' then return old; end if; return new;
end $$;
revoke all on function private.enforce_trainer_membership() from public,anon,authenticated;
create trigger enforce_trainer_membership before insert or update on public.trainer_clients for each row execute function private.enforce_trainer_membership();
create trigger enforce_trainer_membership before insert or update or delete on public.trainer_planned_workouts for each row execute function private.enforce_trainer_membership();
create trigger enforce_trainer_membership before insert or update or delete on public.trainer_program_templates for each row execute function private.enforce_trainer_membership();
create trigger enforce_trainer_membership before insert on public.coaching_messages for each row execute function private.enforce_trainer_membership();
