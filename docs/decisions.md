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

### D-019 Bun as the deploy runtime for `apps/server` only
- Decision: Node and pnpm stay the standard for development, tests, hooks, and CI. Only the Mode A server (`apps/server`) is deployed on Bun: install with pnpm, bundle the server into one JS file, run it with Bun (for example the `oven/bun` image). Server code stays runtime-neutral (Hono and web-standard APIs). Only one entry file uses `Bun.*`, and a Node entry exists for tests and for judges without Bun.
- Why: Bun suits a small Hono SSE server. But Kiro Crew installs apps with `npm install && npm run build`, hooks and compiled output run on `node`, and judges may not have Bun installed.
- Constraints for Spec 04: raise Bun's idle timeout and send SSE heartbeats so long LLM waits do not drop the stream; check how to stop Bun from auto-loading `.env` files in local commands; no `bun.lock` (pnpm stays the only lockfile); add a CI smoke test that starts the server under Bun.
- Refines: D-002, which still applies everywhere else.
- Update 2026-11-22 (Spec 00): Bun's `--no-env-file` flag disables automatic `.env` loading (https://bun.com/docs/runtime/environment-variables). The `start:bun` script and the CI smoke test use it. The idle timeout is 60 seconds against a 15-second heartbeat.
- Rejected: Bun for the whole repository (two runtimes to maintain, hook lock-out risk if Bun is missing, unverified in Kiro Web sandboxes), and no Bun at all.

### D-020 Step limits per agent
- Decision: `maxSteps` is 3 to 10 for the conductor (default 6) and 3 to 5 for workers (default 3).
- Why: the conductor plans and delegates, so it needs more steps than a focused worker.
- Rejected: 3 to 5 for every agent.

### D-022 How wards reach Kiro Crew App exports
- Decision: the `kiro-workspace` target exports wards as a hooks file plus the guard script. The `crew-app` target, whose manifest has no hooks field, uses three layers:
  1. Spec 01: permission deny rules in every compiled agent.
  2. Spec 05: verify on the local Crew install whether inline `hooks` in an agent JSON run under Kiro Crew, and from which working directory. If they do, compile wards into them.
  3. Later: an opt-in Vesper action, "Install wards into this workspace", that writes `.kiro/hooks/` files only after the user approves. Never installed automatically or globally.
- Kiro Crew's own protections (credential redaction, sensitive-path checks) also apply.
- Why: deny rules are deterministic and available now. Inline hooks are unverified. A silently installed global hook would affect every workspace.
- Open: the Prompt Injection Filter in Crew App exports stays undecided until the Spec 05 check (progress.md question 5b).
- Rejected: installing hooks automatically from the app's `setup.onEnable`.

### D-023 Compiled file names carry the `grimoire-` prefix and the graph slug
- Decision: agents and crons are named `grimoire-<slug>-<id>`, skills `grimoire-<skill slug>`, the SOP `grimoire-<slug>`, the Crew app `grimoire-<slug>`.
- Why: two grimoires can be exported into one repository without name clashes, and the importer recognizes GrimoireCrew files by the prefix.
- Rejected: `grimoire-<id>` (clashes), no prefix (breaks the `grimoire-*` namespacing rule and strict import).

### D-024 Spec 00: a walking skeleton on Day 1; batch setup work
- Decision: a standalone Spec 00 (`.kiro/specs/00-workspace-skeleton/`) sets up every package (`core`, `ui`, `web`, `server`, `crew-app`), installs the framework dependencies once, and extends CI (build, pnpm cache, Bun smoke test). Spec 01's old task 1 (core package scaffold) moves into Spec 00. Feature-specific libraries are still added by the spec that needs them. Specs 02 to 05 are written after Spec 01, because they depend on the core API.
- Day-1 order: Spec 01 `design.md` and `tasks.md`, then Spec 00 (spec and implementation), then push. The Spec 01 design review happens before any Spec 01 implementation, so no code depends on an unreviewed design.
- Why: integration risks (Crew App build, Bun server, Tailwind v4) surface on day 1, and every later session can work in any package immediately.
- Rejected: following the original timeline strictly, writing all five specs on day 1.

### D-025 React 18.3 in every package
- Decision: React, React DOM, and their types stay on 18.3 across the monorepo.
- Why: the Kiro Crew dashboard provides React 18.3 through its import map (observed in the first-party `personal-shopper` 0.1.2 app), and the shared UI must run on the host's single React instance.
- Rejected: React 19 (two React versions to test, and hooks from the host would break).

### D-026 Kiro Crew app layout
- Decision: `apps/crew-app/` is the Crew app root with `app.json` and no `package.json`. Its page bundle is built by the `apps/crew-app/ui` package into `ui/dist/index.mjs`, committed and unminified. Host modules stay external; everything else, including `@grimoire-crew/ui`, is bundled in. The bundle injects its own styles without Tailwind's preflight.
- Why: matches how the first-party `personal-shopper` app ships (a plain clone, no install-time build), keeps workspace-only dependencies out of Crew's install, and avoids restyling the dashboard.
- Follow-ups: Tailwind class detection is disabled (`source(none)`) so the committed bundle never feeds back into the next build; CI fails when the bundle is stale.
- Rejected: building on install (`npm install` cannot resolve `workspace:*` dependencies), publishing the bundle as a release asset (more moving parts for now).

### D-021 Merging exports into an existing workspace is not in Spec 01
- Decision: Spec 01 returns a FileMap only. Merging compiled files into a repository that already has files such as `.kiro/settings/mcp.json` belongs to the export feature (Spec 02 and Spec 04), with a preview and a safe merge.
- Why: keeps Spec 01 pure and small; the merge needs UI and user confirmation.
- Rejected: merge logic inside Spec 01.
