create or replace function public.save_trainer_workout_log(p_workout_id uuid,p_log jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if jsonb_typeof(p_log) is distinct from 'object' or pg_column_size(p_log)>32768 then raise exception 'Invalid workout log';end if;
 update public.trainer_planned_workouts p set performance_log=p_log,updated_at=now()
 where p.id=p_workout_id and p.client_id=auth.uid() and p.client_approved_at is not null and p.client_removed_at is null
 and not (coalesce(p.performance_log,'{}'::jsonb)?'structured_workout') and p.structured_prescription is null
 and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted');
 if not found then raise exception 'Use the structured workout editor or refresh your app';end if;
end $$;
revoke all on function public.save_trainer_workout_log(uuid,jsonb) from public,anon;
grant execute on function public.save_trainer_workout_log(uuid,jsonb) to authenticated;
create or replace function public.set_trainer_workout_completion(p_workout_id uuid,p_completed boolean) returns public.trainer_planned_workouts language plpgsql security definer set search_path='' as $$
declare v_plan public.trainer_planned_workouts;
begin
 update public.trainer_planned_workouts p set completed_at=case when p_completed then coalesce(p.completed_at,now()) else null end,updated_at=now()
 where p.id=p_workout_id and p.client_id=auth.uid() and p.client_approved_at is not null and p.client_removed_at is null
 and p.structured_prescription is null and not (coalesce(p.performance_log,'{}'::jsonb)?'structured_workout')
 and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted')
 returning p.* into v_plan;
 if not found then raise exception 'Use the structured workout editor or refresh your app';end if;return v_plan;
end $$;
revoke all on function public.set_trainer_workout_completion(uuid,boolean) from public,anon;
grant execute on function public.set_trainer_workout_completion(uuid,boolean) to authenticated;