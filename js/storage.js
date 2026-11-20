/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: storage.js
 * Centralized data management and localStorage persistence
 */

const STORAGE_KEY = 'hackathon_24h_control_system_v1';

const DEFAULT_SCHEDULE = [
  { id: 'sch_1', startHour: 0, endHour: 1, title: 'Understand the Problem Statement', description: 'Deconstruct requirements, identify core challenges, constraints, and evaluation metrics.', category: 'Research', completed: false },
  { id: 'sch_2', startHour: 1, endHour: 2, title: 'Brainstorming & Idea Selection', description: 'Generate concepts, evaluate feasibility vs impact, and select the winning solution.', category: 'Planning', completed: false },
  { id: 'sch_3', startHour: 2, endHour: 3, title: 'Research & Project Planning', description: 'Finalize technical architecture, assign team roles, list APIs/hardware, and set milestones.', category: 'Research', completed: false },
  { id: 'sch_4', startHour: 3, endHour: 8, title: 'First Development Phase', description: 'Core functional prototype, database schemas, hardware circuits, and basic UI wireframe.', category: 'Software', completed: false },
  { id: 'sch_5', startHour: 8, endHour: 9, title: 'Progress Checkpoint', description: 'Team alignment meeting: test basic integration, evaluate remaining work, and adjust plan.', category: 'Testing', completed: false },
  { id: 'sch_6', startHour: 9, endHour: 13, title: 'Second Development Phase', description: 'Connect backend, frontend, algorithms/hardware, error handling, and core feature polish.', category: 'Software', completed: false },
  { id: 'sch_7', startHour: 13, endHour: 14, title: 'Meal & Rest Break', description: 'Recharge, hydrate, take a quick break to refresh mental focus before the final stretch.', category: 'Planning', completed: false },
  { id: 'sch_8', startHour: 14, endHour: 16, title: 'Testing & Debugging', description: 'End-to-end integration tests, find edge case bugs, stress test system with real data.', category: 'Testing', completed: false },
  { id: 'sch_9', startHour: 16, endHour: 17, title: 'Corrections & Improvements', description: 'Fix critical bugs, refine UI/UX interactions, and stabilize demo pipeline.', category: 'Software', completed: false },
  { id: 'sch_10', startHour: 17, endHour: 18, title: 'Rest Break', description: 'Power nap, light exercise, coffee, and prepare for presentation sprint.', category: 'Planning', completed: false },
  { id: 'sch_11', startHour: 18, endHour: 20, title: 'Documentation & PPT Preparation', description: 'Build pitch deck, architecture diagrams, record backup demo video, write README.', category: 'Documentation', completed: false },
  { id: 'sch_12', startHour: 20, endHour: 21, title: 'Final Testing & Rehearsal', description: 'Dry run presentation, rehearse demo workflow on presentation device, check network.', category: 'Presentation', completed: false },
  { id: 'sch_13', startHour: 21, endHour: 22, title: 'Submission Preparation', description: 'Push final code to GitHub/Devpost, upload video demo, fill submission forms carefully.', category: 'Submission', completed: false },
  { id: 'sch_14', startHour: 22, endHour: 24, title: 'Final Buffer & Presentation Prep', description: 'Double check submission confirmations, prepare for judge Q&A, and rest before pitch.', category: 'Presentation', completed: false }
];

const DEFAULT_PRESENTATION_CHECKLIST = [
  { id: 'pres_1', text: 'Problem statement prepared and clearly articulated', done: false },
  { id: 'pres_2', text: 'Proposed solution explained with value proposition', done: false },
  { id: 'pres_3', text: 'Innovation and uniqueness highlighted against competitors', done: false },
  { id: 'pres_4', text: 'Working prototype thoroughly tested and ready', done: false },
  { id: 'pres_5', text: 'PPT slide deck completed (maximum 7-10 punchy slides)', done: false },
  { id: 'pres_6', text: 'Project documentation completed (README, setup guide, architecture)', done: false },
  { id: 'pres_7', text: 'Demonstration scripted, rehearsed, and backup video recorded', done: false },
  { id: 'pres_8', text: 'Team speaking roles and transition cues assigned', done: false },
  { id: 'pres_9', text: 'Judges\' questions anticipated with crisp answers prepared', done: false },
  { id: 'pres_10', text: 'Submission files, repo link, and platform credentials verified', done: false }
];

const DEFAULT_TASKS = [
  {
    id: 'task_init_1',
    title: 'Analyze problem statement & identify core constraints',
    description: 'Extract must-haves, nice-to-haves, judging criteria, and eliminate ambiguities.',
    category: 'Research',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 1,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c1', text: 'Read problem statement line by line', done: false },
      { id: 'c2', text: 'Note down target users and environment', done: false },
      { id: 'c3', text: 'Formulate primary problem hypothesis', done: false }
    ],
    notes: 'Focus on feasibility within 24 hours.',
    delayed: false
  },
  {
    id: 'task_init_2',
    title: 'Conduct 5-Whys root cause analysis',
    description: 'Drill down to find fundamental issue before jumping into coding.',
    category: 'Research',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 2,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c4', text: 'Complete 5-Whys tool in Research tab', done: false },
      { id: 'c5', text: 'Document key findings', done: false }
    ],
    notes: 'Use the interactive 5-Whys module.',
    delayed: false
  },
  {
    id: 'task_init_3',
    title: 'Setup repository, dev environment & project board',
    description: 'Create GitHub repository, branches, README template, and share credentials.',
    category: 'Planning',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 2,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c6', text: 'Create GitHub repo & invite members', done: false },
      { id: 'c7', text: 'Setup boilerplate & install packages', done: false },
      { id: 'c8', text: 'Verify build on all dev machines', done: false }
    ],
    notes: 'Avoid spending more than 30 mins on tooling setup.',
    delayed: false
  },
  {
    id: 'task_init_4',
    title: 'Design UI wireframes & user journey',
    description: 'Sketch key screens: landing, main action view, results dashboard.',
    category: 'Software',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 3,
    priority: 'Medium',
    status: 'Not Started',
    checklist: [
      { id: 'c9', text: 'Define 3 primary user steps', done: false },
      { id: 'c10', text: 'Design clean responsive layout wireframe', done: false }
    ],
    notes: 'Keep UI intuitive and high-contrast.',
    delayed: false
  },
  {
    id: 'task_init_5',
    title: 'Implement core functionality & backend logic',
    description: 'Build working MVP feature that demonstrates actual value.',
    category: 'Software',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 8,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c11', text: 'Build API endpoints / algorithmic logic', done: false },
      { id: 'c12', text: 'Connect frontend to data source', done: false },
      { id: 'c13', text: 'Display live calculated output', done: false }
    ],
    notes: 'Prioritize end-to-end flow over perfection.',
    delayed: false
  },
  {
    id: 'task_init_6',
    title: 'Sensor / Hardware integration (if applicable)',
    description: 'Wire components, flash firmware, verify serial data output.',
    category: 'Hardware',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 7,
    priority: 'Medium',
    status: 'Not Started',
    checklist: [
      { id: 'c14', text: 'Verify power supply and pinouts', done: false },
      { id: 'c15', text: 'Stream telemetry data via Serial/Bluetooth/WiFi', done: false }
    ],
    notes: 'If purely software hack, adapt to simulated data.',
    delayed: false
  },
  {
    id: 'task_init_7',
    title: 'Midway checkpoint & integration dry run',
    description: 'Test all modules working together, evaluate gaps, and prioritize remaining hours.',
    category: 'Testing',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 9,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c16', text: 'Run full user demo flow from start to finish', done: false },
      { id: 'c17', text: 'Cut non-essential features if running behind', done: false }
    ],
    notes: 'Crucial pivot point.',
    delayed: false
  },
  {
    id: 'task_init_8',
    title: 'Prepare presentation deck & pitch narrative',
    description: 'Hook, problem, solution, demo, tech stack, business model, future roadmap.',
    category: 'Documentation',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 20,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c18', text: 'Draft 8 key slides', done: false },
      { id: 'c19', text: 'Add high-res screenshots and architecture diagram', done: false },
      { id: 'c20', text: 'Time pitch to under 3-4 minutes', done: false }
    ],
    notes: 'Judges vote on clarity and impact.',
    delayed: false
  },
  {
    id: 'task_init_9',
    title: 'Record backup demonstration video',
    description: '30-60 second screencast demonstrating flawless operation in case live WiFi fails.',
    category: 'Presentation',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 21,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c21', text: 'Record screen with OBS / Windows Game Bar', done: false },
      { id: 'c22', text: 'Upload to YouTube unlisted or Drive', done: false }
    ],
    notes: 'Never rely solely on venue WiFi for demo.',
    delayed: false
  },
  {
    id: 'task_init_10',
    title: 'Final project submission',
    description: 'Submit repo link, description, video, and verify confirmation message.',
    category: 'Submission',
    assignedMemberId: '',
    startTime: '',
    deadlineHour: 22,
    priority: 'High',
    status: 'Not Started',
    checklist: [
      { id: 'c23', text: 'Double check repository is PUBLIC', done: false },
      { id: 'c24', text: 'Confirm submission receipt email/banner', done: false }
    ],
    notes: 'Submit 1-2 hours before hard deadline.',
    delayed: false
  }
];

const Storage = {
  getInitialState() {
    return {
      session: {
        isActive: false,
        checkInTime: null,
        durationHours: 24,
        projectName: '',
        teamName: '',
        teamSize: 4,
        isPaused: false,
        pausedAt: null,
        totalPausedMs: 0,
        endedAt: null
      },
      schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)),
      team: [],
      tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
      research: {
        problemStatement: '',
        backgroundResearch: '',
        targetUsers: '',
        rootCauseAnalysis: '',
        fiveWhys: ['', '', '', '', ''],
        fiveWhysRootCause: '',
        existingSolutions: '',
        existingSolutionLimitations: '',
        researchGap: '',
        proposedSolution: '',
        innovationAndUniqueness: '',
        technicalRequirements: '',
        estimatedCost: '',
        expectedImpact: '',
        applications: '',
        projectLimitations: '',
        referencesAndSources: '',
        lastSaved: null
      },
      presentation: {
        checklist: JSON.parse(JSON.stringify(DEFAULT_PRESENTATION_CHECKLIST)),
        judgeQA: []
      },
      settings: {
        hourlyAlarms: true,
        milestoneAlerts: true,
        deadlineAlerts: true,
        delayedAlerts: true,
        soundEnabled: true,
        volume: 0.8,
        snoozeDurationMin: 5
      },
      triggeredAlerts: [],
      snoozedAlerts: []
    };
  },

  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return this.getInitialState();
      }
      const parsed = JSON.parse(serialized);
      // Merge with initial state to guarantee all keys exist
      const initial = this.getInitialState();
      return {
        session: { ...initial.session, ...parsed.session },
        schedule: parsed.schedule && parsed.schedule.length > 0 ? parsed.schedule : initial.schedule,
        team: parsed.team || [],
        tasks: parsed.tasks || initial.tasks,
        research: { ...initial.research, ...parsed.research },
        presentation: {
          checklist: parsed.presentation && parsed.presentation.checklist ? parsed.presentation.checklist : initial.presentation.checklist,
          judgeQA: parsed.presentation && parsed.presentation.judgeQA ? parsed.presentation.judgeQA : []
        },
        settings: { ...initial.settings, ...parsed.settings },
        triggeredAlerts: parsed.triggeredAlerts || [],
        snoozedAlerts: parsed.snoozedAlerts || []
      };
    } catch (e) {
      console.error('[Storage] Error loading state from localStorage:', e);
      return this.getInitialState();
    }
  },

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[Storage] Error saving state to localStorage:', e);
    }
  },

  resetSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return this.getInitialState();
    } catch (e) {
      console.error('[Storage] Error resetting session:', e);
      return this.getInitialState();
    }
  },

  exportJSON(state) {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `hackathon_backup_${(state.session.projectName || 'project').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }
      // Ensure required core properties exist
      if (!parsed.session || !parsed.tasks || !parsed.schedule) {
        throw new Error('Incompatible project file format');
      }
      const initial = this.getInitialState();
      const merged = {
        session: { ...initial.session, ...parsed.session },
        schedule: parsed.schedule || initial.schedule,
        team: parsed.team || [],
        tasks: parsed.tasks || initial.tasks,
        research: { ...initial.research, ...parsed.research },
        presentation: parsed.presentation || initial.presentation,
        settings: { ...initial.settings, ...parsed.settings },
        triggeredAlerts: parsed.triggeredAlerts || [],
        snoozedAlerts: parsed.snoozedAlerts || []
      };
      this.saveState(merged);
      return { success: true, state: merged };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

window.Storage = Storage;
