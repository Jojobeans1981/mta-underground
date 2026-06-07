import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../SaveManager';
import { SAVE_KEY, SAVE_VERSION } from '../../config/constants';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (_index: number): string | null => null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('SaveManager', () => {
  let manager: SaveManager;

  beforeEach(() => {
    localStorageMock.clear();
    manager = new SaveManager();
  });

  it('hasSave returns false when no save exists', () => {
    expect(manager.hasSave()).toBe(false);
  });

  it('createNewSave creates a valid save with police defaults', () => {
    const save = manager.createNewSave('police');
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.selectedClass).toBe('police');
    expect(save.classes.police.unlocked).toBe(true);
    expect(save.classes.police.level).toBe(1);
    expect(save.classes.police.xpToNextLevel).toBe(200);
    expect(save.classes.police.unlockedMissionIds).toContain('police_m01');
    expect(save.classes.police.unlockedMissionIds).toContain('police_m02');
    expect(save.classes.police.equippedItems).toContain('police_radio_1');
    expect(save.classes.police.ownedItems).toContain('police_radio_1');
    expect(save.classes.police.activeSkinId).toBe('police_skin_default');
    expect(save.classes.rider.unlocked).toBe(false);
    expect(save.classes.driver.unlocked).toBe(false);
    expect(save.wallet).toBe(0);
    expect(save.settings.sfxVolume).toBe(0.8);
    expect(save.settings.musicVolume).toBe(0.5);
  });

  it('hasSave returns true after creating a save', () => {
    manager.createNewSave('police');
    expect(manager.hasSave()).toBe(true);
  });

  it('save and load round-trips correctly', () => {
    const original = manager.createNewSave('police');
    original.wallet = 500;
    manager.save(original);

    const loaded = manager.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.wallet).toBe(500);
    expect(loaded!.selectedClass).toBe('police');
    expect(loaded!.classes.police.unlocked).toBe(true);
  });

  it('load returns null when no save exists', () => {
    expect(manager.load()).toBeNull();
  });

  it('deleteSave removes the save', () => {
    manager.createNewSave('police');
    expect(manager.hasSave()).toBe(true);
    manager.deleteSave();
    expect(manager.hasSave()).toBe(false);
    expect(manager.load()).toBeNull();
  });

  it('exportSave returns JSON string', () => {
    manager.createNewSave('police');
    const exported = manager.exportSave();
    expect(exported.length).toBeGreaterThan(0);
    const parsed = JSON.parse(exported);
    expect(parsed.selectedClass).toBe('police');
  });

  it('importSave parses valid JSON', () => {
    const save = manager.createNewSave('police');
    const json = JSON.stringify(save);
    const imported = manager.importSave(json);
    expect(imported).not.toBeNull();
    expect(imported!.version).toBe(SAVE_VERSION);
  });

  it('importSave returns null for invalid JSON', () => {
    expect(manager.importSave('not json')).toBeNull();
  });
});
