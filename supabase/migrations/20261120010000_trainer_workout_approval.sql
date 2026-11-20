alter table public.trainer_planned_workouts add column if not exists client_approved_at timestamptz;
create or replace function public.approve_trainer_workout(p_workout_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.trainer_planned_workouts p set client_approved_at=now(),updated_at=now()
 where p.id=p_workout_id and p.client_id=auth.uid()
 and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted');
 if not found then raise exception 'Workout unavailable or trainer not approved'; end if;
end $$;
revoke all on function public.approve_trainer_workout(uuid) from public,anon;
grant execute on function public.approve_trainer_workout(uuid) to authenticated;