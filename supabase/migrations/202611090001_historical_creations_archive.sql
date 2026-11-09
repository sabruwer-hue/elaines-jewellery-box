-- Elaine's Jewellery Box: Historical Creations Archive
-- Apply in Supabase SQL Editor after reviewing the project environment.
create table if not exists public.historical_creations (
  id uuid primary key default gen_random_uuid(),
  creation_code text not null unique,
  title text not null check (char_length(title) between 2 and 160),
  category text not null,
  description text not null default '',
  materials text,
  created_on date,
  availability text not null default 'historical' check (availability in ('historical','commissionable','recreated','private')),
  is_published boolean not null default false,
  image_paths text[] not null default '{}',
  tags text[] not null default '{}',
  related_product_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.creation_code_counters (
  prefix text primary key,
  last_value bigint not null default 0
);
create or replace function public.assign_creation_code()
returns trigger language plpgsql set search_path = public as $
declare p text; n bigint;
begin
  if new.creation_code is not null and new.creation_code <> '' then
    raise exception 'Creation codes are system-generated and cannot be supplied.';
  end if;
  p := case lower(new.category)
    when 'jewellery' then 'JWL' when 'earrings' then 'ERN'
    when 'necklaces' then 'NCK' when 'bracelets' then 'BRC'
    when 'rings' then 'RNG' when 'furniture' then 'FUR'
    when 'decor' then 'DEC' when 'restorations' then 'RST'
    when 'custom creations' then 'CUS' else 'ART' end;
  insert into public.creation_code_counters(prefix,last_value) values(p,1)
  on conflict(prefix) do update set last_value = public.creation_code_counters.last_value + 1
  returning last_value into n;
  new.creation_code := 'EJB-' || p || '-' || lpad(n::text,6,'0');
  return new;
end $$;
drop trigger if exists historical_creation_code on public.historical_creations;
create trigger historical_creation_code before insert on public.historical_creations
for each row execute function public.assign_creation_code();
create or replace function public.protect_creation_code()
returns trigger language plpgsql as $$
begin
  if new.creation_code <> old.creation_code then
    raise exception 'Creation codes are permanent and cannot be changed.';
  end if;
  return new;
end $$;
drop trigger if exists historical_creation_code_immutable on public.historical_creations;
create trigger historical_creation_code_immutable before update on public.historical_creations
for each row execute function public.protect_creation_code();
create or replace function public.touch_historical_creation()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists historical_creation_touch on public.historical_creations;
create trigger historical_creation_touch before update on public.historical_creations
for each row execute function public.touch_historical_creation();

create table if not exists public.creation_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('EJB-REQ-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  creation_id uuid not null references public.historical_creations(id) on delete restrict,
  creation_code text not null,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (char_length(customer_email) <= 254),
  customer_phone text,
  request_type text not null check (request_type in ('exact_recreation','similar_design','customised')),
  message text not null check (char_length(message) between 5 and 3000),
  status text not null default 'new' check (status in ('new','reviewing','quoted','accepted','declined','completed')),
  consent boolean not null default false check (consent = true),
  created_at timestamptz not null default now()
);
create index if not exists historical_creations_public_idx on public.historical_creations(is_published,category,created_at desc);
create index if not exists historical_creations_code_idx on public.historical_creations(creation_code);
create index if not exists creation_enquiries_created_idx on public.creation_enquiries(created_at desc);

alter table public.historical_creations enable row level security;
alter table public.creation_enquiries enable row level security;
alter table public.creation_code_counters enable row level security;
drop policy if exists "Public can view published archive" on public.historical_creations;
create policy "Public can view published archive" on public.historical_creations for select using (is_published = true);
drop policy if exists "Staff manage historical archive" on public.historical_creations;
create policy "Staff manage historical archive" on public.historical_creations for all to authenticated
using (exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')));
drop policy if exists "Public submit creation enquiries" on public.creation_enquiries;
create policy "Public submit creation enquiries" on public.creation_enquiries for insert to anon, authenticated
with check (consent = true and char_length(customer_name) between 2 and 120 and char_length(customer_email) <= 254 and char_length(message) between 5 and 3000 and exists(select 1 from public.historical_creations c where c.id=creation_id and c.is_published=true and c.creation_code=creation_enquiries.creation_code));
drop policy if exists "Staff manage creation enquiries" on public.creation_enquiries;
create policy "Staff manage creation enquiries" on public.creation_enquiries for all to authenticated
using (exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')));
create policy "Staff manage code counters" on public.creation_code_counters for all to authenticated
using (exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('creation-archive','creation-archive',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Public view archive images" on storage.objects;
create policy "Public view archive images" on storage.objects for select using (bucket_id='creation-archive');
drop policy if exists "Staff upload archive images" on storage.objects;
create policy "Staff upload archive images" on storage.objects for insert to authenticated
with check (bucket_id='creation-archive' and exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')));
drop policy if exists "Staff update archive images" on storage.objects;
create policy "Staff update archive images" on storage.objects for update to authenticated
using (bucket_id='creation-archive' and exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')))
with check (bucket_id='creation-archive' and exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')));
drop policy if exists "Staff delete archive images" on storage.objects;
create policy "Staff delete archive images" on storage.objects for delete to authenticated
using (bucket_id='creation-archive' and exists(select 1 from public.staff_members s where s.user_id=auth.uid() and s.is_active=true and s.role in ('owner','admin')));

-- Explicit Data API privileges; row-level security above remains authoritative.
grant select on public.historical_creations to anon, authenticated;
grant insert, update, delete on public.historical_creations to authenticated;
grant insert on public.creation_enquiries to anon, authenticated;
grant select, update on public.creation_enquiries to authenticated;
grant select, insert, update on public.creation_code_counters to authenticated;
