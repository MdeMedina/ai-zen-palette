# PKGD OS · Frontend Design Context

This file contains persistent design guidelines for the `ai-zen-palette` frontend.
It is used by AI assistants to ensure all future design work is consistent with the established visual language.

---

## Design Context

### Users

Mixed audience — executives (C-suite, founders), internal strategic advisors, and technical product teams. The user arrives with a **real cognitive load**: a decision to make, a conflict to process, or a strategy to stress-test. They are not exploring; they are working. The interface must serve **focused, intentional use** — never interrupting, never decorating unnecessarily.

**Job to be done:** Extract clarity from complexity. The Oracle is a thinking partner, not a chatbot. The Hive and Knowledge modules are operational, not exploratory.

### Brand Personality

Three words: **Austero. Vivo. Preciso.**

The brand is PKGD — a dark-first OS aesthetic with a single sharp accent (`#fae714`, a deliberate yellow that cuts through the dark). The tone is institutional but not cold. It should feel like something that **takes the user seriously**.

Emotional goal: **Presence and containment** — the user should feel they are in a focused space where thinking is possible. No urgency. No visual noise. The silence is designed.

Brand tagline seen in templates: **"That's the Spirit"** — vertical, capitalized, in the brand accent yellow. Use this sparingly as a signature motif.

Brand icon: A yellow **exploding bottle / impact mark** (seen in template pages 2, 4, 5, 6, 7 as the top-right signature). This is the PKGD symbol.

### Aesthetic Direction

- **Visual tone:** Organic but controlled. Soft geometry (subtle radii) within a rigid grid structure. Not brutalist — more like a precision instrument with warm tactile edges.
- **Color:** Dark-first. Background `#1d1d1b` (near-black with a warm undertone). Accent `#fae714` (electric yellow) used sparingly as the only vivid color. White `#FFFFFF` for all body text and UI ink.
  - **High-impact layout variant:** Solid yellow (`#fae714`) background with black text — used for hero/cover moments (see template pages 2, 5). This is a valid full-screen treatment for major state changes.
  - **White layout variant:** Pure white background with black type and yellow accent blocks — used for document/content-heavy views (see template pages 3, 4, 5).
- **Template layout patterns:**
  - Cover slides: full-bleed black or yellow, centered wordmark or title
  - Content slides: white bg, left-aligned yellow title block + black body text, right-side content column
  - Yellow block headers: title on yellow rectangle, black text — use for section headers
  - Vertical side label: "THAT'S THE SPIRIT" rotated 90°, top-right, Chainprinter or uppercase Gotham Book, in yellow — brand signature
- **Motion:** Minimal. Only purposeful transitions. Eases should feel deliberate (`ease-out`). Breathing animations (`pulse-passive`) acceptable for passive states.
- **Theme:** Adaptive — dark mode primary, light mode available. Both share the same structural language with inverted color values.
- **Reference:** Perplexity AI — clean chat interface, focused information hierarchy, no decorative chrome. The grid background (`grid-bg`) and glow effects (`glow-accent`, `glow-soft`) are established brand patterns; preserve and extend them.
- **Anti-references:** No glassmorphism for its own sake. No gradient-heavy hero sections. No playful rounded blobs. No bright multi-color palettes. Avoid anything that feels like a SaaS landing page or consumer app.

### Typography System

**This is the canonical, definitive font stack. No Google Fonts. No system fonts for brand elements.**

All fonts are locally self-hosted in `src/assets/fonts/`.

| Role | Font | Weights to use | Usage |
|------|------|----------------|-------|
| **Wordmark / Logo** | `SONORAN` | Regular | The PKGD wordmark only. Never for body or labels. |
| **Hero titles / H1 impact** | `Gotham Black` / `Gotham Bold` | Black, Bold | Full-bleed titles, section covers, major headings |
| **UI headings / H2–H3** | `Gotham Medium` | Medium | Section headers, sidebar labels, card titles |
| **Body / readable text** | `Gotham Book` | Book, Light | Paragraph text, descriptions, prose |
| **Fine print / thin accent** | `Gotham Light` / `Gotham Thin` | Light, Thin | Metadata, captions, secondary info |
| **Technical data / mono** | `Chainprinter` | Regular | Timestamps, IDs, badges, role labels, `<code>`, status indicators |

**Font CSS variables (defined in `styles.css`):**
```css
--font-display: 'SONORAN', sans-serif;       /* Wordmark only */
--font-sans:    'Gotham', sans-serif;         /* All UI text */
--font-mono:    'Chainprinter', monospace;    /* Technical data */
```

**Gotham weight mapping:**
- `font-weight: 900` → Gotham Black (hero titles)
- `font-weight: 700` → Gotham Bold (headings)
- `font-weight: 500` → Gotham Medium (UI headings, nav)
- `font-weight: 400` → Gotham Book (body text)
- `font-weight: 300` → Gotham Light (fine print)
- `font-weight: 100` → Gotham Thin (decorative thin)

### Design Principles

1. **Silence is structural.** Empty space is not wasted — it is where thinking happens. Never fill space just to avoid whitespace.
2. **The accent is a signal, not decoration.** `#fae714` yellow marks only what demands attention: active states, CTAs, live indicators, glitches. Using it elsewhere dilutes its meaning.
3. **Gotham carries all meaning; Chainprinter carries all data.** Gotham (in its weight range) is the singular voice of the UI. Chainprinter marks the boundary between human prose and machine output. SONORAN is reserved for the wordmark alone — never in running text.
4. **Containment over expansion.** Components should feel bounded and deliberate. Prefer sharp or slightly-radiused borders over floating cards. The grid is the foundation.
5. **Two valid layout modes:** The black/dark mode (default OS) and the yellow-on-black / black-on-yellow impact mode (for covers, alerts, major state transitions). White-on-dark is also valid for content-heavy views. All three are canonical.

---

## Font Setup (for implementation reference)

Fonts are in `src/assets/fonts/`. The `@font-face` declarations must be in `src/styles.css`:

```css
/* SONORAN — Wordmark */
@font-face {
  font-family: 'SONORAN';
  src: url('@/assets/fonts/SONORAN.otf') format('opentype');
  font-weight: 400;
  font-display: swap;
}

/* Gotham — Full weight stack */
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-Thin.otf') format('opentype'); font-weight: 100; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-ThinIta.otf') format('opentype'); font-weight: 100; font-style: italic; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-XLight.otf') format('opentype'); font-weight: 200; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-XLightIta.otf') format('opentype'); font-weight: 200; font-style: italic; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-Light.otf') format('opentype'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-LightIta.otf') format('opentype'); font-weight: 300; font-style: italic; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-Book.otf') format('opentype'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-BookIta.otf') format('opentype'); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-Medium.otf') format('opentype'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-MediumIta.otf') format('opentype'); font-weight: 500; font-style: italic; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-Bold.otf') format('opentype'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-BoldIta.otf') format('opentype'); font-weight: 700; font-style: italic; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-Black.otf') format('opentype'); font-weight: 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'Gotham'; src: url('@/assets/fonts/Gotham-BlackIta.otf') format('opentype'); font-weight: 900; font-style: italic; font-display: swap; }

/* Chainprinter — Technical data */
@font-face {
  font-family: 'Chainprinter';
  src: url('@/assets/fonts/Chainprinter.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
}
```

---

## Tech Stack Notes

- **Framework:** TanStack Start (React 19, file-based routing via TanStack Router)
- **Styling:** Tailwind CSS v4 with `@theme inline` custom properties (oklch color space)
- **Component library:** Radix UI primitives + shadcn/ui patterns (`components/ui/`)
- **State:** Zustand stores (`stores/`)
- **Animations:** `motion` (Framer Motion v12) + `tw-animate-css`
- **Forms:** React Hook Form + Zod
- **Data fetching:** TanStack Query v5
- **Fonts:** Self-hosted in `src/assets/fonts/` — NO Google Fonts import for brand fonts
- **Design tokens:** All defined in `src/styles.css` under `:root` — use CSS variables, not hardcoded hex values
