// View layer — map engine urgency to a CSS modifier class ('' | 'warn' | 'danger').
import type { Urgency } from '../data/schema.js';

export function urgencyClass(u: Urgency): string {
  return u === 'normal' ? '' : u;
}
