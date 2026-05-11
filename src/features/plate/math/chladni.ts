import type { AudioBands } from '../types';

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function modalShape(x: number, y: number, modeX: number, modeY: number) {
  return Math.sin(Math.PI * modeX * x) * Math.sin(Math.PI * modeY * y);
}

export function normalizeBands(values: Uint8Array, sampleRate: number): AudioBands {
  if (values.length === 0) {
    return { bass: 0, mid: 0, high: 0, level: 0, dominantFrequency: 0 };
  }

  const nyquist = sampleRate / 2;
  const binHz = nyquist / values.length;
  let bass = 0;
  let bassCount = 0;
  let mid = 0;
  let midCount = 0;
  let high = 0;
  let highCount = 0;
  let total = 0;
  let peak = 0;
  let peakIndex = 0;

  values.forEach((value, index) => {
    const hz = index * binHz;
    const normalized = value / 255;
    total += normalized;
    if (normalized > peak) {
      peak = normalized;
      peakIndex = index;
    }
    if (hz < 250) {
      bass += normalized;
      bassCount += 1;
    } else if (hz < 2400) {
      mid += normalized;
      midCount += 1;
    } else {
      high += normalized;
      highCount += 1;
    }
  });

  return {
    bass: bassCount ? bass / bassCount : 0,
    mid: midCount ? mid / midCount : 0,
    high: highCount ? high / highCount : 0,
    level: total / values.length,
    dominantFrequency: peakIndex * binHz,
  };
}

// Reference frequency at which the fundamental (1,1) mode resonates for our
// default plate. Picked so the bundled audio presets — 256 Hz, 440 Hz, 880 Hz —
// land on visually distinct modal patterns rather than all collapsing into
// the same shape. A real plate's value depends on stiffness, density, and
// dimensions; users tune it implicitly via the stiffness/material controls.
export const FUNDAMENTAL_HZ = 128;

// frequencyToModes used to return modeX = round(sqrt(freq/18)) and
// modeY = round(modeX * 1.58) — a fixed-ratio mapping that produced the same
// boring aspect mode shape at every frequency. Real Chladni plates resonate
// at eigenfrequencies f_{m,n} that scale with (m² + n²) for a simply-
// supported square plate. Instead of inventing a ratio, search the (m,n)
// grid for the pair whose eigenfrequency is closest to the driver, breaking
// ties toward lower mode order (more visible nodal lines).
export function frequencyToModes(frequency: number) {
  const safe = Math.max(1, frequency);
  const ratio = safe / FUNDAMENTAL_HZ;
  // (1,1) sits at sum = 2, so the squared-mode sum we want is 2 * ratio.
  // Walk a bounded mode grid to find the (m,n) with the smallest residual.
  let bestModeX = 1;
  let bestModeY = 1;
  let bestError = Number.POSITIVE_INFINITY;
  for (let m = 1; m <= 12; m += 1) {
    for (let n = m; n <= 12; n += 1) {
      const eigenSum = m * m + n * n;
      const eigenRatio = eigenSum / 2;
      const error = Math.abs(eigenRatio - ratio);
      if (error < bestError || (error === bestError && m + n < bestModeX + bestModeY)) {
        bestError = error;
        bestModeX = m;
        bestModeY = n;
      }
    }
  }
  return { modeX: bestModeX, modeY: bestModeY };
}

// modeFrequency reports the eigenfrequency (Hz) of a given (m,n) mode under
// the same calibration frequencyToModes uses. Useful for "snap to mode"
// controls and for showing the resonant frequency next to the mode label.
export function modeFrequency(modeX: number, modeY: number): number {
  return FUNDAMENTAL_HZ * ((modeX * modeX + modeY * modeY) / 2);
}

export function rms(field: Float32Array) {
  if (field.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const value of field) {
    sum += value * value;
  }
  return Math.sqrt(sum / field.length);
}
