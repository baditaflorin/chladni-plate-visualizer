import { describe, expect, it } from 'vitest';

import { frequencyToModes, modalShape, normalizeBands, rms } from './chladni';

describe('chladni math', () => {
  it('creates modal nodes at plate edges', () => {
    expect(modalShape(0, 0.5, 3, 5)).toBeCloseTo(0);
    expect(modalShape(1, 0.5, 3, 5)).toBeCloseTo(0);
  });

  it('maps frequency to bounded modal indices', () => {
    expect(frequencyToModes(20)).toEqual({ modeX: 1, modeY: 2 });
    expect(frequencyToModes(4000)).toEqual({ modeX: 12, modeY: 12 });
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
