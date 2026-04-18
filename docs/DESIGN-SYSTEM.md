# Phase C — Design System: Forensic Ledger (Light)

**Generated:** April 18, 2026
**Locked direction:** Forensic Ledger (Light) — accepted as-is from aesthetic-direction proposal
**Purpose:** Implementation-ready spec — tokens, Tailwind config, component patterns, anti-slop rules. Drop this into the Astro project at build time.

---

## 1. Design Principles (The Rules)

1. **Transparency is aesthetic.** Data lineage shows visually — monospace evidence rows, source chips, corroboration counts belong in primary visual hierarchy, not footnotes.
2. **Restraint as signature.** One accent color (`#C2370A`) appears rarely, as a stamp. Never on CTAs, never decorative. When users see it, it means something.
3. **Warm paper + ink + rule.** The base aesthetic is a ruled paper ledger. Every surface should feel like it could have been printed, filed, or cited.
4. **Four type voices, four jobs.** Display, narrative, utility, evidence — each owns a face, none overlap. Role discipline is non-negotiable.
5. **Narrative leads stats.** Home screens open with prose ("This week, you flagged 4 numbers..."), not a stat grid.
6. **Asymmetric by default.** 50/50 splits and uniform grids are banned. Use 7/12, 5/12, 60/40, 40/60 — the hierarchy should be visible before reading the content.
7. **One orchestrated entrance per page.** Not many micro-animations. A single, deliberate motion sequence carries each page reveal.
8. **Mobile is a quieter dashboard.** Same palette, less density, persistent ledger header at top, asymmetric tiles below.

---

## 2. Color Tokens (CSS Variables)

### Light mode (default)

```css
:root {
  /* Surface & ink */
  --surface-paper: #F7F3EA;      /* warm cream, the "document" */
  --surface-raised: #FFFFFF;     /* cards above paper */
  --surface-inset: #EEE8DA;      /* input fields, recessed */
  --rule: #D8D0BE;               /* 1px hairlines, ledger rules */
  --rule-subtle: #E6DFCD;        /* tertiary dividers */

  --ink-primary: #1B1F27;        /* body text, ~93% contrast */
  --ink-secondary: #5C5D5F;      /* supporting body */
  --ink-byline: #8D8875;         /* timestamps, bylines, metadata */
  --ink-mono: #3A3D44;            /* mono data color */

  /* State signals — the three-state ledger */
  --signal-flag: #D97742;        /* burnt orange — YOU flagged this */
  --signal-corroborated: #2F6B4A; /* deep moss — on block list */
  --muted-pending: #A89E85;      /* olive-tan — awaiting corroboration */

  /* Accent — the ONE color, used as a stamp */
  --accent-signal: #C2370A;      /* high-signal orange-red */

  /* Utility */
  --destructive: #8B2B1F;        /* oxblood — delist/dispute */
  --focus-ring: rgba(194, 55, 10, 0.4); /* accent-signal alpha */
  --selection-bg: rgba(194, 55, 10, 0.12);
}
```

### Dark mode (opt-in power-user dashboard only)

```css
[data-theme="dark"] {
  --surface-paper: #141821;      /* near-black, blue undertone */
  --surface-raised: #1B2030;
  --surface-inset: #0D1118;
  --rule: #2A3040;
  --rule-subtle: #20263A;

  --ink-primary: #E6E9EF;
  --ink-secondary: #9098A8;
  --ink-byline: #6E7486;
  --ink-mono: #B8BEC8;

  --signal-flag: #F4B478;
  --signal-corroborated: #6FCF97;
  --muted-pending: #5A6578;

  --accent-signal: #E8572B;      /* slightly brighter for contrast */

  --destructive: #D06450;
  --focus-ring: rgba(232, 87, 43, 0.5);
  --selection-bg: rgba(232, 87, 43, 0.18);
}
```

### Dark-mode activation rule
Dark mode is **NOT** auto-applied from `prefers-color-scheme`. Users must opt in via an in-dashboard toggle ("Investigator mode"). Default for all users, including returning users, is light. This is a deliberate acquisition/retention split — light is the product Face, dark is a reward for engagement.

### State chip specification

Every "state" appears as a chip with specific styling:

```css
.chip-flag {
  background: color-mix(in srgb, var(--signal-flag) 12%, transparent);
  color: var(--signal-flag);
  border: 1px solid color-mix(in srgb, var(--signal-flag) 30%, transparent);
}
.chip-corroborated {
  background: color-mix(in srgb, var(--signal-corroborated) 12%, transparent);
  color: var(--signal-corroborated);
  border: 1px solid color-mix(in srgb, var(--signal-corroborated) 30%, transparent);
}
.chip-pending {
  background: transparent;
  color: var(--muted-pending);
  border: 1px dashed var(--muted-pending);  /* dashed = waiting */
}
```

The dashed border on pending is intentional — signals "unfinished" without a word.

### Accent-signal usage rules (STRICT)

`--accent-signal` (`#C2370A`) is permitted ONLY in these places:

1. The `Ringdocket` wordmark (as a period/dot after "Ringdocket")
2. The "corroborated" seal icon (small, ~16px, next to numbers on the block list)
3. The "first flag" indicator in evidence-ledger rows
4. The Takedown Report PDF masthead
5. As hairline rule accent on hero sections (single 2px line, 60% opacity)

It is **NOT** permitted on:
- Buttons or CTAs
- Links or hovers
- Navigation
- Form field focus (use `--focus-ring` instead)
- Decorative backgrounds
- Icons outside the above list

If the design ever has 3+ accent-signal touches on one screen, the design is broken.

---

## 3. Typography System

### Four families, four roles

| Role | Family | Google Fonts URL | Weights | Notes |
|------|--------|------------------|---------|-------|
| **Display** (hero, campaign names, section titles) | [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) | variable font, `wght` 400-800, `wdth` 75-100, `opsz` 12-96 | 700, 800 | Opsz set to 96 for hero, 48 for section titles |
| **Narrative** (body paragraphs, editorial content, digest emails, PDF) | [Newsreader](https://fonts.google.com/specimen/Newsreader) | variable, `wght` 200-800, `opsz` 6-72 | 400 (body), 500 (emphasis) | Opsz to match size — 16 for body, 36+ for callouts |
| **Utility** (buttons, chips, form labels, filters, nav) | [Inter Tight](https://fonts.google.com/specimen/Inter+Tight) | static | 400, 500, 600 | Narrower than regular Inter; role-acceptable |
| **Evidence** (phone numbers, timestamps, IDs, scores, case numbers) | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | static | 400, 500 | All data as data |

### Role boundary rules (enforce in component library)

- **Bricolage Grotesque** — never in body paragraphs, never in UI chrome. Display only.
- **Newsreader** — never in buttons, never in numeric data. Narrative only.
- **Inter Tight** — never in paragraph-length copy (over 2 sentences), never on numbers that represent evidence.
- **JetBrains Mono** — exclusively for data-as-data: phone numbers, UUIDs, timestamps, case IDs, reputation scores, corroboration counts. Never in prose.

**Exception:** in narrative prose, use **humanist numerals** for stats that are part of a sentence ("You stopped 47 calls this week" — "47" is Newsreader). Numbers become mono only when they are the data itself, not part of a sentence.

### Type scale

```css
/* Display scale — Bricolage Grotesque, 700-800 weight */
--font-display-hero: clamp(2.5rem, 6vw + 1rem, 4.5rem);    /* 40-72px */
--font-display-campaign: clamp(1.875rem, 4vw, 3rem);        /* 30-48px */
--font-display-section: 1.5rem;                             /* 24px */

/* Narrative scale — Newsreader, 400 weight */
--font-narrative-lead: 1.25rem;                             /* 20px */
--font-narrative-body: 1rem;                                /* 16px */
--font-narrative-caption: 0.875rem;                         /* 14px */

/* Utility scale — Inter Tight */
--font-ui-base: 0.9375rem;                                  /* 15px */
--font-ui-small: 0.8125rem;                                 /* 13px */
--font-ui-micro: 0.6875rem;                                 /* 11px — timestamps only */

/* Evidence scale — JetBrains Mono */
--font-mono-base: 0.875rem;                                 /* 14px — data cells */
--font-mono-large: 1rem;                                    /* 16px — emphasized IDs */
--font-mono-small: 0.75rem;                                 /* 12px — metadata */
```

Narrative body caps at **66ch** for readability. Do not exceed this in data-dense tables; use full width for mono-data tables.

### Leading (line-height)

- Display: 1.05 (tight, authoritative)
- Narrative body: 1.6 (editorial pacing)
- UI chrome: 1.4
- Mono data rows: 1.5 (generous for scannability)

### Web font loading

Self-host via Fontshare/Bunny Fonts on Cloudflare R2. Do NOT hotlink Google Fonts (privacy + latency). Use `font-display: swap` with a `font-face` declaration for each weight. Preload display + body weights:

```html
<link rel="preload" href="/fonts/bricolage-grotesque-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/newsreader-variable.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 4. Spatial System

### Grid

- **Desktop:** 12-column grid, max-width 1400px, 24px gutter
- **Tablet (768-1024px):** 8-column grid, 20px gutter
- **Mobile (≤767px):** single column, 16px gutter

### Spacing scale (tokens)

Use the default Tailwind spacing scale (`0.25rem` increments), but project-standard section rhythm:

```css
--space-section: 5rem;           /* 80px — py-20, default section */
--space-section-hero: 8rem;      /* 128px — py-32, hero only */
--space-block: 2.5rem;           /* 40px — between sub-blocks */
--space-component: 1.5rem;       /* 24px — component inner */
--space-tight: 0.5rem;           /* 8px — inline chips, dense rows */
```

### Asymmetric patterns (named)

Name | Use case | Desktop split | Mobile behavior
-----|----------|---------------|----------------
**Ledger Hero** | Home dashboard hero | 7/12 narrative + 5/12 live ledger | narrative first, ledger stacks as collapsed "Recent Activity" block
**Rap Sheet** | Campaign detail page | 60/40 narrative + evidence ledger | 100% narrative, evidence ledger behind "412 reports · view ledger" chip
**Split Tile** | Mobile home tiles below hero | — | 60/40 left+right tile widths
**Sticky Sidebar** | My Reports / Settings | 3/12 nav + 9/12 content | drawer pattern
**Magazine Cover** | Takedown Report PDF | full-bleed serif masthead + body column | n/a (PDF is letter-sized)

---

## 5. Atmospheric Background Layers

Base surface is NEVER flat `#F7F3EA` solid. Every page composites three layers:

### Layer 1 — Ledger rules (most prominent)

```css
.atmosphere-rules {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 31px,
    color-mix(in srgb, var(--rule) 45%, transparent) 31px,
    color-mix(in srgb, var(--rule) 45%, transparent) 32px
  );
}
```

A 1px rule every 32px, at 6% effective opacity. Evokes ruled paper without being literal. On data tables, this naturally aligns with 32px row heights.

### Layer 2 — Paper fiber noise

Generate once as an SVG data-URI. Apply at 3% opacity on top of the ruling:

```css
.atmosphere-fiber {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.05 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

### Layer 3 — Accent radial (hero only)

Hero sections ONLY get a subtle warm glow from top-left:

```css
.atmosphere-hero-radial {
  background-image: radial-gradient(
    ellipse at top left,
    rgba(194, 55, 10, 0.04),
    transparent 50%
  );
}
```

### Campaign detail vertical rule

Campaign detail pages add a single vertical hairline down the right margin of the evidence ledger column:

```css
.evidence-ledger {
  border-right: 1px solid color-mix(in srgb, var(--accent-signal) 15%, transparent);
}
```

This is the accent-signal exception — on the evidence ledger margin, a 15% tint is permitted.

---

## 6. Motion System

### Global rules

- Respect `prefers-reduced-motion: reduce` — all non-essential motion disabled.
- Never more than ONE orchestrated entrance per page.
- Never animate type size or letter spacing (jarring).
- Never animate color on data (confuses state).
- Button hovers: `transition: background 140ms ease-out`. Nothing fancier.

### Page entrance choreography

**Home dashboard:**
1. Display title fades up + translates `-8px → 0` (300ms, ease-out)
2. Narrative paragraph fades up (300-600ms, 100ms delay from title)
3. Ledger column cascades rows, 35ms stagger per row, max 8 rows visible on first paint
4. Total duration: ~700ms, reduced-motion cuts all to instant

**Campaign detail page:**
1. Bricolage campaign name slides in (350ms, ease-out)
2. Newsreader summary paragraph fades in (250-550ms, 150ms delay)
3. Evidence ledger rows cascade (550ms start, 35ms stagger, fade + 8px Y)
4. Mono-data "seal" on first-flag rows pulses ONCE at 1200ms (600ms in+out, `rgba(194,55,10,0.25)` scale 1.0→1.15→1.0)

### Interaction motion

- **Report submission:** button press, then the report's new chip "writes in" (250ms typewriter effect on the phone number, then fades in the status chip)
- **Block list update:** when a number flips from pending → corroborated, the row's background transitions from `--surface-inset` to `--surface-raised` (400ms ease-in-out) and the chip morphs (cross-fade with 150ms overlap)

---

## 7. Component Patterns

### Buttons

```css
.button-primary {
  background: var(--ink-primary);
  color: var(--surface-paper);
  font-family: "Inter Tight", system-ui;
  font-weight: 500;
  font-size: var(--font-ui-base);
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  transition: background 140ms ease-out;
}
.button-primary:hover { background: #2A2F3A; }
.button-primary:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.button-secondary {
  background: transparent;
  color: var(--ink-primary);
  border: 1px solid var(--rule);
  /* ... same metrics as primary ... */
}

.button-destructive {
  background: var(--destructive);
  color: var(--surface-paper);
  /* ... */
}
```

**No accent-signal buttons.** CTAs use ink-primary. The accent is a stamp, not a call-to-action color.

### Chips (state indicators)

`.chip-flag`, `.chip-corroborated`, `.chip-pending` defined in Section 2. Size variants:
- `.chip-sm` — 10px text, 2px/6px padding, 4px radius
- `.chip-md` — 12px text, 3px/8px padding, 6px radius (default)

### Evidence row (the ledger primitive)

```html
<div class="evidence-row">
  <span class="mono">(402) 555-0142</span>
  <span class="mono-metadata">Apr 18, 09:41</span>
  <span class="chip chip-corroborated">corroborated · 412</span>
  <span class="seal" aria-label="First flag">●</span>  <!-- accent-signal dot -->
</div>
```

```css
.evidence-row {
  display: grid;
  grid-template-columns: minmax(140px, auto) 120px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--rule-subtle);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--font-mono-base);
}
.evidence-row:nth-child(4n) { background: color-mix(in srgb, var(--surface-inset) 40%, transparent); }
.evidence-row .seal { color: var(--accent-signal); font-size: 1rem; line-height: 1; }
```

The 4-row banding mimics an accountant's ledger book.

### Campaign card (home dashboard hero)

- Surface: `--surface-raised` on top of ruled paper
- Display: Bricolage campaign name
- Narrative: Newsreader 2-3 sentence summary
- Metadata row (bottom): mono timestamp + chip-set + first-flag seal if applicable
- Border: 1px solid `--rule`, no shadow (shadows feel appy, not documentary)

### Tile (mobile home secondary)

Smaller card, 60/40 pair on mobile. Left tile = narrative ("3 new flags"), right tile = mono stat (`imp 1,247`).

### Nav

- Desktop: fixed top, 64px, warm-paper-translucent backdrop (`backdrop-filter: blur(8px)`, `background: rgba(247, 243, 234, 0.85)`)
- Ringdocket wordmark left (Bricolage 700 + accent-signal period)
- Three links max: Dashboard · Campaigns · Report
- Right: account avatar (Inter Tight initials, no photos for V1)

### Form inputs

```css
.input {
  background: var(--surface-inset);
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-family: "Inter Tight", system-ui;
  font-size: var(--font-ui-base);
  color: var(--ink-primary);
}
.input:focus { outline: 2px solid var(--focus-ring); outline-offset: 0; border-color: transparent; }
.input[type="tel"] { font-family: "JetBrains Mono", monospace; }
```

Phone number inputs specifically get the mono treatment — the product convention is "data as data," and phone numbers are data the moment the user types one.

---

## 8. Tailwind Config

`tailwind.config.mjs` (Astro-compatible):

```js
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--surface-paper)',
        raised: 'var(--surface-raised)',
        inset: 'var(--surface-inset)',
        rule: 'var(--rule)',
        'rule-subtle': 'var(--rule-subtle)',
        ink: {
          DEFAULT: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          byline: 'var(--ink-byline)',
          mono: 'var(--ink-mono)',
        },
        signal: {
          flag: 'var(--signal-flag)',
          corroborated: 'var(--signal-corroborated)',
          pending: 'var(--muted-pending)',
          accent: 'var(--accent-signal)',
        },
        destructive: 'var(--destructive)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui'],
        narrative: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        ui: ['"Inter Tight"', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        'display-hero': ['clamp(2.5rem, 6vw + 1rem, 4.5rem)', { lineHeight: '1.05', fontWeight: '700' }],
        'display-campaign': ['clamp(1.875rem, 4vw, 3rem)', { lineHeight: '1.05', fontWeight: '700' }],
        'display-section': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'narrative-lead': ['1.25rem', { lineHeight: '1.55' }],
        'narrative-body': ['1rem', { lineHeight: '1.6' }],
        'ui-base': ['0.9375rem', { lineHeight: '1.4' }],
        'ui-small': ['0.8125rem', { lineHeight: '1.4' }],
        'ui-micro': ['0.6875rem', { lineHeight: '1.3' }],
        'mono-base': ['0.875rem', { lineHeight: '1.5' }],
        'mono-large': ['1rem', { lineHeight: '1.5' }],
        'mono-small': ['0.75rem', { lineHeight: '1.5' }],
      },
      maxWidth: {
        narrative: '66ch',
        grid: '1400px',
      },
      spacing: {
        'section': '5rem',
        'section-hero': '8rem',
        'block': '2.5rem',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="dark"]'],  // opt-in, not prefers-color-scheme
};
```

---

## 9. Global CSS (`global.css`)

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Tokens — see Section 2 for full light + dark palettes */
:root { /* ...light palette... */ }
[data-theme="dark"] { /* ...dark palette... */ }

@font-face {
  font-family: 'Bricolage Grotesque';
  src: url('/fonts/bricolage-grotesque-variable.woff2') format('woff2-variations');
  font-weight: 400 800;
  font-display: swap;
}
@font-face {
  font-family: 'Newsreader';
  src: url('/fonts/newsreader-variable.woff2') format('woff2-variations');
  font-weight: 200 800;
  font-display: swap;
}
@font-face {
  font-family: 'Inter Tight';
  src: url('/fonts/inter-tight-variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-variable.woff2') format('woff2-variations');
  font-weight: 100 800;
  font-display: swap;
}

body {
  background: var(--surface-paper);
  color: var(--ink-primary);
  font-family: 'Newsreader', ui-serif, Georgia, serif;
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  /* Atmospheric layer 1 — ledger rules */
  background-image:
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent 31px,
      color-mix(in srgb, var(--rule) 45%, transparent) 31px,
      color-mix(in srgb, var(--rule) 45%, transparent) 32px
    );
}

::selection { background: var(--selection-bg); color: var(--ink-primary); }

.hero {
  /* Atmospheric layer 3 — accent radial on hero only */
  background-image: radial-gradient(
    ellipse at top left,
    rgba(194, 55, 10, 0.04),
    transparent 50%
  );
}
```

---

## 10. Takedown Report PDF — Special Spec

The quarterly Takedown Report is the civic-identity artifact (per Phase B QB1). Its design is a deliberate sub-system of this design system. Treatments:

- **Letter-sized, portrait** (US 8.5" × 11")
- **Masthead** (top): Ringdocket wordmark centered, `accent-signal` hairline rule below, issue date in Newsreader italic
- **Title:** "Takedown Report — Q[N] [Year]" in Bricolage 800, 42pt
- **Body:** Newsreader 11pt, single-column, 62ch max
- **Campaign timeline:** visual ledger — each campaign a row with mono attribution chain, narrative status, seal icon
- **Stats:** Mono presentation, never Spotify-Wrapped hero-number style. Stats are line items.
- **Seal of record:** bottom-right corner, small embossed-feeling circular mark (`accent-signal` outline), "Verified by Ringdocket · [UUID]"
- **Footer:** case citation format — "This report includes data from [N] user-submitted flags and [M] FTC complaints. Issued: [date]. ringdocket.app/verify/[uuid]"

**Explicit non-goals for the PDF:** no gradients, no photos, no large emoji, no icons outside the seal, no progress bars, no confetti, no charts with gradient fills. This is an official-record aesthetic, not a marketing graphic.

---

## 11. Anti-Slop Enforcement Checklist

Run this before any PR merges to `main`:

- [ ] No Inter/Roboto/Arial used as primary anywhere (Inter Tight is utility-only, count as pass)
- [ ] No flat solid backgrounds — every page composites ledger rules + (where applicable) fiber + hero radial
- [ ] Accent-signal used ≤2 times per screen, and only in permitted roles (Section 2 list)
- [ ] All phone numbers, case IDs, timestamps, reputation scores rendered in JetBrains Mono
- [ ] All narrative prose in Newsreader, not Inter Tight
- [ ] All display text in Bricolage Grotesque 700-800 weight
- [ ] No 50/50 grid layouts — use 7/12+5/12, 60/40, 40/60, 3/12+9/12
- [ ] One orchestrated entrance animation per page, not many
- [ ] All data tables have 4-row banding at 40% inset-tint
- [ ] Chips use state-specific classes (never generic "badge blue")
- [ ] Pending state uses DASHED border (not solid)
- [ ] Dark mode is opt-in toggle, not prefers-color-scheme
- [ ] Body narrative caps at 66ch
- [ ] Section vertical rhythm ≥ `py-20` desktop, `py-12` mobile
- [ ] Focus rings use `--focus-ring` alpha, not raw accent-signal
- [ ] Reduced motion preference disables all non-essential motion

---

## 12. Open Implementation Questions

1. **Font hosting:** host via Cloudflare R2 + Bunny Fonts fallback, or use Fontshare CDN for V1 simplicity?
2. **Icon system:** PRD doesn't specify. Recommend [Lucide](https://lucide.dev/) (MIT licensed, generic) with custom icons for "corroboration seal" and "first flag stamp."
3. **Chart library:** dashboard has trending campaigns view. [Lightweight Charts](https://www.tradingview.com/lightweight-charts/) if financial-data feel is wanted; [visx](https://airbnb.io/visx/) if custom-composable is preferred. Propose visx for a custom "corroboration timeline" chart.
4. **Email template system:** weekly digest + monthly impact + quarterly PDF all need templating. Recommend [MJML](https://mjml.io/) for responsive email; [React-PDF](https://react-pdf.org/) or [@react-pdf/renderer](https://react-pdf.org/) running in a Worker for the Takedown Report.
5. **Design tokens as code:** consider exporting tokens as a single `design-tokens.json` via Style Dictionary so the iOS Swift app can consume the same palette. Brian's mobile team needs identical chips.

---

## 13. Next Step

Design system is locked. **flowy-ui-mockup** agent can now produce iPhone device-frame mockups of three core screens (mobile home, trending campaigns detail, my reports) using these tokens — the JSON mockup spec will reference these exact color and type tokens.

*End of design system. Mockups next.*
