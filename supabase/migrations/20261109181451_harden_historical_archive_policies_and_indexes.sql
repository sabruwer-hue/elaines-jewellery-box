-- Follow-up hardening applied to the connected production database.
alter function public.protect_creation_code() set search_path = public;
alter function public.touch_historical_creation() set search_path = public;
create index if not exists creation_enquiries_creation_id_idx on public.creation_enquiries(creation_id);
create index if not exists historical_creations_created_by_idx on public.historical_creations(created_by);
drop policy if exists "Staff manage historical archive" on public.historical_creations;
create policy "Staff manage historical archive" on public.historical_creations for all to authenticated
using(exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')))
with check(exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));
drop policy if exists "Staff manage creation enquiries" on public.creation_enquiries;
create policy "Staff manage creation enquiries" on public.creation_enquiries for all to authenticated
using(exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')))
with check(exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));
drop policy if exists "Staff manage code counters" on public.creation_code_counters;
create policy "Staff manage code counters" on public.creation_code_counters for all to authenticated
using(exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')))
with check(exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.is_active=true and s.role in ('owner','admin')));
