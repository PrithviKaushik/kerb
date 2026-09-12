"use client";

import { useState } from "react";
import { CommandWheel } from "../command-wheel";

/**
 * Fixed nav-wheel shell for full pages (e.g. /evidence).
 * Docked mini at the viewport top; springs to screen center on tap,
 * dimming the page behind it in glass. `active` lights the current
 * section — sector taps route to their pages.
 */
export default function RadialNav({ active, local = false }: { active?: string; local?: boolean }) {
  const [glass, setGlass] = useState(false);

  return (
    <>
      <div
        aria-hidden
        className={`fixed inset-0 z-10 transition-all duration-700 ${
          glass ? "bg-black/35 opacity-100 backdrop-blur-xl" : "pointer-events-none opacity-0"
        }`}
      />
      <CommandWheel fixed={!local} local={local} activeId={active} onOpenChange={setGlass} />
    </>
  );
}
