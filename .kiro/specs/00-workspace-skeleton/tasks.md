# Implementation Plan

- [x] 1. Root configuration
  - Add `tsconfig.base.json`, add `apps/crew-app/ui` to `pnpm-workspace.yaml`, add a root `build` script, and re-include `apps/crew-app/ui/dist/` in `.gitignore`.
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 2. Core package
  - Create `packages/core` with `package.json`, `tsconfig.json` (src, `types: []`), `tsconfig.test.json` (tests, Node types), `vitest.config.ts`, `src/index.ts`, and `test/smoke.test.ts`.
  - Install `zod`, `yaml`, `vitest`, `fast-check`, `typescript`, `@types/node`.
  - Check that `node scripts/hook-core-tests.mjs` runs the suite when core has changes.
  - _Requirements: 2.1 to 2.5_

- [x] 3. UI package
  - Create `packages/ui` with the tokens stylesheet, `HostAdapter`, `cn`, shadcn `components.json` and Button, `GrimoireMark`, and a jsdom component test.
  - _Requirements: 3.1 to 3.4, 1.5_

- [x] 4. Web app
  - Create `apps/web` (Vite, React plugin, Tailwind plugin, `/api` proxy) rendering `GrimoireMark` and the server health, with a render test.
  - _Requirements: 4.1 to 4.3_

- [x] 5. Server
  - Create `apps/server` with `createApp`, the health and SSE routes, Node and Bun entries, the esbuild bundle script, and route tests.
  - Run the bundled Node entry locally and check `/api/health`.
  - _Requirements: 5.1 to 5.7_

- [x] 6. Kiro Crew app
  - Create `apps/crew-app/app.json` and the `apps/crew-app/ui` package (library build with Host_Modules external, inline styles without preflight, SDK declaration file and test stub, default-export page).
  - Build and commit `dist/index.mjs`; add the render test and the bundle-imports test.
  - _Requirements: 6.1 to 6.7_

- [x] 7. CI
  - Extend `.github/workflows/ci.yml` with the pnpm cache, `pnpm build`, the Crew bundle freshness check, and the Bun smoke job.
  - _Requirements: 7.1 to 7.4_

- [x] 8. Project memory
  - Update `architecture.md` (package table with commands), `README.md`, `docs/decisions.md` (React 18.3, Crew app layout), and `docs/progress.md`.
  - Run the Root_Checks locally, then push and confirm CI is green.
  - _Requirements: 8.1 to 8.3, 1.2_
