import { describe, expect, it } from 'vitest';
import { migrate } from '../src/data/migrate.js';

describe('migrate', () => {
  it('is the identity for the current (v1) schema', () => {
    const blob = { version: 1, title: 'X', steps: [] };
    expect(migrate(blob)).toBe(blob);
  });

  it('passes unknown shapes through untouched (validate is the type boundary)', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate('weird')).toBe('weird');
  });
});
