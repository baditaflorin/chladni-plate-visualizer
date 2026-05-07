import { beforeEach, describe, expect, it } from 'vitest';

import { defaultSettings } from '../features/plate/presets';
import { clearSettings, loadSettings, saveSettings } from './storage';

describe('settings storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads defaults when no settings exist', () => {
    expect(loadSettings(defaultSettings)).toEqual(defaultSettings);
  });

  it('round-trips valid settings', () => {
    saveSettings({ ...defaultSettings, frequency: 432, modeX: 4 });
    expect(loadSettings(defaultSettings)).toMatchObject({ frequency: 432, modeX: 4 });
  });

  it('falls back when stored settings are invalid', () => {
    window.localStorage.setItem('chladni-plate-settings-v1', '{"frequency":"bad"}');
    expect(loadSettings(defaultSettings)).toEqual(defaultSettings);
  });

  it('clears stored settings', () => {
    saveSettings({ ...defaultSettings, frequency: 333 });
    clearSettings();
    expect(loadSettings(defaultSettings)).toEqual(defaultSettings);
  });
});
