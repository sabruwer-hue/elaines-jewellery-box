-- Secure the permanent Creation Archive.
-- Public visitors may read only published, non-private records and their associated images.
-- Archive records and unique-code counters are never deleted through normal staff access.

drop policy if exists "Public can view published archive" on public.historical_creations;
create policy "Public can view published non-private archive" on public.historical_creations
for select to anon, authenticated using (is_published = true and availability <> 'private');

drop policy if exists "Staff manage historical archive" on public.historical_creations;
create policy "Staff view historical archive" on public.historical_creations for select to authenticated
using (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));
create policy "Staff insert historical archive" on public.historical_creations for insert to authenticated
with check (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));
create policy "Staff update historical archive" on public.historical_creations for update to authenticated
using (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')))
with check (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));

drop policy if exists "Staff manage code counters" on public.creation_code_counters;
create policy "Staff view code counters" on public.creation_code_counters for select to authenticated
using (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));
create policy "Staff update code counters" on public.creation_code_counters for update to authenticated
using (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')))
with check (exists (select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));

drop policy if exists "Public submit creation enquiries" on public.creation_enquiries;
create policy "Public submit creation enquiries" on public.creation_enquiries for insert to anon, authenticated
with check (
 consent=true and char_length(customer_name) between 2 and 120
 and char_length(customer_email) between 5 and 254
 and char_length(message) between 5 and 3000
 and exists (select 1 from public.historical_creations c where c.id=creation_enquiries.creation_id
 and c.is_published=true and c.availability<>'private' and c.creation_code=creation_enquiries.creation_code)
);

update storage.buckets set public=false where id='creation-archive';
drop policy if exists "Public view archive images" on storage.objects;
drop policy if exists "Public view published archive images" on storage.objects;
create policy "Public view published archive images" on storage.objects for select to anon, authenticated
using (bucket_id='creation-archive' and exists (
 select 1 from public.historical_creations c where c.is_published=true and c.availability<>'private'
 and c.image_paths @> array[storage.objects.name]
));
drop policy if exists "Staff view archive images" on storage.objects;
create policy "Staff view archive images" on storage.objects for select to authenticated
using (bucket_id='creation-archive' and exists (
 select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')
));

create table if not exists public.creation_enquiry_rate_limits (
 normalized_email text primary key, window_started_at timestamptz not null default now(),
 submission_count integer not null default 0, updated_at timestamptz not null default now()
);
alter table public.creation_enquiry_rate_limits enable row level security;
revoke all on public.creation_enquiry_rate_limits from anon, authenticated;
grant all on public.creation_enquiry_rate_limits to service_role;

create or replace function public.enforce_creation_enquiry_rate_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_email text:=lower(trim(new.customer_email)); v_count integer;
begin
 insert into public.creation_enquiry_rate_limits(normalized_email,window_started_at,submission_count,updated_at)
 values(v_email,now(),1,now())
 on conflict(normalized_email) do update set
 submission_count=case when public.creation_enquiry_rate_limits.window_started_at<now()-interval '30 minutes' then 1 else public.creation_enquiry_rate_limits.submission_count+1 end,
 window_started_at=case when public.creation_enquiry_rate_limits.window_started_at<now()-interval '30 minutes' then now() else public.creation_enquiry_rate_limits.window_started_at end,
 updated_at=now()
 returning submission_count into v_count;
 if v_count>3 then raise exception 'Too many archive enquiries from this email address. Please try again later.' using errcode='P0001'; end if;
 return new;
end; $$;
drop trigger if exists creation_enquiry_rate_limit on public.creation_enquiries;
create trigger creation_enquiry_rate_limit after insert on public.creation_enquiries
for each row execute function public.enforce_creation_enquiry_rate_limit();

revoke execute on function public.enforce_creation_enquiry_rate_limit() from public, anon, authenticated;

create policy "No direct access to archive enquiry rate limits" on public.creation_enquiry_rate_limits for all to anon, authenticated using (false) with check (false);
