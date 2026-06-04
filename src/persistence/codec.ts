// Persistence layer — ConfigCodec: the single, tested boundary for the share-link format.
// A TimerConfig is validated, JSON-encoded, LZ-compressed, and URL-safe base64'd into `?t=`.
// Decoding reverses that, then runs migrate -> validate (the type boundary). See ADR-001.

// Default import (not namespace) — lz-string is CommonJS; its functions live on the default
// export under Node ESM interop. esModuleInterop makes this work in both Node and bundlers.
import LZString from 'lz-string';
import { migrate } from '../data/migrate.js';
import type { TimerConfig } from '../data/schema.js';
import { validateConfig } from '../data/validate.js';

/** Conservative cap for a safe URL across browsers/proxies. Past this, fall back to a slug. */
export const MAX_URL_LENGTH = 1800;

export class CodecError extends Error {
  override name = 'CodecError';
}

/** Validate then compress a config into a URL-safe `?t=` parameter. */
export function encodeConfig(config: TimerConfig): string {
  const json = JSON.stringify(validateConfig(config));
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompress and validate a `?t=` parameter back into a TimerConfig.
 * @throws {CodecError} when the parameter is unreadable or not a valid config.
 */
export function decodeConfig(param: string): TimerConfig {
  const json = LZString.decompressFromEncodedURIComponent(param);
  if (!json) throw new CodecError('share parameter could not be decompressed');

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new CodecError('share parameter did not contain valid JSON');
  }

  try {
    return validateConfig(migrate(raw));
  } catch (err) {
    throw new CodecError(`share parameter is not a valid config: ${(err as Error).message}`);
  }
}

export interface ShareLink {
  url: string;
  param: string;
  /** True when the full URL exceeds MAX_URL_LENGTH (caller should use a slug fallback). */
  overflow: boolean;
}

/** Build a full `?t=` share URL for `config`, flagging whether it overflows the safe length. */
export function buildShareUrl(baseUrl: string, config: TimerConfig): ShareLink {
  const param = encodeConfig(config);
  const url = `${baseUrl}?t=${param}`;
  return { url, param, overflow: url.length > MAX_URL_LENGTH };
}
