import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import GlowButton from "../components/GlowButton";
import { ADDRESS_SUBMIT } from "../config";

// A small glass card that pops up after a catch and asks one ADDRESS_STEPS
// question. The game waits behind it until she answers.
//   step     → the ADDRESS_STEPS entry to ask (null = hidden)
//   number   → which question this is (1, 2, 3…) out of `total`
//   onAnswer(value) → called with her trimmed answer once it's valid
export default function AddressPrompt({ step, number, total, onAnswer }) {
  return createPortal(
    <AnimatePresence>
      {step && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/70 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Card key={step.key} step={step} number={number} total={total} onAnswer={onAnswer} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Card({ step, number, total, onAnswer }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const valid = (text) =>
    text.length >= (step.minLength ?? 1) && (!step.pattern || new RegExp(step.pattern).test(text));

  const submit = (e) => {
    e?.preventDefault();
    const text = value.trim().replace(/\s+/g, " ");
    if (!valid(text)) return setError(true);
    onAnswer(text);
  };

  const Field = step.multiline ? "textarea" : "input";

  return (
    <motion.form
      onSubmit={submit}
      noValidate
      className="w-full max-w-md rounded-3xl border border-gold-300/40 bg-plum-900/95 p-6 text-center shadow-[0_0_60px_rgba(247,208,112,0.2)]"
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-200">
        <MapPin className="size-3.5" /> Check-in {number}/{total}
      </p>
      <label htmlFor={`address-${step.key}`} className="mt-3 block font-script text-3xl text-blush-100">
        {step.question}
      </label>

      <Field
        id={`address-${step.key}`}
        autoFocus
        rows={step.multiline ? 3 : undefined}
        inputMode={step.inputMode}
        maxLength={step.maxLength}
        autoComplete={step.key === "pincode" ? "postal-code" : step.key === "address" ? "street-address" : "off"}
        value={value}
        onChange={(e) => {
          setValue(step.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter still makes a new line in the address box.
          if (e.key === "Enter" && !e.shiftKey) submit(e);
        }}
        placeholder={step.placeholder}
        aria-invalid={error}
        className={`mt-4 w-full resize-none rounded-2xl border bg-white/10 px-4 py-3 text-base text-blush-100 placeholder:text-lilac-200/40 outline-none transition focus:bg-white/15 ${
          step.inputMode === "numeric" ? "text-center text-xl tracking-[0.4em]" : ""
        } ${error ? "border-rose-300/80" : "border-white/20 focus:border-blush-300/70"}`}
      />
      <p className="h-6 pt-1 text-sm text-rose-200" role="alert">
        {error && step.error}
      </p>

      <div className="mt-2 flex justify-center">
        <GlowButton onClick={submit}>{ADDRESS_SUBMIT}</GlowButton>
      </div>
    </motion.form>
  );
}
