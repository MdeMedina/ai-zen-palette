---
target: login
total_score: 28
p0_count: 0
p1_count: 0
timestamp: 2026-06-15T15-46-27Z
slug: src-routes-login-tsx
---
# Critique: Login (src/routes/login.tsx) — Re-check after harden → quieter → typeset → polish

## Design Health Score

| # | Heuristic | Before | After | Δ | Why it moved |
|---|-----------|-------:|------:|--:|--------------|
| 1 | Visibility of System Status | 2 | 2 | — | No spinner/"Initializing…" text added during pending state; auto-redirect still unannounced. Out of scope for typography/visual polish — candidate for a future `/impeccable harden` on loading states. |
| 2 | Match System / Real World | 2 | 3 | +1 | Copy ("Operator ID", "Initialize Session") is unchanged by design, but the CTA's `uppercase tracking-[0.28em]` "terminal command" treatment is gone — normal-case Gotham Medium reads as a standard action, softening the jargon's machine feel. |
| 3 | User Control and Freedom | 2 | 2 | — | Still no password-recovery / alternate entry path. Functional gap, not addressed by this pass. |
| 4 | Consistency and Standards | 2 | 4 | +2 | Both cited drifts fully resolved: card is now flat `bg-card` + hairline border (matches the "Surface Card" in design.json), and the CTA (`text-sm font-medium`, no uppercase/tracking) now matches the documented Primary Button spec. Typography follows the Two-Voice Rule: Gotham for UI/labels/CTA/errors, Chainprinter reserved for input values + version footer. |
| 5 | Error Prevention | 1 | 3 | +2 | The cited issue — pre-filled `admin@pkgd.os` / `•••••` causing a guaranteed first-submit failure and disclosing a likely-valid admin email — is fully resolved (`useState("")` for both fields, from the harden pass). `autoFocus` on email further reduces friction. Remaining gap to 4: no real-time format validation beyond browser defaults. |
| 6 | Recognition Rather Than Recall | 3 | 4 | +1 | The cited weakness — tiny low-opacity labels hurting recognition for low-vision users — is resolved: field labels and eyebrow moved from `/45`–`/40` to `/55` opacity, restoring WCAG AA contrast at 10px. |
| 7 | Flexibility and Efficiency | 2 | 3 | +1 | `autoFocus` added on the email field, removing the extra click/tab every user previously needed. |
| 8 | Aesthetic and Minimalist Design | 2 | 4 | +2 | The cited "triple accent glow" (radial halo + gradient hairline + CTA glow) is gone. The quieter pass removed the decorative hairline and recolored the halo to a neutral `var(--foreground)` tint; polish flattened the card (no blur/shadow/opacity layering). Exactly **one** accent-colored glow remains — `--glow-soft` on the CTA — making "the accent is a signal, not decoration" concrete. |
| 9 | Help Users Recognize/Diagnose/Recover from Errors | 1 | 3 | +2 | Both cited gaps resolved: error copy is now mapped to plain-language sentences by status code (401/403 vs. network), and the message container has `role="alert"` (implicit `aria-live="assertive"`), and renders in readable Gotham `text-sm` instead of 11px all-caps mono. Remaining gap to 4: no actionable "next step" link (e.g., recovery), tied to heuristic #3/#10. |
| 10 | Help and Documentation | 0 | 0 | — | Still no help link or support contact on a "Restricted Access" gate. Out of scope for this pass — would require a new UI element / IA decision. |
| **Total** | | **17/40** | **28/40** | **+11** | **Poor → Good** (crosses two score bands) |

## Anti-Patterns Verdict

**Deterministic scan**: `node .github/skills/impeccable/scripts/detect.mjs --json src/routes/login.tsx` → `[]`, exit 0 (clean, same as before). As noted in the original critique, this engine doesn't run `tiny-text`/`wide-tracking`/`all-caps-body`/`low-contrast`/`gray-on-color` against raw `.tsx`, and `dark-glow` only matches literal `rgb()` shadows — not this project's `color-mix()`-based glows. A clean result here was never proof of a clean page; the manual re-check below is the actual signal.

**Manual re-check of the original anti-pattern findings**:
- ~~Glassmorphism card (`bg-[var(--card)]/60 backdrop-blur-md` + `shadow-elegant`)~~ → **fixed**. Now `border border-foreground/10 bg-card p-8`, flat, matching the "Surface Card" component.
- ~~Same 10-11px uppercase/mono/wide-tracked treatment stamped on every text element (eyebrow, both labels, error, footer) — "everything looks like a label"~~ → **fixed**. Eyebrow and field labels are now Gotham Medium with `tracking-[0.1em]` (down from `0.28–0.32em`); the error message is a normal-case Gotham sentence; the CTA dropped uppercase/tracking entirely. Only the input values and the version footer remain Chainprinter — an intentional, now-isolated "machine data" register instead of the page's default voice.
- ~~Triple accent glow~~ → **fixed**, see heuristic #8.

**Visual overlays**: Still not available in this session (no browser automation / dev server reachable) — this re-check is a full source re-read against the same heuristic rubric used in the original pass, not a rendered-DOM inspection.

## What Changed (by pass)

- **harden**: empty default field state (was pre-filled `admin@pkgd.os` / `•••••`), `focus-visible` ring on both inputs, plain-language status-mapped error copy with `role="alert"`.
- **quieter**: removed the decorative gradient hairline atop the card; recolored the radial halo from accent-yellow to a neutral `var(--foreground)` tint.
- **typeset**: eyebrow + field labels moved from Chainprinter (`font-mono`, 28-32% tracking) to Gotham Medium (`font-sans font-medium`, 10% tracking); CTA dropped `uppercase tracking-[0.28em] text-[12px]` for `text-sm font-medium` (matches the documented Primary Button spec); error message moved from 11px all-caps mono to `text-sm` Gotham.
- **polish**: flattened the card (`bg-card`, no blur/shadow); bumped label/eyebrow/footer opacity `/40`–`/45`–`/30` → `/55` for WCAG AA contrast at 10px; added `focus-visible` ring to the CTA button; added `autoFocus` to the email input.

## What's Still Open

Nothing P0/P1 remains. The residual gaps are all **functional/IA**, not visual, and were out of scope for harden → quieter → typeset → polish on this page:

- **[P2] No loading announcement** (#1): pending state has no spinner/"Initializing…" text or `aria-live` on the redirect.
- **[P3] No recovery path** (#3): no "forgot access key" or alternate entry.
- **[P3] No help/support entry point** (#10): nothing on the "Restricted Access" gate points anywhere if a legitimate user is locked out.

These three are related — together they're the difference between "Good" (28) and "Excellent" (36+), and would likely need a product decision (does this gate *have* a recovery flow?) before a future `/impeccable harden` pass on this page.
