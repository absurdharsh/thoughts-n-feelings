// Ambient Web Audio API Synthesizer (Zero external dependencies)
class RetroAudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.noiseNode = null;
    this.isMuted = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch {
      // AudioContext not allowed or not supported
    }
  }

  // Play subtle mechanical switch click
  playClick(pitch = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') {
      if (this.ctx) this.ctx.resume();
    }
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 * pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120 * pitch, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore audio failure
    }
  }

  // Play soft parchment page fold sound
  playFold() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Noise burst filtered for paper rustle
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch {
      // Ignore
    }
  }

  // Start or stop continuous warm ambient drone / CRT hum
  toggleAmbient(enable) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!enable) {
      if (this.ambientGain) {
        try {
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
          setTimeout(() => {
            if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); this.osc1 = null; }
            if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); this.osc2 = null; }
          }, 600);
        } catch {}
      }
      return;
    }

    try {
      if (this.osc1 || this.osc2) return;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.015, this.ctx.currentTime + 2.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1 note

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(110.2, this.ctx.currentTime); // A2 slight beat frequency

      this.osc1.connect(filter);
      this.osc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.osc1.start();
      this.osc2.start();
    } catch {
      // Ignore
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.toggleAmbient(false);
    }
  }
}

export const sound = new RetroAudioEngine();

