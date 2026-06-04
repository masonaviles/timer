// Package entry "@masonaviles/cuestack/player" — the Preact player UI.
// Importing this pulls in Preact + the bundled CSS (sideEffects keeps it).
export {
  Player,
  type PlayerProps,
  Fullscreen,
  type FullscreenProps,
  mountPlayer,
  type MountResult,
  AdSlot,
  type AdSlotProps,
  applyTheme,
  pickDefaultTheme,
  prefersDark,
  useEngine,
  type EngineView,
  beep,
} from './view/index.js';
