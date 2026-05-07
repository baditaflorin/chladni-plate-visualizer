import * as THREE from 'three';

import { CpuPlateSolver } from '../simulation/CpuPlateSolver';
import { GpuPlateSolver } from '../simulation/GpuPlateSolver';
import type { PlateSolver } from '../simulation/types';
import type { AudioBands, PlateSettings, RuntimeStats } from '../types';

interface SceneOptions {
  canvas: HTMLCanvasElement;
  settings: PlateSettings;
  getAudioBands: () => AudioBands;
  onStats: (stats: RuntimeStats) => void;
  onError: (message: string) => void;
}

interface SandParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class ChladniScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private readonly plateGeometry: THREE.PlaneGeometry;
  private readonly plateMesh: THREE.Mesh;
  private readonly sandGeometry = new THREE.BufferGeometry();
  private readonly sandPositions: Float32Array;
  private readonly sandColors: Float32Array;
  private readonly sand: SandParticle[];
  private readonly sandPoints: THREE.Points;
  private readonly clock = new THREE.Clock();
  private readonly getAudioBands: () => AudioBands;
  private readonly onStats: (stats: RuntimeStats) => void;
  private readonly onError: (message: string) => void;
  private solver: PlateSolver;
  private settings: PlateSettings;
  private frame: Float32Array;
  private running = true;
  private pending = false;
  private frameCount = 0;
  private fpsTime = performance.now();
  private fps = 0;
  private energy = 0;
  private animationId = 0;

  private constructor(options: SceneOptions, solver: PlateSolver) {
    this.canvas = options.canvas;
    this.settings = options.settings;
    this.getAudioBands = options.getAudioBands;
    this.onStats = options.onStats;
    this.onError = options.onError;
    this.solver = solver;
    this.frame = new Float32Array(solver.size * solver.size);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x111315, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera.position.set(0, -4.15, 3.15);
    this.camera.lookAt(0, 0, 0);
    this.scene.background = new THREE.Color('#111315');
    this.scene.fog = new THREE.Fog('#111315', 4.5, 7.2);
    this.scene.add(new THREE.HemisphereLight('#f6f1e7', '#19201c', 2.2));
    const key = new THREE.DirectionalLight('#75d2ff', 2.8);
    key.position.set(-2.2, -2.6, 3.5);
    this.scene.add(key);
    const warm = new THREE.DirectionalLight('#f2c14e', 1.1);
    warm.position.set(2.4, 1.7, 2.2);
    this.scene.add(warm);

    this.plateGeometry = new THREE.PlaneGeometry(3.2, 3.2, solver.size - 1, solver.size - 1);
    const colors = new Float32Array(solver.size * solver.size * 3);
    this.plateGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.plateMesh = new THREE.Mesh(
      this.plateGeometry,
      new THREE.MeshStandardMaterial({
        color: '#dfe6de',
        metalness: 0.45,
        roughness: 0.36,
        vertexColors: true,
        side: THREE.DoubleSide,
      }),
    );
    this.scene.add(this.plateMesh);

    this.sand = this.createSand(this.settings.particleCount);
    this.sandPositions = new Float32Array(this.sand.length * 3);
    this.sandColors = new Float32Array(this.sand.length * 3);
    this.sandGeometry.setAttribute('position', new THREE.BufferAttribute(this.sandPositions, 3));
    this.sandGeometry.setAttribute('color', new THREE.BufferAttribute(this.sandColors, 3));
    this.sandPoints = new THREE.Points(
      this.sandGeometry,
      new THREE.PointsMaterial({
        size: 0.012,
        vertexColors: true,
        sizeAttenuation: true,
      }),
    );
    this.scene.add(this.sandPoints);

    window.addEventListener('resize', this.resize);
    this.resize();
    this.animate();
  }

  static async create(options: SceneOptions): Promise<ChladniScene> {
    let solver: PlateSolver;
    try {
      solver = await GpuPlateSolver.create(options.settings.gridSize);
    } catch {
      solver = new CpuPlateSolver(options.settings.gridSize);
    }
    return new ChladniScene(options, solver);
  }

  setSettings(settings: PlateSettings) {
    const gridChanged = settings.gridSize !== this.settings.gridSize;
    const particleChanged = settings.particleCount !== this.settings.particleCount;
    this.settings = settings;

    if (gridChanged || particleChanged) {
      this.onError('Grid and particle changes apply after restarting the plate.');
    }
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resize);
    this.solver.dispose();
    this.renderer.dispose();
    this.plateGeometry.dispose();
    this.sandGeometry.dispose();
    if (Array.isArray(this.plateMesh.material)) {
      this.plateMesh.material.forEach((material) => material.dispose());
    } else {
      this.plateMesh.material.dispose();
    }
    if (Array.isArray(this.sandPoints.material)) {
      this.sandPoints.material.forEach((material) => material.dispose());
    } else {
      this.sandPoints.material.dispose();
    }
  }

  private readonly resize = () => {
    const parent = this.canvas.parentElement;
    const width = parent?.clientWidth ?? window.innerWidth;
    const height = parent?.clientHeight ?? window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  };

  private animate = () => {
    if (!this.running) {
      return;
    }

    const dt = Math.min(this.clock.getDelta(), 1 / 24);
    const elapsed = this.clock.elapsedTime;
    if (!this.pending) {
      this.pending = true;
      this.solver
        .step({
          settings: this.settings,
          bands: this.getAudioBands(),
          time: elapsed,
          dt,
        })
        .then((frame) => {
          this.frame = frame.field;
          this.energy = frame.energy;
          this.applyField();
          this.updateSand();
        })
        .catch(() => {
          this.onError('The solver stopped unexpectedly. Restart the plate to recover.');
        })
        .finally(() => {
          this.pending = false;
        });
    }

    this.renderer.render(this.scene, this.camera);
    this.updateFps();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private updateFps() {
    this.frameCount += 1;
    const now = performance.now();
    if (now - this.fpsTime >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTime));
      this.frameCount = 0;
      this.fpsTime = now;
      this.onStats({
        fps: this.fps,
        solver: this.solver.kind,
        energy: this.energy,
        particles: this.sand.length,
      });
    }
  }

  private applyField() {
    const positions = this.plateGeometry.attributes.position;
    const colors = this.plateGeometry.attributes.color;
    const tint = new THREE.Color(this.materialTint());
    const cool = new THREE.Color('#122527');
    const hot = new THREE.Color('#f4796b');
    const neutral = new THREE.Color('#dfe6de');

    for (let i = 0; i < positions.count; i += 1) {
      const value = this.frame[i] ?? 0;
      positions.setZ(i, value * 0.26);
      const amount = Math.min(Math.abs(value) * 8, 1);
      const color = neutral
        .clone()
        .lerp(value > 0 ? hot : cool, amount)
        .lerp(tint, 0.18);
      colors.setXYZ(i, color.r, color.g, color.b);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.plateGeometry.computeVertexNormals();
  }

  private updateSand() {
    const size = this.solver.size;
    const position = this.sandGeometry.attributes.position;
    const color = this.sandGeometry.attributes.color;
    const persistence = this.settings.sandPersistence;

    this.sand.forEach((particle, index) => {
      const gx = Math.round(((particle.x + 1.6) / 3.2) * (size - 1));
      const gy = Math.round(((particle.y + 1.6) / 3.2) * (size - 1));
      const center = Math.abs(this.sample(gx, gy));
      const dx = Math.abs(this.sample(gx + 1, gy)) - Math.abs(this.sample(gx - 1, gy));
      const dy = Math.abs(this.sample(gx, gy + 1)) - Math.abs(this.sample(gx, gy - 1));
      const jitter = (1 - persistence) * 0.004;
      particle.vx = particle.vx * 0.84 - dx * 0.018 + (Math.random() - 0.5) * jitter;
      particle.vy = particle.vy * 0.84 - dy * 0.018 + (Math.random() - 0.5) * jitter;
      particle.x = THREE.MathUtils.clamp(particle.x + particle.vx, -1.55, 1.55);
      particle.y = THREE.MathUtils.clamp(particle.y + particle.vy, -1.55, 1.55);
      const z = this.sample(gx, gy) * 0.26 + 0.025;
      position.setXYZ(index, particle.x, particle.y, z);
      const quiet = 1 - Math.min(center * 12, 1);
      color.setXYZ(index, 0.62 + quiet * 0.38, 0.49 + quiet * 0.31, 0.25 + quiet * 0.2);
    });

    position.needsUpdate = true;
    color.needsUpdate = true;
  }

  private sample(x: number, y: number) {
    const size = this.solver.size;
    const clampedX = THREE.MathUtils.clamp(x, 0, size - 1);
    const clampedY = THREE.MathUtils.clamp(y, 0, size - 1);
    return this.frame[clampedY * size + clampedX] ?? 0;
  }

  private materialTint() {
    switch (this.settings.material) {
      case 'bronze':
        return '#f2c14e';
      case 'glass':
        return '#9be7c7';
      case 'carbon':
        return '#f4796b';
      case 'steel':
      default:
        return '#75d2ff';
    }
  }

  private createSand(count: number): SandParticle[] {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 3.05,
      y: (Math.random() - 0.5) * 3.05,
      vx: 0,
      vy: 0,
    }));
  }
}
