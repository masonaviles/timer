// Public surface of the persistence layer (maps to the "./persistence" package export).
export {
  CodecError,
  MAX_URL_LENGTH,
  type ShareLink,
  buildShareUrl,
  decodeConfig,
  encodeConfig,
} from './codec.js';
export {
  type ConfigRepository,
  LocalStorageRepository,
  type LocalStorageRepositoryOptions,
  type SavedTimerMeta,
  clearDraft,
  loadDraft,
  saveDraft,
} from './repository.js';
export {
  type ConfigSource,
  type ResolveOptions,
  type ResolvedConfig,
  resolvePlayerConfig,
} from './resolve.js';
