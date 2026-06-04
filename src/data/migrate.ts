// Data layer — schema version migrations. Run BEFORE validate on every decode
// (Phase 4 wires this into ConfigCodec). v1 is the only version, so this is the
// identity today; future versions add a switch on the raw `version` field.
// See docs/02-ARCHITECTURE.md (Schema versioning + Migration).

/**
 * Bring a raw decoded blob up to the current schema version. Returns `unknown`
 * because the shape is not yet trusted — `validateConfig` is the type boundary
 * that runs next.
 */
export function migrate(raw: unknown): unknown {
  // No migrations yet. As SCHEMA_VERSION advances, branch on (raw.version) here
  // and transform v(n) -> v(n+1) step by step.
  return raw;
}
