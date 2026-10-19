import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import { Loader2, MailCheck, RefreshCw, RotateCcw, Volume2, VolumeX } from "lucide-react";
import PhaseTransition from "../components/PhaseTransition";
import Typewriter from "../components/Typewriter";
import Cake from "../finale/Cake";
import useWindowSize from "../hooks/useWindowSize";
import { sendBirthdayEmail } from "../email";
import { BIRTHDAY_MESSAGE, BIRTHDAY_SONG_SRC, EMAIL_SENT_LINE, HER_NAME, LETTER_SIGNATURE } from "../config";

const CONFETTI_COLORS = ["#ffa8c5", "#ff85ad", "#d8b4fe", "#c084fc", "#fde68a", "#f7d070", "#ffffff"];
const CONFETTI_SECONDS = 8;

// Phase 4 — tapping the candle blows it out, starts the song, fires
// confetti and types out the birthday message. Meanwhile her birthday
// trip-recap email is sent, and once the letter is done she's asked to check it.
export default function Finale({ player, onRestart }) {
  const [blown, setBlown] = useState(false);
  const [confettiFlowing, setConfettiFlowing] = useState(true);
  const [muted, setMuted] = useState(false);
  const [messageDone, setMessageDone] = useState(false);
  const [mail, setMail] = useState("idle"); // idle → sending → sent | failed
  const audioRef = useRef(null);
  const { width, height } = useWindowSize();

  const sendEmail = () => {
    if (!player?.email) return;
    setMail("sending");
    sendBirthdayEmail(player)
      .then(() => setMail("sent"))
      .catch(() => setMail("failed"));
  };

  const blowOut = () => {
    if (blown) return;
    setBlown(true);
    sendEmail(); // starts now so it's already in her inbox when the letter ends
    // Playing inside the tap handler counts as a user gesture, so browsers allow it.
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  // After a while, stop spawning new confetti and let the rest fall away.
  useEffect(() => {
    if (!blown) return;
    const timer = setTimeout(() => setConfettiFlowing(false), CONFETTI_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [blown]);

  // A detached <audio> can keep playing, so stop the song when leaving this phase.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  return (
    <PhaseTransition className="flex flex-col items-center justify-center gap-10 px-5 py-16">
      <audio ref={audioRef} src={BIRTHDAY_SONG_SRC} preload="auto" />

      {/* Before: the wish prompt. After: the big Happy Birthday. */}
      <div className="min-h-28 text-center">
        <AnimatePresence mode="wait">
          {!blown ? (
            <motion.div key="wish" exit={{ opacity: 0, y: -20, filter: "blur(6px)" }} transition={{ duration: 0.5 }}>
              <motion.h2
                className="font-script text-4xl text-blush-100 text-glow sm:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1 }}
              >
                Make a wish…
              </motion.h2>
              <motion.p
                className="mt-3 text-lilac-200/85"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ delay: 1.4, duration: 2.6, repeat: Infinity }}
              >
                and tap the candle to blow it out ✨
              </motion.p>
            </motion.div>
          ) : (
            <motion.h2
              key="hbd"
              className="bg-linear-to-r from-blush-200 via-gold-200 to-lilac-200 bg-clip-text font-script text-5xl leading-tight text-transparent drop-shadow-[0_0_20px_rgba(255,168,197,0.5)] sm:text-7xl"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 10, delay: 0.3 }}
            >
              Happy Birthday,
              <br />
              {HER_NAME}! 🎂
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, scale: blown ? 0.85 : 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 15, delay: blown ? 0 : 0.6 }}
      >
        <Cake blown={blown} onBlow={blowOut} />
      </motion.div>

      {/* The heartfelt message */}
      {blown && (
        <motion.div
          className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(255,168,197,0.15)] backdrop-blur-md sm:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <Typewriter
            text={BIRTHDAY_MESSAGE}
            speed={32}
            startDelay={2000}
            onDone={() => setMessageDone(true)}
            className="text-base leading-relaxed text-blush-100 sm:text-lg"
          />
          <AnimatePresence>
            {messageDone && (
              <motion.p
                className="mt-6 text-right font-script text-2xl text-gold-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {LETTER_SIGNATURE}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* "Check your email" — the last surprise */}
      {messageDone && mail !== "idle" && (
        <motion.div
          className="w-full max-w-xl rounded-3xl border border-gold-300/40 bg-gold-300/10 px-6 py-5 text-center shadow-[0_0_50px_rgba(247,208,112,0.18)] backdrop-blur-md"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 160, damping: 16 }}
          role="status"
        >
          {mail === "failed" ? (
            <>
              <p className="text-blush-100">Email abhi nahi ja paaya 😕</p>
              <button
                type="button"
                onClick={sendEmail}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-gold-200 transition hover:bg-white/20"
              >
                <RefreshCw className="size-4" /> Phir se bhejo
              </button>
            </>
          ) : (
            <>
              <motion.div
                className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-gold-300/20 text-gold-200"
                animate={mail === "sent" ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                {mail === "sent" ? <MailCheck className="size-7" /> : <Loader2 className="size-7 animate-spin" />}
              </motion.div>
              <p className="font-script text-3xl text-gold-200">{mail === "sent" ? "Next stop: your inbox ✈️" : "Ek letter ud raha hai… ✈️"}</p>
              <p className="mt-2 text-blush-100/90">
                {mail === "sent" ? EMAIL_SENT_LINE : "Tumhare inbox ki taraf ja raha hai, bas ek second…"}
              </p>
              <p className="mt-1 text-sm text-lilac-200/70">{player.email}</p>
            </>
          )}
        </motion.div>
      )}

      {messageDone && (
        <motion.button
          type="button"
          onClick={onRestart}
          className="flex cursor-pointer items-center gap-2 text-sm text-lilac-200/70 transition hover:text-lilac-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <RotateCcw className="size-4" /> Relive it from the start
        </motion.button>
      )}

      {/* Portaled so it covers the viewport regardless of the page's transforms. */}
      {blown &&
        createPortal(
          <>
            <Confetti
              width={width}
              height={height}
              recycle={confettiFlowing}
              numberOfPieces={380}
              gravity={0.12}
              colors={CONFETTI_COLORS}
              confettiSource={{ x: width / 2, y: height / 2, w: 0, h: 0 }}
              initialVelocityX={{ min: -14, max: 14 }}
              initialVelocityY={{ min: -22, max: -6 }}
              style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}
            />
            <motion.button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute song" : "Mute song"}
              className="fixed right-4 top-4 z-50 cursor-pointer rounded-full bg-white/10 p-3 text-blush-100 backdrop-blur transition hover:bg-white/20"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </motion.button>
          </>,
          document.body,
        )}
    </PhaseTransition>
  );
}
