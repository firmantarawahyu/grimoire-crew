---
inclusion: always
---

# GrimoireCrew Architecture

GrimoireCrew is a 2D dark-alchemy visual studio for Kiro and Kiro Crew multi-agent workflows. Users draw a workflow graph, red-team it with deterministic "curses", and compile it into real Kiro and Kiro Crew files. It is built for Kiroween 2026 (Frankenstein category, plus the Best Kiro Crew App bonus). Submission deadline: 2026-12-04 14:00 PST (2026-12-05 05:00 WIB).

## Positioning

- Companion, not a wrapper. Kiro and Kiro Crew stay the execution OS; GrimoireCrew authors, compiles, and stress-tests workflows for them.
- Bootstrap from existing Kiro and Crew state first: reuse the user's agents, skills, and MCP servers before creating new ones.
- Every compiled artifact is namespaced `grimoire-*` so it never collides with the user's own files.

## Monorepo layout and boundaries

| Path | Package | Role | May depend on |
|---|---|---|---|
| `packages/core` | `@grimoire-crew/core` | Zod graph schema, linter, compiler, importer, curse engine | `zod`, `yaml` |
| `packages/ui` | `@grimoire-crew/ui` | Shared React UI: canvas, inspector, Vesper panel, WebAudio | core, React, `@xyflow/react`, a `HostAdapter` interface |
| `apps/web` | `@grimoire-crew/web` | Mode A standalone web demo (Vite) | ui, core |
| `apps/server` | `@grimoire-crew/server` | Mode A backend: Hono + SSE, OpenRouter runner, built-in relics | core |
| `apps/crew-app` | `@grimoire-crew/crew-app` | Mode B native Kiro Crew App (`app.json`, `dist/index.mjs`) | ui, core, `@kirocrew/app-sdk` (host-provided) |

Boundary rules:

- `packages/core` is platform-neutral. `src/` has no `node:` imports and no filesystem, network, DOM, timers, or randomness. Files go in and out as `FileMap = Record<string, string>` with POSIX paths, so the same compiler runs in the browser (live preview, ZIP export) and on the server.
- `packages/ui` never imports `@kirocrew/app-sdk`. It talks to its host through a `HostAdapter` interface, and `apps/web` and `apps/crew-app` each provide an implementation.
- `@kirocrew/app-sdk` is resolved by the Kiro Crew host import map at runtime. It is not an npm dependency: mark it external in Vite and type it with a local `.d.ts` shim inside `apps/crew-app`.
- Secrets (OpenRouter key, GitHub token, webhook URL) live only in `apps/server`. See `security-zero-secret.md`.

## Toolchain

- pnpm workspaces, Node >= 22.12, TypeScript `strict`, ES modules everywhere. No Bun.
- Tests: Vitest, always `vitest run` (watch mode hangs hooks and CI). fast-check for property-based tests.
- Schemas: Zod 4. YAML front matter: the `yaml` package.
- Root scripts: `pnpm test`, `pnpm typecheck`, `pnpm test:scripts`.
- Repo scripts in `scripts/` are zero-dependency `.mjs` files run with `node`, so hooks work before `pnpm install`.

## Naming

- Packages: `@grimoire-crew/<name>`. Compiled files and app names: `grimoire-<slug>`.
- The Arch-Familiar meta-agent has the stable ID `grimoire-arch-familiar` and the display name **Vesper**. Exactly one constant holds the display name. Never put "Vesper" in IDs, file names, or test assertions about IDs.

## Working rules

- Spec before code. Every feature lands through `.kiro/specs/NN-<name>/` (requirements, then design, then tasks). Order: 01 core schema and compiler, 02 studio UI, 03 curse engine, 04 server runtime and Arch-Familiar, 05 Kiro Crew App and verification.
- Determinism. Compiler output is byte-identical for the same graph: documented key order, sorted arrays where the spec says so, LF line endings, 2-space JSON, trailing newline, no timestamps or random IDs.
- Cross-platform. The user works on Windows locally and in Linux cloud sandboxes. Path regexes accept both `/` and `\`. Package scripts avoid shell-specific syntax.
- In a fresh sandbox, run `pnpm install --frozen-lockfile` before anything else.
- Stop hooks run the core tests and the submission guard after every turn. A red report during the TDD red phase is expected. Do not loop on a red hook more than once; if it stays red, report to the user.
- Commit with Conventional Commits, for example `feat(core): add graph schema` or `test(core): add round-trip property`.
