import { clamp, modalShape, rms } from '../math/chladni';
import type { PlateSolver, SolverFrame, StepInput } from './types';

export class CpuPlateSolver implements PlateSolver {
  readonly kind = 'cpu' as const;
  readonly size: number;
  private current: Float32Array;
  private previous: Float32Array;
  private next: Float32Array;

  constructor(size: number) {
    this.size = size;
    const count = size * size;
    this.current = new Float32Array(count);
    this.previous = new Float32Array(count);
    this.next = new Float32Array(count);
    this.seed();
  }

  async step(input: StepInput): Promise<SolverFrame> {
    const { settings, bands, time } = input;
    const width = this.size;
    const height = this.size;
    const omega = Math.PI * 2 * settings.frequency;
    this.next.fill(0);

    for (let y = 2; y < height - 2; y += 1) {
      for (let x = 2; x < width - 2; x += 1) {
        const index = y * width + x;
        const center = this.current[index] ?? 0;
        const north = this.current[index - width] ?? 0;
        const south = this.current[index + width] ?? 0;
        const east = this.current[index + 1] ?? 0;
        const west = this.current[index - 1] ?? 0;
        const northEast = this.current[index - width + 1] ?? 0;
        const northWest = this.current[index - width - 1] ?? 0;
        const southEast = this.current[index + width + 1] ?? 0;
        const southWest = this.current[index + width - 1] ?? 0;
        const northNorth = this.current[index - 2 * width] ?? 0;
        const southSouth = this.current[index + 2 * width] ?? 0;
        const eastEast = this.current[index + 2] ?? 0;
        const westWest = this.current[index - 2] ?? 0;

        const biharmonic =
          20 * center -
          8 * (north + south + east + west) +
          2 * (northEast + northWest + southEast + southWest) +
          northNorth +
          southSouth +
          eastEast +
          westWest;

        const fx = x / (width - 1);
        const fy = y / (height - 1);
        const modal =
          modalShape(fx, fy, settings.modeX, settings.modeY) +
          bands.bass * modalShape(fx, fy, 1, 1) +
          bands.mid * modalShape(fx, fy, 2, 3) +
          bands.high * modalShape(fx, fy, 5, 4);
        const forcing = settings.drive * settings.audioGain * modal * Math.sin(omega * time);
        const velocity = center - (this.previous[index] ?? 0);
        this.next[index] = clamp(
          2 * center -
            (this.previous[index] ?? 0) -
            settings.damping * velocity -
            settings.stiffness * biharmonic +
            forcing,
          -1,
          1,
        );
      }
    }

    const oldPrevious = this.previous;
    this.previous = this.current;
    this.current = this.next;
    this.next = oldPrevious;

    return {
      field: this.current.slice(),
      energy: rms(this.current),
    };
  }

  dispose() {
    this.current = new Float32Array(0);
    this.previous = new Float32Array(0);
    this.next = new Float32Array(0);
  }

  private seed() {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        const index = y * this.size + x;
        const fx = x / (this.size - 1);
        const fy = y / (this.size - 1);
        const value = 0.003 * modalShape(fx, fy, 2, 3);
        this.current[index] = value;
        this.previous[index] = value;
      }
    }
  }
}
