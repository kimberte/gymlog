create or replace function public.respond_to_trainer_request(p_request_id uuid,p_approve boolean)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare v_email text;
begin
  v_email:=lower(coalesce(auth.jwt()->>'email',''));
  if auth.uid() is null or v_email='' then raise exception 'Sign in before responding to trainer requests'; end if;
  if p_approve then
    update public.trainer_clients set client_id=auth.uid(),status='accepted',accepted_at=now()
      where id=p_request_id and status='pending' and client_id is null and lower(invited_email)=v_email;
    if not found then raise exception 'Request unavailable. Ask your trainer to send another request.'; end if;
    return 'accepted';
  else
    delete from public.trainer_clients
      where id=p_request_id and status='pending' and client_id is null and lower(invited_email)=v_email;
    if not found then raise exception 'Request unavailable. Refresh and try again.'; end if;
    return 'declined';
  end if;
end $$;
revoke all on function public.respond_to_trainer_request(uuid,boolean) from public,anon;
grant execute on function public.respond_to_trainer_request(uuid,boolean) to authenticated;