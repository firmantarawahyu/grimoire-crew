# Decision Log

Every decision that shapes the project, newest at the bottom. To change a decision, add a new entry that supersedes the old one; do not edit history. Format: decision, why, rejected alternatives.

## 2026-11-22: Day 1 kickoff

### D-001 Full TypeScript pnpm monorepo
- Decision: a single pnpm workspace (`packages/*`, `apps/*`) in TypeScript `strict`, ES modules, Node >= 22.12.
- Why: one Zod schema and one compiler shared by the browser (live preview, ZIP export) and the server, and a natural fit for the `@kirocrew/app-sdk` React bundle.
- Rejected: a Python backend (two schema copies), Next.js (heavier than Vite for a canvas app).

### D-002 pnpm and Vitest, no Bun
- Decision: pnpm for workspaces, Vitest (`vitest run` only) for tests, fast-check for property tests. Repo scripts are zero-dependency `.mjs` run with `node --test`.
- Why: the brainstorming docs disagreed (Bun versus pnpm). pnpm matches the Kiro Crew build step (`npm install && npm run build`) and judges' machines; Vitest works in the browser-targeted core.
- Rejected: Bun (`bun test`), Jest.

### D-003 2D-only Alchemist UI
- Decision: React + `@xyflow/react` + animated SVG + CSS candlelight, with procedural WebAudio. No Three.js, WebGL, or Rust/GPUI.
- Why: about 50 to 80 MB RAM at 60 fps, readable code, and it renders inside a Kiro Crew dashboard page.
- Rejected: a 3D grimoire scene, native GPUI.

### D-004 Arch-Familiar is "Vesper"
- Decision: display name Vesper, stable ID `grimoire-arch-familiar`, skill `grimoire-architect`. One constant holds the display name.
- Why: fits the candlelight theme and is easy to say in the demo video; a stable ID keeps a rename cheap.
- Rejected: Mortimer.

### D-005 `grimoire-crew/` is the git root; brainstorming docs copied in
- Decision: the repository root is `grimoire-crew/`. The three brainstorming docs are copied unchanged into `docs/brainstorming/` as process history.
- Why: Kiro loads `.kiro/` only from the workspace root, and judges see how the idea evolved.
- Rejected: making the parent folder the repo, or leaving the docs out.

### D-006 Spec 01 includes the importer
- Decision: Spec 01 covers the schema, structural and security linters, the `crew-app` and `kiro-workspace` targets, and the importer. Round-trip is strict for GrimoireCrew output and best-effort for foreign files. Importer tasks come last.
- Why: designing the output format together with its parser keeps it parseable (fixed prompt headings, SOP topology tables), and the round-trip property is strong evidence of correctness.
- Rejected: deferring the importer to Spec 05 (risk of an unparseable output format), and a Crew-only first target.

### D-007 Studio sidecar `grimoire.studio.json`
- Decision: positions, viewport, per-node `runtimeModel`, and default ritual inputs live in a sidecar. The graph itself is rebuilt from the real compiled files. Without a sidecar, the importer runs a deterministic layered auto-layout.
- Why: the round-trip still proves the parser, and hand-edited files cannot drift from a hidden copy of the graph.
- Rejected: a full-graph sidecar (import becomes trivial and can go stale), no sidecar (users lose their layout).

### D-008 Two model fields
- Decision: `kiroModel` is optional and compiled to the agent `model` field; it is omitted when empty so Kiro uses its default. `runtimeModel` (an OpenRouter ID) is used only by the Mode A runtime and never compiled.
- Why: an unavailable Kiro model makes the first prompt fail, and OpenRouter IDs are not Kiro IDs.
- Rejected: one field with a mapping table that must track both model lists.

### D-009 SOPs as manual steering in the workspace target; cron is Crew-only
- Decision: in the `kiro-workspace` target, the SOP becomes `.kiro/steering/grimoire-<ritual>-sop.md` with `inclusion: manual` (a slash command) and is listed in the conductor's resources. A cron ritual produces a lint warning there and is skipped.
- Why: Kiro IDE has no SOP or cron concept; a manual steering file is the closest native equivalent and demos well.
- Rejected: plain `docs/sops/*.md` files.

### D-010 Webhook relic is runtime-only
- Decision: the Discord/webhook notifier runs only in the Mode A server. Compiled Kiro output lists it in the SOP relic table with an info diagnostic.
- Why: Kiro has no outbound-POST tool, and granting `shell` plus `curl` would weaken the security story.
- Rejected: compiling it to a shell `curl` rule.

### D-011 Hooks use only cloud-supported triggers
- Decision: hooks use `PreToolUse` and `Stop` only. The core tests and the submission guard run on `Stop`; the core tests run only when `packages/core` has uncommitted changes.
- Why: the user works mostly from Kiro Web cloud sessions, which do not run file-save triggers.
- Rejected: `PostFileSave` hooks.

### D-012 Dev ward scope
- Decision: `scripts/grimoire-ward-guard.mjs` blocks real `.env*` files and shell commands that dump the environment or print secret-named variables. It exits 2 only on a match and fails open (exit 0 with a warning) on its own errors. Prompt-injection detection is not in the dev ward.
- Why: on `PreToolUse` any non-zero exit blocks, so a buggy guard must never lock the agent out. Cloud secrets arrive as environment variables, not files. Curse fixtures contain injection payloads on purpose.
- Rejected: fail-closed guard, injection detection in the dev hook.

### D-013 Deny rules are the primary compiled defense
- Decision: every compiled agent carries `fs_read` deny rules for `**/.env` and `**/.env.*` (with `**/.env.example` excluded). The ward hook script is a secondary layer, emitted only for the workspace target.
- Why: permission rules are deterministic and deny wins in every scope, while hooks are pattern checks. The Crew manifest has no hooks field.
- Rejected: hook-only protection.

### D-014 Crew agents reference skills with the observed `skills` field
- Decision: for the `crew-app` target, agents list bundled skills as `"skills": ["<slug>"]`. Workspace agents use `skill://.kiro/skills/<slug>/SKILL.md`.
- Why: observed in the first-party `personal-shopper` 0.1.2 app on the local Crew install; `skill://` for app-bundled skills is undocumented. Re-verify in Spec 05.
- Rejected: guessing a `skill://` form for Crew apps.

### D-015 Public repository from day 1
- Decision: publish `firmantarawahyu/grimoire-crew` as public immediately, under the MIT License.
- Why: the submission requires a public repo, public commit timestamps show the work happened inside the hackathon window, and there is nothing to forget to flip before the deadline.
- Rejected: private until December.

### D-016 CI on every pull request
- Decision: GitHub Actions runs `pnpm typecheck`, `pnpm test`, and the submission guard on every pull request and on pushes to `main`.
- Why: cloud sessions deliver work as pull requests, and a green check makes reviewing and merging from a phone safe.
- Rejected: no CI.

### D-017 Repository is the memory; cloud-first workflow
- Decision: progress, decisions, plans, and the Kiro primer live in `docs/`, loaded every session by `.kiro/steering/project-memory.md`. Sessions end with `/session-handoff`.
- Why: Kiro Web cloud sessions clone the repo and cannot see the laptop.
- Rejected: keeping context in chat history or in `~/.kiro` on the laptop.

### D-018 Language
- Decision: conversations with the user are in Bahasa Indonesia; all repository content is in English.
- Why: the user's preference, and the judges read English.
