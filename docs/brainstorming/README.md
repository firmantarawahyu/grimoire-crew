# Brainstorming documents (historical)

These are the original planning documents, written on 2026-11-22 before the repository existed and copied here unchanged so the history of the idea stays visible.

| File | What it is |
|---|---|
| `KIRO-HANDOFF.md` | The product concept, module scope, and locked technical decisions |
| `kiro-crew-schemas.md` | The first draft of the Kiro and Kiro Crew output schemas |
| `kiroween-2026-docs.md` | Kiroween 2026 rules, prizes, judging criteria, and deadlines |

Where these documents disagree with the repository, the repository wins:

- `.kiro/steering/kiro-crew-schemas.md` supersedes `kiro-crew-schemas.md`. It was re-verified against the official docs and lists every correction.
- The toolchain is pnpm with Vitest on Node. The Bun suggestion in `kiroween-2026-docs.md` was narrowed: Bun is only the deploy runtime of `apps/server` (decision D-019).
- Later decisions are logged in `../decisions.md`.
