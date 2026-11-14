/**
 * Synthétiseur 8-bit Chiptune & SFX Web Audio API procédural (zéro dépendance externe).
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicMode = 'none';
    this.seqTimer = null;
    this.step = 0;
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
    if (this.muted) {
      this._stopSeq();
    } else if (this.musicMode !== 'none') {
      this._startSeq();
    }
    return this.muted;
  }

  setMusicMode(mode) {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    this.step = 0;
    this._stopSeq();
    if (!this.muted && mode !== 'none') {
      this._startSeq();
    }
  }

  _stopSeq() {
    if (this.seqTimer !== null) {
      clearInterval(this.seqTimer);
      this.seqTimer = null;
    }
  }

  _startSeq() {
    this._stopSeq();
    const tempoMs =
      this.musicMode === 'fight'
        ? 112
        : this.musicMode === 'title'
          ? 145
          : this.musicMode === 'select'
            ? 135
            : 150;

    this.seqTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      this._playMusicStep(this.musicMode, this.step++);
    }, tempoMs);
  }

  _playMusicStep(mode, step) {
    // Fréquences de gamme mineure / arcade héroïque 8-bit
    const N = {
      E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0
    };

    if (mode === 'title') {
      // Thème héroïque 8-bit style écran titre arcade
      const lead = [
        N.E4, 0, N.E4, N.G4, N.A4, 0, N.B4, 0,
        N.C5, 0, N.B4, N.A4, N.G4, 0, N.E4, 0,
        N.D4, 0, N.D4, N.F4, N.G4, 0, N.A4, 0,
        N.B4, 0, N.A4, N.G4, N.E4, 0, 0, 0
      ];
      const bass = [
        N.E3, N.E3, N.E4 / 2, N.E3, N.A3 / 2, N.A3 / 2, N.A3, N.A3 / 2,
        N.C4 / 2, N.C4 / 2, N.G3, N.G3, N.E3, N.E3, N.B3 / 2, N.B3 / 2
      ];
      const l = lead[step % lead.length];
      const b = bass[step % bass.length];
      if (l) this._tone({ freq: l, type: 'square', duration: 0.13, gain: 0.032 });
      if (b) this._tone({ freq: b, type: 'triangle', duration: 0.11, gain: 0.045 });
      if (step % 4 === 0) this._drum(step % 8 === 4 ? 'snare' : 'kick', 0.03);
      return;
    }

    if (mode === 'select') {
      // Boucle dynamique sélection des personnages
      const arp = [N.A3, N.C4, N.E4, N.A4, N.G3, N.B3, N.D4, N.G4, N.F3, N.A3, N.C4, N.F4, N.E3, N.G3, N.B3, N.E4];
      const n = arp[step % arp.length];
      this._tone({ freq: n, type: 'square', duration: 0.10, gain: 0.028 });
      if (step % 2 === 0) {
        this._tone({ freq: arp[(Math.floor(step / 4) * 4) % arp.length] * 0.5, type: 'triangle', duration: 0.14, gain: 0.04 });
      }
      if (step % 4 === 2) this._drum('hat', 0.02);
      return;
    }

    if (mode === 'fight') {
      // Thème de combat 8-bit rythmé CPS2 / NES
      const melody = [
        N.E4, N.E4, 0, N.G4, N.A4, 0, N.E5, 0,
        N.D5, N.C5, N.B4, N.A4, N.G4, N.A4, N.B4, 0,
        N.C5, N.C5, 0, N.D5, N.E5, 0, N.G5, 0,
        N.F5, N.E5, N.D5, N.C5, N.B4, 0, N.B3, 0
      ];
      const bass = [
        N.E3, N.E3, N.E4 / 2, N.E3, N.E3, N.E4 / 2, N.E3, N.G3,
        N.A3 / 2, N.A3 / 2, N.A3, N.A3 / 2, N.G3 / 2, N.G3 / 2, N.B3 / 2, N.B3 / 2,
        N.C4 / 2, N.C4 / 2, N.C4, N.C4 / 2, N.D4 / 2, N.D4 / 2, N.G3, N.D4 / 2,
        N.B3 / 2, N.B3 / 2, N.E3, N.G3, N.B3 / 2, N.B3 / 2, N.E3, N.B3 / 2
      ];
      const m = melody[step % melody.length];
      const b = bass[step % bass.length];
      if (m) this._tone({ freq: m, type: 'square', duration: 0.10, gain: 0.030 });
      if (b) this._tone({ freq: b, type: 'triangle', duration: 0.09, gain: 0.045 });
      if (step % 4 === 0) this._drum('kick', 0.036);
      else if (step % 4 === 2) this._drum('snare', 0.028);
      else this._drum('hat', 0.014);
      return;
    }

    if (mode === 'victory') {
      const fanfare = [N.C5, N.E5, N.G5, 0, N.A5, N.G5, N.E5, N.C5, N.D5, N.F5, N.A5, 0, N.G5, 0, N.E5, 0];
      const f = fanfare[step % fanfare.length];
      if (f) this._tone({ freq: f, type: 'square', duration: 0.14, gain: 0.034 });
    }
  }

  _drum(kind, gain = 0.03) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (kind === 'kick') {
      this._tone({ freq: 135, endFreq: 38, type: 'sine', duration: 0.09, gain });
      return;
    }
    const len = kind === 'snare' ? 0.08 : 0.035;
    const bufferSize = Math.floor(this.ctx.sampleRate * len);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = kind === 'snare' ? 'bandpass' : 'highpass';
    filter.frequency.value = kind === 'snare' ? 1400 : 5500;

    const vol = this.ctx.createGain();
    vol.gain.setValueAtTime(gain, now);
    vol.gain.exponentialRampToValueAtTime(0.001, now + len);

    noise.connect(filter);
    filter.connect(vol);
    vol.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + len + 0.01);
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
    this._tone({ freq: 520, endFreq: 780, type: 'square', duration: 0.07, gain: 0.08 });
  }

  playConfirm() {
    this._tone({ freq: 523.25, type: 'square', duration: 0.07, gain: 0.1, delay: 0 });
    this._tone({ freq: 659.25, type: 'square', duration: 0.07, gain: 0.1, delay: 0.06 });
    this._tone({ freq: 783.99, type: 'square', duration: 0.12, gain: 0.11, delay: 0.12 });
  }

  playMapStep() {
    this._tone({ freq: 880, endFreq: 1046, type: 'square', duration: 0.045, gain: 0.05 });
  }

  playVsFanfare() {
    this._tone({ freq: 220, type: 'sawtooth', duration: 0.16, gain: 0.13, delay: 0 });
    this._tone({ freq: 277.18, type: 'sawtooth', duration: 0.16, gain: 0.13, delay: 0.12 });
    this._tone({ freq: 329.63, type: 'square', duration: 0.35, gain: 0.14, delay: 0.24 });
    this._tone({ freq: 659.25, type: 'square', duration: 0.35, gain: 0.1, delay: 0.24 });
  }

  playJump() {
    this._tone({ freq: 210, endFreq: 520, type: 'square', duration: 0.12, gain: 0.08 });
  }

  playLight() {
    this._tone({ freq: 340, endFreq: 100, type: 'sawtooth', duration: 0.08, gain: 0.11 });
  }

  playHeavy() {
    this._tone({ freq: 185, endFreq: 48, type: 'square', duration: 0.18, gain: 0.15 });
    this._tone({ freq: 95, endFreq: 35, type: 'triangle', duration: 0.22, gain: 0.14 });
  }

  playBlock() {
    this._tone({ freq: 640, endFreq: 280, type: 'triangle', duration: 0.08, gain: 0.11 });
  }

  playRoundStart() {
    this._tone({ freq: 440, type: 'square', duration: 0.1, gain: 0.1, delay: 0 });
    this._tone({ freq: 660, type: 'square', duration: 0.18, gain: 0.12, delay: 0.12 });
  }

  playKO() {
    this._tone({ freq: 260, endFreq: 45, type: 'sawtooth', duration: 0.45, gain: 0.18, delay: 0 });
    this._tone({ freq: 180, endFreq: 35, type: 'square', duration: 0.5, gain: 0.15, delay: 0.1 });
  }

  playDogSpecial() {
    // Double "Pouic-Pouic !" du jouet + jappement joyeux + arpège bisous
    this._tone({ freq: 920, endFreq: 1380, type: 'triangle', duration: 0.09, gain: 0.13, delay: 0 });
    this._tone({ freq: 980, endFreq: 1480, type: 'triangle', duration: 0.09, gain: 0.13, delay: 0.13 });
    this._tone({ freq: 440, endFreq: 620, type: 'sine', duration: 0.11, gain: 0.13, delay: 0.27 });
    this._tone({ freq: 523.25, type: 'square', duration: 0.08, gain: 0.08, delay: 0.40 });
    this._tone({ freq: 659.25, type: 'square', duration: 0.08, gain: 0.08, delay: 0.48 });
    this._tone({ freq: 783.99, type: 'square', duration: 0.14, gain: 0.09, delay: 0.56 });
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
      this.playDogSpecial();
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
