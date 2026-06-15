---
target: hive
total_score: 15
p0_count: 0
p1_count: 3
timestamp: 2026-06-15T16-54-32Z
slug: src-routes-app-hive-tsx
---
# Critique: Hive Matrix (src/routes/_app.hive.tsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 1/4 | `operatorsQ.data?.map(...)` renders nothing while loading and nothing when empty — no skeleton, no "no operators yet." All three mutations (`createM`/`updateM`/`deleteM`) have no `onError`, so failed saves give zero feedback. |
| 2 | Match Between System and the Real World | 1/4 | `DeleteDialog`'s confirmation copy ("Esta acción elimina... Escribe... para confirmar") is hardcoded Spanish while every other label on the page is English. "Friction"/"Calcification" columns are unexplained jargon with color-coded thresholds and no legend. |
| 3 | User Control and Freedom | 2/4 | Drawers/dialogs close via the visible `X`/Cancel, but not via `Escape` or backdrop click — standard modal expectations aren't met for edge cases. |
| 4 | Consistency and Standards | 2/4 | Primary CTAs ("Register Operator", "Commit Operator", "Save changes") use `text-[11px] uppercase tracking-[0.24em]/0.28em`, diverging from the `text-sm font-medium` Primary Button pattern now established on login/Oracle. Opacity values span `/5, /10, /15, /20, /30, /40, /45, /50, /60, /70` with no consolidation. |
| 5 | Error Prevention | 3/4 | `DeleteDialog`'s type-the-email-to-confirm is a genuinely strong guard for the destructive action. Forms use `required`, but there's no feedback if a submit fails server-side (tied to #1/#9). |
| 6 | Recognition Rather Than Recall | 2/4 | Icon-only Edit/Delete actions are common enough to recognize, but "Friction"/"Calcification" are raw numbers with color-coding and zero explanation — a returning admin must recall what the thresholds mean. |
| 7 | Flexibility and Efficiency of Use | 1/4 | No search/filter/sort on the operator table, no bulk actions, no keyboard shortcuts for Register/Save — one rigid path through a flat table. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean table, disciplined accent usage (admin badge, active brand-tags, focus rings). Root `<div className="flex h-screen flex-col">` re-asserts viewport height as a flex child of `AppShell`'s `min-h-screen` `<main>` — same redundancy pattern resolved in Oracle's layout pass, lower-risk here since `overflow-auto` is scoped to the table. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 0/4 | No `onError` on any of the three mutations — a failed create/update/delete produces no message at all; the button just re-enables silently. |
| 10 | Help and Documentation | 0/4 | "Friction" and "Calcification" are PKGD-specific metrics with no tooltip, legend, or definition anywhere — worse than Oracle's "Encauzada" (which at least had a named badge). |
| **Total** | | **15/40** | **Poor** |

## Anti-Patterns Verdict

**Deterministic scan**: `detect.mjs --json src/routes/_app.hive.tsx` → `[]`, exit 0. Same known limitation — the regex scanner doesn't catch missing-error-handling, mixed-language strings, or undefined empty/loading states; all of the above were found by manual review.

**Manual assessment**: No glassmorphism/gradient/generic-SaaS tells — the table and drawer chrome are on-brand (flat borders, accent-only-where-it-matters, Chainprinter for telemetry). The slop here isn't aesthetic, it's *functional*: silent mutation failures and an untranslated confirmation dialog are the kind of thing that reads as "half-built" rather than "AI-generated," but both erode trust in an admin tool.

No visual-overlay pass was possible (browser unavailable in this harness).

## Overall Impression

Hive Matrix looks the part — same disciplined flat-surface, single-accent language as login and (post-polish) Oracle — but underneath, it's the least finished of the three. Every destructive or state-changing action (`createM`, `updateM`, `deleteM`) fails silently, the highest-stakes dialog on the page (delete confirmation) switches languages mid-sentence, and the two headline metrics ("Friction", "Calcification") are presented as color-coded numbers with no explanation anywhere. The single biggest opportunity: **give these three mutations the same `harden` treatment Oracle's send/create mutations got** — that one fix closes the #1, #9, and a chunk of the #5 gaps simultaneously.

## What's Working

- **Delete confirmation via type-to-match email** (`DeleteDialog`) is a textbook "errors nearly impossible" pattern for a destructive action — the strongest single heuristic result on the page.
- **Brand-tag toggle UI** (`RegisterDrawer`/`EditDrawer`'s "Knowledge Linkage · Brands" buttons) is a clean, accessible multi-select pattern — clear active/inactive states, no extra chrome.
- **Inherits Oracle's AppShell layout fix automatically** — the 64px icon rail applies here too, so Hive's table gets the same chrome-width improvement without any page-level change.

## Priority Issues

### P1 — Mutations have no error handling; failures are silent
**What**: `createM`, `updateM`, `deleteM` (lines 23-44) define `onSuccess` but no `onError`. A failed register/edit/delete leaves the drawer open with the button re-enabled and **zero indication anything went wrong**.
**Why it matters**: An admin hitting a duplicate-email error, an expired session, or a network drop gets no signal — they may retry blindly, assume success, or give up. This is the exact bug class fixed in Oracle's harden pass (lines 23-44 here vs. Oracle's `send`/`createSession`).
**Fix**: Add `onError` to each mutation; surface an inline `role="alert"` message inside the drawer/dialog (mirror Oracle's `sendError`/`createError` pattern).
**Suggested command**: `/impeccable harden`

### P1 — Mixed-language UI: DeleteDialog body is hardcoded Spanish
**What**: Lines 514-515 — "Esta acción elimina **{name}** y revoca su acceso. Escribe {email} para confirmar." is Spanish; every other label on Hive ("Register Operator", "Save changes", "Cancel", "Delete operator", all column headers) is English.
**Why it matters**: Same bug class as Oracle's original P1 (mixed EN/ES chrome) — but here it lands on the **destructive confirmation**, the moment clarity matters most.
**Fix**: Translate to English to match the rest of Hive, or extend the `LangToggle`/`oracleCopy` i18n pattern from Oracle to this page.
**Suggested command**: `/impeccable clarify`

### P1 — "Friction" and "Calcification" are unexplained, color-coded jargon metrics
**What**: `TelemetryNumber` (lines 172-177) color-codes these two columns (red >7.5, accent >5, muted otherwise) with no tooltip, legend, or definition anywhere on the page.
**Why it matters**: A new admin can't tell what's being measured, what's "normal," or why a row is flagged red — the same "color + jargon, no key" issue identified (and fixed) for Oracle's "Encauzada" status, but with no badge text at all here, just a bare number.
**Fix**: Add a `title`/tooltip on each column header and on `TelemetryNumber` itself explaining the metric and threshold ("Friction: operational resistance score, 0-10; >7.5 flagged").
**Suggested command**: `/impeccable clarify`

### P2 — No loading or empty states for the operator table
**What**: `operatorsQ.data?.map(...)` renders nothing during the fetch and nothing if the result is `[]` — just table headers over a blank body.
**Why it matters**: A fresh tenant with zero operators, or a slow initial load, looks broken rather than "no data yet" (heuristic #1).
**Fix**: Render a loading row while `operatorsQ.isPending`, and an empty-state row ("No operators registered yet.") when `data.length === 0`.
**Suggested command**: `/impeccable clarify`

### P2 — Primary-action typography diverges from the established Primary Button pattern
**What**: "Register Operator", "Commit Operator", and "Save changes" all use `text-[11px] uppercase tracking-[0.24em]/0.28em`, while login/Oracle's primary CTAs now use `text-sm font-medium` non-uppercase.
**Why it matters**: Two competing "main action" typographies now coexist across the app — a user who learned one pattern on Oracle sees a different one on Hive (heuristic #4).
**Fix**: Align Hive's primary CTAs to `text-sm font-medium` non-uppercase, matching login/Oracle.
**Suggested command**: `/impeccable polish`

## Persona Red Flags

**Alex (Power User)**
- No search/filter/sort on the operator table — finding one operator among many means scrolling and scanning.
- No bulk actions (bulk role change, bulk brand reassignment) despite this being a multi-row admin table.
- No keyboard shortcut to submit `RegisterDrawer`/`EditDrawer` (Oracle's composer has `⌘/Ctrl+Enter`; these forms don't).

**Sam (Accessibility)**
- `RegisterDrawer`/`EditDrawer`/`DeleteDialog` are plain `fixed inset-0` divs with no `role="dialog"`, `aria-modal`, or focus trap — a keyboard user can tab out of an open drawer back into the underlying table.
- No `Escape`-to-close on any overlay — keyboard-only users must tab all the way to the small `X`.
- `TelemetryNumber`'s red/yellow/gray coding conveys "flagged" status by color alone, with no text/aria equivalent.

**Riley (Stress Tester)**
- Triggering any of the three mutations against a failing backend produces no visible change beyond the button re-enabling — Riley would log this as "form silently does nothing on error" (P1 above).
- Very long operator names/emails have no `truncate`/max-width on `Td` — could stretch the table awkwardly with real-world data.

## Minor Observations

- `PageHeader` (exported from this file) is reused by both `_app.knowledge.tsx` and `_app.audit.tsx` — its eyebrow label uses `text-foreground/40`, while Oracle's equivalent eyebrow is now `/55`. Any opacity-consolidation pass should account for this shared component, since fixing it here fixes all three admin pages at once.
- `TelemetryNumber`'s null-state dash (`text-foreground/20`) is very dim relative to the `/55` convention — likely intentional ("absence" should recede), but worth a second look during a future polish pass.
- Root `<div className="flex h-screen flex-col">` duplicates the `h-screen`/`min-h-screen` redundancy noted (and fixed) in Oracle's layout pass — lower-risk here, but worth the same `h-full` treatment for consistency if/when this page gets a layout pass.

## Questions to Consider

1. The two P1s around mutation error-handling and the Spanish `DeleteDialog` copy both map to the exact fixes already proven on Oracle (harden + clarify) — want to apply the same recipe here directly, or treat Hive as its own pass given it's an admin (not conversational) surface?
2. "Friction" and "Calcification" — are these terms meant to stay as-is for an internal admin audience, or do they need the same "plain-language" treatment "Encauzada" got?
