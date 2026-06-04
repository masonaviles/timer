// Public surface of the view layer (Phase 5 maps this to a "./player" package export).
// Importing anything here pulls in Preact + CSS — keep engine-only consumers on "./engine".
export { Player, type PlayerProps } from './Player.js';
export { Fullscreen, type FullscreenProps } from './Fullscreen.js';
export { mountPlayer, type MountResult } from './mount.js';
export { applyTheme, pickDefaultTheme, prefersDark } from './theme.js';
export { useEngine, type EngineView } from './useEngine.js';
export { beep } from './audio.js';
