import React from "react";
import { motion } from "framer-motion";

const FLOW = ["DETECT", "PRIORITIZE", "VERIFY", "CONTEXTUALIZE", "PACKAGE", "REVIEW"];

export default function FinalStatement() {
  return (
    <section className="relative w-full overflow-hidden bg-kerb-black px-6 py-40 md:px-16 md:py-56">
      <div className="mx-auto max-w-[1400px] text-center">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-mono text-[11px] tracking-[0.25em] text-kerb-red uppercase"
        >
          KERB / RACE INTELLIGENCE
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-10 max-w-5xl font-display text-4xl font-bold leading-[0.95] tracking-tight text-kerb-white md:text-7xl"
        >
          AI finds the incident. <br />
          <span className="text-kerb-red">The steward makes the decision.</span>
        </motion.h2>

        <div className="mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-center gap-y-3">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="font-mono text-[11px] tracking-[0.2em] text-kerb-white uppercase md:text-sm"
              >
                {step}
              </motion.span>
              {i < FLOW.length - 1 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.05 }}
                  className="mx-3 text-kerb-red"
                >
                  →
                </motion.span>
              )}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mx-auto mt-16 h-px w-24 origin-center bg-kerb-red"
        />
      </div>
    </section>
  );
}