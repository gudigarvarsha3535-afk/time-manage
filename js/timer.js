/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: timer.js
 * High-precision elapsed-time engine, schedule synchronizer, and alert trigger loop
 */

class HackathonTimer {
  constructor() {
    this.timerInterval = null;
    this.callbacks = {
      onTick: null,
      onHourTransition: null,
      onAlertTriggered: null,
      onStatusChange: null
    };
  }

  init(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.startLoop();
  }

  startLoop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    // Run immediately then tick every 1000ms
    this.tick();
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  stopLoop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Calculate high-precision time data based on real timestamps
  getTimeData(state) {
    const session = state.session;
    if (!session || !session.isActive || !session.checkInTime) {
      return {
        isActive: false,
        isPaused: false,
        elapsedMs: 0,
        remainingMs: (session?.durationHours || 24) * 3600 * 1000,
        totalDurationMs: (session?.durationHours || 24) * 3600 * 1000,
        currentHour: 0,
        hourProgressPercent: 0,
        overallTimePercent: 0,
        formattedRemaining: this.formatTime((session?.durationHours || 24) * 3600 * 1000),
        formattedElapsed: '00:00:00',
        checkInTimeFormatted: '--:--',
        submissionTimeFormatted: '--:--'
      };
    }

    const now = Date.now();
    let totalPaused = session.totalPausedMs || 0;
    let currentPauseDuration = 0;

    if (session.isPaused && session.pausedAt) {
      currentPauseDuration = now - session.pausedAt;
    }

    const effectiveElapsedMs = Math.max(0, now - session.checkInTime - totalPaused - currentPauseDuration);
    const totalDurationMs = (session.durationHours || 24) * 3600 * 1000;
    const remainingMs = Math.max(0, totalDurationMs - effectiveElapsedMs);

    // Current hackathon hour (1 to durationHours)
    // 0 to 59m 59s -> Hour 1
    const currentHourIndex = Math.min(
      Math.floor(effectiveElapsedMs / (3600 * 1000)),
      session.durationHours - 1
    );
    const currentHour = currentHourIndex + 1;

    // Progress within current hour
    const msIntoCurrentHour = effectiveElapsedMs % (3600 * 1000);
    const hourProgressPercent = Math.min(100, Math.round((msIntoCurrentHour / (3600 * 1000)) * 100));

    // Overall elapsed time percentage
    const overallTimePercent = Math.min(100, (effectiveElapsedMs / totalDurationMs) * 100);

    // Submission timestamp
    const expectedSubmissionTimestamp = session.checkInTime + totalDurationMs + totalPaused + currentPauseDuration;

    return {
      isActive: true,
      isPaused: session.isPaused,
      isEnded: !!session.endedAt || remainingMs === 0,
      elapsedMs: effectiveElapsedMs,
      remainingMs,
      totalDurationMs,
      currentHour,
      currentHourIndex,
      hourProgressPercent,
      overallTimePercent,
      formattedRemaining: this.formatTime(remainingMs),
      formattedElapsed: this.formatTime(effectiveElapsedMs),
      checkInTimeFormatted: this.formatDateTime(session.checkInTime),
      submissionTimeFormatted: this.formatDateTime(expectedSubmissionTimestamp)
    };
  }

  tick() {
    const state = window.AppState;
    if (!state) return;

    const timeData = this.getTimeData(state);

    if (this.callbacks.onTick) {
      this.callbacks.onTick(timeData);
    }

    // If session is not active or is paused, do not trigger new alarms
    if (!timeData.isActive || timeData.isPaused || timeData.isEnded) {
      return;
    }

    // Check alerts and milestone conditions
    this.checkAlerts(state, timeData);
  }

  checkAlerts(state, timeData) {
    const { elapsedMs, remainingMs, currentHour } = timeData;
    const session = state.session;
    const settings = state.settings || {};
    const triggered = state.triggeredAlerts || [];
    const now = Date.now();

    // 1. Process Snoozed Alerts
    if (state.snoozedAlerts && state.snoozedAlerts.length > 0) {
      const remainingSnoozes = [];
      state.snoozedAlerts.forEach((item) => {
        if (now >= item.fireAt) {
          window.NotificationManager.showInAppAlert({
            ...item.alertData,
            onDismiss: (id) => this.dismissAlert(id),
            onSnooze: (id, mins) => this.snoozeAlert(item.alertData, mins),
            settings
          });
        } else {
          remainingSnoozes.push(item);
        }
      });
      state.snoozedAlerts = remainingSnoozes;
      window.Storage.saveState(state);
    }

    // 2. Hourly Transitions: Every hour mark (Hour 1 complete, Hour 2 complete, etc.)
    if (settings.hourlyAlarms) {
      const completedHours = Math.floor(elapsedMs / (3600 * 1000));
      if (completedHours >= 1 && completedHours < session.durationHours) {
        const alertId = `hourly_transition_${completedHours}`;
        if (!triggered.includes(alertId)) {
          triggered.push(alertId);
          state.triggeredAlerts = triggered;
          window.Storage.saveState(state);

          const nextScheduleItem = this.getScheduleForHour(state, completedHours);
          const nextTitle = nextScheduleItem ? nextScheduleItem.title : 'Continue development sprint';

          // Count completed tasks
          const completedCount = state.tasks.filter((t) => t.status === 'Completed').length;
          const totalCount = state.tasks.length;

          const alertData = {
            id: alertId,
            type: 'hourly',
            hourNumber: completedHours,
            title: `⏰ HACKATHON HOUR ${completedHours} COMPLETE!`,
            message: `You have completed ${completedHours} hours of your ${session.durationHours}-hour hackathon. Current tasks done: ${completedCount}/${totalCount}. Review your team's velocity and update your task checklist.`,
            nextActivity: nextTitle
          };

          window.NotificationManager.showInAppAlert({
            ...alertData,
            onDismiss: (id) => this.dismissAlert(id),
            onSnooze: (id, mins) => this.snoozeAlert(alertData, mins),
            settings
          });
        }
      }
    }

    // 3. 15-Minute Milestone Warning (e.g. 45 min into each hour)
    if (settings.milestoneAlerts) {
      const minutesIntoHour = Math.floor((elapsedMs % (3600 * 1000)) / (60 * 1000));
      if (minutesIntoHour >= 45 && minutesIntoHour < 50) {
        const alertId = `milestone_15m_hour_${currentHour}`;
        if (!triggered.includes(alertId)) {
          triggered.push(alertId);
          state.triggeredAlerts = triggered;
          window.Storage.saveState(state);

          const alertData = {
            id: alertId,
            type: 'milestone',
            title: `⏳ 15-Minute Milestone Warning (Hour ${currentHour})`,
            message: `Only 15 minutes left in Hackathon Hour ${currentHour}. Wrap up ongoing commits, document current blocker status, and prepare for the next phase.`,
            nextActivity: `Hour ${currentHour + 1} begins shortly.`
          };

          window.NotificationManager.showInAppAlert({
            ...alertData,
            onDismiss: (id) => this.dismissAlert(id),
            onSnooze: (id, mins) => this.snoozeAlert(alertData, mins),
            settings
          });
        }
      }
    }

    // 4. Final 2-Hour Warning (remaining <= 2h)
    if (settings.milestoneAlerts && remainingMs <= 2 * 3600 * 1000 && remainingMs > 1.9 * 3600 * 1000) {
      const alertId = 'final_2h_warning';
      if (!triggered.includes(alertId)) {
        triggered.push(alertId);
        state.triggeredAlerts = triggered;
        window.Storage.saveState(state);

        const alertData = {
          id: alertId,
          type: 'deadline',
          title: '🚨 FINAL 2 HOURS REMAINING!',
          message: 'CODE FREEZE ALERT! Stop adding new features now. Focus 100% on recording your demo video, finalizing your presentation deck, and preparing the submission repository.',
          nextActivity: 'Documentation & Presentation sprint.'
        };

        window.NotificationManager.showInAppAlert({
          ...alertData,
          onDismiss: (id) => this.dismissAlert(id),
          onSnooze: (id, mins) => this.snoozeAlert(alertData, mins),
          settings
        });
      }
    }

    // 5. Final 1-Hour Warning (remaining <= 1h)
    if (settings.milestoneAlerts && remainingMs <= 1 * 3600 * 1000 && remainingMs > 0.9 * 3600 * 1000) {
      const alertId = 'final_1h_warning';
      if (!triggered.includes(alertId)) {
        triggered.push(alertId);
        state.triggeredAlerts = triggered;
        window.Storage.saveState(state);

        const alertData = {
          id: alertId,
          type: 'deadline',
          title: '🚨 FINAL 1 HOUR REMAINING: SUBMIT NOW!',
          message: 'CRITICAL WARNING: Hackathon platform servers often experience heavy traffic in the final 30 minutes. Submit your project immediately. Do not risk disqualification!',
          nextActivity: 'Upload demo link and submit form.'
        };

        window.NotificationManager.showInAppAlert({
          ...alertData,
          onDismiss: (id) => this.dismissAlert(id),
          onSnooze: (id, mins) => this.snoozeAlert(alertData, mins),
          settings
        });
      }
    }

    // 6. 24-Hour Completion Notification
    if (remainingMs === 0) {
      const alertId = 'completion_24h_finish';
      if (!triggered.includes(alertId)) {
        triggered.push(alertId);
        state.session.endedAt = Date.now();
        state.triggeredAlerts = triggered;
        window.Storage.saveState(state);

        const alertData = {
          id: alertId,
          type: 'completion',
          title: '🏆 24-HOUR HACKATHON TIME IS UP!',
          message: 'Congratulations! You have completed the 24-hour hackathon journey! Check your submission receipt, review judge presentation prep, and generate your final project report.',
          nextActivity: 'Prepare for Judge Q&A and Team Pitch.'
        };

        window.NotificationManager.showInAppAlert({
          ...alertData,
          onDismiss: (id) => this.dismissAlert(id),
          onSnooze: () => {},
          settings
        });
      }
    }

    // 7. Delayed-Task Identification
    if (settings.delayedAlerts) {
      let changed = false;
      state.tasks.forEach((task) => {
        if (task.deadlineHour && currentHour > task.deadlineHour && task.status !== 'Completed') {
          if (!task.delayed) {
            task.delayed = true;
            if (task.status === 'Not Started' || task.status === 'In Progress') {
              task.status = 'Delayed';
            }
            changed = true;

            const alertId = `task_overdue_${task.id}`;
            if (!triggered.includes(alertId)) {
              triggered.push(alertId);
              state.triggeredAlerts = triggered;

              const alertData = {
                id: alertId,
                type: 'delayed',
                title: '⚠️ Task Overdue: Deadline Missed',
                message: `Task "${task.title}" was scheduled for completion by Hour ${task.deadlineHour}, but is currently delayed.`,
                nextActivity: 'Reassign or reduce scope in Team Manager.'
              };

              window.NotificationManager.showInAppAlert({
                ...alertData,
                onDismiss: (id) => this.dismissAlert(id),
                onSnooze: (id, mins) => this.snoozeAlert(alertData, mins),
                settings
              });
            }
          }
        }
      });
      if (changed) {
        window.Storage.saveState(state);
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange();
        }
      }
    }
  }

  getScheduleForHour(state, hour) {
    if (!state.schedule) return null;
    return state.schedule.find((s) => hour >= s.startHour && hour < s.endHour) || null;
  }

  dismissAlert(id) {
    // Alert dismissed
  }

  snoozeAlert(alertData, minutes) {
    const state = window.AppState;
    if (!state) return;
    const fireAt = Date.now() + minutes * 60 * 1000;
    if (!state.snoozedAlerts) state.snoozedAlerts = [];
    state.snoozedAlerts.push({
      id: `${alertData.id}_snoozed_${Date.now()}`,
      alertData,
      fireAt
    });
    window.Storage.saveState(state);
  }

  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  formatDateTime(timestamp) {
    if (!timestamp) return '--:--';
    const d = new Date(timestamp);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${hours}:${mins} (${day})`;
  }
}

window.HackathonTimer = new HackathonTimer();
