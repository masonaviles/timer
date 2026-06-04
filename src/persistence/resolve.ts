// Persistence layer — resolve the config a player should boot with.
// Priority: ?t= (share link) -> ?id= (local slug) -> draft -> fallback (sample).
// A malformed link recovers to the fallback with a non-blocking notice (never throws).

import type { TimerConfig } from '../data/schema.js';
import { decodeConfig } from './codec.js';
import { type ConfigRepository, loadDraft } from './repository.js';

export type ConfigSource = 'link' | 'id' | 'draft' | 'fallback';

export interface ResolvedConfig {
  config: TimerConfig;
  source: ConfigSource;
  /** Present only when recovery happened; surface it as a non-blocking notice. */
  notice?: string;
}

export interface ResolveOptions {
  /** The location.search string (defaults to the current document's). */
  search?: string;
  repository?: ConfigRepository;
  /** Produces the default config when nothing else resolves (e.g. createSampleTimer). */
  fallback: () => TimerConfig;
  storage?: Storage;
}

export async function resolvePlayerConfig(options: ResolveOptions): Promise<ResolvedConfig> {
  const search = options.search ?? (typeof location !== 'undefined' ? location.search : '');
  const params = new URLSearchParams(search);

  const t = params.get('t');
  if (t) {
    try {
      return { config: decodeConfig(t), source: 'link' };
    } catch {
      return {
        config: options.fallback(),
        source: 'fallback',
        notice: 'That share link could not be read — loaded a sample instead.',
      };
    }
  }

  const id = params.get('id');
  if (id && options.repository) {
    const config = await options.repository.load(id);
    if (config) return { config, source: 'id' };
    return {
      config: options.fallback(),
      source: 'fallback',
      notice: 'That saved timer was not found on this device.',
    };
  }

  const draft = loadDraft(options.storage);
  if (draft) return { config: draft, source: 'draft' };

  return { config: options.fallback(), source: 'fallback' };
}
