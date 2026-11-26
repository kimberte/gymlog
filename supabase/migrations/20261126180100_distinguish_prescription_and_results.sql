create or replace function private.workout_has_results(p_log jsonb,p_exercises jsonb) returns boolean language sql immutable set search_path='' as $$ select exists(select 1 from jsonb_each_text(coalesce(p_log,'{}'::jsonb)) x where btrim(coalesce(x.value,''))<>'' and (x.key<>'notes' or btrim(x.value) is distinct from btrim(coalesce((select string_agg(case when jsonb_typeof(e.value)='string' then e.value #>> '{}' when jsonb_typeof(e.value)='object' and e.value ? 'name' then e.value->>'name' else e.value::text end,E'\n' order by e.ordinality) from jsonb_array_elements(p_exercises) with ordinality e(value,ordinality)),'')))) $$; revoke all on function private.workout_has_results(jsonb,jsonb) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.approve_trainer_reviews(p_reviews jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record; w public.trainer_planned_workouts%rowtype; n integer:=0;
begin
 if auth.uid() is null or p_reviews is null or jsonb_typeof(p_reviews)<>'array' then raise exception 'Invalid approval request';end if;
 if jsonb_array_length(p_reviews) not between 1 and 1000 then raise exception 'Invalid approval count';end if;
 for r in select * from jsonb_to_recordset(p_reviews) as x(id uuid,token text) order by id loop
   select * into w from public.trainer_planned_workouts p where p.id=r.id and p.client_id=auth.uid() and p.client_removed_at is null and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted') for update;
   if not found then raise exception 'Workout unavailable';end if;
   if w.pending_revision is not null then
     if r.token is distinct from w.pending_revision->>'token' then raise exception 'Workout has changed. Refresh and review the latest version';end if;
     if w.completed_at is not null or private.workout_has_results(w.performance_log,w.exercises) then raise exception 'Workout has logged results and cannot be replaced';end if;
     update public.trainer_planned_workouts set title=w.pending_revision->>'title',exercises=w.pending_revision->'exercises',performance_log='{}'::jsonb,pending_revision=null,client_approved_at=now(),updated_at=now() where id=w.id;
   elsif r.token is not null or w.client_approved_at is not null then
     raise exception 'Workout already reviewed or revision no longer available. Refresh and try again';
   else
     update public.trainer_planned_workouts set client_approved_at=now(),updated_at=now() where id=w.id;
   end if;
   n:=n+1;
 end loop;
 return n;
end $function$
;
CREATE OR REPLACE FUNCTION private.stage_workout_revision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if tg_op='INSERT' then
   new.pending_revision:=null;
   return new;
 end if;
 if auth.uid()=old.trainer_id and auth.uid() is distinct from old.client_id then
   if new.date_key is distinct from old.date_key then raise exception 'Assign a different date separately'; end if;
   if old.client_removed_at is not null and new.client_removed_at is null then new.pending_revision:=null;return new;end if;
   if new.completed_at is distinct from old.completed_at or new.performance_log is distinct from old.performance_log then raise exception 'Only the client can log training';end if;
   new.pending_revision:=old.pending_revision;
   if new.title is distinct from old.title or new.exercises is distinct from old.exercises then
     if old.completed_at is not null then raise exception 'Completed workouts cannot be revised';end if;
     if old.client_approved_at is not null and old.client_removed_at is null then
       if private.workout_has_results(old.performance_log,old.exercises) then raise exception 'This workout already has logged results and cannot be revised';end if;
       new.pending_revision:=jsonb_build_object('token',gen_random_uuid(),'title',new.title,'exercises',new.exercises);
       new.title:=old.title;new.exercises:=old.exercises;
     end if;
   end if;
 elsif new.client_removed_at is not null or new.completed_at is not null then
   new.pending_revision:=null;
 end if;
 return new;
end $function$
;
