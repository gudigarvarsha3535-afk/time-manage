/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: notifications.js
 * Web Audio API synthesizer, Web Notifications API, and in-app alert modal system
 */

class NotificationManager {
  constructor() {
    this.audioCtx = null;
    this.currentSoundSource = null;
    this.activeAlert = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('[NotificationManager] Web Audio API not supported:', e);
    }
  }

  // Ensure AudioContext is running after user interaction
  unlockAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch((e) => console.warn('Could not resume AudioContext:', e));
    }
  }

  // Request browser notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[NotificationManager] Notifications API not supported in this browser.');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (err) {
        console.warn('[NotificationManager] Notification permission request error:', err);
        return 'error';
      }
    }

    return Notification.permission;
  }

  // Synthesize sound using Web Audio API (Chime, Alert, Urgent)
  playAlarm(type = 'alarm', volume = 0.8) {
    this.unlockAudio();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 1.0)), now);
      masterGain.connect(ctx.destination);

      if (type === 'test' || type === 'chime') {
        // Dual-tone harmonic chime
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          noteGain.gain.setValueAtTime(0, now + idx * 0.12);
          noteGain.gain.linearRampToValueAtTime(0.4, now + idx * 0.12 + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.85);
        });
      } else if (type === 'milestone') {
        // Two-tone attention tone
        [587.33, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);

          noteGain.gain.setValueAtTime(0, now + idx * 0.18);
          noteGain.gain.linearRampToValueAtTime(0.5, now + idx * 0.18 + 0.03);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.6);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.65);
        });
      } else {
        // High urgency pulse alarm (for hourly & deadlines)
        const sequence = [784, 988, 784, 988, 1175];
        sequence.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          noteGain.gain.setValueAtTime(0, now + idx * 0.14);
          noteGain.gain.linearRampToValueAtTime(0.25, now + idx * 0.14 + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);

          osc.connect(noteGain);
          noteGain.connect(masterGain);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.4);
        });
      }
    } catch (e) {
      console.warn('[NotificationManager] Audio playback error:', e);
    }
  }

  // Trigger system notification
  triggerSystemNotification(title, body, tag = 'hackathon-alert') {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options: {
              body,
              icon: './assets/icon-192.png',
              badge: './assets/icon-192.png',
              tag,
              renotify: true,
              vibrate: [200, 100, 200]
            }
          });
        } else {
          new Notification(title, {
            body,
            icon: './assets/icon-192.png',
            tag,
            renotify: true
          });
        }
      } catch (err) {
        console.warn('[NotificationManager] Native notification failed:', err);
      }
    }
  }

  // Display the rich in-app modal banner
  showInAppAlert({
    id,
    title,
    message,
    nextActivity = '',
    hourNumber = null,
    type = 'hourly', // 'hourly' | 'milestone' | 'deadline' | 'delayed' | 'completion' | 'test'
    onDismiss = () => {},
    onSnooze = (minutes) => {},
    settings = { soundEnabled: true, volume: 0.8 }
  }) {
    this.activeAlert = { id, title, message, nextActivity, hourNumber, type };

    if (settings.soundEnabled) {
      this.playAlarm(type === 'test' ? 'test' : type === 'milestone' ? 'milestone' : 'alarm', settings.volume);
    }

    this.triggerSystemNotification(title, message, id);

    // Build or populate modal dialog in DOM
    let modalOverlay = document.getElementById('alertModalOverlay');
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'alertModalOverlay';
      modalOverlay.className = 'alert-modal-overlay';
      document.body.appendChild(modalOverlay);
    }

    const typeIcons = {
      hourly: '⏰',
      milestone: '⏳',
      deadline: '🚨',
      delayed: '⚠️',
      completion: '🏆',
      test: '🔔'
    };

    const icon = typeIcons[type] || '🔔';

    modalOverlay.innerHTML = `
      <div class="alert-modal-card alert-modal-${type}" role="dialog" aria-modal="true" aria-labelledby="alertTitle">
        <div class="alert-modal-header">
          <div class="alert-icon-pulse">${icon}</div>
          <div class="alert-title-container">
            <span class="alert-type-badge badge-${type}">${type.toUpperCase()} ALERT</span>
            <h2 id="alertTitle" class="alert-title">${escapeHTML(title)}</h2>
          </div>
        </div>

        <div class="alert-modal-body">
          <p class="alert-message">${escapeHTML(message)}</p>
          ${nextActivity ? `
            <div class="alert-next-box">
              <span class="alert-next-label">Next Planned Activity:</span>
              <p class="alert-next-activity">${escapeHTML(nextActivity)}</p>
            </div>
          ` : ''}
        </div>

        <div class="alert-modal-actions">
          <div class="alert-snooze-group">
            <button class="btn btn-secondary btn-sm" id="btnAlertSnooze5">
              <span>💤 Snooze 5m</span>
            </button>
            <button class="btn btn-secondary btn-sm" id="btnAlertSnooze10">
              <span>💤 Snooze 10m</span>
            </button>
          </div>
          <div class="alert-primary-group">
            <button class="btn btn-primary" id="btnAlertDismiss">
              <span>✓ Acknowledge & Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modalOverlay.classList.add('visible');

    // Attach event listeners
    document.getElementById('btnAlertDismiss')?.addEventListener('click', () => {
      this.closeInAppAlert();
      onDismiss(id);
    });

    document.getElementById('btnAlertSnooze5')?.addEventListener('click', () => {
      this.closeInAppAlert();
      onSnooze(id, 5);
    });

    document.getElementById('btnAlertSnooze10')?.addEventListener('click', () => {
      this.closeInAppAlert();
      onSnooze(id, 10);
    });
  }

  closeInAppAlert() {
    const modalOverlay = document.getElementById('alertModalOverlay');
    if (modalOverlay) {
      modalOverlay.classList.remove('visible');
    }
    this.activeAlert = null;
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.NotificationManager = new NotificationManager();
