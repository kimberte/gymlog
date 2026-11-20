-- Correct the accidentally over-escaped date-key check; valid dates use YYYY-MM-DD.
alter table public.trainer_planned_workouts drop constraint if exists trainer_planned_workouts_date_key_check;
alter table public.trainer_planned_workouts add constraint trainer_planned_workouts_date_key_check check (date_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
alter table public.trainer_clients add column if not exists client_display_name text;
alter table public.trainer_clients add constraint trainer_clients_display_name_length_check check (client_display_name is null or char_length(client_display_name)<=100);
create or replace function public.set_trainer_client_display_name(p_link_id uuid,p_name text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or char_length(trim(coalesce(p_name,'')))>100 then raise exception 'Invalid client name'; end if;
 update public.trainer_clients set client_display_name=nullif(trim(coalesce(p_name,'')),'') where id=p_link_id and trainer_id=auth.uid();
 if not found then raise exception 'Client connection unavailable'; end if;
end $$;
revoke all on function public.set_trainer_client_display_name(uuid,text) from public,anon;
grant execute on function public.set_trainer_client_display_name(uuid,text) to authenticated;