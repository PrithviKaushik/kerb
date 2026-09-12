"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KerbTyreNav } from "./kerb-tyre-nav";

/**
 * The travelling command wheel — docked mini at top-center,
 * springs to screen center on tap. Sector taps route to pages.
 */
export function CommandWheel({
  activeId,
  onOpenChange,
  fixed = false,
}: {
  activeId?: string;
  onOpenChange?: (open: boolean) => void;
  /** Pin to the viewport (full pages) instead of the stage (landing). */
  fixed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div
      className={`${fixed ? "fixed" : "absolute"} left-1/2 z-20`}
      style={{
        top: open ? "50%" : 10,
        transform: open
          ? "translate(-50%, -50%) scale(1)"
          : "translate(-50%, 0) scale(0.42)",
        // Anchor to the top edge so the docked wheel tucks under the
        // viewport top on every screen size; origin stays constant so
        // the open/close travel never jumps.
        transformOrigin: "center top",
        transition:
          "top 0.75s cubic-bezier(0.3, 1.25, 0.5, 1), transform 0.75s cubic-bezier(0.3, 1.25, 0.5, 1)",
      }}
    >
      <KerbTyreNav
        open={open}
        onToggle={toggle}
        showSectors
        activeId={activeId}
        onSelect={(id) => router.push(`/${id}`)}
      />
    </div>
  );
}
