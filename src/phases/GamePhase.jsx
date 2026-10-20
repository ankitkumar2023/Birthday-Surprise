import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Unlock } from "lucide-react";
import PhaseTransition from "../components/PhaseTransition";
import GlowButton from "../components/GlowButton";
import Burst from "../components/Burst";
import CatchGame from "../game/CatchGame";
import TriviaGame from "../game/TriviaGame";
import BoardingPass from "../game/BoardingPass";
import AddressPrompt from "../game/AddressPrompt";
import { ADDRESS_STEPS, BOARDING_PASS, GAME_MODE, TRIVIA_QUESTIONS } from "../config";

const IS_TRIVIA = GAME_MODE === "trivia";

// Wins needed = one per boarding-pass section (and, in trivia mode, never more than there are questions).
const SECTIONS = BOARDING_PASS.sections.length;
const GOAL = IS_TRIVIA ? Math.min(SECTIONS, TRIVIA_QUESTIONS.length) : SECTIONS;
const PASS = { ...BOARDING_PASS, sections: BOARDING_PASS.sections.slice(0, GOAL) };
const QUESTIONS = TRIVIA_QUESTIONS.slice(0, GOAL);

const CHEERS = ["Gotcha! ⚡", "Ooh, nice one ✨", "You're good at this 😌", "One step closer… 🔓"];

// Phase 2 — owns the score. Whichever game is active just reports each
// success via onSuccess(x, y); this component celebrates it, unlocks a
// fragment, and shows the way forward once all are unlocked.
export default function GamePhase({ onWin }) {
  const [unlocked, setUnlocked] = useState(0);
  const [bursts, setBursts] = useState([]);
  const [cheer, setCheer] = useState("");
  const burstId = useRef(0);
  const startedAt = useRef(Date.now());
  const wonAt = useRef(null);
  const won = unlocked >= GOAL;
  if (won && wonAt.current === null) wonAt.current = Date.now();

  // Her address, asked one piece per catch: { address, pincode, landmark }.
  const [answers, setAnswers] = useState({});
  const [asking, setAsking] = useState(null); // the ADDRESS_STEPS entry on screen
  const [pending, setPending] = useState(false); // caught, question about to show: game paused

  const board = () =>
    onWin({ mode: GAME_MODE, wins: GOAL, seconds: Math.round((wonAt.current - startedAt.current) / 1000), address: answers });

  const handleSuccess = (x, y) => {
    if (pending) return;
    setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    const id = burstId.current++;
    setBursts((list) => [...list, { id, x, y }]);
    // This catch has a question: the pass prints once she's answered it.
    const step = ADDRESS_STEPS[unlocked];
    if (step) {
      setPending(true);
      setTimeout(() => setAsking(step), 450); // let the sparkle burst play first
    }
    else setUnlocked((n) => Math.min(n + 1, GOAL));
  };

  const answer = (value) => {
    setAnswers((all) => ({ ...all, [asking.key]: value }));
    setAsking(null);
    setPending(false);
    setUnlocked((n) => Math.min(n + 1, GOAL));
  };

  // Fill the pass with what she typed, plus the complete address at the end.
  const pass = {
    ...PASS,
    sections: PASS.sections.map((section) => ({
      fields: section.fields.map((f) => (f.answer ? { ...f, value: answers[f.answer] ?? "" } : f)),
    })),
    fullAddress: [answers.address, answers.landmark, answers.pincode && `PIN ${answers.pincode}`].filter(Boolean).join(" · "),
  };

  const removeBurst = (id) => setBursts((list) => list.filter((b) => b.id !== id));

  return (
    <PhaseTransition className="flex flex-col pb-10 pt-10 sm:pt-14">
      {/* Header: instructions → cheer → victory message */}
      <header className="px-6 text-center">
        <AnimatePresence mode="wait">
          {won ? (
            <motion.h2
              key="won"
              className="font-script text-4xl text-gold-200 text-glow sm:text-6xl"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 12 }}
            >
              Boarding pass ready! ✈️
            </motion.h2>
          ) : (
            <motion.div key="playing" exit={{ opacity: 0, y: -10 }}>
              <h2 className="font-script text-4xl text-blush-100 text-glow sm:text-5xl">
                {IS_TRIVIA ? "How well do you know us?" : "Catch the glowing things"}
              </h2>
              <p className="mt-2 text-sm text-lilac-200/80 sm:text-base">
                {IS_TRIVIA
                  ? `Answer ${GOAL} questions to print your boarding pass`
                  : `Tap ${GOAL} of them to print your boarding pass ✈️`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress hearts */}
        <div className="mt-4 flex justify-center gap-2" aria-label={`${unlocked} of ${GOAL} unlocked`}>
          {Array.from({ length: GOAL }, (_, i) => (
            <motion.span key={i} animate={i < unlocked ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.5 }}>
              <Heart
                className={`size-6 transition-colors duration-500 ${i < unlocked ? "text-blush-400" : "text-white/20"}`}
                fill={i < unlocked ? "currentColor" : "none"}
              />
            </motion.span>
          ))}
        </div>

        <div className="mt-2 h-6 text-sm font-medium text-gold-300">
          <AnimatePresence mode="wait">
            {cheer && !won && (
              <motion.span
                key={`${cheer}-${unlocked}`}
                className="inline-block"
                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {cheer}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* The game itself */}
      {IS_TRIVIA ? (
        <TriviaGame questions={QUESTIONS} onCorrect={handleSuccess} done={won || pending} />
      ) : (
        <CatchGame onCatch={handleSuccess} done={won || pending} />
      )}

      <BoardingPass pass={pass} unlocked={unlocked} />
      <AddressPrompt step={asking} number={unlocked + 1} total={Math.min(ADDRESS_STEPS.length, GOAL)} onAnswer={answer} />

      {/* The way forward, once every fragment is unlocked */}
      <div className="mt-8 flex min-h-16 justify-center">
        {won && (
          <GlowButton onClick={board} delay={1.2}>
            <Unlock className="size-5" /> Board to the Memory Vault
          </GlowButton>
        )}
      </div>

      {bursts.map((b) => (
        <Burst key={b.id} x={b.x} y={b.y} onDone={() => removeBurst(b.id)} />
      ))}
    </PhaseTransition>
  );
}
