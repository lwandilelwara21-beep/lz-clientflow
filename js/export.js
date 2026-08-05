/**
 * Export and import functionality for LZ ClientFlow
 * Handles JSON and CSV exports, and JSON imports
 */

import { exportAsJSON, exportAsCSV, importFromJSON } from './storage.js';
import { error, success } from './notifications.js';

/**
 * Trigger a file download
 * @param {string} filename - Name of file
 * @param {string} content - File content
 * @param {string} mimeType - MIME type
 */
function downloadFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export application data as JSON
 * @param {Object} state - Application state
 * @returns {boolean} Success status
 */
export function exportDataAsJSON(state) {
  try {
    const json = exportAsJSON(state);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lz-clientflow-backup-${timestamp}.json`;
    
    downloadFile(filename, json, 'application/json');
    success(`Data exported as ${filename}`);
    return true;
  } catch (err) {
    error('Failed to export data');
    console.error('Export error:', err);
    return false;
  }
}

/**
 * Export projects as CSV
 * @param {Array} projects - Projects to export
 * @param {Array} clients - Clients for reference
 * @returns {boolean} Success status
 */
export function exportProjectsAsCSV(projects, clients) {
  try {
    const csv = exportAsCSV(projects, clients);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lz-clientflow-projects-${timestamp}.csv`;
    
    downloadFile(filename, csv, 'text/csv;charset=utf-8;');
    success(`Projects exported as ${filename}`);
    return true;
  } catch (err) {
    error('Failed to export projects');
    console.error('CSV export error:', err);
    return false;
  }
}

/**
 * Import data from JSON file
 * @param {File} file - File to import
 * @returns {Promise<Object>} Result object with data or error
 */
export async function importFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const result = importFromJSON(content);

        if (!result.success) {
          error(result.error);
          resolve({ success: false, error: result.error });
          return;
        }

        success('Data imported successfully');
        resolve({ success: true, data: result.data });
      } catch (err) {
        error('Failed to import data');
        resolve({ 
          success: false, 
          error: 'Failed to read file: ' + err.message 
        });
      }
    };

    reader.onerror = () => {
      error('Failed to read file');
      resolve({ success: false, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}

/**
 * Validate import data
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
export function validateImportData(data) {
  const warnings = [];
  const errors = [];

  if (!data.clients || !Array.isArray(data.clients)) {
    errors.push('No clients data found');
  }

  if (!data.projects || !Array.isArray(data.projects)) {
    errors.push('No projects data found');
  }

  // Check for orphaned projects
  if (data.projects && data.clients) {
    const clientIds = new Set(data.clients.map(c => c.id));
    const orphanedProjects = data.projects.filter(p => !clientIds.has(p.clientId));
    
    if (orphanedProjects.length > 0) {
      warnings.push(`${orphanedProjects.length} project(s) have missing client references`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate export summary
 * @param {Object} state - Application state
 * @returns {string} Summary text
 */
export function getExportSummary(state) {
  const summary = [
    `Clients: ${state.clients.length}`,
    `Projects: ${state.projects.length}`,
    `Payments: ${state.payments.length}`,
    `Exported: ${new Date().toLocaleString('en-ZA')}`
  ];

  return summary.join('\n');
}

/**
 * Create a formatted report of application data
 * @param {Object} state - Application state
 * @returns {string} Report text
 */
export function generateDataReport(state) {
  const lines = [
    '=== LZ ClientFlow Data Report ===',
    `Generated: ${new Date().toLocaleString('en-ZA')}`,
    '',
    '--- SUMMARY ---',
    `Total Clients: ${state.clients.length}`,
    `Total Projects: ${state.projects.length}`,
    `Total Payments: ${state.payments.length}`,
    ''
  ];

  // Add clients summary
  if (state.clients.length > 0) {
    lines.push('--- CLIENTS ---');
    state.clients.forEach(client => {
      const projectCount = state.projects.filter(p => p.clientId === client.id).length;
      lines.push(`${client.fullName} (${projectCount} projects)`);
    });
    lines.push('');
  }

  // Add projects summary
  if (state.projects.length > 0) {
    lines.push('--- PROJECTS ---');
    const statusGroups = {};
    state.projects.forEach(project => {
      if (!statusGroups[project.status]) {
        statusGroups[project.status] = 0;
      }
      statusGroups[project.status]++;
    });

    Object.entries(statusGroups).forEach(([status, count]) => {
      lines.push(`${status}: ${count}`);
    });
    lines.push('');
  }

  // Add financial summary
  const totalValue = state.projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalReceived = state.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstanding = state.projects.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0);

  lines.push('--- FINANCIAL SUMMARY ---');
  lines.push(`Total Project Value: R${totalValue.toFixed(2)}`);
  lines.push(`Total Received: R${totalReceived.toFixed(2)}`);
  lines.push(`Outstanding: R${outstanding.toFixed(2)}`);

  return lines.join('\n');
}
