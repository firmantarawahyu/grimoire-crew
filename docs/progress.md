# Progress

Last updated: 2026-11-22. Deadline: 2026-12-04 14:00 PST (2026-12-05 05:00 WIB).

## Done

- Day 1, tasks 1 to 6 of `docs/planning/2026-11-22-day-1-plan.md`:
  - Monorepo root: MIT `LICENSE`, `.gitignore` (keeps `.kiro/`), pnpm workspace, `.env.example`.
  - `scripts/grimoire-ward-guard.mjs`: blocks `.env*` files and environment dumps (PreToolUse).
  - `scripts/kiro-submission-guard.mjs`: checks the Kiroween submission rules (Stop hook and CI).
  - `scripts/hook-core-tests.mjs`: runs the `packages/core` tests after each turn when core changed (Stop hook).
  - `.kiro/hooks/` (3 files), `.kiro/steering/` (6 files), `.kiro/settings/mcp.json`.
  - `docs/` memory files and CI.
  - `pnpm test:scripts` is green.

- Day 1 task 7: published as the public repository https://github.com/firmantarawahyu/grimoire-crew.

## In progress

- Day 1 task 8: `.kiro/specs/01-core-schema-and-compiler/requirements.md` is a draft waiting for the user's review (review gate). Not approved yet.

## Next

- After the user approves the requirements: Day 1 task 9 (`design.md`, second review gate), then task 10 (`tasks.md`).
- Then start implementation with: "Execute task 1 of spec 01-core-schema-and-compiler".

## Open questions

Steering review for the user (the agent drafted these; answer whenever convenient):

1. `architecture.md` targets Frankenstein plus Best Kiro Crew App. The brainstorming plan also lists Best Student Project, which requires every team member to be a student. Are you a student?
2. `alchemist-ui-audio.md`: is the palette right (parchment on ink, candle gold, arcane cyan and violet, blood red for breaches)? Keep both hearth and rain ambience, or only one?
3. `security-zero-secret.md`: agree that no secret goes into a cloud sandbox until Spec 04, and then only a dedicated low-limit OpenRouter key?
4. `LICENSE` names `firmantarawahyu`. Keep the GitHub username, or use your full name?
5. Anything you always want the agent to do or avoid? It can become a new steering rule.

Project questions:

6. Scope cut after Spec 01: which features can be dropped if time runs short (8 node types, 2 runtimes, 4 curses, audio, 6 Vesper commands, 3 presets, Crew App)?
7. To verify in Spec 05 on the laptop with the local Kiro Crew install: see "Unverified" in `.kiro/steering/kiro-crew-schemas.md`.

## Blockers

- Kiro Web cloud sessions need a Pro plan or higher, and the account is on the Free plan.
  - Claim the 4,000 Kiroween credits on Devpost (Resources tab) before 2026-12-01 and check whether they include Kiro Web access; otherwise upgrade.
  - Unverified fallback: GitHub Codespaces with Kiro CLI in the browser terminal.
  - Until then, work locally in Kiro IDE with `grimoire-crew/` opened as the workspace.
