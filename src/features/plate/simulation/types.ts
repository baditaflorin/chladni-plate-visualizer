import type { AudioBands, PlateSettings, SolverKind } from '../types';

export interface SolverFrame {
  field: Float32Array;
  energy: number;
}

export interface StepInput {
  settings: PlateSettings;
  bands: AudioBands;
  time: number;
  dt: number;
}

export interface PlateSolver {
  readonly kind: SolverKind;
  readonly size: number;
  step(input: StepInput): Promise<SolverFrame>;
  dispose(): void;
}
