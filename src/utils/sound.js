const SOUND_STORAGE_KEY = 'lights_down_sound_v1';

let audioCtx = null;
let humOsc = null;
let humGain = null;

export function getSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
  if (!enabled) {
    stopProjectorHum();
  }
}

function ensureAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Short mechanical split-flap clack
 */
export function playFlapClack() {
  if (!getSoundEnabled()) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.035);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // ignore audio errors
  }
}

/**
 * Short filtered white-noise paper tear burst when tearing the ticket stub
 */
export function playTicketTear() {
  if (!getSoundEnabled()) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  try {
    const duration = 0.24;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    // ignore
  }
}

/**
 * Gentle warm 55Hz projector booth hum while on the Night Plan screen
 */
export function startProjectorHum() {
  if (!getSoundEnabled()) return;
  const ctx = ensureAudioContext();
  if (!ctx || humOsc) return;

  try {
    humOsc = ctx.createOscillator();
    humGain = ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(58, ctx.currentTime);

    humGain.gain.setValueAtTime(0.001, ctx.currentTime);
    humGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.8);

    humOsc.connect(humGain);
    humGain.connect(ctx.destination);
    humOsc.start();
  } catch {
    humOsc = null;
    humGain = null;
  }
}

export function stopProjectorHum() {
  if (!humOsc) return;
  try {
    humOsc.stop();
    humOsc.disconnect();
  } catch {
    // ignore
  }
  humOsc = null;
  humGain = null;
}
