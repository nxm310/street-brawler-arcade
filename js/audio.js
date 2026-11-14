/**
 * Synthétiseur Web Audio API procédural (aucun asset audio externe requis).
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone({ freq = 440, endFreq = null, type = 'square', duration = 0.12, gain = 0.12, delay = 0 }) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const vol = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    vol.gain.setValueAtTime(gain, now);
    vol.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(vol);
    vol.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playMenu() {
    this._tone({ freq: 520, endFreq: 780, type: 'triangle', duration: 0.08, gain: 0.09 });
  }

  playJump() {
    this._tone({ freq: 180, endFreq: 420, type: 'sine', duration: 0.14, gain: 0.09 });
  }

  playLight() {
    this._tone({ freq: 320, endFreq: 95, type: 'sawtooth', duration: 0.09, gain: 0.11 });
  }

  playHeavy() {
    this._tone({ freq: 170, endFreq: 48, type: 'square', duration: 0.18, gain: 0.15 });
    this._tone({ freq: 95, endFreq: 35, type: 'triangle', duration: 0.22, gain: 0.14 });
  }

  playBlock() {
    this._tone({ freq: 620, endFreq: 280, type: 'triangle', duration: 0.08, gain: 0.11 });
  }

  playRoundStart() {
    this._tone({ freq: 440, type: 'square', duration: 0.1, gain: 0.1, delay: 0 });
    this._tone({ freq: 660, type: 'square', duration: 0.18, gain: 0.12, delay: 0.12 });
  }

  playKO() {
    this._tone({ freq: 260, endFreq: 45, type: 'sawtooth', duration: 0.45, gain: 0.18, delay: 0 });
    this._tone({ freq: 180, endFreq: 35, type: 'square', duration: 0.5, gain: 0.15, delay: 0.1 });
  }

  playSpecial(fighterId) {
    if (fighterId === 'm3g4') {
      this._tone({ freq: 240, endFreq: 1100, type: 'sawtooth', duration: 0.25, gain: 0.13 });
      this._tone({ freq: 880, endFreq: 120, type: 'square', duration: 0.35, gain: 0.14, delay: 0.18 });
    } else if (fighterId === 'madchat') {
      this._tone({ freq: 600, endFreq: 180, type: 'sawtooth', duration: 0.12, gain: 0.13, delay: 0 });
      this._tone({ freq: 720, endFreq: 220, type: 'sawtooth', duration: 0.12, gain: 0.13, delay: 0.1 });
      this._tone({ freq: 840, endFreq: 140, type: 'square', duration: 0.2, gain: 0.15, delay: 0.2 });
    } else if (fighterId === 'darkmada') {
      // Vrombissement moteur + aboiement synthétique
      this._tone({ freq: 95, endFreq: 220, type: 'sawtooth', duration: 0.3, gain: 0.15, delay: 0 });
      this._tone({ freq: 420, endFreq: 290, type: 'triangle', duration: 0.1, gain: 0.14, delay: 0.14 });
      this._tone({ freq: 480, endFreq: 240, type: 'triangle', duration: 0.12, gain: 0.14, delay: 0.28 });
    } else if (fighterId === 'goldohrack') {
      this._tone({ freq: 150, endFreq: 520, type: 'square', duration: 0.22, gain: 0.14, delay: 0 });
      this._tone({ freq: 220, endFreq: 55, type: 'sawtooth', duration: 0.35, gain: 0.16, delay: 0.2 });
    } else if (fighterId === 'koll') {
      this._tone({ freq: 960, endFreq: 240, type: 'sawtooth', duration: 0.15, gain: 0.12, delay: 0 });
      this._tone({ freq: 1120, endFreq: 180, type: 'square', duration: 0.25, gain: 0.14, delay: 0.12 });
      this._tone({ freq: 120, endFreq: 45, type: 'sine', duration: 0.35, gain: 0.16, delay: 0.18 });
    } else {
      // lurck
      this._tone({ freq: 740, endFreq: 520, type: 'sine', duration: 0.22, gain: 0.12, delay: 0 });
      this._tone({ freq: 520, endFreq: 220, type: 'triangle', duration: 0.3, gain: 0.14, delay: 0.18 });
    }
  }
}
