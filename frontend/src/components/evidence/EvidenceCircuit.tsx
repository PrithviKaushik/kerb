"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { AnimatePresence } from "framer-motion";
import EvidenceTrack from "./EvidenceTrack";
import EvidenceItem from "./EvidenceItem";
import EvidenceMetadata from "./EvidenceMetadata";
import EvidenceProgress from "./EvidenceProgress";
import EvidenceDetail from "./EvidenceDetail";
import {
  DESKTOP_PATH,
  DESKTOP_VIEWBOX,
  MOBILE_PATH,
  MOBILE_VIEWBOX,
  samplePathPoints,
} from "./circuitPath";
import { useIsMobile } from "@/hooks/use-mobile";
import { Maximize2 } from "lucide-react";
import type { EvidenceItem as EvidenceItemType } from "@/data/evidence";

const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));

const lerp = (a: number, b: number, t: number) =>
  a + (b - a) * t;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const onChange = () => setReduced(mq.matches);

    onChange();
    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

interface EvidenceCircuitProps {
  items: EvidenceItemType[];
}

interface PathPoint {
  x: number;
  y: number;
  angle: number;
}

interface CameraPoint {
  x: number;
  y: number;
}

export default function EvidenceCircuit({
  items,
}: EvidenceCircuitProps) {
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  const pathD = isMobile ? MOBILE_PATH : DESKTOP_PATH;
  const viewBox = isMobile ? MOBILE_VIEWBOX : DESKTOP_VIEWBOX;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [pathEl, setPathEl] = useState<SVGPathElement | null>(null);

  const [total, setTotal] = useState<number>(0);
  const [points, setPoints] = useState<PathPoint[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  // Sample item anchor points when the path mounts (keyed by pathD
  // so breakpoint switches remount and resample). Measuring in the
  // ref callback keeps DOM reads out of render and effects.
  const measure = useCallback(
    (el: SVGPathElement | null) => {
      setPathEl(el);

      if (!el) return;

      const { total: t, points: pts } = samplePathPoints(
        el,
        items.length
      );

      setTotal(t);
      setPoints(pts);
    },
    [items.length]
  );

  // Map page scroll to a 0..1 camera position along the path.
  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        const sec = sectionRef.current;

        if (!sec) return;

        const range =
          sec.offsetHeight - window.innerHeight;

        if (range <= 0) {
          setProgress(0);
          return;
        }

        const traveled = clamp(
          -sec.getBoundingClientRect().top / range,
          0,
          1
        );

        setProgress(traveled);
      });
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    window.addEventListener("resize", onScroll);

    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const n = items.length;

  const activeIndex =
    n > 0
      ? Math.round(progress * (n - 1))
      : 0;

  const camT = reduced
    ? activeIndex / Math.max(1, n - 1)
    : progress;

  // Camera point on the path at the current progress.
  let cam: CameraPoint | null = null;

  if (total && pathEl) {
    const p = pathEl.getPointAtLength(
      camT * total
    );

    cam = {
      x: p.x,
      y: p.y,
    };
  }

  const vw =
    typeof window !== "undefined"
      ? window.innerWidth
      : 1440;

  const vh =
    typeof window !== "undefined"
      ? window.innerHeight
      : 800;

  const focalX = vw / 2;
  const focalY = vh * 0.44;

  const tx = cam ? focalX - cam.x : 0;
  const ty = cam ? focalY - cam.y : 0;

  const gap =
    n > 1
      ? total / (n - 1)
      : total;

  const focalLen = gap * 1.7 || 1;

  const goTo = useCallback(
    (i: number) => {
      const sec = sectionRef.current;

      if (!sec) return;

      const target =
        n > 1
          ? i / (n - 1)
          : 0;

      const range =
        sec.offsetHeight - window.innerHeight;

      const top =
        sec.getBoundingClientRect().top +
        window.scrollY;

      window.scrollTo({
        top: top + target * range,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [n, reduced]
  );

  // Keyboard navigation while the gallery is in view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const sec = sectionRef.current;

      if (!sec) return;

      if (detailOpen) {
        if (e.key === "Escape") {
          setDetailOpen(false);
        }

        return;
      }

      const r = sec.getBoundingClientRect();

      const inView =
        r.top <= 0 &&
        r.bottom >= window.innerHeight;

      if (!inView) return;

      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();

        goTo(
          Math.min(
            n - 1,
            activeIndex + 1
          )
        );
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();

        goTo(
          Math.max(
            0,
            activeIndex - 1
          )
        );
      } else if (e.key === "Enter") {
        setDetailOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);

    return () =>
      window.removeEventListener("keydown", onKey);
  }, [
    activeIndex,
    n,
    goTo,
    detailOpen,
  ]);

  const activeItem = items[activeIndex];
  const activePoint = points[activeIndex];

  const activeScreen =
    activePoint && cam
      ? {
          x: activePoint.x + tx,
          y: activePoint.y + ty,
        }
      : null;

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{
        height: `${n * 90}vh`,
      }}
      aria-label="Evidence circuit"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="kerb-atmosphere absolute inset-0" />

        {/* moving stage: path + evidence items */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: viewBox.w,
            height: viewBox.h,
            transform: `translate3d(${tx}px, ${ty}px, 0)`,
            opacity: detailOpen ? 0.22 : 1,
            filter: detailOpen
              ? "blur(6px)"
              : "none",
            transition: reduced
              ? "none"
              : "opacity 0.5s ease, filter 0.5s ease",
            willChange: "transform",
          }}
        >
          <EvidenceTrack
            key={pathD}
            ref={measure}
            pathD={pathD}
            viewBox={viewBox}
            exploredPct={camT}
            activePoint={cam}
            reduced={reduced}
          />

          {points.map((pt, i) => {
            const d =
              Math.abs(
                i /
                  Math.max(1, n - 1) -
                  camT
              ) * total;

            const nd = clamp(
              d / focalLen,
              0,
              1
            );

            const scale = lerp(
              1.5,
              0.46,
              nd
            );

            const opacity = lerp(
              1,
              0.16,
              nd
            );

            if (opacity < 0.06) {
              return null;
            }

            const blur = reduced
              ? 0
              : clamp(
                  (nd - 0.3) / 0.7,
                  0,
                  1
                ) * 8;

            const rotation =
              clamp(
                pt.angle,
                -24,
                24
              ) *
              (isMobile ? 0.12 : 0.22);

            return (
              <EvidenceItem
                key={items[i].id}
                item={items[i]}
                active={
                  i === activeIndex
                }
                reduced={reduced}
                onClick={() => goTo(i)}
                style={{
                  left: pt.x,
                  top: pt.y,
                  zIndex: Math.round(
                    (1 - nd) * 100
                  ),
                }}
                scale={scale}
                opacity={opacity}
                blur={blur}
                rotation={rotation}
              />
            );
          })}
        </div>

        <EvidenceProgress
          index={activeIndex}
          total={n}
          item={activeItem}
        />

        <div className="absolute inset-x-0 bottom-0 z-40 px-4 pb-8 sm:pb-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
            <EvidenceMetadata
              item={activeItem}
            />

            <button
              type="button"
              onClick={() =>
                setDetailOpen(true)
              }
              className="group inline-flex items-center gap-2 rounded-full border border-kerb-red/60 bg-kerb-red/10 px-6 py-2.5 font-mono-tech text-[11px] tracking-[0.25em] text-kerb-white transition hover:border-kerb-red hover:bg-kerb-red/25"
            >
              <Maximize2 className="h-3.5 w-3.5 text-kerb-red" />
              VIEW EVIDENCE
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {detailOpen && activeItem && (
          <EvidenceDetail
            item={activeItem}
            origin={activeScreen}
            onClose={() =>
              setDetailOpen(false)
            }
            reduced={reduced}
          />
        )}
      </AnimatePresence>
    </section>
  );
}