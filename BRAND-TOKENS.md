# gladianrivera.com — Design Tokens

Pulled from the live site CSS (every page shares this token set).

## Colors

| Token | Hex | Where it's used |
|---|---|---|
| Background | `#131313` | Page background on every page (near-black charcoal) |
| Foreground | `#e5e2e1` | Body text and headlines (warm off-white) |
| Salmon (dusty rose) | `#B76E79` | Primary accent: buttons, links, active nav pill, hover states |
| Purple bright | `#d6bcf4` | Italic display accent inside headlines; secondary link hover |
| Emerald bright | `#1fae74` | Eyebrow labels and section headings (small uppercase type) |
| Purple deep | `#2e1a47` | Deep accent, used sparingly behind purple elements |
| Emerald deep | `#043927` | Deep accent, used sparingly behind green elements |
| Button text | `#1a0f12` | Text sitting on a salmon-filled button |
| Ghost border | `rgba(255,255,255,0.12)` | Hairline dividers, card borders, nav border |

Muted text is the foreground at reduced opacity, not a separate color:
`rgba(229,226,225,0.82)` for lede/body, `0.6`–`0.5` for meta and footer text.

## Fonts

- **Display:** Playfair Display (Google Fonts) — weights 600 and 700, plus italics.
  Used for headlines, the wordmark, and card titles. Headline italics are the
  purple-bright accent.
- **Body:** Hanken Grotesk (Google Fonts) — weights 400, 600, 700.
  Used for body copy, nav, buttons, labels.
- Fallbacks: `Georgia, serif` for display; `Helvetica, Arial, sans-serif` for body.

## Type treatment

- **Headline:** Playfair Display 700, `clamp(3rem, 8vw, 5.5rem)`, line-height 1.05.
  Second line is often italic 600 in purple bright, with a soft glow.
- **Eyebrow / section heading:** Hanken Grotesk, 0.72rem, uppercase,
  letter-spacing 0.28–0.32em, emerald bright.
- **Body:** 0.98–1.05rem, line-height 1.65–1.75, foreground at 82% opacity.
- **Buttons:** 0.8–0.82rem, 700, uppercase, letter-spacing 0.06em.
  Solid = salmon fill with `#1a0f12` text. Ghost = salmon border and text,
  filling salmon on hover.

## Layout

- Content max width: **1180px**, side padding `clamp(1.25rem, 4vw, 2.5rem)`.
- Corner radius: 0.25rem on buttons, 0.4rem on cards, 999px on nav pills.
- Dividers and card borders: 1px `rgba(255,255,255,0.12)`.
- Fixed top nav: black at 70% opacity with a 14px backdrop blur.
- Dark theme only — the site has no light mode.

## Voice of the design

Editorial and restrained: near-black canvas, serif headlines with one italic
accent line, small uppercase labels in green, and a single dusty rose used for
every action. Generous spacing, hairline rules instead of heavy boxes.
