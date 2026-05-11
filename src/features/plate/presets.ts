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

// Named Chladni patterns the user can jump straight to. Each one names a
// recognisable nodal-line shape and ships with the (m,n) mode plus a driving
// frequency that lands on that mode at the default fundamental. Picking one
// is the fastest path from "I opened the page" to "I see the cross / star /
// concentric squares I was hoping to see".
export interface ChladniPattern {
  id: string;
  label: string;
  description: string;
  modeX: number;
  modeY: number;
  frequency: number;
}

export const chladniPatterns: ChladniPattern[] = [
  {
    id: 'fundamental',
    label: 'Fundamental (1,1)',
    description: 'A single antinode in the middle, calm border.',
    modeX: 1,
    modeY: 1,
    frequency: 128,
  },
  {
    id: 'cross',
    label: 'Cross (2,2)',
    description: 'Two nodal lines across the centre form a crisp cross.',
    modeX: 2,
    modeY: 2,
    frequency: 512,
  },
  {
    id: 'plus-and-bars',
    label: 'Three bars (1,3)',
    description: 'Horizontal bars from a low-mode-x, mid-mode-y excitation.',
    modeX: 1,
    modeY: 3,
    frequency: 640,
  },
  {
    id: 'tic-tac-toe',
    label: 'Tic-tac-toe (3,3)',
    description: 'Nine-cell square grid — a Chladni classic.',
    modeX: 3,
    modeY: 3,
    frequency: 1152,
  },
  {
    id: 'fine-grid',
    label: 'Fine grid (4,4)',
    description: 'Sixteen square cells, sand pushed into tight ridges.',
    modeX: 4,
    modeY: 4,
    frequency: 2048,
  },
  {
    id: 'long-rectangles',
    label: 'Long rectangles (2,5)',
    description: 'Strong asymmetric pattern — short on one axis, long on the other.',
    modeX: 2,
    modeY: 5,
    frequency: 1856,
  },
  {
    id: 'starburst',
    label: 'Starburst (5,5)',
    description: 'Dense 5x5 grid that reads as a starry array at full drive.',
    modeX: 5,
    modeY: 5,
    frequency: 3200,
  },
];
