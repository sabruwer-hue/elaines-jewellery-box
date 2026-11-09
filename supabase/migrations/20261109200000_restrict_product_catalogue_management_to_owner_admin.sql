drop policy if exists categories_staff_manage on public.categories;
create policy categories_owner_admin_manage on public.categories for all to authenticated
using (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')));

drop policy if exists products_staff_manage on public.products;
create policy products_owner_admin_manage on public.products for all to authenticated
using (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')));

drop policy if exists variants_staff_manage on public.product_variants;
create policy variants_owner_admin_manage on public.product_variants for all to authenticated
using (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')));

drop policy if exists images_staff_manage on public.product_images;
create policy images_owner_admin_manage on public.product_images for all to authenticated
using (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')))
with check (exists(select 1 from public.staff_members sm where sm.user_id=(select auth.uid()) and sm.is_active=true and sm.role in ('owner','admin')));
