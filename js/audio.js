// Moteur audio 16-bit synthétisé (Web Audio API) — chaud, filtré et musical

const NOTE = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66
};

// Phrases musicales 64 pas (4 mesures de 16 doubles-croches) avec respirations (0 = silence)
const TRACKS = {
  title: {
    stepMs: 132,
    lead: [
      NOTE.A4,0,NOTE.C5,0, NOTE.E5,0,0,NOTE.D5, NOTE.C5,0,NOTE.A4,0, 0,0,NOTE.G4,0,
      NOTE.F4,0,NOTE.A4,0, NOTE.C5,0,NOTE.D5,0, NOTE.E5,0,0,0, 0,0,0,0,
      NOTE.D5,0,NOTE.F5,0, NOTE.E5,0,NOTE.C5,0, NOTE.D5,0,NOTE.B4,0, NOTE.G4,0,NOTE.A4,0,
      NOTE.E5,0,NOTE.D5,0, NOTE.C5,0,NOTE.B4,0, NOTE.A4,0,0,0, 0,0,0,0
    ],
    bass: [
      NOTE.A2,0,0,NOTE.E3, NOTE.A2,0,NOTE.A2,0, NOTE.G2,0,0,NOTE.D3, NOTE.G2,0,0,0,
      NOTE.F2,0,0,NOTE.C3, NOTE.F2,0,NOTE.F2,0, NOTE.C3,0,0,NOTE.G3, NOTE.E2,0,0,0,
      NOTE.D2,0,0,NOTE.A2, NOTE.D3,0,0,0, NOTE.G2,0,0,NOTE.D3, NOTE.G2,0,0,0,
      NOTE.E2,0,0,NOTE.B2, NOTE.E3,0,NOTE.Gs2,0, NOTE.A2,0,0,NOTE.E3, NOTE.A2,0,0,0
    ],
    chords: [
      [NOTE.A3, NOTE.C4, NOTE.E4], 0, 0, 0, [NOTE.A3, NOTE.C4, NOTE.E4], 0, 0, 0,
      [NOTE.G3, NOTE.B3, NOTE.D4], 0, 0, 0, 0, 0, 0, 0,
      [NOTE.F3, NOTE.A3, NOTE.C4], 0, 0, 0, [NOTE.F3, NOTE.A3, NOTE.C4], 0, 0, 0,
      [NOTE.E3, NOTE.G3, NOTE.C4], 0, 0, 0, [NOTE.E3, NOTE.Gs3, NOTE.B3], 0, 0, 0,
      [NOTE.D3, NOTE.F3, NOTE.A3], 0, 0, 0, 0, 0, 0, 0,
      [NOTE.G3, NOTE.B3, NOTE.D4], 0, 0, 0, 0, 0, 0, 0,
      [NOTE.E3, NOTE.Gs3, NOTE.B3], 0, 0, 0, 0, 0, 0, 0,
      [NOTE.A3, NOTE.C4, NOTE.E4], 0, 0, 0, 0, 0, 0, 0
    ]
  },

  select: {
    stepMs: 142,
    lead: [
      NOTE.E5,0,0,NOTE.G5, 0,0,NOTE.E5,0, NOTE.D5,0,NOTE.C5,0, 0,0,NOTE.A4,0,
      NOTE.D5,0,0,NOTE.Fs5, 0,0,NOTE.D5,0, NOTE.C5,0,NOTE.B4,0, 0,0,0,0,
      NOTE.C5,0,0,NOTE.E5, 0,0,NOTE.C5,0, NOTE.B4,0,NOTE.A4,0, NOTE.G4,0,0,0,
      NOTE.B4,0,NOTE.E5,0, NOTE.Gs4,0,NOTE.B4,0, NOTE.A4,0,0,0, 0,0,0,0
    ],
    bass: [
      NOTE.A2,0,0,NOTE.A2, 0,NOTE.E3,NOTE.G3,0, NOTE.A2,0,0,0, NOTE.E2,0,NOTE.G2,0,
      NOTE.D3,0,0,NOTE.D3, 0,NOTE.A2,NOTE.Fs2,0, NOTE.D3,0,0,0, NOTE.A2,0,0,0,
      NOTE.F2,0,0,NOTE.F2, 0,NOTE.C3,NOTE.E3,0, NOTE.F2,0,0,0, NOTE.C2,0,NOTE.F2,0,
      NOTE.E2,0,0,NOTE.E2, 0,NOTE.B2,NOTE.D3,0, NOTE.E2,0,0,0, NOTE.G2,0,0,0
    ],
    chords: [
      [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4], 0, 0, 0, 0, 0, [NOTE.A3, NOTE.C4, NOTE.E4], 0, 0,0,0,0,0,0,0,0,
      [NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.C5], 0, 0, 0, 0, 0, [NOTE.D4, NOTE.Fs4, NOTE.A4], 0, 0,0,0,0,0,0,0,0,
      [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4], 0, 0, 0, 0, 0, [NOTE.F3, NOTE.A3, NOTE.C4], 0, 0,0,0,0,0,0,0,0,
      [NOTE.E3, NOTE.Gs3, NOTE.B3, NOTE.D4], 0, 0, 0, 0, 0, [NOTE.E3, NOTE.Gs3, NOTE.B3], 0, 0,0,0,0,0,0,0,0
    ]
  },

  fight: {
    stepMs: 118,
    lead: [
      NOTE.E5,0,NOTE.G5,0, NOTE.B5,0,0,NOTE.A5, NOTE.G5,0,NOTE.Fs5,0, NOTE.E5,0,0,0,
      NOTE.C5,0,NOTE.E5,0, NOTE.G5,0,NOTE.Fs5,0, NOTE.D5,0,0,0, 0,0,NOTE.B4,0,
      NOTE.E5,0,NOTE.G5,0, NOTE.A5,0,NOTE.B5,0, NOTE.C6,0,NOTE.B5,0, NOTE.A5,0,NOTE.G5,0,
      NOTE.Fs5,0,NOTE.G5,0, NOTE.A5,0,NOTE.Fs5,0, NOTE.E5,0,0,0, 0,0,0,0
    ],
    bass: [
      NOTE.E2,0,NOTE.E3,0, NOTE.E2,0,NOTE.B2,0, NOTE.E2,0,NOTE.E3,0, NOTE.E2,NOTE.D2,NOTE.B2,0,
      NOTE.C3,0,NOTE.C3,0, NOTE.G2,0,NOTE.C3,0, NOTE.D3,0,NOTE.A2,0, NOTE.D3,0,NOTE.B2,0,
      NOTE.E2,0,NOTE.E3,0, NOTE.E2,0,NOTE.B2,0, NOTE.A2,0,NOTE.E3,0, NOTE.C3,0,NOTE.A2,0,
      NOTE.B2,0,NOTE.Fs3,0, NOTE.B2,0,NOTE.D3,0, NOTE.E2,0,NOTE.B2,0, NOTE.E2,0,0,0
    ],
    chords: [
      [NOTE.E3, NOTE.G3, NOTE.B3], 0, 0, 0, 0, 0, [NOTE.E3, NOTE.G3, NOTE.B3], 0, 0,0,0,0,0,0,0,0,
      [NOTE.C3, NOTE.E3, NOTE.G3], 0, 0, 0, 0, 0, [NOTE.D3, NOTE.Fs3, NOTE.A3], 0, 0,0,0,0,0,0,0,0,
      [NOTE.E3, NOTE.G3, NOTE.B3], 0, 0, 0, [NOTE.A3, NOTE.C4, NOTE.E4], 0, 0, 0, 0,0,0,0,0,0,0,0,
      [NOTE.B3, NOTE.Ds4 || NOTE.Eb4, NOTE.Fs4], 0, 0, 0, 0, 0, [NOTE.E3, NOTE.G3, NOTE.B3], 0, 0,0,0,0,0,0,0,0
    ]
  },

  attract: {
    stepMs: 136,
    lead: [
      NOTE.C5,0,0,NOTE.E5, 0,0,NOTE.G5,0, 0,0,NOTE.E5,0, NOTE.D5,0,0,0,
      NOTE.A4,0,0,NOTE.C5, 0,0,NOTE.E5,0, 0,0,NOTE.D5,0, NOTE.C5,0,0,0,
      NOTE.F4,0,0,NOTE.A4, 0,0,NOTE.C5,0, NOTE.D5,0,NOTE.E5,0, 0,0,NOTE.C5,0,
      NOTE.G4,0,0,NOTE.B4, 0,0,NOTE.D5,0, 0,0,NOTE.C5,0, 0,0,0,0
    ],
    bass: [
      NOTE.C3,0,0,0, NOTE.G2,0,0,0, NOTE.C3,0,0,0, NOTE.G2,0,0,0,
      NOTE.A2,0,0,0, NOTE.E2,0,0,0, NOTE.A2,0,0,0, NOTE.E2,0,0,0,
      NOTE.F2,0,0,0, NOTE.C3,0,0,0, NOTE.D2,0,0,0, NOTE.A2,0,0,0,
      NOTE.G2,0,0,0, NOTE.D3,0,0,0, NOTE.G2,0,0,0, 0,0,0,0
    ],
    chords: [
      [NOTE.C4, NOTE.E4, NOTE.G4], 0,0,0,0,0,0,0, [NOTE.C4, NOTE.E4, NOTE.G4], 0,0,0,0,0,0,0,
      [NOTE.A3, NOTE.C4, NOTE.E4], 0,0,0,0,0,0,0, [NOTE.A3, NOTE.C4, NOTE.E4], 0,0,0,0,0,0,0,
      [NOTE.F3, NOTE.A3, NOTE.C4], 0,0,0,0,0,0,0, [NOTE.D3, NOTE.F3, NOTE.A3], 0,0,0,0,0,0,0,
      [NOTE.G3, NOTE.B3, NOTE.D4], 0,0,0,0,0,0,0, [NOTE.G3, NOTE.B3, NOTE.D4], 0,0,0,0,0,0,0
    ]
  },

  victory: {
    stepMs: 126,
    lead: [
      NOTE.G4,0,NOTE.B4,0, NOTE.D5,0,0,NOTE.G5, 0,0,NOTE.Fs5,0, NOTE.D5,0,0,0,
      NOTE.E5,0,NOTE.G5,0, NOTE.Fs5,0,NOTE.D5,0, NOTE.C5,0,NOTE.B4,0, NOTE.A4,0,0,0,
      NOTE.G4,0,NOTE.B4,0, NOTE.D5,0,NOTE.G5,0, NOTE.A5,0,0,NOTE.G5, NOTE.Fs5,0,NOTE.D5,0,
      NOTE.G5,0,0,0, NOTE.D5,0,NOTE.B4,0, NOTE.G4,0,0,0, 0,0,0,0
    ],
    bass: [
      NOTE.G2,0,NOTE.D3,0, NOTE.G2,0,NOTE.D3,0, NOTE.D3,0,NOTE.A2,0, NOTE.D3,0,0,0,
      NOTE.C3,0,NOTE.G2,0, NOTE.D3,0,NOTE.A2,0, NOTE.A2,0,NOTE.E3,0, NOTE.D3,0,0,0,
      NOTE.G2,0,NOTE.D3,0, NOTE.B2,0,NOTE.G2,0, NOTE.C3,0,NOTE.G2,0, NOTE.D3,0,NOTE.A2,0,
      NOTE.G2,0,NOTE.D3,0, NOTE.G2,0,0,0, 0,0,0,0, 0,0,0,0
    ],
    chords: [
      [NOTE.G3, NOTE.B3, NOTE.D4], 0,0,0,0,0,0,0, [NOTE.D3, NOTE.Fs3, NOTE.A3], 0,0,0,0,0,0,0,
      [NOTE.C3, NOTE.E3, NOTE.G3], 0,0,0, [NOTE.D3, NOTE.Fs3, NOTE.A3], 0,0,0, [NOTE.A3, NOTE.C4, NOTE.E4], 0,0,0, [NOTE.D3, NOTE.Fs3, NOTE.A3], 0,0,0,
      [NOTE.G3, NOTE.B3, NOTE.D4], 0,0,0,0,0,0,0, [NOTE.C3, NOTE.E3, NOTE.G3], 0,0,0, [NOTE.D3, NOTE.Fs3, NOTE.A3], 0,0,0,
      [NOTE.G3, NOTE.B3, NOTE.D4], 0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0
    ]
  }
};

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicMode = 'none';
    this.bgTrack = null;
    this.stepIdx = 0;
    this.bgTimer = null;
    this.masterGain = null;
    this.musicBus = null;
    this.sfxBus = null;
  }

  unlock() {
    return this.ensure();
  }

  setMusicMode(mode) {
    this.musicMode = mode || 'none';
    if (!mode || mode === 'none') {
      this.stopMusic();
      this.bgTrack = null;
    } else {
      this.startMusic(mode);
    }
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();

      // Master bus avec compresseur doux pour éviter toute saturation
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      // Bus Musique : filtre passe-bas chaud + écho stéréo subtil (sonorité 16-bit agréable)
      const musicFilter = this.ctx.createBiquadFilter();
      musicFilter.type = 'lowpass';
      musicFilter.frequency.value = 2350;
      musicFilter.Q.value = 0.7;

      const musicOut = this.ctx.createGain();
      musicOut.gain.value = 0.42;
      musicFilter.connect(musicOut);
      musicOut.connect(this.masterGain);

      // Doux écho de type console 16-bit
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.19;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1450;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.22;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.18;

      musicFilter.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(wet);
      wet.connect(this.masterGain);
      delayFilter.connect(feedback);
      feedback.connect(delay);

      this.musicBus = musicFilter;

      // Bus SFX dédié (clair et percutant)
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.82;
      this.sfxBus.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      const t = this.bgTrack;
      this.bgTrack = null;
      if (t) this.startMusic(t);
    }
    return this.muted;
  }

  // Note musicale douce avec attaque progressive + release soyeux (zéro clic / zéro stridence)
  _musicTone({ freq, type = 'triangle', duration = 0.2, gain = 0.06, attack = 0.015, detune = 0 }) {
    if (this.muted || !this.ensure() || !freq) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (detune) osc.detune.setValueAtTime(detune, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Percussion douce 16-bit
  _musicDrum(kind) {
    if (this.muted || !this.ensure()) return;
    const now = this.ctx.currentTime;
    if (kind === 'kick') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(118, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(g);
      g.connect(this.musicBus);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (kind === 'hat' || kind === 'snare') {
      const len = kind === 'snare' ? 0.075 : 0.028;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * len), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = kind === 'snare' ? 'bandpass' : 'highpass';
      filt.frequency.value = kind === 'snare' ? 1400 : 3200;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(kind === 'snare' ? 0.032 : 0.015, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + len);
      src.connect(filt);
      filt.connect(g);
      g.connect(this.musicBus);
      src.start(now);
    }
  }

  _tone({ freq, endFreq = null, type = 'square', duration = 0.12, gain = 0.12, delay = 0 }) {
    if (this.muted || !this.ensure()) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(this.sfxBus || this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  startMusic(track = 'title') {
    if (this.muted) {
      this.bgTrack = track;
      return;
    }
    if (this.bgTrack === track && this.bgTimer) return;
    this.stopMusic();
    this.bgTrack = track;
    this.stepIdx = 0;

    const spec = TRACKS[track] || TRACKS.title;
    const tick = () => {
      if (this.muted || this.bgTrack !== track) return;
      if (!this.ctx || this.ctx.state !== 'running') return;
      const i = this.stepIdx % 64;

      // Mélodie principale : couche chaude triangle + léger éclat FM detuned
      const l = spec.lead[i];
      if (l) {
        this._musicTone({ freq: l, type: 'triangle', duration: 0.24, gain: 0.068, attack: 0.014 });
        this._musicTone({ freq: l, type: 'sawtooth', duration: 0.21, gain: 0.018, attack: 0.02, detune: 5 });
      }

      // Basse ronde 16-bit
      const b = spec.bass[i];
      if (b) {
        this._musicTone({ freq: b, type: 'triangle', duration: 0.20, gain: 0.088, attack: 0.01 });
      }

      // Accords pad doux
      const chord = spec.chords && spec.chords[i];
      if (Array.isArray(chord)) {
        for (const n of chord) {
          this._musicTone({ freq: n, type: 'sine', duration: 0.56, gain: 0.024, attack: 0.04 });
        }
      }

      // Batterie subtile non-fatigante
      const sub = i % 16;
      if (track === 'fight') {
        if (sub === 0 || sub === 6 || sub === 8) this._musicDrum('kick');
        if (sub === 4 || sub === 12) this._musicDrum('snare');
        if (sub % 4 === 2) this._musicDrum('hat');
      } else if (track === 'select' || track === 'attract') {
        if (sub === 0 || sub === 10) this._musicDrum('kick');
        if (sub === 4 || sub === 12) this._musicDrum('hat');
      } else if (track === 'title' || track === 'victory') {
        if (sub === 0 || sub === 8) this._musicDrum('kick');
        if (sub === 12) this._musicDrum('hat');
      }

      this.stepIdx++;
    };

    this.bgTimer = setInterval(tick, spec.stepMs);
  }

  stopMusic() {
    if (this.bgTimer) {
      clearInterval(this.bgTimer);
      this.bgTimer = null;
    }
  }

  playMenu() {
    this.playUiMove();
  }

  playConfirm() {
    this.playUiConfirm();
  }

  playLight() {
    this.playPunch(false);
  }

  playHeavy() {
    this.playPunch(true);
  }

  playMapStep() {
    this._tone({ freq: 540, endFreq: 680, type: 'triangle', duration: 0.045, gain: 0.05 });
  }

  playVsFanfare() {
    this._tone({ freq: 440, type: 'triangle', duration: 0.10, gain: 0.11, delay: 0 });
    this._tone({ freq: 554.37, type: 'triangle', duration: 0.10, gain: 0.11, delay: 0.09 });
    this._tone({ freq: 659.25, type: 'triangle', duration: 0.22, gain: 0.13, delay: 0.18 });
  }

  playHit(heavy = false) {
    if (heavy) {
      this._tone({ freq: 185, endFreq: 48, type: 'sawtooth', duration: 0.16, gain: 0.17 });
      this._tone({ freq: 92, endFreq: 35, type: 'triangle', duration: 0.19, gain: 0.14, delay: 0.02 });
    } else {
      this._tone({ freq: 245, endFreq: 75, type: 'triangle', duration: 0.10, gain: 0.14 });
    }
  }

  playPunch(heavy = false) {
    this._tone({ freq: heavy ? 340 : 410, endFreq: heavy ? 110 : 150, type: 'triangle', duration: heavy ? 0.11 : 0.075, gain: 0.10 });
  }

  playKick() {
    this._tone({ freq: 380, endFreq: 95, type: 'sawtooth', duration: 0.12, gain: 0.11 });
    this._tone({ freq: 170, endFreq: 55, type: 'triangle', duration: 0.14, gain: 0.12, delay: 0.02 });
  }

  playSweep() {
    this._tone({ freq: 280, endFreq: 68, type: 'sawtooth', duration: 0.16, gain: 0.12 });
    this._tone({ freq: 130, endFreq: 40, type: 'sine', duration: 0.22, gain: 0.15, delay: 0.03 });
  }

  playHeadbutt() {
    this._tone({ freq: 145, endFreq: 45, type: 'sawtooth', duration: 0.16, gain: 0.18 });
    this._tone({ freq: 310, endFreq: 95, type: 'triangle', duration: 0.12, gain: 0.14, delay: 0.01 });
  }

  playShoryuken() {
    this._tone({ freq: 240, endFreq: 920, type: 'sawtooth', duration: 0.24, gain: 0.14 });
    this._tone({ freq: 440, endFreq: 1180, type: 'triangle', duration: 0.22, gain: 0.12, delay: 0.03 });
  }

  playSpinKick() {
    this._tone({ freq: 520, endFreq: 260, type: 'triangle', duration: 0.10, gain: 0.11, delay: 0 });
    this._tone({ freq: 580, endFreq: 290, type: 'triangle', duration: 0.10, gain: 0.11, delay: 0.11 });
    this._tone({ freq: 640, endFreq: 310, type: 'triangle', duration: 0.10, gain: 0.10, delay: 0.22 });
  }

  playGuardCrush() {
    this._tone({ freq: 220, endFreq: 55, type: 'sawtooth', duration: 0.22, gain: 0.18 });
    this._tone({ freq: 620, endFreq: 180, type: 'square', duration: 0.14, gain: 0.10, delay: 0.02 });
  }

  playCrouch() {
    this._tone({ freq: 210, endFreq: 135, type: 'sine', duration: 0.055, gain: 0.045 });
  }

  playBlock() {
    this._tone({ freq: 520, endFreq: 280, type: 'triangle', duration: 0.09, gain: 0.12 });
  }

  playParry() {
    this._tone({ freq: 720, endFreq: 960, type: 'triangle', duration: 0.08, gain: 0.08 });
  }

  playPerfectParry() {
    this._tone({ freq: 987.77, type: 'triangle', duration: 0.09, gain: 0.15, delay: 0 });
    this._tone({ freq: 1318.51, type: 'sine', duration: 0.14, gain: 0.16, delay: 0.05 });
    this._tone({ freq: 1567.98, type: 'triangle', duration: 0.18, gain: 0.12, delay: 0.10 });
  }

  playJump() {
    this._tone({ freq: 210, endFreq: 510, type: 'triangle', duration: 0.13, gain: 0.09 });
  }

  playUiMove() {
    this._tone({ freq: 620, type: 'triangle', duration: 0.045, gain: 0.065 });
  }

  playUiConfirm() {
    this._tone({ freq: 523.25, type: 'triangle', duration: 0.075, gain: 0.09, delay: 0 });
    this._tone({ freq: 783.99, type: 'triangle', duration: 0.12, gain: 0.10, delay: 0.06 });
  }

  playRoundStart() {
    this._tone({ freq: 440, type: 'triangle', duration: 0.10, gain: 0.10, delay: 0 });
    this._tone({ freq: 659.25, type: 'triangle', duration: 0.18, gain: 0.12, delay: 0.11 });
  }

  playKO() {
    this._tone({ freq: 240, endFreq: 45, type: 'sawtooth', duration: 0.44, gain: 0.17, delay: 0 });
    this._tone({ freq: 165, endFreq: 35, type: 'triangle', duration: 0.48, gain: 0.16, delay: 0.08 });
  }

  playDogSpecial() {
    // Sushi Solo : Double "Pouic-Pouic !" + jappement joyeux + arpège bisous
    this._tone({ freq: 880, endFreq: 1340, type: 'triangle', duration: 0.09, gain: 0.12, delay: 0 });
    this._tone({ freq: 940, endFreq: 1420, type: 'triangle', duration: 0.09, gain: 0.12, delay: 0.13 });
    this._tone({ freq: 440, endFreq: 640, type: 'sine', duration: 0.12, gain: 0.13, delay: 0.26 });
    this._tone({ freq: 523.25, type: 'triangle', duration: 0.09, gain: 0.09, delay: 0.40 });
    this._tone({ freq: 659.25, type: 'triangle', duration: 0.09, gain: 0.09, delay: 0.48 });
    this._tone({ freq: 783.99, type: 'triangle', duration: 0.16, gain: 0.10, delay: 0.56 });
  }

  playRocketFist() {
    // Goldohrack Fulguro-Poing Missile : démarrage réacteur + sifflement fusée + impact
    this._tone({ freq: 140, endFreq: 680, type: 'sawtooth', duration: 0.24, gain: 0.13, delay: 0 });
    this._tone({ freq: 680, endFreq: 210, type: 'triangle', duration: 0.32, gain: 0.14, delay: 0.22 });
    this._tone({ freq: 160, endFreq: 48, type: 'sawtooth', duration: 0.28, gain: 0.16, delay: 0.46 });
  }

  playBunnyAttract() {
    // Koll Lapin-Aimant : carillon mignon d'attraction + décharge Tesla
    this._tone({ freq: 587.33, type: 'sine', duration: 0.09, gain: 0.10, delay: 0 });
    this._tone({ freq: 783.99, type: 'sine', duration: 0.09, gain: 0.10, delay: 0.08 });
    this._tone({ freq: 1046.50, type: 'triangle', duration: 0.13, gain: 0.11, delay: 0.16 });
    this._tone({ freq: 920, endFreq: 190, type: 'sawtooth', duration: 0.24, gain: 0.13, delay: 0.34 });
  }

  playSpecial(fighterId) {
    if (fighterId === 'm3g4') {
      this._tone({ freq: 240, endFreq: 1040, type: 'sawtooth', duration: 0.24, gain: 0.12 });
      this._tone({ freq: 860, endFreq: 120, type: 'triangle', duration: 0.34, gain: 0.14, delay: 0.18 });
    } else if (fighterId === 'madchat') {
      this._tone({ freq: 580, endFreq: 180, type: 'sawtooth', duration: 0.12, gain: 0.12, delay: 0 });
      this._tone({ freq: 700, endFreq: 210, type: 'sawtooth', duration: 0.12, gain: 0.12, delay: 0.1 });
      this._tone({ freq: 820, endFreq: 140, type: 'triangle', duration: 0.22, gain: 0.15, delay: 0.2 });
    } else if (fighterId === 'darkmada') {
      this.playDogSpecial();
    } else if (fighterId === 'goldohrack') {
      this.playRocketFist();
    } else if (fighterId === 'koll') {
      this.playBunnyAttract();
    } else {
      // lurck
      this._tone({ freq: 720, endFreq: 510, type: 'sine', duration: 0.22, gain: 0.12, delay: 0 });
      this._tone({ freq: 510, endFreq: 210, type: 'triangle', duration: 0.30, gain: 0.14, delay: 0.18 });
    }
  }
}
