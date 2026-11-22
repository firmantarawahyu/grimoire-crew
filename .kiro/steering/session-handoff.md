---
inclusion: manual
---

# Session Handoff

Run these steps when the user types `/session-handoff`, or when a working session is about to end.

1. Run `pnpm test`. If anything is red, say so and record it under Blockers; never hide a failure.
2. Update `docs/progress.md`:
   - Done: what this session finished, with spec task IDs (for example "Spec 01 task 3").
   - In progress: anything half-done and exactly where it stopped.
   - Next: the single next step, written as a prompt the user can paste into a new session.
   - Open questions and Blockers.
3. Append new decisions to `docs/decisions.md` (date, decision, why, rejected alternatives).
4. Commit with a Conventional Commit message. On a local machine, ask the user before pushing.
5. In a Kiro Web cloud session, open or update the pull request with a summary: spec task IDs completed, the test result, and anything the user must review.
6. Tell the user in Bahasa Indonesia, in a few lines, what was done and what comes next.
