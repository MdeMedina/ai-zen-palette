---
name: PKGD OS
description: A dark instrument for strategic thinking — austere, alive, precise.
colors:
  signal-yellow: "oklch(0.92 0.18 100)"
  near-black: "oklch(0.205 0.002 80)"
  paper-white: "oklch(1 0 0)"
  charcoal-surface: "oklch(0.235 0.002 80)"
  charcoal-secondary: "oklch(0.28 0.002 80)"
  charcoal-muted: "oklch(0.265 0.002 80)"
  quiet-gray: "oklch(0.7 0.005 80)"
  hairline: "oklch(1 0 0 / 8%)"
  alert-ember: "oklch(0.62 0.22 25)"
typography:
  display:
    fontFamily: "Gotham, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Gotham, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Gotham, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Gotham, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Chainprinter, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  xl: "10px"
  2xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.near-black}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.near-black}"
    textColor: "{colors.paper-white}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.near-black}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.charcoal-surface}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.paper-white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "4px 12px"
    height: "36px"
---

# Design System: PKGD OS

## 1. Overview

**Creative North Star: "The Signal Room"**

PKGD OS is a dark, near-silent room with exactly one light source: a single yellow signal that only switches on when something genuinely demands attention. The user enters carrying real cognitive load — a decision, a conflict, a strategy to stress-test — and the room does not compete with that work. Surfaces are flat, the palette is almost monochrome (near-black, paper white, quiet grays), and the one saturated color in the system, Signal Yellow, is rationed like an instrument light: active states, live indicators, the rare CTA that truly is the next right action.

This system explicitly rejects glassmorphism for its own sake, gradient-heavy hero treatments, playful rounded blobs, and bright multi-color palettes — the visual grammar of a consumer SaaS landing page competing for attention. It also rejects the inverse failure: a cold, lifeless terminal. "Austero. Vivo. Preciso." — austere in restraint, alive in the one signal it permits itself, precise in execution. The reference is Perplexity AI's focused chat hierarchy with no decorative chrome.

Three registers share this one grammar: the default dark "Signal Room" (this document's primary subject), a yellow/black "impact" mode reserved for covers and major state transitions, and a white-on-dark content mode for document-heavy views. All three use the same type system, the same radii, the same restraint — only the canvas inverts.

**Key Characteristics:**
- Near-black, near-monochrome base palette; Signal Yellow is the only saturated color in the system
- Flat surfaces at rest; depth and attention communicated via glow, not shadow
- Gotham is the single voice for all UI text; Chainprinter marks machine/technical data; SONORAN is the wordmark only, never running text
- Components read as a precision instrument: bounded, deliberate, minimal radii
- Empty space is structural — it is where the user's thinking happens

## 2. Colors

The palette is deliberately near-monochrome: a warm near-black base, paper white for ink, a narrow band of charcoal surfaces for depth, and exactly one saturated color reserved as a signal.

### Primary
- **Signal Yellow** (`oklch(0.92 0.18 100)`, ≈ `#fae714`): The brand's single accent. Used only for what demands attention — active states, live indicators, focus rings, the rare true CTA. Also the canvas color for the "impact" full-bleed cover mode (solid yellow background, near-black text).

### Neutral
- **Near-Black** (`oklch(0.205 0.002 80)`, ≈ `#1d1d1b`): Base app background. Warm-tinted near-black, not pure `#000` — this is the "room."
- **Paper White** (`oklch(1 0 0)`, `#ffffff`): Primary ink/text color, and the background color for default/primary buttons (inverted: near-black text on white).
- **Charcoal Surface** (`oklch(0.235 0.002 80)`): Card and popover backgrounds — one step up from the base, the minimum depth needed to read as "a surface."
- **Charcoal Secondary** (`oklch(0.28 0.002 80)`): Secondary button / control backgrounds — one step up again.
- **Charcoal Muted** (`oklch(0.265 0.002 80)`): Muted fills (skeletons, subtle dividers, inactive backgrounds).
- **Quiet Gray** (`oklch(0.7 0.005 80)`): Muted/secondary text — captions, placeholders, metadata. Verify ≥4.5:1 against Near-Black before using for body copy.
- **Hairline** (`oklch(1 0 0 / 8%)`): Borders and dividers — a whisper, not a line.

### Tertiary
- **Alert Ember** (`oklch(0.62 0.22 25)`): Destructive/error state only (delete actions, error text/badges). The only other saturated color permitted in the system, and only for genuine warnings/errors — never decorative.

### Named Rules
**The One Signal Rule.** Signal Yellow appears on a small minority of any given screen. If you're reaching for yellow and the element isn't an active state, a live indicator, a focus ring, or the single most important action on the screen, it's the wrong color. Its rarity is what makes it legible as a signal.

**The Single Source Rule.** `:root` in `src/styles.css` is the only implemented theme and is canonical for all three registers (dark / impact / white-content). The `.dark` class currently present in the stylesheet defines an unrelated, unbranded palette (generic blue-gray Material tokens) inherited from the starter template — it must not be activated as-is. Either redesign `.dark` to express the brand's white-content register, or remove it until that work is done.

## 3. Typography

**Display Font:** Gotham (Black, weight 900), with `ui-sans-serif, system-ui, sans-serif` fallback
**Body Font:** Gotham (Book, weight 400), same fallback
**Label/Mono Font:** Chainprinter (weight 400), with `ui-monospace, monospace` fallback

**Character:** One typeface family, Gotham, carries every weight of meaning from hero impact to fine print — the restraint is in the weight range, not in mixing families. Chainprinter is the one deliberate break: it marks the boundary between human prose and machine/technical output (timestamps, IDs, badges, status). SONORAN exists outside this hierarchy entirely — wordmark only.

### Hierarchy
- **Display** (900, `clamp(2.5rem, 6vw, 4.5rem)`, line-height 1.05, letter-spacing -0.02em): Full-bleed hero titles, section covers, major state-change headlines (impact mode). Respect the 6rem ceiling — above that the page is shouting, not designing.
- **Headline** (700, `clamp(1.5rem, 3vw, 2.25rem)`, line-height 1.2): Section headers, major page titles.
- **Title** (500, 1.125rem / 18px, line-height 1.4): Card titles, sidebar labels, button text, UI headings (H2–H3 equivalent).
- **Body** (400, 0.875rem / 14px, line-height 1.6): Default UI text — the dominant size across the app today. Cap prose blocks at 65–75ch.
- **Label** (400, 0.75rem / 12px, line-height 1.4, letter-spacing 0.05em, Chainprinter): Timestamps, IDs, badges, role labels, status indicators, `<code>`.

### Named Rules
**The Wordmark-Only Rule.** SONORAN renders the PKGD wordmark and nothing else. The moment it appears in a heading, label, or body copy, it has been misused.

**The Two-Voice Rule.** If text is something a person wrote (prose, labels, headings, descriptions), it's Gotham. If it's something the machine produced (a timestamp, an ID, a status code, a log line), it's Chainprinter. There is no third option.

## 4. Elevation

Flat by default. The system does not use shadow-driven elevation to express hierarchy — surfaces sit at the same visual depth, separated by the one-step charcoal ramp (Near-Black → Charcoal Surface → Charcoal Secondary) and hairline borders, not by drop shadows. Depth and attention are instead communicated by **glow**: a soft yellow halo that appears around an element when it becomes active, focused, or otherwise signal-worthy. A separate, large soft black shadow (`shadow-elegant`) exists for the rare full overlay (modal/dialog) that genuinely needs to separate from the page behind it.

### Shadow Vocabulary
- **Glow Accent** (`box-shadow: 0 0 24px -4px color-mix(in oklab, var(--accent) 55%, transparent)`): Tight signal halo — focus rings, active/live indicators, the one CTA that matters right now.
- **Glow Soft** (`box-shadow: 0 0 80px -20px color-mix(in oklab, var(--accent) 35%, transparent)`): Wide ambient glow — used sparingly behind a hero element or active section to suggest presence without a hard edge.
- **Shadow Elegant** (`box-shadow: 0 30px 60px -30px color-mix(in oklab, black 70%, transparent)`): Large soft black shadow reserved for modals/dialogs/overlays that must visually separate from the page.

### Named Rules
**The Flat-By-Default Rule.** Cards, buttons, inputs, and badges are flat at rest — no `box-shadow` for ordinary hierarchy. If something needs to stand out, it earns a glow (signal) or, for true overlays, `shadow-elegant`. Generic `shadow` / `shadow-sm` on every card and button (current shadcn defaults) contradicts this and should be removed.

## 5. Components

Components read as a precision instrument: tactile and confident, but contained — minimal radii, no decorative borders, hover/focus states that feel like the instrument acknowledging a touch rather than a UI "lighting up."

### Buttons
- **Shape:** `rounded-lg` (6px) — a small, deliberate radius, not pill-shaped.
- **Primary (`default`):** Paper White background, Near-Black text, 36px height, 16px horizontal padding. The inverted-contrast "default action" — neutral, not a yellow CTA. Hover: 90% opacity.
- **Outline / Secondary:** Near-Black background with Hairline border, Paper White text. Hover and focus-visible bring in a 1px Signal Yellow ring (`--ring`) — this is where the signal system touches buttons.
- **Ghost / Link:** No background; hover state shifts text/background toward the accent token. Reserve for tertiary actions.
- **Destructive:** Alert Ember background, white text — the only other place a saturated color belongs.

### Badges / Chips
- **Style:** `rounded-md` (4px), Chainprinter label typography (12px, 0.05em tracking), 2px/10px padding.
- **Variants:** default (Paper White / Near-Black — matches primary button), secondary (Charcoal Secondary), destructive (Alert Ember), outline (transparent, Paper White text).

### Cards / Containers
- **Corner Style:** `rounded-2xl` (14px) — noticeably softer than buttons, the "container" radius.
- **Background:** Charcoal Surface, one step above the page background.
- **Shadow Strategy:** Flat at rest (see Elevation). Remove the default `shadow` currently applied.
- **Border:** Hairline (`oklch(1 0 0 / 8%)`), 1px.
- **Internal Padding:** 24px (header/content/footer), with header/content gap of ~6px between elements.

### Inputs / Fields
- **Style:** Transparent background, Hairline border, `rounded-lg` (6px), 36px height, 12px horizontal padding, Body typography.
- **Focus:** 1px Signal Yellow ring (`--ring`, 60% opacity) — no border-color change, the ring *is* the signal.
- **Disabled:** 50% opacity, `cursor: not-allowed`.

### Navigation (Sidebar)
- Dedicated sidebar token set (`--sidebar`, `--sidebar-accent`, `--sidebar-border`, etc.) sits one step darker than the page background — the sidebar recedes; content is the focus. Active nav item uses `--sidebar-accent` (a subtle charcoal lift, not yellow) for its background, reserving Signal Yellow for true live/active-session indicators within content (see `PassivePulse`, `IntervalIndicator`).

### Grid Background (signature pattern)
- `.grid-bg`: a faint yellow grid (`--grid-line`, 8% opacity Signal Yellow, 56px cells) — the "room" made visible. Established brand pattern; preserve on hero/cover surfaces, don't extend it into dense data views where it would add noise.

## 6. Do's and Don'ts

### Do:
- **Do** ration Signal Yellow (`#fae714`) to active states, live indicators, focus rings, and at most one true CTA per screen — The One Signal Rule.
- **Do** keep surfaces flat at rest; use Glow Accent / Glow Soft for emphasis and `shadow-elegant` only for true overlays — The Flat-By-Default Rule.
- **Do** use Gotham for everything a person wrote and Chainprinter for everything the machine produced — The Two-Voice Rule.
- **Do** reserve SONORAN for the wordmark — The Wordmark-Only Rule.
- **Do** preserve `.grid-bg`, `glow-accent`, and `glow-soft` as established signature patterns on hero/cover surfaces.
- **Do** verify body text hits ≥4.5:1 contrast against Near-Black / Charcoal Surface — Quiet Gray is close to the line and must be checked, not assumed.

### Don't:
- **Don't** use glassmorphism for its own sake, gradient-heavy hero sections, playful rounded blobs, or bright multi-color palettes — straight from PRODUCT.md's anti-references.
- **Don't** ship anything that reads as a generic SaaS landing page or consumer app vying for attention.
- **Don't** use `border-left`/`border-right` side-stripes as colored accents on cards or alerts; don't use gradient text (`background-clip: text` + gradient); don't default to glassmorphism, hero-metric templates, identical card grids, tiny uppercase tracked eyebrows, or `01 / 02 / 03` numbered section scaffolding.
- **Don't** activate the `.dark` class as currently written — it replaces the entire brand palette with unrelated generic blue-gray tokens — The Single Source Rule.
- **Don't** apply default `shadow` / `shadow-sm` to cards, buttons, badges, or inputs; this contradicts Flat-By-Default and was inherited unmodified from the shadcn starter.
- **Don't** mix SONORAN into headings, labels, or body text — wordmark only.
