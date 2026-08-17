/**
 * Web Audio API synthesized notifications for UNKE Estudio
 * Crystal-clear native audio with zero external file dependencies
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Plays a pleasant, modern, 2-tone melodic chime when a team member connects.
 * Inspired by modern workspace collaborative tools (Slack/Figma).
 */
export function playUserJoinedSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.connect(ctx.destination);

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: B5 (987.77 Hz) - Harmonious major fifth higher
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.1);

    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.32, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);

    // Tone 3: Subtle warm harmonic overtone (E6: 1318.51 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1318.51, now + 0.1);

    gain3.gain.setValueAtTime(0, now + 0.1);
    gain3.gain.linearRampToValueAtTime(0.1, now + 0.13);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc3.connect(gain3);
    gain3.connect(masterGain);

    osc3.start(now + 0.1);
    osc3.stop(now + 0.5);
  } catch (e) {
    console.warn('Could not play joined sound:', e);
  }
}

/**
 * Test notification helper that also unlocks audio context on click
 */
export function testNotificationSound(): void {
  playUserJoinedSound();
}
