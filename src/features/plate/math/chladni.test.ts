import { describe, expect, it } from 'vitest';

import {
  FUNDAMENTAL_HZ,
  frequencyToModes,
  modeFrequency,
  modalShape,
  normalizeBands,
  rms,
} from './chladni';

describe('chladni math', () => {
  it('creates modal nodes at plate edges', () => {
    expect(modalShape(0, 0.5, 3, 5)).toBeCloseTo(0);
    expect(modalShape(1, 0.5, 3, 5)).toBeCloseTo(0);
  });

  it('normalizes spectral bands and peak frequency', () => {
    const values = new Uint8Array(16);
    values[1] = 255;
    values[8] = 128;
    const bands = normalizeBands(values, 1024);
    expect(bands.bass).toBeGreaterThan(0);
    expect(bands.level).toBeGreaterThan(0);
    expect(bands.dominantFrequency).toBe(32);
  });

  it('computes root mean square energy', () => {
    expect(rms(new Float32Array([1, -1, 1, -1]))).toBe(1);
  });
});

describe('frequencyToModes', () => {
  it('snaps the fundamental frequency to the (1,1) mode', () => {
    expect(frequencyToModes(FUNDAMENTAL_HZ)).toEqual({ modeX: 1, modeY: 1 });
  });

  it("picks higher-order modes as frequency climbs the plate's eigenvalue ladder", () => {
    // Eigenfrequency of (m,n) scales with (m^2 + n^2). With FUNDAMENTAL_HZ
    // = 128, mode (2,2) lives at 4 * 128 = 512 Hz, (3,3) at 9 * 128.
    expect(frequencyToModes(512)).toEqual({ modeX: 2, modeY: 2 });
    expect(frequencyToModes(modeFrequency(3, 3))).toEqual({ modeX: 3, modeY: 3 });
  });

  it('returns distinct mode shapes for distinct frequencies — no fixed aspect ratio', () => {
    // The old implementation always returned modeY ≈ modeX * 1.58, so every
    // distinct frequency landed on the same shape ratio. After this fix the
    // selected modes should span a real range, including some equal-mode
    // pairs and some asymmetric ones.
    const seenShapes = new Set<string>();
    for (let hz = 60; hz <= 4000; hz += 30) {
      const { modeX, modeY } = frequencyToModes(hz);
      seenShapes.add(`${modeX}x${modeY}`);
    }
    // Old impl collapsed to ~12 shapes (one per scaled int output) because
    // modeY was always round(modeX * 1.58). The eigenvalue search produces
    // a richer set of (m,n) pairs across the same frequency sweep.
    expect(seenShapes.size).toBeGreaterThan(15);
  });

  it('stays within the 12x12 bounded grid', () => {
    const { modeX, modeY } = frequencyToModes(10_000);
    expect(modeX).toBeGreaterThanOrEqual(1);
    expect(modeX).toBeLessThanOrEqual(12);
    expect(modeY).toBeGreaterThanOrEqual(1);
    expect(modeY).toBeLessThanOrEqual(12);
  });
});

describe('modeFrequency', () => {
  it('round-trips with frequencyToModes for representable modes', () => {
    for (const [m, n] of [
      [1, 1],
      [2, 3],
      [4, 5],
      [3, 7],
      [6, 8],
    ] as const) {
      const f = modeFrequency(m, n);
      expect(frequencyToModes(f)).toEqual({ modeX: m, modeY: n });
    }
  });
});
