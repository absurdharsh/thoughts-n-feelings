// ==========================================================================
// MINERAL AUDIO ENGINE — Web Audio API Synthesizer
// Zero external audio files: generates tactile stone-on-stone taps,
// coarse mineral slab friction, and deep underground chamber resonance.
// ==========================================================================

class MineralAudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
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
      // AudioContext blocked by policy
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.ambientGain) {
      this.toggleAmbient(false);
    }
  }

  // Deep, subtle stone-on-stone tap (chisel impact on rock)
  playClick(pitchMod = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    try {
      // 1. Low frequency basalt body resonance (acoustic stone thud)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(38 * pitchMod, t + 0.07);

      oscGain.gain.setValueAtTime(0.22, t);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);

      // 2. High-frequency micro-chisel fracture transient (limestone crack)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 * pitchMod, t);
      filter.Q.setValueAtTime(3.0, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.06, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
    } catch {
      // Silent catch
    }
  }

  // Heavy shifting stone slab friction (coarse granite slide)
  playFold() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    try {
      const duration = 0.18;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Heavy low-pass mineral rumble
      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(350, t);
      lowFilter.frequency.exponentialRampToValueAtTime(140, t + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noise.connect(lowFilter);
      lowFilter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch {
      // Silent catch
    }
  }

  // Deep underground chamber resonance (mineral silence drone)
  toggleAmbient(enable) {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    if (!enable) {
      if (this.ambientGain) {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, t + 1.2);
        setTimeout(() => {
          if (this.ambientOsc1) {
            this.ambientOsc1.stop();
            this.ambientOsc1.disconnect();
            this.ambientOsc1 = null;
          }
          if (this.ambientOsc2) {
            this.ambientOsc2.stop();
            this.ambientOsc2.disconnect();
            this.ambientOsc2 = null;
          }
        }, 1300);
      }
      return;
    }

    try {
      if (this.ambientOsc1) return; // Already humming

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, t);
      this.ambientGain.gain.linearRampToValueAtTime(0.035, t + 2.0);

      // Deep 55Hz subterranean fundamental
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(55, t);

      // 110Hz harmonic with subtle 0.1Hz beat frequency
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(110.15, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start(t);
      this.ambientOsc2.start(t);
    } catch {
      // Silent catch
    }
  }
}

export const sound = new MineralAudioEngine();
