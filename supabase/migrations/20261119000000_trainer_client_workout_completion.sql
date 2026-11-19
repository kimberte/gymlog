create or replace function public.set_trainer_workout_completion(p_workout_id uuid,p_completed boolean)
returns public.trainer_planned_workouts
language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_plan public.trainer_planned_workouts;
begin
  update public.trainer_planned_workouts p
  set completed_at=case when p_completed then now() else null end, updated_at=now()
  where p.id=p_workout_id and p.client_id=auth.uid()
    and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted')
  returning p.* into v_plan;
  if not found then raise exception 'Workout not found or access denied'; end if;
  return v_plan;
end $$;
revoke all on function public.set_trainer_workout_completion(uuid,boolean) from public,anon;
grant execute on function public.set_trainer_workout_completion(uuid,boolean) to authenticated;