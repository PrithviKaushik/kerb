"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SECTOR_ICONS, SECTORS } from "@/lib/track-limits";

/**
 * KERB radial tyre navigation — medium-compound-inspired F1 tyre.
 * Docked mini at the top; springs open to a full command wheel.
 * Only the detailed rim assembly rotates — sectors and hub stay fixed.
 * Hub displays the KERB logo image.
 */

const CX = 240;
const CY = 240;
const OUTER = 206;
const INNER = 150;
const ICON_R = 178;
const NAME_R = 252;
const GAP = 3;
const SPAN = 360 / SECTORS.length;
const YELLOW = "#f7c600";
const YELLOW_HOT = "#ffd21f";

function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function annularSector(a0: number, a1: number): string {
  const [x0, y0] = polar(OUTER, a0);
  const [x1, y1] = polar(OUTER, a1);
  const [x2, y2] = polar(INNER, a1);
  const [x3, y3] = polar(INNER, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return (
    `M ${f(x0)} ${f(y0)} ` +
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${f(x1)} ${f(y1)} ` +
    `L ${f(x2)} ${f(y2)} ` +
    `A ${INNER} ${INNER} 0 ${large} 0 ${f(x3)} ${f(y3)} Z`
  );
}

type Props = {
  open: boolean;
  onToggle: () => void;
  /** Sector overlays — hidden on the landing page; shown on sector pages. */
  showSectors?: boolean;
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

export function KerbTyreNav({
  open,
  onToggle,
  showSectors = false,
  activeId,
  onSelect,
  className,
}: Props) {
  const [hotId, setHotId] = useState<string | null>(null);
  const [hubHot, setHubHot] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Docked hub opens the wheel everywhere. An expanded wheel's hub
  // is the home button (a no-op navigation on the landing page itself,
  // where it simply docks instead).
  const goHome = open && pathname !== "/";
  const handleHub = () => {
    if (!open || pathname === "/") onToggle();
    else router.push("/");
  };
  const activeIndex = activeId ? SECTORS.findIndex((s) => s.id === activeId) : -1;

  return (
    <div className={className ?? "w-[min(84vw,44dvh,380px)]"}>
      <svg
        viewBox="-70 -70 620 620"
        role="navigation"
        aria-label="Kerb command wheel"
        className="h-auto w-full"
        style={{ filter: "drop-shadow(0 28px 70px rgba(0,0,0,0.85))" }}
      >
        <defs>
          <radialGradient id="kerb-rubber" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#17181c" />
            <stop offset="55%" stopColor="#0e0f12" />
            <stop offset="82%" stopColor="#060607" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <radialGradient id="kerb-rim" cx="50%" cy="36%" r="72%">
            <stop offset="0%" stopColor="#1b1c21" />
            <stop offset="60%" stopColor="#101114" />
            <stop offset="100%" stopColor="#060607" />
          </radialGradient>
          <radialGradient id="kerb-hub" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#131418" />
            <stop offset="70%" stopColor="#08090b" />
            <stop offset="100%" stopColor="#030304" />
          </radialGradient>
          <filter id="kerb-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
              result="n"
            />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.08 0"
            />
          </filter>
          <filter id="kerb-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="kerb-bloom" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* grounding shadow */}
        <ellipse
          cx={CX}
          cy={452}
          rx={138}
          ry={13}
          fill="#000"
          opacity={open ? 0.6 : 0}
          filter="url(#kerb-soft)"
          style={{ transition: "opacity 0.5s ease" }}
        />

        {/* emissive halo */}
        <circle
          cx={CX}
          cy={CY}
          r={228}
          fill="none"
          stroke={YELLOW}
          strokeWidth={10}
          opacity={0.16}
          filter="url(#kerb-soft)"
        />

        {/* rubber body */}
        <circle cx={CX} cy={CY} r={228} fill="url(#kerb-rubber)" />
        <circle cx={CX} cy={CY} r={227} fill="none" stroke="#fff" strokeWidth={1.25} opacity={0.1} />
        <circle cx={CX} cy={CY} r={216} fill="none" stroke="#000" strokeWidth={5} opacity={0.55} />

        {/* grooves */}
        <circle cx={CX} cy={CY} r={196} fill="none" stroke="#000" strokeWidth={4} opacity={0.5} />
        <circle cx={CX} cy={CY} r={186} fill="none" stroke="#000" strokeWidth={4} opacity={0.5} />
        <circle cx={CX} cy={CY} r={204} fill="none" stroke="#fff" strokeWidth={1} opacity={0.05} />

        {/* rubber grain */}
        <circle cx={CX} cy={CY} r={206} fill="#000" filter="url(#kerb-grain)" opacity={0.55} />

        {/* yellow sidewall pinstripes + balance dot */}
        <circle cx={CX} cy={CY} r={220} fill="none" stroke={YELLOW} strokeWidth={3.5} opacity={0.95} />
        <circle cx={CX} cy={CY} r={213.5} fill="none" stroke={YELLOW} strokeWidth={1} opacity={0.4} />
        <circle cx={polar(205, 24)[0]} cy={polar(205, 24)[1]} r={5} fill={YELLOW_HOT} opacity={0.9} />

        {/* ===== icon sectors (sector pages only) ===== */}
        {showSectors &&
          SECTORS.map((sector, i) => {
          const center = i * SPAN - 90;
          const a0 = center - SPAN / 2 + GAP;
          const a1 = center + SPAN / 2 - GAP;
          const isActive = i === activeIndex;
          const isHot = hotId === sector.id && !isActive;
          const d = annularSector(a0, a1);
          const Icon = SECTOR_ICONS[sector.id];

          const [ex, ey] = polar(ICON_R, center);
          const [nx, ny] = polar(NAME_R, center);
          const [hx0, hy0] = polar(153, center);
          const [hx1, hy1] = polar(203, center);
          const [dx0, dy0] = polar(200, center);
          const stagger = 0.22 + i * 0.09;

          return (
            <motion.g
              key={sector.id}
              role="button"
              tabIndex={open ? 0 : -1}
              aria-label={sector.label}
              aria-pressed={isActive}
              className={open ? "cursor-pointer outline-none" : "pointer-events-none outline-none"}
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.25, delay: open ? stagger : 0 }}
              onClick={() => open && onSelect?.(sector.id)}
              onKeyDown={(e) => {
                if (open && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect?.(sector.id);
                }
              }}
              onMouseEnter={() => open && setHotId(sector.id)}
              onMouseLeave={() => setHotId((h) => (h === sector.id ? null : h))}
              onFocus={() => open && setHotId(sector.id)}
              onBlur={() => setHotId((h) => (h === sector.id ? null : h))}
            >
              {/* bloom */}
              <path
                d={d}
                fill={YELLOW_HOT}
                opacity={isActive && open ? 0.7 : 0}
                filter="url(#kerb-bloom)"
                style={{ transition: "opacity 0.45s ease" }}
              />
              {/* energy wash */}
              <path
                d={d}
                fill={YELLOW}
                style={{
                  transition: "fill-opacity 0.35s ease",
                  fillOpacity: isActive ? 0.22 : isHot ? 0.1 : 0.03,
                }}
              />
              {/* radial light spine */}
              <line
                x1={hx0}
                y1={hy0}
                x2={hx1}
                y2={hy1}
                stroke={YELLOW_HOT}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={isActive ? 0.9 : isHot ? 0.45 : 0}
                style={{ transition: "opacity 0.3s ease" }}
              />
              {isActive ? (
                <circle
                  cx={dx0}
                  cy={dy0}
                  r={3}
                  fill="#fff"
                  style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))" }}
                />
              ) : null}

              {/* icon */}
              <motion.g
                initial={false}
                animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.2 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 22,
                  delay: open ? stagger : 0,
                }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                <Icon
                  x={ex - 21}
                  y={ey - 21}
                  size={42}
                  strokeWidth={1.6}
                  color={isActive ? YELLOW_HOT : isHot ? "#ffffff" : "#c5c6ca"}
                  style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.7))" }}
                />
              </motion.g>

              {/* name */}
              <motion.text
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-display"
                fontSize={21}
                fontWeight={600}
                letterSpacing={4}
                fill={isActive ? "#ffffff" : isHot ? "#ffffff" : "rgba(255,255,255,0.78)"}
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.3, delay: open ? stagger + 0.08 : 0 }}
                style={{
                  transition: "fill 0.3s ease",
                  textShadow: "0 2px 14px rgba(0,0,0,0.85)",
                  ...(isActive
                    ? { filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))" }
                    : {}),
                }}
              >
                {sector.label}
              </motion.text>
            </motion.g>
          );
          })}

        {/* ===== radial dividers (sector pages only) ===== */}
        {showSectors &&
          SECTORS.map((_, i) => {
          const b = -SPAN / 2 - 90 + i * SPAN;
          const [x0, y0] = polar(150, b);
          const [x1, y1] = polar(206, b);
          const adjActive =
            open &&
            (activeIndex === i || activeIndex === (i + SECTORS.length - 1) % SECTORS.length);
          return (
            <line
              key={`div-${i}`}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke={adjActive ? YELLOW_HOT : "rgba(255,255,255,0.10)"}
              strokeWidth={adjActive ? 1.5 : 1}
              opacity={open ? 1 : 0}
              style={{
                transition: "stroke 0.35s ease, opacity 0.35s ease",
                ...(adjActive
                  ? { filter: "drop-shadow(0 0 5px rgba(255,210,31,0.9))" }
                  : {}),
              }}
            />
          );
          })}

        {/* ===== rim base ===== */}
        <circle cx={CX} cy={CY} r={150} fill="url(#kerb-rim)" />

        {/* ===== rotating rim assembly (spokes, disc, bolts) ===== */}
        <g
          className="kerb-spin-slow"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {/* brake disc */}
          <circle cx={CX} cy={CY} r={108} fill="#0a0b0e" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          {Array.from({ length: 12 }).map((_, k) => {
            const [dx, dy] = polar(96, k * 30);
            return <circle key={`drill-${k}`} cx={dx} cy={dy} r={2.5} fill="#232429" />;
          })}
          {/* spokes */}
          {Array.from({ length: 6 }).map((_, k) => {
            const a = k * 60 - 60;
            return (
              <g key={`spoke-${k}`} transform={`rotate(${a} ${CX} ${CY})`}>
                <rect
                  x={CX - 13}
                  y={CY - 144}
                  width={26}
                  height={58}
                  rx={11}
                  fill="#1c1d22"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={1}
                />
                <line
                  x1={CX - 7}
                  y1={CY - 138}
                  x2={CX - 7}
                  y2={CY - 92}
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          {/* wheel bolts — turn with the rim */}
          {SECTORS.map((s, i) => {
            const [bx, by] = polar(120, i * SPAN - 90);
            return (
              <circle
                key={`bolt-${s.id}`}
                cx={bx}
                cy={by}
                r={4.5}
                fill="#1e1f23"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth={1}
              />
            );
          })}
        </g>

        {/* static lip over the spoke tips */}
        <circle cx={CX} cy={CY} r={146} fill="none" stroke="#2a2c31" strokeWidth={4} />
        <circle cx={CX} cy={CY} r={143} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        <circle
          cx={CX}
          cy={CY}
          r={149}
          fill="none"
          stroke={YELLOW}
          strokeWidth={2}
          opacity={0.5}
        />
        <circle cx={CX} cy={CY} r={132} fill="none" stroke="#fff" strokeWidth={1} opacity={0.07} />

        {/* ===== hub — "K" now, logo image later ===== */}
        <g
          role="button"
          tabIndex={0}
          aria-label={!open ? "Open command wheel" : goHome ? "Go to homepage" : "Dock command wheel"}
          className="cursor-pointer outline-none"
          onClick={handleHub}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleHub();
            }
          }}
          onMouseEnter={() => setHubHot(true)}
          onMouseLeave={() => setHubHot(false)}
          onFocus={() => setHubHot(true)}
          onBlur={() => setHubHot(false)}
        >
          {/* center-lock ring */}
          <circle
            cx={CX}
            cy={CY}
            r={82}
            fill="none"
            stroke="#2b2c31"
            strokeWidth={5}
          />
          <circle cx={CX} cy={CY} r={86} fill="none" stroke="#fff" strokeWidth={1} opacity={0.06} />
          <circle cx={CX} cy={CY} r={78} fill="url(#kerb-hub)" />
          <circle
            cx={CX}
            cy={CY}
            r={77}
            fill="none"
            stroke={hubHot ? "#ffffff" : "#fff"}
            strokeWidth={hubHot ? 2 : 1.5}
            opacity={hubHot ? 0.85 : 0.1}
            style={{ transition: "opacity 0.3s ease" }}
          />
          <circle cx={CX} cy={CY} r={70} fill="none" stroke="#000" strokeWidth={1} opacity={0.7} />
          <image
            href="/logo.png"
            x={CX - 75}
            y={CY - 75}
            width={150}
            height={150}
            style={{ pointerEvents: "none" }}
          />
        </g>
      </svg>
    </div>
  );
}
