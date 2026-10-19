import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { MEMORY_VAULT } from "../config";

// ─────────────────────────────────────────────────────────────────────────────
// Reveal music for the Memory Vault (HTML5 Audio).
//
// There is exactly ONE player for the whole vault, so two memories can never
// play over each other: starting a new track fades out the old one first.
//
//   playMemoryAudio(src, options) → fade in, play, fade out by itself near the end
//   stopMemoryAudio()     → fade out and stop (leaving a memory, closing, etc.)
//   useMemoryAudio()      → { src, playing, muted } for UI
//   <AudioPlayer />       → the little "now playing" pill with a mute button
//
// Timing (volume, fade lengths, max length) lives in MEMORY_VAULT.audio in config.js.
// Note: iPhones ignore volume changes, so there the music starts/stops without fading.
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS = { volume: 0.6, fadeIn: 1.5, fadeOut: 2, maxLength: 20, ...MEMORY_VAULT.audio };

let current = null; // { audio, src, fadeFrame, stopTimer }
let state = { src: null, playing: false, muted: false };
const listeners = new Set();

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

// Smoothly move a track's volume to `target` over `seconds`, then call `done`.
function fadeTo(track, target, seconds, done) {
  cancelAnimationFrame(track.fadeFrame);
  const from = track.audio.volume;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / (seconds * 1000));
    track.audio.volume = Math.min(1, Math.max(0, from + (target - from) * t));
    if (t < 1) track.fadeFrame = requestAnimationFrame(step);
    else done?.();
  };
  track.fadeFrame = requestAnimationFrame(step);
}

function release(track) {
  cancelAnimationFrame(track.fadeFrame);
  clearTimeout(track.stopTimer);
  track.audio.pause();
  track.audio.removeAttribute("src");
  track.audio.load(); // frees the network connection
}

export function stopMemoryAudio(fadeSeconds = 1.2) {
  const track = current;
  if (!track) return;
  current = null;
  setState({ src: null, playing: false });
  if (fadeSeconds <= 0 || track.audio.paused) release(track);
  else fadeTo(track, 0, fadeSeconds, () => release(track));
}

// iPhones only let audio start inside a tap, but the reveal begins a couple of
// seconds after her last answer. Calling this from that tap "unlocks" the
// element early; playMemoryAudio(src) then reuses it.
let primed = null; // { audio, src, claimed }

export function primeMemoryAudio(src) {
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0;
  const entry = { audio, src, claimed: false };
  primed = entry;
  audio
    .play()
    .then(() => !entry.claimed && audio.pause())
    .catch(() => {});
}

// `options` overrides MEMORY_VAULT.audio for one card (its `audioSettings`):
//   volume, fadeIn, fadeOut, maxLength (null = no limit, play until she moves on),
//   startAt (seconds to skip at the beginning).
export function playMemoryAudio(src, options = {}) {
  if (!src) return;
  stopMemoryAudio(0.6); // never two at once
  const settings = { ...SETTINGS, startAt: 0, ...options };

  const reuse = primed?.src === src ? primed : null;
  primed = null;
  if (reuse) reuse.claimed = true;
  const audio = reuse ? reuse.audio : new Audio(src);
  audio.volume = 0;
  audio.muted = state.muted;
  const track = { audio, src, fadeFrame: 0, stopTimer: 0 };
  current = track;

  // Once the length is known: jump to `startAt`, and schedule the automatic
  // fade-out at the end of the clip (or after `maxLength` seconds).
  const onReady = () => {
    if (current !== track) return;
    if (settings.startAt) audio.currentTime = settings.startAt;
    const remaining = (audio.duration || Infinity) - (settings.startAt || 0);
    const length = settings.maxLength == null ? remaining : Math.min(remaining, settings.maxLength);
    if (!Number.isFinite(length)) return;
    const fadeAt = Math.max(0, length - settings.fadeOut);
    track.stopTimer = setTimeout(() => current === track && stopMemoryAudio(settings.fadeOut), fadeAt * 1000);
  };
  audio.currentTime = settings.startAt || 0;
  // A primed element may already know its length, so its event has passed.
  if (audio.readyState >= 1) onReady();
  else audio.addEventListener("loadedmetadata", onReady, { once: true });
  audio.addEventListener("ended", () => current === track && stopMemoryAudio(0));
  // Missing file: just stay quiet.
  audio.addEventListener("error", () => current === track && stopMemoryAudio(0));

  audio
    .play()
    .then(() => {
      if (current !== track) return;
      setState({ src, playing: true });
      fadeTo(track, settings.volume, settings.fadeIn);
    })
    .catch(() => current === track && stopMemoryAudio(0));
}

export function toggleMemoryAudioMute() {
  const muted = !state.muted;
  if (current) current.audio.muted = muted;
  setState({ muted });
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useMemoryAudio() {
  return useSyncExternalStore(subscribe, () => state);
}

// Stops the music when the component that started it goes away.
export function useStopAudioOnUnmount() {
  useEffect(() => () => stopMemoryAudio(), []);
}

// The "now playing" pill: dancing equalizer bars + mute toggle.
// Shows itself only while music is actually playing.
export default function AudioPlayer({ className = "" }) {
  const { playing, muted } = useMemoryAudio();

  return (
    <AnimatePresence>
      {playing && (
        <motion.button
          type="button"
          onClick={toggleMemoryAudioMute}
          aria-label={muted ? "Unmute music" : "Mute music"}
          className={`flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-plum-950/60 px-3 py-1.5 text-xs font-semibold text-blush-100 backdrop-blur transition-colors hover:bg-white/15 ${className}`}
          initial={{ opacity: 0, scale: 0.7, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="flex h-3.5 items-end gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-0.5 rounded-full bg-gold-300"
                animate={muted ? { height: 3 } : { height: [3, 14, 6, 11, 3] }}
                transition={muted ? { duration: 0.2 } : { duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              />
            ))}
          </span>
          {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
