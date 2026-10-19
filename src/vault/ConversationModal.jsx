import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LockOpen, X } from "lucide-react";
import useConversation from "./useConversation";
import ReplyInput from "./ReplyInputs";
import ShayariReveal from "./ShayariReveal";
import { playMemoryAudio, primeMemoryAudio, stopMemoryAudio, useStopAudioOnUnmount } from "./AudioPlayer";
import { useBursts, useModal, useTimeout } from "./hooks";
import { playSound } from "./sounds";

const UNLOCK_MOMENT_MS = 2100; // the lock-breaking moment between chat and reveal

// One memory card's conversation, in a glass modal:
//   chat (questions & her replies) → lock breaks → ShayariReveal (music, shayari, photo)
// Closing mid-chat starts that card over next time; closing during the reveal
// still counts as finished.
//   card / index      → which memory (null card = closed)
//   continueLabel     → text on the reveal's Continue button
//   onClose()         → closed before finishing
//   onComplete(index, answers) → finished
export default function ConversationModal({ card, index, continueLabel, onClose, onComplete }) {
  return createPortal(
    <AnimatePresence>
      {card && (
        <Conversation key={index} card={card} index={index} continueLabel={continueLabel} onClose={onClose} onComplete={onComplete} />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Conversation({ card, index, continueLabel, onClose, onComplete }) {
  const chat = useConversation(card.steps);
  const [stage, setStage] = useState("chat"); // "chat" → "unlocking" → "reveal"
  const later = useTimeout();
  const panelRef = useRef(null);
  useStopAudioOnUnmount();

  // Every question answered: the lock-breaking moment, then the reveal.
  // The card's music starts together with the shayari and photo — never before.
  useEffect(() => {
    if (!chat.done) return;
    setStage("unlocking");
    playSound("unlock");
    later(() => {
      setStage("reveal");
      playMemoryAudio(card.audio, card.audioSettings);
    }, UNLOCK_MOMENT_MS);
  }, [chat.done, later, card.audio, card.audioSettings]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const answer = (reply) => {
    const wasLast = chat.answer(reply);
    // Inside her tap, so iPhones will allow the music to start later.
    if (wasLast) primeMemoryAudio(card.audio);
  };

  const finish = () => {
    playSound("click");
    stopMemoryAudio(); // fade out right away, before the next card
    onComplete(index, chat.answers);
  };

  const close = () => {
    if (stage === "reveal") finish();
    else {
      playSound("click");
      onClose();
    }
  };

  useModal(true, (e) => e.key === "Escape" && close());

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/70 p-3 backdrop-blur-md sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.1, duration: 0.4 } }}
      onClick={close}
    >
      <motion.div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-y-auto rounded-[2rem] border border-white/20 bg-linear-to-br from-white/15 via-white/8 to-white/5 p-5 shadow-[0_20px_80px_rgba(162,108,240,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl sm:p-7"
        initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        style={{ transformPerspective: 1000 }}
      >
        <motion.button
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 z-30 cursor-pointer rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.85 }}
        >
          <X className="size-5" />
        </motion.button>

        <header className="mb-5 pr-8 text-center sm:pr-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
            {card.icon} Memory {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 font-script text-3xl text-blush-100 text-glow sm:text-4xl">{card.title}</h3>
        </header>

        <AnimatePresence mode="wait">
          {stage === "reveal" ? (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8 }}
            >
              <ShayariReveal card={card} continueLabel={continueLabel} onContinue={finish} />
            </motion.div>
          ) : (
            <motion.div key="chat" exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} transition={{ duration: 0.4 }} className="relative">
              <ChatThread card={card} chat={chat} blurred={stage === "unlocking"} />
              <div className="mt-4 min-h-14">
                <AnimatePresence mode="wait">
                  {chat.prompt && stage === "chat" && (
                    <motion.div
                      key={chat.messages.length}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                      transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    >
                      <ReplyInput step={chat.prompt} onAnswer={answer} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>{stage === "unlocking" && <UnlockMoment />}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── The chat bubbles ── */
function ChatThread({ card, chat, blurred }) {
  const endRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.messages.length, chat.typing, chat.prompt]);

  return (
    <motion.div
      className="flex max-h-[44dvh] min-h-40 flex-col gap-2.5 overflow-y-auto px-1 py-1"
      animate={{ filter: blurred ? "blur(6px)" : "blur(0px)", opacity: blurred ? 0.4 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence initial={false}>
        {chat.messages.map((m) =>
          m.from === "me" ? (
            <motion.div
              key={m.id}
              layout
              className="flex items-end gap-2"
              initial={{ opacity: 0, x: -16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <span className="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm ring-1 ring-white/15">
                {card.icon}
              </span>
              <p className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-bl-md border border-white/10 bg-white/12 px-4 py-2.5 text-[15px] leading-snug text-blush-100 backdrop-blur sm:text-base">
                {m.text}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={m.id}
              layout
              className="flex justify-end"
              initial={{ opacity: 0, x: 16, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <p className="flex max-w-[80%] items-center gap-2 whitespace-pre-line rounded-2xl rounded-br-md bg-linear-to-br from-blush-300/90 to-lilac-400/90 px-4 py-2.5 text-[15px] font-medium leading-snug text-plum-950 shadow-[0_4px_20px_rgba(255,133,173,0.3)] sm:text-base">
                {m.swatch && <span className="size-4 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: m.swatch }} />}
                {m.text}
              </p>
            </motion.div>
          ),
        )}

        {chat.typing && (
          <motion.div
            key="typing"
            layout
            className="flex items-end gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
          >
            <span className="mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm ring-1 ring-white/15">
              {card.icon}
            </span>
            <span className="flex gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/12 px-4 py-3.5" aria-label="Typing">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-blush-200"
                  animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} />
    </motion.div>
  );
}

/* ── Step 6: the lock breaks over the finished chat ── */
function UnlockMoment() {
  const [bursts, , fireBurstAt] = useBursts();
  const centerRef = useRef(null);
  const later = useTimeout();

  useEffect(() => {
    later(() => {
      fireBurstAt(centerRef.current);
      playSound("sparkle");
    }, 650);
  }, [later, fireBurstAt]);

  const halves = [
    { clip: "inset(0 50% 0 0)", x: -70, rotate: -35 },
    { clip: "inset(0 0 0 50%)", x: 70, rotate: 35 },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div ref={centerRef} className="relative flex size-28 items-center justify-center">
        {[0, 0.15].map((delay) => (
          <motion.span
            key={delay}
            className="absolute inset-0 rounded-full border-2 border-gold-300"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.9], opacity: [1, 0] }}
            transition={{ delay: 0.6 + delay, duration: 0.9, ease: "easeOut" }}
          />
        ))}
        {halves.map((half, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{ clipPath: half.clip }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{
              scale: [0.4, 1.1, 1, 1, 1, 1],
              opacity: [0, 1, 1, 1, 1, 0],
              x: [0, 0, -3, 3, 0, half.x],
              y: [0, 0, 0, 0, 0, 50],
              rotate: [0, 0, -6, 6, 0, half.rotate],
            }}
            transition={{ duration: 1.4, times: [0, 0.2, 0.3, 0.4, 0.5, 1] }}
          >
            <Lock className="size-16 text-gold-200 drop-shadow-[0_0_14px_rgba(247,208,112,0.9)]" />
          </motion.span>
        ))}
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 12 }}
          className="rounded-full bg-gold-300/20 p-4 shadow-[0_0_50px_rgba(247,208,112,0.7)]"
        >
          <LockOpen className="size-10 text-gold-200" />
        </motion.span>
      </div>
      <motion.p
        className="font-script text-4xl text-gold-200 text-glow"
        initial={{ opacity: 0, y: 14, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 180, damping: 14 }}
      >
        Memory unlocked ✨
      </motion.p>
      {bursts}
    </motion.div>
  );
}
