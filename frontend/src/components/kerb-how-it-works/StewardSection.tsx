import React from "react";
import { motion } from "framer-motion";

export default function StewardSection() {
  return (
    <section className="relative w-full overflow-hidden bg-kerb-black px-6 py-40 md:px-16 md:py-56">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="font-mono text-[11px] tracking-[0.25em] text-kerb-red uppercase">
            KERB / THE HUMAN REMAINS IN CONTROL
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 text-center font-display text-5xl font-bold leading-[0.9] tracking-tight text-kerb-white md:text-8xl"
        >
          KERB DOESN&apos;T <br />
          <span className="text-kerb-red">MAKE THE CALL.</span>
        </motion.h2>

        <div className="mx-auto mt-20 grid max-w-3xl gap-px border border-kerb-tech bg-kerb-tech md:grid-cols-2">
          <div className="bg-kerb-near-black p-8">
            <p className="font-mono text-[11px] tracking-[0.2em] text-kerb-red uppercase">AI</p>
            <div className="mt-6 space-y-3">
              {["FINDS", "ANALYZES", "PACKAGES"].map((s, i) => (
                <motion.p
                  key={s}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="font-display text-2xl font-semibold text-kerb-white/70"
                >
                  {s}
                </motion.p>
              ))}
            </div>
          </div>
          <div className="bg-kerb-near-black p-8">
            <p className="font-mono text-[11px] tracking-[0.2em] text-kerb-white uppercase">STEWARD</p>
            <div className="mt-6 space-y-3">
              {["REVIEWS", "DECIDES"].map((s, i) => (
                <motion.p
                  key={s}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="font-display text-2xl font-bold text-kerb-white"
                >
                  {s}
                </motion.p>
              ))}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center font-display text-2xl font-medium text-kerb-muted md:text-3xl"
        >
          KERB is a steward copilot, not an automatic referee.
        </motion.p>
      </div>
    </section>
  );
}
