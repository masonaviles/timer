import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '../src/data/schema.js';

// Phase 0 smoke test — proves the toolchain (TS + Vitest + module resolution) works.
// Phase 1 replaces this with real engine/data tests.
describe('toolchain smoke', () => {
  it('runs arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('imports across the src boundary', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });
});
