alter table public.trainer_planned_workouts add column if not exists performance_log jsonb not null default '{}'::jsonb;
create or replace function public.save_trainer_workout_log(p_workout_id uuid,p_log jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if jsonb_typeof(p_log) <> 'object' or pg_column_size(p_log)>32768 then raise exception 'Invalid workout log'; end if;
 update public.trainer_planned_workouts p set performance_log=p_log,updated_at=now()
 where p.id=p_workout_id and p.client_id=auth.uid()
 and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted');
 if not found then raise exception 'Workout unavailable or access denied'; end if;
end $$;
revoke all on function public.save_trainer_workout_log(uuid,jsonb) from public,anon;
grant execute on function public.save_trainer_workout_log(uuid,jsonb) to authenticated;