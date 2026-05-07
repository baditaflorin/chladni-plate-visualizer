import type { StoredPlateSettings } from '../../lib/storage';

export type AudioMode = 'oscillator' | 'file' | 'microphone' | 'silent';
export type SolverKind = 'webgpu' | 'cpu';
export type MaterialId = 'steel' | 'bronze' | 'glass' | 'carbon';

export type PlateSettings = StoredPlateSettings;

export interface AudioBands {
  bass: number;
  mid: number;
  high: number;
  level: number;
  dominantFrequency: number;
}

export interface RuntimeStats {
  fps: number;
  solver: SolverKind;
  energy: number;
  particles: number;
}

export interface BuildInfo {
  schemaVersion: number;
  version: string;
  commit: string;
  fullCommit: string;
  builtAt: string;
  repositoryUrl: string;
  paypalUrl: string;
  pagesUrl: string;
}
