# Ringdocket — Visual Identity

> Companion to [../DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md) (tokens, components, Tailwind config) and [../ios-brand-guide.md](../ios-brand-guide.md) (iOS adaptation). This document canonicalizes the identity — wordmark, stamp, color meaning, icon system, motion vocabulary, and touchpoint application. Tokens are not duplicated here; they live in the design system. If there is ever a conflict, DESIGN-SYSTEM.md wins on tokens and this file wins on meaning.

---

## 1. Identity philosophy

Ringdocket is a public ledger for the spam-call economy. The product's whole argument is that every other blocker treats its database as a secret and we treat ours as a record. The visual identity has to argue the same thing in a quarter-second.

That is why the aesthetic is "Forensic Ledger (Light)." Warm paper, ink, hairline rules, and a single red stamp. The surface of the product looks like an evidence file on a desk, not a dashboard in a pitch deck. A scam victim who has been burned by a glossy app should open Ringdocket and feel like they are reading a court record instead of being sold to. Transparency is the product; restraint is the aesthetic that earns the word.

The four-face type system enforces that restraint. Bricolage Grotesque for display gives us a modern newspaper masthead — contemporary enough to feel like 2026, structured enough to feel edited. Newsreader for narrative means prose leads statistics; the home screen reads like an editorial lede, not a dashboard tile. Inter Tight for UI chrome disappears, which is the job of chrome. JetBrains Mono for evidence is the visual commitment that phone numbers, case IDs, and timestamps are not decoration — they are data, treated as data. Four voices, four jobs, no overlap. When a designer is tempted to blend them, the answer is almost always no.

The paper-and-ink metaphor is not nostalgia. It is the argument that this work belongs in a record that could be printed, filed, cited, and contested. The accent `#C2370A` is the red ink stamp on that record — rare, final, and meaningful. When a user sees it, something has been attested.

---

## 2. The wordmark — "Ringdocket."

The wordmark is the primary identity. There is no companion symbol mark. This is deliberate: a symbol would invite iconography we don't need, and the period already does the work a mark would do.

### Construction

- **Face:** Bricolage Grotesque, weight 700, opsz set to the equivalent of the rendered size (variable axis, not static)
- **Letterspacing:** `-0.01em`
- **Color:** `ink-primary` (`#1B1F27` light / `#E6E9EF` dark) for the letters "Ringdocket"
- **The period:** `accent-signal` (`#C2370A` light / `#E8572B` dark), placed immediately after the "t" with `margin-left: 0.05em`
- **No tracking adjustments between letter pairs.** The Bricolage kerning tables are correct; do not override them.

The canonical implementation lives in [../../apps/web/src/components/ui/Nav.astro](../../apps/web/src/components/ui/Nav.astro) — the `::after` pseudo-element pattern is the reference. Any other surface (email, PDF masthead, press kit) must reproduce the exact same construction.

### Primary lockup

Text only. "Ringdocket." with the accent period. No symbol beside it, no tagline under it, no descriptor line. The only permitted pair-up is a co-brand lockup (see below).

### Minimum size

- **Screen:** 72px wide (wordmark bounding box, not letter-only). Below 72px the period reads as noise.
- **Print:** 0.75 inches wide. Below this, the period loses hue fidelity on most four-color processes and should instead render in `ink-primary` (monochrome variant).

### Clear space

On all four sides, clear space ≥ the x-height of the rendered wordmark. At 24px type this is roughly 13-14px of margin. Ledger rules, nav rules, and card borders are not permitted inside that zone.

### Variants (three, no more)

| Variant | Letters | Period | When |
|---|---|---|---|
| **Primary** | `ink-primary` | `accent-signal` | Default — paper background, light mode |
| **Inverse** | `surface-paper` | `accent-signal` | On `ink-primary` or dark backgrounds |
| **Monochrome** | `ink-primary` (or paper, inverse) | same as letters | Single-ink print, faxable documents, embroidery, any process that cannot reproduce `#C2370A` cleanly |

There is no "color" variant beyond these. There is no gradient variant. There is no icon variant.

### Don'ts

1. Don't outline the wordmark. It is solid ink, always.
2. Don't shadow it. Paper doesn't shadow type.
3. Don't rotate it. The wordmark sits on the baseline.
4. Don't substitute the period for any other glyph — no bullet, no middot, no diamond, no asterisk, no emoji.
5. Don't change the accent hue of the period. It is `#C2370A` in light and `#E8572B` in dark, no third option.
6. Don't italicize it. Newsreader italic is for narrative emphasis, not display.
7. Don't add "by LIGHTHOUSE 27 LLC" as a tagline under it. The entity line belongs in footer metadata, not locked up with the mark.
8. Don't add a symbol, badge, or mascot next to it.
9. Don't use a non-variable Bricolage weight. The variable font's opsz axis must match the rendered size.
10. Don't render the period smaller than the cap-height of the letters. The period sits on the baseline, not floating.
11. Don't interrupt the clear-space zone with nav links, chips, or atmospheric ornament.

### Permitted co-brand lockups

For partnership surfaces (press kit, co-authored reports, sponsored campaigns):

```
Ringdocket. × [Partner Name]
```

- Use a true multiplication glyph (`×`, U+00D7), not the letter "x"
- Both names in Bricolage 700, same size, same ink
- The multiplication sign in `ink-byline`, 75% of the wordmark size
- 1em of space on each side of the `×`
- The partner name has no accent period of its own

No other co-brand formats. No "powered by," no "in partnership with," no "from the team behind."

---

## 3. The stamp mark (accent signal)

The `#C2370A` dot is the one visual motif that carries across every surface. It is the wordmark's period, the corroboration seal on a block-listed number, and the first-flag indicator on a user's evidence row. It is not decoration — it is attestation.

### The corroboration seal icon

The seal is the domain symbol for "this number has been corroborated onto the public block list." It is distinct from the wordmark period (which is pure typography) and from the generic "corroborated" check chip (which is a state indicator).

**Specification:**

- **Viewbox:** `0 0 16 16`
- **Primary rendered size:** 16px. Also valid at 20px and 24px. Below 12px, drop to a solid filled `accent-signal` dot with no outer ring.
- **Outer ring:** circle, `cx=8 cy=8 r=6.5`, stroke `ink-primary`, `stroke-width="1.25"`, no fill
- **Inner dot:** circle, `cx=8 cy=8 r=2.25`, fill `accent-signal`, no stroke
- **No gap/tick marks, no radial hatching, no text inside the ring.** It is two concentric shapes. That is the whole seal.

```svg
<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Corroborated">
  <circle cx="8" cy="8" r="6.5" fill="none" stroke="#1B1F27" stroke-width="1.25"/>
  <circle cx="8" cy="8" r="2.25" fill="#C2370A"/>
</svg>
```

In dark mode, swap the outer stroke to `#E6E9EF` and the inner fill to `#E8572B`. Do not add a glow, a drop shadow, or a second ring.

### Stamp rules (strict — quoted from DESIGN-SYSTEM.md §2, extended for print)

`--accent-signal` is permitted ONLY in:

1. The `Ringdocket` wordmark period
2. The corroboration seal icon next to block-listed numbers
3. The first-flag indicator on evidence-ledger rows
4. The Takedown Report PDF masthead (see §10 of DESIGN-SYSTEM.md)
5. A single 2px hairline rule under hero titles, at 60% opacity
6. The vertical hairline on the right margin of the campaign evidence ledger, at 15% opacity

It is NOT permitted on: buttons, CTAs, links, hovers, navigation, form focus states, decorative backgrounds, or icons outside the above.

**If a screen has three or more accent-signal touches, the screen is broken.**

### Print specs for the Takedown Report PDF

When rendering the seal in the Takedown Report:

- Use CMYK `C:18 M:88 Y:100 K:8` as the closest fidelity match for `#C2370A` on a warm-white 80lb uncoated stock
- Do NOT use the digital hex value directly — most print workflows will render it too orange
- The masthead seal renders at 18pt diameter, bottom-right of page 1, with "Verified by Ringdocket · [UUID]" set in JetBrains Mono 7pt below it
- For Pantone approximation: Pantone 7580 C is closest; use it on merchandise where four-color is not available
- On faxable or single-ink reproductions, the seal renders in `ink-primary` only — no accent

---

## 4. Color system — meaning, not just tokens

Tokens (hex values, CSS variables, Tailwind mapping) live in [../DESIGN-SYSTEM.md §2](../DESIGN-SYSTEM.md). This section documents what each color means and when it is wrong to use it.

### `surface-paper` — `#F7F3EA`

The warm cream of a filed document. Every page sits on this. It is never flat solid — the ledger rules layer composites over it (see DESIGN-SYSTEM.md §5).

- **Use for:** page backgrounds, the field on which evidence is arranged
- **Never use for:** data surfaces that need to pop. If a card needs to rise, it uses `surface-raised`, not a tint of paper.

### `ink-primary` — `#1B1F27`

Body ink. The voice of the product. At ~93% contrast against paper, it is the highest-legibility pairing and it is also the CTA color. Ringdocket does not use a brand-color button.

- **Use for:** body text, primary labels, the background of primary buttons, the outline ring of the corroboration seal
- **Never use for:** decorative large areas (full-bleed black). The product is a paper record, not a tech-noir interface.

### `ink-secondary` — `#5C5D5F`, `ink-byline` — `#8D8875`, `ink-mono` — `#3A3D44`

Three supporting voices. Secondary for supporting body, byline for timestamps and metadata, mono for data presentation. Use role-by-role, not interchangeably.

### `signal-corroborated` — `#2F6B4A`

Deep moss green — the color of an evidence tag pinned to a board. This is the "confirmed, on the block list" state.

- **Meaning:** three independent accounts have corroborated. This number is blocked for every user.
- **Why moss, not emerald:** emerald reads as "success!" Moss reads as "attested." The state is not a celebration; it is a record.
- **Use for:** corroborated state chips, the "live" pulse dot on the network ledger, the confirmed-count count-up in notifications
- **Never use for:** generic "good" UI (save successful, form valid, etc.). Those use `ink-primary` or no color at all.

### `signal-flag` — `#D97742`

Burnt orange — distinct from `accent-signal` (which is redder and reserved). This is "you flagged this" — the color of your own pending report.

- **Meaning:** this is your contribution. You filed it; corroboration has not yet completed.
- **Why burnt orange:** it evokes a hand-written note in the margin of a document — warm, personal, not yet official.
- **Use for:** "you flagged" state chips, first-flag timeline markers on your own reports
- **Never use for:** anyone else's flag. Other users' flags are rendered in `muted-pending` until they corroborate.

### `muted-pending` — `#A89E85`

Olive-tan with a **dashed border** treatment. The dashed border is the semantics; the color only reads correctly in dashed form.

- **Meaning:** awaiting corroboration. The report exists but the threshold is not yet met.
- **Why dashed:** dashed = unfinished. A solid border would promise completion this state hasn't earned.
- **Use for:** pending-state chips, the progress-bar incomplete fill on "1 of 3," the meta-row byline on a pending number
- **Never use for:** any "completed" state. The moment a number promotes, the chip morphs to `signal-corroborated`.

### `accent-signal` — `#C2370A`

The red ink stamp. See §3 for full rules. Use count per screen: ≤ 2. Target: 1.

### `destructive` — `#8B2B1F`

Oxblood — darker than accent, cooler, unmistakably a destructive action.

- **Meaning:** delist, dispute, delete. Irreversible.
- **Use for:** destructive button text and 30% border, delete confirmation sheets
- **Never use for:** "cancel" or "close" — those are secondary buttons or plain ink
- **Never use as an accent substitute** — do not reach for oxblood when `accent-signal` would be out of spec. Fix the design; don't swap the red.

### Why each state got its color

- **Green for corroborated:** moss green is the evidence-tag convention of investigative journalism and courtroom exhibits. It means "this is in the record."
- **Burnt orange for first-flag:** warm, personal, margin-of-document. It is distinct from accent red so the two never compete.
- **Dashed olive for pending:** dashed = process-in-motion. The color is neutral-warm so it belongs on the paper surface without demanding attention.
- **Accent red for stamp:** the color of red ink on an official document. It is rare because red ink is rare.

---

## 5. Typography reference

Full specification lives in [../DESIGN-SYSTEM.md §3](../DESIGN-SYSTEM.md). This section adds three rules that are not in the implementation spec.

### The pairing rule

The hero pattern is **Bricolage Grotesque display + Newsreader italic emphasis**, set side by side in the same line:

```html
<h1>
  Silence spam calls. <em>See who they were.</em>
</h1>
```

The Bricolage carries the argument; the Newsreader italic carries the consequence. This is the signature typographic gesture of the brand. It is used on the web hero, the iOS onboarding title, the Takedown Report front page, and section headers throughout the marketing site. When you see Ringdocket type, you should see this pattern at least once.

### The role boundary enforcement rule

> **If in doubt, the data goes in JetBrains Mono.**

Phone numbers, case IDs, timestamps, reputation counts, corroboration counts, progress ratios ("1 of 3"), percentage scores, UUIDs, campaign case numbers — all data, all mono, always. The boundary line is: if it would appear on a spreadsheet export, it appears in Inter Tight only when surrounded by UI chrome, and in JetBrains Mono when presented as evidence.

**Exception:** humanist numerals inside narrative prose. "You stopped 47 calls this week" — the 47 is Newsreader, because it is part of a sentence. The moment it appears as a standalone stat, it converts to mono.

### Variable-font opsz axis values

Bricolage Grotesque and Newsreader are variable fonts. Honor the `opsz` (optical size) axis to match the rendered size:

| Role | Rendered size | Target opsz |
|---|---|---|
| Hero display | 40-72px | 96 |
| Campaign display | 30-48px | 72 |
| Section title | 24px | 48 |
| Narrative callout | 36px+ | 36 |
| Narrative lead | 20px | 24 |
| Narrative body | 16px | 16 |
| Narrative caption | 14px | 14 |

In CSS, use `font-variation-settings: "opsz" <value>` on each role class. For Newsreader, also set `"wght" 400` for body and `"wght" 500` for italic emphasis. Inter Tight and JetBrains Mono are static-axis in our implementation; no tuning needed.

---

## 6. Iconography framework

### Principle

Single-weight line art. No filled icons, no multi-color icons, no two-tone treatments, no shadows, no animated SF Symbols-style color effects. Every icon sits on paper the same way — as a 1.5px stroke in `ink-primary`, no fill.

### Sizes

16 / 20 / 24 / 32 px. Always draw on a 16× or 24× grid. No in-between sizes. Stroke weight stays 1.5px across all sizes; do not scale stroke with size.

### The 12 core icons

All icons centered in their viewbox, 2px padding on all sides. Stroke linejoin: `round`. Stroke linecap: `round`. Color: `currentColor` (inherits `ink-primary` by default; stamp icons inherit `accent-signal` where specified).

1. **report** — A vertical rectangle representing a document (`x=4 y=3 w=16 h=18` at 24px viewbox), with a folded corner (triangular cut at top-right, 4×4), two horizontal rules inside (`y=9, y=13`, each 8px wide, `x=7`). No pencil, no checkmark. Evidence being filed.

2. **block** — A circle (`cx=12 cy=12 r=9`), with a single diagonal line through it from upper-left to lower-right (`x1=6 y1=6 x2=18 y2=18`). No red fill, no "no" symbol shadow. Standard block.

3. **campaign** — A briefcase-free interpretation: three horizontal bars of decreasing length stacked (`x=4 w=16 y=6`, `x=4 w=13 y=12`, `x=4 w=10 y=18`) at 24px, with a vertical tick on the left edge (`x=4 y=4 h=18`). A document with a spine. Campaigns are a collection of evidence.

4. **ledger** — A horizontal open-book shape: two vertical rules (`x=8`, `x=16`) connected by four horizontal rules (`y=5, 10, 15, 20`) inside a frame (`x=3 y=3 w=18 h=18`). The book-spine central rule is drawn with a 2px gap to read as a fold.

5. **first-flag (the seal)** — See §3. This is the corroboration seal rendered at icon sizes. Outer circle + inner `accent-signal` dot. It is the only icon that uses accent color.

6. **corroborated** — Different from the seal — this is the generic check for "this row is verified." A simple check mark (`M 5 12 L 10 17 L 19 7`), 1.5px stroke, no circle around it. When the full verification context is needed, use the seal. When only the check is needed (table cells, dense rows), use this.

7. **pending** — A dashed circle: circle at `cx=12 cy=12 r=9`, stroke-dasharray `3 3`, no fill, no inner dot. The dashed line is the semantics. Do not draw a solid circle with a dot inside.

8. **retired** — A circle with a horizontal strike-through: `circle cx=12 cy=12 r=9`, then `line x1=3 y1=12 x2=21 y2=12`. No text, no "closed" badge. A record that has been ruled out.

9. **share** — A standard share glyph: three small circles (`cx=18 cy=5 r=2`, `cx=6 cy=12 r=2`, `cx=18 cy=19 r=2`) connected by two lines. No arrow, no up-arrow-out-of-box (that's an iOS system metaphor we don't need).

10. **settings** — A gear, but drawn minimally: circle `cx=12 cy=12 r=3` (center), plus 6 short radial ticks at 60° intervals, each 3px long, starting 5px from center. No filled teeth, no second inner ring.

11. **delete** — A trash can: top rule (`x=3 y=6 w=18 h=2`), body outline (`x=6 y=8 w=12 h=14`, rounded at bottom), two vertical lines inside the body (`x=10`, `x=14`) from `y=11` to `y=19`. No lid animation, no "×" variant.

12. **help** — A circle (`cx=12 cy=12 r=9`) with a question mark inside — but the question mark is drawn, not typeset. Curve from `(8,10)` arcing up to `(16,10)` back down to `(12,14)`, then a dot at `(12,18)`. No typeset "?".

### SF Symbols policy (iOS)

SF Symbols are permitted for **generic iOS affordances only**:
- Back chevron (navigation)
- Share (system share sheet)
- Close (modal dismiss)
- Settings gear (tab bar, if used)
- iOS system alerts and share sheet (unavoidable)

Use `.symbolRenderingMode(.monochrome)` and swap any filled variant for its outline equivalent. Never use `.hierarchical` or `.palette` rendering modes — they introduce color variation that breaks the identity.

**Domain icons must be custom** — the seal, first-flag, campaign, ledger, retired, pending icons are all drawn per §6 and shipped as SVG assets in the iOS bundle. Do not substitute an SF Symbol for any of them, even if a plausible one exists.

---

## 7. Imagery / photography direction

### Default: no photography

Ringdocket is text, ledger rows, hairlines, and chips. The product has not earned photography and does not need it. Marketing pages lead with narrative + live ledger, not hero images.

### Permitted photography: founder / team portraits

In the press kit, on an `/about` page, or in long-form journalism that names the founder, team portraits are permitted under strict treatment:

- **Black and white only.** No color photography ever.
- **Newspaper editorial treatment:** medium contrast, paper-white highlights, deep ink shadows. Think NYT business section, not lifestyle magazine.
- **Direct gaze or mid-gesture working shots.** No lifestyle poses, no arms-crossed founder stock, no laughing-at-laptop stock.
- **Square crop or 4:5 portrait.** No 16:9, no circular crops.
- **1px `ink-primary` border at 60% opacity** on all portrait surfaces — ties back to the paper-frame metaphor.

### Never

- Stock photos of "worried elderly person on phone"
- Stock photos of "happy person celebrating"
- Hands holding phones
- Phone screens floating in hero gradients
- Office "team at whiteboard" shots
- Any image sourced from Unsplash, Getty, or AI generation

If an image is tempting, the design is probably reaching for emotion the copy should carry.

---

## 8. Patterns and textures

### The paper-ness principle

Paper is a semantic commitment, not a literal overlay. `surface-paper` (solid `#F7F3EA`) composited with the ledger rules atmospheric layer (DESIGN-SYSTEM.md §5) IS the canonical paper. Do not add paper-texture background images. Do not add yellowed-page filters. Do not crumple or age the surface.

### Permitted "paper-ness" additions

Two — and only two — visual moves extend the paper metaphor:

1. **Card edge:** a 1px inset border at 60% of `--rule` opacity (`color-mix(in srgb, var(--rule) 60%, transparent)`) creates the sense of a document resting on the paper surface. Applied on `.card`, `.live-ledger`, `.plan`, and `.how-panel`.

2. **Ledger row banding:** every 4th row in a ledger gets a `surface-inset` tint at 50% opacity. This is the accountant's-ledger convention — a reading aid, not decoration. Implementation in DESIGN-SYSTEM.md §7 under `.evidence-row:nth-child(4n)`.

No third pattern is permitted. No diagonal hatching, no grid dots, no watermark, no ruled margins on the left edge.

---

## 9. Motion vocabulary

Three named motions. Anything else must be justified in a PR description.

### `ink-settle` — 160ms, easeOut, scale `0.96 → 1`

For chips and seals stamping in. When a state chip changes (pending → corroborated) or when a corroboration seal appears on a newly promoted row, it "stamps" — starts at 96% scale and settles to 100% over 160ms. No bounce, no overshoot.

```css
@keyframes ink-settle {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.stamps-in { animation: ink-settle 160ms ease-out forwards; }
```

### `ledger-reveal` — 400ms total, 32ms stagger per row, vertical slide

Ledger rows on first paint. Each row fades in from `opacity: 0, translateY: 8px` to `opacity: 1, translateY: 0` over 250ms, with a 32ms stagger between rows. Max 8 rows animate on first paint — rows 9+ appear instantly to avoid the "scrolling into view" trap.

### `pulse-live` — 2.2s infinite, opacity `0.5 ↔ 1.0`

The live dot on the network ledger. Already implemented in [../../apps/web/src/pages/index.astro](../../apps/web/src/pages/index.astro) with a box-shadow pulse at `signal-corroborated` 50% transparent. 2.2s cycle — slow enough to read as "live, not urgent."

### Banned motions

- Spring physics (no `cubic-bezier` overshoot curves)
- Elastic / bouncy ease-outs
- Particle effects (no confetti, no sparks, no floating dots)
- Shimmer / skeleton loaders with animated gradients (use a 1px rule and the word "Loading..." in Inter Tight if needed)
- Any animation that loops more than three times per page
- Scroll-driven parallax

### The `prefers-reduced-motion` rule

All three named motions collapse to instant state changes under `prefers-reduced-motion: reduce`. Implementation lives in global CSS; never bypass it in a component.

---

## 10. Application across touchpoints

### Web marketing ([ringdocket.com](https://ringdocket.com))

- Centered narrative on `surface-paper` with ledger-rules atmosphere
- 7/12 + 5/12 hero (narrative left, live ledger right)
- Ledger demos use real (fictional but realistic) data, not Lorem Ipsum numbers
- Section rhythm: `py-20` desktop, `py-12` mobile
- Reference: [../../apps/web/src/pages/index.astro](../../apps/web/src/pages/index.astro)

### Web dashboard ([app.ringdocket.com](https://app.ringdocket.com/app/home))

- Asymmetric splits throughout — 7/5, 60/40, 3/9 for sidebars
- Sticky ledger components where the user is scanning rows
- "Investigator mode" dark toggle lives here, and only here
- Narrative leads every screen — no dashboard tile grid openings

### iOS app

- Same palette, same four faces, same chip system
- 44pt minimum touch targets (iOS HIG)
- Quieter information density — one Bricolage title, one Newsreader paragraph, then the ledger
- Custom icons per §6; SF Symbols only for system affordances
- Full iOS spec: [../ios-brand-guide.md](../ios-brand-guide.md)

### Email (weekly digest, monthly impact, transactional)

- Plain HTML. No banner images. No hero graphics.
- Body in Newsreader (web-safe fallback: Georgia)
- UI chrome (buttons, footer) in Inter Tight (fallback: system-ui)
- The one permitted accent: the wordmark period at the top, if the wordmark is used as the header
- Subject-line voice: direct. "Your week on the ledger" not "📬 Your weekly update is here!"
- MJML for responsive structure (see DESIGN-SYSTEM.md §12, open question 4)

### Social (Twitter / LinkedIn / Threads)

- Post bodies: screenshots of real ledger data (redacted where necessary), campaign rap-sheet excerpts, or quoted testimony
- Never decorative illustrations
- Never stock imagery
- Never "5 reasons why" carousel templates
- Profile avatar: the corroboration seal at 400×400, centered, on `surface-paper`
- Header image: horizontal ledger hairlines with a single accent-signal dot, no text

### Press kit

- Three wordmark variants (primary, inverse, monochrome) as SVG + PNG at 1x/2x/3x
- Approved founder portraits per §7
- One-page narrative summary in Newsreader 11pt, letter-sized PDF
- Logo usage guidelines extracted from §2 of this document
- No "brand story" marketing prose — the press kit is a record, not a pitch

### Receipts / invoices / Stripe

- "Ringdocket." wordmark at top (primary variant)
- Line items in JetBrains Mono
- Line-item descriptions stoic: "Ringdocket Full — monthly subscription · [period]" not "Your Ringdocket Plus membership ✨"
- Issued-date, invoice number, UUID all mono
- No color other than `ink-primary` and the wordmark period

---

## 11. Do's and don'ts — one-page checklist

### Do

- Lead with narrative prose, not a stat grid
- Use Bricolage display + Newsreader italic for emphasis — the signature pattern
- Render all data in JetBrains Mono — phone numbers, IDs, timestamps, counts
- Compose asymmetric grids — 7/5, 60/40, 3/9 — never 50/50
- Use the corroboration seal for attested state, the check icon for generic confirmation
- Keep accent touches per screen ≤ 2 (target: 1)
- Use dashed borders exclusively for pending state
- Apply 4-row banding at 50% `surface-inset` on ledger tables
- Honor `prefers-reduced-motion` for every motion
- Respect clear space around the wordmark (≥ x-height on all sides)
- Use black-and-white editorial photography only, if photography is used
- Match variable-font `opsz` to rendered size
- Use `ink-primary` for primary CTAs — the brand doesn't have a CTA color

### Don't

- Use Inter/Roboto/Arial/SF Pro as primary display or narrative type
- Use accent-signal on buttons, links, nav, focus rings, or decorative fills
- Pair the wordmark with a symbol mark, tagline, or "by LIGHTHOUSE 27"
- Substitute the wordmark period for any other glyph
- Italicize, outline, rotate, or shadow the wordmark
- Use 50/50 grids or uniform card rows
- Use stock photography of any kind
- Use gradient fills, glassmorphism, or neon accents
- Use spring / elastic / bouncy motion curves
- Animate type size, letter spacing, or data color
- Use a solid border for pending state
- Auto-apply dark mode from `prefers-color-scheme`
- Render a phone number in anything other than JetBrains Mono
- Use emoji in any UI copy, email subject, or push notification
- Let accent-signal appear three times on one screen

---

*Locked: April 2026. Changes to this document require a PRD update and a design review.*
