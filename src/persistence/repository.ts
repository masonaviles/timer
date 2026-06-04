// Persistence layer — ConfigRepository interface + LocalStorageRepository, plus the
// working-draft autosave. The interface keeps callers backend-agnostic: a future
// ApiRepository drops in unchanged (Repository pattern, protects "no backend now"; ADR-001).

import { nanoid } from 'nanoid';
import type { TimerConfig } from '../data/schema.js';
import { validateConfig } from '../data/validate.js';

export interface SavedTimerMeta {
  id: string;
  name: string;
  /** Epoch ms of last save. */
  updatedAt: number;
}

export interface ConfigRepository {
  list(): Promise<SavedTimerMeta[]>;
  load(id: string): Promise<TimerConfig | null>;
  /** Persist `config` under `name`; returns the new id. */
  save(name: string, config: TimerConfig): Promise<string>;
  remove(id: string): Promise<void>;
}

const NS = 'cuestack';
const INDEX_KEY = `${NS}:index`;
const SAVE_KEY = (id: string) => `${NS}:save:${id}`;
const DRAFT_KEY = `${NS}:draft`;

/** Best-effort access to a Storage; null when unavailable (SSR, blocked cookies). */
function getStorage(explicit?: Storage): Storage | null {
  if (explicit) return explicit;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function readJSON<T>(storage: Storage | null, key: string): T | null {
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface LocalStorageRepositoryOptions {
  storage?: Storage;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

export class LocalStorageRepository implements ConfigRepository {
  private readonly storage: Storage | null;
  private readonly now: () => number;

  constructor(options: LocalStorageRepositoryOptions = {}) {
    this.storage = getStorage(options.storage);
    this.now = options.now ?? (() => Date.now());
  }

  private index(): SavedTimerMeta[] {
    return readJSON<SavedTimerMeta[]>(this.storage, INDEX_KEY) ?? [];
  }

  private writeIndex(index: SavedTimerMeta[]): void {
    this.storage?.setItem(INDEX_KEY, JSON.stringify(index));
  }

  list(): Promise<SavedTimerMeta[]> {
    return Promise.resolve([...this.index()].sort((a, b) => b.updatedAt - a.updatedAt));
  }

  load(id: string): Promise<TimerConfig | null> {
    const raw = readJSON<unknown>(this.storage, SAVE_KEY(id));
    if (raw === null) return Promise.resolve(null);
    try {
      return Promise.resolve(validateConfig(raw));
    } catch {
      return Promise.resolve(null);
    }
  }

  save(name: string, config: TimerConfig): Promise<string> {
    const id = nanoid(8);
    const valid = validateConfig(config);
    this.storage?.setItem(SAVE_KEY(id), JSON.stringify(valid));
    const index = this.index();
    index.push({ id, name, updatedAt: this.now() });
    this.writeIndex(index);
    return Promise.resolve(id);
  }

  remove(id: string): Promise<void> {
    this.storage?.removeItem(SAVE_KEY(id));
    this.writeIndex(this.index().filter((m) => m.id !== id));
    return Promise.resolve();
  }
}

// ---- working-draft autosave (separate from named saves) ----

export function saveDraft(config: TimerConfig, storage?: Storage): void {
  getStorage(storage)?.setItem(DRAFT_KEY, JSON.stringify(config));
}

export function loadDraft(storage?: Storage): TimerConfig | null {
  const raw = readJSON<unknown>(getStorage(storage), DRAFT_KEY);
  if (raw === null) return null;
  try {
    return validateConfig(raw);
  } catch {
    return null;
  }
}

export function clearDraft(storage?: Storage): void {
  getStorage(storage)?.removeItem(DRAFT_KEY);
}
