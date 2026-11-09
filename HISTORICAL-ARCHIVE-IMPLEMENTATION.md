# Elaine's Jewellery Box — Historical Creations Archive

## Delivered in this branch
- Public archive page at `archive.html` with category and availability filters, text/code search, clickable detail dialog and creation-specific enquiry form.
- Private owner/admin manager at `archive-admin.html` using the existing Supabase Auth and `staff_members` owner/admin roster.
- Automatic permanent codes by category: EJB-JWL-000001, EJB-ERN-000001, EJB-NCK-000001, EJB-BRC-000001, EJB-RNG-000001, EJB-FUR-000001, EJB-DEC-000001, EJB-RST-000001, EJB-CUS-000001 and EJB-ART-000001.
- Database migration for archive records, creation enquiries, code allocation, immutable codes, RLS and public image bucket with staff-only writes.
- Enquiry records preserve the archive UUID and code, customer contact, request type, consent and status.
- Historical records are separate from shop products. The product relation is reserved for future linking.

## Required activation steps
1. Review and apply `supabase/migrations/202611090001_historical_creations_archive.sql` in the correct Supabase project.
2. Confirm the existing `staff_members` schema matches the policy assumptions: `user_id`, `is_active`, `role` with `owner` / `admin`.
3. Verify Supabase Storage policies and public image access in the deployed project.
4. Add approved original photographs and metadata through `/archive-admin.html`; do not invent dates or materials.
5. Add the public archive link to the existing homepage navigation and review page links.
6. Test anon public reads, anon enquiry insert, rejection of non-consensual submissions, staff-only writes, immutable code updates, linked enquiry deletion restriction and image upload restrictions.
7. Add edge-function rate limiting / CAPTCHA or equivalent anti-abuse controls before public promotion.
8. Confirm backups, retention, customer enquiry notifications and legal/privacy wording before launch.

## Known limitations / not represented as complete
- The migration is committed but has not been applied to Supabase by this change.
- The code does not automatically email Elaine; enquiries appear in the archive manager.
- Image processing/resizing, CDN transformations and bulk upload progress UI are not implemented.
- No pagination or server-side full-text search yet; current public page loads published archive rows.
- No hard delete workflow for storage images; hide records rather than delete where possible.
- No direct automatic link from archive recreations to product records yet; schema reserves related_product_id.
- No automated browser test, production deploy or live Supabase verification has been run.
- Existing legal pages remain starter drafts with business-specific placeholders to complete.
