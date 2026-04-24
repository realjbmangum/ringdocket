# Ringdocket — Brand Applications

**Status:** Draft v1 · April 22, 2026
**Owner:** Brian Mangum / LIGHTHOUSE 27 LLC
**Depends on:** [01-foundation.md](./01-foundation.md), [../DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md), [../ios-brand-guide.md](../ios-brand-guide.md), [../PRD.md](../PRD.md)

What this is: the touchpoint playbook. How Forensic Ledger (Light) shows up on every surface a user, reader, journalist, or regulator ever sees. One rule repeats in different dialects across fifteen surfaces — the product is a public register, not a utility app, and every surface inherits that voice.

If a surface contradicts this doc, this doc wins. If this doc contradicts the design system or the foundation, those win.

---

## 1. Marketing site — ringdocket.com apex

### Purpose

Convert. First surface most users ever see. Three jobs, in order: make the value prop legible inside eight seconds, hand the skeptic enough evidence to move, and route the committed visitor to the App Store or the pricing page. Programmatic surfaces (`/number/[phone]`, `/campaigns/[slug]`) do a second job — they are the public record, indexable, citable, the SEO engine and the press artifact at once.

Live references: [apps/web/src/pages/index.astro](../../apps/web/src/pages/index.astro), [apps/web/src/pages/app/home.astro](../../apps/web/src/pages/app/home.astro).

### Visual rules

| Element | Rule |
|---|---|
| Layout rhythm | Ledger Hero (7/12 + 5/12) on desktop, stacked narrative-first on mobile. No 50/50 splits anywhere on the domain. |
| Hero type scale | Bricolage 700 at `--font-display-hero` (40–72px clamp). One italic emphasis phrase per hero, Newsreader italic. |
| Atmospheric | Ledger rules + fiber on every page. Hero radial only on the apex hero and `/campaigns/[slug]` case title. |
| Accent density | Never more than two `#C2370A` touches per viewport. Wordmark period counts as one. |
| CTAs | Always `ink-primary` background. "Download on the App Store" uses the official Apple badge SVG, placed against paper with a 1px `rule` hairline beneath. |
| Images | No photography. Device mockups only, rendered flat against paper. No people, no phones held in hands, no call-center stock. |
| Footer | Five-column: wordmark block, product, public record, legal, contact. Case-citation line at the very bottom in mono: `Ringdocket is operated by LIGHTHOUSE 27 LLC · Charlotte NC · Issued 2026`. |

### Voice adjustment — acquisition register

Utility-first at the top. Civic framing starts in the third paragraph or below the fold. The header reads like a pitch; the body reads like a features section; the campaign cards read like headlines; the pricing page reads like a receipt. PRD §17 bans block-rate claims, "AI-powered" language, countdowns, and "join the fight" rhetoric. Enforce at review.

### Component patterns

- **Ledger Hero** — narrative column left, live ledger column right (most recently corroborated numbers, max 5 rows).
- **Section transition** — `<h2>` in Bricolage with one italic phrase, Newsreader lead paragraph under, cap at 66ch.
- **Campaign card (marketing)** — mono case ID top-left, Bricolage campaign name, Newsreader 2-sentence summary, state chip row, mono metadata footer.
- **Pricing card** — three anchors (Free / Annual / Monthly), Founding Flagger banner above with live counter in mono.
- **Programmatic `/number/[phone]`** — narrow column, case-ID header, status chip, corroboration count, campaign attribution if any, "report this number" CTA, "last updated" mono byline.
- **Press quote block** — blockquote in Newsreader, byline in Inter Tight caps with letterspacing 0.08em.

### Do / don't

- **Do** open every hero with a direct sentence. Never a question headline ("Tired of spam?"), never a fear prompt.
- **Do** link every claim on the page to a programmatic record or PRD section. Citation is the product.
- **Do** use the italic emphasis phrase in hero `<h1>` sparingly — one per page, never two.
- **Do** leave the Founding Flagger counter visible whenever spots remain. The scarcity is real and earns the placement.
- **Do** ship `/press` and `/about` before month six. Journalists won't link to a site without them.
- **Don't** put `#C2370A` on a button. Ever. This rule fails most often on the marketing site; enforce it in PR review.
- **Don't** use exclamation points in body copy, microcopy, or buttons. Marketing emails included.
- **Don't** use stock phone-on-desk photography, red-siren iconography, or shield-with-checkmark vector art.
- **Don't** show a countdown timer on any pricing or launch surface.
- **Don't** auto-play video. No video on the apex at V1.

### Example snippets

Hero: *"The only spam blocker that tells you who called, what scam, and what's being done about it."*

Sub-hero: *"Ringdocket silences spam calls on iPhone and publishes every blocked number as public record. See the campaign, the carrier, and the case."*

Pricing banner: `312 of 500 Founding Flagger spots claimed. $19.99/yr, locked forever.`

Programmatic number page title: *"(402) 555-0199 — reported 412 times. Attributed to the Medicare Card Renewal Ring."*

---

## 2. Authenticated web dashboard — app.ringdocket.com/app/*

### Purpose

Deliver the retention layer. Everything past login is a private case file, not a pitch. The dashboard is where a user becomes a Flagger — the receipt surface, not the storefront. Density increases, accent density stays flat.

### Visual rules

| Element | Rule |
|---|---|
| Layout rhythm | Sticky Sidebar (3/12 nav + 9/12 content) on desktop; drawer nav on mobile. Home uses Ledger Hero. |
| Type scale | One display-section header per view, Bricolage 700 24px. All other structure is narrative or mono. |
| Data tables | Evidence row primitive. 4-row banding. JetBrains Mono on every phone number, timestamp, and case ID. |
| Motion | One orchestrated entrance per route change. Row-level cascades are fine, page-level sparkles are not. |
| Investigator mode | Opt-in toggle in Settings. Dark tokens only. Never triggered by `prefers-color-scheme`. |
| Asymmetry | Home (Ledger Hero), Campaign detail (Rap Sheet 60/40), My Reports (3/12 + 9/12). No symmetric dashboards. |

### Voice adjustment — receipt register

Authenticated copy is terse. The user is already in. Prose exists to orient, not to sell. Home opens with a sentence about this user's week: *"This week you flagged 4 numbers, 3 tied to the Medicare Card Renewal Ring."* Campaign pages open like a police blotter. My Reports reads like an itemized statement. No marketing voice past the paywall.

### Component patterns

- **Dashboard hero** — narrative prose, stat line items below, *not* a stat-grid hero. Two-line prose lead, three line-item stats underneath.
- **Evidence row** — see design system §7. Primary primitive of the product.
- **Campaign card** — case ID, name, 2-3 sentence narrative, chip row, source chip, evidence ledger table.
- **Source chip** — `Data: FTC DNC feed + 3,190 user reports · Last updated Apr 22`, mono, right-aligned under campaign summary.
- **Quota meter** — Inter Tight caption, `4 of 5 remaining this month`. Free tier only.
- **Pending progress bar** — thin, `signal-pending` tint, `1 of 3 corroborators` in mono caption.

### Do / don't

- **Do** lead every authenticated view with prose about the user, not a dashboard number.
- **Do** render all phone numbers, case IDs, timestamps, and corroboration counts in JetBrains Mono.
- **Do** use state chips with the three-state rule: corroborated (solid moss), flagged (solid orange), pending (dashed olive).
- **Do** keep Investigator Mode a unlockable reward — offered after the user's first corroboration.
- **Do** link every dashboard claim to the public record URL when one exists.
- **Don't** show Spotify-Wrapped style hero numerals. Stats are line items, never a centerpiece.
- **Don't** animate on every hover. One orchestrated entrance per page.
- **Don't** show toast notifications with checkmark icons. State chips morph in place instead.
- **Don't** use colored backgrounds on rows to indicate state — use chips. Row background changes only on pending → corroborated flip.
- **Don't** ship a "customize dashboard" surface. Prescribed layout is the product.

### Example snippets

Home lead: *"Two of the numbers you flagged last month just joined the block list. One is tied to a campaign the FCC opened a traceback on yesterday."*

Empty My Reports: *"No reports yet. Your first flag carries the most weight — every new campaign starts with one."*

Pending row: `(402) 555-0199 · 1 of 3 · filed Apr 18 · expires in 12 days`

---

## 3. iOS app

### Purpose

Phase 4 build. The quiet side of the product — silence the phone, file a report, occasionally glance at the ledger. A user should be able to install, grant Call Directory permission, and never open the app again. When they do open it, every surface should feel like the same object as the web dashboard, with iOS density discipline.

Reference: [ios-brand-guide.md](../ios-brand-guide.md).

### Visual rules

| Element | Rule |
|---|---|
| Touch targets | 44pt minimum on every interactive surface, including ledger rows. |
| Density | Lower than web. Screens are narrower; use white space, not columns. |
| Fonts | Bundle all four families as TTF. System font (SF Pro) only inside unavoidable iOS chrome (share sheet, system alerts). |
| Dynamic Type | Newsreader and Inter Tight scale with user preference; Bricolage stays fixed at display sizes. |
| Haptics | Only on report-submit success. No other haptics anywhere. |
| Tab bar | Three tabs max: Home, Campaigns, Report. Selected state uses `ink-primary`, not accent. |
| Dark mode | Opt-in via Settings → Investigator mode. Never from `prefers-color-scheme`. |

### Voice adjustment — pocket register

Mobile copy is tighter than web. Sentences get shorter; paragraphs become one line. The voice is the same — direct, stoic, no filler — but the air between sentences compresses. Onboarding is three screens, never four. Empty states read like one-line captions in a photo journal.

### Component patterns

- **Narrative hero tile** — top of Home tab, one sentence about this week, then a three-line mono stat block.
- **Ledger row (iOS)** — 44pt tall, mono phone number, Newsreader meta, chip right-aligned.
- **Report sheet** — full-screen sheet, mono phone input with keypad keyboard, category modal, optional notes, quota meter, submit button.
- **Submission success sheet** — full sheet, `Report filed.` as Bricolage title, Newsreader explanation, two buttons.
- **Settings row** — Inter Tight label, optional Newsreader descriptor beneath, toggle or chevron right.

### Do / don't

- **Do** render every phone number in JetBrains Mono — including push notifications where the system allows.
- **Do** ship an ink-primary tab bar. SF Symbols outlined, not filled.
- **Do** use `UINotificationFeedbackGenerator.success` on report-submit. Nothing else.
- **Do** keep the onboarding sequence to three screens: welcome, Call Directory grant, sign-in.
- **Do** honor safe areas — no content within 44pt of bottom edge outside the tab bar.
- **Don't** use SF Pro as the primary face. Ship the four family TTFs.
- **Don't** use the red call-blocker aesthetic. No bright reds, no shield icons, no siren glyphs.
- **Don't** show a "rate this app" prompt inside the first 30 days.
- **Don't** ship widgets, Siri shortcuts, or watchOS in V1.
- **Don't** show streak counters, daily-engagement badges, or leaderboards. Ever.

### Example snippets

Onboarding welcome: *"Silence spam calls. See who they were."*

Permission prime: *"Ringdocket consults a block list on your phone. We never touch your calls."*

Submission success body: *"(402) 555-0199 is now in the pending queue. If two more distinct accounts corroborate within 14 days, the number promotes to the public block list."*

Empty Home: *"Welcome to the ledger. Your work starts with a single flag."*

---

## 4. Email — transactional

### Purpose

Magic-link sign-in, receipts, subscription lifecycle mail, appeal responses. These are the emails the user expects and will go looking for. They carry the brand in their silence — clean, serif, unmistakable.

### Visual rules

- Plain HTML, no images above a small footer wordmark. No hero banners.
- Single column, max-width 560px, centered. White background, `ink-primary` text.
- Newsreader 16/24 for body; Inter Tight for the one button, if any.
- No tracking pixels, no utm parameters that the user sees, no open-tracking GIFs. Open rate is not a metric we optimize.
- CAN-SPAM footer on every email — physical address, sender identification, unsubscribe link (for marketing), "this is a transactional email" disclosure (for transactional).
- From name: `Ringdocket`. Reply-to: `support@ringdocket.com`. No no-reply addresses.

### Voice adjustment — transactional register

One sentence of context, one sentence of action. No greeting pleasantries. No signature line with a forced first-name warmth. The email is a receipt, not a letter.

### Template skeleton

```
Subject: [Specific thing that happened. No emoji. No exclamation point.]

[One-sentence context. What just happened or what you need to do.]

[Optional: button — Inter Tight, ink-primary background, single CTA, no "or" alternatives.]

[Optional: one more sentence of context. Expiration, next step, source.]

—
Ringdocket
LIGHTHOUSE 27 LLC · [physical mailing address] · Charlotte NC
[Unsubscribe link if marketing] · [Support: support@ringdocket.com]
```

### Do / don't

- **Do** use direct subjects: "Your sign-in link," "Your Ringdocket receipt for April," "Your delist request — approved."
- **Do** send magic-link emails with a 10-minute expiration mentioned in the body.
- **Do** show the requesting device and IP region on every sign-in link email. Security hygiene.
- **Do** keep every transactional email under 120 words.
- **Do** include the CAN-SPAM footer even on transactional mail. Same template, same address.
- **Don't** use emoji in the subject line. Ever.
- **Don't** write "we're excited to have you" or any onboarding warmth copy. The tone is receipt, not greeting card.
- **Don't** embed tracking pixels on transactional email.
- **Don't** use stock illustration headers. No images.
- **Don't** wrap the body in a colored backdrop. White paper, ink type.

### Example snippet

```
Subject: Your Ringdocket sign-in link

Sign in from Chrome on macOS (Charlotte, NC region):

[Sign in → ringdocket.com/auth/verify?token=…]

This link expires in 10 minutes. If you didn't request it, ignore this email — the link is one-time-use.

—
Ringdocket
LIGHTHOUSE 27 LLC · [PO Box] · Charlotte NC 28202
support@ringdocket.com
```

---

## 5. Email — editorial digests

The retention layer. PRD §11. Three cadences, three distinct tone modules, one shared layout system.

### 5a. Weekly — "Public Enemy #1"

**Purpose:** news-of-the-week brisk. A campaign-of-the-week post by Monday. Subject line is a named campaign.

**Visual:** newspaper masthead at top (Bricolage `RINGDOCKET` wordmark, hairline rule under), issue date in Newsreader italic, single-column body, one blockquote callout, line-item stats at bottom.

**Voice:** journalistic. Third-person lead, personal cell at the bottom ("Your reports contributing: 4."). No opinion pieces. No founder first-person in the weekly.

**Example subject:** `This week's Public Enemy #1: the Medicare Card Renewal Ring.`

**Example lead:** *"412 numbers. Eight carriers. One campaign. The Medicare Card Renewal Ring was the most-reported scam on Ringdocket this week, accounting for one in nine user flags and one in five first-flag credits issued."*

### 5b. Monthly — personal impact report

**Purpose:** personal receipt. First Monday of each month.

**Visual:** no masthead. Opens with the user's name (if known), Newsreader body, mono line-item stats. No "Spotify Wrapped" hero numerals.

**Voice:** personal but not chummy. Second-person. "Here's what you did in April." Close with the next cadence — "Your Q2 Takedown Report arrives June 30."

**Example lead:** *"In April, you filed 11 reports. Four joined the block list. Two earned you a first-flag credit — one on the Medicare Card Renewal Ring, one on a new auto warranty variant filed for the first time by you."*

### 5c. Quarterly — Takedown Report PDF

**Purpose:** civic-identity artifact. The retention keystone. Paid subscribers only. PDF, letter-sized, editorial longform.

**Visual:** Magazine Cover layout — full-bleed Bricolage 800 42pt masthead, `accent-signal` hairline rule under, Newsreader 11pt single-column body at 62ch, seal of record bottom right. PRD §16 and design system §10 are authoritative.

**Voice:** editorial longform. Third-person framing ("You helped flag N numbers across M campaigns this quarter. X are now under FCC investigation.") Civic identity forward. This is the email a subscriber forwards. Written like a Wirecutter longread, not a Mailchimp digest.

**Example opener:** *"In Q2 2026, Ringdocket users corroborated 1,240 new numbers onto the public block list. Three campaigns crossed into attributed-takedown status — all three cited by either the FCC or the ITG in the same quarter. You helped flag 14 of them."*

### Do / don't (editorial digests)

- **Do** name the campaign in the subject line.
- **Do** include the personal cell ("Your reports contributing: 4") at the bottom of the weekly.
- **Do** ship the Takedown Report as an actual PDF, not an HTML email that calls itself a report.
- **Do** match the masthead to the design system. Bricolage wordmark, accent-signal period, hairline under.
- **Do** keep the weekly under 400 words.
- **Don't** send the weekly to free-tier users. It's a paid retention hook.
- **Don't** mix cadences — the weekly is not the monthly is not the quarterly. Each is a separate SendGrid unsubscribe group.
- **Don't** ship a Takedown Report that says "0 campaigns taken down." PRD §11 blocks this. Delay shipping until the numbers exist.
- **Don't** use celebratory framing ("You received 47 spam calls!"). PRD §11 rejected this — negative identity signaling.
- **Don't** write in the weekly voice in the monthly template. The tone modules are distinct.

---

## 6. Push notifications (iOS)

### Purpose

Fire rarely. The corroboration notification — *"your flag just triggered a network block"* — is the single push we care about. PRD §11 and ios-brand-guide §9 treat it as the variable-ratio retention moment.

### Visual & format rules

- Body in Newsreader if iOS renders custom font in notifications; fall back to system gracefully. Do not fight iOS.
- Phone numbers always in JetBrains Mono where the payload supports it; fall back to system monospace (`SFMono`) if custom fonts don't render.
- One line of title, one line of body. No action buttons in V1.
- Badge count used only for first-flag credits earned. Never for unread emails or app open counts.

### Timing policy

- Quiet hours: no push between 10pm and 8am user-local. Enforced server-side with user timezone.
- Frequency cap: one push per user per 24 hours. Hard cap. Overflow waits or drops.
- Latency: corroboration-unlocked push fires within 48 hours of promotion or not at all. A stale "your flag mattered" notification is worse than none.

### Voice

Concrete. Minimal. Always name the number and the campaign if both are known.

### Do / don't

- **Do** name the phone number in the body.
- **Do** fire only on genuine corroboration events — the user's flag just promoted a number.
- **Do** respect quiet hours absolutely.
- **Do** cap at one push per day, hard.
- **Do** ship a Settings toggle — users turn these off with one tap.
- **Don't** push marketing content. Ever.
- **Don't** push to remind users to open the app. No retention spam.
- **Don't** show a push for every report submission. The submit screen already confirms.
- **Don't** use emoji in push bodies.
- **Don't** A/B test notification copy. The voice is the voice.

### Example

```
Title: Your flag triggered a block.
Body: (402) 555-0199 just joined the public block list. Your first flag started it.
```

---

## 7. Social media presence

### Purpose

Owned-and-borrowed channel surface. Build the public record in public. The audience is journalists, power-reporters (Marcus persona), and the Reddit/HN adjacency. Not mainstream consumers — those come from App Store and press.

### Channel matrix

| Channel | What we post | What we don't | Visual treatment |
|---|---|---|---|
| **Twitter / X** | Block-list screenshots, campaign takedown threads, methodology notes, weekly digest teasers, Founding Flagger counter updates. | Memes, reply-guy engagement, political takes, "hot takes" in general. | Screenshots rendered on paper backgrounds with ledger rules. No watermarks. |
| **LinkedIn** | Carrier accountability pieces, data-journalism posts, press mentions, hiring. Brian as founder voice, Ringdocket as publication voice. | Hustle-culture posts, inspirational quotes, "here's what I learned building in public" tropes. | Single image posts with editorial caption. Newsreader body on paper. |
| **Instagram** | Visual campaign excerpts, Takedown Report covers, pull-quotes from the weekly. Treated as a clippings archive. | Stories about the team, behind-the-scenes, product announcements (those go to X first). | Vertical 4:5, ledger-paper backgrounds, mono data layered over Newsreader callouts. |
| **Reddit** | Technical AMAs, methodology explainers, response to user reports of scams in r/scams and r/robocalls. | Self-promotion outside designated subs. Upvote brigading. Cross-posting our own threads. | Text-first. Screenshots only when load-bearing. |

### Content pillars (four)

1. **Campaign of the week** — data story, screenshot, methodology note. Monday or Tuesday.
2. **Carrier accountability** — who routed what, who's named in which traceback. Mid-week.
3. **Methodology transparency** — how corroboration works, how we treat pending numbers, what's public vs. private.
4. **Civic receipts** — user-submitted Takedown Report snippets (with permission), first-flag milestones, cap-filled announcements.

### Voice adjustment — social register

Observational. Data-dense. The house style is "show the screenshot, explain the method, move on." Never chase engagement bait. Never quote-tweet a dunk. Never subtweet. If the post needs hedge words, it's not ready to post.

### Do / don't

- **Do** post real block-list screenshots with phone numbers partially masked — last four digits only.
- **Do** cite the FCC / ITG / FTC source on every data post.
- **Do** reply to every thoughtful comment within 48 hours. Not every comment — thoughtful ones.
- **Do** maintain a visible posting cadence of at least once per week per platform, once launched.
- **Do** use Ringdocket's voice for the brand handle; Brian uses his own voice on his personal handle.
- **Don't** post memes, reaction GIFs, or "spam callers be like" jokes.
- **Don't** run giveaways or engagement contests.
- **Don't** auto-cross-post. Each channel gets channel-native framing.
- **Don't** reply to every negative comment. Ignore trolls; engage skeptics with data.
- **Don't** post opinion takes on unrelated news. Stay in lane.

### Example post

X: *"Public Enemy #1 this week — the Medicare Card Renewal Ring. 412 numbers, 8 carriers, one traceback open at the FCC. Full ledger + attribution chain: ringdocket.com/campaigns/medicare-card-renewal-ring"* [image: screenshot of campaign page, paper background]

---

## 8. Press kit — ringdocket.com/press

### Purpose

Reduce friction for any journalist who lands on the site. Self-serve wordmark, color chips, founder bio, one-page narrative, screenshots. No contact form — direct email to `press@ringdocket.com`.

### Layout

- Single Sticky Sidebar page. Left rail: anchor nav (Narrative, Wordmark, Screenshots, Bio, Quotes, Contact).
- Narrow Newsreader body column at 66ch for the narrative and bio.
- Full-bleed asset grid for screenshots — three-column on desktop, single-column on mobile.
- Download button is `ink-primary`. Each asset block includes a one-line mono caption describing the file ("Ringdocket wordmark · SVG · 14kb").

### Contents

| Section | What it contains |
|---|---|
| One-page narrative | Company description (300 words), founding date, founder, LLC name, headquarters, business model, what's distinctive. |
| Wordmark downloads | SVG + PNG, light and dark variants, with and without the accent-signal period. |
| Color chips | Paper, ink-primary, accent-signal, signal-flag, signal-corroborated — with hex values in mono. |
| Founder bio | Brian Mangum, 150 words, neutral third-person. Photo optional, Brian decides. |
| Screenshots | Hero (marketing), dashboard home, campaign detail, Takedown Report cover. PNG + WebP, 2x. |
| Quotes | Two to four approved pull-quotes from Brian or Ringdocket. Newsreader italic. |
| Contact | `press@ringdocket.com`. No form. Mailto link. |

### Voice

Neutral third-person in the narrative and bio. Journalistic. The press kit is written to be quoted, not to persuade.

### Do / don't

- **Do** ship the press kit before any pitch goes out.
- **Do** include an exact 300-word company description — journalists copy-paste it.
- **Do** provide wordmarks with adequate clear space guidance (min 1x cap-height).
- **Do** offer the Takedown Report PDF sample as part of the kit.
- **Do** date the press kit and version the file names (`ringdocket-press-kit-v1-2026-04.zip`).
- **Don't** include a founder headshot you haven't approved with Brian.
- **Don't** embed a contact form. Email only, mailto link.
- **Don't** include marketing copy in the narrative — press reads past it.
- **Don't** make assets downloadable as a single zip only. Individual files too.
- **Don't** put anything NDA-gated here. Press kit contents are public by definition.

### 300-word company description (template)

*"Ringdocket is a public accountability ledger for the spam-call economy, operated by LIGHTHOUSE 27 LLC out of Charlotte, North Carolina. The iOS app silences spam calls on the user's phone by syncing a nightly-refreshed block list via Apple's Call Directory Extension. The web dashboard publishes every reported number, every named campaign, and every carrier attribution chain as public record. A number only joins the block list when three independent accounts corroborate it within a rolling fourteen-day window. Ringdocket is the only spam blocker in the US market that operates as a public register — no proprietary database, no sold data, no block-rate claims. Source data includes FTC Do Not Call complaint feeds, FCC press releases, ITG tracebacks, and user-submitted corroborated reports. Founded by Brian Mangum in 2026. Subscribers pay $3.99/month or $29.99/year. The free tier includes unlimited blocking."*

---

## 9. App Store listing

### Purpose

Convert App Store traffic into downloads. Short-form copy with strict character caps. The screenshots do most of the work.

### Copy slots

| Field | Cap | Draft |
|---|---|---|
| Name | 30 | `Ringdocket: Spam Call Ledger` |
| Subtitle | 30 | `Block spam. See the campaign.` |
| Promotional text | 170 | `The only spam blocker that names the scam campaign behind every call. 412 reports become a case file. Your flag earns first-flag credit when the number gets blocked.` |
| Keywords | 100 | `spam,robocall,block,scam,caller id,truecaller,hiya,nomorobo,fcc,medicare,warranty,ftc` |
| Description | 4000 | See draft below. |

### Screenshots (six)

1. **Home tab** — narrative hero, stats line, network ledger.
2. **Campaign detail** — Medicare Card Renewal Ring case page with evidence ledger.
3. **Report flow** — mono phone number input, category sheet.
4. **My Impact** — pending queue with progress bars.
5. **Takedown Report** — preview of quarterly PDF cover.
6. **Settings / Investigator mode** — optional dark variant reveal.

Each screenshot has a Bricolage caption at the top and a Newsreader sub-caption beneath, on a paper background. No iPhone frame — flat device-mockup rendering.

### Draft description

```
Spam calls stopped being random noise years ago. They're organized. They run as campaigns. Someone profits. Someone routes them. Someone should be named.

Ringdocket silences spam calls on your iPhone using a nightly-refreshed block list — the same way every decent spam blocker does. What makes Ringdocket different is the other half: a public ledger that names the campaign behind every blocked call, cites the carrier that routed it, and shows you when your report contributed to something actually happening.

Here's what you get:
• Unlimited blocking, free. The block list refreshes nightly via Apple's Call Directory Extension.
• Report any spam call. Numbers you flag join a corroboration queue — three independent accounts within 14 days, and the number joins the public block list.
• First-flag credit. When a number you flagged first gets corroborated, your account gets the receipt.
• Campaign pages. Every number on the block list is linked to the scam campaign behind it, the carrier that routed it, and any open FCC traceback.

Paid ($3.99/month or $29.99/year) unlocks the full dashboard — trending campaigns, carrier attribution, your personal impact score, the weekly "Public Enemy #1" digest, and the quarterly Takedown Report PDF.

Architecture notes we think you'll care about:
• On-device blocking via Apple's Call Directory Extension. Ringdocket never touches your calls.
• Block list stored locally on your device.
• No contact-book upload. Ever.
• No call recording. Ever.
• No IDFA, no cross-app tracking, no ATT prompt.

Operated by LIGHTHOUSE 27 LLC out of Charlotte, NC. Founding Flagger pricing — $19.99/year locked forever — available for the first 500 annual subscribers.
```

### Do / don't

- **Do** lead the subtitle with what makes Ringdocket distinct, not what makes it a spam blocker.
- **Do** state the privacy architecture in the description body. App Store reviewers read it.
- **Do** refresh screenshots when the design system ships updates. Stale screenshots kill conversion.
- **Don't** use App Store "ratings" language ("Top-rated!"). Banned in PRD §17.
- **Don't** use emoji in copy fields.
- **Don't** show block-rate percentages in screenshots or copy.
- **Don't** claim partnerships with FCC / FTC / ITG. PRD §13: we use their public data. That is the relationship.

---

## 10. Receipts, invoices, billing touchpoints (Stripe)

### Purpose

Stripe-generated receipts, invoices, and payment failure notices. These are the emails the user saves in a folder labeled "receipts." They must look like Ringdocket's emails, not like Stripe's defaults.

### Stripe branding settings to configure

| Setting | Value |
|---|---|
| Logo | Ringdocket wordmark SVG (light variant, with accent-signal period). |
| Accent color | `#1B1F27` (ink-primary). Note: not accent-signal. Stripe uses the color for buttons and headers; ink-primary matches our CTA rule. |
| Public business name | `Ringdocket` |
| Business address | LIGHTHOUSE 27 LLC, [PO Box], Charlotte NC 28202 |
| Support email | `support@ringdocket.com` |
| Product display names | `Ringdocket Paid · Monthly` · `Ringdocket Paid · Annual` · `Ringdocket Founding Flagger · Annual` |
| Customer portal header | `Manage your Ringdocket subscription.` |

### Receipt footer text (custom)

```
Thanks. This receipt is kept on file at ringdocket.com/account/billing.
Ringdocket is operated by LIGHTHOUSE 27 LLC. Charlotte, NC.
Questions? support@ringdocket.com.
```

### Do / don't

- **Do** verify the Stripe receipt renders correctly on Gmail, Apple Mail, and Outlook after every branding change.
- **Do** list the plan by its product display name, not the Stripe price ID.
- **Do** route refund emails through support@ with a templated response (see §11).
- **Do** set the customer portal to show only: plan, renewal date, payment method, cancel button.
- **Don't** use accent-signal (`#C2370A`) as the Stripe accent color. Save the stamp for the product itself.
- **Don't** let Stripe's default "Thanks for your payment!" greeting survive. Override in branding settings.
- **Don't** suppress refund receipts. Every refund sends its own receipt.
- **Don't** include marketing content in billing emails. Billing is transactional.

---

## 11. Customer support surfaces

### Purpose

Inbound email handling for `support@`, `refunds@`, `delete@`, `privacy@`, `press@`. Voice must match Ringdocket's voice everywhere — precise, unapologetic, human. Not corporate-apologetic, not chummy, not canned.

### Mailbox routing

| Mailbox | Purpose | Response SLA |
|---|---|---|
| `support@ringdocket.com` | General help, feature requests, bug reports | 2 business days |
| `refunds@ringdocket.com` | Refund requests routed to Stripe Customer Portal first | 2 business days |
| `delete@ringdocket.com` | Account deletion requests (CCPA/VCDPA/CPA/CTDPA) | 45 days hard SLA |
| `privacy@ringdocket.com` | Right-to-know / right-to-delete / right-to-correct | 45 days hard SLA |
| `press@ringdocket.com` | Journalist inquiries | 1 business day |
| `appeals@ringdocket.com` | Delist requests (number owners) | 10 business days |

### Response templates

**Delist approved:**

```
Your delist request for [number] has been approved. The number has been removed from the Ringdocket public block list. The historical record — that the number was reported N times between [date] and [date] — remains on file as part of the public ledger. Future reports on this number will re-enter the corroboration queue independently.

If you believe the record itself is factually incorrect (not just that you would prefer it removed), reply to this email with specifics and we'll review the record.

—
Ringdocket
```

**Delist denied:**

```
Your delist request for [number] has been declined. The number currently has [N] corroborated reports from independent accounts, tied to the [campaign name] campaign. Corroborated reports are part of the public ledger and are not removable absent a factual dispute.

If you dispute the factual accuracy of any specific report, reply to this email with the case IDs and we'll review the records. If the number is on the block list in error, we'll correct it.

—
Ringdocket
```

**Refund approved:**

```
Your refund for [amount] has been processed and will appear on your original payment method within 5–10 business days. Your Ringdocket subscription ended on [date]. Your account remains active on the free tier — unlimited blocking stays on.

—
Ringdocket
```

**Account deletion confirmation:**

```
Your Ringdocket account has been deleted. Within 30 days, all personally-identifiable data associated with the account will be purged from our systems — email address, sign-in records, PostHog session data, Sentry crash data, and any user-submitted notes.

Anonymized report signals — phone numbers reported, categories, timestamps, corroboration counts — remain in the public record as aggregate data. These signals are not tied to your account or any personal identifier.

This action is not reversible. If you resubscribe later, you'll start a new account.

—
Ringdocket
```

### Do / don't

- **Do** reply in full sentences. Never one-word acknowledgements.
- **Do** sign every email `Ringdocket` — no first-name signatures unless the recipient has already been in a named thread with Brian.
- **Do** preserve the voice: direct, stoic, unapologetic, human.
- **Do** quote the user's original request back in the reply so they know you read it.
- **Do** escalate anything legal-adjacent (threatening language, subpoena, formal complaint) to Brian directly within the same business day.
- **Don't** apologize for normal things (the wait time, the product itself, an explained decision).
- **Don't** use canned "we appreciate your patience" or "sorry for the inconvenience" padding.
- **Don't** use emoji in support replies.
- **Don't** respond with a support-ticket number alone. The reply is the response.
- **Don't** grant a delist without checking the public record. Every delist is a deliberate decision.

---

## 12. Legal & compliance pages

### Purpose

/privacy, /terms, /can-spam, /security, /dsar. Legal precision with design-system discipline.

### Layout pattern

- Narrow column, 56–64ch. Single-column, centered.
- Newsreader 16/1.6 body. Inter Tight for section headers (not Bricolage — display face is too loud for legal).
- Every section heading gets a mono case-citation style identifier — `§1 · What we collect`, `§2 · How we use it`.
- Effective date and version in mono at the top of every page.
- Change log at the bottom — every material revision dated, with a one-sentence summary.

### Voice

Plain-language legal. No layperson paraphrase *instead of* the binding text — both, if needed. Sections use the same dialect throughout. "We" and "you," not "the Company" and "the User."

### Do / don't

- **Do** keep the 56–64ch column width. Legal text at full width is unreadable.
- **Do** date every change and preserve the change log forever.
- **Do** link privacy@, delete@, and the physical address at the bottom of every legal page.
- **Do** list every third-party processor by name (PRD §13 checklist).
- **Do** render "Effective: April 22, 2026 · v1.0" in JetBrains Mono at the top.
- **Don't** put a 404 page behind any legal URL — broken legal links are a compliance finding.
- **Don't** use Bricolage display for legal section headers. Inter Tight only.
- **Don't** use the atmospheric hero radial on legal pages. Ledger rules + fiber only.
- **Don't** push marketing CTAs inline in legal copy.
- **Don't** auto-redirect old legal URLs without a 30-day transitional banner.

---

## 13. 404 / empty / error / maintenance states

### Purpose

The edges. Users are frustrated; brand voice matters most here. Every edge state should feel in-voice, specific, and point to a next step.

### Templated copy

| State | Title | Body |
|---|---|---|
| **404** | `Case file not found.` | `That URL doesn't point to anything in the ledger. It may have been removed, relocated, or never existed. Return to [the dashboard] or [search the public record].` |
| **500** | `Something on our end.` | `An unexpected error occurred. The issue has been logged. Try again in a moment. If it keeps happening, email support@ringdocket.com with the case ID below.` *(Include a mono case ID derived from the Sentry event.)* |
| **Maintenance** | `On the bench.` | `Ringdocket is down for scheduled maintenance. Expected back by [UTC timestamp]. Block list syncing on iPhone is unaffected.` |
| **Offline (PWA cache)** | `No network.` | `You're offline. Cached pages still work; the public ledger refreshes when you reconnect.` |
| **Empty — My Reports** | `No reports yet.` | `Your first flag carries the most weight — every new campaign starts with one.` |
| **Empty — search** | `No matches in the ledger.` | `Nothing on that query. Try a phone number, campaign name, or case ID.` |

### Visual rules

- Same atmospheric layer as every other page — ledger rules + fiber. No solid backgrounds.
- Bricolage display title. One Newsreader body paragraph. One Inter Tight link or button.
- No illustration, no mascot, no "oops!" sticker art. Ever.

### Do / don't

- **Do** render the case ID on 500 pages in mono. Users paste it into support email.
- **Do** keep the 404 body under 40 words.
- **Do** offer exactly one forward link — the dashboard home or the public record search.
- **Do** render errors during magic-link sign-in with a targeted message, not a generic 500.
- **Don't** use humor on error pages. The tone is stoic, not cute.
- **Don't** use "Whoops!" or "Oh no!" or similar. Banned.
- **Don't** render a broken evidence row on a 404 — no fake-data props.
- **Don't** redirect errors silently. Show the state; log the event.
- **Don't** auto-reload the page on a maintenance state. Users decide when to retry.

---

## 14. Founder / team communications

### Purpose

Brian's personal public surfaces — Substack, personal site, LinkedIn. The founder is a human; Ringdocket is a case file. The founder's voice is warmer and more personal than the brand's voice.

### Voice relationship

| Surface | Voice owner | Register |
|---|---|---|
| Ringdocket marketing site | Ringdocket brand | Direct, stoic, no-BS |
| Ringdocket dashboard | Ringdocket brand | Receipt-register, terse |
| Ringdocket emails (digests) | Ringdocket brand | Editorial |
| Substack | Brian Mangum | Founder journal — first-person, more personal, more discursive, can use first-person singular, can admit uncertainty, can name specific people (with permission). |
| Brian's personal LinkedIn | Brian Mangum | Professional first-person. |
| Brian's personal site (if/when) | Brian Mangum | Portfolio + writing index, editorial warmth. |

### Rules

1. The Ringdocket brand account never speaks in first-person singular. "We" at most.
2. Brian's personal surfaces can speak about Ringdocket using "I built…" and "I'm learning that…"
3. When Brian quotes or references a Ringdocket data point on his personal surface, he links to the public ledger URL.
4. Brian's Substack can run founder-journal essays ("Why I'm building a spam-call ledger") that would be wrong in Ringdocket's brand voice.
5. When Ringdocket the brand needs to cite the founder ("Brian Mangum, founder"), it uses neutral third-person.

### Do / don't

- **Do** let Brian's voice on his Substack be more personal than Ringdocket's voice. The warmth belongs there.
- **Do** cross-link — Substack links to ringdocket.com; the press kit links to Substack.
- **Do** keep family, faith, and non-Ringdocket civic work on Brian's personal surfaces, not the brand.
- **Don't** use Brian's Substack to announce product news as primary. Ringdocket's own surfaces break news first.
- **Don't** let the brand account post in first-person singular. "I" belongs to Brian.
- **Don't** blur the two. If a user emails support@ expecting to reach Brian personally, the response comes from Ringdocket.

---

## 15. Partner / co-brand

### Purpose

Co-publication with journalists, NGOs, or adjacent privacy products. Co-branded campaign pages, joint press releases, guest essays.

### Lockup rules

Per the visual identity doc's co-brand spec: the partner mark sits to the right of the Ringdocket wordmark, separated by a vertical hairline rule in `rule` color, with equal optical weight. Minimum clear space equals the cap-height of the Ringdocket wordmark. Neither mark takes `accent-signal` in a co-brand context — the accent period on the Ringdocket wordmark stays, but no additional accent touches are added.

### Voice agreement template

Before any co-publication:

1. Whose voice leads — Ringdocket's or the partner's?
2. Whose data backs the claims — and who cites which source?
3. Who gets quoted in the press kit?
4. Where does the piece live — on ringdocket.com or the partner domain?
5. What happens to the URL in six months — does it stay up, get archived, get redirected?

### Do / don't

- **Do** publish a co-brand piece only when both sides' voices genuinely fit — civic-identity register, fact-forward, cite-don't-claim.
- **Do** preserve the partner's mark at equal optical weight.
- **Do** name the partner in the URL structure when the piece lives on ringdocket.com (`/campaigns/consumer-reports-medicare-ring`).
- **Do** run every co-brand piece through PRD §13 copy discipline — "attributed" vs. "likely" rules apply.
- **Don't** co-brand with consumer products whose voice is incompatible (shield iconography, block-rate boasts).
- **Don't** let the partner's visual language override Ringdocket's — the lockup sits inside Ringdocket's page, not the other way around, when the piece lives on our domain.
- **Don't** accept paid sponsorship framing. Co-publishing is editorial, not sponsored.
- **Don't** co-brand on error or legal pages.
- **Don't** issue a Takedown Report PDF with a partner lockup. The Takedown Report is a Ringdocket artifact.

---

## Things we'll never do

Absolute list. If any of these ever ship, the brand is broken and a retro is required. Each is load-bearing.

- We will never sell, license, or syndicate the block list to aggregators, data brokers, or advertisers.
- We will never share user email addresses with third parties beyond the named service processors documented in the privacy policy.
- We will never upload a user's contact book, for any reason, under any architecture.
- We will never intercept, record, transcribe, or analyze call audio.
- We will never use IDFA, cross-app tracking, or fingerprinting for advertising.
- We will never show an ATT prompt, because we will never operate a use case that requires one.
- We will never promote a number to the public block list from a single user report without three-account corroboration inside the rolling 14-day window.
- We will never use the word "confirmed" about a report we haven't independently sourced. We use "reported N times."
- We will never claim an FCC, FTC, or ITG partnership. We use their public data; that is the extent of the relationship.
- We will never claim a campaign was "shut down" when "likely retired" is accurate.
- We will never publish a Takedown Report that claims zero campaigns taken down. We delay shipping until the numbers exist.
- We will never send a marketing email that uses an exclamation point in the subject line or body.
- We will never put `#C2370A` on a button, link, nav element, or focus ring.
- We will never use stock photography of scary spam callers, hooded figures at laptops, or phones-ringing-ominously.
- We will never use a shield, a siren, a lock, or a checkmark-in-a-circle as our logo mark.
- We will never use confetti, streaks, leaderboards, daily-engagement badges, or busywork gamification.
- We will never push marketing content as a push notification.
- We will never send a push notification between 10pm and 8am user-local.
- We will never fire more than one push notification per user per 24 hours.
- We will never use a countdown timer on a pricing page.
- We will never A/B test notification or email copy. The voice is the voice.
- We will never show a "rate this app" prompt inside a user's first 30 days.
- We will never publish user-submitted free-text notes on any public surface or share them with third parties.
- We will never grandfather-strip a paying subscriber from a price they locked in. Every raise is forward-only.
- We will never auto-enroll a user in a paid tier by expiration of a trial without an affirmative re-opt.
- We will never outsource customer support to an overseas contractor or a bot. Replies come from a human.
- We will never use SF Pro, Inter, Roboto, Arial, or Helvetica as Ringdocket's primary display face.
- We will never co-brand on a legal, error, or Takedown Report surface.
- We will never use "AI-powered" language in product copy.
- We will never use "join the fight," "stop robocalls forever," or any crusade-frame acquisition headline.
- We will never use user-count braggadocio ("trusted by 50,000 Americans") on the marketing site until the number is both true and verifiable in the public ledger.
- We will never delete a public-record campaign page once published — corrections are appended, not erased.

*End of applications. Brand voice, design system, and foundation remain the source of truth; this doc tells the surfaces how to wear them.*
