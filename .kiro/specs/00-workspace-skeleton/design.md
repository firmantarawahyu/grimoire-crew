# Design Document

## Overview

Five packages, one lockfile, one set of root commands. Each package gets the smallest real slice that proves its toolchain: a smoke test, a themed component, a page, an SSE stream, and an installable Crew bundle.

```text
grimoire-crew/
├── tsconfig.base.json
├── packages/
│   ├── core/            @grimoire-crew/core        pure TS, Vitest, fast-check
│   └── ui/              @grimoire-crew/ui          React 18.3, Tailwind v4, shadcn, React Flow
├── apps/
│   ├── web/             @grimoire-crew/web         Vite app (Mode A frontend)
│   ├── server/          @grimoire-crew/server      Hono + SSE, Node and Bun entries
│   └── crew-app/        Crew_App_Root (no package.json)
│       ├── app.json
│       └── ui/          @grimoire-crew/crew-app-ui Vite library build -> dist/index.mjs (committed)
```

`pnpm-workspace.yaml` lists `packages/*`, `apps/*`, and `apps/crew-app/ui`. `apps/crew-app` itself has no `package.json`, so pnpm skips it.

## Toolchain versions

Pin by caret within these majors. They match the Kiro Crew first-party app `personal-shopper` 0.1.2 where they overlap, observed locally on 2026-11-22.

| Tool | Major |
|---|---|
| TypeScript | 5.9 |
| Vite | 8 |
| Vitest | 4 |
| `@vitejs/plugin-react` | 6 |
| React, React DOM, `@types/react` | 18.3 |
| `lucide-react` | 1 (the host's major) |
| Tailwind CSS, `@tailwindcss/vite` | 4 |
| `@xyflow/react` | 12 |
| Zod | 4 |
| Hono | 4 |
| esbuild | latest |

## Shared TypeScript configuration

`tsconfig.base.json`: `strict`, `target`/`lib` ES2023, `module: ESNext`, `moduleResolution: Bundler`, `verbatimModuleSyntax`, `isolatedModules`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `skipLibCheck`, `noEmit`. Packages extend it and add `jsx`, `lib` (DOM), and `types` as needed.

Internal packages export TypeScript source (`"exports": { ".": "./src/index.ts" }`), so there is no build step between packages. Apps compile them through Vite or esbuild.

## Packages

### core

- `tsconfig.json` covers `src/` only, with `lib: ["ES2023"]` and `types: []`. `tsconfig.test.json` covers `test/` with `types: ["node"]`. `typecheck` runs both.
- `src/index.ts` exports `CORE_PACKAGE_NAME`. `test/smoke.test.ts` imports it and checks a Zod parse and a fast-check property, proving both libraries load.

### ui

- `src/styles.css`: `@import "tailwindcss/theme"`, `@import "tailwindcss/utilities"`, and an `@theme` block with the GrimoireCrew tokens. The web app adds Tailwind's preflight itself; the Crew bundle does not (Requirement 6.6).
- `src/host.ts`: the `HostAdapter` interface (`kind: 'web' | 'crew'`, `notify(message)`, `openChat?(options)`), no SDK import.
- `src/lib/cn.ts` (`clsx` + `tailwind-merge`), `src/components/ui/button.tsx` (shadcn Button), `components.json` pointing at these paths.
- `src/components/grimoire-mark.tsx`: a small themed brand component with a candle icon from `lucide-react`. Used by both apps.
- Test with Vitest in jsdom and Testing Library: the mark and the button render.

Design tokens (CSS variables, first draft, reviewed in Spec 02):

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#0e0b12` | page background |
| `--color-parchment` | `#efe3c8` | main text |
| `--color-candle` | `#f2b84b` | idle state, primary actions |
| `--color-arcane` | `#5ee0d6` | active conductor |
| `--color-violet` | `#9d7bff` | accents |
| `--color-blood` | `#d64545` | curse breach |
| `--font-display` | `"Cinzel", Georgia, serif` | headings |
| `--font-body` | `"Inter", system-ui, sans-serif` | body |

Fonts load from the system stack until Spec 02 decides on bundled font files.

### web

- Vite + `@vitejs/plugin-react` + `@tailwindcss/vite`. `src/main.tsx` renders `App`, which shows the `GrimoireMark` and the Day-1 status, and calls `/api/health` to show whether the server is reachable.
- `src/index.css` imports Tailwind's preflight and `@grimoire-crew/ui/styles.css`.
- `vite.config.ts` proxies `/api` to `http://localhost:8787` in dev.
- Test: `App` renders the mark (jsdom, `fetch` stubbed).

### server

- `src/app.ts`: `createApp({ heartbeatMs })` returns a Hono app with `GET /api/health` and `GET /api/events` (`streamSSE`: one `ready` event, then a `: heartbeat` comment every `heartbeatMs`, default 15 000 ms).
- `src/node.ts`: `serve({ fetch: app.fetch, port })` from `@hono/node-server`.
- `src/bun.ts`: `export default { port, fetch: app.fetch, idleTimeout: 60 }`. Bun reads this default export; the file needs no Bun types.
- Port: `Number(process.env.PORT ?? 8787)`, read in the entry files only.
- Build: esbuild bundles `src/node.ts` to `dist/server.node.mjs` and `src/bun.ts` to `dist/server.bun.mjs` (`--platform=node --format=esm`).
- Tests (Vitest, Node): health returns `{ status: 'ok' }`; events returns `text/event-stream`, first chunk contains `event: ready`, and a heartbeat arrives with a short `heartbeatMs`.

### crew-app

`apps/crew-app/app.json`:

```json
{
  "name": "grimoire-crew",
  "version": "0.1.0",
  "displayName": "GrimoireCrew",
  "description": "Design, red-team, and compile Kiro and Kiro Crew multi-agent workflows in a 2D alchemy studio.",
  "author": "firmantarawahyu",
  "license": "MIT",
  "tags": ["workflows", "agents", "security", "kiroween"],
  "agents": [],
  "skills": [],
  "ui": {
    "entry": "dist/index.mjs",
    "pages": [{ "route": "/apps/grimoire-crew", "label": "GrimoireCrew", "icon": "FlaskConical" }]
  },
  "permissions": { "api": [], "events": [], "network": false },
  "platform": { "os": ["macos", "linux", "windows"] }
}
```

`ui.entry` is relative to the app's `ui/` folder, as in `personal-shopper` (its manifest says `dist/index.mjs` and the file lives at `ui/dist/index.mjs`). The Vesper agent and its skill are added in Specs 04 and 05.

`apps/crew-app/ui` (`@grimoire-crew/crew-app-ui`):

- `vite.config.ts`: library build, entry `src/index.tsx`, format `es`, file `index.mjs`, `minify: false`, `emptyOutDir: true`, `rollupOptions.external` = Host_Modules. Tailwind via `@tailwindcss/vite`.
- `src/index.tsx`: the default export is `GrimoireCrewPage`. It injects the bundled stylesheet once (`import css from './styles.css?inline'`, then a `<style data-grimoire-crew>` tag) and renders the `GrimoireMark` and a short Day-1 status.
- `src/styles.css`: imports `@grimoire-crew/ui/styles.css` only (theme and utilities, no preflight), scoped under a `.grimoire-crew` root class.
- `src/kirocrew-sdk.d.ts`: our own minimal declarations for the hooks we will use (`useAppApi`, `useChatLauncher`, `useNotify`, `useTheme`). `vitest.config.ts` aliases `@kirocrew/app-sdk` to `test/stubs/app-sdk.ts`.
- Tests: the page renders in jsdom with the stub; `test/bundle.test.ts` reads `dist/index.mjs` and fails when it contains an `import ... from "<x>"` where `x` is not a Host_Module.
- `.gitignore` re-includes `apps/crew-app/ui/dist/` after the global `dist/` rule.

Known risk for Spec 02: utility class names may collide with the dashboard's own Tailwind classes. Options to evaluate there: a Tailwind prefix, or stricter scoping.

## CI

```text
job test (ubuntu, Node from .nvmrc, pnpm cache):
  pnpm install --frozen-lockfile
  pnpm typecheck
  pnpm test
  pnpm build
  git diff --exit-code -- apps/crew-app/ui/dist      # committed Crew bundle is current
  node scripts/kiro-submission-guard.mjs
job bun-smoke (needs: test):
  pnpm install --frozen-lockfile, pnpm --filter @grimoire-crew/server build
  oven-sh/setup-bun, start bun apps/server/dist/server.bun.mjs in the background
  poll http://localhost:8787/api/health until HTTP 200 (max 20 s)
```

## Error handling and security

- No package reads `.env` files. The server reads `process.env.PORT` only.
- The Crew bundle never touches secrets; `permissions.network` is `false` until a later spec needs it.

## Testing strategy

Each package's `test` script runs Vitest once (`vitest run`). Root `pnpm test` runs all of them, then the repository script tests. `pnpm build` builds web, server, and the Crew bundle. CI adds the bundle freshness check and the Bun smoke test.
