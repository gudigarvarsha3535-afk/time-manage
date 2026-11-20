/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: tasks.js
 * Personal & Team Task Checklist, Categories, Sub-items, and Completion Tracking
 */

class TaskManager {
  constructor() {
    this.currentCategoryFilter = 'ALL';
    this.currentStatusFilter = 'ALL';
    this.searchQuery = '';
  }

  getCategories() {
    return [
      'Research',
      'Planning',
      'Hardware',
      'Software',
      'Testing',
      'Documentation',
      'Presentation',
      'Submission'
    ];
  }

  getTasks() {
    return window.AppState ? window.AppState.tasks : [];
  }

  getFilteredTasks() {
    let tasks = this.getTasks();

    if (this.currentCategoryFilter !== 'ALL') {
      tasks = tasks.filter((t) => t.category === this.currentCategoryFilter);
    }

    if (this.currentStatusFilter !== 'ALL') {
      if (this.currentStatusFilter === 'DELAYED') {
        tasks = tasks.filter((t) => t.status === 'Delayed' || t.delayed);
      } else {
        tasks = tasks.filter((t) => t.status === this.currentStatusFilter);
      }
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return tasks;
  }

  addTask(taskData) {
    const state = window.AppState;
    if (!state) return null;

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: taskData.title.trim() || 'Untitled Task',
      description: taskData.description ? taskData.description.trim() : '',
      category: taskData.category || 'Software',
      assignedMemberId: taskData.assignedMemberId || '',
      startTime: taskData.startTime || '',
      deadlineHour: Number(taskData.deadlineHour) || 24,
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'Not Started',
      checklist: Array.isArray(taskData.checklist) ? taskData.checklist : [],
      notes: taskData.notes || '',
      delayed: false
    };

    state.tasks.push(newTask);
    window.Storage.saveState(state);
    this.triggerUpdate();
    return newTask;
  }

  updateTask(taskId, updates) {
    const state = window.AppState;
    if (!state) return false;

    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return false;

    // If marking completed, reset delayed flag
    if (updates.status === 'Completed') {
      updates.delayed = false;
    }

    state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
    window.Storage.saveState(state);
    this.triggerUpdate();
    return true;
  }

  deleteTask(taskId) {
    const state = window.AppState;
    if (!state) return false;

    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    window.Storage.saveState(state);
    this.triggerUpdate();
    return true;
  }

  toggleTaskComplete(taskId) {
    const state = window.AppState;
    if (!state) return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === 'Completed') {
      task.status = 'In Progress';
    } else {
      task.status = 'Completed';
      task.delayed = false;
      // Also mark all sub-checklist items complete
      if (task.checklist) {
        task.checklist.forEach((item) => (item.done = true));
      }
    }

    window.Storage.saveState(state);
    this.triggerUpdate();
  }

  toggleTaskDelayed(taskId) {
    const state = window.AppState;
    if (!state) return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.delayed = !task.delayed;
    if (task.delayed) {
      task.status = 'Delayed';
    } else {
      task.status = 'In Progress';
    }

    window.Storage.saveState(state);
    this.triggerUpdate();
  }

  toggleChecklistItem(taskId, checkItemId) {
    const state = window.AppState;
    if (!state) return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task || !task.checklist) return;

    const item = task.checklist.find((c) => c.id === checkItemId);
    if (item) {
      item.done = !item.done;
      // If all items done, suggest or mark task completed
      const allDone = task.checklist.every((c) => c.done);
      if (allDone && task.status !== 'Completed') {
        task.status = 'Completed';
        task.delayed = false;
      } else if (!allDone && task.status === 'Completed') {
        task.status = 'In Progress';
      }
      window.Storage.saveState(state);
      this.triggerUpdate();
    }
  }

  addChecklistItem(taskId, text) {
    const state = window.AppState;
    if (!state) return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.checklist) task.checklist = [];
    task.checklist.push({
      id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3),
      text: text.trim(),
      done: false
    });

    window.Storage.saveState(state);
    this.triggerUpdate();
  }

  getStatistics() {
    const tasks = this.getTasks();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const notStarted = tasks.filter((t) => t.status === 'Not Started').length;
    const delayed = tasks.filter((t) => t.status === 'Delayed' || t.delayed).length;
    const pending = total - completed;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Category breakdown
    const categories = this.getCategories();
    const categoryStats = {};
    categories.forEach((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      const catTotal = catTasks.length;
      const catCompleted = catTasks.filter((t) => t.status === 'Completed').length;
      categoryStats[cat] = {
        total: catTotal,
        completed: catCompleted,
        percent: catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0
      };
    });

    return {
      total,
      completed,
      inProgress,
      notStarted,
      delayed,
      pending,
      progressPercent,
      categoryStats
    };
  }

  triggerUpdate() {
    if (window.App && typeof window.App.renderCurrentView === 'function') {
      window.App.renderCurrentView();
      window.App.updateHeaderStats();
    }
  }
}

window.TaskManager = new TaskManager();
