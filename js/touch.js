// Contrôleur tactile multipoint (iPad / Tablette / Mobile) par transparence
// Stick virtuel flottant à gauche + grappe d'actions ergonomique en arc à droite

export class TouchController {
  constructor({
    stageContainer,
    layerEl,
    leftZoneEl,
    stickBaseEl,
    stickKnobEl,
    rightZoneEl,
    specialBtnEl,
    onAction,
    onUnlockAudio
  }) {
    this.stageContainer = stageContainer;
    this.layerEl = layerEl;
    this.leftZoneEl = leftZoneEl;
    this.stickBaseEl = stickBaseEl;
    this.stickKnobEl = stickKnobEl;
    this.rightZoneEl = rightZoneEl;
    this.specialBtnEl = specialBtnEl;
    this.onAction = onAction || (() => {});
    this.onUnlockAudio = onUnlockAudio || (() => {});

    this.mode = 'auto'; // 'auto' | 'on' | 'off'
    this.coarseMedia = window.matchMedia('(pointer: coarse)');
    this.detectedTouch = this.coarseMedia.matches || (navigator.maxTouchPoints || 0) > 0;
    this.visible = false;

    this.stick = {
      active: false,
      pointerId: null,
      originX: 0,
      originY: 0,
      maxRadius: 40,
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.buttonPointers = new Map(); // pointerId -> buttonElement
    this._lastEnabled = null;

    this._bindEvents();
    this._syncEnabledAttr();
  }

  isEnabled() {
    if (this.mode === 'on') return true;
    if (this.mode === 'off') return false;
    return this.detectedTouch;
  }

  setMode(nextMode) {
    if (nextMode === 'auto' || nextMode === 'on' || nextMode === 'off') {
      this.mode = nextMode;
    }
    if (!this.isEnabled()) {
      this.resetInputs();
    }
    this._syncEnabledAttr();
  }

  cycleMode() {
    const order = ['auto', 'on', 'off'];
    const idx = order.indexOf(this.mode);
    const next = order[(idx + 1) % order.length];
    this.setMode(next);
    return this.mode;
  }

  getModeLabel() {
    if (this.mode === 'on') return '🕹 Tactile : ON';
    if (this.mode === 'off') return '🕹 Tactile : OFF';
    return this.detectedTouch ? '🕹 Tactile : Auto (ON)' : '🕹 Tactile : Auto';
  }

  getMovement() {
    if (!this.isEnabled() || !this.visible || !this.stick.active) {
      return { left: false, right: false, up: false, down: false };
    }
    return {
      left: this.stick.left,
      right: this.stick.right,
      up: this.stick.up,
      down: this.stick.down
    };
  }

  syncState({ visible, superMeter = 0 }) {
    const enabled = this.isEnabled();
    const shouldShow = Boolean(visible && enabled);
    if (shouldShow !== this.visible) {
      this.visible = shouldShow;
      this.layerEl.hidden = !shouldShow;
      if (!shouldShow) {
        this.resetInputs();
      }
    }

    this._syncEnabledAttr();

    if (shouldShow && this.specialBtnEl) {
      const pct = Math.max(0, Math.min(100, Math.round(superMeter)));
      this.specialBtnEl.style.setProperty('--super-pct', `${pct}%`);
      this.specialBtnEl.classList.toggle('is-ready', pct >= 100);
    }
  }

  resetInputs() {
    this._releaseStick();
    for (const btn of this.buttonPointers.values()) {
      btn.classList.remove('is-pressed');
    }
    this.buttonPointers.clear();
  }

  _syncEnabledAttr() {
    const enabled = this.isEnabled();
    if (this._lastEnabled !== enabled && this.stageContainer) {
      this._lastEnabled = enabled;
      this.stageContainer.dataset.touchEnabled = enabled ? 'true' : 'false';
    }
  }

  _bindEvents() {
    // Détecte dynamiquement tout contact tactile réel (ex: iPad avec clavier détachable)
    window.addEventListener(
      'pointerdown',
      e => {
        if (e.pointerType === 'touch' && !this.detectedTouch) {
          this.detectedTouch = true;
          this._syncEnabledAttr();
        }
      },
      { passive: true, capture: true }
    );

    if (this.coarseMedia.addEventListener) {
      this.coarseMedia.addEventListener('change', e => {
        if (e.matches) this.detectedTouch = true;
        this._syncEnabledAttr();
      });
    }

    // Bloque les gestes parasites Safari iPad sur l'overlay de combat
    this.layerEl.addEventListener('contextmenu', e => e.preventDefault());

    // Stick virtuel flottant gauche
    this.leftZoneEl.addEventListener('pointerdown', e => this._onStickDown(e));
    this.leftZoneEl.addEventListener('pointermove', e => this._onStickMove(e));
    const endStick = e => {
      if (e.pointerId === this.stick.pointerId) {
        this._releaseStick();
      }
    };
    this.leftZoneEl.addEventListener('pointerup', endStick);
    this.leftZoneEl.addEventListener('pointercancel', endStick);
    this.leftZoneEl.addEventListener('lostpointercapture', endStick);

    // Boutons d'action droits multipoints (tolèrent appui simultané avec le stick)
    const actionBtns = this.rightZoneEl.querySelectorAll('[data-touch-action]');
    actionBtns.forEach(btn => {
      btn.addEventListener('pointerdown', e => this._onButtonDown(e, btn));
      const releaseBtn = e => {
        if (this.buttonPointers.get(e.pointerId) === btn) {
          this.buttonPointers.delete(e.pointerId);
          btn.classList.remove('is-pressed');
        }
      };
      btn.addEventListener('pointerup', releaseBtn);
      btn.addEventListener('pointercancel', releaseBtn);
      btn.addEventListener('lostpointercapture', releaseBtn);
    });

    window.addEventListener('blur', () => this.resetInputs());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetInputs();
    });
  }

  _onStickDown(e) {
    if (!this.visible || this.stick.pointerId !== null) return;
    e.preventDefault();
    e.stopPropagation();
    this.onUnlockAudio();

    try {
      this.leftZoneEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore si la capture est indisponible dans certains contextes synthétiques
    }

    const zoneRect = this.leftZoneEl.getBoundingClientRect();
    const baseW = this.stickBaseEl.offsetWidth || 104;
    const baseH = this.stickBaseEl.offsetHeight || 104;
    const halfBase = Math.max(36, Math.min(baseW, baseH) * 0.5);
    const maxRadius = Math.max(28, halfBase * 0.82);

    // Ancre le stick là où le pouce se pose tout en le gardant entièrement dans la zone sûre
    const minX = halfBase + 4;
    const maxX = Math.max(minX, zoneRect.width - halfBase - 4);
    const minY = halfBase + 4;
    const maxY = Math.max(minY, zoneRect.height - halfBase - 4);

    const localX = Math.max(minX, Math.min(maxX, e.clientX - zoneRect.left));
    const localY = Math.max(minY, Math.min(maxY, e.clientY - zoneRect.top));

    this.stick.active = true;
    this.stick.pointerId = e.pointerId;
    this.stick.originX = zoneRect.left + localX;
    this.stick.originY = zoneRect.top + localY;
    this.stick.maxRadius = maxRadius;

    // Place temporairement le centre de l'anneau exactement sous le pouce
    this.stickBaseEl.style.left = `${localX - halfBase}px`;
    this.stickBaseEl.style.top = `${localY - halfBase}px`;
    this.stickBaseEl.style.bottom = 'auto';
    this.stickBaseEl.classList.add('is-active');

    this._updateStickVector(e.clientX, e.clientY);
  }

  _onStickMove(e) {
    if (!this.stick.active || e.pointerId !== this.stick.pointerId) return;
    e.preventDefault();
    this._updateStickVector(e.clientX, e.clientY);
  }

  _updateStickVector(clientX, clientY) {
    const rawDx = clientX - this.stick.originX;
    const rawDy = clientY - this.stick.originY;
    const maxR = this.stick.maxRadius;
    const dist = Math.hypot(rawDx, rawDy);
    const clamped = Math.min(maxR, dist);
    const angle = dist > 0.001 ? Math.atan2(rawDy, rawDx) : 0;

    const px = Math.cos(angle) * clamped;
    const py = Math.sin(angle) * clamped;
    const norm = dist / maxR;
    const ux = dist > 0.001 ? rawDx / dist : 0;
    const uy = dist > 0.001 ? rawDy / dist : 0;

    if (this.stickKnobEl) {
      this.stickKnobEl.style.transform = `translate3d(calc(-50% + ${px.toFixed(1)}px), calc(-50% + ${py.toFixed(1)}px), 0)`;
    }

    // Zone morte 22% pour éviter les frémissements ; seuil de saut volontaire (-0.48) pour éviter les sauts accidentels
    const activeDist = norm >= 0.22;
    this.stick.left = activeDist && ux <= -0.34;
    this.stick.right = activeDist && ux >= 0.34;
    this.stick.up = activeDist && uy <= -0.48;
    this.stick.down = activeDist && uy >= 0.36;

    this.stickBaseEl.classList.toggle('is-left', this.stick.left);
    this.stickBaseEl.classList.toggle('is-right', this.stick.right);
    this.stickBaseEl.classList.toggle('is-up', this.stick.up);
    this.stickBaseEl.classList.toggle('is-down', this.stick.down);
  }

  _releaseStick() {
    this.stick.active = false;
    this.stick.pointerId = null;
    this.stick.left = false;
    this.stick.right = false;
    this.stick.up = false;
    this.stick.down = false;

    if (this.stickBaseEl) {
      this.stickBaseEl.classList.remove('is-active', 'is-left', 'is-right', 'is-up', 'is-down');
      this.stickBaseEl.style.left = '';
      this.stickBaseEl.style.top = '';
      this.stickBaseEl.style.bottom = '';
    }
    if (this.stickKnobEl) {
      this.stickKnobEl.style.transform = '';
    }
  }

  _onButtonDown(e, btn) {
    if (!this.visible) return;
    e.preventDefault();
    e.stopPropagation();
    this.onUnlockAudio();

    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // Ignore si non capturable
    }

    this.buttonPointers.set(e.pointerId, btn);
    btn.classList.add('is-pressed');

    if (typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(btn.dataset.touchAction === 'special' ? 18 : 10);
      } catch {
        // Ignore sur navigateurs sans vibration
      }
    }

    const action = btn.dataset.touchAction;
    if (action) {
      this.onAction(action);
    }
  }
}
