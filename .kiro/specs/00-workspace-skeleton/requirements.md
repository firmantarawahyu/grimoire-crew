# Requirements Document

## Introduction

Spec 00 builds the walking skeleton of the GrimoireCrew monorepo: every package exists, installs, typechecks, tests, and builds, but holds no product features yet. It front-loads the setup work and the integration risks (Kiro Crew bundle, Bun server, Tailwind v4, React version) so every later spec can start writing features immediately (decision D-024).

Out of scope: product features (graph schema, compiler, canvas, curses, LLM calls, the Vesper agent). Feature-specific libraries such as `jszip` or `shiki` are added by the spec that needs them.

## Glossary

- **Workspace**: the pnpm monorepo at the repository root.
- **Package**: one of `@grimoire-crew/core`, `@grimoire-crew/ui`, `@grimoire-crew/web`, `@grimoire-crew/server`, `@grimoire-crew/crew-app-ui`.
- **Crew_App_Root**: `apps/crew-app/`, the folder Kiro Crew installs (it holds `app.json`).
- **Crew_Bundle**: `apps/crew-app/ui/dist/index.mjs`, the committed ES module the Crew dashboard loads.
- **Host_Modules**: the bare imports the Crew dashboard provides through its import map: `react`, `react-dom`, `react/jsx-runtime`, `lucide-react`, `@tanstack/react-query`, `@kirocrew/app-sdk`, `@kirocrew/app-sdk/ui`.
- **Root_Checks**: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, and `pnpm build` at the repository root.

## Requirements

### Requirement 1: Workspace and toolchain

**User Story:** As a developer starting any later spec, I want one install and one set of root commands, so that every package works the same way locally, in CI, and in cloud sessions.

#### Acceptance Criteria

1. THE Workspace SHALL contain the Packages listed in the glossary, each with `typecheck` and `test` scripts, and a `build` script where the Package produces an artifact.
2. THE Workspace SHALL provide root scripts `build`, `typecheck`, `test`, and `test:scripts`, and each SHALL succeed on a fresh clone after `pnpm install --frozen-lockfile`.
3. THE Workspace SHALL share one strict TypeScript base configuration (`tsconfig.base.json`).
4. THE Workspace SHALL keep exactly one lockfile, `pnpm-lock.yaml`, and no `bun.lock` or `package-lock.json`.
5. THE Workspace SHALL use React 18.3 in every Package, because the Kiro Crew host provides React 18.3 through its import map.

### Requirement 2: Core package

**User Story:** As the author of Spec 01, I want `packages/core` ready with its test tooling, so that task 1 can start with real code.

#### Acceptance Criteria

1. THE core Package SHALL depend only on `zod` (v4) and `yaml` at runtime, and on `vitest`, `fast-check`, `typescript`, and `@types/node` for development.
2. THE core Package SHALL typecheck `src/` with `lib: ["ES2023"]` and `types: []`, and its tests with Node types, as two separate TypeScript projects.
3. THE core Package SHALL provide `test` (`vitest run`), `test:hook` (`vitest run --reporter=dot`), and `typecheck` scripts.
4. THE core Package SHALL export its public API from `src/index.ts` without a build step.
5. WHEN `packages/core` has uncommitted changes, THE existing Stop hook (`scripts/hook-core-tests.mjs`) SHALL run the core tests successfully.

### Requirement 3: UI package

**User Story:** As the author of Spec 02, I want a shared UI package with the theme and component tooling in place, so that the studio can be built once and reused by the web app and the Crew app.

#### Acceptance Criteria

1. THE ui Package SHALL provide React 18.3, `@xyflow/react`, `lucide-react`, Tailwind CSS v4, and the shadcn/ui building blocks (`cn` helper, `components.json`, one Button component).
2. THE ui Package SHALL define the GrimoireCrew design tokens (colors, fonts, radii) as CSS variables in one stylesheet.
3. THE ui Package SHALL define a `HostAdapter` TypeScript interface and SHALL NOT import `@kirocrew/app-sdk`.
4. THE ui Package SHALL have at least one component test that renders in jsdom.

### Requirement 4: Web app

**User Story:** As a judge opening the demo, I want the standalone web app to build and show the themed shell, so that Spec 02 starts from a running page.

#### Acceptance Criteria

1. THE web Package SHALL build with Vite into static files.
2. THE web Package SHALL render a page that uses at least one component from the ui Package.
3. WHEN the server runs locally, THE web dev server SHALL proxy `/api` requests to it.

### Requirement 5: Server

**User Story:** As the author of Spec 04, I want a Hono server that already streams Server-Sent Events on Node and on Bun, so that agent telemetry can be added without fighting the runtime.

#### Acceptance Criteria

1. THE server Package SHALL build its routes in a runtime-neutral `createApp()` function using Hono and web-standard APIs only.
2. THE server SHALL answer `GET /api/health` with HTTP 200 and `{ "status": "ok" }`.
3. THE server SHALL answer `GET /api/events` with a `text/event-stream` response that sends a `ready` event and a heartbeat comment at a fixed interval.
4. THE server Package SHALL provide a Node entry (`@hono/node-server`) and a Bun entry, and only the Bun entry SHALL reference Bun-specific options.
5. THE Bun entry SHALL raise the idle timeout above the heartbeat interval, so idle SSE streams are not closed (decision D-019).
6. THE server Package SHALL bundle each entry into one ES module file under `dist/`.
7. THE server SHALL read configuration (port) from environment variables and SHALL NOT read `.env` files in code.

### Requirement 6: Kiro Crew app

**User Story:** As a Kiro Crew user, I want GrimoireCrew installable as a Crew app from day one, so that the Crew integration is proven early.

#### Acceptance Criteria

1. THE Crew_App_Root SHALL contain an `app.json` that passes the install-time rules in `.kiro/steering/kiro-crew-schemas.md`, with `ui.entry` set to `dist/index.mjs`, one page at `/apps/grimoire-crew`, least-privilege `permissions`, and `platform.os` listing macOS, Linux, and Windows.
2. THE Crew_App_Root SHALL contain no `package.json`, so Kiro Crew installs it as a plain clone without a build step.
3. THE Crew_Bundle SHALL be committed, unminified, and its default export SHALL be the app's page component.
4. THE Crew_Bundle SHALL import only Host_Modules as bare specifiers; everything else, including the ui and core Packages, SHALL be bundled in.
5. THE crew-app-ui Package SHALL type `@kirocrew/app-sdk` with a local declaration file and SHALL NOT depend on it from npm.
6. THE Crew_Bundle SHALL inject its own styles without Tailwind's global reset, so it does not restyle the Crew dashboard.
7. THE crew-app-ui Package SHALL test that the built Crew_Bundle imports only Host_Modules.

### Requirement 7: Continuous integration

**User Story:** As a reviewer merging from a phone, I want CI to prove the whole skeleton, so that a green check means every package still works.

#### Acceptance Criteria

1. THE CI workflow SHALL run the Root_Checks and the submission guard on every pull request and every push to `main`.
2. THE CI workflow SHALL cache the pnpm store.
3. THE CI workflow SHALL fail WHEN a fresh build of the Crew_Bundle differs from the committed file.
4. THE CI workflow SHALL start the bundled server with Bun and fail unless `GET /api/health` returns HTTP 200.

### Requirement 8: Project memory

**User Story:** As the next session (local or cloud), I want the docs and steering to match the skeleton, so that I use the right commands and package boundaries.

#### Acceptance Criteria

1. THE steering file `architecture.md` SHALL list each Package, its path, and the commands to develop, test, and build it.
2. THE `README.md` SHALL describe how to install, test, build, and run the web app and the server.
3. THE decision log SHALL record the React 18.3 choice and the Crew app layout.
