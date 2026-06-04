# Phase 0 — Foundation & Tooling

> **Goal:** a clean, typed, testable project skeleton. No product features yet — just the
> rails everything else rides on.

- **Depends on:** nothing.
- **Unblocks:** Phase 1 (engine).
- **Confirm before starting:** none.
- **Related:** [Architecture · repo shape](../02-ARCHITECTURE.md#repository--package-shape) · [Conventions](../05-CONVENTIONS.md)

---

## Objectives

1. Initialize a TypeScript project with strict settings.
2. Wire a test runner, linter, and formatter behind one `npm run check`.
3. Lay down the empty folder skeleton with stubs so imports resolve.
4. Prove the toolchain with one trivial passing test.

## Task breakdown

- [ ] `npm init`; set `"type": "module"`, `"name"` to the product slug (see [naming](../05-CONVENTIONS.md#product-naming)).
- [ ] Add **TypeScript** with `strict: true`, `noUncheckedIndexedAccess: true`, `target` ES2022, `moduleResolution` bundler.
- [ ] Add **Vitest** + `@vitest/coverage-v8`.
- [ ] Add **ESLint + Prettier** *or* **Biome** (pick one; Biome is lower-config). Enforce no-`any`.
- [ ] Add scripts:
  - `"typecheck": "tsc --noEmit"`
  - `"test": "vitest run"`
  - `"lint": "<biome check .  | eslint .>"`
  - `"check": "npm run lint && npm run typecheck && npm run test"`
- [ ] Create the folder skeleton (empty/stub files) per Architecture:
  ```
  src/engine/{TimerEngine,clock,events,format}.ts
  src/data/{schema,validate,migrate,presets}.ts
  src/persistence/{codec,repository}.ts
  src/view/.gitkeep
  src/index.ts
  tests/smoke.test.ts
  ```
- [ ] Stub each module with a typed placeholder export so `tsc` passes (e.g. `export const TODO = true;`).
- [ ] `tests/smoke.test.ts`: assert `1 + 1 === 2` (replaced in Phase 1).
- [ ] Add `.gitignore` (`node_modules`, `dist`, coverage, editor dirs).
- [ ] Add `.editorconfig` for consistent whitespace.
- [ ] (Optional) GitHub Actions workflow running `npm run check` on PRs.

## Deliverables

| File | Purpose |
|------|---------|
| `package.json` | scripts + deps |
| `tsconfig.json` | strict TS config |
| `biome.json` / `.eslintrc` + `.prettierrc` | lint/format |
| `vitest.config.ts` | test + coverage config |
| `src/**` stubs | skeleton so Phase 1 has homes for code |
| `tests/smoke.test.ts` | proves the runner works |

## Implementation notes

- Keep dependencies minimal. Engine/data/persistence must stay framework-free; do **not**
  add a UI framework here — that decision (A1) belongs to Phase 2/5.
- Pre-pick the two tiny runtime deps Phase 4 will need so the lockfile is stable, but don't
  use them yet: an LZ string compressor (e.g. `lz-string`) and an id generator (e.g. `nanoid`).
- Configure coverage thresholds loosely now; tighten for the engine in Phase 1.

## Exit criteria

- `npm run check` passes (lint + typecheck + one green test).
- Fresh `git clone && npm i && npm run check` works on another machine.

## Demo

Run `npm run check` in front of the stakeholder; show it green.

## Handoff to Phase 1

Skeleton paths exist and import cleanly. Phase 1 fills `engine/` and `data/` and replaces
`smoke.test.ts`.
