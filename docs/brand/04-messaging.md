# Ringdocket — Messaging Framework & Copy Library

**Status:** Draft v1 · April 22, 2026
**Owner:** Brian Mangum / LIGHTHOUSE 27 LLC
**Depends on:** [01-foundation.md](./01-foundation.md) (purpose, values, positioning, personas).
**Use this for:** landing copy, App Store description, press pitches, emails, social bios, objection handling, CTAs, push notifications, and anywhere a sentence has to do work.

All quantitative references are marked with an *as of* date. Numbers age; the phrasing shouldn't pretend they don't.

---

## 1. Elevator pitches

### 10-word

> The spam blocker that shows you what scam called.

### 50-word (business-card back)

> Ringdocket silences spam calls on iPhone using a nightly-synced public
> block list, then shows you the named campaign behind every call — who
> flagged it first, which carrier routed it, and when your report
> contributed to a takedown. Every blocked number is a citable public
> record.

### 150-word (journalist pitch)

> Ringdocket is a spam-call blocker built around a public ledger.
> Every American blocker app — Truecaller, Hiya, RoboKiller, Nomorobo —
> sells secrecy as a feature: proprietary databases, black-box reports,
> unverifiable block-rate claims. Ringdocket takes the opposite bet.
> Our block list is publicly verifiable at
> `blocklist.ringdocket.com/current.json` — 15,049+ numbers on the
> record as of April 22, 2026, updated nightly and distributed to
> iPhones via Apple's Call Directory Extension. A number only reaches
> the list when three independent accounts corroborate it within a
> rolling 14-day window (a defamation shield designed into the
> architecture). Every blocked number links to a named campaign —
> the Medicare Card Renewal Ring, the IRS Impersonation Line — with
> its FTC-complaint provenance, carrier attribution chain, and FCC
> enforcement citations. We don't claim takedowns; we cite them.
> Thirteen campaigns are live. Founding Flagger is capped at 500 seats.

---

## 2. Value pillars

Five pillars. Each is a decision filter and a copy anchor.

### Pillar 1 — Transparency. *Show the work.*

The block list is not proprietary. Visit `blocklist.ringdocket.com/current.json` from any browser and read the same file that syncs to every iPhone tonight. Every campaign page publishes its FTC-complaint provenance, carrier attribution chain, and the evidence ledger of corroborating reports. The data doesn't live behind a subscription.

**Proof point:** 15,049+ corroborated numbers on the public block list *(as of Apr 22, 2026; increasing nightly)*. 53,227 FTC DNC complaints ingested *(as of Apr 22, 2026)*. 13 named campaigns publicly documented.

### Pillar 2 — Corroboration. *Three accounts, fourteen days, on the record.*

A single user cannot put a number on the block list. A number enters `pending_reports` on the first flag, stays invisible to the public network, and promotes only when three distinct verified accounts — no two sharing device fingerprint or IP /24 — corroborate within a rolling 14-day window. Stale pending reports expire. This is a defamation shield designed in, not bolted on.

**Proof point:** 3-account / 14-day corroboration threshold, applied to 100% of user reports. No exceptions, no override, no "trust the reporter." Public on every campaign page.

### Pillar 3 — Civic receipts. *Your reports have a timestamp.*

Incumbent blockers take reports and never speak of them again. Ringdocket tracks first-flag credit with retroactive attribution — you flag a number before it's corroborated and you earn credit the moment it promotes. Quarterly Takedown Report PDFs itemize the campaigns you helped retire, framed as civic contribution, not trauma accounting ("campaigns you helped take down," never "calls you received").

**Proof point:** First-flag credit on every campaign the user contributed to. Quarterly Takedown Report shipped to paid subscribers, signed with case citations. 48-hour payoff-notification SLA on corroborated flags.

### Pillar 4 — Editorial quality. *Every campaign is a story, not a stat.*

Where Hiya writes "Spam Likely," Ringdocket writes "Medicare Card Renewal Ring — active since January 2026, 412 numbers, three carriers implicated, FCC case ITG-2026-0418 open." Named campaigns. Narrative summaries. Carrier attribution via FCC STIR/SHAKEN records. Source chips on every page that cite provenance the way a court filing cites a case number.

**Proof point:** 13 live named campaigns *(as of Apr 22, 2026)*. 100% of campaign pages carry a data-provenance chip ("Data: FTC DNC feed + N user reports · Last updated · Corroboration threshold: 3/14d"). Zero unsourced claims on public pages.

### Pillar 5 — Long-tail coverage. *Public data plus crowd corroboration, compounding nightly.*

The block list is seeded from the FTC Do Not Call complaint feed, enriched by FCC enforcement RSS, Industry Traceback Group public tracebacks, and the live river of user reports. The architecture is additive — every corroborated user flag joins tomorrow morning's sync. Cloudflare's global edge distributes the list so the phone in Asheville and the phone in Austin see the same block list within seconds.

**Proof point:** Daily ingestion of FTC DNC complaint feed (53,227 complaints ingested as of Apr 22, 2026). Nightly block list snapshot + hourly deltas distributed via Cloudflare R2 edge. Sub-100ms fetch from anywhere in the US.

---

## 3. Competitive positioning

### Matrix

| Product | Data source | Transparency | Report visibility | Who owns the list | Price model | Platform |
|---------|-------------|--------------|-------------------|-------------------|-------------|----------|
| **Ringdocket** | FTC/FCC/ITG public + 3-account corroborated user reports | Public block list, public campaign pages, public evidence ledger | First-flag credit, campaign attribution, quarterly Takedown Report PDF | The public record (list is readable by anyone) | Free / $3.99mo / $29.99yr / $19.99yr Founding (cap 500) | iOS (Android V2) |
| Hiya | Proprietary + carrier deals | "Spam Likely" label only | None — reports are telemetry | Hiya, Inc. (closed) | Free / $3.99mo / $14.99yr | iOS + Android |
| Truecaller | Proprietary + uploaded contact books | Caller name, tag counts | None visible to reporter | Truecaller AB (closed) | Free / $3.99mo / $29.99yr | iOS + Android |
| Nomorobo | Proprietary heuristic block list | None | None | Telephone Science Corp (closed) | $1.99mo mobile / $2.99mo landline | iOS + Android |
| RoboKiller | Proprietary + Answer Bot recordings | Call recordings to user only | None | Teltech / IAC (closed) | $4.99mo / $39.99yr | iOS + Android |
| iOS Silence Unknown Callers | On-device rule (not in contacts) | None — nothing is surfaced | N/A — no reporting mechanism | Apple (device-only) | Free | iOS |

### Where we win

Transparency and civic closed-loop. Nobody publishes their block list. Nobody cites FCC case numbers on consumer pages. Nobody gives the reporter a timestamp and a first-flag credit. The data advantage is Hiya's — the product vision is ours. Our moat is community identity, not detection algorithms. Ten thousand engaged reporters with first-flag credits on their profile is harder to clone than a dashboard.

### Where we don't

Android (V2). Call recording (not our thesis — see the Brand Foundation; call recording is Answer Bot theater). Carrier-deal depth (Hiya has direct pipes we don't). If you want the broadest possible proprietary database with no questions about provenance, Hiya wins. If you want to be told you "stopped 99% of robocalls this month," RoboKiller will tell you that; we won't. If you want the cheapest floor, Nomorobo at $1.99/mo undercuts us by design.

**The one-sentence competitive line:** *Every other blocker treats its data as proprietary. Ringdocket treats it as a public record.*

---

## 4. Audience-specific messaging

Three audiences, three adaptations of the same core message. The product is identical; the entry door changes.

### Audience A — Privacy/civic-minded power user (HN, r/privacy, Fastmail/Kagi/Pi-hole crowd)

**Lead with:** architecture and transparency. On-device blocking via Apple's Call Directory Extension. No contact upload. No call interception. Block list is a public JSON file you can `curl`.

**Headline that works:** *The spam blocker with a public block list.*
**CTA that works:** "Read the block list" (deep link to `blocklist.ringdocket.com/current.json`) then "Sign up free."
**Proof points that land:** on-device CDE architecture; 3-account / 14-day corroboration as a designed-in defamation shield; Supabase RLS policies; Sentry PII scrubbing; Cloudflare Logpush audit trail.
**De-emphasize:** badges, the Founding Flagger scarcity angle (reads as marketing theater to this crowd), emotional scam-victim framing.

This is Marcus (Persona 2) — the power-reporter, 20% of the user base, 80% of the Reddit and press momentum. Speak technically. Show the architecture. Let him find the civic layer on his own.

### Audience B — Frustrated spam-call victim (mainstream 30–65)

**Lead with:** the phone stops ringing. Utility first. Peace of mind, not homework.

**Headline that works:** *Silence spam calls. See who they were.*
**CTA that works:** "Get it on iOS — free" on acquisition. "Upgrade to Full" after first month of quiet.
**Proof points that land:** 15,049+ numbers on the block list *(as of Apr 22, 2026)*, free forever, no account required to block, 30-second install. Named campaigns as a curiosity hook ("The Medicare Card Renewal Ring"), not a civic ask.
**De-emphasize:** architecture, corroboration math, FCC case numbers, "join the fight" language (reactance triggers crusade-fatigue in this demographic).

This is Dana (Persona 1) and Rev. Ellen (Persona 3). The civic framing comes in paragraph three. The word *docket* never appears above the fold.

### Audience C — Media / journalist / researcher

**Lead with:** the public record. Named campaigns. FTC-to-FCC data pipeline with citable provenance.

**Headline that works:** *The spam economy, on the record.*
**CTA that works:** "Read the campaign pages" or "Cite the ledger." Direct links to `campaigns/medicare-card-renewal-ring`, `campaigns/irs-impersonation-line`, etc.
**Proof points that land:** 53,227 FTC complaints ingested *(as of Apr 22, 2026)*, 13 named campaigns, carrier attribution via FCC STIR/SHAKEN records, public evidence ledger per campaign, delist / appeal form at `/report-an-error` open to anyone. Brian Mangum available for quote; LIGHTHOUSE 27 LLC, Charlotte NC.
**De-emphasize:** pricing, Founding Flagger, gamification mechanics, App Store download pitch. Journalists don't care that it's $3.99/mo.

This audience is small but compounding. Every time The Verge, Ars, or Wirecutter cites a Ringdocket campaign page, it's a durable backlink to a piece of civic infrastructure — not a puff piece that ages in a week.

---

## 5. Headline pattern library

Patterns that work in Ringdocket's voice. Each pattern is a frame, not a template — fill it only when the specific statement is true.

### Pattern 1 — **VERB X. *SEE Y.***

Two sentences, utility first, civic second, italics on the reveal.

- Silence spam calls. *See who they were.*
- Block the call. *Read the case.*
- Stop the ring. *Cite the record.*

### Pattern 2 — **THE [CATEGORY] THAT [PROVES ITSELF].**

Claims the category and earns it in the same line.

- The spam blocker that shows its work.
- The block list you can actually read.
- The call blocker with a public ledger.

### Pattern 3 — **N [UNITS] OF [NOUN]. [NARRATIVE VERB].**

Hard number up front, civic verb at the end. Dates inline.

- 15,049 numbers on the public record. Syncing to every iPhone tonight. *(Apr 22, 2026)*
- 53,227 FTC complaints ingested. 13 campaigns named so far. *(Apr 22, 2026)*
- 412 reports. One campaign. Three carriers implicated.

### Pattern 4 — **FIRST IT [X]. THEN IT [Y].**

Two-layer product in one sentence.

- First it blocks. *Then it shows you why.*
- First your phone gets quiet. *Then the campaign gets a name.*
- First we silence them. *Then we put them on the docket.*

### Pattern 5 — **WHAT [COMPETITOR CATEGORY] HIDES. RINGDOCKET [VERB].**

Positioning line. Use sparingly — it punches once.

- What every other blocker hides. Ringdocket publishes.
- What Hiya calls a database. We call a public record.
- What they charge for, we publish at a URL.

### Pattern 6 — **[NEGATIVE FRAME]. [CORRECTION].**

Claim the incumbent's posture, then invert.

- Not another proprietary database. A public ledger.
- Not "Spam Likely." *Medicare Card Renewal Ring — 412 numbers, three carriers, open FCC traceback.*
- Not a block-rate claim. A citable case ID.

### Pattern 7 — **[USER ACTION]. [DOWNSTREAM OUTCOME].**

Report → consequence, in a sentence.

- Flag a number. Earn first-flag credit when it corroborates.
- Submit a report. Watch the campaign assemble.
- File a flag. Read the case it builds.

### Pattern 8 — **NAMED CAMPAIGN HEADLINE** (for campaign pages + digest)

Campaign name as the headline. Byline below, narrative after.

- The Medicare Card Renewal Ring
- The IRS Impersonation Line
- The Utility Shutoff Scam

### Pattern 9 — **ONE [THING]. *NO [THING].***

Pricing and product restraint in five words.

- One price. *No upsells.*
- One tier. *No ladder.*
- One block list. *No paywall on safety.*

### Pattern 10 — **[PUBLIC ARTIFACT], NOT [PRIVATE ARTIFACT].**

The transparency pillar compressed.

- A public record, not a proprietary database.
- A citable ledger, not a black box.
- A ringdocket, not a blocklist.

### Pattern 11 — **[VERB] IT. [VERB] IT. [VERB] IT.**

Three-beat product summary.

- Block it. Name it. Cite it.
- Silence it. Source it. Share it.
- Flag it. Corroborate it. Retire it.

### Pattern 12 — **ATTRIBUTED TAKEDOWN / LIKELY RETIRED** (status headlines)

Legal-adjacent copy discipline. Never conflate.

- Campaign attributed to FCC enforcement action 2026-0418.
- Campaign likely retired — 30+ days of zero activity across the network.
- Number promoted to block list after 3-account corroboration in 4 days.

### Pattern 13 — **THE COUNTER / SCARCITY**

Founding Flagger mechanics. Loss-aversion framing only; never "Save 33%!"

- Lock $19.99/year before the first 500 spots close.
- 312 of 500 Founding Flagger seats claimed. Never reopens.
- Founding Flagger is a perpetual badge, not a promo.

### Pattern 14 — **THE DECLARATIVE RECEIPT**

For Takedown Reports and impact emails. Civic, not brag.

- This quarter, you helped flag 47 numbers across 4 scam campaigns.
- Your reports contributed to 3 campaigns now under FCC investigation.
- First flag on (402) 555-0142 — corroborated within 72 hours.

### Pattern 15 — **THE QUESTION → ANSWER**

For FAQ entries, objection handling, press Q&A.

- Why does this need a subscription? — Because blocking is free; the ledger is paid.
- Can someone flag my number as revenge? — No. Three independent accounts, fourteen-day window, different devices.
- Do you sell the data? — No. We publish it.

### Pattern 16 — **[COMMON TERM] → [RINGDOCKET TERM]** (category reframe)

Used in retention copy, never acquisition.

- Not a database. A ledger.
- Not a report. A flag.
- Not a shutdown. An attributed takedown.

---

## 6. The Ringdocket copy library

### Taglines (5)

1. *Silence spam calls. See who they were.*
2. *The spam blocker that shows its work.*
3. *Put the call on the record.*
4. *Block it. Name it. Cite it.*
5. *A public ledger for the spam economy.*

### Social bios

| Platform | Bio | Char count |
|----------|-----|-----------|
| Twitter/X (160) | Silence spam calls. See who they were. Public block list, named campaigns, FCC case citations. iOS. Run by LIGHTHOUSE 27 LLC. | 137 |
| LinkedIn (short) | Ringdocket is a call blocker with a public ledger. We silence spam calls on iPhone, name the scam campaign behind each one, and cite the FCC, FTC, and carrier attribution chain for every blocked number. Built by LIGHTHOUSE 27 LLC in Charlotte, NC. | — |
| Instagram | The spam blocker that shows its work. · iOS · Public block list at blocklist.ringdocket.com · 15k+ numbers on the record · LIGHTHOUSE 27 LLC | — |
| GitHub | Public-accountability call blocker. iOS app + web ledger. Block list published at blocklist.ringdocket.com/current.json. | — |

### App Store subtitle + description draft

**Subtitle (≤30 chars):** `Public ledger. iPhone quiet.` (28)
**Alternate:** `The blocker with a public list.` (30)

**Description (≤4000 chars):**

> Silence spam calls on iPhone. See who they were.
>
> Ringdocket installs a shared, publicly verifiable block list on your iPhone using Apple's Call Directory Extension. Listed numbers never ring. No account required to start blocking.
>
> Then — if you want — the dashboard shows the scam campaign behind every blocked call. The Medicare Card Renewal Ring. The IRS Impersonation Line. The Utility Shutoff Scam. Each campaign has a named page with its FTC-complaint provenance, carrier attribution chain, and FCC enforcement citations.
>
> Why it's different:
>
> • **Public block list.** Visit blocklist.ringdocket.com/current.json — the same file syncs to your phone. 15,049+ numbers on the record (and growing nightly).
>
> • **3-account corroboration.** A number enters the block list only when three independent accounts report it within a 14-day window. No revenge flags. No single-person errors going network-wide.
>
> • **Named campaigns, not stat counts.** Every blocked number links to a story — the campaign, the carriers implicated, the FCC case open on it.
>
> • **Civic receipts.** Flag a number. Earn first-flag credit when it corroborates. Read your quarterly Takedown Report itemizing campaigns your flags helped retire.
>
> • **Private by default.** On-device blocking. No contact upload. No call recording. No call audio ever transmitted. Block list stored locally.
>
> Pricing:
>
> Free forever — unlimited blocking, 5 reports per month.
> Ringdocket Full — $3.99/mo or $29.99/yr for the full dashboard, unlimited reports, and the quarterly Takedown Report.
> Founding Flagger — $19.99/yr lifetime-locked for the first 500 annual subscribers. Perpetual badge. Never reopens.
>
> Runs on iOS 17 and up. Built by LIGHTHOUSE 27 LLC.

### Press-ready one-liner (about the company)

> Ringdocket is a public-accountability call blocker built by LIGHTHOUSE 27 LLC (Charlotte, NC) — an iOS app plus a web ledger that silences spam calls on iPhone and publishes every blocked number, every named scam campaign, and every carrier attribution chain as a public record citable by journalists, researchers, and enforcement agencies.

### Legal footer boilerplate

> © 2026 LIGHTHOUSE 27 LLC. Ringdocket and the Ringdocket mark are trademarks of LIGHTHOUSE 27 LLC. Includes data from the FTC National Do Not Call Registry. Ringdocket is not affiliated with the FTC, FCC, or Industry Traceback Group; we use their public records.

### CAN-SPAM email footer

> You're receiving this because you opted in to Ringdocket product updates.
> [Unsubscribe from this digest] · [Manage all email preferences]
> LIGHTHOUSE 27 LLC · [mailing address] · Charlotte, NC

### Transactional email subject lines

| Trigger | Subject |
|---------|---------|
| Magic-link sign-in | Your Ringdocket sign-in link |
| Receipt (monthly) | Ringdocket Full — receipt for $3.99 |
| Receipt (annual) | Ringdocket Full — receipt for $29.99 |
| Receipt (Founding) | Founding Flagger — locked for life |
| Delist response | Re: your delist request for (XXX) XXX-XXXX |
| First flag corroborated | Your flag on (XXX) XXX-XXXX just corroborated |
| Campaign attribution | Your report joined a named campaign |
| Weekly digest | This week's Public Enemy #1: [Campaign Name] |
| Monthly impact | What you did in [Month] |
| Takedown Report | Your Q[N] Takedown Report is ready |

### Push notification copy — "your flag corroborated"

All push copy is stoic, declarative, ≤4 lines. Never exclamation points. Never emoji.

- *Your flag corroborated.* (402) 555-0142 promoted to the block list. First-flag credit: yours.
- (720) 555-0089 just promoted. You were first to flag it — 3 days ahead of corroboration.
- Your report joined the Medicare Card Renewal Ring — 412 numbers, three carriers.
- Network block: a number you flagged triggered a block for 12,400+ users tonight.

### 404 page copy

> # Not on the docket.
>
> This page doesn't exist — or it was retired before we got here. Try the [campaign index](/campaigns), the [public block list](https://blocklist.ringdocket.com/current.json), or [file a delist request](/report-an-error) if you got here trying to challenge a listing.

### Maintenance-mode copy

> # We're updating the ledger.
>
> Ringdocket is briefly offline while we push tonight's block list. Your iPhone already has the current list cached — blocking continues. Back in a few minutes.

### Offline empty states

- **No reports yet:** *Nothing on your record. Flag a spam call from Recents and it shows up here.*
- **No campaigns on your impact page:** *No corroborated flags yet. The clock starts on your first report.*
- **Takedown Report not ready:** *Your first Takedown Report ships at the end of this quarter. It'll itemize the campaigns your flags contributed to.*
- **Dashboard offline:** *Couldn't reach the ledger. Your blocking still works — the list is cached on your phone.*

---

## 7. Objection handling

Expected prospect objections, answered in voice.

### "Why pay when iOS Silence Unknown Callers is free?"

Silence Unknown Callers silences everyone who isn't in your contacts — delivery drivers, doctors, your kid's school. Ringdocket silences only the numbers on the corroborated block list and leaves legitimate unknown calls alone. Plus the campaign context Silence Unknown Callers doesn't give you: the scam name, the carrier chain, the open FCC case.

### "How is this different from Hiya?"

Hiya labels a call "Spam Likely" and keeps its database private. Ringdocket publishes the block list at `blocklist.ringdocket.com/current.json`, names the campaign behind each number, and cites the FCC case or ITG traceback. Same kind of block, different product — we show you what called and why.

### "Is my reported phone number shared? Does this upload my contacts?"

No and no. Your phone number isn't shared with anyone — you're identified to us by email only. There's no contact upload ever (Ringdocket doesn't touch your address book). The numbers you report are the *scam* numbers that called you, not your own. Those scam numbers become part of the public ledger only after three independent accounts corroborate.

### "Can someone get my real number added to the block list as revenge?"

Not from a single flag, and not from a coordinated group sharing the same network. The 3-account / 14-day corroboration rule requires three distinct verified accounts — no two sharing device fingerprint or IP /24 — to report a number within a two-week window. A delist / appeal form at `/report-an-error` is public, no auth required. Every campaign detail page links to it.

### "Are the payments secure? Refund policy?"

Payments are processed by Stripe on web and StoreKit via RevenueCat on iOS. Card numbers never touch Ringdocket's servers. Refund policy: email `refunds@ringdocket.com` within 14 days of a charge, full refund, no questions. After 14 days, cancel anytime from the billing portal and you keep paid access through the end of your period.

### "Do you sell the data? What's the business model?"

No. The business model is a subscription — $3.99/mo or $29.99/yr — and that's it. We don't sell, share, or license the block list. The block list is a public good; the dashboard, retention content, and Takedown Report are what paid subscribers fund.

### "What happens to my data if I delete my account?"

Your account, email, device records, subscription row, and badges are deleted. Your reports stay on the network in anonymous form — `user_id` is set to NULL, notes are deleted, but the phone-number / category / timestamp signal remains so the block list doesn't degrade. This is documented in the privacy policy and disclosed at the deletion confirmation step.

### "Why only iOS? No Android?"

iOS first because Apple's Call Directory Extension is the cleanest architecture for shared-list blocking — no carrier registration, no call interception, no CALEA compliance burden. Android is V2. The block list itself is platform-agnostic; when Android ships, every existing campaign and ledger entry works on day one.

### "How is a 'takedown' confirmed? Aren't you just guessing?"

Two separate states with different copy. **Attributed takedown** requires a public enforcement citation — an FCC press release, an ITG traceback, an FTC consent decree. We link the source. **Likely retired** is inference only — activity decay to zero across 100+ users for 30+ days — and we label it that way. We never conflate the two.

### "What if I block a legitimate business by mistake?"

A single flag doesn't block anything network-wide. Your flag goes to `pending_reports`, visible only to you. It promotes to the public block list only if two other independent accounts corroborate within 14 days. Businesses can use the delist form at `/report-an-error` — it's public, no auth required, and reviewed by a human (no automated auto-delist).

### "What happens when Hiya copies this?"

Feature-copy is cheap. Community-copy isn't. By the time an incumbent ships a public-ledger dashboard, Ringdocket has 10,000+ reporters with timestamped first-flag credits on their profile, a Founding Flagger class of 500, and two years of Takedown Reports with named campaigns. The moat is community identity, not detection algorithms.

### "Isn't this just a reskinned blocker?"

Reskins don't publish their block list. Reskins don't cite FCC case numbers on consumer pages. Reskins don't ship a quarterly 12-page PDF itemizing campaigns the reader helped retire. The architecture is a blocker; the product is a public record.

---

## 8. Proof points — the bank

Quantifiable facts to cite anywhere. All dated so they age intelligibly.

| Fact | Value | Use this when… |
|------|-------|----------------|
| Corroborated numbers on public block list | 15,049+ *(as of Apr 22, 2026)* | Any utility-first headline; App Store pitch; press lede |
| FTC DNC complaints ingested | 53,227 *(as of Apr 22, 2026)* | Journalist pitch; data-journalism post; long-form proof |
| Named scam campaigns tracked | 13 *(as of Apr 22, 2026)* | Campaign index pages; press pitches; retention email |
| Corroboration threshold | 3 distinct accounts / 14-day rolling window / no shared device fingerprint or IP /24 | Defamation / revenge objection; privacy crowd pitch |
| Free-tier report cap | 5 reports/month (unlimited on Full) | Pricing page; upgrade flow; HN comment |
| Founding Flagger cap | 500 annual seats, $19.99/yr, lifetime-locked, never reopens | Launch week; pricing page; scarcity CTA |
| Block list delivery | Cloudflare R2 edge — daily full snapshot + hourly deltas | Privacy/engineer audience; architecture pitch |
| Block list URL | `blocklist.ringdocket.com/current.json` | Any transparency claim |
| Report payoff SLA | 48 hours from corroboration to user notification | Civic-receipts pillar; press |
| 3-timescale retention | Weekly digest, monthly impact, quarterly Takedown Report | Pricing page; retention email; App Store description |
| Data sources | FTC DNC feed, FCC enforcement RSS, ITG public tracebacks, FCC Robocall Mitigation Database, user reports | Press pitch; campaign provenance chip |
| Platform | iOS 17+, Android V2 | Any platform-specific copy |
| Pricing floor | $3.99/mo (above Nomorobo, below RoboKiller) | Pricing page; competitive comparison |
| Annual savings | $29.99/yr (37% off monthly-×-12) | Pricing page; upgrade email |
| Privacy posture | On-device block via Call Directory Extension; no call audio transmitted; no contact upload | Privacy-focused audience; App Store review |

**Rules for citing:**
- Always mark the *as of* date on any counter that changes (block list size, FTC complaints, campaigns, Founding Flagger seats).
- Never round up. 15,049+ is better than "15,000+" — the specificity signals we actually counted.
- Never claim parity with enforcement agencies ("Ringdocket partners with the FCC"). We use their public data. That's the extent of the relationship.

---

## 9. CTA library

20+ CTA phrases sorted by funnel intent. Avoid the bland set ("Learn more," "Get started today," "Sign me up!"). Every CTA is a verb plus an object, and the object is specific.

### Top-funnel (discovery / skepticism)

- Read the block list
- See how it works
- Read a campaign page
- See the ledger
- Read the provenance chip

### Signup (free / low commitment)

- Get it on iOS — free
- Install free, block tonight
- Sign up free
- Start blocking (no card)
- Create a free account

### Report (activation)

- File a report
- Flag a number
- Put it on the record
- Submit your first flag
- Add it to the ledger

### Upgrade (conversion to paid)

- Upgrade to Full
- Unlock the full ledger
- Start Ringdocket Full — $3.99/mo
- Go annual — $29.99/yr (save 37%)
- Claim Founding Flagger — $19.99/yr
- Lock $19.99/yr forever
- Take a Founding seat (before 500)

### Referral / evangelism

- Put another number on the record
- Share your Takedown Report
- Cite this campaign
- Send a friend the block list
- Pass the ledger

### Civic / retention (paid users)

- Read this week's Public Enemy #1
- Open your Takedown Report
- Read your monthly impact
- See your first-flag credits
- Review your campaign contributions

### Press / research

- Cite a campaign
- Download the public block list
- Read the methodology
- Contact press@ringdocket.com
- Request a quote for your story

---

## 10. GTM hooks — story angles

Five angles, tailored per publication. Each: thesis, proof points, tease.

### Angle 1 — Tech press (TechCrunch, Fortune technology desk)

**Thesis:** A solo founder out of North Carolina ships the first spam blocker with a public ledger, flipping the category's decade-old secrecy model. iOS-first, bootstrapped, $3.99/mo.

**Proof points:**
- 15,049+ numbers on the public block list at launch *(as of Apr 22, 2026)*.
- Founding Flagger capped at 500 annual seats — live counter on the pricing page.
- Zero outside capital. LIGHTHOUSE 27 LLC, one-person shop, ships shadcn-grade product with court-docket design language.

**The tease:** Every other blocker treats its database as proprietary; Ringdocket publishes theirs at a URL you can `curl`. The incumbents have the data but won't ship it. A solo builder just did.

### Angle 2 — Mainstream tech (The Verge, Wired consumer desk)

**Thesis:** The call-blocker category has been selling peace of mind with no receipts for a decade. Ringdocket sells peace of mind *with* receipts — named campaigns, carrier attribution, a quarterly "here's what you took down" report.

**Proof points:**
- 13 named scam campaigns publicly tracked *(as of Apr 22, 2026)* — Medicare Card Renewal Ring, IRS Impersonation Line, Utility Shutoff Scam.
- Quarterly Takedown Report PDF itemizes campaigns the subscriber's reports helped retire.
- First-flag credit with retroactive attribution — you flagged a number before corroboration, you get the credit when it promotes.

**The tease:** Hiya tells you a call is "Spam Likely." Ringdocket tells you it's one of 412 numbers in the Medicare Card Renewal Ring, routed through three carriers, with an open FCC traceback. Same block, different product.

### Angle 3 — Security / privacy press (Ars Technica, Darknet Diaries, Techlore)

**Thesis:** A defamation shield and a data-lineage-first architecture, built by a solo developer who read the Phase B security review and refused to ship until every finding was hardened.

**Proof points:**
- 3-account / 14-day corroboration rule, with no two accounts sharing device fingerprint or IP /24.
- On-device blocking via Apple's Call Directory Extension — no call interception, no carrier registration, no CALEA exposure.
- Sentry PII scrubbing (`beforeSend` stripping E.164 and UUID patterns), Supabase RLS on every table, Cloudflare Logpush audit trail, no contact upload, no call audio transmission.

**The tease:** Every competitor in this category uploads your contacts, records your calls, or both. Ringdocket does neither — and publishes the block list so you can audit the algorithm instead of trusting it.

### Angle 4 — Civic-tech / data journalism (Popular Science, 404 Media, Markup)

**Thesis:** The FTC receives millions of Do Not Call complaints a year. The FCC publishes enforcement actions weekly. The Industry Traceback Group publishes tracebacks. None of that data reaches the consumer. Ringdocket is the first product to pipe public scam-call data to consumers at scale.

**Proof points:**
- 53,227 FTC DNC complaints ingested *(as of Apr 22, 2026)*, feeding nightly block list promotion.
- Every campaign page cites its data provenance — FTC feed, FCC case number, ITG traceback.
- Public evidence ledger per campaign — every corroborating report timestamped and citable.

**The tease:** The data to make the spam economy legible has been public for a decade. No one piped it to the consumer. Ringdocket did.

### Angle 5 — Local / consumer press (WSJ Personal Technology, Wirecutter, Kim Komando)

**Thesis:** You've been reporting spam calls for years. Here's the blocker that tells you what happened next.

**Proof points:**
- Free forever on unlimited blocking — no card required.
- Takedown Report PDF, quarterly, personalized, signed with case citations the reader can forward to their kids or parents.
- 30-second install, 3-account corroboration rule protects legitimate businesses from revenge flagging.

**The tease:** Every spam blocker promises silence. Ringdocket promises silence plus a receipt — the scam campaign behind the call, the carrier that routed it, and the moment your report contributed to a takedown. Works on iPhone; Android coming.

---

*End of 04-messaging.md. For updates, keep the as-of dates current and run the same structure. Voice must track 01-foundation.md §4 (Core Values). No litotes, no "leverage," no "disrupt," no exclamation points in product copy.*
