# Delist / Appeal Playbook — Ringdocket (INTERNAL)

**Audience:** Brian, as solo operator. Also anyone Brian delegates to in the future.
**Purpose:** Operational guide for handling `/report-an-error` submissions — people claiming their number should not be on the Ringdocket block list.
**Updated:** [EFFECTIVE_DATE]
**Status:** V1 — manual process. Automated triage and SLA tracking are V2.

> [!info] Why this document exists
> Every delist decision is a small legal event. Getting it wrong in either
> direction costs us something: delist a real spam operator and we damage
> the block list; refuse to delist a legitimate business and we damage a
> real person's livelihood (and invite a defamation claim). This playbook
> is how a solo operator makes that call consistently at 11pm on a Tuesday.

---

## Verify before using

- `Ringdocket`, `ringdocket.com`, `[DELIST_SLA]` — replace with real values when live.
- Once the public form exists at `ringdocket.com/report-an-error`, update §1 with the actual ticket queue name (email inbox address or Linear project).
- The `delist_audit` table structure in §7 assumes the Phase 1 schema is built; confirm against the final schema before running the SQL snippets.

---

## 1. Intake and Triage Process

### 1.1 Where requests come from

- **Primary:** public form at `ringdocket.com/report-an-error`. No account required. Form fields: name, email, phone number in question, category (I own this number / wrong number for me / other), description (500 char), optional file attachment.
- **Secondary:** direct email to `support@ringdocket.com` or `appeals@ringdocket.com`. Manually route these into the same queue.
- **Tertiary:** escalations from Apple App Store (rare, usually a business that contacted Apple first).

### 1.2 Ticket queue (V1)

Form submissions POST to a Cloudflare Worker that:

1. Writes the submission to a `delist_requests` table in Supabase.
2. Emails a notification to `support@ringdocket.com` (currently Brian's inbox).
3. Returns a confirmation page with a ticket ID and the SLA ("[DELIST_SLA] business days").

Brian triages from the inbox. When V1 traffic justifies it, migrate to Linear or a proper helpdesk.

### 1.3 First-touch SLA

Respond within **[DELIST_SLA] business days** with at least one of: delist confirmation, request for more information, or notice that we are investigating. If not met, the escalation email to `support@ringdocket.com` is a nudge to Brian himself — the loop exists because a solo operator will miss tickets sometimes.

---

## 2. Triage Categories

Every incoming request falls into one of four buckets. Categorize first, then apply the decision matrix in §3.

### Category A — Legitimate business, low report count (1–4 reports)

- The number is on the list because a small number of users flagged it.
- The submitter claims ownership and provides some context.
- Report count is below the 5-report line that suggests serious volume.
- Likely outcome: **fast delist**, provided basic evidence checks out.
- Risk of being wrong: low. If we delist in error, the number will come back on the list if real spam volume exists.

### Category B — Legitimate business, high report count (5+ reports)

- The number is on the list because enough users flagged it to clear the 3-account corroboration threshold comfortably.
- The submitter claims legitimacy but the volume suggests either (a) aggressive but technically legal outbound calling, (b) compliance issues with the TCPA / DNC list, (c) a previous owner was a spam operator, or (d) competitors or a troll coordinated a false-report campaign.
- Likely outcome: **requires investigation.** Don't delist without evidence.
- Risk of being wrong: high in both directions.

### Category C — Spam operator claiming legitimacy

- Submissions from burner emails, Gmail addresses with no verifiable business presence, generic "I own this number please remove it" text, or numbers associated with known scam patterns in our `campaigns` table.
- Likely outcome: **default deny.** Ask for hard proof of ownership and a business purpose.
- Escalate the associated number to higher pattern-detection scrutiny.
- Risk of being wrong: low on the "don't delist" side; the cost of incorrectly delisting a spam number is real user harm.

### Category D — Wrong-number confusion

- The submitter says "I just got this number from my carrier last month and I'm getting calls all day for the previous owner."
- This is a genuinely sympathetic case and also the single hardest category to verify.
- Likely outcome: **consider delist** if carrier evidence is strong. Otherwise, offer guidance.
- Risk of being wrong: moderate. A recycled number that went from spammer to civilian should come off the list; a spam operator pretending to be a recycled-number civilian should not.

---

## 3. Decision Matrix — What Counts as Proof?

Evidence strength determines action.

| Evidence | Strength | Notes |
|---|---|---|
| Matching business email on business domain + public business web presence at that domain + phone number listed on that website | Strong | Highest-confidence ownership proof. Cross-verify via Google search. |
| Carrier invoice (PDF, last 60 days) showing the phone number and submitter's name or business name, matching billing address | Strong | The gold standard. Phone bill is hard to fake. |
| Business registration (Secretary of State) showing business name, matching to business domain, matching to phone number on business site | Strong | Public-record verifiable in seconds. |
| Letter of intent or contract with telco showing phone-number assignment to submitter | Strong | Less common but definitive. |
| LinkedIn profile of submitter matching business + job title + plausible company name | Moderate | Not sufficient alone. Use as a corroborator. |
| Screenshot of text message or email from the number sent to the submitter ("Here is my cell") | Moderate | Can be fabricated in 30 seconds. Useful only alongside another signal. |
| Business card image | Moderate | Trivially fake. Corroborator only. |
| "I swear I own this number" / no evidence | Weak | Not sufficient for any category except Category A with very low report count. |
| Phone number listed on personal social media (Twitter, Instagram bio) | Weak | Easily faked. Some corroboration value. |
| Submitter's IP geolocation matches stated business location | Weak | Coincidence-level signal, not proof. |

### 3.1 Strength thresholds by category

| Category | Minimum evidence to delist |
|---|---|
| **A** (low count, looks legit) | One Strong OR two Moderate |
| **B** (high count, claims legit) | Two Strong, OR one Strong + carrier evidence that specifically explains the report volume (e.g., compliant outbound campaign, prior owner was a scammer) |
| **C** (looks like spam operator) | Two Strong + absence of pattern match to any active campaign in our DB. If pattern matches, do not delist even with evidence. |
| **D** (wrong-number / recycled) | Carrier invoice showing assignment date AFTER most reports were filed, OR carrier written confirmation of number recycling. Without either, offer the "we're tracking it" response in §4.5 and do not delist. |

### 3.2 Hard deny signals — never delist regardless of evidence

- The number appears on an **FCC enforcement action** we've ingested. Defer to the federal record.
- The number is on the **FTC Consumer Sentinel** published list at high complaint volume.
- The number is associated with an active scam campaign where three or more public government sources have documented harm.
- The submitter admits to operating a call center, lead-gen business, or debt collection and cannot demonstrate clear TCPA compliance.
- The submitter has a history of repeat delist requests for different numbers from the same email / IP (pattern indicates a delist-farmer trying to launder spam numbers).

The "never delist" list is maintained internally. See §8.

---

## 4. Response Templates

Plain text. Keep it short. Be direct. No corporate gloss. Sign with Brian's name so it reads like a human, not a support queue.

### 4.1 Request received (auto-reply, sent by Worker)

```text
Subject: Delist request received — ticket #{ticket_id}

Hi {first_name},

Thanks for submitting a delist request for {phone_number}. We've logged
your request as ticket #{ticket_id}.

We review these within [DELIST_SLA] business days. If we need more
information to make a decision, we'll email you back from this address.

If we decide to delist, you'll receive a confirmation. If we decide not
to, you'll receive an explanation and information on how to appeal.

- The Ringdocket team
```

### 4.2 Fast delist — Category A with sufficient evidence

```text
Subject: Re: Delist request #{ticket_id} — {phone_number} has been delisted

Hi {first_name},

Good news. We've removed {phone_number} from the Ringdocket block
list based on the evidence you provided.

What this means:
- New users syncing the block list won't receive the number on their
  device starting with the next list publication (within 24 hours).
- Existing users already have the number on their local block list; it
  will drop off their list on next sync, also within 24 hours.
- If the number is reported again in the future and clears the
  corroboration threshold (3+ independent verified accounts, 14-day
  window), it can re-enter the list.

If you believe you're seeing ongoing false reports, let us know and
we'll investigate the pattern.

- Brian, Ringdocket
```

### 4.3 Request for evidence — Category B or C

```text
Subject: Re: Delist request #{ticket_id} — additional information needed

Hi {first_name},

We've received your request for {phone_number}. Before we can make a
decision, we need documentation confirming ownership or assignment of
the number.

Any one of the following works:
- A PDF of a recent carrier invoice (last 60 days) showing the phone
  number and your name or business name.
- A screenshot of the phone number listed on an official company
  website at a domain matching your email address.
- A business registration document (Secretary of State filing,
  EIN letter) showing the business name + a public web presence
  at a domain that lists this phone number.

Please reply to this email with the documentation attached. We'll make
a decision within [DELIST_SLA] business days of receiving it.

If you'd rather not share those documents, we understand, but we won't
be able to delist without them — the block list exists because our
users asked us not to take claims of legitimacy at face value.

- Brian, Ringdocket
```

### 4.4 Deny — Category C, insufficient evidence or pattern match

```text
Subject: Re: Delist request #{ticket_id} — decision: no delist

Hi {first_name},

Thanks for the additional information on {phone_number}. After review,
we're not going to remove the number from the block list at this time.

The reason: {one-line reason — e.g., "the number is associated with an
active scam campaign we track via the FTC complaint feed" or "the
documentation you provided doesn't independently confirm ownership"}.

If you disagree with this decision, you can appeal by emailing
appeals@ringdocket.com with your ticket number and any additional
context. Appeals are reviewed manually and the final decision is final
within our Service.

We recognize this may be frustrating. The block list exists to protect
users from unwanted calls, which means we apply skepticism to delist
requests by design.

- Brian, Ringdocket
```

### 4.5 Wrong-number / recycled — Category D, evidence insufficient for delist

```text
Subject: Re: Delist request #{ticket_id} — wrong-number situation

Hi {first_name},

Thanks for reaching out about {phone_number}. We understand the
frustration of getting calls for a previous owner — it's one of the
most common experiences for a recycled number.

Here's what we can do:
1. We've flagged the number in our system for ownership-transition
   monitoring. If report volume drops off over the next 30-60 days
   (consistent with a real ownership change), the number can be
   removed automatically.
2. If you can send a carrier invoice or written confirmation from your
   carrier showing that this number was assigned to you after {date
   most reports were filed}, we can delist immediately.
3. If the calls are coming FROM other users reporting YOUR number as
   spam because they mistake you for the previous owner, those users
   can mark the reports as "wrong number" in their own app and the
   signal will degrade.

Let us know which path works for you.

- Brian, Ringdocket
```

---

## 5. Delisting Mechanics — What Actually Happens in the Database

When Brian decides to delist, the following actions execute. In V1 they are manual via a Supabase SQL editor or a small admin script; in V2 they become a button in an internal admin view.

### 5.1 Update the number state

```sql
-- Mark the number as delisted. Do not delete the row — we need the history.
UPDATE numbers
SET current_state = 'delisted',
    delisted_at = NOW(),
    delisted_reason = '{one of: verified_owner, wrong_number, enforcement_action_cleared, other}'
WHERE phone_e164 = '{phone_number}';
```

### 5.2 Write to the audit log

```sql
-- Audit trail for every delist decision. Used for appeals, legal, pattern detection.
INSERT INTO delist_audit (
  ticket_id,
  phone_e164,
  decision,           -- 'delist' | 'deny' | 'needs_evidence' | 'escalate'
  reason,             -- free text, 500 char, operator's short summary
  evidence_hash,      -- SHA-256 of any files attached; raw files stored in R2
  evidence_r2_key,    -- R2 key where the evidence is stored
  resolving_operator, -- 'brian' in V1
  created_at
) VALUES (
  '{ticket_id}', '{phone_number}', 'delist', '{one-line reason}',
  '{hash}', '{r2_key}', 'brian', NOW()
);
```

### 5.3 Invalidate affected pending reports

```sql
-- Any pending reports for this number that haven't been corroborated yet
-- should be marked as resolved-delisted so they don't silently re-promote.
UPDATE pending_reports
SET status = 'resolved_delisted',
    resolved_at = NOW()
WHERE phone_e164 = '{phone_number}'
  AND status = 'pending';
```

### 5.4 Trigger block list regeneration

The block list publication job runs on a schedule (every 4 hours in V1, configurable). Delisting a number takes effect on the next scheduled publication. If urgent, a manual trigger of the publish job is available via the admin endpoint.

---

## 6. SLA and Escalation

- **First-response SLA:** [DELIST_SLA] business days from the ticket creation timestamp (form submission).
- **Final-decision SLA:** [DELIST_SLA] business days from receipt of complete evidence. If we are waiting on the submitter, the clock pauses.
- **If not met:** the ticket system emails `support@ringdocket.com` (also Brian) as a nudge. There is no corporate escalation ladder in V1.
- **Metabase dashboard:** weekly stat on tickets resolved / open / breaching SLA. Review every Monday.

---

## 7. Appeals Process

If a submitter disagrees with a denial, they email `appeals@ringdocket.com`.

- Brian manually reviews the ticket, the evidence provided, and any new evidence in the appeal.
- Appeals are **not** handled by the same decision maker on the first pass when the product is larger than one person. In V1 with a single operator, the "fresh look" discipline is: review the ticket the day AFTER the appeal comes in, never same-day. Time between reading the original denial and reviewing the appeal reduces anchor bias.
- The appeal outcome is final within the Service. Users retain any external legal remedies.
- Response template:

```text
Subject: Re: Appeal on ticket #{ticket_id}

Hi {first_name},

I re-reviewed your delist request and the original decision. {Outcome:
"I've decided to delist the number based on the additional evidence"
OR "the original decision stands, for these reasons: …"}.

This is the final decision within our Service. If you believe your
rights have been violated, you're welcome to pursue any external
remedy available under applicable law.

- Brian, Ringdocket
```

---

## 8. "Never Delist" List

A manually maintained internal list of numbers that will not be delisted regardless of operator request. Entries require a hard external source — FCC enforcement action, FTC federal case number, DOJ indictment, state AG settlement. When a never-delist number is challenged, the response is:

```text
Subject: Re: Delist request #{ticket_id} — {phone_number}

Hi {first_name},

This number is on a list of numbers we do not delist under any
circumstances because it is the subject of a public enforcement
action by {agency name, case number, link to public source}.

We do not have discretion to remove numbers confirmed by federal or
state enforcement as sources of harm. Our role is to reflect what
the public record shows.

If you believe the enforcement action was in error, your remedy is
with the agency that brought it, not with us.

- Brian, Ringdocket
```

Maintain the list as a Supabase table (`never_delist`) with columns: `phone_e164`, `agency`, `case_number`, `public_url`, `added_at`. Entries require an attached public source. Never add based on internal suspicion alone.

---

## 9. Patterns to Watch For

A solo operator gets better over time by recognizing patterns. Document new ones in this section as they emerge.

- **Delist farming:** same IP or email submits multiple delist requests for unrelated numbers over a short period. Indicates a consultancy or automated tool trying to launder spam numbers. Flag the IP and scrutinize every future request from it.
- **Escalation threats:** "I'll sue" or "I'll call my lawyer" in the initial submission. Not a reason to delist, but a reason to be meticulous about documentation. Assume every word you write may be read by a lawyer later.
- **Carrier impersonation:** submitter claims to be from Verizon/AT&T/T-Mobile telling us to delist. No carrier does this. Treat as a phishing-adjacent signal and do not delist.
- **Refund request attached:** "delist me AND refund my subscription." This is usually a mistaken user who thinks they were charged for being on the block list. Explain the product structure (they're not a subscriber as a block-list entry; their number was reported by users) and route the refund request to the right process if one exists.

---

## 10. V2 Roadmap (out of scope for launch)

- Automated evidence parsing (OCR of carrier invoices, domain-WHOIS lookups).
- SLA tracking dashboard with aging reports.
- Delegated operators (multi-user admin with audit).
- Self-service status page at `/report-an-error/status/{ticket_id}`.
- Publish aggregate delist stats (tickets received / resolved / average resolution time) on a public transparency page — a trust signal worth building when volume justifies it.

---

*End of Delist Playbook. This is a living document. Update as patterns emerge.*
