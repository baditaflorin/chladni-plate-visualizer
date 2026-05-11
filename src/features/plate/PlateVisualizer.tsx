import {
  Activity,
  AudioLines,
  CircleDollarSign,
  Github,
  Mic,
  Pause,
  Play,
  Power,
  RefreshCcw,
  Upload,
  Waves,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildInfo as generatedBuildInfo } from '../../generated/build-info';
import { clearSettings, loadSettings, saveSettings } from '../../lib/storage';
import { AudioEngine } from './audio/AudioEngine';
import { frequencyToModes } from './math/chladni';
import { chladniPatterns, defaultSettings, getMaterial, materials } from './presets';
import type { AudioBands, AudioMode, BuildInfo, PlateSettings, RuntimeStats } from './types';
import type { ChladniScene } from './visualizer/ChladniScene';

interface Props {
  buildInfo?: BuildInfo;
  onError: (message: string) => void;
}

const silentBands: AudioBands = {
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
  dominantFrequency: 0,
};

export function PlateVisualizer({ buildInfo = generatedBuildInfo, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<ChladniScene | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const bandsRef = useRef<AudioBands>(silentBands);
  const [settings, setSettings] = useState<PlateSettings>(() => loadSettings(defaultSettings));
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RuntimeStats>({
    fps: 0,
    solver: 'cpu',
    energy: 0,
    particles: settings.particleCount,
  });
  const [bands, setBands] = useState<AudioBands>(silentBands);

  const material = useMemo(() => getMaterial(settings.material), [settings.material]);

  useEffect(() => {
    saveSettings(settings);
    sceneRef.current?.setSettings(settings);
    if (settings.audioMode === 'oscillator') {
      audioRef.current?.updateOscillator(settings.frequency, settings.audioGain);
    }
  }, [settings]);

  useEffect(() => {
    let animation = 0;
    const tick = () => {
      const latest = audioRef.current?.getBands() ?? silentBands;
      bandsRef.current = latest;
      setBands(latest);
      animation = window.setTimeout(tick, 110);
    };
    tick();
    return () => window.clearTimeout(animation);
  }, []);

  useEffect(() => {
    return () => {
      sceneRef.current?.dispose();
      audioRef.current?.dispose();
    };
  }, []);

  const start = useCallback(async () => {
    if (started || !canvasRef.current) {
      return;
    }
    setLoading(true);
    try {
      const audio = new AudioEngine();
      await audio.start();
      audioRef.current = audio;
      if (settings.audioMode === 'oscillator') {
        audio.setOscillator(settings.frequency, settings.audioGain);
        setPlaying(true);
      }
      const { ChladniScene } = await import('./visualizer/ChladniScene');
      sceneRef.current = await ChladniScene.create({
        canvas: canvasRef.current,
        settings,
        getAudioBands: () => bandsRef.current,
        onStats: setStats,
        onError,
      });
      setStarted(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to start the visualizer.');
    } finally {
      setLoading(false);
    }
  }, [onError, settings, started]);

  const setPartial = useCallback((partial: Partial<PlateSettings>) => {
    setSettings((current) => ({ ...current, ...partial }));
  }, []);

  const setAudioMode = useCallback(
    async (mode: AudioMode) => {
      setPartial({ audioMode: mode });
      if (!audioRef.current) {
        return;
      }
      try {
        if (mode === 'oscillator') {
          audioRef.current.setOscillator(settings.frequency, settings.audioGain);
          setPlaying(true);
        } else if (mode === 'microphone') {
          await audioRef.current.startMicrophone();
          setPlaying(true);
        } else {
          audioRef.current.stopSources();
          setPlaying(false);
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Audio source could not be started.');
      }
    },
    [onError, setPartial, settings.audioGain, settings.frequency],
  );

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        return;
      }
      if (!audioRef.current) {
        await start();
      }
      try {
        await audioRef.current?.loadFile(file);
        setPartial({ audioMode: 'file' });
        setPlaying(true);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Audio file could not be decoded.');
      }
    },
    [onError, setPartial, start],
  );

  const reset = useCallback(() => {
    clearSettings();
    setSettings(defaultSettings);
    onError('Settings reset.');
  }, [onError]);

  const snapMode = useCallback(() => {
    setPartial(frequencyToModes(settings.frequency));
  }, [setPartial, settings.frequency]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Cymatics lab</p>
          <h1>Chladni Plate Visualizer</h1>
        </div>
        <nav className="link-row" aria-label="Project links">
          <a href={buildInfo.repositoryUrl} target="_blank" rel="noreferrer" title="Star on GitHub">
            <Github size={18} aria-hidden="true" />
            <span>Star on GitHub</span>
          </a>
          <a
            href={buildInfo.paypalUrl}
            target="_blank"
            rel="noreferrer"
            title="Support with PayPal"
          >
            <CircleDollarSign size={18} aria-hidden="true" />
            <span>PayPal</span>
          </a>
          <span className="build-pill">
            v{buildInfo.version} · {buildInfo.commit}
          </span>
        </nav>
      </header>

      <main className="workbench">
        <section className="viewport" aria-label="Chladni plate scene">
          <canvas ref={canvasRef} data-testid="visualizer-canvas" />
          {!started ? (
            <div className="start-layer">
              <button type="button" className="start-button" onClick={start} disabled={loading}>
                <Power size={20} aria-hidden="true" />
                <span>{loading ? 'Starting' : 'Start Plate'}</span>
              </button>
            </div>
          ) : null}
          <div className="hud" aria-label="Runtime status">
            <span>
              <Activity size={15} aria-hidden="true" />
              {stats.fps} FPS
            </span>
            <span>{stats.solver.toUpperCase()}</span>
            <span>{Math.round(stats.energy * 1000) / 1000} RMS</span>
            <span>{stats.particles.toLocaleString()} grains</span>
          </div>
        </section>

        <aside className="control-panel" aria-label="Plate controls">
          <div className="panel-section">
            <div className="section-heading">
              <Waves size={18} aria-hidden="true" />
              <h2>Plate</h2>
            </div>
            <label>
              <span>Frequency</span>
              <input
                aria-label="Frequency"
                type="number"
                min="20"
                max="4000"
                value={Math.round(settings.frequency)}
                onChange={(event) => setPartial({ frequency: Number(event.currentTarget.value) })}
              />
            </label>
            <input
              aria-label="Frequency slider"
              type="range"
              min="20"
              max="1400"
              step="1"
              value={settings.frequency}
              onChange={(event) => setPartial({ frequency: Number(event.currentTarget.value) })}
            />
            <div className="mode-grid">
              <label>
                <span>Mode X</span>
                <input
                  aria-label="Mode X"
                  type="number"
                  min="1"
                  max="12"
                  value={settings.modeX}
                  onChange={(event) => setPartial({ modeX: Number(event.currentTarget.value) })}
                />
              </label>
              <label>
                <span>Mode Y</span>
                <input
                  aria-label="Mode Y"
                  type="number"
                  min="1"
                  max="12"
                  value={settings.modeY}
                  onChange={(event) => setPartial({ modeY: Number(event.currentTarget.value) })}
                />
              </label>
              <button type="button" className="icon-button" onClick={snapMode} title="Snap mode">
                <RefreshCcw size={17} aria-hidden="true" />
              </button>
            </div>
            <div className="pattern-presets" role="group" aria-label="Named Chladni patterns">
              {chladniPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  className="tool-button"
                  title={pattern.description}
                  onClick={() =>
                    setPartial({
                      modeX: pattern.modeX,
                      modeY: pattern.modeY,
                      frequency: pattern.frequency,
                    })
                  }
                >
                  {pattern.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-heading">
              <AudioLines size={18} aria-hidden="true" />
              <h2>Audio</h2>
            </div>
            <div className="segmented" role="group" aria-label="Audio mode">
              {(['oscillator', 'file', 'microphone', 'silent'] as AudioMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={settings.audioMode === mode ? 'active' : ''}
                  onClick={() => void setAudioMode(mode)}
                >
                  {mode === 'microphone' ? 'Mic' : mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            <div className="button-row">
              <button
                type="button"
                className="tool-button"
                onClick={() => void (started ? setAudioMode(settings.audioMode) : start())}
                title={playing ? 'Audio running' : 'Start audio'}
              >
                {playing ? (
                  <Pause size={17} aria-hidden="true" />
                ) : (
                  <Play size={17} aria-hidden="true" />
                )}
                <span>{playing ? 'Live' : 'Play'}</span>
              </button>
              <label className="upload-button" title="Upload audio">
                <Upload size={17} aria-hidden="true" />
                <span>Audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => void handleFile(event.currentTarget.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                className="icon-button"
                onClick={() => void setAudioMode('microphone')}
                title="Use microphone"
              >
                <Mic size={17} aria-hidden="true" />
              </button>
            </div>
            <label>
              <span>Audio gain</span>
              <input
                aria-label="Audio gain"
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={settings.audioGain}
                onChange={(event) => setPartial({ audioGain: Number(event.currentTarget.value) })}
              />
            </label>
            <div className="spectrum" aria-label="Audio bands">
              <Band label="Bass" value={bands.bass} />
              <Band label="Mid" value={bands.mid} />
              <Band label="High" value={bands.high} />
            </div>
          </div>

          <div className="panel-section">
            <div className="section-heading">
              <h2>Material</h2>
            </div>
            <div className="swatches" role="group" aria-label="Material">
              {materials.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className={settings.material === candidate.id ? 'active' : ''}
                  onClick={() =>
                    setPartial({
                      material: candidate.id,
                      stiffness: candidate.stiffness,
                      damping: candidate.damping,
                    })
                  }
                  title={candidate.label}
                  aria-label={candidate.label}
                >
                  <span style={{ backgroundColor: candidate.tint }} />
                </button>
              ))}
            </div>
            <div className="metric-row">
              <span>{material.label}</span>
              <span>{Math.round(bands.dominantFrequency)} Hz peak</span>
            </div>
            <label>
              <span>Damping</span>
              <input
                aria-label="Damping"
                type="range"
                min="0.001"
                max="0.12"
                step="0.001"
                value={settings.damping}
                onChange={(event) => setPartial({ damping: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              <span>Drive</span>
              <input
                aria-label="Drive"
                type="range"
                min="0"
                max="0.18"
                step="0.001"
                value={settings.drive}
                onChange={(event) => setPartial({ drive: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              <span>Sand</span>
              <input
                aria-label="Sand persistence"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.sandPersistence}
                onChange={(event) =>
                  setPartial({ sandPersistence: Number(event.currentTarget.value) })
                }
              />
            </label>
            <button type="button" className="reset-button" onClick={reset}>
              <RefreshCcw size={17} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </aside>
      </main>

      <footer className="footer-line">
        <a href={buildInfo.repositoryUrl} target="_blank" rel="noreferrer">
          {buildInfo.repositoryUrl}
        </a>
        <a href={buildInfo.paypalUrl} target="_blank" rel="noreferrer">
          {buildInfo.paypalUrl}
        </a>
      </footer>
    </div>
  );
}

function Band({ label, value }: { label: string; value: number }) {
  return (
    <div className="band">
      <span>{label}</span>
      <meter min="0" max="1" value={value} />
    </div>
  );
}
