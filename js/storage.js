/**
 * Storage module for LZ ClientFlow
 * Handles localStorage persistence with error handling and versioning
 */

const STORAGE_KEY = 'lz-clientflow-data';
const STORAGE_VERSION = '1.0.0';

/**
 * Default empty application state
 * @returns {Object}
 */
export function getDefaultState() {
  return {
    version: STORAGE_VERSION,
    clients: [],
    projects: [],
    payments: [],
    settings: {
      darkMode: null, // null = system preference
      theme: 'auto'
    },
    lastModified: new Date().toISOString()
  };
}

/**
 * Load data from localStorage
 * Returns default state if no data exists or data is corrupted
 * @returns {Object} Application state
 */
export function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return getDefaultState();
    }

    const data = JSON.parse(stored);
    
    // Validate data structure
    if (!data.version || !Array.isArray(data.clients) || !Array.isArray(data.projects)) {
      console.warn('Corrupted data detected, using default state');
      return getDefaultState();
    }

    // Merge with default to ensure all properties exist
    return {
      ...getDefaultState(),
      ...data
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return getDefaultState();
  }
}

/**
 * Save data to localStorage
 * @param {Object} state - Application state to save
 * @returns {boolean} Success status
 */
export function saveToStorage(state) {
  try {
    const dataToSave = {
      ...state,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      return false;
    }
    
    return false;
  }
}

/**
 * Clear all data from localStorage
 * @returns {boolean} Success status
 */
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Export state as JSON
 * @param {Object} state - Application state
 * @returns {string} JSON string
 */
export function exportAsJSON(state) {
  const exportData = {
    ...state,
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import state from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {Object} Result object
 */
export function importFromJSON(jsonString) {
  const result = {
    success: false,
    data: null,
    error: null
  };

  try {
    const imported = JSON.parse(jsonString);

    // Validate structure
    if (!Array.isArray(imported.clients) || !Array.isArray(imported.projects)) {
      result.error = 'Invalid data format';
      return result;
    }

    // Ensure all required fields exist
    const validatedData = {
      version: imported.version || STORAGE_VERSION,
      clients: imported.clients || [],
      projects: imported.projects || [],
      payments: imported.payments || [],
      settings: imported.settings || getDefaultState().settings
    };

    result.success = true;
    result.data = validatedData;
  } catch (error) {
    result.error = `Invalid JSON: ${error.message}`;
  }

  return result;
}

/**
 * Export projects as CSV
 * @param {Array} projects - Projects to export
 * @param {Array} clients - Clients for lookup
 * @returns {string} CSV string
 */
export function exportAsCSV(projects, clients) {
  const headers = [
    'Project ID',
    'Client Name',
    'Project Name',
    'Type',
    'Status',
    'Due Date',
    'Total Price',
    'Deposit Required',
    'Deposit Received',
    'Outstanding Balance',
    'Payment Status',
    'Progress'
  ];

  const rows = projects.map(project => {
    const client = clients.find(c => c.id === project.clientId);
    const clientName = client ? client.fullName : 'Unknown Client';

    return [
      project.id,
      clientName,
      project.projectName,
      project.type,
      project.status,
      project.dueDate,
      project.totalPrice,
      project.depositRequired,
      project.depositReceived,
      project.outstandingBalance,
      project.paymentStatus,
      project.progress
    ];
  });

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const str = String(cell || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
  ].join('\n');

  return csv;
}

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}
