-- Program popularity counters. Run this migration in Supabase SQL editor.
create table if not exists public.program_stats (
  slug text primary key,
  views bigint not null default 0,
  downloads bigint not null default 0,
  popularity_baseline bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.program_stats enable row level security;

drop policy if exists "program stats are publicly readable" on public.program_stats;
create policy "program stats are publicly readable"
  on public.program_stats for select
  using (true);

create or replace function public.increment_program_stat(p_slug text, p_stat text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare new_value bigint;
begin
  if p_stat not in ('views','downloads') then
    raise exception 'Invalid program stat';
  end if;
  insert into public.program_stats (slug) values (p_slug)
  on conflict (slug) do nothing;
  if p_stat = 'views' then
    update public.program_stats set views = views + 1, updated_at = now() where slug = p_slug returning views into new_value;
  else
    update public.program_stats set downloads = downloads + 1, updated_at = now() where slug = p_slug returning downloads into new_value;
  end if;
  return new_value;
end;
$$;

revoke all on function public.increment_program_stat(text,text) from public;
grant execute on function public.increment_program_stat(text,text) to anon, authenticated;

-- Initial popularity baseline is intentionally separate from real Gym Log usage.
-- It is used only for internal sorting/feature selection, never presented as views.
insert into public.program_stats (slug, popularity_baseline)
values
('starting-strength',900),('stronglifts-5x5',850),('531',800),('push-pull-legs',780),
('upper-lower-split',740),('full-body-3-day',700),('jeff-nippard-ppl',680),('beginner-full-body-3',650),
('phul',620),('phat',600),('gzclp',580),('n-suns-531',560),('arnold-split',540),('texas-method',520),
('madcow-5x5',500),('greyskull-lp',480),('fierce-5',460),('candito-6-week',440),('531-bbb',420),
('gzcl-jacked-tan',400),('simple-sinister',380),('juggernaut-method',360),('smolov',340),('westside-conjugate',320)
on conflict (slug) do update set popularity_baseline = excluded.popularity_baseline;
