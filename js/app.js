/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: app.js
 * Application Controller, Navigation, View Renderers, and User Interactions
 */

// Initialize global application state from storage
window.AppState = window.Storage.loadState();

class ApplicationController {
  constructor() {
    this.currentTab = 'dashboard';
    this.deferredPrompt = null;
    this.modalState = { type: null, data: null };
  }

  init() {
    console.log('[App] Initializing Hackathon Manager...');

    // Initialize timer engine
    window.HackathonTimer.init({
      onTick: (timeData) => this.handleTimerTick(timeData),
      onStatusChange: () => this.handleStatusChange()
    });

    // PWA Service Worker & Install Prompt
    this.setupPWA();

    // DOM bindings
    this.bindGlobalEvents();

    // Render initial screen
    this.render();
  }

  setupPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
          .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('btnPwaInstall');
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Hackathon Manager installed to home screen.');
      this.deferredPrompt = null;
      const installBtn = document.getElementById('btnPwaInstall');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    });
  }

  promptPwaInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt');
        }
        this.deferredPrompt = null;
      });
    } else {
      alert('To install this app on your device:\n\n• On Android (Chrome): Tap the 3 dots menu and select "Install app" or "Add to Home screen".\n• On Windows / Mac (Chrome/Edge): Click the install icon in the URL address bar.');
    }
  }

  bindGlobalEvents() {
    // Navigation items
    document.querySelectorAll('[data-nav-target]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-nav-target');
        this.switchTab(target);
      });
    });

    // Mobile nav
    document.querySelectorAll('[data-mobile-nav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-mobile-nav');
        this.switchTab(target);
      });
    });

    // Header Pause button
    document.getElementById('btnHeaderPause')?.addEventListener('click', () => {
      this.togglePause();
    });

    // PWA Install sidebar button
    document.getElementById('btnPwaInstall')?.addEventListener('click', () => {
      this.promptPwaInstall();
    });

    // Modals overlay background click
    const appModal = document.getElementById('appModal');
    if (appModal) {
      appModal.addEventListener('click', (e) => {
        if (e.target === appModal) {
          this.closeModal();
        }
      });
    }
  }

  render() {
    const state = window.AppState;
    const isCheckedIn = state.session && state.session.isActive;

    const welcomeContainer = document.getElementById('welcomeView');
    const mainAppContainer = document.getElementById('mainAppLayout');

    if (!isCheckedIn) {
      // Show Check-in / Welcome screen
      if (welcomeContainer) welcomeContainer.style.display = 'flex';
      if (mainAppContainer) mainAppContainer.style.display = 'none';
      this.renderWelcomeScreen();
    } else {
      // Show Main Application
      if (welcomeContainer) welcomeContainer.style.display = 'none';
      if (mainAppContainer) mainAppContainer.style.display = 'flex';
      this.updateHeaderStats();
      this.renderCurrentView();
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update active state in sidebar and bottom navigation
    document.querySelectorAll('[data-nav-target]').forEach((el) => {
      if (el.getAttribute('data-nav-target') === tabName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    document.querySelectorAll('[data-mobile-nav]').forEach((el) => {
      if (el.getAttribute('data-mobile-nav') === tabName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    const container = document.getElementById('tabContentContainer');
    if (!container) return;

    switch (this.currentTab) {
      case 'dashboard':
        container.innerHTML = this.getDashboardHTML();
        this.initDashboardEvents();
        break;
      case 'schedule':
        container.innerHTML = this.getScheduleHTML();
        this.initScheduleEvents();
        break;
      case 'tasks':
        container.innerHTML = this.getTasksHTML();
        this.initTasksEvents();
        break;
      case 'team':
        container.innerHTML = this.getTeamHTML();
        this.initTeamEvents();
        break;
      case 'research':
        container.innerHTML = this.getResearchHTML();
        this.initResearchEvents();
        break;
      case 'presentation':
        container.innerHTML = this.getPresentationHTML();
        this.initPresentationEvents();
        break;
      case 'report':
        container.innerHTML = this.getReportHTML();
        this.initReportEvents();
        break;
      case 'settings':
        container.innerHTML = this.getSettingsHTML();
        this.initSettingsEvents();
        break;
      default:
        container.innerHTML = this.getDashboardHTML();
        this.initDashboardEvents();
        break;
    }
  }

  // --- WELCOME & CHECK-IN SCREEN ---
  renderWelcomeScreen() {
    const container = document.getElementById('welcomeView');
    if (!container) return;

    const motivationalQuotes = [
      "24 hours to turn an ambitious coffee-fueled dream into working code.",
      "Simplicity in MVP design wins hackathons. Build clean, test early, pitch boldly.",
      "Ship working software over perfection. Every hour counts!",
      "Great teams coordinate relentlessly. Communicate, delegate, and conquer."
    ];
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    container.innerHTML = `
      <div class="welcome-card glass-panel">
        <div class="welcome-header">
          <div class="welcome-logo-pulse">
            <img src="./assets/logo.svg" alt="24H Control Logo" class="welcome-logo-img" />
          </div>
          <h1 class="welcome-title">HACKATHON MANAGER</h1>
          <p class="welcome-tagline">24H TEAM CONTROL SYSTEM</p>
          <p class="welcome-subtag">Plan Smart. Work Together. Build Something Amazing.</p>
          <div class="welcome-quote">
            <span>💡</span> <em>"${randomQuote}"</em>
          </div>
        </div>

        <form id="checkInForm" class="welcome-form">
          <div class="form-group">
            <label for="inputProjectName">Project Name / Solution Concept <span class="req">*</span></label>
            <input type="text" id="inputProjectName" class="form-control" placeholder="e.g., AeroGuard AI - Autonomous Forest Fire Predictor" required />
          </div>

          <div class="form-row">
            <div class="form-group col-half">
              <label for="inputTeamName">Team Name <span class="req">*</span></label>
              <input type="text" id="inputTeamName" class="form-control" placeholder="e.g., Neural Knights" required />
            </div>

            <div class="form-group col-half">
              <label for="inputTeamSize">Team Size</label>
              <input type="number" id="inputTeamSize" class="form-control" min="1" max="12" value="4" required />
            </div>
          </div>

          <div class="form-group">
            <label for="selectDuration">Hackathon Duration</label>
            <select id="selectDuration" class="form-control">
              <option value="24" selected>24 Hours (Standard Engineering Hackathon)</option>
              <option value="12">12 Hours (Sprint Hackathon)</option>
              <option value="36">36 Hours (Weekend Major)</option>
              <option value="48">48 Hours (Extended Hackathon)</option>
            </select>
            <small class="form-hint">Timer will start strictly upon Check-In. No background alarms run beforehand.</small>
          </div>

          <div class="welcome-actions">
            <button type="submit" class="btn btn-primary btn-lg btn-block" id="btnCheckInSubmit">
              <span class="btn-icon">🚀</span>
              <span class="btn-text">CHECK IN & START HACKATHON</span>
            </button>
          </div>
        </form>

        <div class="welcome-footer-info">
          <span>🛡️ Single-Device Team Control</span>
          <span>⚡ LocalStorage Auto-Saved</span>
          <span>🔔 Web Audio Hourly Alarms</span>
        </div>
      </div>
    `;

    document.getElementById('checkInForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCheckInSubmit();
    });
  }

  async handleCheckInSubmit() {
    const projectName = document.getElementById('inputProjectName')?.value.trim();
    const teamName = document.getElementById('inputTeamName')?.value.trim();
    const teamSize = parseInt(document.getElementById('inputTeamSize')?.value, 10) || 4;
    const durationHours = parseInt(document.getElementById('selectDuration')?.value, 10) || 24;

    if (!projectName || !teamName) {
      alert('Please enter your project name and team name.');
      return;
    }

    // Unlock Web Audio Context on user gesture
    window.NotificationManager.unlockAudio();

    // Request notification permission
    try {
      await window.NotificationManager.requestPermission();
    } catch (e) {
      console.warn('Notification permission request error:', e);
    }

    const state = window.AppState;
    state.session.isActive = true;
    state.session.checkInTime = Date.now();
    state.session.durationHours = durationHours;
    state.session.projectName = projectName;
    state.session.teamName = teamName;
    state.session.teamSize = teamSize;
    state.session.isPaused = false;
    state.session.pausedAt = null;
    state.session.totalPausedMs = 0;
    state.session.endedAt = null;
    state.triggeredAlerts = [];
    state.snoozedAlerts = [];

    // Prepopulate initial team members based on size if team is empty
    if (!state.team || state.team.length === 0) {
      const defaultRoles = [
        'Team Leader / Project Manager',
        'Developer / Software Engineer',
        'Hardware / Electronics Engineer',
        'Research & Problem Analysis Manager',
        'UI/UX Designer',
        'Presentation & Documentation Manager'
      ];
      state.team = [];
      for (let i = 0; i < Math.min(teamSize, defaultRoles.length); i++) {
        state.team.push({
          id: 'mem_' + Date.now() + '_' + i,
          name: i === 0 ? 'Lead Engineer' : `Member ${i + 1}`,
          role: defaultRoles[i],
          skills: i === 0 ? 'Project Architecture, Git' : 'Fullstack, Hardware, Prototyping',
          contact: '',
          notes: ''
        });
      }
    }

    window.Storage.saveState(state);

    // Play pleasant welcome chime
    window.NotificationManager.playAlarm('chime', state.settings.volume);

    // Switch to Dashboard
    this.render();
  }

  // --- HEADER & TIMER TICK ---
  handleTimerTick(timeData) {
    // Update live countdown in top bar and dashboard
    const elRemaining = document.getElementById('headerCountdown');
    const elCurrentHour = document.getElementById('headerCurrentHour');
    const elDashRemaining = document.getElementById('dashCountdownVal');
    const elDashCurrentHour = document.getElementById('dashCurrentHourVal');
    const elDashHourProgress = document.getElementById('dashHourProgressBar');
    const elDashHourProgressTxt = document.getElementById('dashHourProgressTxt');
    const elPauseBtn = document.getElementById('btnHeaderPause');

    if (elRemaining) {
      elRemaining.textContent = timeData.formattedRemaining;
      if (timeData.remainingMs <= 3600 * 1000) {
        elRemaining.classList.add('urgent-pulse');
      } else {
        elRemaining.classList.remove('urgent-pulse');
      }
    }

    if (elCurrentHour) {
      elCurrentHour.textContent = timeData.isActive ? `Hour ${timeData.currentHour} / ${window.AppState.session.durationHours}` : 'Inactive';
    }

    if (elDashRemaining) {
      elDashRemaining.textContent = timeData.formattedRemaining;
    }

    if (elDashCurrentHour) {
      elDashCurrentHour.textContent = `Hour ${timeData.currentHour} of ${window.AppState.session.durationHours}`;
    }

    if (elDashHourProgress) {
      elDashHourProgress.style.width = `${timeData.hourProgressPercent}%`;
    }

    if (elDashHourProgressTxt) {
      elDashHourProgressTxt.textContent = `${timeData.hourProgressPercent}% of Hour ${timeData.currentHour} elapsed`;
    }

    if (elPauseBtn) {
      if (timeData.isPaused) {
        elPauseBtn.innerHTML = `<span>▶️</span><span>Resume Hackathon</span>`;
        elPauseBtn.className = 'btn btn-warning btn-sm';
      } else {
        elPauseBtn.innerHTML = `<span>⏸️</span><span>Pause Hackathon</span>`;
        elPauseBtn.className = 'btn btn-secondary btn-sm';
      }
    }

    // Update timeline current marker if on dashboard
    if (this.currentTab === 'dashboard') {
      this.updateDashboardTimelineMarker(timeData.currentHour);
    }
  }

  handleStatusChange() {
    this.updateHeaderStats();
    if (this.currentTab === 'dashboard' || this.currentTab === 'tasks' || this.currentTab === 'team') {
      this.renderCurrentView();
    }
  }

  updateHeaderStats() {
    const state = window.AppState;
    if (!state || !state.session || !state.session.isActive) return;

    const elProjectTitle = document.getElementById('headerProjectName');
    const elTeamBadge = document.getElementById('headerTeamName');
    const elStatsCompleted = document.getElementById('headerStatsCompleted');
    const elStatsDelayed = document.getElementById('headerStatsDelayed');
    const elStatsPending = document.getElementById('headerStatsPending');

    if (elProjectTitle) elProjectTitle.textContent = state.session.projectName || 'Hackathon Project';
    if (elTeamBadge) elTeamBadge.textContent = state.session.teamName || 'Team';

    const stats = window.TaskManager.getStatistics();
    if (elStatsCompleted) elStatsCompleted.textContent = `${stats.completed}/${stats.total} Done (${stats.progressPercent}%)`;
    if (elStatsDelayed) {
      elStatsDelayed.textContent = `${stats.delayed} Delayed`;
      elStatsDelayed.style.display = stats.delayed > 0 ? 'inline-block' : 'none';
    }
    if (elStatsPending) elStatsPending.textContent = `${stats.pending} Pending`;
  }

  // --- VIEW 1: DASHBOARD ---
  getDashboardHTML() {
    const state = window.AppState;
    const timeData = window.HackathonTimer.getTimeData(state);
    const stats = window.TaskManager.getStatistics();

    // Current & Upcoming schedule
    const currentSchedule = window.HackathonTimer.getScheduleForHour(state, Math.max(0, timeData.currentHour - 1)) || {
      title: 'Active Development Sprint',
      description: 'Continue building according to your task checklist and architecture.',
      category: 'Software'
    };

    const nextSchedule = window.HackathonTimer.getScheduleForHour(state, timeData.currentHour) || {
      title: 'Testing & Polish Phase',
      description: 'Verify system stability and prepare presentation items.',
      category: 'Testing'
    };

    // Paused warning banner
    const pausedBanner = timeData.isPaused ? `
      <div class="banner banner-warning">
        <span class="banner-icon">⏸️</span>
        <div class="banner-content">
          <strong>HACKATHON IS CURRENTLY PAUSED.</strong> Countdown and scheduled alarms are frozen. Completed tasks and team state are preserved. Click "Resume Hackathon" when ready to continue.
        </div>
        <button class="btn btn-sm btn-primary" id="btnResumeBanner">▶️ Resume Now</button>
      </div>
    ` : '';

    return `
      <div class="dashboard-page">
        ${pausedBanner}

        <!-- Top Overview Grid -->
        <div class="dashboard-hero-grid">
          <!-- Main Countdown Card -->
          <div class="dash-card timer-card glass-panel">
            <div class="card-label">REMAINING HACKATHON TIME</div>
            <div class="dash-timer-display" id="dashCountdownVal">${timeData.formattedRemaining}</div>
            <div class="dash-timer-meta">
              <span class="meta-item">
                <span class="meta-label">Current Phase:</span>
                <strong id="dashCurrentHourVal">Hour ${timeData.currentHour} of ${state.session.durationHours}</strong>
              </span>
              <span class="meta-item">
                <span class="meta-label">Check-In:</span>
                <span>${timeData.checkInTimeFormatted}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">Deadline:</span>
                <span class="text-accent">${timeData.submissionTimeFormatted}</span>
              </span>
            </div>

            <!-- Hour Progress Bar -->
            <div class="progress-container">
              <div class="progress-bar-track">
                <div class="progress-bar-fill progress-fill-purple" id="dashHourProgressBar" style="width: ${timeData.hourProgressPercent}%;"></div>
              </div>
              <div class="progress-info">
                <small id="dashHourProgressTxt">${timeData.hourProgressPercent}% of Hour ${timeData.currentHour} elapsed</small>
                <small>${Math.round(timeData.overallTimePercent)}% Total Time Passed</small>
              </div>
            </div>
          </div>

          <!-- Overall Progress Card -->
          <div class="dash-card progress-card glass-panel">
            <div class="card-label">OVERALL COMPLETION VELOCITY</div>
            <div class="progress-radial-box">
              <div class="progress-radial-val">${stats.progressPercent}%</div>
              <div class="progress-radial-meta">
                <div class="radial-stat-row">
                  <span class="dot-indicator dot-completed"></span>
                  <span>${stats.completed} Completed Tasks</span>
                </div>
                <div class="radial-stat-row">
                  <span class="dot-indicator dot-pending"></span>
                  <span>${stats.pending} Pending / In Progress</span>
                </div>
                <div class="radial-stat-row">
                  <span class="dot-indicator dot-delayed"></span>
                  <span class="${stats.delayed > 0 ? 'text-danger font-bold' : ''}">${stats.delayed} Delayed Tasks</span>
                </div>
              </div>
            </div>

            <div class="progress-container mt-3">
              <div class="progress-bar-track">
                <div class="progress-bar-fill progress-fill-green" style="width: ${stats.progressPercent}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prominent Current & Upcoming Activity -->
        <div class="activity-highlight-grid">
          <div class="activity-card current-activity glass-panel">
            <div class="activity-badge badge-current">⭐ CURRENT ACTIVE FOCUS (HOUR ${timeData.currentHour})</div>
            <h2 class="activity-title">${escapeHTML(currentSchedule.title)}</h2>
            <p class="activity-desc">${escapeHTML(currentSchedule.description)}</p>
            <div class="activity-footer">
              <span class="activity-category-pill pill-${currentSchedule.category.toLowerCase()}">${currentSchedule.category}</span>
              <button class="btn btn-secondary btn-sm" id="btnQuickAddTask">
                <span>➕ Add Task For This Phase</span>
              </button>
            </div>
          </div>

          <div class="activity-card upcoming-activity glass-panel">
            <div class="activity-badge badge-upcoming">⏳ UPCOMING ACTIVITY</div>
            <h3 class="activity-title">${escapeHTML(nextSchedule.title)}</h3>
            <p class="activity-desc">${escapeHTML(nextSchedule.description)}</p>
            <div class="activity-footer">
              <span class="activity-category-pill pill-${nextSchedule.category.toLowerCase()}">${nextSchedule.category}</span>
              <button class="btn btn-ghost btn-sm" data-nav-target="schedule">
                <span>View Full Schedule ➔</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Visual 24-Hour Timeline -->
        <div class="timeline-section glass-panel">
          <div class="section-header">
            <div>
              <h3 class="section-title">24-Hour Mission Timeline</h3>
              <p class="section-subtitle">Real-time synchronized roadmap with hourly checkpoint markers</p>
            </div>
            <div class="timeline-legend">
              <span class="legend-item"><span class="legend-dot dot-past"></span> Past</span>
              <span class="legend-item"><span class="legend-dot dot-current"></span> Current</span>
              <span class="legend-item"><span class="legend-dot dot-future"></span> Planned</span>
            </div>
          </div>

          <div class="timeline-scroll-wrapper">
            <div class="timeline-track">
              ${this.renderTimelineNodes(state, timeData.currentHour)}
            </div>
          </div>
        </div>

        <!-- Team Status Quick View & Quick Actions -->
        <div class="dashboard-secondary-grid">
          <!-- Team Workload Snapshot -->
          <div class="dash-card glass-panel">
            <div class="section-header-compact">
              <h4 class="card-subtitle">Team Roster & Workload</h4>
              <button class="btn btn-ghost btn-sm" data-nav-target="team">Manage Team ➔</button>
            </div>
            <div class="team-snapshot-list">
              ${this.renderTeamSnapshot(state)}
            </div>
          </div>

          <!-- Quick Action Controls -->
          <div class="dash-card glass-panel">
            <div class="section-header-compact">
              <h4 class="card-subtitle">Quick Control Actions</h4>
            </div>
            <div class="quick-action-buttons">
              <button class="btn btn-secondary btn-block" id="btnDashTestAlarm">
                <span>🔔 Test Alarm Sound & Modal</span>
              </button>
              <button class="btn btn-secondary btn-block" data-nav-target="research">
                <span>🔬 Open Research Manager & 5-Whys</span>
              </button>
              <button class="btn btn-secondary btn-block" data-nav-target="presentation">
                <span>🎤 Presentation Prep Checklist</span>
              </button>
              <button class="btn btn-secondary btn-block" data-nav-target="report">
                <span>📊 Generate Final Progress Report</span>
              </button>
            </div>

            <!-- Background Alert Notice -->
            <div class="info-callout mt-3">
              <small>ℹ️ <strong>Browser Timer Note:</strong> Chrome/Firefox may throttle timers if this tab is completely closed or inactive on Android. Keep tab pinned or install as PWA for best results.</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderTimelineNodes(state, currentHour) {
    const schedule = state.schedule || [];
    return schedule.map((item, idx) => {
      let statusClass = 'future';
      if (currentHour > item.endHour) {
        statusClass = 'past';
      } else if (currentHour >= item.startHour && currentHour <= item.endHour) {
        statusClass = 'current';
      }

      return `
        <div class="timeline-node ${statusClass}" title="${escapeHTML(item.title)}">
          <div class="node-hour">H${item.startHour}-${item.endHour}</div>
          <div class="node-marker">
            <div class="marker-core"></div>
          </div>
          <div class="node-details">
            <span class="node-title">${escapeHTML(item.title)}</span>
            <span class="node-tag">${item.category}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderTeamSnapshot(state) {
    const team = state.team || [];
    if (team.length === 0) {
      return `<p class="empty-hint">No team members added yet. <a href="#" data-nav-target="team">Add members in Team Manager</a>.</p>`;
    }

    return team.map((member) => {
      const workload = window.TeamManager.getMemberWorkload(member.id);
      return `
        <div class="team-snapshot-item">
          <div class="member-avatar">${member.name.charAt(0).toUpperCase()}</div>
          <div class="member-info">
            <div class="member-name-row">
              <span class="member-name">${escapeHTML(member.name)}</span>
              <span class="member-role-tag">${escapeHTML(member.role)}</span>
            </div>
            <div class="member-stats-row">
              <small>${workload.completed}/${workload.total} tasks completed</small>
              <span class="member-workload-bar">
                <span class="member-workload-fill" style="width: ${workload.progressPercent}%;"></span>
              </span>
              <small class="text-accent">${workload.progressPercent}%</small>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateDashboardTimelineMarker(currentHour) {
    // Dynamically update timeline without full DOM rebuild
  }

  initDashboardEvents() {
    // Quick Add Task
    document.getElementById('btnQuickAddTask')?.addEventListener('click', () => {
      this.openTaskModal();
    });

    // Resume banner button
    document.getElementById('btnResumeBanner')?.addEventListener('click', () => {
      this.togglePause();
    });

    // Test alarm button
    document.getElementById('btnDashTestAlarm')?.addEventListener('click', () => {
      this.triggerTestAlarm();
    });

    // Delegated nav buttons
    document.querySelectorAll('[data-nav-target]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-nav-target');
        this.switchTab(target);
      });
    });
  }

  // --- VIEW 2: TIME PLANNER / SCHEDULE ---
  getScheduleHTML() {
    const state = window.AppState;
    const timeData = window.HackathonTimer.getTimeData(state);
    const schedule = state.schedule || [];

    return `
      <div class="schedule-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">24-Hour Hackathon Time Planner</h2>
            <p class="page-subtitle">Hourly roadmap, milestone targets, and development phase checkpoints</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" id="btnResetDefaultSchedule">
              <span>🔄 Reset to Default Schedule</span>
            </button>
            <button class="btn btn-primary" id="btnAddSchedulePhase">
              <span>➕ Add Custom Phase</span>
            </button>
          </div>
        </div>

        <div class="schedule-timeline-table glass-panel">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 120px;">Hour Range</th>
                <th style="width: 140px;">Status</th>
                <th>Phase Title & Goals</th>
                <th style="width: 140px;">Category</th>
                <th style="width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${schedule.map((item, idx) => {
                let statusBadge = '<span class="status-pill pill-future">Planned</span>';
                let rowHighlight = '';
                if (timeData.currentHour > item.endHour) {
                  statusBadge = '<span class="status-pill pill-completed">Completed</span>';
                } else if (timeData.currentHour >= item.startHour && timeData.currentHour <= item.endHour) {
                  statusBadge = '<span class="status-pill pill-active">⚡ Active Now</span>';
                  rowHighlight = 'class="row-active"';
                }

                return `
                  <tr ${rowHighlight}>
                    <td>
                      <strong class="time-range-txt">Hour ${item.startHour} – ${item.endHour}</strong>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                      <div class="schedule-title-txt">${escapeHTML(item.title)}</div>
                      <div class="schedule-desc-txt">${escapeHTML(item.description)}</div>
                    </td>
                    <td>
                      <span class="activity-category-pill pill-${item.category.toLowerCase()}">${item.category}</span>
                    </td>
                    <td>
                      <div class="btn-group-sm">
                        <button class="btn btn-icon btn-secondary" title="Edit Phase" data-edit-schedule="${item.id}">✏️</button>
                        <button class="btn btn-icon btn-danger" title="Delete Phase" data-delete-schedule="${item.id}">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  initScheduleEvents() {
    document.getElementById('btnResetDefaultSchedule')?.addEventListener('click', () => {
      if (confirm('Reset schedule back to the standard 24-hour hackathon template?')) {
        window.AppState.schedule = JSON.parse(JSON.stringify(window.Storage.getInitialState().schedule));
        window.Storage.saveState(window.AppState);
        this.renderCurrentView();
      }
    });

    document.getElementById('btnAddSchedulePhase')?.addEventListener('click', () => {
      this.openScheduleModal();
    });

    document.querySelectorAll('[data-edit-schedule]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-edit-schedule');
        const item = window.AppState.schedule.find((s) => s.id === id);
        if (item) {
          this.openScheduleModal(item);
        }
      });
    });

    document.querySelectorAll('[data-delete-schedule]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-schedule');
        if (confirm('Delete this schedule phase?')) {
          window.AppState.schedule = window.AppState.schedule.filter((s) => s.id !== id);
          window.Storage.saveState(window.AppState);
          this.renderCurrentView();
        }
      });
    });
  }

  // --- VIEW 3: PERSONAL TASK CHECKLIST ---
  getTasksHTML() {
    const stats = window.TaskManager.getStatistics();
    const categories = window.TaskManager.getCategories();
    const tasks = window.TaskManager.getFilteredTasks();

    return `
      <div class="tasks-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">Personal & Team Task Checklist</h2>
            <p class="page-subtitle">Track deliverables, manage sub-checklists, prioritize work, and prevent bottlenecks</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="btnAddNewTask">
              <span>➕ Add New Task</span>
            </button>
          </div>
        </div>

        <!-- Task Category Tabs -->
        <div class="task-categories-nav">
          <button class="category-chip ${window.TaskManager.currentCategoryFilter === 'ALL' ? 'active' : ''}" data-cat-filter="ALL">
            All Categories (${stats.total})
          </button>
          ${categories.map((cat) => {
            const catStat = stats.categoryStats[cat] || { total: 0, completed: 0 };
            return `
              <button class="category-chip ${window.TaskManager.currentCategoryFilter === cat ? 'active' : ''}" data-cat-filter="${cat}">
                ${cat} (${catStat.completed}/${catStat.total})
              </button>
            `;
          }).join('')}
        </div>

        <!-- Task Status Filter & Search Bar -->
        <div class="task-toolbar glass-panel">
          <div class="task-filter-group">
            <button class="filter-btn ${window.TaskManager.currentStatusFilter === 'ALL' ? 'active' : ''}" data-status-filter="ALL">All (${stats.total})</button>
            <button class="filter-btn ${window.TaskManager.currentStatusFilter === 'In Progress' ? 'active' : ''}" data-status-filter="In Progress">In Progress (${stats.inProgress})</button>
            <button class="filter-btn ${window.TaskManager.currentStatusFilter === 'Completed' ? 'active' : ''}" data-status-filter="Completed">Completed (${stats.completed})</button>
            <button class="filter-btn ${window.TaskManager.currentStatusFilter === 'DELAYED' ? 'active' : ''}" data-status-filter="DELAYED">Delayed (${stats.delayed})</button>
          </div>
          <div class="task-search-box">
            <input type="text" id="taskSearchInput" class="form-control form-control-sm" placeholder="🔍 Search tasks..." value="${escapeHTML(window.TaskManager.searchQuery)}" />
          </div>
        </div>

        <!-- Task Cards Grid -->
        <div class="tasks-grid">
          ${tasks.length === 0 ? `
            <div class="empty-state-card glass-panel">
              <div class="empty-state-icon">📋</div>
              <h3>No tasks found</h3>
              <p>Try adjusting your category/status filters or add a new hackathon task.</p>
              <button class="btn btn-primary" id="btnEmptyAddTask">➕ Add First Task</button>
            </div>
          ` : tasks.map((task) => this.renderTaskCard(task)).join('')}
        </div>
      </div>
    `;
  }

  renderTaskCard(task) {
    const assignedMember = task.assignedMemberId ? window.TeamManager.getMemberById(task.assignedMemberId) : null;
    const isCompleted = task.status === 'Completed';
    const isDelayed = task.delayed || task.status === 'Delayed';

    return `
      <div class="task-card glass-panel ${isCompleted ? 'task-card-completed' : ''} ${isDelayed ? 'task-card-delayed' : ''}" data-task-id="${task.id}">
        <div class="task-card-header">
          <div class="task-checkbox-wrap">
            <input type="checkbox" class="task-checkbox" id="chk_${task.id}" ${isCompleted ? 'checked' : ''} data-toggle-complete="${task.id}" />
            <label for="chk_${task.id}" class="task-title ${isCompleted ? 'line-through' : ''}">${escapeHTML(task.title)}</label>
          </div>
          <div class="task-badges">
            <span class="priority-pill priority-${task.priority.toLowerCase()}">${task.priority}</span>
            <span class="activity-category-pill pill-${task.category.toLowerCase()}">${task.category}</span>
          </div>
        </div>

        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}

        <!-- Sub Checklist Items -->
        ${task.checklist && task.checklist.length > 0 ? `
          <div class="task-subchecklist">
            ${task.checklist.map((c) => `
              <div class="subcheck-item">
                <input type="checkbox" id="${c.id}" ${c.done ? 'checked' : ''} data-toggle-subcheck="${task.id}:${c.id}" />
                <label for="${c.id}" class="${c.done ? 'line-through text-muted' : ''}">${escapeHTML(c.text)}</label>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="task-meta-row">
          <div class="task-assigned">
            <span class="meta-label">Assigned:</span>
            <strong>${assignedMember ? escapeHTML(assignedMember.name) : '<span class="text-muted">Unassigned</span>'}</strong>
          </div>
          <div class="task-deadline">
            <span class="meta-label">Deadline:</span>
            <span class="${isDelayed ? 'text-danger font-bold' : ''}">Hour ${task.deadlineHour} ${isDelayed ? '⚠️ DELAYED' : ''}</span>
          </div>
        </div>

        <div class="task-card-footer">
          <div class="task-actions-left">
            <button class="btn btn-ghost btn-xs ${isDelayed ? 'text-warning' : 'text-muted'}" data-toggle-delayed="${task.id}" title="Toggle Delayed Status">
              ${isDelayed ? '⚠️ Delayed' : 'Mark Delayed'}
            </button>
            <button class="btn btn-ghost btn-xs" data-add-subcheck="${task.id}">
              ➕ Sub-item
            </button>
          </div>
          <div class="task-actions-right">
            <button class="btn btn-icon btn-ghost btn-xs" title="Edit Task" data-edit-task="${task.id}">✏️</button>
            <button class="btn btn-icon btn-ghost btn-xs text-danger" title="Delete Task" data-delete-task="${task.id}">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  initTasksEvents() {
    document.getElementById('btnAddNewTask')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('btnEmptyAddTask')?.addEventListener('click', () => this.openTaskModal());

    // Search input
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        window.TaskManager.searchQuery = e.target.value;
        this.renderCurrentView();
      });
    }

    // Category chips
    document.querySelectorAll('[data-cat-filter]').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        window.TaskManager.currentCategoryFilter = e.currentTarget.getAttribute('data-cat-filter');
        this.renderCurrentView();
      });
    });

    // Status filter buttons
    document.querySelectorAll('[data-status-filter]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        window.TaskManager.currentStatusFilter = e.currentTarget.getAttribute('data-status-filter');
        this.renderCurrentView();
      });
    });

    // Toggle complete
    document.querySelectorAll('[data-toggle-complete]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const taskId = e.currentTarget.getAttribute('data-toggle-complete');
        window.TaskManager.toggleTaskComplete(taskId);
      });
    });

    // Toggle subchecklist item
    document.querySelectorAll('[data-toggle-subcheck]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const [taskId, checkId] = e.currentTarget.getAttribute('data-toggle-subcheck').split(':');
        window.TaskManager.toggleChecklistItem(taskId, checkId);
      });
    });

    // Add subcheck item
    document.querySelectorAll('[data-add-subcheck]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const taskId = e.currentTarget.getAttribute('data-add-subcheck');
        const text = prompt('Enter checklist sub-item:');
        if (text && text.trim()) {
          window.TaskManager.addChecklistItem(taskId, text);
        }
      });
    });

    // Toggle delayed
    document.querySelectorAll('[data-toggle-delayed]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const taskId = e.currentTarget.getAttribute('data-toggle-delayed');
        window.TaskManager.toggleTaskDelayed(taskId);
      });
    });

    // Edit task
    document.querySelectorAll('[data-edit-task]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const taskId = e.currentTarget.getAttribute('data-edit-task');
        const task = window.AppState.tasks.find((t) => t.id === taskId);
        if (task) {
          this.openTaskModal(task);
        }
      });
    });

    // Delete task
    document.querySelectorAll('[data-delete-task]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const taskId = e.currentTarget.getAttribute('data-delete-task');
        if (confirm('Delete this task?')) {
          window.TaskManager.deleteTask(taskId);
        }
      });
    });
  }

  // --- VIEW 4: TEAM MANAGER ---
  getTeamHTML() {
    const overview = window.TeamManager.getTeamOverview();
    const members = window.TeamManager.getTeamMembers();

    return `
      <div class="team-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">Team Manager & Workload Control</h2>
            <p class="page-subtitle">Delegate tasks, assign roles, monitor live individual velocity, and balance team capacity</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="btnAddTeamMember">
              <span>➕ Add Team Member</span>
            </button>
          </div>
        </div>

        <!-- Team Overview: Who is working on what -->
        <div class="team-overview-banner glass-panel">
          <h3 class="section-title">⚡ Live Team Activity Overview</h3>
          <p class="section-subtitle">Real-time status of current active assignments across the roster</p>

          <div class="live-activity-grid">
            ${overview.memberOverviews.map((item) => `
              <div class="live-member-pill">
                <span class="member-indicator-dot dot-active"></span>
                <strong>${escapeHTML(item.member.name)}</strong>
                <span class="text-muted">(${escapeHTML(item.member.role)}):</span>
                <span class="live-task-name">${item.currentTask ? escapeHTML(item.currentTask.title) : '<em class="text-muted">No active task assigned</em>'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Member Cards Grid -->
        <div class="team-members-grid">
          ${members.length === 0 ? `
            <div class="empty-state-card glass-panel">
              <div class="empty-state-icon">👥</div>
              <h3>No team members yet</h3>
              <p>Add your teammates to assign roles and delegate tasks.</p>
              <button class="btn btn-primary" id="btnEmptyAddMember">➕ Add First Member</button>
            </div>
          ` : overview.memberOverviews.map((item) => this.renderMemberCard(item)).join('')}
        </div>
      </div>
    `;
  }

  renderMemberCard({ member, workload, currentTask }) {
    return `
      <div class="member-card glass-panel" data-member-id="${member.id}">
        <div class="member-card-header">
          <div class="member-title-box">
            <div class="member-avatar-lg">${member.name.charAt(0).toUpperCase()}</div>
            <div>
              <h3 class="member-card-name">${escapeHTML(member.name)}</h3>
              <span class="member-card-role">${escapeHTML(member.role)}</span>
            </div>
          </div>
          <div class="member-card-actions">
            <button class="btn btn-icon btn-ghost btn-sm" title="Edit Member" data-edit-member="${member.id}">✏️</button>
            <button class="btn btn-icon btn-ghost btn-sm text-danger" title="Delete Member" data-delete-member="${member.id}">🗑️</button>
          </div>
        </div>

        <!-- Skills & Contact -->
        ${member.skills ? `
          <div class="member-skills-row">
            ${member.skills.split(',').map((s) => `<span class="skill-pill">${escapeHTML(s.trim())}</span>`).join('')}
          </div>
        ` : ''}

        ${member.contact ? `
          <div class="member-contact-row">
            <small>📞 ${escapeHTML(member.contact)}</small>
          </div>
        ` : ''}

        <!-- Workload Bar -->
        <div class="member-workload-container">
          <div class="workload-label-row">
            <span>Workload Capacity: ${workload.completed}/${workload.total} Tasks</span>
            <strong>${workload.progressPercent}%</strong>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill progress-fill-green" style="width: ${workload.progressPercent}%;"></div>
          </div>
          <div class="workload-breakdown-row">
            <small class="text-success">${workload.completed} Done</small>
            <small class="text-accent">${workload.inProgress} In Progress</small>
            <small class="${workload.delayed > 0 ? 'text-danger font-bold' : 'text-muted'}">${workload.delayed} Delayed</small>
          </div>
        </div>

        <!-- Assigned Tasks List -->
        <div class="member-assigned-tasks">
          <div class="assigned-tasks-header">
            <span class="meta-label">Assigned Tasks (${workload.total})</span>
            <button class="btn btn-ghost btn-xs" data-assign-task-to="${member.id}">➕ Assign Task</button>
          </div>
          <div class="assigned-task-items">
            ${workload.tasks.length === 0 ? `
              <p class="empty-hint">No tasks assigned yet.</p>
            ` : workload.tasks.map((t) => `
              <div class="assigned-task-item ${t.status === 'Completed' ? 'is-done' : ''} ${t.delayed ? 'is-delayed' : ''}">
                <span class="task-status-dot dot-${t.status.toLowerCase().replace(/\s+/g, '')}"></span>
                <span class="assigned-item-title">${escapeHTML(t.title)}</span>
                <span class="assigned-item-deadline">H${t.deadlineHour}</span>
                <button class="btn btn-ghost btn-xs text-muted" data-reassign-task="${t.id}" title="Reassign">⇄</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  initTeamEvents() {
    document.getElementById('btnAddTeamMember')?.addEventListener('click', () => this.openMemberModal());
    document.getElementById('btnEmptyAddMember')?.addEventListener('click', () => this.openMemberModal());

    document.querySelectorAll('[data-edit-member]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-edit-member');
        const mem = window.TeamManager.getMemberById(id);
        if (mem) this.openMemberModal(mem);
      });
    });

    document.querySelectorAll('[data-delete-member]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-member');
        if (confirm('Delete this team member? Any tasks assigned to them will become unassigned.')) {
          window.TeamManager.deleteMember(id);
        }
      });
    });

    document.querySelectorAll('[data-assign-task-to]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const memberId = e.currentTarget.getAttribute('data-assign-task-to');
        this.openAssignTaskModal(memberId);
      });
    });

    document.querySelectorAll('[data-reassign-task]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const taskId = e.currentTarget.getAttribute('data-reassign-task');
        this.openReassignModal(taskId);
      });
    });
  }

  // --- VIEW 5: RESEARCH MANAGER MODULE & 5-WHYS ---
  getResearchHTML() {
    const researchData = window.ResearchManager.getResearchData();
    const fields = window.ResearchManager.getFieldDefinitions();
    const completion = window.ResearchManager.getResearchCompletion();
    const whys = Array.isArray(researchData.fiveWhys) ? researchData.fiveWhys : ['', '', '', '', ''];

    return `
      <div class="research-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">Research & Problem Analysis Manager</h2>
            <p class="page-subtitle">15-Point Engineering Specification and 5-Whys Root Cause Analysis</p>
          </div>
          <div class="header-actions">
            <span class="save-status-txt" id="researchSaveStatus">
              ${researchData.lastSaved ? `Saved ${new Date(researchData.lastSaved).toLocaleTimeString()}` : 'Auto-saved'}
            </span>
            <button class="btn btn-secondary" id="btnExportResearchMd">
              <span>📥 Export Spec (Markdown)</span>
            </button>
            <button class="btn btn-primary" id="btnManualSaveResearch">
              <span>💾 Save Research</span>
            </button>
          </div>
        </div>

        <!-- Research Completion Metric -->
        <div class="research-score-banner glass-panel">
          <div class="score-info">
            <span class="score-badge">Specification Completeness</span>
            <h3>${completion.percent}% Complete (${completion.filledCount} of ${completion.totalFields} Sections Documented)</h3>
          </div>
          <div class="progress-bar-track" style="height: 10px;">
            <div class="progress-bar-fill progress-fill-purple" style="width: ${completion.percent}%;"></div>
          </div>
        </div>

        <!-- 5-Whys Interactive Root Cause Tool -->
        <div class="five-whys-section glass-panel">
          <div class="section-header">
            <div>
              <h3 class="section-title">🔍 5-Whys Root Cause Discovery Tool</h3>
              <p class="section-subtitle">Drill down layer-by-layer to uncover the fundamental engineering reason behind the problem.</p>
            </div>
          </div>

          <div class="five-whys-flow">
            ${[0, 1, 2, 3, 4].map((idx) => `
              <div class="why-step-card">
                <div class="why-step-number">Why #${idx + 1}</div>
                <div class="why-input-container">
                  <label class="why-label">${idx === 0 ? 'Why does the symptom / high-level problem occur?' : `Why does the above condition (${idx}) happen?`}</label>
                  <input type="text" class="form-control" data-why-idx="${idx}" placeholder="State the underlying cause..." value="${escapeHTML(whys[idx] || '')}" />
                </div>
              </div>
            `).join('')}

            <!-- Root Cause Conclusion Box -->
            <div class="why-conclusion-card">
              <div class="conclusion-badge">🎯 CORE ROOT CAUSE CONCLUSION</div>
              <textarea class="form-control" id="whyRootCauseInput" rows="2" placeholder="Synthesize the fundamental root cause your hackathon project directly solves...">${escapeHTML(researchData.fiveWhysRootCause || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- 15-Point Research Fields -->
        <div class="research-fields-section glass-panel">
          <h3 class="section-title">📑 15-Point Engineering Specification Framework</h3>
          <p class="section-subtitle">Fill in each technical domain to form a watertight project submission and presentation.</p>

          <div class="research-fields-grid">
            ${fields.map((field) => `
              <div class="research-field-card">
                <label class="research-field-label">${field.label}</label>
                <textarea class="form-control research-field-input" data-research-field="${field.key}" rows="3" placeholder="${field.placeholder}">${escapeHTML(researchData[field.key] || '')}</textarea>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  initResearchEvents() {
    // 5 Whys input listeners
    document.querySelectorAll('[data-why-idx]').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-why-idx'), 10);
        window.ResearchManager.updateWhy(idx, e.currentTarget.value);
        this.updateSaveIndicator();
      });
    });

    // Root cause conclusion
    const rootCauseInput = document.getElementById('whyRootCauseInput');
    if (rootCauseInput) {
      rootCauseInput.addEventListener('input', (e) => {
        window.ResearchManager.updateWhyRootCause(e.target.value);
        this.updateSaveIndicator();
      });
    }

    // 15 fields
    document.querySelectorAll('[data-research-field]').forEach((textarea) => {
      textarea.addEventListener('input', (e) => {
        const key = e.currentTarget.getAttribute('data-research-field');
        window.ResearchManager.updateField(key, e.currentTarget.value);
        this.updateSaveIndicator();
      });
    });

    // Save button
    document.getElementById('btnManualSaveResearch')?.addEventListener('click', () => {
      window.Storage.saveState(window.AppState);
      const status = document.getElementById('researchSaveStatus');
      if (status) {
        status.textContent = `Saved at ${new Date().toLocaleTimeString()} ✓`;
        status.style.color = '#10b981';
      }
    });

    // Export button
    document.getElementById('btnExportResearchMd')?.addEventListener('click', () => {
      window.ResearchManager.exportMarkdown();
    });
  }

  updateSaveIndicator() {
    const status = document.getElementById('researchSaveStatus');
    if (status) {
      status.textContent = 'Auto-saving...';
      status.style.color = '#f59e0b';
      setTimeout(() => {
        if (status) {
          status.textContent = `Auto-saved ${new Date().toLocaleTimeString()} ✓`;
          status.style.color = '#10b981';
        }
      }, 600);
    }
  }

  // --- VIEW 6: PRESENTATION & SUBMISSION ---
  getPresentationHTML() {
    const state = window.AppState;
    const checklist = state.presentation?.checklist || [];
    const qaList = state.presentation?.judgeQA || [];
    const doneCount = checklist.filter((c) => c.done).length;
    const percent = Math.round((doneCount / checklist.length) * 100);

    return `
      <div class="presentation-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">Presentation & Submission Module</h2>
            <p class="page-subtitle">Final 10-point readiness checklist, pitch script alignment, and live Judge Q&A recorder</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="btnAddJudgeQA">
              <span>➕ Record Judge Q&A</span>
            </button>
          </div>
        </div>

        <!-- 10-Point Readiness Checklist -->
        <div class="pres-checklist-card glass-panel">
          <div class="section-header">
            <div>
              <h3 class="section-title">🏆 10-Point Pitch & Submission Checklist</h3>
              <p class="section-subtitle">Must-pass requirements before presenting to the judging panel</p>
            </div>
            <div class="pres-score-pill">${doneCount} / 10 Ready (${percent}%)</div>
          </div>

          <div class="progress-bar-track mb-3">
            <div class="progress-bar-fill progress-fill-green" style="width: ${percent}%;"></div>
          </div>

          <div class="pres-checklist-grid">
            ${checklist.map((item) => `
              <div class="pres-check-item ${item.done ? 'is-checked' : ''}">
                <input type="checkbox" id="${item.id}" ${item.done ? 'checked' : ''} data-toggle-pres="${item.id}" />
                <label for="${item.id}">${escapeHTML(item.text)}</label>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Judge Q&A Section -->
        <div class="judge-qa-section glass-panel">
          <div class="section-header">
            <div>
              <h3 class="section-title">🎤 Judge Q&A & Feedback Log</h3>
              <p class="section-subtitle">Record specific questions asked by judges during evaluation for review and future rounds</p>
            </div>
          </div>

          <div class="judge-qa-list">
            ${qaList.length === 0 ? `
              <p class="empty-hint">No judge questions recorded yet. Click "Record Judge Q&A" during or immediately after your presentation.</p>
            ` : qaList.map((qa) => `
              <div class="judge-qa-card">
                <div class="qa-header">
                  <strong>Judge / Evaluator: ${escapeHTML(qa.judgeName || 'Judge')}</strong>
                  <button class="btn btn-icon btn-ghost btn-xs text-danger" data-delete-qa="${qa.id}">🗑️</button>
                </div>
                <div class="qa-body">
                  <div class="qa-question">
                    <span class="qa-badge badge-question">Q:</span>
                    <p>${escapeHTML(qa.question)}</p>
                  </div>
                  <div class="qa-answer">
                    <span class="qa-badge badge-answer">A:</span>
                    <p>${escapeHTML(qa.answer)}</p>
                  </div>
                  ${qa.notes ? `<div class="qa-notes"><small><em>Notes: ${escapeHTML(qa.notes)}</em></small></div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  initPresentationEvents() {
    document.querySelectorAll('[data-toggle-pres]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const id = e.currentTarget.getAttribute('data-toggle-pres');
        const state = window.AppState;
        const item = state.presentation.checklist.find((c) => c.id === id);
        if (item) {
          item.done = !item.done;
          window.Storage.saveState(state);
          this.renderCurrentView();
        }
      });
    });

    document.getElementById('btnAddJudgeQA')?.addEventListener('click', () => {
      this.openJudgeQAModal();
    });

    document.querySelectorAll('[data-delete-qa]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-delete-qa');
        const state = window.AppState;
        state.presentation.judgeQA = state.presentation.judgeQA.filter((q) => q.id !== id);
        window.Storage.saveState(state);
        this.renderCurrentView();
      });
    });
  }

  // --- VIEW 7: PROGRESS & FINAL REPORT ---
  getReportHTML() {
    const state = window.AppState;
    const timeData = window.HackathonTimer.getTimeData(state);
    const stats = window.TaskManager.getStatistics();
    const categories = window.TaskManager.getCategories();
    const team = state.team || [];
    const researchComp = window.ResearchManager.getResearchCompletion();

    return `
      <div class="report-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">Project Performance & Final Report</h2>
            <p class="page-subtitle">Executive summary of deliverables, team output, and hackathon metrics</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" id="btnPrintReport">
              <span>🖨️ Print / Save PDF</span>
            </button>
            <button class="btn btn-primary" id="btnDownloadReportJSON">
              <span>📥 Export Full Data (JSON)</span>
            </button>
          </div>
        </div>

        <div class="printable-report glass-panel" id="printableReportSection">
          <!-- Report Header -->
          <div class="report-title-block">
            <div class="report-badge">HACKATHON FINAL PERFORMANCE REPORT</div>
            <h1 class="report-main-title">${escapeHTML(state.session.projectName || 'Project')}</h1>
            <p class="report-team-line">Built by <strong>${escapeHTML(state.session.teamName || 'Team')}</strong> (${state.session.teamSize} Engineers) | Duration: ${state.session.durationHours} Hours</p>
            <div class="report-time-stamps">
              <span>Started: ${timeData.checkInTimeFormatted}</span>
              <span>Deadline: ${timeData.submissionTimeFormatted}</span>
              <span>Total Elapsed: ${timeData.formattedElapsed}</span>
            </div>
          </div>

          <!-- Overall Summary Cards -->
          <div class="report-summary-metrics">
            <div class="report-metric-box">
              <span class="report-metric-num">${stats.progressPercent}%</span>
              <span class="report-metric-lbl">Overall Task Completion</span>
            </div>
            <div class="report-metric-box">
              <span class="report-metric-num text-success">${stats.completed}</span>
              <span class="report-metric-lbl">Tasks Delivered</span>
            </div>
            <div class="report-metric-box">
              <span class="report-metric-num text-warning">${stats.pending}</span>
              <span class="report-metric-lbl">Pending / In-Progress</span>
            </div>
            <div class="report-metric-box">
              <span class="report-metric-num text-danger">${stats.delayed}</span>
              <span class="report-metric-lbl">Delayed Bottlenecks</span>
            </div>
          </div>

          <!-- Domain Progress Breakdown -->
          <div class="report-section mt-4">
            <h3 class="report-section-heading">Category Completion Breakdown</h3>
            <div class="category-breakdown-list">
              ${categories.map((cat) => {
                const s = stats.categoryStats[cat] || { total: 0, completed: 0, percent: 0 };
                return `
                  <div class="cat-report-row">
                    <div class="cat-report-meta">
                      <strong>${cat}</strong>
                      <span>${s.completed}/${s.total} (${s.percent}%)</span>
                    </div>
                    <div class="progress-bar-track">
                      <div class="progress-bar-fill progress-fill-purple" style="width: ${s.percent}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Team Contribution Breakdown -->
          <div class="report-section mt-4">
            <h3 class="report-section-heading">Team Member Contributions</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Assigned Role</th>
                  <th>Assigned Tasks</th>
                  <th>Completed</th>
                  <th>Velocity %</th>
                </tr>
              </thead>
              <tbody>
                ${team.map((m) => {
                  const w = window.TeamManager.getMemberWorkload(m.id);
                  return `
                    <tr>
                      <td><strong>${escapeHTML(m.name)}</strong></td>
                      <td>${escapeHTML(m.role)}</td>
                      <td>${w.total}</td>
                      <td><span class="text-success font-bold">${w.completed}</span></td>
                      <td>
                        <div class="progress-info-inline">
                          <div class="progress-bar-track" style="width: 80px; display: inline-block;">
                            <div class="progress-bar-fill progress-fill-green" style="width: ${w.progressPercent}%;"></div>
                          </div>
                          <span>${w.progressPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Research Completeness -->
          <div class="report-section mt-4">
            <h3 class="report-section-heading">Research & Specification Completeness</h3>
            <p>15-Point Engineering Specification is <strong>${researchComp.percent}% completed</strong> (${researchComp.filledCount} of 15 domains documented).</p>
          </div>
        </div>
      </div>
    `;
  }

  initReportEvents() {
    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btnDownloadReportJSON')?.addEventListener('click', () => {
      window.Storage.exportJSON(window.AppState);
    });
  }

  // --- VIEW 8: SETTINGS & NOTIFICATIONS ---
  getSettingsHTML() {
    const state = window.AppState;
    const settings = state.settings || {};

    return `
      <div class="settings-page">
        <div class="page-header">
          <div>
            <h2 class="page-title">Notification & System Settings</h2>
            <p class="page-subtitle">Configure hourly chimes, milestone warnings, sound volumes, and PWA installation</p>
          </div>
        </div>

        <div class="settings-grid">
          <!-- Notification Preferences -->
          <div class="settings-card glass-panel">
            <h3 class="section-title">🔔 Alarm & Notification Triggers</h3>

            <div class="setting-toggle-row">
              <div>
                <strong>Hourly Alarms</strong>
                <p class="setting-desc">Triggers sound and dialog at every hour transition (Hour 1 Complete, Hour 2 Complete...)</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="setHourlyAlarms" ${settings.hourlyAlarms ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div>
                <strong>Milestone Warnings</strong>
                <p class="setting-desc">15-minute checkpoint warnings, final 2-hour warning, and final 1-hour warning</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="setMilestoneAlerts" ${settings.milestoneAlerts ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div>
                <strong>Delayed Task Warnings</strong>
                <p class="setting-desc">Alert when a task exceeds its scheduled deadline hour without completion</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="setDelayedAlerts" ${settings.delayedAlerts ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div>
                <strong>Web Audio Synthesizer Sound</strong>
                <p class="setting-desc">Play synthesized chime/alarm tones through browser Web Audio API</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="setSoundEnabled" ${settings.soundEnabled ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-input-row mt-3">
              <label for="setVolume">Alarm Volume: <span id="volLabel">${Math.round((settings.volume || 0.8) * 100)}%</span></label>
              <input type="range" id="setVolume" min="0.1" max="1.0" step="0.05" value="${settings.volume || 0.8}" class="range-slider" />
            </div>

            <div class="setting-input-row mt-3">
              <label for="setSnooze">Default Snooze Duration</label>
              <select id="setSnooze" class="form-control">
                <option value="5" ${settings.snoozeDurationMin === 5 ? 'selected' : ''}>5 Minutes</option>
                <option value="10" ${settings.snoozeDurationMin === 10 ? 'selected' : ''}>10 Minutes</option>
                <option value="15" ${settings.snoozeDurationMin === 15 ? 'selected' : ''}>15 Minutes</option>
              </select>
            </div>

            <div class="mt-4">
              <button class="btn btn-secondary btn-block" id="btnTestAlarmSound">
                <span>🔔 TEST ALARM NOW (Plays Sound & Shows Alert)</span>
              </button>
            </div>
          </div>

          <!-- Data Backup & Reset -->
          <div class="settings-card glass-panel">
            <h3 class="section-title">💾 Data Backup & Session Controls</h3>

            <div class="data-actions-box">
              <p>Export your full project state (team, tasks, research, checklist) as a JSON backup file to ensure zero data loss.</p>
              <div class="btn-group-row">
                <button class="btn btn-secondary" id="btnExportDataJSON">
                  <span>📥 Export Project Data</span>
                </button>
                <button class="btn btn-secondary" id="btnImportDataTrigger">
                  <span>📤 Import Backup Data</span>
                </button>
                <input type="file" id="importFileInput" accept=".json" style="display: none;" />
              </div>
            </div>

            <hr class="divider" />

            <div class="session-danger-zone">
              <h4 class="text-danger">⚠️ Session Reset & Controls</h4>
              <p>Pause or restart the 24-hour hackathon timer.</p>
              <div class="btn-group-row mt-2">
                <button class="btn btn-warning" id="btnSettingsPause">
                  <span>⏸️ Pause / Resume</span>
                </button>
                <button class="btn btn-danger" id="btnSettingsEnd">
                  <span>🛑 End Hackathon</span>
                </button>
                <button class="btn btn-ghost text-danger" id="btnSettingsRestart">
                  <span>🔄 Restart Session</span>
                </button>
              </div>
            </div>
          </div>

          <!-- PWA & Android Background Limitation Guide -->
          <div class="settings-card glass-panel col-span-2">
            <h3 class="section-title">📱 Mobile PWA & Background Limitations Notice</h3>

            <div class="android-guide-box">
              <p><strong>Important Architecture & Platform Transparency:</strong></p>
              <ul>
                <li><strong>Browser Limitations:</strong> Modern mobile browsers (Chrome on Android, Safari on iOS) strictly suspend timers and audio loops when the browser tab is closed or deeply backgrounded by the OS battery saver.</li>
                <li><strong>Install as PWA:</strong> Adding this application to your home screen runs it in standalone mode and registers the service worker for superior reliability.</li>
                <li><strong>Native Android WorkManager Option:</strong> For 100% dependable wake-up alarms even when the phone screen is locked and app killed, wrap this codebase into a native Android container using <code>Capacitor</code> or <code>Android CLI</code> with native <code>AlarmManager</code> / <code>WorkManager</code>.</li>
              </ul>
              <div class="mt-3">
                <button class="btn btn-primary" id="btnPwaInstallAction">
                  <span>📲 Install App on This Device</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initSettingsEvents() {
    const state = window.AppState;
    const settings = state.settings;

    document.getElementById('setHourlyAlarms')?.addEventListener('change', (e) => {
      settings.hourlyAlarms = e.target.checked;
      window.Storage.saveState(state);
    });

    document.getElementById('setMilestoneAlerts')?.addEventListener('change', (e) => {
      settings.milestoneAlerts = e.target.checked;
      window.Storage.saveState(state);
    });

    document.getElementById('setDelayedAlerts')?.addEventListener('change', (e) => {
      settings.delayedAlerts = e.target.checked;
      window.Storage.saveState(state);
    });

    document.getElementById('setSoundEnabled')?.addEventListener('change', (e) => {
      settings.soundEnabled = e.target.checked;
      window.Storage.saveState(state);
    });

    const volSlider = document.getElementById('setVolume');
    const volLabel = document.getElementById('volLabel');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        settings.volume = val;
        if (volLabel) volLabel.textContent = `${Math.round(val * 100)}%`;
        window.Storage.saveState(state);
      });
    }

    document.getElementById('setSnooze')?.addEventListener('change', (e) => {
      settings.snoozeDurationMin = parseInt(e.target.value, 10);
      window.Storage.saveState(state);
    });

    // Test alarm
    document.getElementById('btnTestAlarmSound')?.addEventListener('click', () => {
      this.triggerTestAlarm();
    });

    // Export
    document.getElementById('btnExportDataJSON')?.addEventListener('click', () => {
      window.Storage.exportJSON(state);
    });

    // Import
    const fileInput = document.getElementById('importFileInput');
    document.getElementById('btnImportDataTrigger')?.addEventListener('click', () => {
      fileInput?.click();
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const res = window.Storage.importJSON(evt.target.result);
          if (res.success) {
            window.AppState = res.state;
            alert('Project data successfully imported and restored!');
            this.render();
          } else {
            alert('Error importing data: ' + res.error);
          }
        };
        reader.readAsText(file);
      });
    }

    // Session controls
    document.getElementById('btnSettingsPause')?.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('btnSettingsEnd')?.addEventListener('click', () => {
      this.endHackathonSession();
    });

    document.getElementById('btnSettingsRestart')?.addEventListener('click', () => {
      this.restartSessionPrompt();
    });

    document.getElementById('btnPwaInstallAction')?.addEventListener('click', () => {
      this.promptPwaInstall();
    });
  }

  // --- CONTROLS: PAUSE, RESUME, END, RESTART ---
  togglePause() {
    const state = window.AppState;
    if (!state.session || !state.session.isActive) return;

    if (!state.session.isPaused) {
      // Pause
      state.session.isPaused = true;
      state.session.pausedAt = Date.now();
      window.Storage.saveState(state);
      alert('⏸️ Hackathon PAUSED. Countdown and reminders are frozen.');
    } else {
      // Resume
      const pauseDuration = Date.now() - (state.session.pausedAt || Date.now());
      state.session.totalPausedMs = (state.session.totalPausedMs || 0) + pauseDuration;
      state.session.isPaused = false;
      state.session.pausedAt = null;
      window.Storage.saveState(state);
      alert('▶️ Hackathon RESUMED. Resuming countdown.');
    }

    this.render();
  }

  endHackathonSession() {
    if (confirm('Are you sure you want to end this hackathon session? The final timestamp will be marked.')) {
      const state = window.AppState;
      state.session.endedAt = Date.now();
      window.Storage.saveState(state);
      alert('🏆 Hackathon concluded! You can view and download your Final Report.');
      this.switchTab('report');
    }
  }

  restartSessionPrompt() {
    if (confirm('⚠️ WARNING: This will completely reset the current hackathon session, timer, and check-in! (Tasks, team, and notes will be re-initialized). Are you sure?')) {
      window.AppState = window.Storage.resetSession();
      this.render();
    }
  }

  triggerTestAlarm() {
    const state = window.AppState;
    window.NotificationManager.showInAppAlert({
      id: 'test_alarm_' + Date.now(),
      type: 'test',
      title: '🔔 Test Alarm Triggered!',
      message: 'Web Audio API synthesized chime played successfully and notifications are functional. This modal tests your volume and dismiss/snooze controls.',
      nextActivity: 'Continue your active hackathon sprint.',
      settings: state.settings,
      onDismiss: () => console.log('Test alarm dismissed'),
      onSnooze: (id, mins) => alert(`Test alarm snoozed for ${mins} minutes.`)
    });
  }

  // --- MODALS ENGINE ---
  openModal(title, bodyHTML, onConfirm, confirmText = 'Save') {
    const modalEl = document.getElementById('appModal');
    const titleEl = document.getElementById('appModalTitle');
    const bodyEl = document.getElementById('appModalBody');
    const footerEl = document.getElementById('appModalFooter');

    if (!modalEl || !titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    footerEl.innerHTML = `
      <button class="btn btn-secondary" id="btnModalCancel">Cancel</button>
      <button class="btn btn-primary" id="btnModalConfirm">${confirmText}</button>
    `;

    modalEl.classList.add('visible');

    document.getElementById('btnModalCancel')?.addEventListener('click', () => this.closeModal());
    document.getElementById('btnModalConfirm')?.addEventListener('click', () => {
      if (typeof onConfirm === 'function') {
        const success = onConfirm();
        if (success !== false) {
          this.closeModal();
        }
      } else {
        this.closeModal();
      }
    });

    const closeBtn = document.getElementById('btnModalClose');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeModal();
    }
  }

  closeModal() {
    const modalEl = document.getElementById('appModal');
    if (modalEl) {
      modalEl.classList.remove('visible');
    }
  }

  // Modal: Add / Edit Task
  openTaskModal(task = null) {
    const members = window.TeamManager.getTeamMembers();
    const categories = window.TaskManager.getCategories();
    const isEdit = !!task;

    const html = `
      <form id="taskForm">
        <div class="form-group">
          <label>Task Title <span class="req">*</span></label>
          <input type="text" id="mTaskTitle" class="form-control" value="${task ? escapeHTML(task.title) : ''}" placeholder="e.g., Integrate Auth0 / JWT authentication" required />
        </div>

        <div class="form-group">
          <label>Detailed Description</label>
          <textarea id="mTaskDesc" class="form-control" rows="2" placeholder="Implementation details, endpoints, constraints...">${task ? escapeHTML(task.description || '') : ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group col-half">
            <label>Category</label>
            <select id="mTaskCategory" class="form-control">
              ${categories.map((c) => `<option value="${c}" ${task && task.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <div class="form-group col-half">
            <label>Assign to Team Member</label>
            <select id="mTaskMember" class="form-control">
              <option value="">Unassigned</option>
              ${members.map((m) => `<option value="${m.id}" ${task && task.assignedMemberId === m.id ? 'selected' : ''}>${escapeHTML(m.name)} (${escapeHTML(m.role)})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col-half">
            <label>Deadline (Hackathon Hour 1-24)</label>
            <input type="number" id="mTaskDeadline" class="form-control" min="1" max="48" value="${task ? task.deadlineHour : 12}" />
          </div>

          <div class="form-group col-half">
            <label>Priority</label>
            <select id="mTaskPriority" class="form-control">
              <option value="High" ${task && task.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Medium" ${!task || task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Low" ${task && task.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Status</label>
          <select id="mTaskStatus" class="form-control">
            <option value="Not Started" ${task && task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
            <option value="In Progress" ${!task || task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${task && task.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Delayed" ${task && task.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
          </select>
        </div>

        <div class="form-group">
          <label>Notes / Blockers</label>
          <input type="text" id="mTaskNotes" class="form-control" value="${task ? escapeHTML(task.notes || '') : ''}" placeholder="Dependencies, hardware pins, PR links..." />
        </div>
      </form>
    `;

    this.openModal(
      isEdit ? 'Edit Task' : 'Add New Task',
      html,
      () => {
        const title = document.getElementById('mTaskTitle')?.value.trim();
        if (!title) {
          alert('Task title is required');
          return false;
        }

        const taskData = {
          title,
          description: document.getElementById('mTaskDesc')?.value.trim(),
          category: document.getElementById('mTaskCategory')?.value,
          assignedMemberId: document.getElementById('mTaskMember')?.value,
          deadlineHour: parseInt(document.getElementById('mTaskDeadline')?.value, 10) || 24,
          priority: document.getElementById('mTaskPriority')?.value,
          status: document.getElementById('mTaskStatus')?.value,
          notes: document.getElementById('mTaskNotes')?.value.trim()
        };

        if (isEdit) {
          window.TaskManager.updateTask(task.id, taskData);
        } else {
          window.TaskManager.addTask(taskData);
        }

        this.renderCurrentView();
        return true;
      },
      isEdit ? 'Update Task' : 'Create Task'
    );
  }

  // Modal: Add / Edit Team Member
  openMemberModal(member = null) {
    const roles = window.TeamManager.getRoles();
    const isEdit = !!member;

    const html = `
      <form id="memberForm">
        <div class="form-group">
          <label>Full Name <span class="req">*</span></label>
          <input type="text" id="mMemberName" class="form-control" value="${member ? escapeHTML(member.name) : ''}" placeholder="e.g., Alex Chen" required />
        </div>

        <div class="form-group">
          <label>Predefined Role</label>
          <select id="mMemberRoleSelect" class="form-control">
            ${roles.map((r) => `<option value="${r}" ${member && member.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            <option value="CUSTOM" ${member && !roles.includes(member.role) ? 'selected' : ''}>Other / Custom Role...</option>
          </select>
        </div>

        <div class="form-group" id="mCustomRoleGroup" style="display: ${member && !roles.includes(member.role) ? 'block' : 'none'};">
          <label>Custom Role Title</label>
          <input type="text" id="mCustomRole" class="form-control" value="${member && !roles.includes(member.role) ? escapeHTML(member.role) : ''}" placeholder="e.g., Embedded Firmware Specialist" />
        </div>

        <div class="form-group">
          <label>Skills & Specializations (comma separated)</label>
          <input type="text" id="mMemberSkills" class="form-control" value="${member ? escapeHTML(member.skills || '') : ''}" placeholder="e.g., Python, PyTorch, ROS2, OpenCV" />
        </div>

        <div class="form-group">
          <label>Contact Details (optional)</label>
          <input type="text" id="mMemberContact" class="form-control" value="${member ? escapeHTML(member.contact || '') : ''}" placeholder="Discord tag, Phone, Slack handle..." />
        </div>

        <div class="form-group">
          <label>Notes</label>
          <input type="text" id="mMemberNotes" class="form-control" value="${member ? escapeHTML(member.notes || '') : ''}" placeholder="Assigned sub-modules, hardware kit custody..." />
        </div>
      </form>
    `;

    this.openModal(
      isEdit ? 'Edit Team Member' : 'Add Team Member',
      html,
      () => {
        const name = document.getElementById('mMemberName')?.value.trim();
        if (!name) {
          alert('Member name is required');
          return false;
        }

        const roleSelect = document.getElementById('mMemberRoleSelect')?.value;
        const customRole = document.getElementById('mCustomRole')?.value.trim();
        const role = roleSelect === 'CUSTOM' ? (customRole || 'Engineer') : roleSelect;

        const memberData = {
          name,
          role,
          skills: document.getElementById('mMemberSkills')?.value.trim(),
          contact: document.getElementById('mMemberContact')?.value.trim(),
          notes: document.getElementById('mMemberNotes')?.value.trim()
        };

        if (isEdit) {
          window.TeamManager.updateMember(member.id, memberData);
        } else {
          window.TeamManager.addMember(memberData);
        }

        this.renderCurrentView();
        return true;
      },
      isEdit ? 'Update Member' : 'Add Member'
    );

    // Watch role select
    document.getElementById('mMemberRoleSelect')?.addEventListener('change', (e) => {
      const customGroup = document.getElementById('mCustomRoleGroup');
      if (customGroup) {
        customGroup.style.display = e.target.value === 'CUSTOM' ? 'block' : 'none';
      }
    });
  }

  // Modal: Assign Task to Member
  openAssignTaskModal(memberId) {
    const member = window.TeamManager.getMemberById(memberId);
    const unassignedTasks = window.AppState.tasks.filter((t) => t.assignedMemberId !== memberId);

    const html = `
      <p>Select a task to assign to <strong>${escapeHTML(member ? member.name : 'member')}</strong>:</p>
      ${unassignedTasks.length === 0 ? `
        <p class="empty-hint">All existing tasks are already assigned to this member or no other tasks exist.</p>
      ` : `
        <div class="form-group">
          <label>Available Tasks</label>
          <select id="mSelectTaskToAssign" class="form-control">
            ${unassignedTasks.map((t) => `<option value="${t.id}">${escapeHTML(t.title)} (${t.category} - H${t.deadlineHour})</option>`).join('')}
          </select>
        </div>
      `}
    `;

    this.openModal(
      `Assign Task to ${member ? member.name : 'Member'}`,
      html,
      () => {
        const taskId = document.getElementById('mSelectTaskToAssign')?.value;
        if (taskId) {
          window.TeamManager.assignTask(taskId, memberId);
          this.renderCurrentView();
        }
        return true;
      },
      'Assign Task'
    );
  }

  // Modal: Reassign Task
  openReassignModal(taskId) {
    const task = window.AppState.tasks.find((t) => t.id === taskId);
    const members = window.TeamManager.getTeamMembers();

    const html = `
      <p>Reassign task: <strong>${escapeHTML(task ? task.title : 'Task')}</strong></p>
      <div class="form-group">
        <label>Select Team Member</label>
        <select id="mSelectNewMember" class="form-control">
          <option value="">Unassign (No member)</option>
          ${members.map((m) => `<option value="${m.id}" ${task && task.assignedMemberId === m.id ? 'selected' : ''}>${escapeHTML(m.name)} (${escapeHTML(m.role)})</option>`).join('')}
        </select>
      </div>
    `;

    this.openModal(
      'Reassign Task',
      html,
      () => {
        const newMemberId = document.getElementById('mSelectNewMember')?.value;
        window.TeamManager.assignTask(taskId, newMemberId);
        this.renderCurrentView();
        return true;
      },
      'Confirm Reassignment'
    );
  }

  // Modal: Schedule Phase
  openScheduleModal(scheduleItem = null) {
    const isEdit = !!scheduleItem;
    const categories = window.TaskManager.getCategories();

    const html = `
      <form id="scheduleForm">
        <div class="form-group">
          <label>Phase Title <span class="req">*</span></label>
          <input type="text" id="mSchTitle" class="form-control" value="${scheduleItem ? escapeHTML(scheduleItem.title) : ''}" placeholder="e.g., Frontend State Management Integration" required />
        </div>

        <div class="form-group">
          <label>Goals & Deliverables</label>
          <textarea id="mSchDesc" class="form-control" rows="2" placeholder="Specific technical achievements planned for this window...">${scheduleItem ? escapeHTML(scheduleItem.description) : ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group col-half">
            <label>Start Hour (0-48)</label>
            <input type="number" id="mSchStart" class="form-control" min="0" max="48" value="${scheduleItem ? scheduleItem.startHour : 0}" />
          </div>

          <div class="form-group col-half">
            <label>End Hour (1-48)</label>
            <input type="number" id="mSchEnd" class="form-control" min="1" max="48" value="${scheduleItem ? scheduleItem.endHour : 2}" />
          </div>
        </div>

        <div class="form-group">
          <label>Domain Category</label>
          <select id="mSchCategory" class="form-control">
            ${categories.map((c) => `<option value="${c}" ${scheduleItem && scheduleItem.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </form>
    `;

    this.openModal(
      isEdit ? 'Edit Schedule Phase' : 'Add Custom Phase',
      html,
      () => {
        const title = document.getElementById('mSchTitle')?.value.trim();
        const startHour = parseInt(document.getElementById('mSchStart')?.value, 10);
        const endHour = parseInt(document.getElementById('mSchEnd')?.value, 10);

        if (!title || isNaN(startHour) || isNaN(endHour) || startHour >= endHour) {
          alert('Please enter a valid title and time range (Start hour must be less than End hour).');
          return false;
        }

        const data = {
          title,
          description: document.getElementById('mSchDesc')?.value.trim(),
          startHour,
          endHour,
          category: document.getElementById('mSchCategory')?.value
        };

        if (isEdit) {
          const idx = window.AppState.schedule.findIndex((s) => s.id === scheduleItem.id);
          if (idx !== -1) {
            window.AppState.schedule[idx] = { ...window.AppState.schedule[idx], ...data };
          }
        } else {
          window.AppState.schedule.push({
            id: 'sch_' + Date.now(),
            ...data,
            completed: false
          });
        }

        // Sort schedule by startHour
        window.AppState.schedule.sort((a, b) => a.startHour - b.startHour);
        window.Storage.saveState(window.AppState);
        this.renderCurrentView();
        return true;
      },
      isEdit ? 'Update Phase' : 'Save Phase'
    );
  }

  // Modal: Record Judge Q&A
  openJudgeQAModal() {
    const html = `
      <form id="judgeQAForm">
        <div class="form-group">
          <label>Judge Name / Panelist Title</label>
          <input type="text" id="mJudgeName" class="form-control" placeholder="e.g., Dr. Smith / Tech Lead Judge" />
        </div>

        <div class="form-group">
          <label>Question Asked <span class="req">*</span></label>
          <textarea id="mJudgeQuestion" class="form-control" rows="2" placeholder="e.g., How does your system handle offline data synchronization in high packet loss scenarios?" required></textarea>
        </div>

        <div class="form-group">
          <label>Team's Answer Given <span class="req">*</span></label>
          <textarea id="mJudgeAnswer" class="form-control" rows="3" placeholder="e.g., We implemented IndexedDB with local transaction journaling and CRDT conflict resolution..." required></textarea>
        </div>

        <div class="form-group">
          <label>Feedback & Judge Reaction</label>
          <input type="text" id="mJudgeNotes" class="form-control" placeholder="e.g., Judge appreciated the fallback mechanism; suggested checking edge case X" />
        </div>
      </form>
    `;

    this.openModal(
      'Record Judge Q&A',
      html,
      () => {
        const question = document.getElementById('mJudgeQuestion')?.value.trim();
        const answer = document.getElementById('mJudgeAnswer')?.value.trim();
        if (!question || !answer) {
          alert('Both question and answer are required.');
          return false;
        }

        const state = window.AppState;
        if (!state.presentation.judgeQA) state.presentation.judgeQA = [];

        state.presentation.judgeQA.push({
          id: 'qa_' + Date.now(),
          judgeName: document.getElementById('mJudgeName')?.value.trim() || 'Judge',
          question,
          answer,
          notes: document.getElementById('mJudgeNotes')?.value.trim()
        });

        window.Storage.saveState(state);
        this.renderCurrentView();
        return true;
      },
      'Save Q&A'
    );
  }
}

window.App = new ApplicationController();

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
