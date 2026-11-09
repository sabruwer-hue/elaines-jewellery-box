# Elaine's Jewellery Box

Responsive jewellery-first storefront and installable Progressive Web App, with an automated Android debug APK build and release download.

## Included
- Responsive warm handmade storefront.
- Second Life Studio introduction and enquiry email-draft flow.
- PWA manifest, service worker and install prompt.
- Native share sheet and browser-generated referral URL.
- GitHub Actions workflow that builds and publishes an Android debug APK release.

## APK download
After a successful Android build, the APK is published as a prerelease asset. The in-app Android APK button points to the latest published release asset. The first build is triggered by a qualifying push to main or manually from the Actions tab.

This is a debug APK for testing, not a signed production release. Android may warn users that it was downloaded outside the Play Store.

## Hosting
Enable GitHub Pages in repository Settings → Pages → Deploy from branch → main / root. The Capacitor wrapper loads the GitHub Pages site at https://sabruwer-hue.github.io/elaines-jewellery-box/. Confirm the published Pages URL before distributing the APK.

## Private admin gateway
A mobile-friendly private owner workspace is available directly at `admin.html` (it is intentionally not linked from the public storefront). Sign-in uses Supabase Auth and checks the signed-in user against the active staff roster before revealing customer records. The live workspace supports staff sign-in, product/stock creation, order viewing, Second Life Studio enquiry review and status updates, customer-care case review and status updates, review moderation, homepage announcements, notification preferences, a daily briefing, and Geranemo's read/advise/prepare connection. The invoice register now supports draft invoices linked to accepted orders or Studio quotes, printable customer copies, issue-state recording, pending payment entries and manual payment verification. Quote creation/issuance, customer accounts, checkout/payment gateway capture, automated transactional email wiring, full customer correspondence, product photo uploads, completed-project photo archive and full reporting remain unfinished. The agreed full scope and security requirements are in [ADMIN-GATEWAY.md](ADMIN-GATEWAY.md).

## Prototype limitations before launch
The public storefront now accepts Second Life Studio enquiries, customer reviews and customer-care messages through a server-side intake function. Approved reviews, published announcements and published products can be displayed from Supabase. Real product photography and inventory still need to be entered. Checkout, PayGate, private file upload workflows, Studio quote creation/issuance, automated invoice email delivery and referral tracking remain unfinished. Private record and product-image Storage buckets are configured with access policies; the admin upload interface still needs to be connected. Referral URLs currently create a shareable browser code only; referrals are not yet tracked. Confirm the contact email and business details. Product cards are examples only.

Never commit payment credentials or private API keys. Production payments and customer data require server-side services, access controls, backups and POPIA review.

## Automated email setup (prepared)
A staff-authenticated Supabase Edge Function named `send-business-email` has been deployed to the Elaine's Jewellery Box Supabase project. It uses Resend for transactional email and checks the signed-in user's active staff record before sending. It does not expose the service-role key or payment settings to the browser.

Before email can actually be sent, configure these Edge Function secrets in Supabase → Edge Functions → Secrets:
- `RESEND_API_KEY`: the API key from a Resend account.
- `ELB_FROM_EMAIL`: the verified sender, for example `Elaine's Jewellery Box <orders@your-verified-domain>`.
- `ELB_ALLOWED_ORIGIN`: optional, set to the exact published shop origin to restrict browser calls.

In Resend, add and verify a domain owned for Elaine's Jewellery Box, publish the DNS records Resend supplies (SPF/DKIM, and DMARC recommended), and create a sender address such as `orders@...`. The sender does not have to be the same as the public contact/reply-to address. A mailbox/alias must exist if Elaine needs to receive replies. Never use Tiny Monsters Club's sender unless that is deliberately chosen and authorized.

The deployed function is an email-sending building block only. The existing storefront and admin screens still need transactional email wiring. No automated order/quote/review emails are active. Do not treat email automation as live until the secrets are configured and the complete order → quote → acceptance → payment workflow has been connected and tested.
