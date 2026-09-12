export interface CircuitViewBox {
  w: number;
  h: number;
}

export interface CircuitPathPoint {
  x: number;
  y: number;
  angle: number;
  t: number;
}

export interface SampledPath {
  total: number;
  points: CircuitPathPoint[];
}

// Deterministic SVG circuit paths + sampling helpers.
// Coordinates live in the SVG viewBox space; items are placed along the path
// using getPointAtLength so the layout is mathematically controlled and
// supports adding/removing evidence items without manual repositioning.

// Desktop serpentine circuit — long straights, sweeping curves, a tighter bend.
export const DESKTOP_PATH =
  "M 60 400 C 300 400 360 140 640 180 C 920 220 980 540 1280 540 C 1470 540 1520 320 1700 320 C 1850 320 1880 560 2080 560 C 2240 560 2300 360 2380 360";

export const DESKTOP_VIEWBOX: CircuitViewBox = {
  w: 2400,
  h: 760,
};

// Mobile vertical serpentine — compact diagonal path.
export const MOBILE_PATH =
  "M 380 60 C 380 300 140 360 180 640 C 220 920 540 980 540 1280 C 540 1470 320 1520 320 1700 C 320 1850 560 1880 560 2080 C 560 2240 360 2300 360 2380";

export const MOBILE_VIEWBOX: CircuitViewBox = {
  w: 760,
  h: 2400,
};

/**
 * Sample `count` evenly-spaced points along the path, each with its tangent angle.
 * Returns { total, points: [{ x, y, angle, t }] }.
 */
export function samplePathPoints(
  pathEl: SVGPathElement,
  count: number
): SampledPath {
  const total = pathEl.getTotalLength();

  const points: CircuitPathPoint[] = [];

  for (let i = 0; i < count; i++) {
    const len =
      count === 1
        ? 0
        : (i / (count - 1)) * total;

    const p = pathEl.getPointAtLength(len);

    const a = pathEl.getPointAtLength(
      Math.min(len + 1, total)
    );

    const b = pathEl.getPointAtLength(
      Math.max(len - 1, 0)
    );

    const angle =
      (Math.atan2(
        a.y - b.y,
        a.x - b.x
      ) *
        180) /
      Math.PI;

    points.push({
      x: p.x,
      y: p.y,
      angle,
      t: total
        ? len / total
        : 0,
    });
  }

  return {
    total,
    points,
  };
}