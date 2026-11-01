# Elaine's Admin Gateway — Product & Security Specification

## Purpose
A private, owner-only business command centre for Elaine. It is separate from the public storefront and is not accessible to customers. The admin gateway must work on mobile as well as desktop.

## Access and account setup
- One owner account for Elaine by default; no public registration and no shared staff accounts.
- First-time setup passphrase requested by the owner: `Elaines Oppertunity`.
- IMPORTANT: this phrase is a bootstrap/setup secret only. Never put it in client-side JavaScript, HTML, a public repository, a URL, or a committed configuration file. Configure it as a server-side secret, preferably as a one-time invitation that expires after first use.
- First successful setup requires Elaine to verify her email and create her permanent login credentials.
- Store passwords only as strong salted password hashes through a reputable authentication provider; never store or email plaintext passwords.
- Require email verification, password reset, rate limiting, secure sessions, logout, and optional two-factor authentication.
- Log security-sensitive events. Do not expose private customer records in public pages, APK assets, or GitHub Pages.
- If the bootstrap phrase has already been shared outside a private channel, rotate it before enabling setup.

## Dashboard overview
Show actionable notifications and counts for:
- New orders and awaiting orders
- New customer messages
- New complaints and suggestions
- Second Life Studio enquiries awaiting review
- Quotes awaiting preparation, customer response, or revision
- Invoices due, overdue, paid, partially paid, and refunded
- Projects in progress and completed projects awaiting publication to the library
- New reviews awaiting moderation
- Low-stock products and items needing attention

Each notification opens the relevant record. Include read/unread state, timestamps, priority, and status. Send email/push notifications only with Elaine's configured consent and preferences.

## Main admin areas
1. **Orders & Shop** — order queue, customer details, items, fulfilment status, collection/delivery, payment status, notes, and order history.
2. **Second Life Studio** — enquiry inbox, uploaded reference photos, requested transformation, review/accept/decline actions, project stages, customer correspondence, and approval history.
3. **Quotes** — guided quote builder with line items, labour, materials, validity date, deposit, revisions, and customer accept/decline/request-changes workflow. No work starts until Elaine confirms the quote and the customer accepts it.
4. **Invoices & Payments** — generate an invoice from an accepted quote or shop order; track deposits, balances, due dates, EFT proof, verified payments, refunds, and payment references. Keep quote and invoice as separate documents. PayGate integration is added only after the correct merchant account and server-side credentials are available.
5. **Completed Project Library** — completed projects with before/after photos, descriptions, dates, materials/techniques, final price where Elaine chooses to show it, customer permission, and tags/categories. Elaine approves every public-facing case study. Keep private customer photos private unless explicit publication consent is recorded.
6. **Customer Care** — complaints, suggestions, enquiries, and private customer conversations. Give every case a reference number, category, priority, owner, status, response history, and resolution notes. Customer-to-customer chat is not included.
7. **Reviews** — one-to-five-star ratings, written feedback, optional photos, verified-purchase/project indicator when provable, moderation queue, report handling, and publication controls. Never fabricate reviews.
8. **Products & Content** — product catalogue, photos, prices, stock, categories, descriptions, homepage content, policies, and featured projects.
9. **Reports & Insights** — sales and revenue over time, order conversion, average order value, best-selling categories, repeat customers, enquiry-to-quote conversion, quote acceptance, project profitability estimates, outstanding invoices, complaint themes, review trends, referral performance, and stock movement. Show date filters and explain how each metric is calculated. Distinguish actual data from estimates.
10. **Settings** — owner profile, business details, notification preferences, shipping/collection settings, tax/invoice details, payment methods, policies, security, data export, and backup status.

## Mandatory written roadmap and action plan

**Every quote, invoice, and AI-suggested design must include an accompanying written roadmap plan.** This is a required part of the document/output template, not an optional extra.

### Quotes — quote plus delivery roadmap
Every quotation must include:
- Customer request and agreed project scope.
- Proposed outcome/design and itemised materials, labour and costs.
- A step-by-step execution plan, with stages, dependencies and estimated durations.
- Milestones and customer approval checkpoints, including any design/material choices Elaine needs confirmed.
- Estimated start and completion window, clearly labelled as estimates until scheduled.
- Deposit, milestone payments and balance/payment terms.
- Assumptions, exclusions, risks and any factors that could change the price or timeline.
- What happens next: accept, decline or request changes; no work begins before Elaine approves the quote and the customer accepts it.

### Invoices — invoice plus fulfilment/payment roadmap
Every invoice must remain a proper financial document and must be accompanied by a clearly separated roadmap section or linked project/order plan. Include:
- The linked order or accepted quote reference and the agreed scope.
- Current fulfilment/project stage and the next planned steps.
- Milestones, target dates or estimated time windows, and any customer actions or approvals required.
- Itemised charges, deposit paid, payments received, outstanding balance, due date and payment instructions.
- What happens after payment and how completion, collection or delivery will be confirmed.
- Any schedule changes must be recorded and communicated; an invoice must never imply that payment alone confirms work completion.

### AI-suggested designs — concept plus implementation roadmap
Every design Geranemo suggests or helps create must include:
- Design name, purpose and description of the proposed finished result.
- Reference image or concept visual where available, with clear labelling that AI imagery is illustrative and not a guaranteed exact result.
- Suggested materials, finishes, colours, dimensions and techniques, identifying unknowns that need measurement or inspection.
- Step-by-step making/restoration plan, tools or specialist skills potentially required, and dependencies.
- Preliminary cost and time ranges only when there is a reasonable basis; label them as estimates, not customer quotations.
- Practicality, durability, safety and care considerations where relevant.
- Decision points where Elaine must approve the concept, materials, budget and final scope before a customer quote is issued or work begins.
- Alternative approaches where useful, plus the recommended next action.

### Roadmap quality and presentation
- Use plain language, numbered stages, clear responsibilities (Elaine, customer, supplier or contractor), and realistic dependencies.
- Distinguish confirmed facts, owner-approved commitments, AI suggestions and estimates.
- Include a version/date and link the roadmap to its quote, invoice, order, enquiry or design record.
- Keep an editable internal plan and a customer-facing version that excludes private notes, internal margins and sensitive business information.
- Generate a printable/downloadable PDF when the document system is implemented.
- Geranemo may draft roadmaps, but Elaine must approve customer-facing plans, prices, dates and commitments before sending.
- If information is missing, show the unknowns and questions rather than inventing measurements, costs, dates or promises.

## Geranemo — Elaine's AI business assistant
Geranemo is an advisory assistant inside the admin gateway. It can:
- Summarise the day's priorities, orders, customer messages, and overdue tasks.
- Analyse business performance and explain trends in plain language.
- Suggest product ideas, seasonal campaigns, bundles, pricing considerations, and content themes.
- Help draft product descriptions, customer replies, quotes, project plans, and social posts.
- Identify recurring complaints, customer requests, popular styles, and operational bottlenecks.
- Help Elaine brainstorm and maintain an owner-approved idea/action list.
- Answer questions using only records Elaine is authorised to access, with links back to the source records.

### Geranemo controls and boundaries
- Elaine can give Geranemo instructions, set its tone and business goals, and review/edit its saved working preferences.
- Geranemo must identify when it is using real business data versus assumptions or general suggestions.
- It may draft and recommend, but must not independently accept/decline projects, set binding prices, issue refunds, send customer messages, publish reviews, change payment details, or make financial/legal commitments.
- Require Elaine's explicit confirmation for any action that changes records or communicates externally.
- Keep an audit trail of AI-generated drafts and owner-approved actions. Provide a clear way to correct or delete inaccurate AI notes.

## Notifications
- Dashboard inbox is the source of truth.
- Optional email and browser push notifications for new orders, messages, complaints, suggestions, quote responses, payment events, and urgent tasks.
- Elaine controls notification categories, quiet hours, and delivery channel.
- Never include sensitive payment or personal information in notification previews.

## Data, privacy and reliability
- Use a real backend database and private object storage for customer records and photos. GitHub Pages is static hosting and cannot securely provide this system by itself.
- Enforce server-side authentication and per-record authorization; hiding an admin link is not security.
- Use HTTPS, secure upload validation, file-size/type limits, malware scanning where available, backups, audit logs, and tested restore procedures.
- Apply South African POPIA principles: collect only necessary information, explain purposes, restrict access, retain only as needed, and support appropriate access/deletion requests.
- Keep payment credentials and AI provider keys in server-side secrets, never in the app bundle or repository.
- Do not send customer personal data to an AI provider unless the data handling and consent/privacy arrangements have been reviewed.

## Delivery phases
1. **Admin foundation:** choose and configure backend/authentication, owner-only access, account bootstrap, dashboard shell, database and secure storage.
2. **Daily operations:** orders, customer messages, complaints/suggestions, Second Life enquiries, quote and invoice workflows, notifications.
3. **Business intelligence:** completed-project library, review moderation, statistics and reports.
4. **Geranemo:** connect a server-side AI service, scoped data access, owner instructions, draft/review workflow, and audit trail.
5. **Launch hardening:** test security, permissions, backups, mobile usability, POPIA notices, payment flows, and recovery.

## Current status
This document records the agreed scope only. The current GitHub Pages/PWA prototype is static and does not yet provide secure admin authentication, a database, persistent records, private photo storage, live notifications, payment processing, analytics, or a functioning AI assistant. Do not present a front-end mockup as a secure or operational admin system.
