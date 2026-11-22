# Implementation Plan

Prerequisite: Spec 00 (workspace skeleton) is complete, so `packages/core` exists with `zod`, `yaml`, `vitest`, `fast-check`, and the `test`, `test:hook`, and `typecheck` scripts.

Every task ends with `pnpm --filter @grimoire-crew/core test` and `pnpm --filter @grimoire-crew/core typecheck` green, and new public functions exported from `src/index.ts`. Property-based tests are required, not optional.

- [ ] 1. Diagnostics catalog and the import boundary test
  - Create `src/diagnostics/catalog.ts` with every code from the design's catalog table, its severity, and its meaning, plus the `Diagnostic` and `Fix` types.
  - Create `src/diagnostics/sort.ts` with the canonical order (severity, code, nodeId, path).
  - Test: every catalog code matches `^GC-[ESWI]\d{3}$` and its letter matches its severity; sorting is stable and canonical.
  - Create `test/boundary.test.ts`: fail when a file under `src/` imports anything other than `zod`, `yaml`, or a relative path.
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 17.1, 17.3_

- [ ] 2. Graph and sidecar schemas
  - [ ] 2.1 Create `src/schema/ids.ts` (slug, id, host, and skill-slug rules; name builders `appName`, `agentName`, `skillName`, `sopName`, `cronName`, `wardsFileName`, `sidecarPath`).
    - _Requirements: 1.2, 10.1, 11.1_
  - [ ] 2.2 Create `src/schema/graph.ts`: the eight node schemas, the graph schema with string normalization (CRLF to LF, trim), the `## ` heading rule, defaults, `parseGraph`, and `normalize`.
    - Test each node type with valid, default-filling, and invalid input; `parseGraph` returns one `GC-E000` per violation with its JSON path and never throws.
    - _Requirements: 1.1, 1.3 to 1.15_
  - [ ] 2.3 Create `src/schema/studio.ts` with the Studio_Sidecar schema.
    - _Requirements: 2.1_
  - [ ] 2.4 Create `test/arbitraries.ts` with `arbGraph`, `arbStudio`, `arbText`, and `arbFakeSecret` (assembled at runtime from parts).
    - Property: every `arbGraph` value passes `parseGraph`.
    - _Requirements: 1.1, 2.1_

- [ ] 3. Target contract schemas
  - Create `src/contracts/` schemas for `app.json` (unknown keys kept), agent JSON, hooks v1, `mcp.json`, `SKILL.md` front matter, and steering front matter, following `.kiro/steering/kiro-crew-schemas.md`.
  - Copy the official doc examples verbatim into `test/fixtures/docs/`, each with a comment naming its source URL, and test that they validate. Add one negative case per schema.
  - _Requirements: 13.1, 13.2, 13.4_

- [ ] 4. Structural linter
  - Create `src/lint/edge-matrix.ts` and `src/lint/structural.ts` covering `GC-E001` to `GC-E012`, `GC-W001`, `GC-W002`, `GC-W004`, and `GC-W007`, with the fixes listed in the design.
  - Test one minimal failing graph per code, and that a correct graph reports none of them.
  - _Requirements: 4.1 to 4.17, 3.4_

- [ ] 5. Security linter, target diagnostics, and `lint()`
  - Create `src/lint/secret-patterns.ts` (`findSecret`), `src/lint/security.ts` (`GC-S001` to `GC-S003`, `GC-W005`, `GC-W006`), `src/lint/target.ts` (`GC-W003`, `GC-I001` to `GC-I003`), and `src/lint/index.ts` (`lint(graph, { target })`, sorted output).
  - Test: each pattern matches a runtime-built fake and misses a near-miss; messages never contain the secret; target diagnostics appear only for their target.
  - _Requirements: 5.1 to 5.6, 3.6, 6.5, 10.7, 10.8, 11.7, 11.8_

- [ ] 6. Deterministic writers
  - Create `src/write/json.ts` (ordered keys, 2 spaces, LF, trailing newline), `src/write/front-matter.ts` (write and read with `yaml`), `src/write/table.ts` (cell codec, table writer and reader), and `src/write/file-map.ts` (sorted FileMap, path checks).
  - Property 7: the cell codec round-trips any string and never emits an unescaped `|` or a line break.
  - Test: front matter round-trips descriptions with colons, quotes, and line breaks.
  - _Requirements: 7.3, 7.4, 7.5, 9.6_

- [ ] 7. Skill templates and presets
  - Create `src/presets/skill-templates.ts` and the three preset graphs from the design, plus `src/presets/index.ts`.
  - Test: each preset passes `parseGraph`; `lint` reports no blocking diagnostic for either target; the three presets together use all eight node types.
  - _Requirements: 14.1 to 14.4_

- [ ] 8. Compile context, prompts, agents, and skills
  - Create `src/compile/context.ts` (neighbours, handoff order, effective hosts and URL patterns), `src/compile/prompts.ts` (worker and conductor templates), `src/compile/agents.ts` (agent JSON for both targets), and `src/compile/skills.ts`.
  - Test: the prompt heading order, `model` omitted without `kiroModel`, the baseline deny rule on every agent, the subagent tools and rule, web_fetch allow and allowlist-gate deny rules, secret-leak deny rules, and the canonical `tools` order.
  - _Requirements: 8.1 to 8.12, 9.4_

- [ ] 9. SOP emitter and ward guard template
  - Create `src/compile/sop.ts` (the SOP layout from the design) and `src/compile/ward-guard.ts` (`renderWardGuard()`).
  - Test the SOP sections, row order, and escaping.
  - Test the ward guard as a child process: with `--secret` it passes every Day-1 case from `scripts/test/grimoire-ward-guard.test.mjs`; `--injection` blocks each marker and allows normal text; `--allow-host` blocks other hosts and allows listed ones (exact and `*.` suffix); with no flags it allows everything; invalid JSON fails open without echoing input.
  - _Requirements: 9.1 to 9.6, 12.1 to 12.7_

- [ ] 10. `compile()` and the Crew App target
  - Create `src/compile/index.ts` (the seven-step pipeline from the design) and `src/compile/targets/crew-app.ts` (`app.json`, agents, skills, SOP, crons, MCP servers, permissions, platform, sidecar).
  - Golden snapshots for the three presets under `test/__golden__/<preset>/crew-app/`.
  - Test: a blocking diagnostic gives `ok: false` and no files; the sidecar slug mismatch gives `GC-W008`; studio fields never appear in agent or manifest files.
  - _Requirements: 6.1 to 6.6, 10.1 to 10.8, 2.2, 2.3, 2.4, 14.5_

- [ ] 11. Kiro workspace target and compile properties
  - Create `src/compile/targets/kiro-workspace.ts` (agents, skills, SOP steering with `inclusion: manual`, conductor resources, `mcp.json`, ward hooks file, ward guard script, sidecar).
  - Golden snapshots for the three presets under `test/__golden__/<preset>/kiro-workspace/`.
  - Properties for both targets: P1 (determinism and order independence), P2 (contracts and paths), P3 (no secrets, placeholders only), P5 (blocking means no files), P6 (injected secret fails compile).
  - _Requirements: 11.1 to 11.8, 7.1, 7.2, 5.7, 13.3_

- [ ] 12. Parsers
  - Add parsers next to each writer: prompts (`src/compile/prompts.ts`), agent JSON, `SKILL.md`, SOP tables, MCP config (`app.json` `mcpServers` and `mcp.json`), and the sidecar.
  - Test: each parser reads its emitter's output back, and reports `GC-E101`, `GC-E102`, or `GC-I005` on malformed input.
  - _Requirements: 15.5, 16.6_

- [ ] 13. Import pipeline
  - Create `src/import/paths.ts`, `detect.ts`, `assemble.ts`, `inventory.ts`, `layout.ts`, and `index.ts` (`importFiles`), following the eight import steps in the design.
  - Test: env files are ignored with `GC-I006`; a foreign file with a fake secret is dropped with `GC-S004`; foreign agents (JSON and Markdown), skills, MCP servers (key names only), hooks, and steering appear in `inventory`; foreign files appear in `passthrough` with `GC-I004`; `GC-E100`, `GC-E103`, and `GC-E104` cases; the auto-layout is deterministic.
  - _Requirements: 15.1, 15.2, 15.4 to 15.7, 16.1 to 16.6, 2.5_

- [ ] 14. Round-trip and public API
  - Property 4 for both targets, with and without a sidecar. Property 8: `compile` and `importFiles` never throw for arbitrary input.
  - Finish `src/index.ts` with every export listed in Requirement 17.4, and add an API test that imports only from the package entry.
  - _Requirements: 15.3, 15.4, 17.4, 6.6_

- [ ] 15. Dogfood the ward guard template in this repository
  - Add `scripts/generate-ward-guard.mjs`, which writes `renderWardGuard()` output to `scripts/grimoire-ward-guard.mjs`.
  - Add `--secret` to the three commands in `.kiro/hooks/env-secret-ward.json`, and update `scripts/test/grimoire-ward-guard.test.mjs` to pass `--secret`.
  - Add a test that fails when the committed `scripts/grimoire-ward-guard.mjs` differs from the generated output.
  - Run `pnpm test`; all Day-1 ward cases still pass.
  - _Requirements: 12.1, 12.3_
