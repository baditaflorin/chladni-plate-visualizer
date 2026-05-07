import type { MaterialId, PlateSettings } from './types';

export const materialIds = ['steel', 'bronze', 'glass', 'carbon'] as const;

export interface MaterialPreset {
  id: MaterialId;
  label: string;
  stiffness: number;
  damping: number;
  tint: string;
}

export const materials: MaterialPreset[] = [
  { id: 'steel', label: 'Steel', stiffness: 0.018, damping: 0.028, tint: '#75d2ff' },
  { id: 'bronze', label: 'Bronze', stiffness: 0.014, damping: 0.035, tint: '#f2c14e' },
  { id: 'glass', label: 'Glass', stiffness: 0.026, damping: 0.016, tint: '#9be7c7' },
  { id: 'carbon', label: 'Carbon', stiffness: 0.033, damping: 0.022, tint: '#f4796b' },
];

export const defaultSettings: PlateSettings = {
  frequency: 256,
  damping: 0.028,
  stiffness: 0.018,
  drive: 0.055,
  audioGain: 0.85,
  modeX: 3,
  modeY: 5,
  particleCount: 6500,
  gridSize: 96,
  material: 'steel',
  audioMode: 'oscillator',
  sandPersistence: 0.74,
};

export function getMaterial(id: MaterialId): MaterialPreset {
  return materials.find((material) => material.id === id) ?? materials[0];
}
