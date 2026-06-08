/**
 * MusicGenerator — Gritty NYC ambient music
 * Procedural Web Audio: dark pads, sub-bass, lo-fi textures, trap-influenced beats.
 * Each track is a layered soundscape, not just a drone.
 */
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

    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    }

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

  private createBrownNoiseBuffer(duration: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      d[i] = (last + 0.02 * white) / 1.02;
      last = d[i];
      d[i] *= 3.5;
    }
    return buf;
  }

  /** Vinyl crackle buffer — sparse pops over silence */
  private createCrackleBuffer(duration: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() < 0.001 ? (Math.random() * 2 - 1) * 0.3 : 0;
    }
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

  private createFilteredOsc(
    type: OscillatorType, freq: number, gain: number,
    filterType: BiquadFilterType, filterFreq: number, filterQ: number = 1
  ): OscillatorNode {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(filter).connect(g).connect(this.masterGain!);
    osc.start();
    this.currentOscillators.push(osc);
    this.currentNodes.push(g, filter);
    return osc;
  }

  private addLoopedNoise(
    buffer: AudioBuffer, filterType: BiquadFilterType,
    filterFreq: number, filterQ: number, gain: number
  ): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.masterGain!);
    src.start();
    this.currentSources.push(src);
    this.currentNodes.push(g, filter);
    return src;
  }

  private scheduleInterval(fn: () => void, ms: number): void {
    const id = setInterval(fn, ms) as unknown as number;
    this.intervals.push(id);
  }

  // === Tracks ===

  /**
   * MENU THEME — Dark atmospheric intro
   * Slow sub-bass pulse, vinyl crackle, eerie subway pad, distant echo pings
   */
  private playMenuTheme(): void {
    const ctx = this.ctx!;

    // Sub-bass breathing pulse (C1 ~32Hz)
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 32.7;
    const subLfo = ctx.createOscillator();
    subLfo.type = 'sine';
    subLfo.frequency.value = 0.15; // Very slow breathing
    const subLfoGain = ctx.createGain();
    subLfoGain.gain.value = 0.04;
    subLfo.connect(subLfoGain);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.06;
    subLfoGain.connect(subGain.gain);
    sub.connect(subGain).connect(this.masterGain!);
    sub.start();
    subLfo.start();
    this.currentOscillators.push(sub, subLfo);
    this.currentNodes.push(subGain, subLfoGain);

    // Dark pad — minor chord (Cm: C2, Eb2, G2)
    this.createFilteredOsc('sawtooth', 65.4, 0.02, 'lowpass', 200, 0.7);
    this.createFilteredOsc('sawtooth', 77.8, 0.015, 'lowpass', 200, 0.7);
    this.createFilteredOsc('sawtooth', 98, 0.018, 'lowpass', 250, 0.7);

    // Vinyl crackle
    this.addLoopedNoise(this.createCrackleBuffer(5), 'highpass', 2000, 0.5, 0.08);

    // Subway air hum
    this.addLoopedNoise(this.createBrownNoiseBuffer(8), 'bandpass', 120, 0.8, 0.02);

    // Echoing drip pings — random, reverb-like
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'menu_theme') return;
      const t = ctx.currentTime;
      const baseFreq = 1200 + Math.random() * 800;
      const delays = [0, 0.15, 0.3, 0.45];
      const gains = [0.04, 0.02, 0.01, 0.005];
      delays.forEach((d, i) => {
        const ping = ctx.createOscillator();
        ping.type = 'sine';
        ping.frequency.value = baseFreq;
        const env = ctx.createGain();
        env.gain.setValueAtTime(gains[i], t + d);
        env.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.12);
        ping.connect(env).connect(this.masterGain!);
        ping.start(t + d);
        ping.stop(t + d + 0.12);
      });
    }, 3000 + Math.random() * 4000);
  }

  /**
   * STREET THEME — Gritty lo-fi beat
   * Trap-influenced kick/hat pattern, sub-bass, urban atmosphere, jazzy rhodes-ish pings
   */
  private playStreetTheme(): void {
    const ctx = this.ctx!;
    const bpm = 75; // Slow, head-nodding tempo
    const beatMs = (60 / bpm) * 1000;
    let beatCount = 0;

    // Vinyl warmth layer
    this.addLoopedNoise(this.createCrackleBuffer(6), 'highpass', 3000, 0.3, 0.06);

    // Sub-bass drone (Eb1)
    this.createFilteredOsc('sine', 38.9, 0.06, 'lowpass', 80, 0.7);

    // City air
    this.addLoopedNoise(this.createBrownNoiseBuffer(10), 'bandpass', 300, 0.2, 0.015);

    // Beat loop
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'street_theme') return;
      const t = ctx.currentTime;
      const bar = beatCount % 8;

      // KICK — beats 0, 3, 4, 6 (sparse trap pattern)
      if (bar === 0 || bar === 3 || bar === 4 || bar === 6) {
        // 808 kick: sine pitch drop
        const kick = ctx.createOscillator();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(150, t);
        kick.frequency.exponentialRampToValueAtTime(30, t + 0.25);
        const kickEnv = ctx.createGain();
        kickEnv.gain.setValueAtTime(0.2, t);
        kickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        kick.connect(kickEnv).connect(this.masterGain!);
        kick.start(t);
        kick.stop(t + 0.3);

        // Kick noise transient
        const kickNoise = ctx.createBufferSource();
        kickNoise.buffer = this.createNoiseBuffer(0.02);
        const kickLp = ctx.createBiquadFilter();
        kickLp.type = 'lowpass';
        kickLp.frequency.value = 500;
        const kickNEnv = ctx.createGain();
        kickNEnv.gain.setValueAtTime(0.12, t);
        kickNEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        kickNoise.connect(kickLp).connect(kickNEnv).connect(this.masterGain!);
        kickNoise.start(t);
        kickNoise.stop(t + 0.02);
      }

      // HI-HAT — every beat, with some open hats
      const isOpen = bar === 2 || bar === 5;
      const hat = ctx.createBufferSource();
      hat.buffer = this.createNoiseBuffer(isOpen ? 0.15 : 0.04);
      const hatHp = ctx.createBiquadFilter();
      hatHp.type = 'highpass';
      hatHp.frequency.value = isOpen ? 7000 : 9000;
      const hatEnv = ctx.createGain();
      const hatDur = isOpen ? 0.12 : 0.03;
      hatEnv.gain.setValueAtTime(isOpen ? 0.06 : 0.04, t);
      hatEnv.gain.exponentialRampToValueAtTime(0.001, t + hatDur);
      hat.connect(hatHp).connect(hatEnv).connect(this.masterGain!);
      hat.start(t);
      hat.stop(t + hatDur + 0.01);

      // SNARE — beats 2 and 6
      if (bar === 2 || bar === 6) {
        // Snare body
        const snareBody = ctx.createOscillator();
        snareBody.type = 'sine';
        snareBody.frequency.setValueAtTime(200, t);
        snareBody.frequency.exponentialRampToValueAtTime(120, t + 0.08);
        const snareBodyEnv = ctx.createGain();
        snareBodyEnv.gain.setValueAtTime(0.12, t);
        snareBodyEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        snareBody.connect(snareBodyEnv).connect(this.masterGain!);
        snareBody.start(t);
        snareBody.stop(t + 0.1);

        // Snare rattle
        const snareNoise = ctx.createBufferSource();
        snareNoise.buffer = this.createNoiseBuffer(0.12);
        const snareBp = ctx.createBiquadFilter();
        snareBp.type = 'bandpass';
        snareBp.frequency.value = 3000;
        snareBp.Q.value = 1;
        const snareEnv = ctx.createGain();
        snareEnv.gain.setValueAtTime(0.08, t);
        snareEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        snareNoise.connect(snareBp).connect(snareEnv).connect(this.masterGain!);
        snareNoise.start(t);
        snareNoise.stop(t + 0.12);
      }

      beatCount++;
    }, beatMs / 2); // Eighth notes

    // Jazzy rhodes-like pings (random intervals)
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'street_theme') return;
      const t = ctx.currentTime;
      // Minor pentatonic: Eb, Gb, Ab, Bb, Db
      const notes = [311, 370, 415, 466, 554];
      const note = notes[Math.floor(Math.random() * notes.length)];

      // FM bell sound
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.value = note;
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = note * 2;
      const modGain = ctx.createGain();
      modGain.gain.value = note * 0.5;
      mod.connect(modGain).connect(carrier.frequency);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.05, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      carrier.connect(env).connect(this.masterGain!);
      carrier.start(t);
      mod.start(t);
      carrier.stop(t + 0.8);
      mod.stop(t + 0.8);
    }, 2500 + Math.random() * 3000);
  }

  /**
   * STATION THEME — Underground echo chamber
   * Reverberant drips, distant train rumble, metallic resonance, eerie pads
   */
  private playStationTheme(): void {
    const ctx = this.ctx!;

    // Deep underground drone (A1 + detuned)
    this.createFilteredOsc('sawtooth', 55, 0.02, 'lowpass', 150, 0.5);
    this.createFilteredOsc('sawtooth', 56.5, 0.015, 'lowpass', 150, 0.5); // Detuned for unease

    // Distant train rumble (constant)
    this.addLoopedNoise(this.createBrownNoiseBuffer(8), 'lowpass', 120, 0.3, 0.025);

    // Tunnel wind
    this.addLoopedNoise(this.createNoiseBuffer(10), 'bandpass', 250, 0.4, 0.01);

    // Fluorescent light buzz (high frequency)
    this.createOsc('sawtooth', 120, 0.003);

    // Echoing water drips
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'station_theme') return;
      const t = ctx.currentTime;

      // Main drip
      const freq = 2000 + Math.random() * 1500;
      const echoDelays = [0, 0.08, 0.2, 0.4, 0.65];
      const echoGains = [0.06, 0.04, 0.025, 0.015, 0.008];

      echoDelays.forEach((d, i) => {
        const drip = ctx.createOscillator();
        drip.type = 'sine';
        drip.frequency.setValueAtTime(freq, t + d);
        drip.frequency.exponentialRampToValueAtTime(freq * 0.7, t + d + 0.06);
        const env = ctx.createGain();
        env.gain.setValueAtTime(echoGains[i], t + d);
        env.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
        drip.connect(env).connect(this.masterGain!);
        drip.start(t + d);
        drip.stop(t + d + 0.08);
      });
    }, 2000 + Math.random() * 3000);

    // Metallic resonance pings (like tapping on rails)
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'station_theme') return;
      const t = ctx.currentTime;

      const resonances = [440, 660, 880, 1100];
      const freq = resonances[Math.floor(Math.random() * resonances.length)];

      // FM metallic ping
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.value = freq;
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = freq * 3.5;
      const modGain = ctx.createGain();
      modGain.gain.value = freq * 0.8;
      mod.connect(modGain).connect(carrier.frequency);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.03, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      carrier.connect(env).connect(this.masterGain!);
      carrier.start(t);
      mod.start(t);
      carrier.stop(t + 1.2);
      mod.stop(t + 1.2);
    }, 5000 + Math.random() * 5000);

    // Distant PA announcement (filtered noise burst — like garbled speech)
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'station_theme') return;
      if (Math.random() > 0.4) return; // Only sometimes
      const t = ctx.currentTime;

      const pa = ctx.createBufferSource();
      pa.buffer = this.createNoiseBuffer(2);
      const paBp = ctx.createBiquadFilter();
      paBp.type = 'bandpass';
      paBp.frequency.value = 600;
      paBp.Q.value = 3;
      const paEnv = ctx.createGain();
      paEnv.gain.setValueAtTime(0.0, t);
      paEnv.gain.linearRampToValueAtTime(0.015, t + 0.1);
      paEnv.gain.setValueAtTime(0.015, t + 1.5);
      paEnv.gain.linearRampToValueAtTime(0.0, t + 2.0);
      pa.connect(paBp).connect(paEnv).connect(this.masterGain!);
      pa.start(t);
      pa.stop(t + 2.0);
    }, 15000);
  }

  /**
   * CHASE THEME — Aggressive pursuit
   * Fast 808-driven beat, distorted bass, urgent synth stabs, rising intensity
   */
  private playChaseTheme(): void {
    const ctx = this.ctx!;
    const bpm = 140;
    const beatMs = (60 / bpm) * 1000;
    let beatCount = 0;

    // Distorted sub-bass line (alternating C2/Eb2)
    const bassFreqs = [65.4, 65.4, 77.8, 65.4, 65.4, 77.8, 87.3, 77.8]; // 8-note pattern
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'chase_theme') return;
      const t = ctx.currentTime;
      const noteIdx = beatCount % bassFreqs.length;

      // Only play bass on kicks
      if (noteIdx === 0 || noteIdx === 2 || noteIdx === 4 || noteIdx === 6) {
        const bass = ctx.createOscillator();
        bass.type = 'sine';
        const freq = bassFreqs[noteIdx];
        bass.frequency.setValueAtTime(freq * 2, t);
        bass.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
        const bassGain = ctx.createGain();
        bassGain.gain.setValueAtTime(0.15, t);
        bassGain.gain.exponentialRampToValueAtTime(0.06, t + 0.15);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        bass.connect(bassGain).connect(this.masterGain!);
        bass.start(t);
        bass.stop(t + 0.25);
      }

      beatCount++;
    }, beatMs);

    // Drum pattern — aggressive
    let drumBeat = 0;
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'chase_theme') return;
      const t = ctx.currentTime;
      const pos = drumBeat % 16; // 16th note pattern

      // KICK — 4-on-the-floor with extra hits
      if (pos === 0 || pos === 4 || pos === 8 || pos === 10 || pos === 12) {
        const kick = ctx.createOscillator();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(180, t);
        kick.frequency.exponentialRampToValueAtTime(35, t + 0.15);
        const kickEnv = ctx.createGain();
        kickEnv.gain.setValueAtTime(0.25, t);
        kickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        kick.connect(kickEnv).connect(this.masterGain!);
        kick.start(t);
        kick.stop(t + 0.2);
      }

      // SNARE — 2 and 4 (with 16th-note ghost)
      if (pos === 4 || pos === 12) {
        const snare = ctx.createBufferSource();
        snare.buffer = this.createNoiseBuffer(0.1);
        const snareBp = ctx.createBiquadFilter();
        snareBp.type = 'bandpass';
        snareBp.frequency.value = 4000;
        snareBp.Q.value = 0.8;
        const snareEnv = ctx.createGain();
        snareEnv.gain.setValueAtTime(0.12, t);
        snareEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        snare.connect(snareBp).connect(snareEnv).connect(this.masterGain!);
        snare.start(t);
        snare.stop(t + 0.08);

        // Snare body
        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(250, t);
        body.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        const bodyEnv = ctx.createGain();
        bodyEnv.gain.setValueAtTime(0.1, t);
        bodyEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        body.connect(bodyEnv).connect(this.masterGain!);
        body.start(t);
        body.stop(t + 0.06);
      }

      // HI-HATS — rapid, driving
      if (pos % 2 === 0 || pos === 3 || pos === 7 || pos === 11 || pos === 15) {
        const hat = ctx.createBufferSource();
        hat.buffer = this.createNoiseBuffer(0.03);
        const hatHp = ctx.createBiquadFilter();
        hatHp.type = 'highpass';
        hatHp.frequency.value = 10000;
        const hatEnv = ctx.createGain();
        const vol = (pos % 4 === 0) ? 0.05 : 0.025;
        hatEnv.gain.setValueAtTime(vol, t);
        hatEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        hat.connect(hatHp).connect(hatEnv).connect(this.masterGain!);
        hat.start(t);
        hat.stop(t + 0.025);
      }

      drumBeat++;
    }, beatMs / 4); // 16th notes

    // Urgent synth stab — every 2 bars
    let stabCount = 0;
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'chase_theme') return;
      const t = ctx.currentTime;
      stabCount++;
      if (stabCount % 4 !== 0) return;

      // Harsh minor stab (Cm: C4, Eb4, G4)
      const stabNotes = [261.6, 311.1, 392];
      for (const freq of stabNotes) {
        const stab = ctx.createOscillator();
        stab.type = 'sawtooth';
        stab.frequency.value = freq;
        const stabLp = ctx.createBiquadFilter();
        stabLp.type = 'lowpass';
        stabLp.frequency.setValueAtTime(freq * 6, t);
        stabLp.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.15);
        const stabEnv = ctx.createGain();
        stabEnv.gain.setValueAtTime(0.08, t);
        stabEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        stab.connect(stabLp).connect(stabEnv).connect(this.masterGain!);
        stab.start(t);
        stab.stop(t + 0.2);
      }
    }, beatMs);

    // Rising tension noise
    this.addLoopedNoise(
      this.createNoiseBuffer(4), 'highpass',
      1000 + this.intensity * 3000, 1,
      0.01 + this.intensity * 0.02
    );
  }

  /**
   * NIGHT THEME — Lonely urban nocturne
   * Sparse, dark, with distant sounds and a slow heartbeat pulse.
   * Think 3am on an empty platform.
   */
  private playNightTheme(): void {
    const ctx = this.ctx!;

    // Deep drone — C1 + slightly detuned for unease
    this.createFilteredOsc('sine', 32.7, 0.05, 'lowpass', 60, 0.5);
    this.createFilteredOsc('sine', 33.9, 0.03, 'lowpass', 60, 0.5);

    // Dark wind
    this.addLoopedNoise(this.createBrownNoiseBuffer(12), 'bandpass', 150, 0.3, 0.02);

    // Vinyl warmth
    this.addLoopedNoise(this.createCrackleBuffer(8), 'highpass', 2000, 0.3, 0.04);

    // Heartbeat-like sub pulse — very slow, unsettling
    const heartbeatMs = 1500; // ~40 BPM
    let hbCount = 0;
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'night_theme') return;
      const t = ctx.currentTime;
      const isDouble = hbCount % 2 === 1; // lub-dub pattern

      const beat = ctx.createOscillator();
      beat.type = 'sine';
      beat.frequency.setValueAtTime(isDouble ? 40 : 50, t);
      beat.frequency.exponentialRampToValueAtTime(20, t + 0.15);
      const beatEnv = ctx.createGain();
      beatEnv.gain.setValueAtTime(isDouble ? 0.06 : 0.1, t);
      beatEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      beat.connect(beatEnv).connect(this.masterGain!);
      beat.start(t);
      beat.stop(t + 0.2);

      hbCount++;
    }, heartbeatMs);

    // Distant siren (rare, eerie)
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'night_theme') return;
      if (Math.random() > 0.3) return;
      const t = ctx.currentTime;

      const siren = ctx.createOscillator();
      siren.type = 'sine';
      siren.frequency.setValueAtTime(400, t);
      siren.frequency.linearRampToValueAtTime(650, t + 1.5);
      siren.frequency.linearRampToValueAtTime(400, t + 3);
      const sirenLp = ctx.createBiquadFilter();
      sirenLp.type = 'lowpass';
      sirenLp.frequency.value = 800;
      const sirenEnv = ctx.createGain();
      sirenEnv.gain.setValueAtTime(0.003, t);
      sirenEnv.gain.linearRampToValueAtTime(0.01, t + 1.5);
      sirenEnv.gain.linearRampToValueAtTime(0.003, t + 3);
      siren.connect(sirenLp).connect(sirenEnv).connect(this.masterGain!);
      siren.start(t);
      siren.stop(t + 3);
    }, 12000);

    // Lonely saxophone-like pad (filtered sawtooth with vibrato)
    this.scheduleInterval(() => {
      if (!this.ctx || this.currentTrack !== 'night_theme') return;
      if (Math.random() > 0.5) return;
      const t = ctx.currentTime;

      // Eb minor pentatonic: Eb4, Gb4, Ab4, Bb4, Db5
      const notes = [311, 370, 415, 466, 554];
      const freq = notes[Math.floor(Math.random() * notes.length)];

      const sax = ctx.createOscillator();
      sax.type = 'sawtooth';
      sax.frequency.value = freq;
      // Vibrato
      const vib = ctx.createOscillator();
      vib.type = 'sine';
      vib.frequency.value = 5;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 3; // Subtle pitch wobble
      vib.connect(vibGain).connect(sax.frequency);

      const saxLp = ctx.createBiquadFilter();
      saxLp.type = 'lowpass';
      saxLp.frequency.setValueAtTime(freq * 1.5, t);
      saxLp.frequency.linearRampToValueAtTime(freq * 3, t + 0.5);
      saxLp.frequency.linearRampToValueAtTime(freq * 1.2, t + 2);
      saxLp.Q.value = 2;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0, t);
      env.gain.linearRampToValueAtTime(0.03, t + 0.3);
      env.gain.setValueAtTime(0.03, t + 1.5);
      env.gain.linearRampToValueAtTime(0.0, t + 2.5);

      sax.connect(saxLp).connect(env).connect(this.masterGain!);
      sax.start(t);
      vib.start(t);
      sax.stop(t + 2.5);
      vib.stop(t + 2.5);
    }, 6000 + Math.random() * 4000);
  }
}
