---
inclusion: always
---

# Project Memory

This repository is the only memory shared between sessions. Kiro Web cloud sessions start from a fresh clone and cannot see the user's laptop, so anything not committed is lost.

Current status:
#[[file:docs/progress.md]]

Decision log:
#[[file:docs/decisions.md]]

## Rules

- Read the status and the decision log above before starting work.
- Never contradict a logged decision without asking the user first. When a decision changes, add a new entry that supersedes the old one instead of editing history.
- Log every new decision in `docs/decisions.md` in a few lines: date, decision, why, and rejected alternatives.
- Keep `docs/progress.md` current: Done, In progress, Next, Open questions, Blockers.
- Talk to the user in Bahasa Indonesia. Write all repository content in English. The user is new to Kiro, so explain Kiro-specific steps in plain words.
- End every working session with `/session-handoff`.
