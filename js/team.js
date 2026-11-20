/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: team.js
 * Team Member Management, Role Assignment, Workload Monitoring, and Delegation
 */

class TeamManager {
  constructor() {
    this.predefinedRoles = [
      'Team Leader / Project Manager',
      'Developer / Software Engineer',
      'Hardware / Electronics Engineer',
      'Research & Problem Analysis Manager',
      'UI/UX Designer',
      'Presentation & Documentation Manager'
    ];
  }

  getRoles() {
    return this.predefinedRoles;
  }

  getTeamMembers() {
    return window.AppState ? window.AppState.team : [];
  }

  getMemberById(memberId) {
    const team = this.getTeamMembers();
    return team.find((m) => m.id === memberId) || null;
  }

  addMember(memberData) {
    const state = window.AppState;
    if (!state) return null;

    const newMember = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: memberData.name.trim() || 'Team Member',
      role: memberData.role.trim() || 'Developer / Software Engineer',
      skills: memberData.skills ? memberData.skills.trim() : '',
      contact: memberData.contact ? memberData.contact.trim() : '',
      notes: memberData.notes ? memberData.notes.trim() : ''
    };

    if (!state.team) state.team = [];
    state.team.push(newMember);

    // Update session team size if needed
    if (state.session) {
      state.session.teamSize = Math.max(state.session.teamSize, state.team.length);
    }

    window.Storage.saveState(state);
    this.triggerUpdate();
    return newMember;
  }

  updateMember(memberId, updates) {
    const state = window.AppState;
    if (!state || !state.team) return false;

    const memberIndex = state.team.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) return false;

    state.team[memberIndex] = { ...state.team[memberIndex], ...updates };
    window.Storage.saveState(state);
    this.triggerUpdate();
    return true;
  }

  deleteMember(memberId) {
    const state = window.AppState;
    if (!state || !state.team) return false;

    state.team = state.team.filter((m) => m.id !== memberId);

    // Unassign tasks assigned to this member
    if (state.tasks) {
      state.tasks.forEach((t) => {
        if (t.assignedMemberId === memberId) {
          t.assignedMemberId = '';
        }
      });
    }

    window.Storage.saveState(state);
    this.triggerUpdate();
    return true;
  }

  assignTask(taskId, memberId) {
    const state = window.AppState;
    if (!state || !state.tasks) return false;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.assignedMemberId = memberId;
    window.Storage.saveState(state);
    this.triggerUpdate();
    return true;
  }

  getMemberWorkload(memberId) {
    const state = window.AppState;
    if (!state || !state.tasks) {
      return { total: 0, completed: 0, inProgress: 0, delayed: 0, tasks: [], progressPercent: 0 };
    }

    const memberTasks = state.tasks.filter((t) => t.assignedMemberId === memberId);
    const total = memberTasks.length;
    const completed = memberTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
    const delayed = memberTasks.filter((t) => t.status === 'Delayed' || t.delayed).length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      delayed,
      tasks: memberTasks,
      progressPercent
    };
  }

  getTeamOverview() {
    const members = this.getTeamMembers();
    const state = window.AppState;
    const unassignedTasks = state && state.tasks ? state.tasks.filter((t) => !t.assignedMemberId) : [];

    const memberOverviews = members.map((member) => {
      const workload = this.getMemberWorkload(member.id);
      const activeTasks = workload.tasks.filter((t) => t.status !== 'Completed');
      const currentTask = activeTasks.find((t) => t.status === 'In Progress') || activeTasks[0] || null;

      return {
        member,
        workload,
        currentTask
      };
    });

    return {
      memberOverviews,
      unassignedTasks
    };
  }

  triggerUpdate() {
    if (window.App && typeof window.App.renderCurrentView === 'function') {
      window.App.renderCurrentView();
      window.App.updateHeaderStats();
    }
  }
}

window.TeamManager = new TeamManager();
