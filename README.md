# GrimoireCrew

A 2D dark-alchemy visual studio, red-team curse sandbox, and deterministic compiler for designing, stress-testing, and exporting real Kiro and Kiro Crew multi-agent workflows.

Built for Kiroween 2026. GrimoireCrew is a companion to Kiro and Kiro Crew, not a replacement: you draw a workflow, attack it with deterministic "curses" (prompt injection, secret leaks, rogue permissions, tool timeouts), and compile it into real `.kiro/` and Kiro Crew App files.

## Status

Day 1 (2026-11-22). The walking skeleton is in place (Spec 00): every package installs, typechecks, tests, and builds. Spec 01 (core schema and compiler) is specified and ready to implement. See [docs/progress.md](docs/progress.md).

## Prerequisites

- Node.js 22.12 or later
- pnpm (`corepack enable pnpm`)
- git
- Optional: Bun, only to run the server the way it is deployed

## Getting started

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Run the standalone demo in two terminals:

```bash
pnpm --filter @grimoire-crew/server dev   # http://localhost:8787
pnpm --filter @grimoire-crew/web dev      # http://localhost:5173, proxies /api to the server
```

Run the built server on Bun (the deploy runtime):

```bash
pnpm --filter @grimoire-crew/server build
pnpm --filter @grimoire-crew/server start:bun
```

## Repository layout

| Path | What it is |
|---|---|
| `packages/core` | Graph schema, linter, compiler, and importer for Kiro and Kiro Crew files (pure TypeScript) |
| `packages/ui` | Shared React UI and the GrimoireCrew theme |
| `apps/web` | The standalone web studio (Vite) |
| `apps/server` | The Hono server with Server-Sent Events, runnable on Node and Bun |
| `apps/crew-app` | The Kiro Crew app: `app.json` and the committed page bundle in `ui/dist/` |
| `scripts/` | Zero-dependency guard scripts used by Kiro hooks and CI |

To try the Kiro Crew app locally, install `apps/crew-app` from the Crew dashboard or with `curl -X POST http://localhost:5476/api/apps/install -H 'Content-Type: application/json' -d '{"source": "<absolute path to apps/crew-app>"}'`.

## How this repository uses Kiro

| Path | What it holds |
|---|---|
| [`.kiro/steering/`](.kiro/steering/) | Standing instructions: architecture, verified Kiro and Crew schemas, the zero-secret policy, UI and audio rules, project memory |
| [`.kiro/hooks/`](.kiro/hooks/) | A `PreToolUse` secret ward plus `Stop` hooks that run the core tests and the submission guard after every turn |
| [`.kiro/specs/`](.kiro/specs/) | Spec-driven development: requirements, design, and tasks for each feature, starting with Spec 00 (skeleton) and Spec 01 (core) |
| [`.kiro/settings/mcp.json`](.kiro/settings/mcp.json) | Workspace MCP servers (none yet) |
| [`docs/`](docs/) | Progress, decision log, plans, and the original brainstorming documents |

New to Kiro? Start with [docs/working-with-kiro.md](docs/working-with-kiro.md).

## License

MIT, see [LICENSE](LICENSE).
