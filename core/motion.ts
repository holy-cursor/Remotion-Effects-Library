/**
 * Motion tokens. Every function is a pure map from progress (0..1) to a value,
 * so effects stay seekable and deterministic in Remotion.
 */

export const clamp01 = (p: number) =>
  Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));

/** Map p from [a, b] to [0, 1], clamped. */
export const phase = (p: number, a: number, b: number) =>
  clamp01((p - a) / (b - a || 1e-9));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Per-item stagger: item i of n starts later; `spread` is the share of the timeline used for offsets. */
export const stagger = (p: number, i: number, n: number, spread = 0.5) => {
  const start = n <= 1 ? 0 : (i / (n - 1)) * spread;
  return phase(p, start, start + (1 - spread));
};

export const ease = {
  linear: (t: number) => clamp01(t),
  inCubic: (t: number) => clamp01(t) ** 3,
  outCubic: (t: number) => 1 - (1 - clamp01(t)) ** 3,
  outQuart: (t: number) => 1 - (1 - clamp01(t)) ** 4,
  outQuint: (t: number) => 1 - (1 - clamp01(t)) ** 5,
  inOutCubic: (t: number) => {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  },
  inOutQuint: (t: number) => {
    const x = clamp01(t);
    return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2;
  },
  outExpo: (t: number) => {
    const x = clamp01(t);
    return x === 1 ? 1 : 1 - 2 ** (-10 * x);
  },
  inOutExpo: (t: number) => {
    const x = clamp01(t);
    if (x === 0 || x === 1) return x;
    return x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2;
  },
  /** Slight overshoot; good for pops. */
  outBack: (t: number, s = 1.6) => {
    const x = clamp01(t) - 1;
    return 1 + (s + 1) * x ** 3 + s * x ** 2;
  },
  smooth: (t: number) => {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
  },
};

export type SpringToken = { damping: number; frequency: number };

/** Named spring feels. `damping` is the damping ratio (1 = no overshoot). */
export const springs = {
  /** UI pop: quick, one small overshoot. */
  snappy: { damping: 0.62, frequency: 2.4 },
  /** Hero settle: soft overshoot, long tail. */
  soft: { damping: 0.72, frequency: 1.6 },
  /** Bouncy, for playful text. */
  bouncy: { damping: 0.42, frequency: 2.8 },
  /** Critically damped, no overshoot. */
  firm: { damping: 1, frequency: 2.2 },
} as const satisfies Record<string, SpringToken>;

/**
 * Closed-form damped spring from 0 to 1 over t in [0, 1].
 * Always returns exactly 1 at t >= 1 so final frames are stable.
 */
export function spring01(t: number, s: SpringToken = springs.soft): number {
  const x = clamp01(t);
  if (x >= 1) return 1;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * s.frequency;
  const z = Math.min(0.999, Math.max(0.05, s.damping));
  const wd = w * Math.sqrt(1 - z * z);
  const decay = Math.exp(-z * w * x);
  const v = 1 - decay * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
  // Blend into 1 over the last 15% so the endpoint is exact.
  const tail = phase(x, 0.85, 1);
  return lerp(v, 1, ease.smooth(tail));
}

/** Deterministic hash → [0, 1). */
export const hash01 = (i: number, seed = 0) => {
  const h = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
