// Public surface of the ads model (maps to the "./ads" package export). Framework-free.
export { type Offering, EXAMPLE_OFFERINGS } from './offerings.js';
export {
  type AdStrategy,
  type AdRender,
  resolveAd,
  readConsent,
  writeConsent,
} from './strategy.js';
