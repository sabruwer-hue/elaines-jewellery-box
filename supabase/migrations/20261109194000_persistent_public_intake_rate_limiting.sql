create table if not exists public.public_intake_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  submission_count integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.public_intake_rate_limits enable row level security;
revoke all on public.public_intake_rate_limits from anon, authenticated;
grant all on public.public_intake_rate_limits to service_role;
create policy "No direct access to public intake rate limits"
on public.public_intake_rate_limits for all to anon, authenticated
using (false) with check (false);

create or replace function public.consume_public_intake_rate_limit(
  p_ip_hash text, p_limit integer default 8, p_window_seconds integer default 600
) returns boolean
language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
  if p_ip_hash !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_limit > 100
     or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit parameters' using errcode='22023';
  end if;
  insert into public.public_intake_rate_limits(ip_hash,window_started_at,submission_count,updated_at)
  values(p_ip_hash,now(),1,now())
  on conflict(ip_hash) do update set
    submission_count=case
      when public.public_intake_rate_limits.window_started_at < now() - make_interval(secs=>p_window_seconds) then 1
      else public.public_intake_rate_limits.submission_count+1 end,
    window_started_at=case
      when public.public_intake_rate_limits.window_started_at < now() - make_interval(secs=>p_window_seconds) then now()
      else public.public_intake_rate_limits.window_started_at end,
    updated_at=now()
  returning submission_count into v_count;
  return v_count <= p_limit;
end; $$;
revoke execute on function public.consume_public_intake_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_public_intake_rate_limit(text,integer,integer) to service_role;
