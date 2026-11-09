# Elaine's Jewellery Box — master completion and launch checklist

Last reconciled against the repository and connected Supabase project: 9 November 2026.

This is the working checklist. Status labels distinguish deployed foundations from completed, tested customer workflows. Do not mark a workflow complete merely because a screen, table or function exists.

## A. Implemented foundations

- [x] Public storefront and custom domain deployment.
- [x] Black-and-gold EBJ SVG logo artwork displayed in public headers and footers.
- [x] PWA manifest, service worker and public icon artwork.
- [x] Supabase project active and healthy.
- [x] Supabase Auth owner/admin sign-in with active staff roster checks.
- [x] Public intake Edge Function deployed (version 10).
- [x] Persistent public-intake rate limiting using hashed IP identifiers.
- [x] Creation Archive schema, permanent category-based codes and immutable-code trigger.
- [x] Archive owner/admin management page and public search/detail/enquiry page.
- [x] Archive database privacy rules: only published, non-private creations are public.
- [x] Creation Archive Storage bucket private, with signed public image access restricted to published, non-private records.
- [x] Archive record delete action removed; hide/unpublish is the normal retirement action.
- [x] Archive enquiry rate limiting by email address.
- [x] Studio quotation builder with line items, scope, assumptions, exclusions, deposit, payment terms, roadmap and versioned revisions.
- [x] Customer quotation portal for accept, decline and request changes.
- [x] Invoice draft/register foundation with printing and manual payment verification.
- [x] Admin queues for products, orders, Studio enquiries, customer care, reviews and announcements.
- [x] Admin notification inbox and preferences.
- [x] Geranemo read/advise/prepare foundation.
- [x] Pages JavaScript syntax-check workflow.
- [x] Android admin debug APK build workflow.
- [x] APK link no longer points to obsolete build 17; it links to the releases page.
- [x] Public homepage, archive, Privacy and Terms source checks run; homepage checker score 100/100, archive 97/100, Privacy 94/100, Terms 94/100. These are HTML-source checks, not live performance or end-to-end tests.

## B. Security and launch blockers

- [x] Restrict archive public reads to published, non-private records.
- [x] Make archive image bucket private and restrict signed-image access.
- [x] Remove normal staff DELETE access to permanent historical creation records.
- [x] Restrict direct client access to rate-limit tables and trigger functions.
- [ ] Enable Supabase Auth leaked-password protection. This is a dashboard Auth setting; the current security advisor still reports it disabled.
- [ ] Complete full RLS review across all customer, financial, order, project and attachment tables.
- [ ] Verify archive public/private access using real anonymous browser/API tests.
- [ ] Verify archive image signed URLs for public, hidden and private records.
- [ ] Add CAPTCHA or equivalent challenge if spam persists; rate limits are not a substitute for abuse monitoring.
- [ ] Verify all customer photo uploads use private storage, strict file validation and consent.
- [ ] Configure and test backups and an actual restore.
- [ ] Test owner/admin/staff permission boundaries and session recovery.
- [ ] Complete POPIA retention, access, correction and deletion handling.

## C. Public storefront and shop

- [ ] Populate the currently empty storefront catalogue with approved products, photographs, descriptions, prices and stock.
- [ ] Connect the storefront to published product and variant records; provide an honest empty state until real products exist.
- [x] Basic product editing, price/stock adjustment, category creation and private product-photo upload controls implemented.\n- [ ] Complete category editing/deactivation and product category reassignment.\n- [ ] Verify product uploads, signed image delivery, publish/unpublish and stock display end-to-end.
- [ ] Build the agreed pre-loved/second-hand catalogue area.
- [ ] Confirm collection, delivery, shipping fees and service areas.
- [ ] Implement cart and secure checkout.
- [ ] Decide whether customer accounts are required; if so, implement registration, login, order history and account recovery.
- [ ] Confirm the payment provider (PayGate, Yoco or another provider) and correct merchant account before integration.
- [ ] Implement hosted/tokenised payment initiation, signed server-side callbacks, payment reconciliation, cancellation, failed payment and refunds.
- [ ] Implement order confirmation, fulfilment status, delivery/collection confirmation and customer notifications.
- [ ] Add a verified WhatsApp contact/order route if Elaine wants WhatsApp ordering.

## D. Creation Archive

- [x] Public archive page with search, category and availability filters.
- [x] Permanent category-based unique creation codes.
- [x] Creation details and exact/similar/custom recreation enquiry.
- [x] Staff archive manager with publish/hide and edit actions.
- [x] Archive image access protected by private bucket and expiring signed URLs.
- [x] Permanent archive record delete action removed.
- [x] Enquiry rate limit: maximum three accepted submissions per email per 30-minute window.
- [ ] Add historical creations and approved original photographs. Current archive record count is zero.
- [ ] Test every category's code generation and verify codes are never reused.
- [ ] Add bulk image upload, image processing/resizing and pagination.
- [ ] Add owner notification for new archive enquiries.
- [ ] Link accepted recreation enquiries to Studio quotes and eventual product/project records where appropriate.

## E. Second Life Studio, quotations and invoices

- [x] Studio enquiry review and accept/decline status foundation.
- [x] Quote builder with line items, project scope, assumptions, exclusions, deposit and payment terms.
- [x] Written production roadmap steps on quotations.
- [x] Draft saving and quotation version history.
- [x] Customer secure quotation portal with accept/decline/request changes.
- [x] Invoice draft creation linked to eligible orders or accepted Studio quotes.
- [x] Invoice printing and manual payment verification foundation.
- [ ] Implement customer reference-photo upload and private attachment viewing.
- [ ] Add design concept generation with clear AI-illustrative labels and owner approval.
- [ ] Confirm Resend API key, verified sender domain and sender address; test delivery and replies.
- [ ] Run a real end-to-end Studio enquiry → owner acceptance → quote → customer response → invoice → payment verification test.
- [ ] Add a complete fulfilment roadmap to every invoice.
- [ ] Complete A4 print/PDF output and version/evidence bundles for all relevant records.

## F. Admin operations, customer care and completed projects

- [x] Owner/admin login and staff roster checks.
- [x] Product creation and basic order viewing.
- [x] Studio enquiry queue and status updates.
- [x] Customer-care case submission and status queue.
- [x] Review moderation.
- [x] Homepage announcement management.
- [x] Notification inbox and preferences.
- [ ] Complete customer/staff correspondence and reply-by-email history.
- [ ] Complete customer attachment viewing and secure downloads.
- [ ] Build Completed Project Library with before/after photos, materials, dates, permissions and linked records.
- [ ] Add owner approval and audit history for every public project case study.
- [ ] Complete printable case bundles for complaints, orders, quotes, invoices and projects.

## G. Finance, reporting and Geranemo

- [x] Invoice register and invoice line/payment-record schema.
- [x] Draft invoice creation and manual payment verification.
- [ ] Confirm business identity, tax registration and invoice wording with Elaine/accountant.
- [ ] Complete business expenses, refunds and payment reconciliation.
- [ ] Complete revenue, margin, stock movement, quote conversion and profitability reports.
- [ ] Clearly distinguish actual data from estimates.
- [x] Geranemo advisory interface and deployed Edge Function foundation.
- [ ] Verify AI provider secret and live response.
- [ ] Complete broader authorised data access and source-linked answers.
- [ ] Complete AI action approval, audit trail and owner-editable preferences.
- [ ] Implement design concept + implementation roadmap workflow.
- [ ] Complete Cosmo BI integration.

## H. Brand, legal and content

- [x] Public black-and-gold identity and EBJ logo artwork displayed.
- [x] Copyright notice and “Built by Liquid Digital Art” credit.
- [x] Privacy Policy starter page.
- [x] Terms & Conditions starter page.
- [x] Canonical, Open Graph and favicon metadata added to public, archive and legal pages.
- [ ] Confirm registered/legal business name, physical/business address and Information Officer details.
- [ ] Confirm privacy contact and retention periods.
- [ ] Complete delivery, collection, cancellation, returns, refunds, repairs and warranty policies.
- [ ] Obtain South African legal/accounting review; starter wording is not legal advice.
- [ ] Add real products, archive records, approved photos and business announcements.

## I. Real-world testing and release

- [x] Latest verified Pages deployment succeeded (run #148).
- [x] Android admin debug APK build #38 succeeded.
- [ ] Test the live website on Android and desktop browsers.
- [ ] Test PWA install/update/offline behaviour.
- [ ] Install and test the debug APK on a physical Android device.
- [ ] Configure secure APK signing before production distribution.
- [ ] Test all forms with valid, invalid, duplicate and abusive submissions.
- [ ] Test all customer/admin journeys end-to-end with controlled test records.
- [ ] Verify email delivery, reply handling and notification preferences.
- [ ] Verify backup restore and incident recovery.
- [ ] Complete security, accessibility, mobile and performance QA.
- [ ] Only then approve live orders/payments and public launch.

## Owner-supplied information still required

Do not guess or invent these details:
1. Registered/legal business name and business address.
2. Information Officer name/contact and retention periods.
3. Final payment provider and merchant account.
4. Verified sending domain, sender email and Resend API key.
5. Actual products, prices, stock, photos and delivery/collection terms.
6. Historical creation photos and metadata.
7. Approved returns, cancellation, repair and warranty policies.

## Safe go-live rule

The website may remain publicly viewable while the shop is clearly marked as a catalogue/enquiry experience. Do not enable live checkout or accept online payments until the relevant payment, customer-data, privacy, email, backup and end-to-end controls are verified.
