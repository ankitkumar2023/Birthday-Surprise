import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";

const WRONG_HINTS = ["Hmm, think harder 😏", "Nope! Try again 😜", "Close… but no 💭", "I'm judging you a little 🙈"];

const cardVariants = {
  // The final card lingers a moment so she sees her right answer.
  exit: (isFinished) => ({ opacity: 0, x: -60, rotate: -2, transition: { delay: isFinished ? 0.8 : 0 } }),
};

// The trivia game: one question at a time. A wrong option gets crossed out;
// the right one celebrates and, after a short pause, moves to the next question.
//   questions          → from TRIVIA_QUESTIONS in config.js
//   onCorrect(x, y)    → called with the screen point of each right answer
//   done               → true once every question is answered
export default function TriviaGame({ questions, onCorrect, done }) {
  const [index, setIndex] = useState(0);
  const [wrongPicks, setWrongPicks] = useState([]); // option indexes already tried
  const [correctPick, setCorrectPick] = useState(null);
  const [hint, setHint] = useState("");

  const question = questions[index];

  const choose = (optionIndex, event) => {
    // Ignore taps while the "correct!" moment is showing, or after winning.
    if (done || correctPick !== null || wrongPicks.includes(optionIndex)) return;

    if (optionIndex !== question.answer) {
      setWrongPicks((picks) => [...picks, optionIndex]);
      setHint(WRONG_HINTS[Math.floor(Math.random() * WRONG_HINTS.length)]);
      return;
    }

    setCorrectPick(optionIndex);
    setHint("");
    const rect = event.currentTarget.getBoundingClientRect();
    onCorrect(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Pause to enjoy the moment, then show the next question (if any).
    setTimeout(() => {
      if (index < questions.length - 1) {
        setIndex(index + 1);
        setCorrectPick(null);
        setWrongPicks([]);
      }
    }, 1400);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6">
      {/* `custom` reaches the card even as it leaves, so the last one can linger. */}
      <AnimatePresence mode="wait" custom={done}>
        {!done && (
        <motion.div
          key={index}
          className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(192,132,252,0.15)] backdrop-blur-md sm:p-8"
          initial={{ opacity: 0, x: 60, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          variants={cardVariants}
          exit="exit"
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-lilac-300">
            Question {index + 1} of {questions.length}
          </p>
          <h3 className="mb-6 text-xl font-semibold text-blush-100 sm:text-2xl">{question.question}</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((option, i) => {
              const isWrong = wrongPicks.includes(i);
              const isCorrect = correctPick === i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={(e) => choose(i, e)}
                  disabled={isWrong}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left font-medium transition-colors ${
                    isCorrect
                      ? "border-gold-300 bg-gold-300/20 text-gold-200"
                      : isWrong
                        ? "cursor-not-allowed border-white/5 bg-white/0 text-white/30 line-through"
                        : "border-white/15 bg-white/5 text-blush-100 hover:border-blush-300/60 hover:bg-blush-300/10"
                  }`}
                  animate={
                    isWrong ? { x: [0, -10, 10, -6, 6, 0] } : isCorrect ? { scale: [1, 1.08, 1] } : { x: 0, scale: 1 }
                  }
                  transition={{ duration: 0.45 }}
                  whileTap={!isWrong ? { scale: 0.97 } : undefined}
                >
                  {option}
                  {isCorrect && <Check className="size-5 shrink-0" />}
                  {isWrong && <X className="size-5 shrink-0" />}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 h-6 text-center text-sm text-blush-200/80">
            <AnimatePresence mode="wait">
              {hint && (
                <motion.span key={hint + wrongPicks.length} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {hint}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
