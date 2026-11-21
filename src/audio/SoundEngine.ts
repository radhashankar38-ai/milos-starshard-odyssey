/**
 * Original procedural Web Audio API Sound and Music Engine
 * Generates custom 16-bit / orchestral chiptune melodic music and sound effects without external audio files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.45;
  private sfxVolume: number = 0.65;
  private currentTrack: string | null = null;
  private isPlayingMusic: boolean = false;
  private musicTimer: number | null = null;
  private musicNodes: { osc?: OscillatorNode; gain?: GainNode }[] = [];
  private currentWorldTheme: string = 'sunmeadow';

  constructor() {
    // Lazy initialize on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudio() {
    this.initCtx();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
    } else if (this.currentTrack) {
      this.playMusic(this.currentTrack);
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  // --- SOUND EFFECTS ---
  public playJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.14);

    gain.gain.setValueAtTime(this.sfxVolume * 0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playDoubleJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(740, t + 0.16);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playLand() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playStarshard() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [784, 1046]; // G5, C6
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + idx * 0.04 + 0.1);

      gain.gain.setValueAtTime(this.sfxVolume * 0.22, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.16);
    });
  }

  public playGrandStarshard() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.36);
    });
  }

  public playPowerup() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [392, 523, 659, 784, 1046, 1318];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(this.sfxVolume * 0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  public playShoot() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playEnemyHit() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.setValueAtTime(120, t + 0.05);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playEnemyDefeat() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playPlayerHurt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playSpring() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playBlockBreak() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playCheckpoint() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(this.sfxVolume * 0.3, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.32);
    });
  }

  public playBeaconCelebration() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopMusic();
    const t = this.ctx.currentTime;
    // Energetic fanfare chords: C - G - Am - F - C - G - C(high)
    const melody = [
      { f: 523.25, d: 0.15, time: 0 },
      { f: 659.25, d: 0.15, time: 0.15 },
      { f: 783.99, d: 0.15, time: 0.3 },
      { f: 1046.5, d: 0.35, time: 0.45 },
      { f: 880.0, d: 0.2, time: 0.8 },
      { f: 1046.5, d: 0.2, time: 1.0 },
      { f: 1318.5, d: 0.6, time: 1.2 },
    ];

    melody.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.time);
      gain.gain.setValueAtTime(this.sfxVolume * 0.5, t + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + n.time);
      osc.stop(t + n.time + n.d + 0.05);
    });
  }

  public playBossRoar() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.45);

    gain.gain.setValueAtTime(this.sfxVolume * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  // --- BACKGROUND MUSIC SYNTHESIS ---
  public playMusic(track: string) {
    if (this.isMuted) {
      this.currentTrack = track;
      return;
    }
    if (this.currentTrack === track && this.isPlayingMusic) {
      return;
    }

    this.stopMusic();
    this.currentTrack = track;
    this.isPlayingMusic = true;
    this.initCtx();
    if (!this.ctx) return;

    let step = 0;
    const bpm = track === 'boss' ? 140 : track === 'map' ? 108 : 124;
    const stepDuration = 60 / bpm / 2; // 16th or 8th notes

    // Custom procedural world melody scales
    const getTrackPattern = (tName: string, s: number) => {
      const idx = s % 32;
      switch (tName) {
        case 'boss': {
          // Intense dramatic driving bass & minor lead
          const bass = [110, 110, 130.8, 110, 146.8, 110, 130.8, 123.5][idx % 8];
          const leadNotes = [
            440, 0, 523.25, 440, 659.25, 587.33, 523.25, 493.88,
            440, 0, 659.25, 698.46, 659.25, 523.25, 587.33, 440,
            587.33, 0, 659.25, 587.33, 523.25, 493.88, 440, 392,
            440, 493.88, 523.25, 587.33, 659.25, 783.99, 880, 0
          ];
          return { bass, lead: leadNotes[idx], waveLead: 'sawtooth' as OscillatorType, waveBass: 'square' as OscillatorType };
        }
        case 'map': {
          // Cheerful, wanderlust adventure overworld theme
          const bass = [130.8, 0, 164.8, 0, 196.0, 0, 174.6, 0][idx % 8];
          const leadNotes = [
            523.25, 0, 659.25, 783.99, 880, 0, 783.99, 659.25,
            523.25, 587.33, 659.25, 0, 587.33, 0, 0, 0,
            659.25, 0, 783.99, 880, 1046.5, 0, 880, 783.99,
            880, 783.99, 659.25, 587.33, 523.25, 0, 0, 0
          ];
          return { bass, lead: leadNotes[idx], waveLead: 'triangle' as OscillatorType, waveBass: 'sine' as OscillatorType };
        }
        case 'crystal_caverns': {
          // Ethereal, echoing shimmering crystal melody
          const bass = [146.83, 0, 174.61, 0, 220, 0, 196, 0][idx % 8];
          const leadNotes = [
            587.33, 880, 698.46, 1174.66, 880, 0, 698.46, 587.33,
            659.25, 0, 783.99, 1046.5, 880, 0, 0, 0,
            587.33, 880, 698.46, 1174.66, 1318.51, 0, 1174.66, 880,
            783.99, 0, 659.25, 587.33, 523.25, 0, 0, 0
          ];
          return { bass, lead: leadNotes[idx], waveLead: 'sine' as OscillatorType, waveBass: 'triangle' as OscillatorType };
        }
        case 'emberpeak': {
          // Fiery upbeat drive
          const bass = [110, 110, 130.8, 146.83, 110, 110, 164.81, 146.83][idx % 8];
          const leadNotes = [
            440, 523.25, 659.25, 0, 587.33, 440, 523.25, 0,
            659.25, 783.99, 880, 0, 783.99, 659.25, 587.33, 0,
            440, 523.25, 659.25, 783.99, 880, 0, 783.99, 659.25,
            587.33, 523.25, 440, 392, 440, 0, 0, 0
          ];
          return { bass, lead: leadNotes[idx], waveLead: 'sawtooth' as OscillatorType, waveBass: 'sawtooth' as OscillatorType };
        }
        case 'cloudspire': {
          // Floating, breezy high altitude flute-like arpeggio
          const bass = [174.61, 0, 220, 0, 261.63, 0, 220, 0][idx % 8];
          const leadNotes = [
            698.46, 880, 1046.5, 880, 1318.51, 1046.5, 880, 698.46,
            783.99, 1046.5, 1174.66, 1046.5, 880, 783.99, 698.46, 0,
            880, 1046.5, 1318.51, 1567.98, 1318.51, 1046.5, 880, 783.99,
            698.46, 880, 1046.5, 880, 698.46, 0, 0, 0
          ];
          return { bass, lead: leadNotes[idx], waveLead: 'sine' as OscillatorType, waveBass: 'sine' as OscillatorType };
        }
        default: {
          // Sunmeadow / Standard vibrant mascot platforming theme
          const bass = [130.8, 130.8, 164.8, 130.8, 196.0, 130.8, 164.8, 196.0][idx % 8];
          const leadNotes = [
            523.25, 0, 523.25, 659.25, 783.99, 0, 659.25, 523.25,
            587.33, 0, 659.25, 587.33, 523.25, 0, 392, 0,
            523.25, 0, 659.25, 783.99, 880, 0, 783.99, 659.25,
            880, 783.99, 659.25, 587.33, 523.25, 0, 0, 0
          ];
          return { bass, lead: leadNotes[idx], waveLead: 'square' as OscillatorType, waveBass: 'triangle' as OscillatorType };
        }
      }
    };

    const playNextStep = () => {
      if (!this.isPlayingMusic || !this.ctx || this.isMuted) return;

      const pattern = getTrackPattern(track, step);
      const t = this.ctx.currentTime;
      const noteLen = stepDuration * 0.85;

      // Bass note
      if (pattern.bass > 0) {
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = pattern.waveBass;
        oscB.frequency.setValueAtTime(pattern.bass, t);
        gainB.gain.setValueAtTime(this.musicVolume * 0.18, t);
        gainB.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
        oscB.connect(gainB);
        gainB.connect(this.ctx.destination);
        oscB.start(t);
        oscB.stop(t + noteLen + 0.02);
      }

      // Lead note
      if (pattern.lead > 0) {
        const oscL = this.ctx.createOscillator();
        const gainL = this.ctx.createGain();
        oscL.type = pattern.waveLead;
        oscL.frequency.setValueAtTime(pattern.lead, t);
        gainL.gain.setValueAtTime(this.musicVolume * 0.15, t);
        gainL.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
        oscL.connect(gainL);
        gainL.connect(this.ctx.destination);
        oscL.start(t);
        oscL.stop(t + noteLen + 0.02);
      }

      step++;
      this.musicTimer = window.setTimeout(playNextStep, stepDuration * 1000);
    };

    playNextStep();
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
