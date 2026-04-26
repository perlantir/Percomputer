/**
 * Sound Effects Engine — Web Audio API
 * No external files. All sounds synthesized programmatically.
 * Includes optional haptic feedback via navigator.vibrate.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type SoundType = "success" | "error" | "notification" | "click";

export interface SoundOptions {
  /** Volume 0.0 – 1.0 */
  volume?: number;
  /** Playback speed multiplier */
  playbackRate?: number;
  /** Whether to skip haptic feedback */
  skipHaptic?: boolean;
}

// ─── State ───────────────────────────────────────────────────────────

let _enabled = true;
let _volume = 0.5;

/** Global AudioContext — lazily created on first user interaction */
let _ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (_ctx.state === "suspended") {
    _ctx.resume();
  }
  return _ctx;
}

// ─── Haptic Feedback ─────────────────────────────────────────────────

/**
 * Trigger haptic vibration pattern.
 * Silently fails on unsupported devices.
 */
function haptic(type: SoundType): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  switch (type) {
    case "success":
      navigator.vibrate(20);
      break;
    case "error":
      navigator.vibrate([40, 30, 40]);
      break;
    case "notification":
      navigator.vibrate([15, 50, 15]);
      break;
    case "click":
      navigator.vibrate(8);
      break;
  }
}

// ─── Sound Synthesis ─────────────────────────────────────────────────

/** Smooth envelope to avoid clicking artifacts */
function applyEnvelope(
  gainNode: GainNode,
  ctx: AudioContext,
  attackMs: number,
  decayMs: number,
  sustainLevel: number,
  releaseMs: number,
  durationSec: number
): void {
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + attackMs / 1000);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, now + (attackMs + decayMs) / 1000);
  gainNode.gain.setValueAtTime(sustainLevel, now + durationSec - releaseMs / 1000);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSec);
}

/** ── Success: subtle ascending chime ── */
function playSuccess(ctx: AudioContext, masterGain: GainNode, options?: SoundOptions): void {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.06);

    gain.gain.setValueAtTime(0, now + i * 0.06);
    gain.gain.linearRampToValueAtTime(0.35, now + i * 0.06 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.5);
  });
}

/** ── Error: soft descending buzz ── */
function playError(ctx: AudioContext, masterGain: GainNode, options?: SoundOptions): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(100, now + 0.25);

  // Low-pass filter to soften the buzz
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.linearRampToValueAtTime(200, now + 0.25);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.35);
}

/** ── Notification: gentle two-tone ping ── */
function playNotification(ctx: AudioContext, masterGain: GainNode, options?: SoundOptions): void {
  const now = ctx.currentTime;

  // First tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now); // A5

  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc1.connect(gain1);
  gain1.connect(masterGain);

  osc1.start(now);
  osc1.stop(now + 0.2);

  // Second tone (harmonic)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1100, now + 0.12); // C#6-ish

  gain2.gain.setValueAtTime(0, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc2.start(now + 0.12);
  osc2.stop(now + 0.4);
}

/** ── Click: ultra-short crisp tick ── */
function playClick(ctx: AudioContext, masterGain: GainNode, options?: SoundOptions): void {
  const now = ctx.currentTime;

  // Noise burst
  const bufferSize = ctx.sampleRate * 0.01; // 10ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

  // High-pass to make it crisp
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(3000, now);

  noise.connect(hp);
  hp.connect(noiseGain);
  noiseGain.connect(masterGain);

  noise.start(now);
  noise.stop(now + 0.01);

  // Subtle tone layer
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2000, now);

  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  osc.connect(oscGain);
  oscGain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.02);
}

// ─── Public API ──────────────────────────────────────────────────────

const SOUND_REGISTRY: Record<SoundType, typeof playSuccess> = {
  success: playSuccess,
  error: playError,
  notification: playNotification,
  click: playClick,
};

/**
 * Play a synthesized sound effect.
 * Returns immediately if sound effects are disabled.
 */
export function playSound(type: SoundType, options?: SoundOptions): void {
  if (!_enabled) return;

  try {
    const ctx = getContext();
    const masterGain = ctx.createGain();
    const vol = options?.volume ?? _volume;
    masterGain.gain.setValueAtTime(vol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    SOUND_REGISTRY[type](ctx, masterGain, options);

    if (!options?.skipHaptic) {
      haptic(type);
    }
  } catch {
    // Silently fail — audio is never critical
  }
}

// ─── Settings ────────────────────────────────────────────────────────

/** Check whether sound effects are enabled */
export function isSoundEnabled(): boolean {
  return _enabled;
}

/** Toggle sound effects on/off. Persists to localStorage. */
export function setSoundEnabled(enabled: boolean): void {
  _enabled = enabled;
  try {
    localStorage.setItem("sound-effects-enabled", String(enabled));
  } catch {
    // localStorage may be unavailable
  }
}

/** Get current master volume (0–1) */
export function getSoundVolume(): number {
  return _volume;
}

/** Set master volume (0–1) */
export function setSoundVolume(vol: number): void {
  _volume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem("sound-effects-volume", String(_volume));
  } catch {
    // localStorage may be unavailable
  }
}

/** Restore persisted settings from localStorage */
export function restoreSoundSettings(): void {
  try {
    const stored = localStorage.getItem("sound-effects-enabled");
    if (stored !== null) {
      _enabled = stored === "true";
    }
    const volStored = localStorage.getItem("sound-effects-volume");
    if (volStored !== null) {
      _volume = Math.max(0, Math.min(1, parseFloat(volStored)));
    }
  } catch {
    // localStorage may be unavailable
  }
}

// ─── Convenience Exports ─────────────────────────────────────────────

/** One-liner: play success chime */
export const sfxSuccess = (opts?: SoundOptions) => playSound("success", opts);

/** One-liner: play error buzz */
export const sfxError = (opts?: SoundOptions) => playSound("error", opts);

/** One-liner: play notification ping */
export const sfxNotify = (opts?: SoundOptions) => playSound("notification", opts);

/** One-liner: play click tick */
export const sfxClick = (opts?: SoundOptions) => playSound("click", opts);

// ─── Auto-restore on module load ─────────────────────────────────────

if (typeof window !== "undefined") {
  restoreSoundSettings();
}
