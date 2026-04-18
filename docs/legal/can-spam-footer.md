# CAN-SPAM Email Footer — Ringdocket

**Purpose:** Boilerplate footer content to be appended to every email sent from Ringdocket, whether marketing or transactional. Compliance is with the US federal CAN-SPAM Act of 2003 (15 U.S.C. §7701 et seq.) and the implementing rule at 16 C.F.R. §316.

> [!info] Who this document is for
> Anyone writing, scheduling, or configuring email from Ringdocket.
> Copy the right footer block into the right email type. The rules are not
> suggestions — CAN-SPAM violations are $50,000+ per email per violation.

---

## Verify before publishing

- `Ringdocket`, `ringdocket.com`, `[PHYSICAL_ADDRESS]` — replace with real values.
- SendGrid unsubscribe group IDs are created when the groups are set up in the SendGrid dashboard; the merge tags below reference those group IDs.
- Sender domain authentication (SPF, DKIM, DMARC) is a separate operational requirement; it does not appear in the footer but is required before first send.

---

## 1. The Four Non-Negotiables

Every email we send — marketing or transactional — must contain:

1. **Accurate, non-misleading From, Reply-To, and Subject fields.** The From name is `Ringdocket`. The From address is a monitored mailbox at ringdocket.com. Subject lines describe the actual content.
2. **Clear identification that the email is an advertisement when applicable.** Transactional emails (account confirmations, receipts, password resets) are exempt from this requirement. Marketing emails (digest, impact report, Takedown Report reminders, Founding Flagger launch communications, product announcements) are commercial and must be identifiable.
3. **A physical postal address.** See §2 below. This is a hard CAN-SPAM requirement — not optional, not conditional on email type. Every email, including transactional, carries this address.
4. **A functioning opt-out mechanism.** For marketing email, a one-click unsubscribe link that remains operational for at least 30 days after the email is sent. We use SendGrid's unsubscribe group feature so users can opt out of one category (e.g., weekly digest) without killing all email.

---

## 2. Physical Address Block (HARD REQUIREMENT — NEVER OMIT)

This block appears at the bottom of every email. Do not remove it from any template.

```text
Ringdocket · LIGHTHOUSE 27 LLC
[PHYSICAL_ADDRESS]
```

> [!warning] CAN-SPAM hard requirement
> 15 U.S.C. §7704(a)(5)(A)(iii) requires a "valid physical postal address of
> the sender" in every commercial email. Removing this block, leaving it
> blank, or substituting a PO Box that is not registered with USPS for the
> sender is a violation. A registered agent address or a USPS-registered
> PO Box satisfies the requirement.

If the production `[PHYSICAL_ADDRESS]` is not yet decided, **do not send email until it is.** This is not a "ship and fix" item.

---

## 3. "You received this email because…" Block (variants)

Use the variant that matches the email type. This block appears immediately above the physical address block.

### 3.1 Weekly "Scam of the Week" digest

```text
You received this email because you subscribed to the Ringdocket weekly
digest. We send one of these every Friday morning highlighting the most
reported scam campaign of the week.

Unsubscribe from the weekly digest: {{unsubscribe_url_group_digest}}
Manage all email preferences: https://ringdocket.com/account/email-preferences
```

### 3.2 Monthly personal impact report

```text
You received this email because you have a Ringdocket paid subscription
and monthly impact reports are a benefit of your plan. This report
summarizes how your reporting activity contributed to the block list over
the past 30 days.

Unsubscribe from monthly impact reports: {{unsubscribe_url_group_impact}}
Manage all email preferences: https://ringdocket.com/account/email-preferences
```

### 3.3 Quarterly Takedown Report reminder

```text
You received this email because your quarterly Ringdocket Takedown
Report is ready. This report shows the campaigns you helped flag and
the takedowns those reports contributed to.

Unsubscribe from quarterly Takedown Report notices: {{unsubscribe_url_group_takedown}}
Manage all email preferences: https://ringdocket.com/account/email-preferences
```

### 3.4 Transactional email (account confirmation, receipts, password reset, security alerts)

```text
You received this email because of account activity on your Ringdocket
account. Transactional emails are not subject to marketing opt-out
because they are required to operate your account.

If you did not initiate this activity, please email security@ringdocket.com
immediately.

Manage marketing email preferences: https://ringdocket.com/account/email-preferences
```

### 3.5 Founding Flagger launch / product announcement (one-off marketing)

```text
You received this email because you created a Ringdocket account and
opted in to product announcements. These emails go out sparingly — we
won't pile on.

Unsubscribe from product announcements: {{unsubscribe_url_group_announcements}}
Manage all email preferences: https://ringdocket.com/account/email-preferences
```

---

## 4. Sender Identification Block

Appears between the main email body and the "You received this email because…" block.

```text
Sent by Ringdocket, a product of LIGHTHOUSE 27 LLC.
Questions? Reply to this email or contact support@ringdocket.com.
```

---

## 5. Full Footer Assembly (Example — Weekly Digest)

Combine §4, §3.1, and §2 at the bottom of the template.

```text
---
Sent by Ringdocket, a product of LIGHTHOUSE 27 LLC.
Questions? Reply to this email or contact support@ringdocket.com.

You received this email because you subscribed to the Ringdocket weekly
digest. We send one of these every Friday morning highlighting the most
reported scam campaign of the week.

Unsubscribe from the weekly digest: {{unsubscribe_url_group_digest}}
Manage all email preferences: https://ringdocket.com/account/email-preferences

Ringdocket · LIGHTHOUSE 27 LLC
[PHYSICAL_ADDRESS]
```

---

## 6. DO NOT ADD (things that break compliance)

The following will create a CAN-SPAM violation, a deliverability problem, or both. Do not ship any email containing these patterns without explicit review.

- **Misleading or deceptive subject lines** — "Your refund is ready" when it is not, "RE:" on an email that is not a reply, subject lines that look like a personal message when they are bulk marketing. 15 U.S.C. §7704(a)(2).
- **False From, To, or Reply-To fields.** Always identify Ringdocket as the sender. Never impersonate a user or a third party.
- **Hiding the unsubscribe link** — making it tiny, same color as background, inside an image, behind a CAPTCHA, or requiring more than one click to effect opt-out. CAN-SPAM requires it to be "clear and conspicuous." 15 U.S.C. §7704(a)(3).
- **Requiring a login or a confirmation email to unsubscribe.** Unsubscribe must be processable from the email itself.
- **Charging a fee to unsubscribe, requesting personal information to unsubscribe, or requiring the user to take more than "reasonable steps."** The user must be able to opt out by email reply, single URL click, or both.
- **Continuing to send marketing email more than 10 business days after an opt-out.** SendGrid's unsubscribe group feature handles this automatically, but any email sent outside the platform must respect the suppression list.
- **Selling, trading, or transferring the email addresses of users who have opted out.** Forever. Not just while they are on the list.
- **Sending commercial email to an address that has never signed up or been added with documented consent.** No purchased lists. No scraped lists. No "we found you on LinkedIn" cold email from the product domain.
- **Omitting the physical address block.** See §2.
- **Sending from a subdomain that is not authenticated with SPF, DKIM, and DMARC.** Not a CAN-SPAM requirement per se, but a deliverability and fraud-prevention requirement. Any unauthenticated mass send will land in spam folders and may be treated as suspicious by Google and Yahoo's 2024 bulk-sender rules.
- **Including tracking pixels that load from a non-HTTPS domain or from a third-party ad-tech vendor.** Transactional and marketing tracking is fine through SendGrid; advertising-style retargeting pixels are not.

---

## 7. Appendix — SendGrid Unsubscribe Groups

We maintain separate unsubscribe groups so a user who wants the weekly digest but not the monthly impact report (or vice versa) can opt out of one without losing the other. This is the best practice for preserving list health and reducing "mark as spam" rates.

### 7.1 Group definitions

| Group ID | Name | Controls | Default on signup |
|---|---|---|---|
| `group_digest` | Weekly Scam Digest | The Friday-morning "Scam of the Week" email | Opt-in required (checkbox at account creation, unchecked by default) |
| `group_impact` | Monthly Impact Report | Personal stats recap sent on the 1st of each month | Opt-in default ON for paid subscribers (tied to paid-tier value) |
| `group_takedown` | Quarterly Takedown Report | Reminder email when a new Takedown Report PDF is ready | Opt-in default ON for paid subscribers |
| `group_announcements` | Product Announcements | Launch communications, feature releases, Founding Flagger updates | Opt-in required (checkbox at account creation, unchecked by default) |
| *(none)* | Transactional | Auth, receipts, password resets, security alerts | Cannot be opted out — required for account operation |

### 7.2 Implementation notes for SendGrid configuration

- Configure each group above in the SendGrid dashboard under **Marketing → Unsubscribe Groups**. Record the generated numeric group ID.
- On every marketing send, set the `asm.group_id` field to the correct group. SendGrid inserts the group-specific unsubscribe URL via the `{{unsubscribe_url}}` substitution tag.
- For transactional sends, do **not** set `asm.group_id`. Transactional emails must not be affected by the marketing suppression list (a user who unsubscribed from marketing must still receive their password reset).
- Enable the **List-Unsubscribe** header (RFC 8058) on all marketing sends for Gmail/Yahoo one-click unsubscribe compliance. SendGrid enables this automatically when using an unsubscribe group.
- Set the `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header to satisfy 2024 Google/Yahoo bulk-sender rules.

### 7.3 Preference center

The "Manage all email preferences" link in every footer points to `https://ringdocket.com/account/email-preferences`, a logged-in page that shows the four groups above with toggle switches. Users can opt out of any subset without affecting the others. A "turn off all marketing email" button is also provided.

---

## 8. Quick Reference Card

Print this and pin it next to whoever ships emails.

| Element | Required? | Source |
|---|---|---|
| From: Ringdocket \<noreply@ringdocket.com\> | Yes | Sender identity |
| Reply-To: monitored mailbox | Yes | Must be real and monitored |
| Subject: descriptive, non-misleading | Yes | Editor judgment + review |
| Unsubscribe link (marketing) | Yes | SendGrid unsubscribe group |
| List-Unsubscribe header | Yes | SendGrid auto on group sends |
| Preference center link | Yes | ringdocket.com/account/email-preferences |
| Physical address | Yes (every email) | §2 above |
| "Why you received this" | Yes (every email) | §3 variants above |
| "Advertisement" label | Only if pure marketing | Editor judgment |

---

*End of CAN-SPAM footer spec. For marketing copy and cadence decisions, see the Phase B marketing plan.*
