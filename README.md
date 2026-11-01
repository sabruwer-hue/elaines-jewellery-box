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
A mobile-friendly owner gateway preview is available at `admin.html`, linked from the storefront footer. It includes navigation for orders, Second Life Studio, quotes and roadmaps, invoices and payment roadmaps, customer care, completed projects, reviews, reports, Geranemo and security settings. Print actions use the browser print dialog so records can be saved as PDF. This is a front-end preview only, not a secure live admin system; it contains no live customer records and does not save form data. The agreed full scope and security requirements are in [ADMIN-GATEWAY.md](ADMIN-GATEWAY.md). The current live scope does not yet include private photo uploads, customer accounts, checkout/payment capture, automated email notifications, live quote/invoice issuance, full customer chat, or Geranemo AI. Those remain staged follow-up work.

## Prototype limitations before launch
The public storefront now accepts Second Life Studio enquiries, customer reviews and customer-care messages through a server-side intake function. Approved reviews, published announcements and published products can be displayed from Supabase. Real product photography and inventory still need to be entered. Checkout, PayGate, private uploads, quote/invoice issuance and referral rewards remain unfinished. Referral URLs currently create a shareable browser code only; referrals are not yet tracked. Confirm the contact email and business details. Product cards are examples only.

Never commit payment credentials or private API keys. Production payments and customer data require server-side services, access controls, backups and POPIA review.

## Automated email setup (prepared)
A staff-authenticated Supabase Edge Function named `send-business-email` has been deployed to the Elaine's Jewellery Box Supabase project. It uses Resend for transactional email and checks the signed-in user's active staff record before sending. It does not expose the service-role key or payment settings to the browser.

Before email can actually be sent, configure these Edge Function secrets in Supabase → Edge Functions → Secrets:
- `RESEND_API_KEY`: the API key from a Resend account.
- `ELB_FROM_EMAIL`: the verified sender, for example `Elaine's Jewellery Box <orders@your-verified-domain>`.
- `ELB_ALLOWED_ORIGIN`: optional, set to the exact published shop origin to restrict browser calls.

In Resend, add and verify a domain owned for Elaine's Jewellery Box, publish the DNS records Resend supplies (SPF/DKIM, and DMARC recommended), and create a sender address such as `orders@...`. The sender does not have to be the same as the public contact/reply-to address. A mailbox/alias must exist if Elaine needs to receive replies. Never use Tiny Monsters Club's sender unless that is deliberately chosen and authorized.

The deployed function is an email-sending building block only. The existing storefront and admin screens still need transactional email wiring. No automated order/quote/review emails are active. Do not treat email automation as live until the secrets are configured and the complete order → quote → acceptance → payment workflow has been connected and tested.
