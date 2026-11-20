/**
 * HACKATHON MANAGER – 24H TEAM CONTROL SYSTEM
 * Module: research.js
 * 15-Point Engineering Research Specification, 5-Whys Root Cause Tool, and Auto-save
 */

class ResearchManager {
  constructor() {
    this.fieldDefinitions = [
      { key: 'problemStatement', label: '1. Problem Statement', placeholder: 'Clearly define the real-world challenge, its context, and urgency...' },
      { key: 'backgroundResearch', label: '2. Background Research', placeholder: 'Industry data, scientific context, market surveys, or historical context...' },
      { key: 'targetUsers', label: '3. Target Users & Beneficiaries', placeholder: 'Who suffers most from this problem? Personas, demographics, working environment...' },
      { key: 'rootCauseAnalysis', label: '4. Root Cause Analysis Summary', placeholder: 'The underlying systemic, hardware, or human breakdown causing the symptom...' },
      { key: 'existingSolutions', label: '5. Existing Solutions & Competitors', placeholder: 'Current software, commercial products, academic papers, or manual workarounds...' },
      { key: 'existingSolutionLimitations', label: '6. Existing Solution Limitations', placeholder: 'Why do current approaches fail? (High latency, expensive sensors, poor UX, scalability)...' },
      { key: 'researchGap', label: '7. Research / Market Gap', placeholder: 'The unaddressed niche, missing capability, or technological bottleneck you identified...' },
      { key: 'proposedSolution', label: '8. Proposed Solution & Architecture', placeholder: 'Detailed description of your engineering solution and how its components interact...' },
      { key: 'innovationAndUniqueness', label: '9. Innovation & Novelty Factor', placeholder: 'What makes your project genuinely unique, IP-worthy, or breakthrough?...' },
      { key: 'technicalRequirements', label: '10. Technical Requirements & Stack', placeholder: 'Hardware microcontrollers, APIs, frameworks, database schemas, compute specs...' },
      { key: 'estimatedCost', label: '11. Estimated Cost & Bill of Materials (BOM)', placeholder: 'Component pricing, server costs, licensing, hardware sensors, deployment costs...' },
      { key: 'expectedImpact', label: '12. Expected Impact & Value Proposition', placeholder: 'Measurable metric improvements (e.g., 40% time saved, 99.2% accuracy, zero carbon)...' },
      { key: 'applications', label: '13. Real-World Applications & Verticals', placeholder: 'Where can this be scaled? (Healthcare, manufacturing, robotics, smart cities, defense)...' },
      { key: 'projectLimitations', label: '14. Project Limitations & Ethical Constraints', placeholder: 'Current prototype boundaries, edge cases not handled, data privacy considerations...' },
      { key: 'referencesAndSources', label: '15. References, Literature & Data Sources', placeholder: 'IEEE papers, GitHub libraries, datasets used, documentation URLs, academic citations...' }
    ];
  }

  getFieldDefinitions() {
    return this.fieldDefinitions;
  }

  getResearchData() {
    const state = window.AppState;
    return state ? state.research : {};
  }

  updateField(key, value) {
    const state = window.AppState;
    if (!state || !state.research) return;

    state.research[key] = value;
    state.research.lastSaved = Date.now();
    window.Storage.saveState(state);
  }

  updateWhy(index, value) {
    const state = window.AppState;
    if (!state || !state.research) return;

    if (!Array.isArray(state.research.fiveWhys)) {
      state.research.fiveWhys = ['', '', '', '', ''];
    }
    state.research.fiveWhys[index] = value;
    state.research.lastSaved = Date.now();
    window.Storage.saveState(state);
  }

  updateWhyRootCause(value) {
    const state = window.AppState;
    if (!state || !state.research) return;

    state.research.fiveWhysRootCause = value;
    state.research.lastSaved = Date.now();
    window.Storage.saveState(state);
  }

  getResearchCompletion() {
    const data = this.getResearchData();
    let filledCount = 0;
    const totalFields = this.fieldDefinitions.length;

    this.fieldDefinitions.forEach((f) => {
      if (data[f.key] && data[f.key].trim().length > 10) {
        filledCount++;
      }
    });

    const percent = Math.round((filledCount / totalFields) * 100);
    return {
      filledCount,
      totalFields,
      percent
    };
  }

  exportMarkdown() {
    const data = this.getResearchData();
    const state = window.AppState;
    const projectName = state?.session?.projectName || 'Hackathon Project';
    const teamName = state?.session?.teamName || 'Team';

    let md = `# Engineering Research Specification: ${projectName}\n`;
    md += `**Team:** ${teamName} | **Date:** ${new Date().toLocaleDateString()}\n\n`;
    md += `## 5-Whys Root Cause Analysis\n\n`;

    const whys = Array.isArray(data.fiveWhys) ? data.fiveWhys : ['', '', '', '', ''];
    whys.forEach((w, i) => {
      md += `**Why ${i + 1}:** ${w || '(Not documented)'}\n\n`;
    });
    md += `**Root Cause Conclusion:** ${data.fiveWhysRootCause || '(Not documented)'}\n\n`;
    md += `---\n\n## 15-Point Research Framework\n\n`;

    this.fieldDefinitions.forEach((field) => {
      md += `### ${field.label}\n`;
      md += `${data[field.key] || '_No notes recorded yet._'}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_spec_${projectName.toLowerCase().replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

window.ResearchManager = new ResearchManager();
