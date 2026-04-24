# Ringdocket iOS — Mockup Prompt

> Copy the block below into Claude (or a design tool that accepts briefs) to generate the 9-screen iOS mockup set.

---

## The prompt

```
Generate a high-fidelity iPhone 15 Pro (393×852pt) mockup set for Ringdocket, an iOS call-blocking app with a public ledger. Produce NINE screens as described. All nine on a single artboard, 3 columns × 3 rows, with the iPhone 15 Pro frame (notch, rounded corners, home indicator) visible around each screen. White presentation background between frames.

PRODUCT ONE-LINER
Ringdocket silences spam calls by syncing a nightly-refreshed block list via the Call Directory Extension. Users can also file reports — three distinct corroborators within 14 days promotes a number to the public block list. The dashboard side (web) shows named campaigns and evidence ledgers.

AESTHETIC — "Forensic Ledger (Light)"
- Warm paper + ink + hairline rules. A case file on a desk, not a tech dashboard.
- Light mode only for these mockups (dark mode is opt-in post-launch)
- NO neon, gradients, glassmorphism, shield icons, or siren red/green
- NO SF Pro system font — embed the four custom faces below
- Restraint. If a screen has three accent-color touches, it's broken.

COLORS (light mode)
- Background ("paper"): #F7F3EA
- Card surface: #FFFFFF
- Inset (inputs): #EEE8DA
- Hairline rules: #D8D0BE (primary), #E6DFCD (tertiary)
- Ink primary (body text): #1B1F27
- Ink secondary: #5C5D5F
- Ink byline (metadata): #8D8875
- Mono ink (data): #3A3D44
- Signal — corroborated (deep moss green): #2F6B4A
- Signal — first flag (burnt orange): #D97742
- Muted pending (olive-tan, used with dashed border): #A89E85
- ACCENT STAMP: #C2370A — used ONLY on: the Ringdocket wordmark period, the corroboration seal icon, the "first flag" dot, a single 2px hairline under hero titles. NEVER on buttons, links, nav, or focus states.

TYPOGRAPHY (4 faces, 4 jobs — enforce role discipline)
- Display (hero titles, campaign names): Bricolage Grotesque, 700-800 weight, tight letterspacing, -0.015em
- Narrative (body prose, italic emphasis): Newsreader — italic is a role-marker for emphasis
- UI (buttons, labels, nav, chips): Inter Tight, 500 weight, sometimes uppercase with 0.08em letterspacing for captions
- Evidence (phone numbers, timestamps, case IDs, scores): JetBrains Mono — ALL phone numbers render in this face, always

Sizes (pt):
- Large title: Bricolage 34/38, weight 700
- Title: Bricolage 22/26
- Headline: Newsreader italic 18/24
- Body: Newsreader 16/24
- UI label: Inter Tight 13/16, weight 500
- Caption: Inter Tight 11, uppercase, letterspacing 0.08em
- Data: JetBrains Mono 14-16, weight 400-500

VOICE
- Direct, stoic, no-BS. Stoic meaning: state facts, skip hedges.
- No exclamation points. No "oops!" or "whoops!" empty states.
- Narrative leads statistics: "This week you flagged 4 numbers" (not "4 numbers flagged this week")
- Italic is emphasis (Newsreader italic): "*See who they were.*"

COMPONENTS
- Buttons: primary = ink-primary bg (#1B1F27), paper text, 6pt radius, 16pt vertical padding; secondary = transparent, 1px rule border, ink-primary text
- Cards: surface-raised bg (#FFFFFF), 1px rule border (#D8D0BE), 10pt radius, 16-20pt padding. NO drop shadows — paper doesn't cast them.
- State chips: 12% signal-color background, full signal-color text, 1px 30%-opacity signal border; pending chips use a DASHED border in muted-pending (#A89E85) for "waiting" semantics
- Ledger rows: 44pt minimum height, monospace phone on the left, Newsreader italic meta in the middle, chip on the right, 1px rule-subtle divider

NINE SCREENS TO GENERATE

SCREEN 1 — Onboarding / Welcome
- Centered layout
- Bricolage hero (34pt): "Silence spam calls.\n*See who they were.*" (italic second line in Newsreader)
- Newsreader body (16pt, 62ch max width): "Ringdocket installs a shared block list on your iPhone. Spammers never get through. Then the dashboard shows you the campaigns you helped take down."
- Primary button: "Get started" (bottom, full width minus 20pt margins)
- Caption at very bottom: "Free · no tracking · unlimited blocking" (JetBrains Mono 11pt, ink-byline)

SCREEN 2 — Onboarding / Enable blocking
- Bricolage title: "Enable Call Directory."
- Newsreader body (3 short lines): "iOS needs permission to consult the block list. The app never touches your calls directly — iOS silences listed numbers before your phone rings."
- Inset illustration: a simple 1.5px line drawing of a phone with a list icon next to it (ink-primary, no color)
- Primary button: "Enable blocking" (triggers iOS system prompt)
- Secondary: "Skip for now"

SCREEN 3 — Onboarding / Sign in
- Bricolage title: "Welcome to the ledger."
- Caption: "Sign in" (JetBrains Mono, accent color #C2370A, uppercase)
- Email input (inset background, JetBrains Mono 16pt placeholder "you@example.com")
- Primary button: "Email me a sign-in link"
- Fine print (Newsreader 13pt, ink-byline): "No password. We'll email you a one-time link."

SCREEN 4 — Home (authenticated, populated state)
- Status bar area: "Ringdocket." wordmark, period in accent red (#C2370A)
- Caption top: "THIS WEEK" (Inter Tight 11pt, accent red, uppercase)
- Bricolage hero (28pt): "This week you flagged *4* numbers."
- Newsreader lead: "Most were Medicare scams. All-time you've filed 47 reports and earned 2 first-flag credits on numbers that later corroborated."
- Three-stat row (Bricolage numbers, Inter Tight labels):
    ALL-TIME REPORTS: 47  |  THIS WEEK: 4  |  FIRST-FLAG CREDITS: 2 (with a small red dot before the label)
- Card: "NETWORK LEDGER — live" — list of 5 recently corroborated numbers:
    (760) 498-1404  Medicare Card Renewal · 14 min ago  [●2 chip, moss green]
    (480) 916-3507  Uncategorized · 18 min ago  [●2]
    (267) 274-6183  Tech Support Scam · 22 min ago  [●2]
    ...
- Bottom tab bar: Home (selected, ink-primary filled dot indicator), Report, Campaigns, My Impact, Settings. Use Inter Tight 11pt labels, simple line icons in ink-secondary.
- Floating action button bottom right: "+ Report" (ink-primary bg, paper text)

SCREEN 5 — Report a call
- Bricolage large title: "File a report."
- Newsreader sub: "*Put it on the record.*"
- Form fields:
  1. Label "PHONE NUMBER" (Inter Tight uppercase caption) → big JetBrains Mono input, placeholder "(402) 555-0199"
  2. Label "WHAT WERE THEY PRETENDING TO BE?" → select picker showing "Medicare / health insurance" selected, chevron right
  3. Label "NOTES (OPTIONAL)" → Newsreader textarea, placeholder "What did they say? Any distinctive script or urgency tactic?"
- Quota meter below: "QUOTA  4 of 5 remaining this month" in an inset block with left border
- Primary button: "File report" full width
- Newsreader caption at bottom: "Notes are never displayed publicly."

SCREEN 6 — Submission success
- Full sheet, no modal overlay
- Large Newsreader italic: "Report filed."
- Newsreader body (16pt): "(402) 555-0199 is now in the pending queue. If two more distinct accounts corroborate within 14 days, the number promotes to the public block list — and stops ringing for every other Ringdocket user."
- Two stacked buttons: "View it in My Impact →" (primary), "Report another" (secondary)

SCREEN 7 — My Impact (timeline)
- Bricolage title: "Your work, *itemized.*"
- Summary card: 3 columns — PENDING: 1 | CORROBORATED: 12 | FIRST FLAGS: 2 (Bricolage numbers)
- Section header "PENDING · 1 number in the queue" (Inter Tight caption)
- Pending row: (804) 498-9397 monospace | Bank Fraud · filed Apr 22 · expires in 14 days (Newsreader italic meta) | Right side shows "1 of 3", a 4px progress bar filled 33%, "2 more to promote" caption
- Section header "CORROBORATED · 12 on the public record"
- Corroborated rows (3 visible): phone in mono, Medical Scam · Apr 18 meta, FIRST FLAG pill on the right (Inter Tight caption, accent red with a dot) for the top one; "seq. 2" mono caption on the others

SCREEN 8 — Campaign detail (the transparency screen)
- Top: "CASE ID · RDKT-DEBT-RELIEF-CREDIT-REPAIR" JetBrains Mono caption, ink-byline
- Bricolage huge title: "Debt Relief & Credit Repair"
- Newsreader italic byline: "Active since Apr 2026 · 3,190 corroborated numbers · 3 carriers implicated"
- Three state chips: [corroborated · 3,190] moss-green, [under traceback] neutral, [first flag: you] accent red with dot
- Newsreader narrative (3 sentences): "Debt-relief, credit-repair, and consolidation pitches — the single largest DNC complaint bucket. Most operators charge upfront fees then fail to deliver actual debt resolution. 'Cut your credit-card balance to pennies on the dollar' is the signature script."
- Source chip (inset, JetBrains Mono 11pt): "Data: FTC DNC feed + 3,190 user reports · Last updated Apr 22 · Corroboration threshold: 3 / 14d"
- "EVIDENCE LEDGER" caption + "3,190 rows · top 25 shown"
- 5 rows visible: monospace phone | Newsreader italic relative time (2 days ago, yesterday) | right side: JetBrains Mono "136 reports" etc.
- Last row partially visible, implying scroll

SCREEN 9 — Settings
- Bricolage title: "Your account, *your record.*"
- Three grouped sections (each = a card):
  1. ACCOUNT card: key-value list — Email: yourname@gmail.com | Plan: Ringdocket Full (with "Manage billing →" link in accent red on the right) | Impact score: 147 | First-flag credits: 2
  2. EMAIL PREFERENCES card: 4 toggle rows, each with an italic Newsreader title and a Newsreader body description below. First toggle "Weekly — Public Enemy #1 digest" unchecked; "Monthly — personal impact" checked; "Quarterly — Takedown Report" checked; "Transactional" checked + disabled with "Required." caption
  3. INVESTIGATOR MODE card: single toggle "Dark theme" with Newsreader caption
  4. DELETE ACCOUNT card (outlined in accent red 30% opacity): Newsreader body explaining anonymization + "Email delete@ringdocket.com →" link

DELIVERABLE
- One artboard, 3×3 grid of iPhone frames, iPhone 15 Pro chrome visible
- Each frame labeled with screen number + name below the frame in Inter Tight 11pt caption
- Background between frames: plain white
- Spacing between frames: 40pt vertical, 32pt horizontal
- Total artboard size: roughly 1400 × 2900pt

STYLE GUARDRAILS (repeat, because this is where AI design tools slip):
- NO SF Pro. Use the four declared faces.
- NO neon. NO gradients. NO glassmorphism. NO shadows on cards.
- NO multi-color iconography — line icons only, single ink color.
- State chip dashed border is ONLY for pending (waiting semantic).
- Accent red (#C2370A) appears ONLY where specified. Do not add it to buttons, focus rings, or decorative elements.
- If a screen has 3+ accent-red touches, you've made a mistake — audit and reduce.
```

---

## How to use this prompt

1. **For design tools like Figma AI, Uizard, or Galileo:** paste the whole block above. Output should be one artboard with the 9 screens in a 3×3 grid.

2. **For Claude (text):** paste with "Generate SVG or HTML mockups of each screen using these specs" — Claude will produce component-level sketches you can iterate on.

3. **For a designer brief:** hand them this file + `docs/ios-brand-guide.md` + link to the live web dashboard (`app.ringdocket.com/app/home`) for aesthetic reference. Designer mocks in Figma.

4. **For the Pencil MCP tool:** open a new .pen file and paste the prompt. Pencil will draft the 9 screens with the Forensic Ledger visual language.

## What to iterate on after the first pass

- **Empty states.** First pass will emphasize populated states. Request a separate empty-state pass (new user, 0 reports, onboarding step 2 after permission denied).
- **Error states.** Network offline, quota exceeded, auth expired.
- **Notification designs.** iOS push notification mock-ups for the "Your flag triggered a block" moment.
- **Call Directory Extension UI.** Minimal — it's a system-level feature, but the block list version indicator in Settings → Phone → Call Blocking & Identification should mention "Ringdocket" cleanly.

## Brand non-negotiables (print this next to your design monitor)

1. Accent red is a stamp, not a color palette.
2. Bricolage Grotesque for display only, never in UI chrome.
3. Newsreader italic is emphasis. Never Bricolage italic.
4. Every phone number, everywhere, is JetBrains Mono.
5. Dashed border = waiting. Solid = settled. Don't mix.
6. One orchestrated entrance per screen. No scattered micro-animations.
