# Elaine's Jewellery Box — final launch checklist

This checklist separates work that can be completed in the public repository from owner-only setup. The current site is a static prototype; **do not collect real customer, payment, or confidential information until a secure backend and owner authentication are deployed and tested.**

## Current repository status
- [ ] Replace demo products and placeholder imagery with approved product photos, names, descriptions, prices, availability, and delivery/collection terms.
- [ ] Confirm the official contact email and business contact details; replace any placeholder address in the site.
- [ ] Confirm the public domain and configure HTTPS.
- [ ] Keep the admin gateway unpublished or protected until authentication and server-side authorization are working. An obscure URL is not access control.
- [ ] Choose and configure a backend/database, private file storage, and transactional email provider. Keep credentials in provider secrets/environment variables, never in Git or browser JavaScript.
- [ ] Implement owner-only login, server-side authorization on every admin operation, secure sessions, rate limiting, audit history, backup/restore, and privacy controls.
- [ ] Connect real product/catalogue, stock, customer enquiry, project, order, quote, invoice, review moderation, referral attribution, and notification records to the backend.
- [ ] Implement secure photo upload with file type/size validation, private storage, consent, and access controls.
- [ ] Implement quote and invoice records with version history and a written roadmap attached to every quote, invoice, and AI design suggestion.
- [ ] Implement A4 print/PDF output and evidence-ready case bundles with dates, versions, approvals, source attachments, and clear draft/amended labels.
- [ ] Add customer-facing privacy notice, terms, returns/refunds, delivery/collection, and review/photo consent wording; obtain appropriate South African legal/accounting review before launch.
- [ ] Complete accessibility, mobile, form validation, error handling, security, and end-to-end testing before accepting live orders.

## Payment and launch checks (owner actions)
- [ ] Confirm PayGate merchant approval and that the merchant account is approved for this business/site, not merely another business.
- [ ] Obtain PayGate's current integration credentials and configure them as server-side secrets only.
- [ ] Use PayGate's supported hosted/redirect or tokenized flow; never store card details.
- [ ] Configure and test payment initiation, signed server-side notifications, reconciliation, failed/cancelled payments, refunds, and order status updates in sandbox before live mode.
- [ ] Confirm the business bank/merchant account, settlement, fees, and required compliance documents directly with the provider.
- [ ] Provide real products, photos, prices, stock, delivery/collection rules, and contact details.
- [ ] Test the entire customer journey on a phone and desktop: enquiry, quote approval, payment, order updates, review, and owner response.

## Android APK
- The repository has a GitHub Actions workflow intended to produce a **debug APK**. A debug APK is for testing, not a signed production release.
- Run the workflow from GitHub: **Actions → Build Android APK → Run workflow**. If it succeeds, download the APK from the generated GitHub Release.
- Before distributing a production APK, configure secure signing and verify the release build. Keep signing keys and passwords outside the repository.
- The APK is a client for the website; it does not create a backend or make the admin gateway secure.

## Safe go-live rule
Do not switch on live checkout or collect sensitive customer information until the backend, owner access controls, privacy/storage rules, payment callbacks, backups, and end-to-end tests have all been verified. Mark every unimplemented feature honestly rather than presenting a demo as live.
