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

export function frequencyToModes(frequency: number) {
  const scaled = clamp(Math.round(Math.sqrt(frequency / 18)), 1, 12);
  return {
    modeX: clamp(scaled, 1, 12),
    modeY: clamp(Math.round(scaled * 1.58), 1, 12),
  };
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
