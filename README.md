# Elaine's Jewellery Box

A jewellery-first South African storefront and installable PWA, with a private owner/admin workspace, Supabase backend, Second Life Studio quotation workflow, historical Creation Archive and Android admin debug APK build.

## Current verified foundation

- Public storefront deployed through GitHub Pages at https://elainesjewellerybox.co.za/.
- Black-and-gold EBJ logo artwork displayed in the public site header and footer; SVG icon used for browser/PWA identity.
- Responsive storefront, custom-design enquiry, Second Life Studio introduction, customer-care form, review submission and homepage announcement areas.
- Supabase project is active and healthy. Owner/admin access uses Supabase Auth and the active staff roster.
- Public intake Edge Function is deployed as version 10. Public form submissions use persistent IP-hash rate limiting (8 requests per 10 minutes per observed IP); archive recreation enquiries also have a per-email limit.
- Private business records, product images and Creation Archive images use separate storage/access policies. The Creation Archive bucket is private and serves eligible public images using expiring signed URLs.
- Creation Archive supports permanent category-based creation codes, search, category/availability filters, detail views and recreation enquiries. Private/unpublished records and their images are not public.
- Second Life Studio quotation builder supports itemised costs, scope, assumptions, exclusions, deposits, payment terms, roadmap steps, draft saving and versioned revisions. A customer portal supports accept/decline/request-changes.
- Invoice workspace supports draft invoices linked to eligible orders or accepted Studio quotes, printing, issue-state recording and payment entries with manual verification.
- Admin workspace includes product creation, order viewing, Studio enquiry review, customer-care case queues, review moderation, homepage announcements, notifications and a Geranemo read/advise/prepare interface.
- GitHub Pages workflow includes JavaScript syntax checks. Latest verified Pages deployment succeeded (run #148); later repository-only source/documentation commits may trigger another run.
- Android admin APK workflow has produced debug APK build #38 successfully. The APK download link points to the GitHub releases page.

## Still not launch-ready

- No real product catalogue, product photographs, prices or stock have been entered. The homepage now shows an honest empty-catalogue message until real products are entered.
- No real historical creations have been entered into the Creation Archive yet.
- Customer cart, checkout, customer accounts, online payment gateway, payment callbacks, refunds and complete fulfilment are not implemented and end-to-end tested.
- Customer reference-photo upload for Studio requests and the completed-project photo library are incomplete.
- Automated quote/invoice/customer email delivery is not confirmed. The email provider secrets and verified sender domain must be configured and tested.
- Full customer correspondence, expense ledger, finance reconciliation, profitability reporting and complete Cosmo BI are outstanding.
- Geranemo is an advisory foundation, not a complete autonomous business assistant. Its consequential actions must remain owner-approved.
- A complete print/PDF and evidence bundle system for all record types is outstanding; current print support is limited to selected documents/views.
- Legal pages are starter drafts and still contain business-specific placeholders. South African POPIA, consumer, tax and business-specific legal review is outstanding.
- Leaked-password protection remains disabled in Supabase Auth and must be enabled in the Supabase dashboard.
- Backup/restore, production access-control, mobile and end-to-end customer journey tests remain outstanding.

## Admin access and APK

The private admin workspace is at `/admin.html` and is intentionally not linked from the public storefront. Sign-in uses Supabase Auth and checks the active owner/admin roster.

The Android APK is a **debug build for testing**, not a signed production release. Obtain the current asset from the [GitHub Releases page](https://github.com/sabruwer-hue/elaines-jewellery-box/releases). Before production distribution, configure secure signing outside the repository and verify the release build on a physical Android device.

## Email configuration

The `send-business-email` Edge Function is a building block, not proof that transactional delivery works. Configure `RESEND_API_KEY` and the appropriate verified sender secret (currently documented as `ELB_FROM_EMAIL` or the function-specific setting) in Supabase Function Secrets, verify the sending domain and complete real test deliveries before enabling customer-facing email.

## Payment configuration

No payment gateway is currently connected. Elaine must confirm which merchant/provider the business will use, confirm that the merchant account belongs to the correct business, obtain the provider's current credentials, and configure them only as server-side secrets. Use a hosted/tokenised provider flow; never collect or store card numbers in this application. Test payment success, failure, cancellation, signed callbacks, reconciliation and refunds in sandbox before live mode.

## Safe go-live rule

Do not accept live online orders or payments until products and policies are real, secure customer workflows are tested, email delivery is verified, backup/restore is tested, and South African legal/privacy requirements have been reviewed. A visible interface or database table is not proof that its workflow is production-ready.

The agreed business requirements and operating boundaries are documented in [ADMIN-GATEWAY.md](ADMIN-GATEWAY.md), with the Creation Archive details in [HISTORICAL-ARCHIVE-IMPLEMENTATION.md](HISTORICAL-ARCHIVE-IMPLEMENTATION.md).
