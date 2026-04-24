# Ringdocket iOS — Brand Guide (for mockups)

> Companion to [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md). Same aesthetic, adapted for iOS native.

---

## 1. Product in one paragraph

Ringdocket is a public ledger for the spam-call economy. The iOS app does two things: it silences spam calls before they ring by syncing a nightly-refreshed block list (via the Call Directory Extension), and it lets users file reports that join a corroboration queue — three distinct corroborators within 14 days promotes a number to the public block list for every Ringdocket user. The dashboard side (web) shows the named campaigns, evidence ledgers, and takedowns; the iOS app is the quiet-the-phone side.

## 2. Aesthetic direction — "Forensic Ledger (Light)"

**Feel:** Warm paper, ink, and a thin accent. A case file on a desk — not a tech-bro dashboard. It should feel like the app could be printed and filed.

**Voice:** Direct, stoic, no-BS. No exclamation points, no filler, no "oops!" empty states. Narrative leads statistics.

**What this is NOT:**
- No neon, no gradients, no glassmorphism, no shiny call-blocker red/green
- No cartoon shield mascot or siren iconography
- No Helvetica/SF Pro as the primary display face
- No "5 star" style review count prominence

---

## 3. Color tokens — iOS mapping

Same tokens as the web. In Xcode create a Color Set per entry; in SwiftUI reference via `Color("ink-primary")` etc.

### Light (default)

| Token | Hex | Usage |
|---|---|---|
| `surface-paper` | `#F7F3EA` | Main background ("paper") |
| `surface-raised` | `#FFFFFF` | Cards, sheets above paper |
| `surface-inset` | `#EEE8DA` | Text fields, recessed buttons |
| `rule` | `#D8D0BE` | 1px hairlines, section dividers |
| `rule-subtle` | `#E6DFCD` | Tertiary dividers |
| `ink-primary` | `#1B1F27` | Body text, primary labels |
| `ink-secondary` | `#5C5D5F` | Supporting text |
| `ink-byline` | `#8D8875` | Metadata, timestamps |
| `ink-mono` | `#3A3D44` | Monospaced data (phone numbers) |
| `signal-flag` | `#D97742` | "You flagged this" (burnt orange) |
| `signal-corroborated` | `#2F6B4A` | On block list (deep moss green) |
| `muted-pending` | `#A89E85` | Awaiting corroboration (olive-tan) |
| **`accent-signal`** | **`#C2370A`** | **Stamp only — see rules** |
| `destructive` | `#8B2B1F` | Delist, dispute, delete |

### Dark ("Investigator mode" — opt-in from Settings, NOT `prefers-color-scheme`)

| Token | Hex |
|---|---|
| `surface-paper` | `#141821` |
| `surface-raised` | `#1B2030` |
| `surface-inset` | `#0D1118` |
| `rule` | `#2A3040` |
| `ink-primary` | `#E6E9EF` |
| `ink-secondary` | `#9098A8` |
| `ink-byline` | `#6E7486` |
| `ink-mono` | `#B8BEC8` |
| `signal-flag` | `#F4B478` |
| `signal-corroborated` | `#6FCF97` |
| `accent-signal` | `#E8572B` |

### Accent rules (STRICT)

`accent-signal` (`#C2370A`) appears **only** in:
1. Wordmark — the period after "Ringdocket"
2. The corroboration seal icon next to block-listed numbers
3. The "first flag" indicator on your own reports
4. A single 2px hairline under hero titles (60% opacity)

It is **never** on buttons, CTAs, tab bar icons, navigation, or hover/pressed states. If a screen has three accent touches, it's broken.

Tab bar selected state = `ink-primary`, not accent.

---

## 4. Typography

### Four families, four roles (same as web, embed the files)

| Role | Family | When | iOS notes |
|---|---|---|---|
| Display | Bricolage Grotesque | Hero titles, campaign names | Variable font — ship TTF in bundle; use `Font.custom("BricolageGrotesque", size:)` |
| Narrative | Newsreader (italic = emphasis) | Body prose, explanations, onboarding copy | Variable font |
| Utility | Inter Tight | Buttons, labels, nav, chips, tab bar | Static 400/500/600 |
| Evidence | JetBrains Mono | Phone numbers, timestamps, case IDs, counts | Static 400/500 |

**Role boundaries — iOS-specific:**
- NEVER use the system face (SF Pro) except where iOS forces it (system alerts, share sheet). This is a brand decision — SF Pro would make Ringdocket look like every other app.
- Dynamic Type: respect user size preferences. Use scaled fonts via `.font(.custom("Newsreader", fixedSize: 16, relativeTo: .body))` or the newer `ScaledFont` approach.
- All phone numbers render in JetBrains Mono. Always. Even in push notifications.

### Size scale (iPhone, 1x)

| Role | Family | Size | Weight | Line height |
|---|---|---|---|---|
| Large title | Bricolage Grotesque | 34 | 700 | 38 |
| Title | Bricolage Grotesque | 22 | 700 | 26 |
| Headline | Newsreader italic | 18 | 500 | 24 |
| Body | Newsreader | 16 | 400 | 24 |
| Secondary | Newsreader | 14 | 400 | 20 |
| UI label | Inter Tight | 13 | 500 | 16 |
| Caption | Inter Tight | 11 | 500, uppercase, letterspacing 0.08em | 14 |
| Data | JetBrains Mono | 14-16 | 400-500 | 20 |

---

## 5. Iconography

- **SF Symbols are allowed** for generic iOS affordances (back chevron, share, settings gear) — but swap fill for outline variants where possible to match the paper aesthetic.
- **Custom icons** for domain concepts (corroboration seal, first-flag dot, campaign tags). Draw as simple 1.5px line, ink-primary color, ~20x20 at 1x.
- **No filled circles with shadows, no animated Lottie mascots, no 3D.**

---

## 6. Components

### Button
- Primary: `ink-primary` background, `surface-paper` text, 6px radius, 16px vertical padding, Inter Tight 500 15px
- Secondary: transparent background, 1px `rule` border, `ink-primary` text
- Destructive: `destructive` text, transparent background, 1px `destructive` 30% border

### Card
- `surface-raised` background, 1px `rule` border, 10px radius, 16-20px internal padding
- No shadow. Paper doesn't cast shadows.

### State chips (the three-state ledger)
- Corroborated: `signal-corroborated` @ 12% bg, `signal-corroborated` text, 1px 30% border
- Flag: `signal-flag` @ 12% bg
- Pending: transparent bg, 1px **dashed** `muted-pending` border (dashed = waiting)

### Ledger row
- 44pt tall minimum (iOS touch target)
- Grid: phone number (JetBrains Mono, 15px, `ink-mono`) | meta (Newsreader 12px, `ink-byline`) | chip (right)
- 1px `rule-subtle` divider, no backgrounds

### Evidence row separator
- 1px horizontal rule at `rule-subtle`
- Every 4th row gets a 50% `surface-inset` tint — ledger-paper-like

---

## 7. Motion

- **One orchestrated entrance per screen**, not scattered micro-animations.
- **Report submission:** 300ms easeOut slide + scale from the Report button, confirmation chip pulses once.
- **Corroboration unlocked notification:** three-beat animation — number slides in, then the corroborators count ticks up (mono typewriter), then the seal stamps in with a 160ms scale.
- **No spring animations on scroll** — iOS native scrolling only.

---

## 8. Screens to mock (9 total)

### 8.1 Onboarding (3 screens)

Purpose: get the user to grant Call Directory permission, set expectations, and keep them in-flow.

1. **Welcome** — Bricolage hero: "Silence spam calls. *See who they were.*" | Newsreader lead explaining the two-layer product | "Get started" button
2. **Grant Call Directory permission** — iOS shows a system sheet, but screen BEFORE it primes the user: explain what it does (Ringdocket consults the block list; the app never touches calls directly) | "Enable blocking" button triggers the system prompt
3. **Sign in** — email input with magic-link flow. No password. Copy: "We'll email you a one-time link."

### 8.2 Home (authenticated) — the main tab

- Narrative hero at top: "This week you flagged N numbers. Most were Medicare scams." (or empty state: "Welcome to the ledger. Your work starts with a single flag.")
- Stats row: ALL-TIME REPORTS | THIS WEEK | FIRST-FLAG CREDITS (Bricolage numbers, Inter Tight labels)
- Recent Network Ledger card: 8 most recently corroborated numbers across the whole user base, with their reputation counts and campaign tags
- Primary CTA: "Report a spam call" (bottom floating action)

### 8.3 Report a call

- Phone number field (JetBrains Mono, big, with keypad keyboard)
- Category picker (modal sheet with 10 categories — Auto Warranty, IRS, Medicare, etc.)
- Notes field (280 char max, Newsreader font, optional)
- Quota meter: "4 of 5 remaining this month" in Inter Tight caption
- Submit button (primary)

### 8.4 Submission success

- Not a dialog — a full sheet
- Title: "Report filed."
- Newsreader body: "(402) 555-0199 is now in the pending queue. If two more distinct accounts corroborate within 14 days, the number promotes to the public block list."
- Two buttons: "View it in My Impact" (primary) | "Report another" (secondary)

### 8.5 My Impact — timeline

- Summary row at top: Pending | Corroborated | First flags (three number cards)
- "Pending" section — each row shows: phone number (mono), category + filed date + "expires in 12 days" (Newsreader meta), progress bar "1 of 3", "2 more to promote" caption
- "Corroborated" section — your promoted reports with first-flag pills where applicable

### 8.6 Campaigns list

- Header: "Every call has a campaign behind it."
- Ordered list of named campaigns with narrative summaries + number counts + "Active since Apr 2026"
- Tap row → campaign detail

### 8.7 Campaign detail (the transparency screen)

- Case ID caption: "CASE ID · RDKT-DEBT-RELIEF-CREDIT-REPAIR"
- Large Bricolage title with the campaign name
- Newsreader byline: active-since dates, number count, carrier info
- State chips row (corroborated / under traceback / first flag: you)
- 3-4 sentence narrative summary
- Source chip: "Data: FTC DNC feed + 3,190 user reports · Last updated Apr 22"
- Evidence ledger table — phone | timestamp | score — scrollable

### 8.8 Settings

- Sections: Account (email, plan, impact score, first-flag credits) | Email preferences (4 toggles, with descriptions beneath each) | Blocking (toggle Call Directory + "resync block list now" button + last synced timestamp) | Investigator mode (dark toggle) | Delete account
- Billing: "Upgrade" link if free, "Manage billing" if paid (opens Safari to Stripe Customer Portal)

### 8.9 Recent blocked activity

- iOS doesn't let us access the Recents list directly — but we can show the user's report history AND a "missed calls from blocked numbers may appear in your Recents" explainer
- Empty state for V1 — this is a forward-looking surface

---

## 9. iOS-native affordances to honor

- **Haptics:** on report-submit success (`UINotificationFeedbackGenerator.success`). Nothing else — haptic noise is worse than silence.
- **Dynamic Type:** all Newsreader and Inter Tight text scales with user preference
- **Dark mode:** opt-in only from Settings — do NOT respect `prefers-color-scheme` (brand decision)
- **Safe areas:** respect notch + home indicator; no content within 44pt of bottom edge unless it's a tab bar
- **Share sheet:** reports are private — no share affordance on them. Campaigns and corroborated numbers ARE shareable.
- **Push notifications:** variable-ratio "Your flag triggered a network block" notifications fire when a number you first-flagged gets corroborated. Copy: "(402) 555-0199 just joined the block list. Your flag started it." (Newsreader in notification body — fallback to system font gracefully)

---

## 10. What to skip in the first mockups

- iPad layouts (Ringdocket is phone-first V1)
- Lock screen widgets (post-launch)
- Siri shortcuts (post-launch)
- Apple Watch (explicitly out of scope)

---

## 11. Reference files

- [docs/DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — complete design tokens, component patterns
- [docs/PRD.md](./PRD.md) §7.1 — iOS functional scope, Call Directory Extension details
- [apps/web/src/pages/index.astro](../apps/web/src/pages/index.astro) — existing marketing landing page (aesthetic reference)
- Live pages — [ringdocket.com](https://ringdocket.com), [app.ringdocket.com/app/home](https://app.ringdocket.com/app/home)
