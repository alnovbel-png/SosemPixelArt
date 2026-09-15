// Synthesized Web Audio API sound effects & retro BGM
// Runs 100% offline without external audio files!

class SoundSystem {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  public isBgmPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a simple tone with envelope
  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.1, detune: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (detune) osc.detune.setValueAtTime(detune, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio might be blocked before user interaction
    }
  }

  // Blip when characters talk
  public playVoiceBlip(highPitch: boolean = false) {
    const baseFreq = highPitch ? 520 : 340;
    const jitter = (Math.random() - 0.5) * 60;
    this.playTone(baseFreq + jitter, 'triangle', 0.05, 0.04);
  }

  // UI selection blip
  public playMenuSelect() {
    this.playTone(480, 'sine', 0.06, 0.03);
  }

  // Footstep grass/stone rustle
  public playStep() {
    this.playTone(180 + Math.random() * 40, 'triangle', 0.04, 0.02);
  }

  // Compass Resonance activation: ethereal chord
  public playCompassChime() {
    if (this.isMuted) return;
    this.initCtx();
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.8, 0.08);
      }, idx * 70);
    });
  }

  // Positive emotion validation / Quest solve
  public playSuccessFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    const melody = [
      { f: 440, d: 0.12 }, // A4
      { f: 554.37, d: 0.12 }, // C#5
      { f: 659.25, d: 0.15 }, // E5
      { f: 880, d: 0.4 }, // A5
    ];
    let time = 0;
    melody.forEach((m) => {
      setTimeout(() => {
        this.playTone(m.f, 'square', m.d, 0.06);
      }, time * 1000);
      time += m.d;
    });
  }

  // Color restored: majestic warm swell
  public playColorRestore() {
    if (this.isMuted) return;
    this.initCtx();
    const chords = [392, 493.88, 587.33, 783.99, 987.77];
    chords.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 1.2, 0.07);
      }, i * 90);
    });
  }

  // Secret found (Professor Kotek or Secret Tree)
  public playSecretFound() {
    if (this.isMuted) return;
    this.initCtx();
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.playTone(f, 'triangle', 0.25, 0.08);
      }, i * 60);
    });
  }

  // Breathing cue: inhale ascending gentle wave, exhale descending
  public playBreatheIn() {
    if (this.isMuted) return;
    this.playTone(330, 'sine', 1.8, 0.05);
  }

  public playBreatheOut() {
    if (this.isMuted) return;
    this.playTone(261.63, 'sine', 2.0, 0.04);
  }

  // Background procedural retro melody
  public startBGM() {
    if (this.bgmInterval || this.isMuted) return;
    this.initCtx();
    this.isBgmPlaying = true;

    // Peaceful 8-bar pentatonic soothing sequence
    const notes = [
      329.63, 392.00, 440.00, 523.25, 659.25, 523.25, 440.00, 392.00,
      349.23, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00,
    ];

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted) return;
      const f = notes[this.bgmStep % notes.length];
      // Light chime
      this.playTone(f, 'triangle', 0.25, 0.02);
      this.bgmStep++;
    }, 450);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }
}

export const sound = new SoundSystem();
