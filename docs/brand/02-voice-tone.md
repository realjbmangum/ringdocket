## 1. What this document is

The Ringdocket voice and tone reference. Every writer — human, LLM, contractor, future hire — reads this before touching a line of copy. Every prompt that generates product or marketing text includes a pointer to it. If a sentence doesn't match the rules below, the sentence is wrong. Rewrite it.

The guide itself is written in Ringdocket voice. That's the point.

Source references:

- [apps/web/src/pages/index.astro](../../apps/web/src/pages/index.astro) — canonical marketing voice
- [apps/web/src/pages/campaigns/[slug].astro](../../apps/web/src/pages/campaigns/[slug].astro) — SEO page voice
- [apps/web/src/pages/number/[phone].astro](../../apps/web/src/pages/number/[phone].astro) — "is X a scam" voice
- [apps/web/src/components/islands/NarrativeHero.tsx](../../apps/web/src/components/islands/NarrativeHero.tsx) — authenticated dashboard voice
- [apps/web/src/components/islands/ReportForm.tsx](../../apps/web/src/components/islands/ReportForm.tsx) — form microcopy
- [docs/PRD.md](../PRD.md) §13 "Copy discipline (legal-adjacent)" — the non-negotiable legal rails

---

## 2. Voice principles

Seven rules. Voice is constant across every surface — marketing, product, legal, notifications, email. Tone shifts; voice doesn't.

### 2.1 State facts. Skip hedges.

Ringdocket is a public record of spam calls. Public records don't hedge. If a number has 412 reports, say 412. "Likely retired" *is* the fact when the inference is what we have. Hedges like "perhaps," "it seems," "we think" cost the reader trust.

- ✓ "412 corroborated numbers. Active since January 2026."
- ✗ "We believe there may be around 412 numbers associated with this campaign."

### 2.2 Narrative leads statistics.

Numbers belong inside sentences, not inside grids on first impression. A prose lead gives the reader a reason to care before the figure lands. Stat grids follow the prose — they don't replace it.

- ✓ "This week you flagged 4 numbers. Most were Medicare impersonations."
- ✗ "Reports this week: 4 / Category: Medicare / Credits: 0"

### 2.3 Italic is emphasis. Bold is broken.

Emphasis is Newsreader italic, used in headlines as a rhetorical pivot ("Silence spam calls. *See who they were.*"). Bold is reserved for in-body weight on specific data points — a phone number, a report count. If you reach for bold to *shout*, rewrite the sentence flatter.

- ✓ "First it blocks. *Then it shows you why.*"
- ✗ "First it blocks. **THEN IT SHOWS YOU WHY!**"

### 2.4 Name the scam. Don't euphemize it.

Every campaign has a name — Medicare Card Renewal Ring, Auto Warranty Extension, IRS Impersonation, Utility Shutoff Scam. Use it. Softening protects the scammer. Naming is the product.

- ✓ "Classified as a Medicare Card Renewal Ring scam."
- ✗ "May involve potentially deceptive health-related outreach."

### 2.5 Every number is evidence. Write like it's a case file.

Ringdocket is a ledger, not a dashboard. A phone number is a piece of evidence with a provenance chain. Writing should sound like it belongs next to a case citation. Terse. Dated. Sourced.

- ✓ "(402) 555-0142 · corroborated · 412 reports · first flagged Apr 18"
- ✗ "Uh oh — looks like this number has been spamming people a lot!"

### 2.6 Specificity beats apology.

Name what broke and what to do next. Don't open with "we're sorry." Don't close with "please be patient." Readers want the next move, not sympathy.

- ✓ "Couldn't save your report. Network dropped during the request — try again."
- ✗ "Oops! Something went wrong. Please try again later."

### 2.7 No exclamation points. No emoji. No theatrics.

Ringdocket's credibility rests on sounding like a civic document, not a startup. A "🎉" on a confirmation screen tells the reader that what they just did was not serious. It *is* serious — they added a number to a public block list.

- ✓ "Report filed."
- ✗ "Report filed! 🎉"

---

## 3. Tone modulation by context

Voice is constant. Tone shifts to fit the moment. Here's the map.

| Context | Tonal adjustment |
|---|---|
| Marketing landing page | Confident, slightly literary. Italic pivots land. Narrative ledes set up the product. Sentences can run long if they earn it. |
| Authenticated dashboard — empty state | Inviting but not saccharine. "Welcome to the ledger" beats "Welcome!" A first action is implied, not begged. No confetti. |
| Authenticated dashboard — populated state | Matter-of-fact receipt. The user already knows what they did; you're reporting it back to them the way a court clerk would. |
| Error messages | Specific, human, no apology theater. State what failed, why if known, and what to do. One sentence when possible, two when not. |
| Legal / compliance copy | Precise, unembellished. "Reported as" not "confirmed." "Alleged" not "obvious." Reads like a terms page in a well-run newsroom. |
| Push notifications | Terse, concrete. Fragment sentences are fine. Every word earns its slot. No teaser phrasing ("You won't believe…"). |
| Email digests | Editorial, slightly longer-form. Reads like a newsletter column, not a transactional receipt. Has a lede, a middle, and a close. |
| Delist appeal / defamation-adjacent | Extra precise, no taunting. Even the appellant who's lying gets the same respectful procedure. Zero sarcasm. Zero "we'll look into it." |
| Public SEO pages (e.g. "is (402) 555-0142 a scam") | Direct answer first, then nuance. Yes / no up top. Source chain and appeal link below. Written for a human who just got a sketchy call. |
| Onboarding screens (iOS) | Instructional, patient. Numbered steps. No "woo, you did it!" rewards — the reward is the phone going quiet. |
| Upgrade prompts | Stoic pitch. "Here's what you get. Here's the price." No scarcity theater except the Founding Flagger 500 cap, which is real and cited. |

---

## 4. Copy anti-patterns to kill

Forbidden patterns and their Ringdocket replacements. Not exhaustive — directional. If a phrase smells like any of these, it probably is.

1. ✗ "Oops! Something went wrong." → ✓ "Couldn't save your report. Network dropped during the request — try again."
2. ✗ "Awesome! Report filed." → ✓ "Report filed."
3. ✗ "We'll get back to you as soon as possible." → ✓ "Every appeal is read by a human. Expect a response within 72 hours."
4. ✗ "Woohoo! You earned a badge." → ✓ "First-flag credit logged on (402) 555-0142."
5. ✗ "Thanks for being awesome." → ✓ "Your reports are on the public record."
6. ✗ "We think this might be spam." → ✓ "Reported as spam by 412 users."
7. ✗ "Innovative, cutting-edge call blocking technology." → ✓ "A shared block list your phone consults before ringing."
8. ✗ "Disrupting the call-blocker industry." → (delete)
9. ✗ "Frictionless onboarding." → ✓ "Thirty seconds. No account required at this step."
10. ✗ "Delightful user experience." → (delete)
11. ✗ "A magical way to block spam." → ✓ "Your phone stops ringing. That's the product."
12. ✗ "Growth hacking the scammer economy." → (never used)
13. ✗ "Hustle culture for civic good." → (never used)
14. ✗ "Join thousands of users who love Ringdocket." → ✓ "15,000+ numbers on the public block list."
15. ✗ "Our community." → ✓ "Reporters" or "users."
16. ✗ "This number is a confirmed scam." → ✓ "Reported as spam by 412 users. Classified as a Medicare Card Renewal Ring scam."
17. ✗ "This campaign has been shut down." → ✓ "Attributed takedown — FCC Case 2026-0418" (cited) or "Likely retired — 30 days of zero activity" (inferred).
18. ✗ "You're all set!" → ✓ "Install complete. The block list syncs overnight."
19. ✗ "Let's get started." → ✓ "File your first report."
20. ✗ "Sorry for the inconvenience." → ✓ "The report didn't save. Your session expired. Sign back in and retry."
21. ✗ Thoughtful trailing ellipsis… → one complete sentence.
22. ✗ "We partnered with the FTC." → ✓ "We ingest the FTC National Do Not Call complaint feed."

---

## 5. Structural patterns

Signature sentence shapes that make Ringdocket sound like itself.

**Display + italic pivot.** A declarative first sentence followed by an italic second that reframes it. "Silence spam calls. *See who they were.*" "First it blocks. *Then it shows you why.*" Use sparingly — these are the product's rhetorical spine, not every headline.

**Case-file framing.** Every number is evidence. Every campaign is a case. Every report is a flag on the record. Writing leans on vocabulary from newsrooms and civil procedure: record, corroborated, cited, attributed, traceback, ledger, evidence.

**Em-dash enumerations.** When listing two or three related items inside a sentence, use em-dashes. "Three distinct corroborators — different devices, different networks — within fourteen days." Bullets are for four or more items, or scannable product features.

**Humanist digits in prose, monospace when data is the point.** In narrative sentences, Newsreader digits: "412 reports." In ledger rows, evidence cards, case IDs, and phone numbers as evidence, JetBrains Mono: `(402) 555-0142`. Monospace signals "row of data, not line of prose." Never mix mid-sentence.

**Fragments where appropriate.** In notifications and state chips, fragments carry weight. "Flagged." "Pending." "Corroborated." "Retired." Full sentences dilute them.

**Numerals as quantities, not expressions of awe.** "412 reports" not "412!" The number carries the force; exclaiming it weakens it.

---

## 6. Vocabulary — allowed and forbidden

### Allowed (preferred)

ledger · record · public record · on the record · corroborate · corroborated · pending · retired · attributed takedown · likely retired · campaign · evidence · case · case file · rap sheet · flagged · first-flag · first-flag credit · report · reporter · takedown · traceback · provenance · citation · cited · paper trail · block list · carrier chain · carrier attribution

### Forbidden (always wrong)

rockstar · game-changer · frictionless · delightful · magical · magic · wow · awesome · amazing · innovative · cutting-edge · disrupt · disrupting · disruptive · hustle · growth hacking · synergy · leverage (as verb) · unlock (as in "unlock value") · empower · journey · community (as synonym for "users") · family (as in "Ringdocket family")

### Prefer the specific over the generic

- "dashboard" → "ledger" (when referring to the authenticated transparency view specifically). "Dashboard" is acceptable when speaking generically about the web app as a product surface.
- "user" → "reporter" (when specifically referring to someone who files reports)
- "database" → "public record" or "block list"
- "algorithm" → "corroboration threshold" or whatever the actual mechanism is

### Legal-sensitive vocabulary (PRD §13, non-negotiable)

- "alleged" — always when describing an unconfirmed scam classification.
- "reported as" — always when stating what users have said, never "confirmed as."
- "attributed takedown" — only when a public enforcement source (FCC case, ITG traceback) is cited.
- "likely retired" — when inferred from activity decay only. Never conflate with attributed takedown.
- "partnership" / "partnered with" — never, for the FTC, FCC, or ITG. We use their public data; that is the extent of the relationship.

---

## 7. Emoji and punctuation policy

**Emoji: never.** No emoji in marketing copy, product UI, notifications, emails, push messages, support replies, delist responses, receipts, onboarding, or legal pages. Not one. Not ever. Not even internal. If someone argues "but a smiley would soften this," they're arguing for a softer product — which is not the product.

**Exclamation points: never in product or marketing copy.** Single exception: literal quotes from scammer scripts in illustrative examples ("Your Medicare card is about to expire!"), where the punctuation is part of the quote.

**Em-dashes: freely.** Spaced em-dashes — like this — are the house style. They carry the rhythm.

**En-dashes: for ranges only.** "2024–2026." "Pages 3–7."

**Curly quotes: always.** Smart quotes in copy, not straight. Straight quotes in code and monospace data are fine — they render as data, not prose.

**Ellipses: literal omission only.** Trimming a quote: correct. Trailing off thoughtfully: bad copy. Finish the sentence.

**Sentence case headlines.** Not Title Case. "Every campaign has a rap sheet." Not "Every Campaign Has A Rap Sheet."

---

## 8. Voice for different roles in the product

**Home hero, empty state.** "Welcome to the ledger. *Your work starts with a single flag.*" Not a pep talk. The ledger exists; the user's role in it doesn't yet.

**Home hero, populated.** "This week you flagged 4 numbers. *Most were Medicare impersonations.*" Matter-of-fact receipt.

**Campaign narrative summaries.** Editorial distance, like a beat reporter. "This campaign began with a handful of reports out of Nebraska in January, impersonating CMS to request Medicare card renewal numbers. It now spans 14 states and uses rotating spoofed caller IDs." Not promotional. Sourced.

**Evidence ledger captions.** Terse, factual. No verbs where a noun will do. "corroborated · 412" beats "Has been corroborated by 412 distinct reporters."

**Error states.** Specific, next-step-oriented. "Couldn't save your report. Your session expired. Sign back in and retry." The error message is itself evidence — it tells the user what the system did.

**Push notifications.** Fragment-sentence specific. "Your flag on (402) 555-0142 just corroborated. It's now on the block list." Not "Good news — your report helped!"

**Delist appeal responses.** Precise, fair, no taunting. The appellant may be telling the truth, or may be a scammer cleaning their record — either way, same civil procedure. "Your appeal on (402) 555-0142 has been received. Every appeal is read by a human. You'll hear back within 72 hours. Reference: APL-2026-0418."

**Onboarding (iOS).** Instructional, patient, short. "Grant Call Directory permission. This lets iOS consult the Ringdocket block list before ringing. The app never touches your calls directly."

**Takedown Report PDF.** Editorial and formal, the closest the product gets to a broadsheet masthead. A civic document, not a gamification trophy.

---

## 9. Fifteen gold-standard example sentences

When in doubt, match the cadence of these. They're either pulled from the current product or newly crafted to fit.

1. "Silence spam calls. *See who they were.*"
2. "First it blocks. *Then it shows you why.*"
3. "Every campaign has *a rap sheet.*"
4. "Transparency, attribution, *and a paper trail.*"
5. "This week you flagged 4 numbers. *Most were Medicare impersonations.*"
6. "Report filed."
7. "Welcome to the ledger. *Your work starts with a single flag.*"
8. "Three distinct corroborators — different devices, different networks — within fourteen days."
9. "Reported as spam by 412 users. Classified as a Medicare Card Renewal Ring scam."
10. "Couldn't save your report. Network dropped during the request — try again."
11. "Every appeal is read by a human. Expect a response within 72 hours."
12. "Takedowns get cited, not claimed."
13. "Your civic work, itemized."
14. "iOS silences them before your phone rings. You'll see them as missed calls in Recents if you care to look. Most people never do."
15. "Blocking is free forever. Pay only if you want the transparency dashboard, gamified reporting credit, and the quarterly Takedown Report. One tier. No ladder."

---

## 10. When in doubt

Three questions, in order:

1. **Would a beat reporter write this?** If yes, ship it. If no, rewrite.
2. **Does this sentence respect the reader's time?** If it hedges, apologizes, or performs excitement, it doesn't.
3. **Would the accent stamp `#C2370A` feel at home next to this paragraph?** The accent is reserved for civic-weight moments — corroboration seals, first-flag indicators, Takedown Report mastheads. If the prose next to it feels softer than the stamp, the prose is wrong, not the stamp.

If all three check out, the copy is on voice. Ship it.
