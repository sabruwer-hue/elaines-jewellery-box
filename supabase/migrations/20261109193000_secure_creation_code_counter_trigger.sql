-- Keep the permanent code counter inaccessible to clients while allowing the
-- trusted insert trigger to allocate unique, never-reused creation codes.
alter function public.assign_creation_code() security definer;
alter function public.assign_creation_code() set search_path = public;
revoke execute on function public.assign_creation_code() from public, anon, authenticated;
