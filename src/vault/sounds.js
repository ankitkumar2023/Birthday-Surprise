import { SOUND_EFFECTS_ON, VAULT_SOUNDS } from "../config";

// playSound("match") plays the file set in VAULT_SOUNDS (config.js).
// If that file is missing (or set to null), a tiny synthesized chime plays
// instead, so the vault never feels silent while you're still collecting sounds.

// Fallback chimes: each note is [frequency in Hz, start in s, length in s].
const CHIMES = {
  flip: { wave: "triangle", volume: 0.07, notes: [[660, 0, 0.07]] },
  click: { wave: "sine", volume: 0.06, notes: [[880, 0, 0.05]] },
  message: { wave: "sine", volume: 0.05, notes: [[988, 0, 0.06], [1319, 0.05, 0.1]] },
  match: { wave: "sine", volume: 0.12, notes: [[784, 0, 0.16], [1047, 0.09, 0.3]] },
  wrong: { wave: "triangle", volume: 0.09, notes: [[233, 0, 0.14], [196, 0.11, 0.24]] },
  unlock: { wave: "sine", volume: 0.11, notes: [[523, 0, 0.2], [659, 0.08, 0.2], [784, 0.16, 0.2], [1047, 0.24, 0.6]] },
  sparkle: { wave: "sine", volume: 0.05, notes: [[1319, 0, 0.15], [1568, 0.07, 0.15], [2093, 0.14, 0.15], [2637, 0.21, 0.4]] },
  vault: { wave: "sine", volume: 0.1, notes: [[98, 0, 1.4], [147, 0.35, 1.3], [196, 0.7, 1.5], [294, 1.05, 1.2]] },
};

let audioContext = null;

function playChime(name) {
  const chime = CHIMES[name];
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!chime || !AudioContextClass) return;

  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  const now = audioContext.currentTime;

  for (const [frequency, start, length] of chime.notes) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = chime.wave;
    osc.frequency.value = frequency;
    // Quick fade in and a soft fade out, so notes don't click.
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(chime.volume, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now + start);
    osc.stop(now + start + length + 0.05);
  }
}

// Files that failed to load once aren't requested again.
const missingFiles = new Set();

export function playSound(name) {
  if (!SOUND_EFFECTS_ON) return;
  const src = VAULT_SOUNDS[name];
  if (!src || missingFiles.has(name)) {
    playChime(name);
    return;
  }
  // A fresh <audio> each time lets the same sound overlap itself (fast clicks).
  const audio = new Audio(src);
  audio.volume = 0.7;
  audio.addEventListener(
    "error",
    () => {
      missingFiles.add(name);
      playChime(name);
    },
    { once: true },
  );
  audio.play().catch(() => {});
}
