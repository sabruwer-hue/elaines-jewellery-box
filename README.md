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
A mobile-friendly owner gateway preview is available at `admin.html`, linked from the storefront footer. It includes navigation for orders, Second Life Studio, quotes and roadmaps, invoices and payment roadmaps, customer care, completed projects, reviews, reports, Geranemo and security settings. Print actions use the browser print dialog so records can be saved as PDF. This is a front-end preview only, not a secure live admin system; it contains no live customer records and does not save form data. The agreed full scope and security requirements are in [ADMIN-GATEWAY.md](ADMIN-GATEWAY.md). A real backend, owner authentication, private database/storage, notifications and server-side AI integration must be configured before real business data can be used.

## Prototype limitations before launch
This first front-end release does not yet include a secure backend, customer accounts, persistent products/orders, secure photo uploads, quotations, invoices, PayGate, live admin backend, review moderation, or server-side referral attribution/rewards. Referral URLs currently create a shareable browser code only; referrals are not yet tracked. Confirm the contact email and business details. Product cards are examples only.

Never commit payment credentials or private API keys. Production payments and customer data require server-side services, access controls, backups and POPIA review.
