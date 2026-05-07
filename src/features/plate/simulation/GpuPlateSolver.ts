import { modalShape, rms } from '../math/chladni';
import type { PlateSolver, SolverFrame, StepInput } from './types';

const shader = /* wgsl */ `
struct Params {
  width: f32,
  height: f32,
  stiffness: f32,
  damping: f32,
  drive: f32,
  frequency: f32,
  time: f32,
  modeX: f32,
  modeY: f32,
  bass: f32,
  mid: f32,
  high: f32,
  dt: f32,
  gain: f32,
  pad0: f32,
  pad1: f32
};

@group(0) @binding(0) var<storage, read> current: array<f32>;
@group(0) @binding(1) var<storage, read> previous: array<f32>;
@group(0) @binding(2) var<storage, read_write> next: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;

fn shape(x: f32, y: f32, mx: f32, my: f32) -> f32 {
  return sin(3.14159265 * mx * x) * sin(3.14159265 * my * y);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = u32(params.width);
  let height = u32(params.height);
  if (id.x >= width || id.y >= height) {
    return;
  }

  let x = id.x;
  let y = id.y;
  let index = y * width + x;

  if (x < 2u || y < 2u || x + 2u >= width || y + 2u >= height) {
    next[index] = 0.0;
    return;
  }

  let c = current[index];
  let n = current[index - width];
  let s = current[index + width];
  let e = current[index + 1u];
  let w = current[index - 1u];
  let ne = current[index - width + 1u];
  let nw = current[index - width - 1u];
  let se = current[index + width + 1u];
  let sw = current[index + width - 1u];
  let nn = current[index - 2u * width];
  let ss = current[index + 2u * width];
  let ee = current[index + 2u];
  let ww = current[index - 2u];

  let biharmonic = 20.0 * c - 8.0 * (n + s + e + w) +
    2.0 * (ne + nw + se + sw) + nn + ss + ee + ww;
  let fx = f32(x) / (params.width - 1.0);
  let fy = f32(y) / (params.height - 1.0);
  let audioShape =
    params.bass * shape(fx, fy, 1.0, 1.0) +
    params.mid * shape(fx, fy, 2.0, 3.0) +
    params.high * shape(fx, fy, 5.0, 4.0);
  let modal = shape(fx, fy, params.modeX, params.modeY) + audioShape;
  let omega = 6.2831853 * params.frequency;
  let forcing = params.drive * params.gain * modal * sin(omega * params.time);
  let velocity = c - previous[index];
  next[index] = clamp(
    2.0 * c - previous[index] - params.damping * velocity -
      params.stiffness * biharmonic + forcing,
    -1.0,
    1.0
  );
}
`;

export class GpuPlateSolver implements PlateSolver {
  readonly kind = 'webgpu' as const;
  readonly size: number;
  private readonly device: GPUDevice;
  private readonly pipeline: GPUComputePipeline;
  private readonly paramsBuffer: GPUBuffer;
  private readonly buffers: GPUBuffer[];
  private readonly readBuffer: GPUBuffer;
  private current = 0;
  private previous = 1;
  private next = 2;
  private readonly bindGroups = new Map<string, GPUBindGroup>();

  private constructor(device: GPUDevice, size: number) {
    this.device = device;
    this.size = size;
    const byteLength = size * size * Float32Array.BYTES_PER_ELEMENT;
    const storageUsage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    this.buffers = [
      device.createBuffer({ size: byteLength, usage: storageUsage }),
      device.createBuffer({ size: byteLength, usage: storageUsage }),
      device.createBuffer({ size: byteLength, usage: storageUsage }),
    ];
    this.readBuffer = device.createBuffer({
      size: byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    this.paramsBuffer = device.createBuffer({
      size: 16 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: shader }),
        entryPoint: 'main',
      },
    });
    this.seed();
  }

  static async create(size: number): Promise<GpuPlateSolver> {
    if (!('gpu' in navigator)) {
      throw new Error('WebGPU is not available in this browser.');
    }
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) {
      throw new Error('No WebGPU adapter was found.');
    }
    const device = await adapter.requestDevice();
    return new GpuPlateSolver(device, size);
  }

  async step(input: StepInput): Promise<SolverFrame> {
    const { settings, bands, time, dt } = input;
    const params = new Float32Array([
      this.size,
      this.size,
      settings.stiffness,
      settings.damping,
      settings.drive,
      settings.frequency,
      time,
      settings.modeX,
      settings.modeY,
      bands.bass,
      bands.mid,
      bands.high,
      dt,
      settings.audioGain,
      0,
      0,
    ]);
    this.device.queue.writeBuffer(this.paramsBuffer, 0, params);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup(this.current, this.previous, this.next));
    pass.dispatchWorkgroups(Math.ceil(this.size / 8), Math.ceil(this.size / 8));
    pass.end();
    encoder.copyBufferToBuffer(
      this.buffers[this.next],
      0,
      this.readBuffer,
      0,
      this.size * this.size * Float32Array.BYTES_PER_ELEMENT,
    );
    this.device.queue.submit([encoder.finish()]);

    await this.readBuffer.mapAsync(GPUMapMode.READ);
    const field = new Float32Array(this.readBuffer.getMappedRange()).slice();
    this.readBuffer.unmap();

    const oldPrevious = this.previous;
    this.previous = this.current;
    this.current = this.next;
    this.next = oldPrevious;

    return {
      field,
      energy: rms(field),
    };
  }

  dispose() {
    this.bindGroups.clear();
    this.buffers.forEach((buffer) => buffer.destroy());
    this.readBuffer.destroy();
    this.paramsBuffer.destroy();
    this.device.destroy();
  }

  private bindGroup(current: number, previous: number, next: number) {
    const key = `${current}:${previous}:${next}`;
    const existing = this.bindGroups.get(key);
    if (existing) {
      return existing;
    }
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.buffers[current] } },
        { binding: 1, resource: { buffer: this.buffers[previous] } },
        { binding: 2, resource: { buffer: this.buffers[next] } },
        { binding: 3, resource: { buffer: this.paramsBuffer } },
      ],
    });
    this.bindGroups.set(key, bindGroup);
    return bindGroup;
  }

  private seed() {
    const seed = new Float32Array(this.size * this.size);
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        const fx = x / (this.size - 1);
        const fy = y / (this.size - 1);
        seed[y * this.size + x] = 0.003 * modalShape(fx, fy, 2, 3);
      }
    }
    this.device.queue.writeBuffer(this.buffers[0], 0, seed);
    this.device.queue.writeBuffer(this.buffers[1], 0, seed);
  }
}
