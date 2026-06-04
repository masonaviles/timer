// View layer — end-of-step audio alert (ported from the original 4-beep pattern).
// The AudioContext is created lazily on first use so it unlocks after a user gesture
// (browser autoplay policy). Fails silently where Web Audio is unavailable.

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor: AudioContextCtor | undefined =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Play the four-tone "time's up" alert. No-op if audio is unavailable. */
export function beep(): void {
  const audio = getContext();
  if (!audio) return;
  for (const delay of [0, 350, 700, 1100]) {
    setTimeout(() => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(960, audio.currentTime);
      osc.frequency.setValueAtTime(720, audio.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.4);
      osc.start(audio.currentTime);
      osc.stop(audio.currentTime + 0.4);
    }, delay);
  }
}
