---
target: oracle
total_score: 33
p0_count: 0
p1_count: 0
timestamp: 2026-06-15T16-46-57Z
slug: src-routes-app-oracle-tsx
---

# Critique: Oracle (src/routes/\_app.oracle.tsx) — Re-critique after harden → clarify → layout → polish

## Design Health Score

| #         | Heuristic                                                                |     Score | Key Issue                                                                                                                                                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------ | --------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1         | Visibility of System Status                                              |       3/4 | `awaiting` now pairs the `IntervalIndicator` (consolidated to `/55`) with a `role="status"` sr-only announcement (`t.awaitingStatus`). Sighted feedback stays intentionally minimal ("El Intervalo") by brand design.                                                                                                                |
| 2         | Match Between System and the Real World                                  |       4/4 | All chrome now routes through `oracleCopy(language)`; the visible `LangToggle` genuinely localizes the entire page. "Encauzada" jargon replaced with plain-language "Needs follow-up" / "Seguimiento".                                                                                                                               |
| 3         | User Control and Freedom                                                 |       4/4 | Cross-session reply race fixed — `awaiting` is session-scoped (`string \| null`) and `send.onSuccess`/`onError` guard on `variables.session_id === sessionId` before mutating `messages`.                                                                                                                                            |
| 4         | Consistency and Standards                                                |       3/4 | Seven ad-hoc opacity values consolidated to two (`/55` muted text, `/25` placeholders — matching login's precedent). "Reopen conversation" now uses login's non-uppercase `text-sm font-medium` Primary Button typography. "Nueva" remains a compact uppercase-mono utility pill, still a minor divergence from the two larger CTAs. |
| 5         | Error Prevention                                                         |       3/4 | `submit()` no longer clears `draft` before session creation succeeds; failed creates restore the draft with an inline error. The 64-char silent session-title truncation (`text.slice(0, 64)`) is still unaddressed.                                                                                                                 |
| 6         | Recognition Rather Than Recall                                           |       4/4 | `StatusDot` now carries `title`/`aria-label` text mirroring `StatusBadge`'s visible labels; "Encauzada" jargon resolved with plain-language copy.                                                                                                                                                                                    |
| 7         | Flexibility and Efficiency of Use                                        |       3/4 | Unchanged — `⌘/Ctrl+Enter` send and auto-focus on new thread remain strong; still no session search/filter for long lists, no shortcut for "New".                                                                                                                                                                                    |
| 8         | Aesthetic and Minimalist Design                                          |       3/4 | `AppShell`'s 220px labeled nav collapsed to a 64px icon rail — total chrome now ~324px (was 480px). Oracle's root `h-screen` redundancy resolved to `h-full`. The new icon-rail hover-tooltip pattern is unvalidated in-browser (no automation available in this harness).                                                           |
| 9         | Help Users Recognize, Diagnose, and Recover from Errors (Error Recovery) |       4/4 | `send.onError` and create-session failures now render inline `role="alert"` banners with localized copy and a "Retry" affordance — mirrors login's now-established error pattern.                                                                                                                                                    |
| 10        | Help and Documentation                                                   |       2/4 | Status taxonomy now self-documents via badges + tooltips, but there's still no in-app help entry point and `emptyHint` remains atmospheric rather than functional.                                                                                                                                                                   |
| **Total** |                                                                          | **33/40** | **Good** (up from 19/40 "Poor" on the first pass)                                                                                                                                                                                                                                                                                    |

## Anti-Patterns Verdict

**Deterministic scan**: `detect.mjs --json` across `_app.oracle.tsx`, `MessageBubble.tsx`, `DialecticThread.tsx`, `AppShell.tsx`, `IntervalIndicator.tsx`, and `lib/i18n/oracle.ts` → `[]`. Same known limitation as prior runs: the regex engine doesn't evaluate `tiny-text`/`low-contrast`/`gray-on-color` on raw `.tsx`.

**Manual assessment**: The `/55` + `/25` consolidation directly resolves the manually-flagged `low-contrast`/`gray-on-color` concern from the first pass — the `/30`-`/35` sidebar metadata that risked failing WCAG AA at 9-10px is now `/55`, the same value validated during login's polish pass. `tiny-text` (9-10px uppercase mono labels) remains by design — it's the established Chainprinter convention for technical/status labels — but now reads at a consistent, higher-contrast opacity throughout.

No visual-overlay pass was possible (browser unavailable in this harness), consistent with all prior critiques this session.

## Overall Impression

Oracle moved from **19/40 ("Poor")** to **33/40 ("Good")** across four focused passes — harden, clarify, layout, polish — that mapped 1:1 onto the first critique's three P1s and two P2s. The page no longer leaks replies across sessions, speaks one coherent language driven by the visible `LangToggle`, gives every failure a recoverable `role="alert"` path, and no longer drowns the conversation in 480px of stacked navigation chrome. What remains is genuinely minor: a silently-truncated session title, a still-thin help layer, and one small CTA-typography divergence on the "Nueva" button.

## What's Working

- **Traceable fixes**: every Priority Issue from the first critique has a corresponding, identifiable change — no issue was resolved by accident.
- **Accent discipline preserved**: `var(--accent)` still appears only at meaningful moments (StatusDot "Open", send button, composer focus border, active nav icon) — Principle #2 holds even after the AppShell rewrite.
- **Consolidation extends an existing convention, not a new one**: `/55` and `/25` are login's already-validated values, applied here rather than inventing Oracle-specific tokens — the right root-cause fix for "seven opacity values" drift.

## Priority Issues

### P2 — Session title is silently truncated to 64 characters

**What**: `submitPrompt` calls `createSession.mutateAsync(text.slice(0, 64))` with no indication that the first message was cut for the session title.
**Why it matters**: A user whose first message is a long strategic prompt sees a truncated, possibly mid-word, session title in the sidebar with no explanation (heuristic #5).
**Fix**: Show the full first message via `title`/tooltip on the sidebar item, or truncate at a word boundary instead of a hard character cut.
**Suggested command**: `/impeccable clarify`

### P3 — "Nueva" / New-conversation button diverges from the established Primary Button pattern

**What**: The sidebar's new-conversation button is a compact `text-[10px] uppercase tracking-[0.2em]` pill, while "Reopen conversation" now uses login's `text-sm font-medium` non-uppercase pattern.
**Why it matters**: Minor — both "utility action" and "primary CTA" readings are defensible, but the divergence should be a deliberate choice rather than incidental drift (heuristic #4).
**Fix**: If "Nueva" is meant as a primary action, align it to `text-sm font-medium`; if it's intentionally a label-adjacent utility action (it sits beside the "Conversations" header), leave as-is.
**Suggested command**: `/impeccable polish`

## Persona Red Flags

**Sam (Accessibility)**

- The two prior gaps are closed: `StatusDot` now has text alternatives, and the `awaiting` state has a `role="status"` announcement.
- Residual: no announcement when a reply lands in a session the user has navigated away from — `qc.invalidateQueries` refreshes the sidebar data, but there's no "new reply" cue distinguishing that from a routine refresh.

**Jordan (First-timer)**

- The EN/ES mixing and "Encauzada" jargon are gone — Jordan now sees one coherent language end-to-end.
- Still: `emptyHint` remains evocative rather than instructional, and there's no legend beyond the badge/tooltip text itself for "Needs follow-up" vs "Active" vs "Closed".

**Riley (Stress tester)**

- The cross-session race and silent send/create failures are fixed.
- Typing a >64-char first message still produces a silently-truncated title with no feedback (P2 above).

## Minor Observations

- The "new reply while away" cue (Sam's residual flag) isn't implemented — worth considering if multi-session usage is common.
- `AppShell`'s icon-rail tooltips (`RailTooltip`) are a new pattern with no browser verification possible in this harness — worth a quick visual check, especially hover-tooltip positioning near viewport edges.
- Hive/Knowledge/Audit inherit the icon-rail automatically (reclaiming the same ~156px), but any of them rendering their own secondary sidebar should re-check total chrome width against the new 64px baseline during their own Phase 1 critiques.

## Questions to Consider

1. The session-title truncation (P2) is a one-line fix — worth doing now as a quick follow-up, or deferred to Oracle's next critique cycle?
2. Is "Nueva" intentionally a label-adjacent utility action (matching its sidebar-header neighbor), or should it read as a primary CTA like "Reopen"/"Send"?
3. Ready to move to Phase 1's next page critique (index, hive, knowledge, or audit), or another lap on Oracle first?
