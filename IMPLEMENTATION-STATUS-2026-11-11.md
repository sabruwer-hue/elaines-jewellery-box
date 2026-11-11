# Elaine's Jewellery Box — Implementation Status
**Date:** 11 November 2026  
**Repository:** `sabruwer-hue/elaines-jewellery-box`  
**Supabase project:** `jakcqdeyvbbgdwctomdu`

## Delivered in this implementation pass

### Archive custom-order request experience
- Added a multi-item request basket to `archive.html` / `archive.js`.
- Customers can add Archive creations and external inspiration links, set quantity and request type (exact recreation if possible, similar design, customised version, inspiration only), and submit one combined request.
- Archive listings show POA (Price on Application), with no public fixed price or direct payment.
- The request form captures contact details, fulfilment preference, customer notes and consent.
- External URLs are restricted to HTTP/HTTPS and item counts/quantities/text are bounded.
- Basket requests route through the protected `public-intake` Edge Function into `studio_enquiries`, including structured `request_items`, fulfilment preference and consent timestamp. Admin notifications are sent through the existing notification path.
- These are quotation requests, not paid orders. Elaine reviews feasibility and creates a quote.

### Quote acceptance → order and invoice
- Added the `studio_quotes.order_id` and `orders.studio_quote_id` relationship.
- Added a service-role-only, idempotent `convert_studio_quote_to_order` database function.
- Updated `studio-quote-portal` to convert an accepted quote into an order and issued invoice, and to store a time-limited hashed payment token on the invoice.
- Updated `quote-portal.js` to show a secure-payment action after quote acceptance when the linked order exists.
- Conversion is transactional within PostgreSQL and reuses existing order, order-item and invoice tables. The invoice uses the order as its single source record to respect the existing exactly-one-source constraint.

### Yoco Checkout API foundation
- Deployed `yoco-checkout` (v3): validates a hashed invoice payment token, computes the amount from the invoice and quote deposit in the database, reuses pending sessions, creates the checkout server-side and redirects to Yoco's hosted secure payment page.
- Deployed `yoco-webhook` (v2): verifies Yoco's Standard Webhooks HMAC signature using the raw body, checks the signed timestamp against a 3-minute replay window, deduplicates event IDs and applies payment changes through a transactional database function.
- Added `checkout_sessions`, `payment_webhook_events`, `integration_events`, and order/payment status history support. A partial unique index prevents multiple active checkouts for one invoice.
- Added a noindex `payment-result.html` return page. It explicitly says that browser return is not proof of payment.
- Checkout intentionally refuses to start unless both `YOCO_SECRET_KEY` and `YOCO_WEBHOOK_SECRET` are configured. This prevents accepting card payments without verified webhook confirmation.
- Refund API and automated refund webhooks are not yet integrated into the storefront/admin workflow; refunds remain a manual Yoco App process until a dedicated approved refund workflow is implemented.

### Future Career Guide
- Added a reserved `career_module_registry` entry for `career-guide`, API version v1.
- Reserved a separate learner profile/consent boundary and documented versioned events for future module integration. No career or learner personal data is being collected by the jewellery site.

## Deployed Supabase Edge Function versions
- `public-intake`: v16
- `studio-quote-portal`: v5
- `yoco-checkout`: v3
- `yoco-webhook`: v2

## Database foundations and security
- New internal tables have RLS enabled and explicit deny policies for `anon` and `authenticated`; service-role operations are performed only from Edge Functions.
- The quote conversion and payment-application RPCs are not executable by anon/authenticated roles; service_role has execution rights.
- Added indexes for checkout/payment and quote/order relationships after advisor review.
- No live customer data, orders, payment transactions or test charges were created during this implementation pass.
- Supabase security advisor still reports leaked-password protection disabled. Enable it in Supabase Auth settings.
- Performance advisor still reports pre-existing multiple permissive policies on several existing tables and unused indexes. Do not mass-delete unused indexes without workload evidence.

## Required merchant setup before checkout can process a payment
1. Complete Yoco merchant onboarding and add/verify `elainesjewellerybox.co.za` in Yoco Checkout API domain settings.
2. Start with Yoco **test** API key.
3. Register a Yoco webhook to:
   `https://jakcqdeyvbbgdwctomdu.supabase.co/functions/v1/yoco-webhook`
4. Save the returned webhook signing secret securely.
5. In Supabase Dashboard → Project → Edge Functions → Secrets, set:
   - `YOCO_SECRET_KEY` = Yoco test secret key
   - `YOCO_WEBHOOK_SECRET` = webhook signing secret
6. Run sandbox tests for success, failure, abandoned checkout, duplicate/replayed webhook, wrong amount/currency, partial deposit and remaining balance.
7. Only after domain verification and successful tests, replace test credentials with live credentials and register/verify the live webhook secret.
8. Do not paste keys into ChatGPT, GitHub source files or browser code.

## Not yet certified
- No Yoco merchant credentials or webhook signing secret were supplied/configured, so live checkout has not been activated or sandbox-tested.
- GitHub changes have been committed to `main`, but the live domain deployment was not independently verified from this environment.
- Full browser/device acceptance tests, payment settlement reconciliation, refund workflow, customer self-service order tracking, private image upload workflow, backup restore test and business/legal policy approval remain outstanding.
- The quote-to-order and webhook SQL functions have been checked against the current database constraints and privilege grants, but no real customer quote has been accepted to exercise the complete journey.

## Release position
The Archive basket and quote/order conversion path are implemented. The payment integration is deployed but deliberately gated until the merchant credentials and signed webhook are configured and sandbox tests pass. Do not advertise live online payment availability yet.

 
## Addendum — 11 November 2026: Geranemo, Designer Studio and payment audit
- Added the public `Designer Studio` page and client workflow for jewellery, furniture, creative objects/décor, and restoration/redesign concepts.
- Added AI image generation through `geranemo-public` v5, private preview storage, explicit consent for quotation submission, and preview path capture in Studio enquiries.
- Added a staff-only signed-preview route in `geranemo-public` and a View private AI preview action in the admin Studio queue.
- Updated the public Geranemo knowledge base to explain Designer Studio and the difference between a concept and an order.
- Updated the homepage navigation/CTA, sitemap, PWA cache and privacy notice.
- Updated `public-intake` to v18 to capture Designer Studio consent timestamps.
- Fixed the Yoco webhook error-handler variable-scope defect; deployed `yoco-webhook` v4.
- GitHub Pages CI syntax-check passed on the initial Designer Studio implementation commit. Later follow-on commits have their own deployment runs.
- **Not yet certified:** live AI responses, image-generation availability, manager handover submission, admin preview signing, Yoco sandbox payment, live custom-domain/browser journey.
- **Outstanding launch work:** populate products and archive, complete legal/privacy placeholders and retention rules, resolve Supabase Auth leaked-password warning, review 11 multiple-policy and 63 unused-index findings, and run end-to-end acceptance tests.

- Updated private `geranemo-assistant` to v3 so its instructions recognise Designer Studio, distinguish illustrative concepts from production specifications and disclose that its supplied context does not include individual preview images.
