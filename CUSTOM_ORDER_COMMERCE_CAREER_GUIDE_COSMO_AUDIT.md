# Custom-Order Commerce, Career Guide Integration & Cosmo Feature Audit
**Prepared:** 11 November 2026  
**Repository:** `sabruwer-hue/elaines-jewellery-box`  
**Supabase project:** `jakcqdeyvbbgdwctomdu`  
**Status:** Architecture and gap audit; not a payment implementation or production certification.

## 1. Executive decision

Evolve Elaine's Jewellery Box from a catalogue-and-enquiry website into a **custom-order commerce platform** with its own branded request basket, customer checkout journey, quotation acceptance, payment gateway, order tracking, fulfilment and administration.

The public Creation Archive remains a catalogue. Historical creations, reference designs and licensed third-party inspiration may be requested, but all Archive items default to **POA — Price on Application**. No fixed public prices are displayed for Archive/custom commissions. A reference image is not a promise of exact reproduction or proof of availability.

The payment journey is deliberately two-stage:
1. Customer builds and submits a request basket. This is a request for a quotation, not a payment obligation.
2. Elaine reviews feasibility, materials, labour, complexity, sourcing, current demand/workload, delivery and risk; issues a versioned quote.
3. Customer reviews and accepts the quote and terms.
4. The system creates/activates the confirmed order and invoice, then opens a secure payment checkout for the agreed deposit or full amount.
5. Payment is confirmed by a verified server-to-server gateway webhook before the order is marked paid or production/fulfilment is released.

This avoids charging a customer before the scope and price are agreed.

## 2. Existing implementation evidence

### Existing foundations confirmed in Supabase
- `orders` and `order_items` tables exist, including customer snapshots, shipping information, ZAR amounts, payment/order status and item snapshots.
- `payments` exists with provider, provider reference, idempotency key, amount, currency and payment status.
- `invoices` exists and can relate to either an order or a Studio quote.
- Product catalogue tables exist: `products` and `product_variants`.
- The permanent archive exists: `historical_creations`, with immutable creation codes, category, availability, publication state, image paths and tags.
- Archive enquiries exist in `creation_enquiries`.
- Second Life Studio has `studio_enquiries`, `studio_quotes`, `studio_quote_lines` and `studio_quote_steps`.
- A public quote portal Edge Function (`studio-quote-portal`, active v4 at audit time) lets a customer securely view a token-linked quote and accept, decline or request changes.
- The public Archive currently inserts a `creation_enquiries` record. Its confirmation explicitly says this is an enquiry, not an order or payment.
- The existing admin workspace has order, Studio enquiry, quote and invoice sections.

### Gaps verified in the current backend
- The active Edge Function inventory contains `public-intake`, `studio-quote-portal`, `send-business-email` and `geranemo-assistant`; no dedicated Yoco checkout-creation or payment-webhook function was present in the inventory reviewed.
- `orders` has no public/anonymous insert policy in the RLS policy inventory reviewed. Public customers therefore cannot safely create orders by writing directly to the table.
- `payments` is staff-managed under the reviewed RLS policies; the public browser must never be allowed to set a payment to successful.
- The current Archive request form submits one creation enquiry at a time. It does not provide a multi-item request basket or complete customer checkout.
- The quote portal records acceptance/decline/change request, but quote acceptance is not yet demonstrated to create a confirmed order, invoice payment session or production workflow.
- Existing database records and tables do not prove that checkout, gateway settlement, refunds, reconciliation or customer order tracking work end-to-end.

**Conclusion:** There is a valuable foundation to extend. Do not replace the existing orders, payments, invoices or quote system with a second disconnected commerce database.

## 3. Recommended customer journey

### A. Browse
- Archive categories: jewellery, earrings, necklaces, bracelets, rings, furniture, décor, restorations/refurbishments, custom creations and other handmade work.
- Listing states: historical reference; may be commissioned; recreated as a new item; inspiration/reference only; unavailable; private.
- All Archive listings show **POA — Price on Application**.
- Distinguish Elaine's original work from customer-submitted references, licensed stock photography, AI-generated concepts and other third-party inspiration.
- Every image has provenance, licence/permission status, attribution requirements and source URL where relevant.
- No third-party seller image is copied or presented as Elaine's own creation without permission.

### B. Request basket / custom checkout
- Add multiple Archive entries and external inspiration links to one request.
- Per item: quantity, requested changes, size/dimensions, materials/colour preferences, budget range (optional), target date (non-guaranteed), exact recreation/similar design/custom variation, image attachments and reference URL.
- Customer details, delivery/collection preference, address where required, and explicit privacy/communication consent.
- Guest checkout should be supported initially; customer account is optional. An account can later expose order history, quote status, invoices and saved addresses.
- Display a clear summary and state: **Requesting a quote — no payment is due yet**.
- Submission returns a unique request reference and sends an acknowledgement.

### C. Quote and approval
- Admin can assess feasibility and price using configurable cost factors: materials, labour time/rate, design complexity, supplier availability, sourcing, demand/workload, packaging, shipping, risk/contingency, taxes and margin.
- Keep the calculation internal; public listing remains POA.
- Store the pricing inputs and rationale snapshot with each quote version for traceability. AI may suggest a draft but must never set or issue a binding price without human approval.
- Quote includes line items, scope, assumptions, exclusions, delivery estimate, shipping, tax treatment, deposit amount, balance due, payment terms and expiry.
- Customer can accept, decline or request changes through the secure quote portal.
- Preserve every issued quote version; never silently overwrite an accepted/issued quote.

### D. Confirmed order and payment
- Quote acceptance creates or activates a linked order using a stable idempotent operation.
- The order has a durable reference and immutable item/price/terms snapshots.
- Create invoice and payment schedule: deposit, milestones if needed, balance and any approved additional charges.
- Customer receives a branded payment page with payment amount, order/invoice reference and secure payment provider redirect.
- Payment state changes only after verified gateway webhook or a controlled staff reconciliation process.
- Support payment pending, succeeded, failed, cancelled, partially refunded, refunded and disputed states.
- Never store card numbers, CVV or raw card credentials.

### E. Fulfilment and after-sales
- Production workflow: awaiting deposit, materials sourcing, design approval, in production, quality check, ready for dispatch/collection, dispatched, delivered, completed, paused, cancelled.
- Customer-visible progress updates without exposing internal notes.
- Delivery quote/tracking or collection appointment.
- Cancellation, returns, repairs, warranty, refund and dispute workflows; policy/legal review before launch.
- Customer feedback/review request only after a verified completed order.

## 4. Payment gateway recommendation

**Recommended first provider: Yoco Checkout API**, subject to the business opening/approving its merchant account and domain verification.

Why:
- Built for a custom website/app checkout, rather than requiring the site to move to a hosted shop builder.
- Hosted secure payment page means card details stay with the payment provider.
- Server-side checkout creation and server-to-server webhook confirmation.
- Sandbox/test mode before live activation.
- South African ZAR merchant context is a good fit.

Implementation requirements:
1. Create a Yoco merchant account and complete verification.
2. Add and verify `elainesjewellerybox.co.za` as an allowed domain in Yoco.
3. Obtain test keys first; store all secrets in Supabase Edge Function Secrets, never GitHub or browser JavaScript.
4. Add a server-side Edge Function to create a checkout from an already-approved invoice/payment amount. The server calculates and verifies the amount from the database; it never trusts a browser-supplied total.
5. Redirect the customer to the Yoco-hosted payment page and return to a branded success/cancel/pending page.
6. Register a webhook endpoint. Verify its signature, timestamp/replay protection, event identity and amount/currency/order reference. Process events idempotently.
7. Reconcile the webhook event against the expected invoice/payment record. A browser redirect alone is not proof of payment.
8. Record provider references, event IDs, status transitions, timestamps and reconciliation outcomes.
9. Implement full/partial refund initiation and verified refund webhooks; staff approval required.
10. Test success, failure, abandoned checkout, duplicate webhook, delayed webhook, wrong amount, wrong currency, refund and replay scenarios in sandbox.
11. Switch to live keys only after owner approval and successful acceptance testing.

Yoco's current help guidance says Checkout API is a server-side hosted checkout, supports sandbox testing and requires a registered webhook and verified domain before live keys are unlocked. Check current fees and supported methods in the merchant account before launch; never hard-code fee assumptions.

**Important boundary:** No live payment can be enabled until Elaine's business has a verified Yoco merchant account and the test/live credentials and webhook configuration have been securely entered. Do not ask the customer to paste keys into chat or source code.

## 5. Data and integration design

Reuse existing tables and add only missing relationships/fields via versioned migrations after schema review.

Recommended additions or verification:
- Link `studio_quotes` to a resulting `orders` record (or add an explicit quote-to-order relation table if one quote may produce multiple orders).
- Add `checkout_sessions` or equivalent records: invoice/order ID, provider, provider checkout ID, redirect URL (short-lived if stored), amount, currency, idempotency key, status, expiry, created timestamp.
- Add `payment_webhook_events`: provider event ID unique constraint, event type, received timestamp, signature verification result, processing status, payload hash/minimised metadata, processed timestamp and failure reason. Avoid retaining unnecessary raw personal data.
- Add `order_status_events`: previous/new state, actor/system, timestamp, reason, customer-visible flag and correlation ID.
- Add a quote acceptance audit event and idempotent quote-to-order conversion.
- Add custom request basket and basket item records, or submit a validated basket payload into normalised request/enquiry item tables. Preserve a snapshot so catalogue changes do not rewrite what the customer asked for.
- Add archive media provenance fields: source type, source URL, creator/photographer, licence/permission, attribution text, AI-generated flag, upload owner and approval state.
- Add shipping/delivery quote and tracking fields or a dedicated fulfilment table.
- Add customer communication history linking email/status notices to quote/order/payment events.
- Store money as integer minor units (cents) with explicit currency; avoid floating-point calculations.
- Use unique constraints and idempotency keys for order creation, payment initiation, webhook handling, refunds and quote conversion.

### Security rules
- All public order/request creation goes through a validated Edge Function, not direct public table writes.
- RLS stays enabled. Customers can read only their own records; guests use high-entropy, hashed, revocable access tokens with expiry and rate limits.
- Staff access is role-scoped; sensitive financial actions require owner/admin permission.
- Payment status and amount are never writable from the customer browser.
- Webhook signature verification, replay protection, rate limiting, input validation, audit logs and secret rotation are mandatory.
- Never log secret keys, full payment credentials or unnecessary customer personal data.
- Enable MFA for privileged accounts, leaked-password protection, backup/restore tests and monitoring before live transactions.
- POPIA privacy notices, retention/deletion process, terms of sale, quote validity, cancellation/returns/refund, delivery, warranty and complaint policies require owner/legal review.

## 6. Future Career Guide integration

Prepare the architecture now, but do not build or activate this module as part of the current commerce release.

Treat **Career Guide** as an independent future module that can connect through documented APIs/events, not as a set of career-specific fields embedded in jewellery orders.

Future module boundaries:
- Career profile and learner profile, separate from commerce customer profile.
- Interests, strengths, skills, goals and user-entered experience.
- Career/occupation taxonomy and versioned source library.
- Education/training pathways, entry requirements, cost and duration, recognition/accreditation evidence, funding options and location.
- Skills-gap analysis and learning roadmap.
- Portfolio/CV evidence and milestones.
- Optional mentor, institution, employer or training-provider integrations.
- Clear provenance and last-verified dates for job-market, qualification and salary information.
- User-controlled sharing/consent and data export/deletion.
- If minors may use it: age-appropriate privacy, guardian/consent design and safeguarding review.
- AI guidance must be advisory, explain uncertainty and alternatives, avoid discriminatory steering, and never guarantee employment or admission.

Shared foundations Career Guide can reuse later:
- Identity and consent service (separate learner role/profile and access scopes).
- Event bus and versioned API contracts.
- Secure file/media storage and provenance.
- Notification and communication preferences.
- Workflow/task engine and audit events.
- Provider-neutral model router with usage budgets.
- Optional billing/entitlement layer, if the Career Guide later becomes a paid service.

Proposed integration events (versioned contracts): `career.profile.created`, `career.goal.updated`, `career.assessment.completed`, `career.pathway.saved`, `career.milestone.completed`, `career.consent.changed`. Commerce events remain separate: `commerce.quote.accepted`, `commerce.order.created`, `commerce.payment.confirmed`, `commerce.refund.completed`.

## 7. Cosmo blueprint feature-transfer audit

The Cosmo Master Blueprint (v1.0, 10 November 2026) specifies a modular platform with identity/access, application APIs, workflow/task engine, event bus, integration gateway, knowledge/provenance, audit, security, cost governance and business intelligence. It also specifies that prototypes are not production evidence and that consequential actions must be controlled outside the AI model.

### Adopt in Elaine's Jewellery Box (lightweight versions)
| Cosmo capability | Elaine's Jewellery Box adaptation | Priority |
|---|---|---|
| Component registry | Register catalogue, Archive, Second Life Studio, quotes, checkout, payment, Career Guide connector and version/status | P2 |
| Event bus | Order/quote/payment/fulfilment/email events with correlation IDs and retries | P1 |
| Workflow/task engine | Quote review, customer approval, deposit, production, shipping, refunds and escalations | P1 |
| Identity and access | Guest customer access tokens, optional accounts, staff roles, MFA and least privilege | P0 |
| Audit/decision register | Immutable history of quote versions, price approvals, payment events, refunds and status changes | P0 |
| Provenance/knowledge graph | Track original creator, source image, licence, historical record, related recreation and resulting order | P1 |
| Integration gateway | Yoco, email, shipping, future Career Guide and future Cosmo connector behind documented adapters | P1 |
| Business intelligence | Sales, gross/net margin, demand, materials, labour, quote acceptance, conversion, refunds, fulfilment time and cashflow | P1 |
| Observability/cost governance | API errors, webhook failures, email delivery, AI spend, payment reconciliation and alerts | P1 |
| Evaluation/test harness | Checkout, quote conversion, webhook replay, access-control, refund and mobile checkout tests | P0 |
| AI model router | Geranemo provider adapter, budget caps and model fallback, only after safe AI review | P2 |
| Policy/action gateway | Human approval for quotes, refunds, order cancellation, customer emails and any AI-suggested external action | P1 |

### Keep in Cosmo; do not duplicate in Elaine's app
- Main Memories Vault and Master History Vault as Cosmo-level knowledge services.
- CC, CC-SIM, TIVA, Engineer/CIPHER agent governance and central safety-policy machinery.
- Genesis source archive and Cosmo-wide research/prediction ledger.
- Cosmo's global identity/agent registry and cross-business portfolio orchestration.

Elaine's app may later connect to approved Cosmo services, but it must remain usable independently if Cosmo is offline. Public customer records must never expose restricted Genesis/Cosmo master knowledge.

## 8. Additional missing features identified

| Gap | Finding | Priority |
|---|---|---|
| Multi-item Archive request basket | Current Archive form requests one creation at a time | P1 |
| POA catalogue model | No demonstrated end-to-end POA request-to-quote workflow for Archive items | P1 |
| Quote-to-order conversion | Quote acceptance does not yet demonstrate order creation | P0 |
| Payment gateway | No dedicated gateway checkout/webhook Edge Function in active function inventory | P0 |
| Payment verification | Must be webhook-verified and reconciled; browser return is insufficient | P0 |
| Refunds/chargebacks | Payment lifecycle and customer dispute handling not demonstrated | P1 |
| Customer order tracking | No verified customer-facing account/guest tracking journey | P1 |
| Checkout shipping logic | Address/method fields exist, but shipping price/eligibility/fulfilment workflow needs validation | P1 |
| Archive provenance and licensing | Current archive model does not yet demonstrate full rights/licence/source/creator fields | P1 |
| Custom attachments | Customer reference-image upload workflow and private access controls remain outstanding | P1 |
| Quote price rationale | Internal costing snapshot and versioned price approval need a structured workflow | P1 |
| Notifications | Event-triggered order/quote/payment emails and retry/failure monitoring need end-to-end tests | P1 |
| Tax/legal documents | Business identity, tax treatment, consumer terms and privacy policy require owner/legal confirmation | P0 |
| Reconciliation/BI | Provider settlement vs internal payment/invoice/order ledger needs reports and discrepancy queue | P1 |
| Backup/restore and MFA | Previously identified launch blockers remain | P0 |
| Career Guide integration contracts | Not yet defined in existing product code; future module contract should be reserved now | P2 |
| AI guardrails | Geranemo must not autonomously set binding prices, issue refunds, charge cards or alter orders | P0 |

## 9. Recommended implementation sequence

### Phase 0 — preserve and specify
- Keep existing product, archive, quote, order, payment and invoice records.
- Create versioned migration plan and endpoint contracts.
- Confirm Yoco merchant onboarding path, domain verification, fees and business account ownership.
- Confirm legal business details, tax status and customer policies.

### Phase 1 — custom request and quote lifecycle
- Multi-item Archive request basket.
- Archive image/source provenance and licence metadata.
- Customer reference uploads with private Storage controls.
- Admin request review and cost/rationale capture.
- Quote versioning, customer acceptance and idempotent quote-to-order conversion.

### Phase 2 — payment gateway and checkout
- Yoco sandbox checkout creation function.
- Signed webhook verification and idempotent payment event processing.
- Invoice/deposit/balance payment flow.
- Branded return/pending/failure screens.
- Refund flow and staff approval.
- Payment reconciliation and discrepancy queue.

### Phase 3 — customer account and fulfilment
- Optional customer account plus secure guest order tracking.
- Quote/order/invoice/payment history.
- Shipping/collection, production status, notifications and after-sales cases.
- Business BI dashboard and event history.

### Phase 4 — Career Guide connector readiness
- Versioned API and event schemas.
- Separate Career Guide profile/consent domain.
- Shared notification, storage, identity and audit interfaces.
- Integration sandbox and test fixtures.

### Phase 5 — Cosmo connector
- Only after the platform is stable: expose narrowly scoped read/reporting APIs to Cosmo.
- Cosmo may summarise demand, margins, workload, stock and quote trends.
- All binding pricing, payments, refunds and customer commitments remain human-approved.

## 10. Release gates

Do not enable live payments until all are true:
- Yoco domain verification and live credentials are complete.
- Sandbox tests pass for success, failure, abandonment, duplicates, replay, wrong amount/currency and refunds.
- Webhook signatures are verified and idempotency is proven.
- No public client can write payment status or trusted totals.
- RLS and guest-token access tests pass for cross-customer isolation.
- Quote acceptance creates exactly one linked order.
- Invoice, order and payment totals reconcile.
- Owner has approved the terms, delivery, cancellation, returns, refund and privacy policies.
- Backups and an actual restore test are demonstrated.
- Mobile and desktop end-to-end checkout tests pass.

**Final recommendation:** Build one connected custom-order lifecycle around the existing database, with POA-first Archive listings and Yoco as the first gateway adapter. Reserve Career Guide as a separate future module using the same documented integration/event architecture. Apply Cosmo's strongest principles—provenance, auditability, workflows, permission boundaries, independent action controls and measurable BI—without importing Cosmo's full complexity into Elaine's website.


## Implementation update — 11 November 2026
The Archive multi-item POA request basket, structured request intake, quote-to-order/invoice conversion, secure Yoco checkout and webhook Edge Function foundations, and Career Guide module registry reservation have now been implemented. See `IMPLEMENTATION-STATUS-2026-11-11.md` for deployed function versions, database safeguards, manual Yoco merchant setup and outstanding release gates. Live payments remain disabled until test credentials and webhook secret are configured and sandbox tests pass.
