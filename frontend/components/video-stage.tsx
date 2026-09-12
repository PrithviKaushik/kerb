"use client";

import { useState, type ReactNode } from "react";

/** Full-screen looping video stage with legibility layers and glass wash. */
export function VideoStage({
  glass,
  src = "/BGYAS.mp4",
  soft = false,
  children,
}: {
  glass: boolean;
  /** Background loop for this stage — landing keeps BGYAS, pages use their own. */
  src?: string;
  /** Slight blur + overscan to mask low-resolution loops. */
  soft?: boolean;
  children: ReactNode;
}) {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <main className="relative h-dvh overflow-hidden bg-black text-white">
      <video
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-out ${
          videoReady ? "opacity-100" : "opacity-0"
        } ${soft ? "scale-105 blur-[2px]" : ""}`}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
      />
      {/* legibility layers */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* translucent glass wash when the wheel is open */}
      <div
        aria-hidden
        className={`absolute inset-0 z-[15] transition-all duration-700 ${
          glass ? "bg-black/35 opacity-100 backdrop-blur-xl" : "pointer-events-none opacity-0"
        }`}
      />

      {children}
    </main>
  );
}
