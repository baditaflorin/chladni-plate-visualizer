import { normalizeBands } from '../math/chladni';
import type { AudioBands } from '../types';

const silentBands: AudioBands = {
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
  dominantFrequency: 0,
};

export class AudioEngine {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private oscillatorGain: GainNode | null = null;
  private fileSource: AudioBufferSourceNode | null = null;
  private fileBuffer: AudioBuffer | null = null;
  private mediaSource: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private readonly fft = new Uint8Array(1024);

  async start() {
    const context = this.context ?? new AudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
    this.context = context;
    if (!this.analyser) {
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.78;
      analyser.connect(context.destination);
      this.analyser = analyser;
    }
  }

  setOscillator(frequency: number, gain: number) {
    const context = this.requireContext();
    this.stopSources('oscillator');
    const oscillator = context.createOscillator();
    const oscillatorGain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillatorGain.gain.value = gain * 0.045;
    oscillator.connect(oscillatorGain).connect(this.requireAnalyser());
    oscillator.start();
    this.oscillator = oscillator;
    this.oscillatorGain = oscillatorGain;
  }

  updateOscillator(frequency: number, gain: number) {
    if (!this.context || !this.oscillator || !this.oscillatorGain) {
      return;
    }
    const now = this.context.currentTime;
    this.oscillator.frequency.setTargetAtTime(frequency, now, 0.04);
    this.oscillatorGain.gain.setTargetAtTime(gain * 0.045, now, 0.04);
  }

  async loadFile(file: File) {
    const context = this.requireContext();
    const buffer = await file.arrayBuffer();
    this.fileBuffer = await context.decodeAudioData(buffer.slice(0));
    this.playFile();
  }

  playFile() {
    const context = this.requireContext();
    if (!this.fileBuffer) {
      return;
    }
    this.stopSources('file');
    const source = context.createBufferSource();
    source.buffer = this.fileBuffer;
    source.loop = true;
    source.connect(this.requireAnalyser());
    source.start();
    this.fileSource = source;
  }

  async startMicrophone() {
    await this.start();
    this.stopSources('microphone');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.mediaStream = stream;
    this.mediaSource = this.requireContext().createMediaStreamSource(stream);
    this.mediaSource.connect(this.requireAnalyser());
  }

  stopSources(except?: 'oscillator' | 'file' | 'microphone') {
    if (except !== 'oscillator' && this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
      this.oscillatorGain = null;
    }
    if (except !== 'file' && this.fileSource) {
      this.fileSource.stop();
      this.fileSource.disconnect();
      this.fileSource = null;
    }
    if (except !== 'microphone' && this.mediaSource) {
      this.mediaSource.disconnect();
      this.mediaSource = null;
    }
    if (except !== 'microphone' && this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  getBands(): AudioBands {
    if (!this.context || !this.analyser) {
      return silentBands;
    }
    this.analyser.getByteFrequencyData(this.fft);
    return normalizeBands(this.fft, this.context.sampleRate);
  }

  dispose() {
    this.stopSources();
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    void this.context?.close();
    this.context = null;
  }

  private requireContext() {
    if (!this.context) {
      throw new Error('Audio has not been started.');
    }
    return this.context;
  }

  private requireAnalyser() {
    if (!this.analyser) {
      throw new Error('Audio analyser has not been started.');
    }
    return this.analyser;
  }
}
