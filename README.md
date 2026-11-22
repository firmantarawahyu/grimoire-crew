# GrimoireCrew

A 2D dark-alchemy visual studio, red-team curse sandbox, and deterministic compiler for designing, stress-testing, and exporting real Kiro and Kiro Crew multi-agent workflows.

Built for Kiroween 2026. GrimoireCrew is a companion to Kiro and Kiro Crew, not a replacement: you draw a workflow, attack it with deterministic "curses" (prompt injection, secret leaks, rogue permissions, tool timeouts), and compile it into real `.kiro/` and Kiro Crew App files.

## Status

Day 1 (2026-11-22). The repository scaffold, Kiro configuration, and guard scripts are in place, and Spec 01 (core schema and compiler) is in progress. See [docs/progress.md](docs/progress.md).

## Prerequisites

- Node.js 22.12 or later
- pnpm (`corepack enable pnpm`)
- git

## Getting started

```bash
pnpm install
pnpm test
```

`pnpm test` runs every package's tests plus the repository script tests (`pnpm test:scripts`).

## How this repository uses Kiro

| Path | What it holds |
|---|---|
| [`.kiro/steering/`](.kiro/steering/) | Standing instructions: architecture, verified Kiro and Crew schemas, the zero-secret policy, UI and audio rules, project memory |
| [`.kiro/hooks/`](.kiro/hooks/) | A `PreToolUse` secret ward plus `Stop` hooks that run the core tests and the submission guard after every turn |
| [`.kiro/specs/`](.kiro/specs/) | Spec-driven development: requirements, design, and tasks for each feature |
| [`.kiro/settings/mcp.json`](.kiro/settings/mcp.json) | Workspace MCP servers (none yet) |
| [`docs/`](docs/) | Progress, decision log, plans, and the original brainstorming documents |

New to Kiro? Start with [docs/working-with-kiro.md](docs/working-with-kiro.md).

## License

MIT, see [LICENSE](LICENSE).
