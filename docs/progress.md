# Progress

Last updated: 2026-11-22. Deadline: 2026-12-04 14:00 PST (2026-12-05 05:00 WIB).

## Done

- Day 1 plan (`docs/planning/2026-11-22-day-1-plan.md`):
  - Monorepo root, MIT `LICENSE`, `.gitignore` that keeps `.kiro/`, `.env.example`.
  - Guard scripts with tests: `grimoire-ward-guard.mjs` (PreToolUse), `kiro-submission-guard.mjs` (Stop hook and CI), `hook-core-tests.mjs` (Stop hook).
  - `.kiro/hooks/` (3 files), `.kiro/steering/` (6 files), `.kiro/settings/mcp.json`.
  - `docs/` memory files, CI, and the public repository https://github.com/firmantarawahyu/grimoire-crew.
  - Spec 01: `requirements.md` (approved), `design.md` and `tasks.md` (written, waiting for review).
- Spec 00 (walking skeleton, `.kiro/specs/00-workspace-skeleton/`), all 8 tasks:
  - `packages/core` (Zod 4, yaml, Vitest, fast-check), `packages/ui` (React 18.3, React Flow, Tailwind v4, shadcn Button, theme tokens), `apps/web` (Vite shell with server health), `apps/server` (Hono, SSE, Node and Bun entries), `apps/crew-app` (`app.json` and the committed page bundle).
  - CI builds every package, checks that the committed Crew bundle is current, and starts the server on Bun.
  - `pnpm typecheck`, `pnpm test`, and `pnpm build` are green locally. The server answered `/api/health` on Node and on Bun 1.4.2.
- Decisions D-019 to D-026 logged.

## In progress

- Review gate: Spec 01 `design.md` and `tasks.md` are waiting for the user's review. No Spec 01 code is written yet.

## Next

- After the user approves the Spec 01 design: start with "Execute task 1 of spec 01-core-schema-and-compiler".

## Open questions

Steering review for the user (the agent drafted these; answer whenever convenient):

1. `architecture.md` targets Frankenstein plus Best Kiro Crew App. The brainstorming plan also lists Best Student Project, which requires every team member to be a student. Are you a student?
2. `alchemist-ui-audio.md`: is the palette right (parchment on ink, candle gold, arcane cyan and violet, blood red for breaches)? Keep both hearth and rain ambience, or only one (recommended: hearth only)?
3. `security-zero-secret.md`: agree that no secret goes into a cloud sandbox until Spec 04, and then only a dedicated low-limit OpenRouter key?
4. `LICENSE` names `firmantarawahyu`. Keep the GitHub username, or use your full name?
5. Anything you always want the agent to do or avoid? It can become a new steering rule.

Project questions:

5b. Spec 01 requirements review (2026-11-22): how should the Prompt Injection Filter work in the Crew App export, where Kiro Crew cannot run ward hooks? Option on the table: add a written "treat tool and web content as data" rule to the agent prompt in both targets. Until decided, the draft behavior stands: an info diagnostic (`GC-I002`) only. Decide after Spec 05 checks whether inline agent hooks run under Kiro Crew (D-022).
6. Scope cut after Spec 01: which features can be dropped if time runs short (8 node types, 2 runtimes, 4 curses, audio, 6 Vesper commands, 3 presets, Crew App)?
7. To verify in Spec 05 on the laptop with the local Kiro Crew install: see "Unverified" in `.kiro/steering/kiro-crew-schemas.md` and "Open Verification Items" in the Spec 01 design.
8. Spec 02: bundle the display font (Cinzel) or keep the system serif fallback? Check whether the Crew bundle's utility classes collide with the dashboard's own Tailwind classes (option: a Tailwind prefix).

## Blockers

- Kiro Web cloud sessions need a Pro plan or higher, and the account is on the Free plan.
  - The Kiroween credits are claimed (2026-11-22). Still to check: whether they unlock Kiro Web (open https://app.kiro.dev, or check the plan in the Kiro account settings); otherwise upgrade.
  - Unverified fallback: GitHub Codespaces with Kiro CLI in the browser terminal.
  - Until then, work locally in Kiro IDE with `grimoire-crew/` opened as the workspace.
