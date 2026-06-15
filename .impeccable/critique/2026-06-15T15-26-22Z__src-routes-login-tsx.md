---
target: login
total_score: 17
p0_count: 0
p1_count: 3
timestamp: 2026-06-15T15-26-22Z
slug: src-routes-login-tsx
---
# Critique: Login (src/routes/login.tsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Pending state only dims/disables the submit button (no spinner or "Initializing…" text); error and auto-redirect aren't announced to assistive tech. |
| 2 | Match System / Real World | 2 | "Operator ID" / "Initialize Session" / "Access Key" replace "Email" / "Password" / "Sign in" — on-brand but adds a translation step for non-technical users. |
| 3 | User Control and Freedom | 2 | No password-recovery or alternate entry path; the only "exit" is browser back/forward. |
| 4 | Consistency and Standards | 2 | The glass card (`bg-card/60` + `backdrop-blur-md` + `shadow-elegant`) conflicts with the flat "Surface Card" just defined in DESIGN.md; the all-mono voice departs from the Two-Voice Rule. |
| 5 | Error Prevention | 1 | Inputs are pre-filled with `admin@pkgd.os` / `•••••`, inviting an immediate, confusing failed login on first submit. |
| 6 | Recognition Rather Than Recall | 3 | Minimal 2-field form, nothing hidden — though tiny low-opacity labels hurt recognition for low-vision users. |
| 7 | Flexibility and Efficiency | 2 | `autoComplete` attributes + Enter-to-submit help password managers and keyboard users, but no `autoFocus` on the first field. |
| 8 | Aesthetic and Minimalist Design | 2 | Layout is sparse, but the card stacks blur + transparency + shadow + two extra accent glows — the "one signal" principle is diluted across three glowing elements before the user does anything. |
| 9 | Help Users Recognize/Diagnose/Recover from Errors | 1 | "Initialization rejected" / raw `err.message` gives no plain-language cause or next step, and isn't `aria-live`. |
| 10 | Help and Documentation | 0 | No help link or support contact anywhere on a "Restricted Access" gate. |
| **Total** | | **17/40** | **Poor — major gaps, though the core composition and brand tone are sound.** |

## Anti-Patterns Verdict

**LLM assessment**: This reads as a competent, on-brand "dark SaaS login" — a centered card on a grid + accent-halo backdrop, terminal-flavored copy, mono micro-labels, and a glow-on-CTA that's a genuinely brand-specific touch. But the form card itself (`border border-foreground/10 bg-[var(--card)]/60 p-8 backdrop-blur-md` + `boxShadow: var(--shadow-elegant)`) is a textbook glassmorphism panel — exactly the pattern CLAUDE.md/PRODUCT.md list under "No glassmorphism for its own sake," and it's the single most prominent element on the page. The same 10-11px, uppercase, mono, wide-tracked treatment is also stamped on every text element on the screen (eyebrow, both field labels, error text, footer) — four repetitions of one micro-label pattern flattens hierarchy; everything *looks* like a label.

**Deterministic scan**: `node .github/skills/impeccable/scripts/detect.mjs --json src/routes/login.tsx` → `[]`, exit 0 (clean — 0 findings). This is worth contextualizing rather than taking at face value: the registry's `tiny-text`, `wide-tracking`, `all-caps-body`, `low-contrast`, and `gray-on-color` checks are implemented against rendered DOM (static-HTML/browser engines) and don't run on a raw `.tsx` source via the regex engine, and `dark-glow` matches literal `rgb()` box-shadow values — not this project's `color-mix(in oklab, var(--accent) …)` custom-property glows. So "0 findings" reflects engine coverage on a TSX file, not a verified-clean page. Several of the manual findings below (all-caps 10px mono labels at 30-45% opacity, three stacked glow/blur effects) fall directly into categories these checks exist to catch — the detector simply can't see them in this file format. No false positives to report, since there were no findings.

**Visual overlays**: Not available this run — no browser automation or dev server tooling is reachable in this session, so `detect.js` injection and a `[Human]`-tab overlay could not be produced. This critique is based on a full read of `src/routes/login.tsx`, `src/components/brand/Logo.tsx`, and the design tokens in `src/styles.css`.

## Overall Impression

The login screen nails the **tone** — quiet, dark, a single signal-yellow halo, terminal-flavored copy — and the glow-on-CTA is a clean, correct application of "Flat + glow." But the **execution** has three concrete gaps that each undercut a principle this project just wrote down in DESIGN.md: the glass card breaks "flat by default," the triple-glow breaks "the accent is a signal, not decoration," and the missing focus rings put this page below the WCAG AA bar PRODUCT.md commits to. The single biggest opportunity: make the card flat and let the CTA's glow be the *only* glow on the page — one change that removes the AI-slop tell and restores the signal hierarchy at the same time.

## What's Working

- **The CTA glow is the system working as designed.** `style={pending ? {} : { boxShadow: "var(--glow-soft)" }}` on "Initialize Session" is exactly DESIGN.md's "Flat + glow" rule in practice: the one actionable element signals "ready," and the signal disappears the instant the action is in flight.
- **The form is genuinely low-load.** Two fields, one button, `autoComplete="email"` / `autoComplete="current-password"`, native `<form onSubmit>` (Enter submits). Well inside the ≤4-item working-memory rule, and password managers will work out of the box.
- **Deep-link-aware redirect.** The `useDeepLinkStore` capture/consume pair means a user who lands on `/login?next=/audit?...` is sent to the right place *after* authenticating, rather than dumped on a generic home screen — a small but real respect for user intent.

## Priority Issues

**[P1] No visible focus indicator on the email/password inputs**
- **Why it matters**: Both `<input>` elements use `outline-none` with no replacement focus style (`src/routes/login.tsx:102,116`). A keyboard-only user has no way to tell which field is active — they can tab into the password field and start typing their email into it without realizing. This fails WCAG 2.4.7 (Focus Visible, AA), which PRODUCT.md commits to.
- **Fix**: Add a focus treatment consistent with the brand's signal token, e.g. `focus-visible:ring-1 focus-visible:ring-[var(--ring)]` (or a bottom-border color shift) on both inputs.
- **Suggested command**: `/impeccable harden`

**[P1] The form card is a glassmorphism panel — the project's own banned pattern**
- **Why it matters**: `bg-[var(--card)]/60 backdrop-blur-md` plus `boxShadow: var(--shadow-elegant)` (`src/routes/login.tsx:86-87`) is the exact "glass card" treatment CLAUDE.md and PRODUCT.md list as an anti-reference, and it conflicts with the flat "Surface Card" component just defined in `.impeccable/design.json`. It's also the most visually prominent element on the page — first impression undercuts the brand doc written this session.
- **Fix**: Make the card flat — solid `bg-card` (no `/60`), drop `backdrop-blur-md`, keep the hairline `border-foreground/10`, and reserve `--shadow-elegant` for true overlays (modals) per DESIGN.md's "Flat-By-Default Rule."
- **Suggested command**: `/impeccable polish`

**[P1] Pre-filled "admin@pkgd.os" / "•••••" invite a confusing first failure**
- **Why it matters**: `useState("admin@pkgd.os")` and `useState("•••••")` (`src/routes/login.tsx:33-34`) mean any visitor sees a plausible admin username pre-filled and a password field that *looks* filled but holds a literal 5-character placeholder string. A user who clicks "Initialize Session" without touching the form gets an immediate, unexplained rejection — and the page reveals a likely-valid admin email by default, which is also a quiet information-disclosure smell on a page literally labeled "Restricted Access."
- **Fix**: Default both fields to `""`. The existing `placeholder` text already communicates the expected format.
- **Suggested command**: `/impeccable harden`

**[P2] Error messaging is jargon-only and silent to assistive tech**
- **Why it matters**: On failure the form shows either `err.message` (raw API error text) or the fallback `"Initialization rejected"` (`src/routes/login.tsx:61,121-124`) — neither tells the user *what* went wrong (bad password? server down?) or what to do next, and the `<p>` has no `role="alert"`/`aria-live`, so screen reader users aren't notified at all.
- **Fix**: Map known failure cases to one plain-language line ("Email or access key not recognized — try again"), and add `role="alert" aria-live="polite"` to the message container.
- **Suggested command**: `/impeccable harden`

**[P2] The accent "signal" is tripled before the user does anything**
- **Why it matters**: PRODUCT.md's Design Principle #2 says the accent "marks only what demands attention... using it elsewhere dilutes its meaning." On load, this page already shows three accent-colored glows: the radial halo behind the logo (`color-mix(in oklab, var(--accent) 14%, transparent)`), the gradient hairline atop the card (`via-[var(--accent)]`), and `--glow-soft` on the button. The button's glow — the one that should mean "this is the action" — has to compete with two purely decorative ones.
- **Fix**: Drop the radial halo and/or the top gradient hairline; let the CTA's glow be the only glow on first paint.
- **Suggested command**: `/impeccable quieter`

## Persona Red Flags

**Sam (Accessibility-Dependent User)**:
- Tabbing through the form gives **no visible indication** of which field is focused (`outline-none`, no replacement) — Sam can't tell whether they're about to type into "Operator ID" or "Access Key."
- Field labels (`text-foreground/45`, 10px) measure **~4.4:1** contrast against the `#1d1d1b`-class background — just under the 4.5:1 AA threshold for normal text.
- Footer microcopy (`text-foreground/30`, 10px) measures **~2.7:1** — a clear AA failure.
- A failed login (`"Initialization rejected"`) is never announced via `aria-live` — Sam's screen reader stays silent after a failed submit.

**Jordan (Confused First-Timer)**:
- "Corporate Email / Operator ID," "Access Key," "Initialize Session," and "Restricted Access" are four different pieces of unexplained jargon on a single screen — Jordan has to mentally translate all of them to "email," "password," "sign in," and "this is a login page."
- The form arrives **pre-filled** with `admin@pkgd.os` and a masked-looking password — Jordan may reasonably assume the form is already filled out correctly (maybe it remembered them?) and click submit, only to get a cryptic "Initialization rejected."

**Riley (Deliberate Stress Tester)**:
- Riley's first move — click "Initialize Session" without touching anything — submits `admin@pkgd.os` / `•••••` (the literal 5-bullet string) to `authApi.login`. Whatever comes back, the resulting error is either a raw API message or "Initialization rejected," with zero guidance on what just happened.
- Refresh mid-`pending`: the button is disabled during the request, so no double-submit — that part holds up.

## Minor Observations

- The entire form (labels, inputs, button, footer) is rendered in `font-mono` (Chainprinter). Per DESIGN.md's "Two-Voice Rule," Chainprinter is for machine/technical data while Gotham carries UI meaning. Using mono for the primary CTA copy ("Initialize Session") is a deliberate "terminal" register choice worth confirming intentionally rather than by default.
- No `autoFocus` on the email input — every user needs an extra click/tab before typing, even though it's almost always the first thing they'll do.
- The raw `<button type="submit">` doesn't use the shared `buttonVariants`/`Button` component and has no explicit `focus-visible` style — it'll fall back to the browser's default focus ring, which may not match the brand palette.
- The `structural_gold` deep-link special case (`src/routes/login.tsx:40-41`) is business logic specific to `/audit` alerts living inside the login route — not a design issue, but worth knowing if this route gets restructured.

## Questions to Consider

- What if "Initialize Session" read as "Sign in," with the terminal voice reserved for system labels (timestamps, IDs) rather than the primary action?
- Does a "Restricted Access" gateway intentionally have no recovery path, or is "forgot access key" missing by oversight?
- If the CTA's glow means "ready to act," what does it mean that the halo behind the logo and the hairline atop the card are already glowing before the user has done anything?
