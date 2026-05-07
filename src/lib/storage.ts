import { z } from 'zod';

import { materialIds } from '../features/plate/presets';

const settingsSchema = z.object({
  frequency: z.number().min(20).max(4000),
  damping: z.number().min(0.001).max(0.12),
  stiffness: z.number().min(0.001).max(0.08),
  drive: z.number().min(0).max(0.18),
  audioGain: z.number().min(0).max(2),
  modeX: z.number().int().min(1).max(12),
  modeY: z.number().int().min(1).max(12),
  particleCount: z.number().int().min(1000).max(12000),
  gridSize: z.union([z.literal(72), z.literal(96), z.literal(128)]),
  material: z.enum(materialIds),
  audioMode: z.enum(['oscillator', 'file', 'microphone', 'silent']),
  sandPersistence: z.number().min(0).max(1),
});

export type StoredPlateSettings = z.infer<typeof settingsSchema>;

const key = 'chladni-plate-settings-v1';

export function loadSettings(defaults: StoredPlateSettings): StoredPlateSettings {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return defaults;
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    return defaults;
  }

  const parsed = settingsSchema.safeParse(candidate);
  if (!parsed.success) {
    return defaults;
  }

  return parsed.data;
}

export function saveSettings(settings: StoredPlateSettings) {
  const parsed = settingsSchema.parse(settings);
  window.localStorage.setItem(key, JSON.stringify(parsed));
}

export function clearSettings() {
  window.localStorage.removeItem(key);
}
