alter table public.trainer_planned_workouts add column if not exists pending_revision jsonb;
create or replace function private.stage_workout_revision() returns trigger language plpgsql security definer set search_path='' as $$
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
       if exists(select 1 from jsonb_each_text(coalesce(old.performance_log,'{}'::jsonb)) x where btrim(coalesce(x.value,''))<>'') then raise exception 'This workout already has logged results and cannot be revised';end if;
       new.pending_revision:=jsonb_build_object('token',gen_random_uuid(),'title',new.title,'exercises',new.exercises);
       new.title:=old.title;new.exercises:=old.exercises;
     end if;
   end if;
 elsif new.client_removed_at is not null or new.completed_at is not null then
   new.pending_revision:=null;
 end if;
 return new;
end $$;
revoke all on function private.stage_workout_revision() from public,anon,authenticated;
drop trigger if exists zz_stage_workout_revision on public.trainer_planned_workouts;
create trigger zz_stage_workout_revision before insert or update on public.trainer_planned_workouts for each row execute function private.stage_workout_revision();

create or replace function public.approve_trainer_reviews(p_reviews jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare r record; w public.trainer_planned_workouts%rowtype; n integer:=0;
begin
 if auth.uid() is null or p_reviews is null or jsonb_typeof(p_reviews)<>'array' then raise exception 'Invalid approval request';end if;
 if jsonb_array_length(p_reviews) not between 1 and 1000 then raise exception 'Invalid approval count';end if;
 for r in select * from jsonb_to_recordset(p_reviews) as x(id uuid,token text) order by id loop
   select * into w from public.trainer_planned_workouts p where p.id=r.id and p.client_id=auth.uid() and p.client_removed_at is null and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted') for update;
   if not found then raise exception 'Workout unavailable';end if;
   if w.pending_revision is not null then
     if r.token is distinct from w.pending_revision->>'token' then raise exception 'Workout has changed. Refresh and review the latest version';end if;
     if w.completed_at is not null or exists(select 1 from jsonb_each_text(coalesce(w.performance_log,'{}'::jsonb)) x where btrim(coalesce(x.value,''))<>'') then raise exception 'Workout has logged results and cannot be replaced';end if;
     update public.trainer_planned_workouts set title=w.pending_revision->>'title',exercises=w.pending_revision->'exercises',pending_revision=null,client_approved_at=now(),updated_at=now() where id=w.id;
   elsif r.token is not null or w.client_approved_at is not null then
     raise exception 'Workout already reviewed or revision no longer available. Refresh and try again';
   else
     update public.trainer_planned_workouts set client_approved_at=now(),updated_at=now() where id=w.id;
   end if;
   n:=n+1;
 end loop;
 return n;
end $$;
revoke all on function public.approve_trainer_reviews(jsonb) from public,anon;
grant execute on function public.approve_trainer_reviews(jsonb) to authenticated;

create or replace function private.capture_coaching_event() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; actor uuid; client uuid; kind text; heading text; k text;
begin
if TG_TABLE_NAME='trainer_clients' then
 client:=new.client_id;
 if TG_OP='INSERT' and new.status='pending' then
 select id into client from auth.users where lower(email)=lower(new.invited_email) and email_confirmed_at is not null limit 1;
 recipient:=client; actor:=new.trainer_id; kind:='connection_requested'; heading:='A trainer requested access';
 elsif TG_OP='UPDATE' and new.status='accepted' and old.status is distinct from new.status then
 recipient:=new.trainer_id; actor:=client; kind:='connection_approved'; heading:='Your client approved access';
 end if;
else
 client:=new.client_id;
 if TG_OP='INSERT' then recipient:=client; actor:=new.trainer_id; kind:='workout_assigned'; heading:='New training assigned';
 elsif new.completed_at is not null and old.completed_at is null then recipient:=new.trainer_id; actor:=client; kind:='workout_completed'; heading:='Your client completed a workout';
 elsif new.client_approved_at is not null and (old.client_approved_at is null or (old.pending_revision is not null and new.pending_revision is null and auth.uid()=client and new.client_removed_at is null and new.completed_at is null and (new.title is distinct from old.title or new.exercises is distinct from old.exercises))) then recipient:=new.trainer_id; actor:=client; kind:='workout_approved'; heading:='Your client approved training';
 elsif new.pending_revision is not null and new.pending_revision is distinct from old.pending_revision then recipient:=client; actor:=new.trainer_id; kind:='workout_updated'; heading:='Revised workout awaits your approval';
 end if;
end if;
if recipient is not null and recipient is distinct from actor then
 k:=kind||':'||recipient::text||':'||actor::text||':'||txid_current()::text;
 insert into public.trainer_notifications(recipient_id,actor_id,client_id,event_type,title,body,event_key) values(recipient,actor,client,kind,heading,'Open Gym Log to review your training updates.',k) on conflict(event_key) do nothing;
end if;
return new;
end $$;