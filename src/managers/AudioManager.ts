import Phaser from 'phaser';
import { SFXGenerator } from '@/audio/SFXGenerator';
import { MusicGenerator } from '@/audio/MusicGenerator';

export class AudioManager {
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.8;
  private sfxGen: SFXGenerator | null = null;
  private musicGen: MusicGenerator | null = null;
  private initialized: boolean = false;

  private resumeAudioHandler: (() => void) | null = null;

  init(scene: Phaser.Scene): void {
    this.sfxGen = new SFXGenerator();
    this.musicGen = new MusicGenerator();

    // Audio context requires user gesture on mobile
    this.resumeAudioHandler = () => {
      if (!this.initialized) {
        this.sfxGen!.init();
        this.musicGen!.init();
        this.sfxGen!.setVolume(this.sfxVolume);
        this.musicGen!.setVolume(this.musicVolume);
        this.initialized = true;
      }
      scene.input.off('pointerdown', this.resumeAudioHandler!);
    };

    scene.input.on('pointerdown', this.resumeAudioHandler);

    // Also try initializing immediately (works on desktop)
    try {
      this.sfxGen.init();
      this.musicGen.init();
      this.sfxGen.setVolume(this.sfxVolume);
      this.musicGen.setVolume(this.musicVolume);
      this.initialized = true;
    } catch {
      // Will init on first user gesture
    }
  }

  playSFX(name: string): void {
    this.sfxGen?.play(name);
  }

  playSFXLoop(name: string): { stop: () => void } {
    return this.sfxGen?.playLoop(name) ?? { stop: () => {} };
  }

  playMusic(name: string): void {
    this.musicGen?.play(name);
  }

  crossfadeMusic(name: string): void {
    this.musicGen?.crossfadeTo(name);
  }

  stopMusic(): void {
    this.musicGen?.stop();
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.musicGen?.setVolume(this.musicVolume);
  }

  setSFXVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.sfxGen?.setVolume(this.sfxVolume);
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }

  setMusicIntensity(intensity: number): void {
    this.musicGen?.setIntensity(intensity);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  dispose(scene: Phaser.Scene): void {
    if (this.resumeAudioHandler) {
      scene.input.off('pointerdown', this.resumeAudioHandler);
      this.resumeAudioHandler = null;
    }
    this.sfxGen = null;
    this.musicGen = null;
    this.initialized = false;
  }
}
