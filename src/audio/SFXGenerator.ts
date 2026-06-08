/**
 * SFXGenerator — Gritty NYC MTA sound effects
 * All procedural via Web Audio API. Dark, realistic, urban.
 */
export class SFXGenerator {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 0.8;
  private compressor: DynamicsCompressorNode | null = null;

  init(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master compressor for punch
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.15;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.volume;
      this.compressor.connect(this.gainNode);
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
      case 'spray_paint': this.playSprayPaint(); break;
      case 'tag_rival': this.playTagRival(); break;
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

  // === Helpers ===

  private get out(): AudioNode {
    return this.compressor ?? this.gainNode!;
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx!.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /** Brown noise — deeper, more natural rumble */
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
      d[i] *= 3.5; // boost
    }
    return buf;
  }

  /** Simple waveshaper distortion for grit */
  private createDistortion(amount: number = 20): WaveShaperNode {
    const ws = this.ctx!.createWaveShaper();
    const k = amount;
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    ws.curve = curve;
    ws.oversample = '2x';
    return ws;
  }

  private now(): number {
    return this.ctx!.currentTime;
  }

  // === SFX ===

  private playFootstepConcrete(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Layer 1: Low thud (impact)
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(80 + Math.random() * 20, t);
    thud.frequency.exponentialRampToValueAtTime(40, t + 0.06);
    const thudEnv = ctx.createGain();
    thudEnv.gain.setValueAtTime(0.2, t);
    thudEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    thud.connect(thudEnv).connect(this.out);
    thud.start(t);
    thud.stop(t + 0.08);

    // Layer 2: Gritty scuff (filtered noise)
    const scuff = ctx.createBufferSource();
    scuff.buffer = this.createNoiseBuffer(0.06);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200 + Math.random() * 600;
    bp.Q.value = 1.5;
    const scuffEnv = ctx.createGain();
    scuffEnv.gain.setValueAtTime(0.12, t);
    scuffEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    scuff.connect(bp).connect(scuffEnv).connect(this.out);
    scuff.start(t + 0.005);
    scuff.stop(t + 0.06);
  }

  private playFootstepTile(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Sharp click
    const click = ctx.createOscillator();
    click.type = 'square';
    click.frequency.value = 3000 + Math.random() * 500;
    const clickEnv = ctx.createGain();
    clickEnv.gain.setValueAtTime(0.08, t);
    clickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(clickEnv).connect(this.out);
    click.start(t);
    click.stop(t + 0.015);

    // Tile resonance
    const res = ctx.createOscillator();
    res.type = 'sine';
    res.frequency.value = 1800 + Math.random() * 400;
    const resEnv = ctx.createGain();
    resEnv.gain.setValueAtTime(0.06, t + 0.01);
    resEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    res.connect(resEnv).connect(this.out);
    res.start(t + 0.01);
    res.stop(t + 0.08);
  }

  private playStepSprint(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Harder impact
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(100, t);
    thud.frequency.exponentialRampToValueAtTime(35, t + 0.05);
    const thudEnv = ctx.createGain();
    thudEnv.gain.setValueAtTime(0.3, t);
    thudEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    thud.connect(thudEnv).connect(this.out);
    thud.start(t);
    thud.stop(t + 0.06);

    // Fast scuff
    const scuff = ctx.createBufferSource();
    scuff.buffer = this.createNoiseBuffer(0.04);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    scuff.connect(hp).connect(env).connect(this.out);
    scuff.start(t + 0.003);
    scuff.stop(t + 0.04);
  }

  private playRadioCrackle(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Squelch burst
    const squelch = ctx.createOscillator();
    squelch.type = 'sawtooth';
    squelch.frequency.value = 3500;
    const sqEnv = ctx.createGain();
    sqEnv.gain.setValueAtTime(0.12, t);
    sqEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    squelch.connect(sqEnv).connect(this.out);
    squelch.start(t);
    squelch.stop(t + 0.03);

    // Static crackle
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 5;
    const dist = this.createDistortion(50);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.02, t + 0.02);
    env.gain.linearRampToValueAtTime(0.15, t + 0.05);
    env.gain.setValueAtTime(0.15, t + 0.1);
    env.gain.linearRampToValueAtTime(0.08, t + 0.2);
    env.gain.linearRampToValueAtTime(0, t + 0.3);
    noise.connect(bp).connect(dist).connect(env).connect(this.out);
    noise.start(t + 0.02);
    noise.stop(t + 0.3);
  }

  private playRadioBeep(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Two-tone radio beep (like real walkie-talkie)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 1200;
    const env1 = ctx.createGain();
    env1.gain.setValueAtTime(0.18, t);
    env1.gain.setValueAtTime(0.18, t + 0.06);
    env1.gain.linearRampToValueAtTime(0, t + 0.08);
    osc1.connect(env1).connect(this.out);
    osc1.start(t);
    osc1.stop(t + 0.08);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1600;
    const env2 = ctx.createGain();
    env2.gain.setValueAtTime(0.15, t + 0.1);
    env2.gain.setValueAtTime(0.15, t + 0.16);
    env2.gain.linearRampToValueAtTime(0, t + 0.18);
    osc2.connect(env2).connect(this.out);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.18);
  }

  private playTrainArrive(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const dur = 3.5;

    // 1. Deep rumble building up (brown noise)
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.createBrownNoiseBuffer(dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(100, t);
    lp.frequency.linearRampToValueAtTime(400, t + dur * 0.7);
    lp.frequency.linearRampToValueAtTime(200, t + dur);
    const rumbleEnv = ctx.createGain();
    rumbleEnv.gain.setValueAtTime(0.02, t);
    rumbleEnv.gain.linearRampToValueAtTime(0.25, t + dur * 0.7);
    rumbleEnv.gain.linearRampToValueAtTime(0.12, t + dur);
    rumble.connect(lp).connect(rumbleEnv).connect(this.out);
    rumble.start(t);
    rumble.stop(t + dur);

    // 2. Metal screech (brakes)
    const screech = ctx.createBufferSource();
    screech.buffer = this.createNoiseBuffer(1.5);
    const screechBp = ctx.createBiquadFilter();
    screechBp.type = 'bandpass';
    screechBp.frequency.setValueAtTime(4000, t + dur * 0.5);
    screechBp.frequency.linearRampToValueAtTime(2500, t + dur);
    screechBp.Q.value = 12;
    const screechEnv = ctx.createGain();
    screechEnv.gain.setValueAtTime(0.0, t);
    screechEnv.gain.setValueAtTime(0.0, t + dur * 0.5);
    screechEnv.gain.linearRampToValueAtTime(0.08, t + dur * 0.65);
    screechEnv.gain.linearRampToValueAtTime(0.04, t + dur * 0.9);
    screechEnv.gain.linearRampToValueAtTime(0.0, t + dur);
    screech.connect(screechBp).connect(screechEnv).connect(this.out);
    screech.start(t);
    screech.stop(t + dur);

    // 3. Rail clack rhythm
    const clackCount = 8;
    for (let i = 0; i < clackCount; i++) {
      const clackTime = t + 0.3 + i * 0.35;
      if (clackTime > t + dur) break;
      const clack = ctx.createBufferSource();
      clack.buffer = this.createNoiseBuffer(0.03);
      const clackBp = ctx.createBiquadFilter();
      clackBp.type = 'bandpass';
      clackBp.frequency.value = 2000;
      clackBp.Q.value = 2;
      const clackEnv = ctx.createGain();
      const vol = 0.06 + (i / clackCount) * 0.1;
      clackEnv.gain.setValueAtTime(vol, clackTime);
      clackEnv.gain.exponentialRampToValueAtTime(0.001, clackTime + 0.03);
      clack.connect(clackBp).connect(clackEnv).connect(this.out);
      clack.start(clackTime);
      clack.stop(clackTime + 0.03);
    }

    // 4. Air brake hiss at end
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.createNoiseBuffer(0.8);
    const hissHp = ctx.createBiquadFilter();
    hissHp.type = 'highpass';
    hissHp.frequency.value = 3000;
    const hissEnv = ctx.createGain();
    hissEnv.gain.setValueAtTime(0.0, t);
    hissEnv.gain.setValueAtTime(0.0, t + dur - 0.8);
    hissEnv.gain.linearRampToValueAtTime(0.15, t + dur - 0.5);
    hissEnv.gain.exponentialRampToValueAtTime(0.01, t + dur);
    hiss.connect(hissHp).connect(hissEnv).connect(this.out);
    hiss.start(t);
    hiss.stop(t + dur);
  }

  private playTrainDepart(): void {
    const ctx = this.ctx!;
    const t = this.now();
    const dur = 3;

    // Motor whine rising
    const motor = ctx.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(60, t);
    motor.frequency.exponentialRampToValueAtTime(300, t + dur);
    const motorLp = ctx.createBiquadFilter();
    motorLp.type = 'lowpass';
    motorLp.frequency.value = 500;
    const motorEnv = ctx.createGain();
    motorEnv.gain.setValueAtTime(0.08, t);
    motorEnv.gain.linearRampToValueAtTime(0.15, t + dur * 0.5);
    motorEnv.gain.linearRampToValueAtTime(0, t + dur);
    motor.connect(motorLp).connect(motorEnv).connect(this.out);
    motor.start(t);
    motor.stop(t + dur);

    // Rumble fading out
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.createBrownNoiseBuffer(dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const rumbleEnv = ctx.createGain();
    rumbleEnv.gain.setValueAtTime(0.2, t);
    rumbleEnv.gain.linearRampToValueAtTime(0, t + dur);
    rumble.connect(lp).connect(rumbleEnv).connect(this.out);
    rumble.start(t);
    rumble.stop(t + dur);
  }

  private playTrainDoors(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // MTA door chime — the iconic 3-tone "ding dong ding"
    const notes = [880, 659, 880]; // A5, E5, A5
    const times = [0, 0.25, 0.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      const start = t + times[i];
      env.gain.setValueAtTime(0.2, start);
      env.gain.exponentialRampToValueAtTime(0.02, start + 0.22);
      osc.connect(env).connect(this.out);
      osc.start(start);
      osc.stop(start + 0.22);
    });

    // Pneumatic door slide
    const slide = ctx.createBufferSource();
    slide.buffer = this.createNoiseBuffer(0.4);
    const slideBp = ctx.createBiquadFilter();
    slideBp.type = 'bandpass';
    slideBp.frequency.value = 600;
    slideBp.Q.value = 0.5;
    const slideEnv = ctx.createGain();
    slideEnv.gain.setValueAtTime(0.0, t);
    slideEnv.gain.setValueAtTime(0.0, t + 0.75);
    slideEnv.gain.linearRampToValueAtTime(0.12, t + 0.85);
    slideEnv.gain.exponentialRampToValueAtTime(0.01, t + 1.15);
    slide.connect(slideBp).connect(slideEnv).connect(this.out);
    slide.start(t);
    slide.stop(t + 1.15);

    // Heavy metallic thunk at end
    const thunk = ctx.createOscillator();
    thunk.type = 'sine';
    thunk.frequency.setValueAtTime(150, t + 1.1);
    thunk.frequency.exponentialRampToValueAtTime(50, t + 1.2);
    const thunkEnv = ctx.createGain();
    thunkEnv.gain.setValueAtTime(0.2, t + 1.1);
    thunkEnv.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    thunk.connect(thunkEnv).connect(this.out);
    thunk.start(t + 1.1);
    thunk.stop(t + 1.2);
  }

  private playCatchNPC(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Impact hit
    const hit = ctx.createOscillator();
    hit.type = 'sine';
    hit.frequency.setValueAtTime(200, t);
    hit.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    const hitEnv = ctx.createGain();
    hitEnv.gain.setValueAtTime(0.4, t);
    hitEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    hit.connect(hitEnv).connect(this.out);
    hit.start(t);
    hit.stop(t + 0.15);

    // Crunch noise
    const crunch = ctx.createBufferSource();
    crunch.buffer = this.createNoiseBuffer(0.1);
    const dist = this.createDistortion(40);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 800;
    bp.Q.value = 1;
    const crunchEnv = ctx.createGain();
    crunchEnv.gain.setValueAtTime(0.15, t);
    crunchEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    crunch.connect(bp).connect(dist).connect(crunchEnv).connect(this.out);
    crunch.start(t);
    crunch.stop(t + 0.1);

    // Satisfying "got em" tone
    const tone = ctx.createOscillator();
    tone.type = 'square';
    tone.frequency.setValueAtTime(500, t + 0.05);
    tone.frequency.linearRampToValueAtTime(800, t + 0.15);
    const toneEnv = ctx.createGain();
    toneEnv.gain.setValueAtTime(0.12, t + 0.05);
    toneEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    tone.connect(toneEnv).connect(this.out);
    tone.start(t + 0.05);
    tone.stop(t + 0.25);
  }

  private playMissionStart(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Dark cinematic hit — sub bass drop
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    const subEnv = ctx.createGain();
    subEnv.gain.setValueAtTime(0.35, t);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    sub.connect(subEnv).connect(this.out);
    sub.start(t);
    sub.stop(t + 0.5);

    // Noise impact
    const impact = ctx.createBufferSource();
    impact.buffer = this.createNoiseBuffer(0.15);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    const impEnv = ctx.createGain();
    impEnv.gain.setValueAtTime(0.25, t);
    impEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    impact.connect(lp).connect(impEnv).connect(this.out);
    impact.start(t);
    impact.stop(t + 0.15);

    // Rising tension tone
    const rise = ctx.createOscillator();
    rise.type = 'sawtooth';
    rise.frequency.setValueAtTime(200, t + 0.15);
    rise.frequency.linearRampToValueAtTime(600, t + 0.6);
    const riseLp = ctx.createBiquadFilter();
    riseLp.type = 'lowpass';
    riseLp.frequency.value = 800;
    const riseEnv = ctx.createGain();
    riseEnv.gain.setValueAtTime(0.0, t);
    riseEnv.gain.setValueAtTime(0.0, t + 0.15);
    riseEnv.gain.linearRampToValueAtTime(0.1, t + 0.4);
    riseEnv.gain.linearRampToValueAtTime(0.0, t + 0.7);
    rise.connect(riseLp).connect(riseEnv).connect(this.out);
    rise.start(t + 0.15);
    rise.stop(t + 0.7);
  }

  private playMissionComplete(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Triumphant brass-like stabs (minor → major resolution)
    const stabs = [
      { f: 220, t: 0, d: 0.2 },     // A3
      { f: 330, t: 0.15, d: 0.2 },   // E4
      { f: 440, t: 0.3, d: 0.25 },   // A4
      { f: 554, t: 0.5, d: 0.35 },   // C#5
      { f: 659, t: 0.65, d: 0.5 },   // E5
    ];

    for (const s of stabs) {
      // Main tone
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = s.f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = s.f * 3;
      const env = ctx.createGain();
      const start = t + s.t;
      env.gain.setValueAtTime(0.12, start);
      env.gain.setValueAtTime(0.12, start + s.d * 0.6);
      env.gain.exponentialRampToValueAtTime(0.001, start + s.d);
      osc.connect(lp).connect(env).connect(this.out);
      osc.start(start);
      osc.stop(start + s.d);

      // Octave reinforcement
      const oct = ctx.createOscillator();
      oct.type = 'sine';
      oct.frequency.value = s.f * 2;
      const octEnv = ctx.createGain();
      octEnv.gain.setValueAtTime(0.06, start);
      octEnv.gain.exponentialRampToValueAtTime(0.001, start + s.d * 0.8);
      oct.connect(octEnv).connect(this.out);
      oct.start(start);
      oct.stop(start + s.d);
    }

    // Sub bass punch
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 55;
    const bassEnv = ctx.createGain();
    bassEnv.gain.setValueAtTime(0.3, t);
    bassEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    bass.connect(bassEnv).connect(this.out);
    bass.start(t);
    bass.stop(t + 0.3);
  }

  private playMissionFail(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Dark descending tones
    const tones = [
      { f: 300, t: 0 },
      { f: 220, t: 0.3 },
      { f: 147, t: 0.6 },  // D3
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = tone.f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = tone.f * 2;
      const env = ctx.createGain();
      const start = t + tone.t;
      env.gain.setValueAtTime(0.15, start);
      env.gain.exponentialRampToValueAtTime(0.01, start + 0.28);
      osc.connect(lp).connect(env).connect(this.out);
      osc.start(start);
      osc.stop(start + 0.3);
    }

    // Distorted noise tail
    const noise = ctx.createBufferSource();
    noise.buffer = this.createBrownNoiseBuffer(1);
    const dist = this.createDistortion(30);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const noiseEnv = ctx.createGain();
    noiseEnv.gain.setValueAtTime(0.0, t);
    noiseEnv.gain.setValueAtTime(0.0, t + 0.5);
    noiseEnv.gain.linearRampToValueAtTime(0.08, t + 0.7);
    noiseEnv.gain.linearRampToValueAtTime(0.0, t + 1.3);
    noise.connect(lp).connect(dist).connect(noiseEnv).connect(this.out);
    noise.start(t);
    noise.stop(t + 1.3);
  }

  private playLevelUp(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Epic ascending power chord
    const chords = [
      { notes: [130.8, 196, 261.6], t: 0 },     // C3 power chord
      { notes: [164.8, 246.9, 329.6], t: 0.2 },  // E3
      { notes: [196, 293.7, 392], t: 0.4 },      // G3
      { notes: [261.6, 392, 523.3], t: 0.55 },   // C4 (octave up)
    ];

    for (const chord of chords) {
      for (const freq of chord.notes) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = freq * 4;
        const env = ctx.createGain();
        const start = t + chord.t;
        env.gain.setValueAtTime(0.08, start);
        env.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
        osc.connect(lp).connect(env).connect(this.out);
        osc.start(start);
        osc.stop(start + 0.3);
      }
    }

    // Big sub bass drop
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, t + 0.7);
    sub.frequency.exponentialRampToValueAtTime(25, t + 1.2);
    const subEnv = ctx.createGain();
    subEnv.gain.setValueAtTime(0.35, t + 0.7);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    sub.connect(subEnv).connect(this.out);
    sub.start(t + 0.7);
    sub.stop(t + 1.2);

    // Crash noise
    const crash = ctx.createBufferSource();
    crash.buffer = this.createNoiseBuffer(0.6);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5000;
    const crashEnv = ctx.createGain();
    crashEnv.gain.setValueAtTime(0.12, t + 0.7);
    crashEnv.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    crash.connect(hp).connect(crashEnv).connect(this.out);
    crash.start(t + 0.7);
    crash.stop(t + 1.3);
  }

  private playMoneyEarn(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Cash register "ka-ching" — metallic bell hit + coin jingle
    const bell = ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = 2200;
    const bellEnv = ctx.createGain();
    bellEnv.gain.setValueAtTime(0.15, t);
    bellEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    bell.connect(bellEnv).connect(this.out);
    bell.start(t);
    bell.stop(t + 0.15);

    // Second harmonic
    const h2 = ctx.createOscillator();
    h2.type = 'sine';
    h2.frequency.value = 3300;
    const h2Env = ctx.createGain();
    h2Env.gain.setValueAtTime(0.08, t);
    h2Env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    h2.connect(h2Env).connect(this.out);
    h2.start(t);
    h2.stop(t + 0.1);

    // Coin jingle (rapid high tinkles)
    for (let i = 0; i < 3; i++) {
      const coin = ctx.createOscillator();
      coin.type = 'sine';
      coin.frequency.value = 4000 + i * 500 + Math.random() * 300;
      const coinEnv = ctx.createGain();
      const ct = t + 0.05 + i * 0.04;
      coinEnv.gain.setValueAtTime(0.06, ct);
      coinEnv.gain.exponentialRampToValueAtTime(0.001, ct + 0.06);
      coin.connect(coinEnv).connect(this.out);
      coin.start(ct);
      coin.stop(ct + 0.06);
    }
  }

  private playMoneySpend(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Descending coin loss
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.12, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playUIClick(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Tight mechanical click
    const click = ctx.createOscillator();
    click.type = 'square';
    click.frequency.value = 1800;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.08, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(env).connect(this.out);
    click.start(t);
    click.stop(t + 0.015);

    // Soft thud body
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.value = 300;
    const thudEnv = ctx.createGain();
    thudEnv.gain.setValueAtTime(0.05, t);
    thudEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    thud.connect(thudEnv).connect(this.out);
    thud.start(t);
    thud.stop(t + 0.03);
  }

  private playNPCInteract(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Conversational "bip-bop" acknowledgment
    const bip = ctx.createOscillator();
    bip.type = 'sine';
    bip.frequency.value = 440;
    const bipEnv = ctx.createGain();
    bipEnv.gain.setValueAtTime(0.12, t);
    bipEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    bip.connect(bipEnv).connect(this.out);
    bip.start(t);
    bip.stop(t + 0.08);

    const bop = ctx.createOscillator();
    bop.type = 'sine';
    bop.frequency.value = 554;  // C#5
    const bopEnv = ctx.createGain();
    bopEnv.gain.setValueAtTime(0.1, t + 0.1);
    bopEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    bop.connect(bopEnv).connect(this.out);
    bop.start(t + 0.1);
    bop.stop(t + 0.18);
  }

  private playAlert(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Urgent two-tone siren (like NYPD radio alert)
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.2;

      const hi = ctx.createOscillator();
      hi.type = 'square';
      hi.frequency.value = 900;
      const hiEnv = ctx.createGain();
      hiEnv.gain.setValueAtTime(0.1, start);
      hiEnv.gain.linearRampToValueAtTime(0, start + 0.09);
      hi.connect(hiEnv).connect(this.out);
      hi.start(start);
      hi.stop(start + 0.09);

      const lo = ctx.createOscillator();
      lo.type = 'square';
      lo.frequency.value = 700;
      const loEnv = ctx.createGain();
      loEnv.gain.setValueAtTime(0.1, start + 0.1);
      loEnv.gain.linearRampToValueAtTime(0, start + 0.19);
      lo.connect(loEnv).connect(this.out);
      lo.start(start + 0.1);
      lo.stop(start + 0.19);
    }

    // Sub thump for urgency
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 50;
    const subEnv = ctx.createGain();
    subEnv.gain.setValueAtTime(0.2, t);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    sub.connect(subEnv).connect(this.out);
    sub.start(t);
    sub.stop(t + 0.15);
  }

  /** Spray can hiss — filtered white noise with pitch sweep */
  private playSprayPaint(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Layer 1: Spray hiss (high-pass filtered noise)
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.8);
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 3000;
    hpf.Q.value = 1.5;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.05);
    env.gain.setValueAtTime(0.12, t + 0.5);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    noise.connect(hpf).connect(env).connect(this.out);
    noise.start(t);
    noise.stop(t + 0.8);

    // Layer 2: Ball rattle in can (metallic clicks)
    for (let i = 0; i < 3; i++) {
      const click = ctx.createOscillator();
      click.type = 'square';
      click.frequency.value = 2000 + Math.random() * 1000;
      const clickEnv = ctx.createGain();
      const ct = t + 0.02 + i * 0.04;
      clickEnv.gain.setValueAtTime(0.06, ct);
      clickEnv.gain.exponentialRampToValueAtTime(0.001, ct + 0.02);
      click.connect(clickEnv).connect(this.out);
      click.start(ct);
      click.stop(ct + 0.02);
    }

    // Layer 3: Low pressure whoosh
    const whoosh = ctx.createOscillator();
    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(80, t);
    whoosh.frequency.linearRampToValueAtTime(40, t + 0.6);
    const whooshEnv = ctx.createGain();
    whooshEnv.gain.setValueAtTime(0.03, t);
    whooshEnv.gain.linearRampToValueAtTime(0, t + 0.6);
    whoosh.connect(whooshEnv).connect(this.out);
    whoosh.start(t);
    whoosh.stop(t + 0.6);
  }

  /** Aggressive tag-over sound — spray + low grunt/impact */
  private playTagRival(): void {
    const ctx = this.ctx!;
    const t = this.now();

    // Spray hiss (same as above but shorter, punchier)
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.5);
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 2500;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    noise.connect(hpf).connect(env).connect(this.out);
    noise.start(t);
    noise.stop(t + 0.5);

    // Impact thud — claiming territory
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.value = 60;
    const thudEnv = ctx.createGain();
    thudEnv.gain.setValueAtTime(0.25, t);
    thudEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    thud.connect(thudEnv).connect(this.out);
    thud.start(t);
    thud.stop(t + 0.2);

    // Triumph tone — quick ascending notes
    const note1 = ctx.createOscillator();
    note1.type = 'triangle';
    note1.frequency.value = 440;
    const n1Env = ctx.createGain();
    n1Env.gain.setValueAtTime(0.08, t + 0.15);
    n1Env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    note1.connect(n1Env).connect(this.out);
    note1.start(t + 0.15);
    note1.stop(t + 0.25);

    const note2 = ctx.createOscillator();
    note2.type = 'triangle';
    note2.frequency.value = 554;
    const n2Env = ctx.createGain();
    n2Env.gain.setValueAtTime(0.08, t + 0.22);
    n2Env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    note2.connect(n2Env).connect(this.out);
    note2.start(t + 0.22);
    note2.stop(t + 0.35);
  }

  private playAmbientCrowd(): { stop: () => void } {
    const ctx = this.ctx!;
    let running = true;

    // Layer 1: Crowd murmur (filtered brown noise — warmer than white)
    const crowd = ctx.createBufferSource();
    crowd.buffer = this.createBrownNoiseBuffer(8);
    crowd.loop = true;
    const crowdBp = ctx.createBiquadFilter();
    crowdBp.type = 'bandpass';
    crowdBp.frequency.value = 400;
    crowdBp.Q.value = 0.3;
    const crowdEnv = ctx.createGain();
    crowdEnv.gain.value = 0.04;
    crowd.connect(crowdBp).connect(crowdEnv).connect(this.out);
    crowd.start();

    // Layer 2: Distant traffic (deeper noise)
    const traffic = ctx.createBufferSource();
    traffic.buffer = this.createBrownNoiseBuffer(10);
    traffic.loop = true;
    const trafficLp = ctx.createBiquadFilter();
    trafficLp.type = 'lowpass';
    trafficLp.frequency.value = 200;
    const trafficEnv = ctx.createGain();
    trafficEnv.gain.value = 0.03;
    traffic.connect(trafficLp).connect(trafficEnv).connect(this.out);
    traffic.start();

    // Layer 3: Random city sounds (horns, distant sirens)
    const cityInterval = setInterval(() => {
      if (!running || !this.ctx) {
        clearInterval(cityInterval);
        return;
      }
      const r = Math.random();
      const t = ctx.currentTime;

      if (r < 0.3) {
        // Distant car horn
        const horn = ctx.createOscillator();
        horn.type = 'sawtooth';
        horn.frequency.value = 350 + Math.random() * 100;
        const hornLp = ctx.createBiquadFilter();
        hornLp.type = 'lowpass';
        hornLp.frequency.value = 600;
        const hornEnv = ctx.createGain();
        hornEnv.gain.setValueAtTime(0.02, t);
        hornEnv.gain.setValueAtTime(0.02, t + 0.3);
        hornEnv.gain.linearRampToValueAtTime(0, t + 0.4);
        horn.connect(hornLp).connect(hornEnv).connect(this.out);
        horn.start(t);
        horn.stop(t + 0.4);
      } else if (r < 0.45) {
        // Distant siren sweep
        const siren = ctx.createOscillator();
        siren.type = 'sine';
        siren.frequency.setValueAtTime(600, t);
        siren.frequency.linearRampToValueAtTime(900, t + 0.8);
        siren.frequency.linearRampToValueAtTime(600, t + 1.6);
        const sirenEnv = ctx.createGain();
        sirenEnv.gain.setValueAtTime(0.008, t);
        sirenEnv.gain.linearRampToValueAtTime(0.015, t + 0.8);
        sirenEnv.gain.linearRampToValueAtTime(0.005, t + 1.6);
        siren.connect(sirenEnv).connect(this.out);
        siren.start(t);
        siren.stop(t + 1.6);
      }
    }, 4000 + Math.random() * 4000) as unknown as number;

    return {
      stop: () => {
        if (running) {
          running = false;
          clearInterval(cityInterval);
          crowdEnv.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
          trafficEnv.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
          setTimeout(() => {
            try { crowd.stop(); } catch {}
            try { traffic.stop(); } catch {}
          }, 1200);
        }
      },
    };
  }
}
