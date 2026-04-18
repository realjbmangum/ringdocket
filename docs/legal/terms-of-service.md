# Terms of Service — Ringdocket

**Effective date:** [EFFECTIVE_DATE]
**Version:** 1.0
**Operator:** LIGHTHOUSE 27 LLC, a [STATE_OF_INCORPORATION] limited liability company, operating Ringdocket (the "Service") at ringdocket.com and through the Ringdocket iOS app.

> [!warning] These terms include a binding arbitration clause and a class action waiver
> Section 19 requires you to resolve disputes with us through individual
> arbitration rather than court proceedings, and waives your right to
> participate in class actions. Read §19 carefully. You can opt out of the
> arbitration agreement within 30 days of creating your account by emailing
> `legal@ringdocket.com` with the subject line "Arbitration Opt-Out."

---

## Verify before publishing

The following items are placeholders and must be confirmed before these terms go live:

- `Ringdocket`, `ringdocket.com`, `[PHYSICAL_ADDRESS]`, `[EFFECTIVE_DATE]`, `[STATE_OF_INCORPORATION]`, `[DELIST_SLA]`.
- Refund policy in §10.4 (7-day annual refund window) is a product-owner decision, not legal boilerplate. Confirm with Stripe/RevenueCat refund capability.
- Limitation of liability cap in §14 (greater of $100 or amount paid in prior 12 months) should be reviewed by counsel.
- Arbitration venue and administrator (§19) — default is AAA consumer rules, seat in [STATE_OF_INCORPORATION]. Counsel review recommended.
- Export control language in §22 is boilerplate; counsel should confirm it is sufficient for a US-only V1.

A licensed attorney should review §14 (Limitation of Liability), §15 (Indemnification), and §19 (Dispute Resolution) before publication.

---

## Table of Contents

1. Acceptance of Terms
2. Eligibility
3. Account Registration and Security
4. Description of the Service
5. License Grant
6. User Content — Reports and Notes
7. Acceptable Use
8. Content Moderation and Delist / Appeal Process
9. Subscription Plans, Auto-Renewal, and Refunds
10. Founding Flagger Offer
11. Data Ownership and Derived Aggregations
12. Third-Party Services
13. Warranty Disclaimer
14. Limitation of Liability
15. Indemnification
16. Termination
17. Copyright and DMCA
18. Changes to These Terms
19. Dispute Resolution, Arbitration, and Class Action Waiver
20. Governing Law and Venue
21. Notice and Communications
22. Export Controls and Sanctions
23. Miscellaneous
24. Contact

---

## 1. Acceptance of Terms

By installing the Ringdocket app, creating an account on ringdocket.com, or otherwise using the Service, you agree to be bound by these Terms of Service and by our Privacy Policy, which is incorporated here by reference. If you do not agree, do not use the Service.

These terms form a binding legal agreement between you and LIGHTHOUSE 27 LLC, doing business as Ringdocket.

---

## 2. Eligibility

You may use the Service only if:

- You are at least **18 years old**.
- You are a resident of the **United States**. V1 is offered to US residents only. If we detect that you are outside the United States, we may restrict access to your account.
- You are legally able to enter into a binding contract under applicable law.
- You are not subject to US export controls, trade sanctions, or designated on any US government denied-party list.

By using the Service, you represent that all of the above are true.

---

## 3. Account Registration and Security

### 3.1 Registration

To submit reports or access the paid features, you must create an account by providing a **valid email address** that you control and by verifying that email. Anonymous reporting is not available.

### 3.2 One account per person

You may hold **one account per natural person**. Creating multiple accounts to circumvent the free-tier report cap, the Founding Flagger cap, or any rate limit is a violation of these terms.

### 3.3 No automated account creation

You may not register accounts using bots, scripts, automated signup tools, or disposable-email services (mailinator.com, 10minutemail.com, and similar). Accounts created this way will be terminated and any Founding Flagger purchase will be refunded.

### 3.4 Account security

You are responsible for keeping your account credentials confidential and for all activity that occurs under your account. Notify us immediately at `security@ringdocket.com` if you suspect unauthorized access.

### 3.5 Account transfer

Accounts are **non-transferable**. You may not sell, rent, or give your account to another person, including (specifically) your Founding Flagger status and pricing lock.

---

## 4. Description of the Service

Ringdocket is a phone-number block list and spam-reporting platform. The Service:

- Aggregates community-submitted reports about spam, scam, robocall, and nuisance phone numbers.
- Distributes a block list to subscribed iOS devices through Apple's Call Directory Extension so those numbers are silenced on your device.
- Ingests public government data (FTC National Do Not Call Registry, FCC enforcement press releases, ITG public tracebacks) to enrich and corroborate community reports.
- Provides a web dashboard (paid feature) showing trending campaigns, your personal impact, and how your reports contribute to blocking spam at scale.
- Sends optional weekly, monthly, and quarterly communications (the weekly "Scam of the Week" digest, the monthly personal impact report, and the quarterly Takedown Report PDF).

---

## 5. License Grant

Subject to your compliance with these terms, we grant you a **personal, non-exclusive, non-transferable, revocable, limited license** to install and use the Ringdocket app on iOS devices you own or control and to access the web dashboard from standard web browsers for your own individual use. This license does not permit commercial redistribution, resale of the block list, white-labeling, or integration of the Service into other products.

---

## 6. User Content — Reports and Notes

### 6.1 What counts as User Content

"User Content" means any information you submit to the Service, including:

- Spam reports (phone number, category, timestamp).
- Optional notes attached to reports (capped at 280 characters).
- Display name (if you opt in to public first-flag attribution).
- Delist / appeal submissions.

### 6.2 Truthfulness

You represent that every report you submit reflects your **good-faith belief** that the reported number contacted you or someone on a device you control in a manner consistent with spam, scam, robocall, telemarketing, or similar unwanted contact.

### 6.3 License to us

When you submit User Content, you grant us a worldwide, non-exclusive, royalty-free, perpetual, irrevocable, sub-licensable license to use, store, reproduce, modify, display, and create derivative works from that content **for the purpose of operating, improving, and publicly communicating about the Service**. Specifically, we use User Content to:

- Build and distribute the block list.
- Compute campaign clusters, reputation signals, and trending views (aggregate only — notes are never publicly displayed).
- Include anonymized or aggregate data in marketing and product communications (for example, "users reported 12,483 numbers this week").
- Train internal detection and ranking systems.

This license survives the termination of your account for the anonymized signal, consistent with the anonymization cascade described in the Privacy Policy §9. The notes field is deleted on account deletion regardless.

### 6.4 You retain ownership

Subject to the license in §6.3, you retain ownership of your User Content.

---

## 7. Acceptable Use

You agree not to:

- **Report numbers you know are not spam.** Deliberately false reports (griefing a business, a former partner, a political opponent, or any other individual or organization) are prohibited and grounds for immediate termination.
- **Submit reports automatically.** No bots, scripts, or macros. Every report must be a specific human decision to flag a specific number.
- **Scrape, extract, or redistribute the block list, campaign data, or any other data published by the Service** except where we explicitly enable export (for example, a user-initiated export of your own report history).
- **Reverse-engineer, decompile, or otherwise attempt to extract source code** from the app, dashboard, or block list distribution mechanism.
- **Use the Service to harass, defame, or doxx** any individual or organization. The notes field, in particular, is not a place to publish accusations beyond category selection.
- **Attempt to identify the owner** of any phone number you did not previously know, using data displayed by the Service.
- **Circumvent rate limits, the free-tier report cap, or the Founding Flagger purchase cap.**
- **Use the Service in connection with any commercial phone-spam operation, lead-generation activity, or enforcement of unsolicited outreach** on other parties. We are not a sales tool.
- **Upload malware, exploit code, or content designed to disrupt the Service** or other users' use of it.
- **Impersonate another person or organization** in your account registration or display name.
- **Use the Service in violation of applicable law**, including US federal and state law, and the export control regimes referenced in §22.

Violation of §7 may result in account suspension, termination, removal of User Content, and forfeiture of any unused subscription balance. In the case of paid accounts, forfeiture of the subscription balance is a liquidated remedy because measuring actual damages from abuse is impractical.

---

## 8. Content Moderation and Delist / Appeal Process

### 8.1 Moderation posture

We review User Content for compliance with §7 at our discretion. We do not review every report before it enters our systems; scale makes that impossible. We may:

- Reject reports that fail automated checks (PII in the notes field, profanity, malformed phone numbers).
- Hold reports for review when velocity patterns suggest coordinated abuse. Held reports are stored but weighted at zero until a human review clears them. We do not tell users their report was held — doing so would help bad actors tune their abuse.
- Remove reports or delist numbers at any time for abuse, legal, or product reasons.
- Close accounts that repeatedly violate §7.

### 8.2 Delist / appeal for number owners

If you believe a phone number you own or control has been incorrectly placed on the block list, submit the public form at **`ringdocket.com/report-an-error`**. You do not need an account to submit a delist request.

We review delist requests within **[DELIST_SLA] business days**. Our decision criteria are described in our internal delist playbook and may include:

- Evidence of ownership (carrier invoice, business registration, domain-matched email).
- Absence of pattern matching known scam campaigns.
- Prior history of the number (previous ownership is a common source of false reporting — see the "wrong-number confusion" category in our playbook).

If we agree to delist, the number is removed from the public block list and a record is written to an internal audit log. If we deny, we explain the reason and you may escalate as described in §8.3.

### 8.3 Appeals

If we deny your delist request, you may appeal by emailing `appeals@ringdocket.com` within 30 days. Appeals are reviewed manually. Our decision on appeal is final within the Service. Nothing in this provision limits any legal remedy you may have under applicable law.

---

## 9. Subscription Plans, Auto-Renewal, and Refunds

### 9.1 Plans

The Service offers a free tier and a paid tier.

| Plan | Price | Includes |
|---|---|---|
| **Free** | $0 | Unlimited blocking on your device. Up to 5 reports per month. Basic home-screen stats. No dashboard, no trending view, no digest emails. |
| **Ringdocket Full — Monthly** | $3.99 / month | Unlimited reports, full web dashboard, trending campaigns, all gamification surfaces, weekly digest, monthly impact report, quarterly Takedown Report. |
| **Ringdocket Full — Annual** | $29.99 / year | Same as monthly, billed annually. Approximately 37% off monthly × 12. |

Pricing is exclusive of any applicable sales tax or VAT.

### 9.2 Payment processors

Paid subscriptions are processed by **Stripe** (web checkout) or by Apple via **RevenueCat** (iOS in-app purchase). Your payment credentials are stored by the respective processor, not by us. Their terms of service and privacy policies govern how they handle your payment data.

### 9.3 Auto-renewal

Paid subscriptions **renew automatically** at the end of each billing cycle (monthly or annually, depending on your plan) at the then-current price unless you cancel before renewal. We notify you by email at least 7 days before each annual renewal. You can cancel auto-renewal at any time:

- **Web subscribers:** in the web dashboard under Settings → Subscription.
- **iOS subscribers:** in your iOS Settings → Apple ID → Subscriptions.

Cancellation takes effect at the end of the current billing period. You retain access until that date.

### 9.4 Refunds

- **Monthly subscriptions** are non-refundable once the billing cycle begins. No pro-rated refunds.
- **Annual subscriptions** are refundable in full if you request a refund within **7 days** of your first purchase (not renewals). Email `billing@ringdocket.com` from your account email.
- **Renewals of annual subscriptions** are non-refundable once charged, consistent with the email notice we send before renewal. If you forget to cancel and are charged on renewal, we may at our sole discretion issue a partial refund on a case-by-case basis. This is not a guaranteed right.
- iOS in-app subscription refunds are handled by Apple. We cannot refund an iOS purchase directly; use Apple's refund request page.

### 9.5 Price changes

We may change prices from time to time. Changes do not affect the current billing period. We will send email notice at least **30 days before** any price increase. Grandfathering is preserved for existing subscribers for as long as their subscription remains continuously active. Cancel-and-resubscribe forfeits the grandfathered rate.

---

## 10. Founding Flagger Offer

The **Founding Flagger** offer is a limited-availability annual subscription priced at **$19.99 / year**, lifetime-locked, available to the **first 500 annual subscribers** and never reopened after the cap is met.

- **Annual only.** Monthly subscribers are not eligible.
- **Lifetime price lock.** Your price remains $19.99/year for as long as your subscription remains **continuously active**. A cancellation or lapse forfeits the lock; subsequent re-subscription is at the then-current price.
- **Non-transferable.** The Founding Flagger status and pricing lock attach to the individual account and cannot be sold, given away, or merged with another account.
- **Founding Flagger badge.** Holders receive a permanent "Founding Flagger" badge visible on their account.
- **One per person.** One Founding Flagger purchase per natural person. Multi-account fraud results in revocation of the lock and a refund of the most recent annual charge.
- **Cap is permanent.** Once 500 annual Founding Flagger subscriptions have been purchased, the offer closes permanently. We will not reopen it. A live counter on the pricing page tracks remaining spots; that counter is the official source.
- **Refunds.** The 7-day annual refund window in §9.4 applies to Founding Flagger purchases.

If the 500-cap is hit, any pending Founding Flagger checkout that did not complete before the cap will be cancelled and any authorization hold will be released without charge.

---

## 11. Data Ownership and Derived Aggregations

- **You own your User Content** as described in §6.4.
- **We own all derived aggregations.** This includes the block list, the pending-reports queue, campaign clusters, reputation scores, trending views, takedown detections, carrier attribution datasets, and any analytics derived from User Content in aggregate. These aggregations are our proprietary work product.
- **You may not extract, redistribute, or resell** derived aggregations except where we explicitly enable an export feature for your own consumption.
- **Our rights in derived aggregations survive** your account deletion, consistent with the anonymization cascade in the Privacy Policy §9.

---

## 12. Third-Party Services

The Service integrates with and relies on third-party providers including Apple (App Store, Call Directory Extension, StoreKit), Stripe, RevenueCat, Supabase, Cloudflare, SendGrid, PostHog, and Sentry. Your use of features powered by these providers is also subject to their terms. We are not responsible for third-party outages, policy changes, or decisions by those providers that affect the Service.

If a third-party provider removes a feature, raises prices, or changes its terms in a way that materially affects the Service, we will communicate the impact and, where reasonable, offer a comparable alternative.

---

## 13. Warranty Disclaimer

> [!warning] The Service is provided "AS IS" and "AS AVAILABLE"
> We make no warranties or representations about the Service. Specifically:
>
> - We do not guarantee that the Service will block every spam call, every scam call, or every unwanted number. Spam callers rotate numbers, spoof caller ID, and adapt faster than any block list can.
> - The block list is derived from community reports and public government data. We do **not** independently verify the ownership or status of every number. A number's presence on the list means "reported by our community" — not "confirmed illegal."
> - Delist requests are reviewed in good faith but resolution is at our reasonable discretion within the targets stated in §8.2.
> - Product communications (digests, impact reports, Takedown Reports) are generated algorithmically from available data and may contain inaccuracies.
> - We disclaim all implied warranties, including merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent permitted by applicable law.

Nothing in these terms is intended to limit any consumer-law warranty that cannot be disclaimed under the law of your state.

---

## 14. Limitation of Liability

> [!warning] Liability cap
> To the maximum extent permitted by law, the total aggregate liability of
> LIGHTHOUSE 27 LLC and its affiliates for any claim arising out of or related
> to the Service is limited to the **greater of (a) one hundred US dollars
> ($100) or (b) the total amount you paid us in the twelve (12) months
> preceding the event giving rise to the claim**.

In no event are we liable for:

- Indirect, incidental, consequential, special, exemplary, or punitive damages.
- Lost profits, lost revenue, lost data, or loss of goodwill.
- Damages arising from a spam call that was not blocked, from a call incorrectly blocked, or from a delist request that took longer than targeted.
- Third-party claims arising from User Content you submitted, except to the extent required by law.

Some jurisdictions do not allow exclusion or limitation of certain damages, in which case the above limitations apply to the maximum extent permitted.

---

## 15. Indemnification

You agree to defend, indemnify, and hold harmless LIGHTHOUSE 27 LLC, its officers, members, employees, and agents from and against any claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:

- Your violation of these terms.
- Your violation of applicable law.
- Your User Content, including any claim that your report was false, defamatory, or tortious toward the number owner.
- Your misuse of the Service, including any abuse of the reporting mechanism described in §7.

We reserve the right to assume the exclusive defense and control of any matter subject to indemnification, in which case you agree to cooperate with our defense.

---

## 16. Termination

### 16.1 By you

You may terminate your account at any time from **Settings → Delete account** in the web dashboard. Deletion triggers the anonymization cascade described in Privacy Policy §9. Cancellation of a paid subscription is separate from account deletion (see §9.3).

### 16.2 By us

We may suspend or terminate your account at any time, with or without notice, for any of the following:

- Violation of §7 (Acceptable Use).
- Fraud, chargebacks, or attempted circumvention of payment.
- Risk of legal liability to us arising from your use of the Service.
- Extended inactivity (see Privacy Policy §8).

When we terminate for cause, paid balances may be forfeit per §7. When we terminate for inactivity or convenience, any pre-paid but unused portion of an annual subscription will be pro-rated and refunded.

### 16.3 Effect of termination

On termination, your license under §5 ends immediately. Sections 6.3 (license in User Content), 11 (Data Ownership), 13 (Warranty Disclaimer), 14 (Limitation of Liability), 15 (Indemnification), 19 (Dispute Resolution), and 20 (Governing Law) survive termination.

---

## 17. Copyright and DMCA

If you believe content accessible through the Service infringes your copyright, send a notice that complies with 17 U.S.C. §512(c) to our designated DMCA agent at `dmca@ringdocket.com`. Your notice must include:

- A physical or electronic signature of the copyright owner or authorized agent.
- Identification of the copyrighted work claimed to be infringed.
- Identification of the allegedly infringing material and where it is located on the Service.
- Your contact information (name, mailing address, phone, email).
- A statement that you have a good-faith belief the use is not authorized.
- A statement, under penalty of perjury, that the information is accurate and you are authorized to act.

We respond to valid DMCA notices consistent with 17 U.S.C. §512 and may, at our discretion, notify the affected user and honor counter-notices.

---

## 18. Changes to These Terms

We may change these terms from time to time. If we make a **material change**, we will provide at least **30 days' advance notice** by email to the address on your account and by a notice in the web dashboard. Continued use of the Service after the effective date of a change constitutes acceptance. If you do not agree, your remedy is to stop using the Service and, if applicable, cancel your subscription and request a refund per §9.4.

Non-material changes (typos, clarifications, formatting) are effective when posted.

---

## 19. Dispute Resolution, Arbitration, and Class Action Waiver

> [!warning] Arbitration and class action waiver
> This section materially affects your legal rights. Read carefully.

### 19.1 Informal resolution first

Before starting an arbitration, you agree to email `legal@ringdocket.com` with a description of your dispute and what you want. We have **60 days** to respond and work toward an informal resolution. Arbitration may only be started after the 60-day period has passed.

### 19.2 Binding arbitration

If informal resolution fails, **any dispute arising out of or related to the Service, these terms, or our Privacy Policy will be resolved by binding individual arbitration** administered by the **American Arbitration Association (AAA)** under the AAA's Consumer Arbitration Rules. The arbitration will be conducted in the State of [STATE_OF_INCORPORATION], or by videoconference at your election for claims under $25,000.

The arbitrator's decision is final and binding. Judgment on the award may be entered in any court of competent jurisdiction.

### 19.3 Class action waiver

**You and we each waive the right to participate as a plaintiff or class member in any class, collective, consolidated, or representative action.** The arbitrator may not consolidate more than one person's claims and may not preside over any form of representative proceeding.

### 19.4 Opt-out

You may **opt out of this arbitration agreement** by emailing `legal@ringdocket.com` with the subject line **"Arbitration Opt-Out"** within **30 days of creating your account**. The email must include your account email. Opting out does not affect any other provision of these terms.

### 19.5 Exceptions

This arbitration agreement does not apply to:

- Small-claims court actions filed individually.
- Claims for injunctive or equitable relief regarding intellectual property.
- Any dispute that applicable law prohibits from being arbitrated.

### 19.6 30-day cure

If the arbitration agreement in §19 is found unenforceable in whole or in part, then §19.2 and §19.3 are severed from the remainder of this section, which survives.

---

## 20. Governing Law and Venue

These terms are governed by the laws of the State of **[STATE_OF_INCORPORATION]** (default Delaware), excluding its conflict-of-laws rules. For any dispute not subject to §19 arbitration, you agree to the exclusive jurisdiction of the state and federal courts located in [STATE_OF_INCORPORATION].

---

## 21. Notice and Communications

We may send notices to you by email to the address on your account, by posting in the web dashboard, or by in-app notification. You must keep your contact information current.

You may send formal notices to us at:

> LIGHTHOUSE 27 LLC
> d/b/a Ringdocket
> [PHYSICAL_ADDRESS]
> `legal@ringdocket.com`

---

## 22. Export Controls and Sanctions

The Service and any software associated with it are subject to US export control and sanctions laws. You represent that you are not located in and will not use the Service in any US-embargoed country, and that you are not on any US government denied-party list. You will not export, re-export, or transfer the Service to any such country or person.

---

## 23. Miscellaneous

- **Entire agreement.** These terms and the Privacy Policy are the entire agreement between you and us about the Service and supersede any prior understandings.
- **Severability.** If any provision is held unenforceable, the remainder of these terms remain in effect.
- **No waiver.** Our failure to enforce a provision is not a waiver of that provision.
- **Assignment.** We may assign these terms in connection with a merger, acquisition, or sale of assets. You may not assign these terms without our written consent.
- **No third-party beneficiaries.** These terms do not create rights in any third party.
- **Headings.** Section headings are for convenience only and do not affect interpretation.
- **Force majeure.** Neither party is liable for delays or failures due to events beyond reasonable control.

---

## 24. Contact

**Legal inquiries:** `legal@ringdocket.com`
**Privacy inquiries:** `privacy@ringdocket.com`
**Billing and refunds:** `billing@ringdocket.com`
**Security reports:** `security@ringdocket.com`
**Appeals and delist disputes:** `appeals@ringdocket.com`
**DMCA:** `dmca@ringdocket.com`

**By mail:**

> Ringdocket
> c/o LIGHTHOUSE 27 LLC
> [PHYSICAL_ADDRESS]

---

*End of Terms of Service. For how we handle personal information, see `/legal/privacy-policy`.*
