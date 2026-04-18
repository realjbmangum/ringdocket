# Fonts

The app self-hosts five variable font files across four families. Files are in `.ttf` format as a dev expedient — convert to `.woff2` before first production deploy (see "Optimization" below) for ~60% smaller downloads.

## Installed files

| Filename | Family | Role | License | Size |
|----------|--------|------|---------|------|
| `bricolage-grotesque-variable.ttf` | Bricolage Grotesque | Display (hero, section titles) | OFL | ~408 KB |
| `newsreader-variable.ttf` | Newsreader | Narrative / body prose | OFL | ~449 KB |
| `newsreader-italic-variable.ttf` | Newsreader Italic | Narrative emphasis (inside display) | OFL | ~493 KB |
| `inter-tight-variable.ttf` | Inter Tight | UI chrome (buttons, chips, nav) | OFL | ~581 KB |
| `jetbrains-mono-variable.ttf` | JetBrains Mono | Evidence / data (phones, timestamps, IDs) | OFL | ~189 KB |

Total: ~2.1 MB. Browsers cache these on first visit.

## Role rules (enforce in component library)

- **Bricolage Grotesque** — never in body paragraphs, never in UI chrome. Display only.
- **Newsreader** — never in buttons, never in numeric data. Narrative only. Italic face used for emphasis inside Bricolage display headlines.
- **Inter Tight** — never in paragraph-length copy (>2 sentences). Utility only.
- **JetBrains Mono** — exclusively for data-as-data: phone numbers, UUIDs, timestamps, case IDs, reputation scores.

## Sources

All four families are on Google Fonts, Open Font License:

- Bricolage Grotesque: https://fonts.google.com/specimen/Bricolage+Grotesque
- Newsreader: https://fonts.google.com/specimen/Newsreader
- Inter Tight: https://fonts.google.com/specimen/Inter+Tight
- JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono

## Optimization — convert to .woff2 before production

The current `.ttf` files work in every modern browser but are ~60% larger than the equivalent `.woff2`. Before first production deploy, convert:

```bash
pip install fonttools brotli
cd apps/web/public/fonts/

# Example for one family — repeat per file
pyftsubset bricolage-grotesque-variable.ttf \
  --flavor=woff2 \
  --output-file=bricolage-grotesque-variable.woff2 \
  --layout-features='*' \
  --unicodes='U+0000-00FF,U+2000-206F,U+2070-209F,U+20A0-20CF'
```

After conversion, update `src/styles/global.css` `@font-face` declarations:
- Change `url('/fonts/[name].ttf')` → `url('/fonts/[name].woff2')`
- Change `format('truetype-variations')` → `format('woff2-variations')`

And `src/layouts/Base.astro` `<link rel="preload">` hints:
- Change `.ttf` → `.woff2` and `type="font/ttf"` → `type="font/woff2"`

## Privacy

Do NOT hotlink Google Fonts in production. Self-hosting is required for privacy + latency + the Cloudflare portfolio convention. See `docs/DESIGN-SYSTEM.md` §3 "Web font loading."
