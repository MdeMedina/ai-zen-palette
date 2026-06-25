---
target: login
total_score: 36
p0_count: 0
p1_count: 0
timestamp: 2026-06-15T15-53-07Z
slug: src-routes-login-tsx
---

# Critique: Login (src/routes/login.tsx) — Re-check after closing the 3 remaining gaps (#1, #3, #10)

## Design Health Score

| #         | Heuristic                                         |      Prev |       Now |      Δ | Why it moved                                                                                                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------- | --------: | --------: | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status                       |         2 |         4 |     +2 | Both cited gaps closed: the button now shows "Initializing…" + `<PassivePulse />` during `pending` (same convention as `_app.knowledge.tsx`'s "Ingesting…"), and a `role="status"` (implicit `aria-live="polite"`) region announces "Initializing session…" and "Access granted. Redirecting…" to assistive tech. |
| 2         | Match System / Real World                         |         3 |         3 |      — | Unchanged — copy still jargon-forward by design choice.                                                                                                                                                                                                                                                           |
| 3         | User Control and Freedom                          |         2 |         3 |     +1 | "Forgot access key?" mailto link gives a real, discoverable recovery path (human-mediated, appropriate for an internal "Restricted Access" gate). Not 4: still no self-service reset flow.                                                                                                                        |
| 4         | Consistency and Standards                         |         4 |         4 |      — | New elements reuse existing tokens (`text-foreground/55`, `var(--accent)` on hover, `PassivePulse`) — no new drift introduced.                                                                                                                                                                                    |
| 5         | Error Prevention                                  |         3 |         3 |      — | Unchanged.                                                                                                                                                                                                                                                                                                        |
| 6         | Recognition Rather Than Recall                    |         4 |         4 |      — | Unchanged.                                                                                                                                                                                                                                                                                                        |
| 7         | Flexibility and Efficiency                        |         3 |         3 |      — | Unchanged.                                                                                                                                                                                                                                                                                                        |
| 8         | Aesthetic and Minimalist Design                   |         4 |         4 |      — | The two new links are quiet (`text-xs`, `/55`, accent only on hover — no new at-rest signal). `PassivePulse` during `pending` replaces the CTA's glow rather than adding a second simultaneous one — "one signal" holds.                                                                                          |
| 9         | Help Users Recognize/Diagnose/Recover from Errors |         3 |         4 |     +1 | A failed login now has all three pieces on-screen: plain-language cause (`role="alert"`), and a visible, always-available "Forgot access key?" recovery affordance — "recognize, diagnose, and recover" are all covered.                                                                                          |
| 10        | Help and Documentation                            |         0 |         4 |     +4 | "Need help?" mailto link gives the "Restricted Access" gate its first support entry point — closes a heuristic that was previously absent entirely.                                                                                                                                                               |
| **Total** |                                                   | **28/40** | **36/40** | **+8** | **Good → Excellent** (crosses into the top band; cumulative from the original baseline: **17 → 36, +19**)                                                                                                                                                                                                         |

## What Changed (this round)

- **Pending state**: `<span>{pending ? "Initializing…" : "Initialize Session"}</span>` + `<PassivePulse />` replacing the static `›` arrow during submission — reuses the brand's existing "working" indicator (`PassivePulse`, previously only used in Knowledge's ingestion status).
- **Status announcements**: new `<p role="status" className="sr-only">` inside the form, switching between "Initializing session…" and "Access granted. Redirecting…" based on `pending` / `hydrated && token`.
- **Recovery + help**: new row of two quiet text links between the form and the version footer — "Forgot access key?" (`mailto:ops@pkgd.os?subject=Access%20key%20recovery`) and "Need help?" (`mailto:support@pkgd.os`).

## Caveats / What's Not Verified

- **No browser/AT session available**: the `role="status"` redirect announcement is the textbook-correct pattern, but its real-world timing relative to an immediate `navigate({ replace: true })` hasn't been verified with an actual screen reader. Worth a quick manual check if/when a dev server + AT is available.
- **`ops@pkgd.os` / `support@pkgd.os` are placeholders**: chosen to match the existing `operator@pkgd.os` domain convention since no support/recovery channel existed anywhere else in the codebase. Swap for real addresses (or routes) when the team has a definitive support channel.

## Anti-Patterns Verdict

`node .github/skills/impeccable/scripts/detect.mjs --json src/routes/login.tsx` → `[]`, exit 0 — unchanged. As in prior runs, this is expected (the relevant checks don't run against raw `.tsx`) and isn't cited as evidence of quality on its own; the manual heuristic re-read above is the actual signal for this round.

## Remaining Gaps (none P0/P1/P2)

- **[P3]** `#2`/`#3`/`#5`/`#7` sit at 3/4 — each has a small, well-defined ceiling (jargon copy, self-service recovery, real-time validation, login-specific efficiency affordances) that would require product/IA decisions beyond a design pass, not visual or accessibility defects.

This closes the Action Summary for `/login` (harden → quieter → typeset → polish, plus this targeted accessibility/IA follow-up). No outstanding P0/P1/P2 items remain.
