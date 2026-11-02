// ==========================================================================
// ANCIENT LITHIC ACOUSTIC ENGINE — Web Audio API
// Synthesizes quiet, organic low-frequency room tone (chamber air resonance)
// and dull, tactile stone-on-stone clicks with zero external audio assets.
// ==========================================================================

class AncientStoneAudio {
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
      // AudioContext policy
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.ambientGain) {
      this.toggleAmbient(false);
    }
  }

  // Dull stone-on-stone acoustic click (chisel tap on limestone)
  playClick(pitchMod = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    try {
      // 1. Deep acoustic body thud (stone core mass)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(32 * pitchMod, t + 0.08);

      oscGain.gain.setValueAtTime(0.24, t);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);

      // 2. Chisel strike contact impulse (dull mineral chink)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 * pitchMod, t);
      filter.Q.setValueAtTime(3.5, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
    } catch {}
  }

  // Heavy stone slab unsealing friction
  playFold() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    try {
      const duration = 0.16;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(280, t);
      lowFilter.frequency.exponentialRampToValueAtTime(120, t + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noise.connect(lowFilter);
      lowFilter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch {}
  }

  // Quiet, organic low-frequency subterranean room tone
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
      if (this.ambientOsc1) return;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, t);
      this.ambientGain.gain.linearRampToValueAtTime(0.025, t + 2.0);

      // Low 44Hz (F0) subterranean air body
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(44.0, t);

      // 88.2Hz octave resonance with gentle slow acoustic breathing
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(88.1, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, t);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientOsc1.start(t);
      this.ambientOsc2.start(t);
    } catch {}
  }
}

export const sound = new AncientStoneAudio();
