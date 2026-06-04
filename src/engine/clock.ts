// Engine layer — injectable wall-clock source. Filled in Phase 1.
// The engine reads time ONLY through this, so tests can drive it deterministically.
// See docs/02-ARCHITECTURE.md (Wall-clock correctness) and docs/phases/phase-1-engine.md.

export const __clockStub = true;
