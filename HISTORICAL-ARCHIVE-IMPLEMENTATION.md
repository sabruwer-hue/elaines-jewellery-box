# Elaine's Jewellery Box — Historical Creations Archive

## Implemented foundation

- Public archive page at `archive.html` with category and availability filters, text/code search, detail dialog and creation-specific enquiry form.
- Owner/admin manager at `archive-admin.html` using Supabase Auth and the active `staff_members` owner/admin roster.
- Automatic permanent category-based codes:
  - EJB-JWL-000001 — jewellery
  - EJB-ERN-000001 — earrings
  - EJB-NCK-000001 — necklaces
  - EJB-BRC-000001 — bracelets
  - EJB-RNG-000001 — rings
  - EJB-FUR-000001 — furniture
  - EJB-DEC-000001 — décor
  - EJB-RST-000001 — restorations
  - EJB-CUS-000001 — custom creations
  - EJB-ART-000001 — other creations
- Creation enquiries preserve the archive UUID/code, customer contact details, request type, consent, status and timestamp.
- Historical records are separate from shop products; a future product relationship is reserved.
- Archive schema and hardening migrations are applied to the connected Supabase project.
- Archive bucket is now private. The public archive requests expiring signed URLs only for image paths attached to published, non-private records. Staff can create signed URLs for their authorised archive records.
- Public table access is limited to published, non-private creations. Staff can view, insert and update records; normal staff DELETE access to permanent historical creation records has been removed. Hide/unpublish records instead.
- Creation-code allocation runs through a restricted trigger function so code-counter rows are not directly writable by client roles. Creation codes remain immutable.
- Archive enquiries are limited to three successful submissions per email address in a rolling 30-minute window.
- A public enquiry rate-limit table is not directly accessible to anonymous or authenticated client roles.

## Current activation status

The infrastructure is deployed, but the archive is not populated. The live `historical_creations` and `creation_enquiries` tables currently contain zero records. Elaine must add only real creations and approved original photographs; dates, materials and details must not be invented.

## Remaining work

1. Populate the archive with historical creations, approved photos, categories, descriptions and accurate availability.
2. Test anonymous access: published/non-private records should be visible; unpublished/private records should not be.
3. Test signed image access for published, hidden and private records.
4. Test owner/admin record creation and verify code generation across every category.
5. Confirm codes cannot be edited or reused and that hidden records remain in the database.
6. Test public enquiry submission, required consent, invalid input, honeypot and rate-limit responses.
7. Add an owner notification when a new archive enquiry arrives.
8. Add bulk image upload, image processing/resizing, pagination and server-side full-text search.
9. Link accepted recreation requests to Studio quotes, projects and products where appropriate.
10. Complete customer privacy, retention and legal wording.

## Security notes

- The archive Storage bucket must remain private. Do not switch it back to a public bucket.
- The public archive uses signed image URLs with a one-hour expiry. It should request fresh URLs when loading records.
- Never expose private customer images or unpublished creation images through a permanent public URL.
- Permanent historical creation records should be hidden/unpublished, not deleted. Preserve the unique code and original record history.
- The email rate limit and public-intake IP rate limit are abuse controls, not a substitute for CAPTCHA, monitoring or manual abuse handling.
- The archive rate-limit and public-intake rate-limit tables are not available to client roles. Their functions must remain restricted to trigger/service-role use.
- Test the live anonymous and staff workflows before declaring the archive production-ready.
