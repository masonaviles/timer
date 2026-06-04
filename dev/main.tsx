// Standalone dev app — boots the Player with the sample config.
// (Share-link loading via ?t= arrives in Phase 4; Astro routes in Phase 5.)

import { createSampleTimer } from '../src/data/presets.js';
import { mountPlayer } from '../src/view/mount.js';

const el = document.getElementById('app');
if (el) {
  mountPlayer(el, createSampleTimer());
}
