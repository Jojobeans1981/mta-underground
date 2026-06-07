export class MusicGenerator {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private currentTrack: string | null = null;
  private currentNodes: AudioNode[] = [];
  private currentSources: AudioBufferSourceNode[] = [];
  private currentOscillators: OscillatorNode[] = [];
  private intensity: number = 0.5;
  private intervals: number[] = [];

  init(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Web Audio not available
    }
  }

  play(trackName: string): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.currentTrack === trackName) return;

    this.stop();
    this.currentTrack = trackName;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    switch (trackName) {
      case 'menu_theme': this.playMenuTheme(); break;
      case 'street_theme': this.playStreetTheme(); break;
      case 'station_theme': this.playStationTheme(); break;
      case 'chase_theme': this.playChaseTheme(); break;
      case 'night_theme': this.playNightTheme(); break;
    }
  }

  stop(): void {
    if (!this.ctx) return;

    // Fade out
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    }

    // Clean up after fade
    setTimeout(() => {
      for (const osc of this.currentOscillators) {
        try { osc.stop(); } catch {}
      }
      for (const src of this.currentSources) {
        try { src.stop(); } catch {}
      }
      for (const id of this.intervals) {
        clearInterval(id);
      }
      this.currentOscillators = [];
      this.currentSources = [];
      this.currentNodes = [];
      this.intervals = [];
      this.currentTrack = null;

      // Restore gain
      if (this.masterGain) {
        this.masterGain.gain.value = this.volume;
      }
    }, 600);
  }

  crossfadeTo(trackName: string): void {
    if (this.currentTrack === trackName) return;
    this.stop();
    setTimeout(() => {
      this.play(trackName);
    }, 700);
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.currentTrack) {
      this.masterGain.gain.value = this.volume;
    }
  }

  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  dispose(): void {
    this.stop();
    setTimeout(() => {
      this.ctx?.close();
      this.ctx = null;
    }, 700);
  }

  // === Helpers ===

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private createOsc(type: OscillatorType, freq: number, gain: number): OscillatorNode {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(this.masterGain!);
    osc.start();
    this.currentOscillators.push(osc);
    this.currentNodes.push(g);
    return osc;
  }

  // === Tracks ===

  private playMenuTheme(): void {
    // Two detuned sine pads with slow LFO
    const ctx = this.ctx!;

    const osc1 = this.createOsc('sine', 131, 0.08); // C3
    const osc2 = this.createOsc('sine', 196, 0.06); // G3

    // Slow amplitude LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    // Can't directly modulate gain of existing nodes cleanly, so just let the drones play
    lfo.start();
    this.currentOscillators.push(lfo);
  }

  private playStreetTheme(): void {
    const ctx = this.ctx!;

    // Low drone E2
    this.createOsc('sine', 82, 0.06);

    // City hum (filtered noise)
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(10);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 400;
    bp.Q.value = 0.3;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.03;
    noise.connect(bp).connect(nGain).connect(this.masterGain!);
    noise.start();
    this.currentSources.push(noise);
    this.currentNodes.push(nGain);

    // Occasional high pings
    const pingInterval = setInterval(() => {
      if (!this.ctx || this.currentTrack !== 'street_theme') {
        clearInterval(pingInterval);
        return;
      }
      const ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.value = 400 + Math.random() * 400;
      const pEnv = ctx.createGain();
      const t = ctx.currentTime;
      pEnv.gain.setValueAtTime(0.04, t);
      pEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      ping.connect(pEnv).connect(this.masterGain!);
      ping.start(t);
      ping.stop(t + 0.3);
    }, 3000 + Math.random() * 2000) as unknown as number;
    this.intervals.push(pingInterval);
  }

  private playStationTheme(): void {
    const ctx = this.ctx!;

    // Pads A2 + E3
    this.createOsc('sine', 110, 0.05); // A2
    this.createOsc('sine', 165, 0.04); // E3

    // Echo pings
    const pingInterval = setInterval(() => {
      if (!this.ctx || this.currentTrack !== 'station_theme') {
        clearInterval(pingInterval);
        return;
      }
      const t = ctx.currentTime;
      const delays = [0, 0.3, 0.6];
      const gains = [0.06, 0.03, 0.015];
      delays.forEach((d, i) => {
        const ping = ctx.createOscillator();
        ping.type = 'sine';
        ping.frequency.value = 800 + Math.random() * 400;
        const env = ctx.createGain();
        env.gain.setValueAtTime(gains[i], t + d);
        env.gain.exponentialRampToValueAtTime(0.001, t + d + 0.2);
        ping.connect(env).connect(this.masterGain!);
        ping.start(t + d);
        ping.stop(t + d + 0.2);
      });
    }, 4000 + Math.random() * 3000) as unknown as number;
    this.intervals.push(pingInterval);
  }

  private playChaseTheme(): void {
    const ctx = this.ctx!;

    // Pulsing low tone at 160 BPM
    const beatMs = (60 / 160) * 1000; // ~375ms per beat
    const pulseInterval = setInterval(() => {
      if (!this.ctx || this.currentTrack !== 'chase_theme') {
        clearInterval(pulseInterval);
        return;
      }
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 65; // C2
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.15, t);
      env.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(env).connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.1);
    }, beatMs) as unknown as number;
    this.intervals.push(pulseInterval);

    // Rising filtered noise (intensity-based)
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(10);
    noise.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500 + this.intensity * 2000;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.04 + this.intensity * 0.06;
    noise.connect(hp).connect(nGain).connect(this.masterGain!);
    noise.start();
    this.currentSources.push(noise);
    this.currentNodes.push(nGain, hp);

    // Staccato high pings at eighth notes
    const staccatoMs = beatMs / 2;
    const staccatoInterval = setInterval(() => {
      if (!this.ctx || this.currentTrack !== 'chase_theme') {
        clearInterval(staccatoInterval);
        return;
      }
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 600 + Math.random() * 200;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.05, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(env).connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.05);
    }, staccatoMs) as unknown as number;
    this.intervals.push(staccatoInterval);
  }

  private playNightTheme(): void {
    const ctx = this.ctx!;

    // Lower drone
    this.createOsc('sine', 65, 0.05); // C2

    // Darker noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(10);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 200;
    bp.Q.value = 0.5;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.025;
    noise.connect(bp).connect(nGain).connect(this.masterGain!);
    noise.start();
    this.currentSources.push(noise);
    this.currentNodes.push(nGain);

    // Slight detuned second oscillator for unease
    this.createOsc('sine', 66.5, 0.03); // Slightly off C2
  }
}
