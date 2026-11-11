# Elaine's Jewellery Box — Updated Master Audit
**Audit date:** 11 November 2026  
**Repository:** `sabruwer-hue/elaines-jewellery-box`  
**Supabase project:** `jakcqdeyvbbgdwctomdu`  
**Status:** Source/backend audit with deployment checks; live customer acceptance tests remain outstanding.

> This report supersedes the function-version and public-table-count snapshots in the earlier `AUDIT-2026-11-11.md`. It does not claim a live end-to-end test where one was not possible.

## 1. Audit scope and evidence
Reviewed the current public website source, Designer Studio page and client script, PWA service worker, homepage navigation, privacy notice, public Geranemo, admin Geranemo, public-intake, Studio quote portal, Yoco checkout and webhook functions, Supabase table metadata, storage bucket configuration, database advisors and GitHub Pages workflow runs.

The execution environment could not resolve/fetch the custom domain or Supabase HTTP endpoints. Therefore this audit confirms deployed code/configuration and CI status, but does **not** prove that a real browser session, OpenAI request, manager handover, quotation, email or payment completed successfully. No real payment or customer enquiry was created for testing. Secret values were not read or exposed.

## 2. Current deployed Supabase functions
All seven functions below were reported ACTIVE at the time of this audit.

| Function | Version | JWT verification | Purpose / status |
|---|---:|---|---|
| `geranemo-assistant` | 3 | Required | Private admin assistant; verifies user and active owner/admin staff role |
| `geranemo-public` | 5 | Disabled | Public chat, manager handover, AI design generation and staff-only private-preview signing |
| `public-intake` | 18 | Disabled | Public forms, studio enquiries and customer-care intake |
| `studio-quote-portal` | 6 | Disabled | Customer quote view, accept/decline/change response |
| `yoco-checkout` | 5 | Disabled | Server-side hosted checkout creation |
| `yoco-webhook` | 4 | Disabled | Signed Yoco payment event verification and processing |
| `send-business-email` | 3 | Required | Authenticated business email workflow |

Public functions use server-side validation and service-role access where required. CORS origin allowlisting is not treated as authentication. The public assistant is rate-limited and does not receive private admin records.

## 3. Geranemo functionality assessment

### Private admin assistant
- Edge Function is ACTIVE, version 2, with platform JWT verification enabled.
- Source verifies the session and requires an active owner/admin staff record.
- Reads `OPENAI_API_KEY` from Supabase Edge Function Secrets and calls the OpenAI Responses API.
- Existing operating rules restrict it to read, advise and prepare; it must not publish content, change prices/stock, send customer messages, issue refunds or make financial commitments.
- The model ID in source is `gpt-6-luna`, which is listed in OpenAI's API model pricing. Version 3 also explicitly recognises Designer Studio as an AI-assisted enquiry channel and warns that its supplied context does not include customer design previews. The key's validity, billing status and successful response were not verified.

**Assessment:** Backend code and access controls are present; actual AI response remains unverified.

### Public assistant and manager handover
- `geranemo-public` version 5 is ACTIVE.
- Public chat uses published business information and is separated from private admin conversations and records.
- Manager handover creates a customer-care case and returns a reference; it does not approve refunds or change orders.
- Important correction: OpenAI key availability is now checked only for AI chat/design actions, not for manager handover or staff preview access. A missing AI key should not disable the non-AI escalation path.
- Staff-only preview access validates a bearer session and active owner/admin role before issuing a one-hour signed link to a private design preview.

**Assessment:** Routes are deployed and code-level controls are present; chat and manager submission still require live tests.

### OpenAI key and model
- The backend expects a valid OpenAI API key under the exact Supabase secret name `OPENAI_API_KEY`.
- The secret value was not read. A key added to Supabase is not proof that it is a valid OpenAI API key or that the API account has billing/permissions.
- The model `gpt-6-luna` is listed on OpenAI's API pricing page. The OpenAI image-generation guide states that GPT-5 and newer models support the Responses API image-generation tool; image generation may require API organization verification.
- API usage is billed separately from a ChatGPT subscription.

## 4. Elaine's Designer Studio — implemented
Added `designer-studio.html` and `designer-studio.js`, linked from the main navigation and homepage, added to the sitemap and PWA cache.

Customer departments:
- Jewellery design
- Furniture design
- Creative objects and décor
- Restoration and redesign

Customer flow:
1. Describe an item, style, materials, dimensions and budget guidance.
2. Request an AI-generated visual concept.
3. View/open the preview and generate another concept by changing the brief.
4. Submit the selected concept for Elaine's feasibility review and quotation.
5. Receive a Studio enquiry reference; no order or payment is created at this stage.

Backend and data:
- `geranemo-public` uses the OpenAI Responses API image-generation tool.
- Image-generation requests are separately rate-limited.
- Preview images are stored in the private `studio-design-previews` bucket.
- The quotation request stores the preview path and time-limited preview URL in `studio_enquiries.customer_vision`.
- Designer Studio submissions require explicit consent and set `customer_consent_at`.
- The admin Studio queue has a staff-only button to request a fresh signed preview link.

**Limitations:** This is the first usable AI concept-generation workflow, not a professional CAD/manufacturing system. It does not calculate engineering tolerances, certify dimensions, guarantee material availability or automatically quote prices. Preview storage retention/automatic deletion still needs a business decision and implementation. AI image generation availability and API billing/organization permissions need live verification.

## 5. Website and business-data readiness
Current key table counts:

| Area | Current records |
|---|---:|
| Products | 0 |
| Product variants | 0 |
| Product images | 0 |
| Historical Creation Archive entries | 0 |
| Creation enquiries | 0 |
| Studio enquiries | 0 |
| Customer-care cases | 0 |
| Customer reviews | 0 |
| Business announcements | 0 |
| Orders | 0 |

The storefront and admin queues exist, but the business catalogue, archive and customer evidence are not populated. Do not treat demo/sample catalogue content as live stock or confirmed prices.

The review flow currently uses approval/moderation before public publication. The earlier open-review policy question remains unresolved; no moderation-policy change was made.

The Second Life Studio enquiry and quotation foundations exist, including quote revisions and customer quote responses. The quote-to-order and invoice conversion is present in the current quote portal, but no real quote acceptance or order/payment lifecycle was tested.

## 6. Yoco payments — updated finding
- `yoco-checkout` v5 and `yoco-webhook` v4 are ACTIVE.
- Checkout keeps Yoco secret keys server-side and requires both `YOCO_SECRET_KEY` and `YOCO_WEBHOOK_SECRET`.
- The webhook verifies Standard Webhooks signature headers and rejects stale/invalid signatures.
- **Fixed in v4:** `eventIdForError` and the database client were previously referenced outside their scope in the webhook error handler. Both are now declared at request scope and the database client is assigned for the catch handler.
- Yoco's own setup guidance requires registering a webhook, testing in sandbox, verifying the website domain and replacing test keys with live keys only after testing.

**Assessment:** Code-level defect fixed. Do not enable real customer payments until Yoco test/live credentials, registered webhook, domain verification and a full sandbox payment → signed webhook → invoice/order status test are confirmed.

## 7. Security and database findings
- **45 of 45 public-schema tables have Row Level Security enabled.**
- Supabase security advisor: leaked-password protection is disabled (one warning). Enable it in Supabase Auth settings.
- Performance advisor: 11 multiple-permissive-policy findings and 63 unused-index findings. These are review items; do not delete indexes or rewrite policies blindly without query/policy review.
- Private design previews are stored in a non-public bucket. The staff preview route requires an authenticated active owner/admin.
- The privacy policy remains a starter policy. Legal business name, business address, Information Officer details, retention periods and final POPIA/legal review are outstanding.
- Add retention/cleanup for generated previews and verify storage access policies before launch.

## 8. Deployment and test status
- GitHub Pages workflow for the initial Designer Studio commit completed successfully; its JavaScript syntax-check step passed.
- Follow-on commits added homepage promotion, privacy clarifications, staff preview access and the webhook fix. Their individual workflow runs must complete successfully before the latest full release is considered published.
- The custom domain and live API endpoints were inaccessible from this audit environment, so no browser acceptance or runtime API test is claimed.

## 9. Required next tests before launch
1. From the live site, generate one Designer Studio jewellery concept and one furniture concept.
2. Submit one Designer Studio quotation enquiry using explicit consent; confirm it appears in the admin Studio queue.
3. Open the private preview from the admin queue as an active owner/admin; confirm a non-staff session is denied.
4. Test public Geranemo chat with a harmless greeting and a product/service question.
5. Test “I want to speak to the manager”; submit a test customer-care case and confirm a reference and admin notification.
6. Test private admin Geranemo from the signed-in dashboard and confirm a real OpenAI response.
7. Test Yoco in sandbox from checkout creation through signed webhook processing and invoice/order status update.
8. Populate approved product images, catalogue data and Creation Archive records; confirm real prices/stock and fulfilment details.
9. Complete the legal privacy fields, choose retention periods and confirm review-publication policy.

## 10. Overall assessment
**Platform foundation:** substantial and deployed.  
**Geranemo:** deployed and correctly separated at code level, but not yet proven operational by live AI-response tests.  
**Designer Studio:** first working implementation committed and backend deployed; live generation and enquiry journey still require testing.  
**Payments:** a webhook code defect has been fixed, but live/sandbox payment acceptance is not certified.  
**Business launch readiness:** not ready for a full public sales launch until real catalogue/archive data, legal details, credentials, end-to-end tests and retention rules are completed.
