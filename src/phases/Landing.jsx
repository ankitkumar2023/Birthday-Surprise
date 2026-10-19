import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import PhaseTransition from "../components/PhaseTransition";
import GlowButton from "../components/GlowButton";
import { useState } from "react";
import { EMAIL_INVALID, EMAIL_PLACEHOLDER, EMAIL_PROMPT, LANDING_LINE_1, LANDING_LINE_2 } from "../config";
import { isEmail } from "../email";

// Phase 1 — a dark, softly glowing teaser. Text arrives line by line,
// then she enters her email and the Start button begins the game.
export default function Landing({ initialEmail = "", onStart }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    if (!isEmail(email)) return setError(true);
    onStart(email.trim());
  };

  return (
    <PhaseTransition className="flex flex-col items-center justify-center gap-10 px-6 text-center">
      {/* Floating, glowing gift */}
      <motion.div
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 12 }}
      >
        <motion.div
          className="relative"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-blush-400/40 blur-2xl" />
          <Gift className="relative size-16 text-blush-200 drop-shadow-[0_0_14px_rgba(255,133,173,0.9)]" strokeWidth={1.5} />
          <Sparkles className="absolute -right-5 -top-4 size-6 text-gold-300" />
        </motion.div>
      </motion.div>

      <div className="space-y-4">
        {/* Outer element fades in once; inner element pulses forever. */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1.2 }}>
          <motion.h1
            className="font-script text-5xl text-blush-100 text-glow sm:text-7xl"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {LANDING_LINE_1}
          </motion.h1>
        </motion.div>

        <motion.p
          className="text-lg italic tracking-wide text-lilac-200/80 sm:text-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 1.2 }}
        >
          {LANDING_LINE_2}
        </motion.p>
      </div>

      <motion.form
        className="flex w-full max-w-sm flex-col items-center gap-3"
        onSubmit={submit}
        noValidate
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3, duration: 0.8 }}
      >
        <label htmlFor="her-email" className="text-sm text-lilac-200/85 sm:text-base">
          {EMAIL_PROMPT}
        </label>
        <input
          id="her-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(false);
          }}
          placeholder={EMAIL_PLACEHOLDER}
          aria-invalid={error}
          className={`w-full rounded-full border bg-white/10 px-6 py-3.5 text-center text-base text-blush-100 placeholder:text-lilac-200/40 outline-none backdrop-blur transition focus:bg-white/15 focus:shadow-[0_0_24px_rgba(255,133,173,0.35)] ${
            error ? "border-rose-300/80" : "border-white/20 focus:border-blush-300/70"
          }`}
        />
        <p className="h-5 text-sm text-rose-200" role="alert">
          {error && EMAIL_INVALID}
        </p>
        {/* GlowButton is type="button", so the form's Enter key is handled by onSubmit. */}
        <GlowButton onClick={submit} delay={3.2}>
          Start <Sparkles className="size-5" />
        </GlowButton>
      </motion.form>
    </PhaseTransition>
  );
}
