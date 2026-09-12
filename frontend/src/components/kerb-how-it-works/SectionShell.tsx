import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utlis";
import TechnicalLabel, { HudCoord } from "./TechnicalLabel";

interface SectionShellProps {
  id?: string;
  label?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hudX?: string;
  hudY?: string;
}

const SectionShell = forwardRef<HTMLElement, SectionShellProps>(function SectionShell(
  { id, label, title, children, className, hudX = "124.2", hudY = "88.1" },
  ref
) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn("relative w-full overflow-hidden bg-kerb-black px-6 py-28 md:px-16 md:py-40", className)}
    >
      <div className="mx-auto max-w-[1400px]">
        {(label || title) && (
          <div className="mb-16 md:mb-24">
            {label && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <TechnicalLabel accent>{label}</TechnicalLabel>
              </motion.div>
            )}
            {title && (
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[0.95] tracking-tight text-kerb-white md:text-6xl"
              >
                {title}
              </motion.h2>
            )}
          </div>
        )}
        {children}
      </div>
      <div className="absolute right-6 top-6 hidden md:block">
        <HudCoord x={hudX} y={hudY} />
      </div>
    </section>
  );
});

export default SectionShell;
