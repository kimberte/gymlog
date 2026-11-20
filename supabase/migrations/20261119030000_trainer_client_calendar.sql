create or replace function public.get_trainer_client_calendar(p_client_id uuid,p_from text,p_to text)
returns table(date_key text,title text,entries jsonb)
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from public.trainer_clients tc where tc.trainer_id=auth.uid() and tc.client_id=p_client_id and tc.status='accepted') then raise exception 'Client calendar access not approved'; end if;
 if p_from !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or p_to !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or p_to < p_from or p_to::date-p_from::date>62 then raise exception 'Invalid calendar range'; end if;
 return query select w.date_key,w.title,w.entries from public.workout_days w where w.user_id=p_client_id and w.date_key between p_from and p_to order by w.date_key;
end $$;
revoke all on function public.get_trainer_client_calendar(uuid,text,text) from public,anon;
grant execute on function public.get_trainer_client_calendar(uuid,text,text) to authenticated;