export class SFXGenerator {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 0.8;

  init(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.ctx.destination);
    } catch {
      // Web Audio not available
    }
  }

  play(name: string): void {
    if (!this.ctx || !this.gainNode) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    switch (name) {
      case 'footstep_concrete': this.playFootstepConcrete(); break;
      case 'footstep_tile': this.playFootstepTile(); break;
      case 'step_sprint': this.playStepSprint(); break;
      case 'radio_crackle': this.playRadioCrackle(); break;
      case 'radio_beep': this.playRadioBeep(); break;
      case 'train_arrive': this.playTrainArrive(); break;
      case 'train_depart': this.playTrainDepart(); break;
      case 'train_doors': this.playTrainDoors(); break;
      case 'catch_npc': this.playCatchNPC(); break;
      case 'mission_start': this.playMissionStart(); break;
      case 'mission_complete': this.playMissionComplete(); break;
      case 'mission_fail': this.playMissionFail(); break;
      case 'levelup': this.playLevelUp(); break;
      case 'money_earn': this.playMoneyEarn(); break;
      case 'money_spend': this.playMoneySpend(); break;
      case 'ui_click': this.playUIClick(); break;
      case 'npc_interact': this.playNPCInteract(); break;
      case 'alert': this.playAlert(); break;
    }
  }

  playLoop(name: string): { stop: () => void } {
    if (!this.ctx || !this.gainNode) return { stop: () => {} };

    if (name === 'ambient_crowd') {
      return this.playAmbientCrowd();
    }
    return { stop: () => {} };
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  dispose(): void {
    this.ctx?.close();
    this.ctx = null;
  }

  // === Helper ===

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private now(): number {
    return this.ctx!.currentTime;
  }

  // === SFX Generators ===

  private playFootstepConcrete(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.05);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 1;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(bp).connect(env).connect(this.gainNode!);
    noise.start(t);
    noise.stop(t + 0.05);
  }

  private playFootstepTile(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.04);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.25, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(hp).connect(env).connect(this.gainNode!);
    noise.start(t);
    noise.stop(t + 0.04);
  }

  private playStepSprint(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.04);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.4, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(bp).connect(env).connect(this.gainNode!);
    noise.start(t);
    noise.stop(t + 0.04);
  }

  private playRadioCrackle(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 3;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.linearRampToValueAtTime(0.3, t + 0.05);
    env.gain.linearRampToValueAtTime(0.1, t + 0.15);
    env.gain.linearRampToValueAtTime(0, t + 0.2);
    noise.connect(bp).connect(env).connect(this.gainNode!);
    noise.start(t);
    noise.stop(t + 0.2);
  }

  private playRadioBeep(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.linearRampToValueAtTime(0, t + 0.1);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playTrainArrive(): void {
    const ctx = this.ctx!;
    const t = this.now();
    // Low sine sweep
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(200, t + 2);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.05, t);
    env.gain.linearRampToValueAtTime(0.25, t + 1.5);
    env.gain.linearRampToValueAtTime(0.15, t + 2);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 2);
    // Noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(0.02, t);
    nEnv.gain.linearRampToValueAtTime(0.12, t + 1.8);
    nEnv.gain.linearRampToValueAtTime(0.05, t + 2);
    noise.connect(lp).connect(nEnv).connect(this.gainNode!);
    noise.start(t);
    noise.stop(t + 2);
  }

  private playTrainDepart(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(80, t + 2);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.linearRampToValueAtTime(0, t + 2);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 2);
  }

  private playTrainDoors(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 400;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    noise.connect(bp).connect(env).connect(this.gainNode!);
    noise.start(t);
    noise.stop(t + 0.15);
    // Metallic ring
    const ring = ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = 3000;
    const rEnv = ctx.createGain();
    rEnv.gain.setValueAtTime(0.1, t + 0.05);
    rEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    ring.connect(rEnv).connect(this.gainNode!);
    ring.start(t + 0.05);
    ring.stop(t + 0.3);
  }

  private playCatchNPC(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.2);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private playMissionStart(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const freqs = [262, 330, 392]; // C4, E4, G4
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const env = ctx.createGain();
      const start = t + i * 0.15;
      env.gain.setValueAtTime(0.2, start);
      env.gain.exponentialRampToValueAtTime(0.01, start + 0.14);
      osc.connect(env).connect(this.gainNode!);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  private playMissionComplete(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const freqs = [262, 330, 392, 523, 659]; // C4→E5
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const env = ctx.createGain();
      const start = t + i * 0.18;
      env.gain.setValueAtTime(0.25, start);
      env.gain.exponentialRampToValueAtTime(0.01, start + 0.17);
      osc.connect(env).connect(this.gainNode!);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  private playMissionFail(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const freqs = [392, 262]; // G4, C4
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const env = ctx.createGain();
      const start = t + i * 0.25;
      env.gain.setValueAtTime(0.25, start);
      env.gain.exponentialRampToValueAtTime(0.01, start + 0.24);
      osc.connect(env).connect(this.gainNode!);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  private playLevelUp(): void {
    const ctx = this.ctx!;
    const t = this.now();
    // Arpeggio
    const freqs = [262, 330, 392, 523];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const env = ctx.createGain();
      const start = t + i * 0.1;
      env.gain.setValueAtTime(0.3, start);
      env.gain.exponentialRampToValueAtTime(0.05, start + 0.2);
      osc.connect(env).connect(this.gainNode!);
      osc.start(start);
      osc.stop(start + 0.25);
    });
    // Sub bass hit
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 50;
    const bEnv = ctx.createGain();
    bEnv.gain.setValueAtTime(0.3, t + 0.4);
    bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    bass.connect(bEnv).connect(this.gainNode!);
    bass.start(t + 0.4);
    bass.stop(t + 0.6);
  }

  private playMoneyEarn(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 4000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playMoneySpend(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.12, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private playUIClick(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 600;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  private playNPCInteract(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 500;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env).connect(this.gainNode!);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playAlert(): void {
    const ctx = this.ctx!;
    const t = this.now();
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = i % 2 === 0 ? 800 : 1000;
      const env = ctx.createGain();
      const start = t + i * 0.1;
      env.gain.setValueAtTime(0.15, start);
      env.gain.linearRampToValueAtTime(0, start + 0.09);
      osc.connect(env).connect(this.gainNode!);
      osc.start(start);
      osc.stop(start + 0.1);
    }
  }

  private playAmbientCrowd(): { stop: () => void } {
    const ctx = this.ctx!;
    let running = true;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(5);
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.5;
    const env = ctx.createGain();
    env.gain.value = 0.04;
    noise.connect(bp).connect(env).connect(this.gainNode!);
    noise.start();

    return {
      stop: () => {
        if (running) {
          running = false;
          env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          setTimeout(() => { try { noise.stop(); } catch {} }, 600);
        }
      },
    };
  }
}
