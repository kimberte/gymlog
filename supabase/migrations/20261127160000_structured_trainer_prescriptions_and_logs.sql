create or replace function private.parse_trainer_prescription(p_exercises jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare e jsonb; v text; m text[]; result jsonb:='[]'::jsonb; total int:=0; n int; low int; high int; target text; parts text[];
begin
 if jsonb_typeof(p_exercises) is distinct from 'array' or jsonb_array_length(p_exercises) not between 1 and 60 then return null;end if;
 for e in select value from jsonb_array_elements(p_exercises) loop
 if jsonb_typeof(e)<>'string' then return null;end if;
 v:=e#>>'{}'; if length(v)>1500 then return null;end if;
 m:=regexp_match(v,'^(.*?)[[:space:]]*(?:·[[:space:]]*|[—–:][[:space:]]*|[[:space:]]+)([0-9]{1,2})[[:space:]]*(?:sets?[[:space:]]*)?[×x][[:space:]]*([0-9]{1,4})(?:[[:space:]]*[-–][[:space:]]*([0-9]{1,4}))?(?:[[:space:]]*(reps?|sec(?:onds?)?|min(?:utes?)?))?(?:[[:space:]]*(?:·|@|—|\().*)?$','i');
 if m is null or length(btrim(m[1])) not between 1 and 150 then return null;end if;
 n:=m[2]::int;low:=m[3]::int;high:=coalesce(m[4],m[3])::int;
 if n not between 1 and 30 or low not between 1 and 3600 or high not between low and 3600 then return null;end if;
 total:=total+n;if total>250 then return null;end if;
 target:=case when lower(coalesce(m[5],'')) like 'sec%' then 'seconds' when lower(coalesce(m[5],'')) like 'min%' then 'minutes' else 'reps' end;
 parts:=string_to_array(v,' · ');
 result:=result||jsonb_build_array(jsonb_build_object('name',btrim(m[1]),'sets',n,'target_min',low,'target_max',high,'target_kind',target,'instruction',v,'target_load',coalesce((select substring(x from 7) from unnest(parts) x where lower(x) like 'load: %' limit 1),''),'target_rest',coalesce((select substring(x from 7) from unnest(parts) x where lower(x) like 'rest: %' limit 1),'')));
 end loop;
 return result;
end $$;
revoke all on function private.parse_trainer_prescription(jsonb) from public,anon,authenticated;
grant execute on function private.parse_trainer_prescription(jsonb) to authenticated,service_role;
alter table public.trainer_planned_workouts add column if not exists structured_prescription jsonb generated always as (private.parse_trainer_prescription(exercises)) stored;
create or replace function private.require_trainer_structure() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid()=new.trainer_id and auth.uid() is distinct from new.client_id then
 if tg_op='INSERT' or new.exercises is distinct from old.exercises or (old.client_removed_at is not null and new.client_removed_at is null) then
 if private.parse_trainer_prescription(new.exercises) is null then raise exception 'Structured exercise names, set counts and rep or time targets are required for trainer assignments';end if;
 end if;
 end if;return new;
end $$;
revoke all on function private.require_trainer_structure() from public,anon,authenticated;
drop trigger if exists aa_require_trainer_structure on public.trainer_planned_workouts;
create trigger aa_require_trainer_structure before insert or update on public.trainer_planned_workouts for each row execute function private.require_trainer_structure();

create or replace function private.workout_has_results(p_log jsonb,p_exercises jsonb) returns boolean language sql immutable set search_path='' as $$
select exists(select 1 from jsonb_each_text(coalesce(p_log,'{}'::jsonb)) x where btrim(coalesce(x.value,''))<>'' and x.key not in ('structured_workout','actual_sets') and (x.key<>'notes' or btrim(x.value) is distinct from btrim(coalesce((select string_agg(case when jsonb_typeof(e.value)='string' then e.value #>> '{}' when jsonb_typeof(e.value)='object' and e.value ? 'name' then e.value->>'name' else e.value::text end,E'\n' order by e.ordinality) from jsonb_array_elements(p_exercises) with ordinality e(value,ordinality)),'')))) or case when jsonb_typeof(p_log->'actual_sets')='array' then jsonb_array_length(p_log->'actual_sets')>0 else false end
or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(p_log->'structured_workout'->'rows')='array' then p_log->'structured_workout'->'rows' else '[]'::jsonb end) row where coalesce(row->>'reps','')<>'' or coalesce(row->>'weight','')<>'' or row->>'completed'='true');
$$;
revoke all on function private.workout_has_results(jsonb,jsonb) from public,anon,authenticated;

create or replace function public.save_structured_trainer_workout(p_workout_id uuid,p_prescription text,p_log jsonb,p_completed boolean default null) returns void language plpgsql security definer set search_path='' as $$
declare w public.trainer_planned_workouts%rowtype; expected text; draft jsonb; r jsonb; actual jsonb:='[]'::jsonb; reps int; weight numeric; unit text; timed boolean; lines text:=''; nm text; n int;
begin
 if auth.uid() is null or jsonb_typeof(p_log) is distinct from 'object' or pg_column_size(p_log)>262144 then raise exception 'Invalid workout log';end if;
 select * into w from public.trainer_planned_workouts p where p.id=p_workout_id and p.client_id=auth.uid() and p.client_approved_at is not null and p.client_removed_at is null and exists(select 1 from public.trainer_clients tc where tc.trainer_id=p.trainer_id and tc.client_id=auth.uid() and tc.status='accepted') for update;
 if not found then raise exception 'Workout unavailable or access denied';end if;
 select coalesce(string_agg(case when jsonb_typeof(e.value)='string' then e.value#>>'{}' when jsonb_typeof(e.value)='object' and e.value ? 'name' then e.value->>'name' else e.value::text end,E'\n' order by e.ordinality),'') into expected from jsonb_array_elements(w.exercises) with ordinality e(value,ordinality);
 if p_prescription is distinct from expected then raise exception 'Trainer workout changed. Reopen the calendar before saving';end if;
 draft:=p_log->'structured_workout';
 if jsonb_typeof(draft->'rows') is distinct from 'array' or jsonb_array_length(draft->'rows')>250 then raise exception 'Invalid structured rows';end if;
 for r in select value from jsonb_array_elements(draft->'rows') loop
 if r->>'completed' is distinct from 'true' then continue;end if;
 nm:=btrim(coalesce(r->>'name',''));if length(nm) not between 1 and 150 or coalesce(r->>'reps','')!~'^[0-9]{1,4}$' then raise exception 'Completed sets require an exercise and actual reps or seconds';end if;
 reps:=(r->>'reps')::int;if reps not between 1 and 3600 then raise exception 'Invalid actual reps or seconds';end if;
 unit:=nullif(r->>'unit','');weight:=null;
 if coalesce(r->>'weight','')<>'' then
 if r->>'weight'!~'^[0-9]{1,4}(\.[0-9]{1,4})?$' or unit not in ('kg','lb') or unit is null then raise exception 'Completed loaded sets require a valid weight and unit';end if;
 weight:=(r->>'weight')::numeric;if weight>2000 then raise exception 'Invalid weight';end if;end if;
 timed:=coalesce(r->>'targetReps','')~*'(sec|min)$';
 actual:=actual||jsonb_build_array(jsonb_build_object('name',nm,'reps',case when timed then null else reps end,'duration_seconds',case when timed then reps else null end,'weight',weight,'unit',unit,'completed',true));
 if not timed and weight>0 then lines:=concat_ws(E'\n',nullif(lines,''),nm||': '||weight::text||' '||unit||' x '||reps::text);end if;
 end loop;
 -- Retain old note-derived history when migrating a legacy completed session.
 if w.completed_at is not null and not (coalesce(w.performance_log,'{}'::jsonb)?'actual_sets') and jsonb_array_length(actual)=0 and private.workout_has_results(w.performance_log,w.exercises) then raise exception 'Legacy completed results are protected. Keep the original training history';end if;
 update public.trainer_planned_workouts set performance_log=coalesce(w.performance_log,'{}'::jsonb)||jsonb_build_object('notes',coalesce(p_log->>'notes',''),'structured_workout',draft,'actual_sets',actual,'structured_actual_sets',lines),completed_at=case when p_completed is null then w.completed_at when p_completed then coalesce(w.completed_at,now()) else null end,updated_at=now() where id=w.id;
end $$;
revoke all on function public.save_structured_trainer_workout(uuid,text,jsonb,boolean) from public,anon;
grant execute on function public.save_structured_trainer_workout(uuid,text,jsonb,boolean) to authenticated;