# Email Templates

Branded HTML email templates for Ringdocket. Built to preview in the browser today and ship through SendGrid (and Supabase, for magic links) later.

## What's here

| Template | Source (Astro) | Plain-text fallback | Subject |
|----------|----------------|---------------------|---------|
| Magic Link | `apps/web/src/pages/email-preview/magic-link.astro` | `apps/web/public/email-templates/magic-link.txt` | Your Ringdocket sign-in link |
| Welcome | `apps/web/src/pages/email-preview/welcome.astro` | `apps/web/public/email-templates/welcome.txt` | Welcome to the ledger |
| Weekly Digest | `apps/web/src/pages/email-preview/weekly-digest.astro` | `apps/web/public/email-templates/weekly-digest.txt` | Public Enemy #1 — week of [date] |
| Monthly Impact | `apps/web/src/pages/email-preview/monthly-impact.astro` | `apps/web/public/email-templates/monthly-impact.txt` | Your Ringdocket impact — [Month] |
| Index (admin) | `apps/web/src/pages/email-preview/index.astro` | — | (not an email — directory page) |

## How to preview

```bash
cd apps/web
npm run dev
```

Then visit:

- **`http://localhost:4321/email-preview`** — admin index, links to everything
- `http://localhost:4321/email-preview/magic-link`
- `http://localhost:4321/email-preview/welcome`
- `http://localhost:4321/email-preview/weekly-digest`
- `http://localhost:4321/email-preview/monthly-impact`

The preview pages render the same inline-styled HTML the real email will be — open dev tools and "View Source" to grab the exact HTML for pasting into Supabase or SendGrid.

## How to install the magic-link template into Supabase

The magic-link template overrides Supabase's default sign-in email.

1. `npm run dev` (or `npm run build && npm run preview`)
2. Visit `http://localhost:4321/email-preview/magic-link`
3. View source on the rendered page (Cmd+Opt+U on Mac / Ctrl+U on Windows)
4. Copy the entire HTML
5. Open Supabase Dashboard → **Authentication** → **Email Templates** → **Magic Link**
6. Set the **Subject** to: `Your Ringdocket sign-in link`
7. Paste the HTML into the **Message body**
8. Verify that `{{ .ConfirmationURL }}` is present (the preview file outputs the literal Supabase template tag when you load it without a query string — the inlined template variable is what Supabase substitutes at send time)
9. Save and send a test message to yourself

> **Important:** Supabase requires the `{{ .ConfirmationURL }}` token to appear in the body. The Astro file emits it directly when not in preview mode — the `isPreview` check just swaps in a sample URL when viewing in the browser, so make sure you copy the source from the deployed/built page (or strip the preview branch), not the dev preview.

## Plain-text fallbacks

Each `.txt` file mirrors the HTML email. SendGrid will send these alongside the HTML automatically — clients that prefer plain (and spam filters scoring multipart/alternative) get a clean version.

When you wire SendGrid templating, hand SendGrid both bodies (HTML + plaintext) per send.

## TODO list — must address before sending

- [ ] **Mailing address** — every template currently shows `[TODO: Add LIGHTHOUSE 27 LLC mailing address]` in the footer. CAN-SPAM (15 U.S.C. §7704(a)(5)(A)(iii)) requires a valid physical postal address in every commercial email. See `apps/web/src/pages/can-spam.astro` §2 for the format.
- [ ] **Unsubscribe URLs** — placeholders in `welcome`, `weekly-digest`, and `monthly-impact` (`[TODO: unsubscribe_url_group_*]`). Replace with SendGrid `{{unsubscribe}}` substitution tags once unsubscribe groups are configured. See `apps/web/src/pages/can-spam.astro` §7 for the four planned groups.
- [ ] **Dynamic data templating** — weekly-digest and monthly-impact currently use realistic dummy data baked into the Astro files. When SendGrid is wired (Phase 5 per PRD §11), replace dummy values with SendGrid Handlebars (`{{phone}}`, `{{campaign_name}}`, etc.) — or better, render the HTML on a Worker and POST to SendGrid's send endpoint with the final body inline.
- [ ] **Email preferences page** — every footer links to `https://ringdocket.com/account/email-preferences`. That page doesn't exist yet (per `can-spam.astro` §8, it's planned). Build it before any marketing send.
- [ ] **Branded fonts** (optional) — Bricolage Grotesque + Newsreader could be re-added via Google Fonts `<link>` tags in each `<head>`. Trade-offs: a network fetch on email open (privacy/latency) and Outlook strips `<link rel=stylesheet>` anyway. Web-safe Georgia + system-sans is the safer default; Brian can revisit after deliverability is established.

## What this session did NOT deliver

- **No sending pipeline.** The weekly digest and monthly impact emails aren't wired to a sender. SendGrid integration is Phase 5 work (per PRD §11). This session shipped templates + previews only.
- **No queue / scheduler.** A Cloudflare Worker cron will eventually trigger the weekly Monday send and the monthly 1st-of-the-month send. Not built.
- **No data layer.** Dummy values in weekly-digest and monthly-impact need to be backed by Supabase queries (top-5 corroborated, user's own report counts, first-flag credits, pending expiry).

## Constraints honored in the templates

- **Inline CSS only.** `style="..."` on every element. No `<style>` blocks. Gmail/Outlook strip those.
- **Table-based layout.** Single-column 600px-wide centered table. Works in legacy Outlook.
- **Web-safe fonts only.** Georgia for prose, system-sans for chrome.
- **No JS, no forms, no inputs.** Static HTML.
- **Mobile-first single column.** Fluid 600px max-width with `width:100%`.
- **Plain-text fallback** present for every HTML email.
- **Accent color (`#C2370A`) is a stamp** — used only on the wordmark period and a single 2px hairline on hero sections. Buttons are `ink-primary` (`#1B1F27`). No accent on links or CTAs.

## File-tree summary

```
apps/web/
  src/pages/email-preview/
    index.astro            ← admin directory (not branded)
    magic-link.astro
    welcome.astro
    weekly-digest.astro
    monthly-impact.astro
  public/email-templates/
    magic-link.txt
    welcome.txt
    weekly-digest.txt
    monthly-impact.txt
docs/email-templates/
  README.md                ← this file
```
