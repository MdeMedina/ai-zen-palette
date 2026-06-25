---
target: oracle
total_score: 19
p0_count: 0
p1_count: 3
timestamp: 2026-06-15T16-07-12Z
slug: src-routes-app-oracle-tsx
---

# Critique: Oracle (src/routes/\_app.oracle.tsx)

## Design Health Score

| #         | Heuristic                                                                |     Score | Key Issue                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------ | --------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status                                              |       2/4 | The `awaiting` cue (`IntervalIndicator`, a 2px×12px blinking accent bar) is the only signal during a 0.9–3.1s reply wait, with no `aria-live`/`role="status"` announcement for assistive tech.                                                                                                                                               |
| 2         | Match Between System and the Real World                                  |       1/4 | UI chrome is a fixed mix of Spanish ("Conversaciones", "Activas/Encauzadas/Cerradas", "Abrir conversación") and English ("Oracle Workspace", composer placeholder, "Send"), independent of the visible `LangToggle` — which only changes the AI's reply language, not the chrome. "Encauzada" is undefined internal jargon.                  |
| 3         | User Control and Freedom                                                 |       2/4 | Switching sessions while `awaiting` is true can deliver session A's reply into session B's thread (no guard in `send.onSuccess`/`onError`).                                                                                                                                                                                                  |
| 4         | Consistency and Standards                                                |       2/4 | Seven different opacity values (`/15,/20,/30,/35,/40,/45,/50`) all serve a "muted secondary text" role with no apparent system; three primary-action buttons (Nueva / Abrir conversación / Send) each use a different uppercase-mono treatment, diverging from the non-uppercase Gotham Primary Button pattern just established on `/login`. |
| 5         | Error Prevention                                                         |       2/4 | No guard against the cross-session race in #3; `submit()` calls `setDraft("")` before `await createSession.mutateAsync(...)`, so a failed session-create silently loses the typed message; first message is silently truncated to 64 chars for the session title with no feedback.                                                           |
| 6         | Recognition Rather Than Recall                                           |       3/4 | Session list, active highlight, and persistent placeholder hint are all solid; but the "Activa/Encauzada/Cerrada" taxonomy and the color-only `StatusDot` require the user to recall undocumented meanings.                                                                                                                                  |
| 7         | Flexibility and Efficiency of Use                                        |       3/4 | `⌘/Ctrl+Enter` send shortcut and auto-focus on new thread serve power users well; no session search/filter for long lists, no shortcut for "Nueva".                                                                                                                                                                                          |
| 8         | Aesthetic and Minimalist Design                                          |       2/4 | The chat column itself is admirably flat and quiet, but `AppShell`'s 220px global nav (`AppShell.tsx:37`) plus `SessionsSidebar`'s own 260px panel (`_app.oracle.tsx:206`) stack to **480px of chrome** before any conversation content — about a third of a 1440px viewport, in tension with "Containment over expansion."                  |
| 9         | Help Users Recognize, Diagnose, and Recover from Errors (Error Recovery) |       1/4 | `send.onError` only does `setAwaiting(false)` — no message, toast, or retry. A failed reply looks identical to "the Oracle chose not to respond." Combined with #5's lost-draft case, failures are effectively invisible.                                                                                                                    |
| 10        | Help and Documentation                                                   |       1/4 | No legend/tooltip for the status taxonomy, no in-app help entry point. `emptyHint` ("Speak. The Oracle does not introduce itself.") is evocative brand voice but gives a first-time user zero functional guidance.                                                                                                                           |
| **Total** |                                                                          | **19/40** | **Poor** (one point below the "Acceptable" band; for reference, most real interfaces score 20–32)                                                                                                                                                                                                                                            |

## Anti-Patterns Verdict

**Deterministic scan** (`detect.mjs --json` against `_app.oracle.tsx`, `DialecticThread.tsx`, `MessageBubble.tsx`, `LangToggle.tsx`): `[]` — no findings. Same known caveat as the login scans: the regex engine doesn't evaluate `tiny-text`, `wide-tracking`, `all-caps-body`, `low-contrast`, or `gray-on-color` on raw `.tsx`, and `dark-glow` only matches literal `rgb()` box-shadows (this codebase uses `color-mix()` + CSS vars for `glow-accent`/`glow-soft`, which the pattern doesn't catch).

**Manual / LLM assessment**: This is **not** generic "AI slop" — no gradient hero, no stacked shadow cards, no emoji, no default system fonts, no SaaS-purple palette. The flat hairline-bordered surfaces, restrained single-accent usage, and mono micro-labels are consistent with the PKGD visual language validated during the login pass. That said, several issues the detector can't see are present on manual review:

- **`tiny-text`**: `text-[9px]` group headers ("Activas"/"Encauzadas"/"Cerradas" — `_app.oracle.tsx:226`), `text-[10px]` used in ~6 places, `text-[12px]` reopen/empty states. 9px for jargon labels a user must parse is aggressive.
- **`low-contrast` / `gray-on-color`**: `text-foreground/30` and `/35` (sidebar timestamps, group labels, empty state) sit on `bg-[var(--card)]/30` over `--background: oklch(0.205 0.002 80)` — two very close lightness values. At 9–10px, WCAG AA requires the _normal-text_ 4.5:1 threshold, not the 3:1 large-text one; `/30`–`/35` white-on-near-black is likely to fail it, echoing the exact contrast gap that login's polish pass fixed by bumping `/40`–`/45` → `/55`.
- **`wide-tracking`**: `tracking-[0.28em]`/`tracking-[0.32em]` on uppercase mono — consistent with the established Chainprinter-voice pattern, so not flagged as an anti-pattern on its own, but it compounds the legibility concern when paired with 9–10px sizes above.

No visual-overlay pass was possible (browser unavailable in this harness), consistent with all prior critiques this session.

## Overall Impression

Oracle reads as **the same brand as login** — flat surfaces, one accent, mono micro-labels, generous whitespace in the thread itself — and the core chat loop (compose → send → reply, with session switching) is functionally solid with good power-user touches (`⌘/Ctrl+Enter`, auto-focus, disabled-state guards on the send/reopen buttons). But three structural issues pull the score down hard: the page is **visually doubled** by `AppShell`'s own sidebar, the UI's **language is incoherently mixed** in a way the visible `LangToggle` doesn't actually control, and **failure states are silent** — there's no equivalent of login's now-robust `role="alert"` error handling anywhere in the send/create-session flow. None of these are cosmetic; they sit at the intersection of IA, i18n, and trust. The good news: this page hasn't been touched by any polish pass yet (same starting position as login's 17/40), and the patterns that worked for login — flatten redundant surfaces, add `role="status"`/`role="alert"`, bump low-opacity text — transfer directly here.

## What's Working

- **Disciplined accent usage**: `var(--accent)` appears only where it should — `StatusDot` for "Open", the send button, the composer's focus border, the "Nueva" button border — never as decoration. This is Principle #2 ("the accent is a signal, not decoration") executed correctly.
- **Power-user ergonomics**: `⌘/Ctrl+Enter` to send, auto-focus on the textarea when starting a new thread (`startNew`'s `setTimeout(() => taRef.current?.focus(), 0)`), and a send button that's correctly disabled on empty/whitespace drafts or while `awaiting` — a strong baseline for the Alex persona.
- **Flat-by-default surfaces**: every panel (sidebar, message bubbles, composer, header) uses hairline borders (`border-foreground/5`, `/10`) with no blur, shadow stacking, or glassmorphism — directly consistent with the Flat-By-Default rule validated in login's polish pass.

## Priority Issues

### P1 — Cross-session reply delivery race

**What**: `submit()` captures `sid` and calls `send.mutate({ session_id: sid, ... })`, but `send.onSuccess`/`onError` (`_app.oracle.tsx:58-64`) mutate the component's current `messages`/`awaiting` state unconditionally. If the user switches `sessionId` while a reply is in flight (0.9–3.1s window), the `useEffect` at line 38 has already reset `messages` to the _new_ session's transcript — and when the pending reply resolves, it gets appended to whichever session is now selected, not the one that asked.
**Why it matters**: A silent cross-session data leak undermines trust in the Oracle as "a thinking partner" — a misplaced reply in the wrong conversation is exactly the kind of thing an exec would notice and not forgive (heuristics #1, #3, #5).
**Fix**: Capture `sid` in a ref/closure and compare against the live `sessionId` before applying `setMessages`/`setAwaiting` in `onSuccess`/`onError`; if the session has changed, route the reply to a per-session cache (e.g. update the React Query cache for that session) and surface a lightweight "new reply" indicator on that session's sidebar item instead.
**Suggested command**: `/impeccable harden`

### P1 — UI chrome mixes Spanish and English independent of the LangToggle

**What**: Sidebar/composer strings are hardcoded Spanish ("Conversaciones", "Nueva", "Activas/Encauzadas/Cerradas", "Abrir conversación"/"Reabriendo…", "Aún no hay conversaciones", `aria-label="Nueva conversación"`), while the header, thread, and composer are hardcoded English ("Oracle Workspace", "· New thread", `emptyHint`, the composer placeholder, `aria-label="Send"`, "Operator"/"AI · CEO"). The header-mounted `LangToggle` (en/es) only changes `chatLanguage`, which feeds `mockReply`'s reply-language pool — it has **no effect on any of this chrome**.
**Why it matters**: Every user sees a half-localized interface regardless of their toggle choice, and the toggle itself becomes misleading — it looks like a UI language switch but isn't one (heuristic #2, and a first-impression red flag for Jordan).
**Fix**: Either route all chrome strings through `chatLanguage` via a small string map so the toggle genuinely localizes the page, or — if that's out of scope right now — pick one language for all chrome (English matches the rest of the authenticated app) and relabel/rescope `LangToggle` to make clear it only governs "AI reply language."
**Suggested command**: `/impeccable clarify`

### P1 — Double sidebar consumes ~480px before any content

**What**: `AppShell` already renders a 220px global-nav `<aside>` (`AppShell.tsx:37`, `sticky top-0 h-screen w-[220px]`). `OraclePage` renders its own 260px `<aside>` (`_app.oracle.tsx:206`, `SessionsSidebar`, `h-screen w-[260px]`) _inside_ `AppShell`'s `<main>`. Combined, two stacked vertical panels (480px) precede the chat column — roughly a third of a 1440px viewport — and `OraclePage`'s root `<div className="flex h-screen w-full">` (line 98) duplicates the viewport-height assumption that `AppShell`'s `<main className="flex min-h-screen flex-1 flex-col">` already makes.
**Why it matters**: Directly tensions with "Containment over expansion" and "Silence is structural" — a third of the screen is navigation/list chrome on every visit, and this pattern likely repeats on Hive/Knowledge/Audit if they follow the same per-page-sidebar approach (heuristic #8).
**Fix**: Collapse the global nav to a slim icon rail (~56–64px) on pages with their own secondary sidebar, or fold session-switching into the global nav as a flyout/section — reclaiming 150px+ for the conversation. Drop the redundant `h-screen` on `_app.oracle.tsx:98` in favor of `h-full`/`min-h-0` within `AppShell`'s flex column.
**Suggested command**: `/impeccable layout`

### P2 — Silent failure paths can lose user input

**What**: `send.onError` (`_app.oracle.tsx:63`) only resets `awaiting` — no message, toast, or retry affordance appears; the sent message sits in the thread with no reply and no explanation. Separately, `submit()` clears `draft` (line 69) _before_ `await createSession.mutateAsync(...)` (line 72) — if session creation fails, the user's typed text is gone with zero feedback.
**Why it matters**: This is the exact gap login closed in its final pass (`role="alert"` + plain-language errors). Here, a failed send is indistinguishable from "the Oracle declined to answer," and a failed session-create silently destroys the user's draft (heuristic #9).
**Fix**: On `send.onError`, render an inline "The Oracle did not respond — retry?" affordance scoped to that message; in `submit()`, only clear `draft` after the full pipeline (`createSession` + `send`) has been kicked off successfully, or restore it on catch.
**Suggested command**: `/impeccable harden`

### P2 — Status taxonomy is color/border-only with undefined jargon

**What**: `StatusDot` (`_app.oracle.tsx:271-277`) distinguishes "Open" (filled accent + glow) / `encauzamiento_count>0` (hollow accent ring) / other (gray fill) purely by color and border — no `aria-label`/`title`. `StatusBadge` adds text ("Activa"/"Encauzada"/"Cerrada") but "Encauzada" is undefined PKGD-internal jargon (derived from `encauzamiento_count`), and the type system's third `SessionStatus` value ("Archived") is visually collapsed into "Cerrada" alongside "Closed" with no distinction.
**Why it matters**: Sam (color-only meaning, no SR text) and Jordan (undefined jargon, no legend) both hit friction here; "Closed" vs "Archived" being indistinguishable may also hide real state from users who need it (heuristics #2, #6, #10).
**Fix**: Add `aria-label`/`title` to `StatusDot` mirroring `StatusBadge`'s text; add a one-line legend (e.g., a small `?` affordance or persistent caption) defining "Encauzada"; give "Archived" its own label if it's meant to be distinguishable from "Closed."
**Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Sam (Accessibility)**

- `StatusDot` conveys session state via fill/border/glow alone, with no text alternative for screen readers (P2 above).
- The `awaiting` indicator has no `aria-live`/`role="status"` — a screen-reader user gets no signal that a reply is pending or has arrived, for up to 3.1 seconds (P1, heuristic #1).
- `text-foreground/30`–`/35` at 9–10px on sidebar metadata is likely below WCAG AA contrast (Anti-Patterns Verdict).

**Jordan (First-timer)**

- Lands on a UI that's simultaneously Spanish ("Conversaciones", "Nueva") and English ("Oracle Workspace", "Speak. The Oracle does not introduce itself.") — and the prominent `LangToggle` doesn't fix either side (P1).
- Sees "Encauzada" as a session-group label and status badge with zero explanation (P2).
- The empty-state hint is atmospheric, not instructional — no guidance on what kind of input the Oracle expects.

**Riley (Stress tester)**

- Switches sessions while a reply is `awaiting` and gets that reply delivered into the wrong thread (P1).
- Types a first message >64 chars and finds the session title silently truncated with no feedback.
- Triggers `send.onError` (e.g., a flaky mock) and sees the sent message sit forever with no error, no retry (P2).

## Minor Observations

- `DialecticThread.tsx:34-41` — `style={{ opacity: awaiting ? 0.6 : 1 }}` is dead code: this block only renders `if (awaiting)`, so the ternary always evaluates to `0.6`. Either hardcode `0.6` or restructure if a fade-on-resolve transition was intended.
- Three primary-action buttons (Nueva / Abrir conversación / Send) each use a distinct uppercase-mono treatment (`tracking-[0.2em]`/`[0.28em]`), diverging from the non-uppercase `font-weight: 500`/`text-sm` Primary Button pattern established on `/login`.
- `MessageBubble.tsx:17` — the "·" separator between role and timestamp uses `text-foreground/20`, noticeably dimmer than the `/40` labels it sits between.
- Fixed `w-[260px]` + `w-[220px]` sidebars have no responsive/collapse behavior — on viewports under ~900px the chat column could be squeezed to near-zero width.
- Seven distinct opacity values (`/15, /20, /30, /35, /40, /45, /50`) are used for "muted secondary text" across this single page — the same proliferation login's polish pass consolidated to a single `/55` AA-safe value.

## Questions to Consider

1. The cross-session reply race (P1) only manifests if a user switches threads during the 0.9–3.1s reply window — common enough with multiple active conversations, or edge-case enough to defer?
2. For the EN/ES mixing (P1) — should `/impeccable clarify` aim to wire `LangToggle` to genuinely localize the whole page (bigger scope), or pick one chrome language now and rescope the toggle to "AI reply language only" (smaller, faster)?
3. The double-sidebar (P1) is a pattern in `AppShell`, which wraps every authenticated page — fix it here as part of Oracle's pass (affecting Hive/Knowledge/Audit too), or treat it as an `AppShell`-level item revisited during those pages' own Phase 1 critiques?
4. Is there an existing definition for "Encauzada"/"Encauzamiento" I should pull plain-language copy from, or should `/impeccable clarify` propose new copy (e.g., "In progress" / "Needs follow-up")?
