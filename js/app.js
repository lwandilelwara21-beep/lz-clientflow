/**
 * Main application file for LZ ClientFlow
 * Handles UI rendering, navigation, and user interactions
 */

import { appState } from './state.js';
import { 
  calculateMetrics, 
  getProjectsDueSoon, 
  getOverdueProjects, 
  getRecentProjects,
  getPaymentOverview,
  getStatusBreakdown,
  getRevenueMetrics
} from './dashboard.js';
import {
  filterProjects,
  filterClients,
  sortProjects,
  sortClients,
  searchClients,
  searchProjects,
  getFilterOptions
} from './filters.js';
import { 
  validateClient, 
  validateProject, 
  validatePayment,
  displayFormErrors,
  clearFormErrors 
} from './validation.js';
import {
  formatDate,
  formatCurrency,
  escapeHtml,
  truncate,
  deepClone,
  daysUntil,
  isPast,
  isToday,
  isThisWeek
} from './utils.js';
import {
  success,
  error,
  warning,
  info
} from './notifications.js';
import {
  exportDataAsJSON,
  exportProjectsAsCSV,
  importFromFile,
  validateImportData,
  generateDataReport
} from './export.js';
import { isStorageAvailable } from './storage.js';
import { dispatchClientWebhook } from './webhook.js';

// ============================================
// INLINE SVG ICONS (no external dependency)
// ============================================

const SVG = {
  eye:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  edit:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  userPlus:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  folderPlus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  creditCard: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  search:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  download:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  refresh:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
};

// ============================================
// APPLICATION STATE
// ============================================

let currentView = 'dashboard';
let currentEditingId = null;
let currentClientEditingId = null;
let currentFilters = {};
let currentSort = { by: 'newest', order: 'desc' };
let currentClientSort = { by: 'name', order: 'asc' };

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
export function initApp() {
  // Check if storage is available
  if (!isStorageAvailable()) {
    error('Local storage is not available. Data will not be saved.');
  }

  // Set up theme
  setupTheme();

  // Set up event listeners
  setupEventListeners();

  // Set up state subscription
  appState.subscribe(handleStateChange);

  // Render initial view
  renderView(currentView);

  // Set up keyboard shortcuts
  setupKeyboardShortcuts();

  console.log('LZ ClientFlow initialized');
}

/**
 * Set up the theme based on saved preference
 */
function setupTheme() {
  const settings = appState.getSettings();
  let darkMode = settings.darkMode;
  // Default to dark mode for the premium experience
  if (darkMode === null || darkMode === undefined) {
    darkMode = true;
  }
  applyTheme(darkMode);
  updateThemeToggle(darkMode);
}

/**
 * Apply theme to document
 * @param {boolean} isDark - Whether to apply dark mode
 */
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

/**
 * Update theme toggle button state
 * @param {boolean} isDark
 */
function updateThemeToggle(isDark) {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', isDark.toString());
  const sunSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const moonSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  toggle.innerHTML = isDark
    ? `${sunSvg}<span>Light Mode</span>`
    : `${moonSvg}<span>Dark Mode</span>`;
}

/**
 * Set up main event listeners
 */
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const view = btn.getAttribute('data-view');
      navigateTo(view);
    });
  });

  // Theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const settings = appState.getSettings();
      const isDark = settings.darkMode;
      const newTheme = !isDark;
      appState.setDarkMode(newTheme);
      applyTheme(newTheme);
      updateThemeToggle(newTheme);
    });
  }

  // Mobile menu toggle
  const sidebarToggle = document.querySelector('#sidebar-toggle');
  const sidebar = document.querySelector('#sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      sidebarToggle.setAttribute('aria-expanded', isOpen.toString());
    });

    // Close sidebar when a nav item is clicked on mobile
    sidebar.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on backdrop click
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open')
          && !sidebar.contains(e.target)
          && e.target !== sidebarToggle) {
        sidebar.classList.remove('open');
        sidebarToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Demo data loader
  const loadDemoBtn = document.querySelector('[data-action="load-demo"]');
  if (loadDemoBtn) {
    loadDemoBtn.addEventListener('click', loadDemoData);
  }

  // Export buttons
  document.querySelector('[data-action="export-json"]')?.addEventListener(
    'click',
    handleExportJSON
  );
  document.querySelector('[data-action="export-csv"]')?.addEventListener(
    'click',
    handleExportCSV
  );

  // Import button
  document.querySelector('[data-action="import-json"]')?.addEventListener(
    'click',
    () => {
      document.querySelector('#import-file-input')?.click();
    }
  );

  const importInput = document.querySelector('#import-file-input');
  if (importInput) {
    importInput.addEventListener('change', handleImportJSON);
  }

  // Reset data
  document.querySelector('[data-action="reset-data"]')?.addEventListener(
    'click',
    handleResetData
  );
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape closes modals
    if (e.key === 'Escape') {
      closeAllModals();
    }

    // Ctrl+S or Cmd+S to export (prevent default)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleExportJSON();
    }
  });
}

/**
 * Handle state changes
 * @param {Object} newState - Updated state
 */
function handleStateChange(newState) {
  // Re-render current view if needed
  if (['dashboard', 'projects', 'clients', 'payments', 'calendar'].includes(currentView)) {
    renderView(currentView);
  }
}

// ============================================
// NAVIGATION
// ============================================

/**
 * Navigate to a view
 * @param {string} viewName - Name of view to navigate to
 */
export function navigateTo(viewName) {
  currentView = viewName;
  renderView(viewName);
  
  // Update active nav item
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });
}

/**
 * Render a view
 * @param {string} viewName - Name of view to render
 */
function renderView(viewName) {
  const main = document.querySelector('main');
  
  // Clear main content
  main.innerHTML = '';

  // Set aria-label
  main.setAttribute('aria-label', `${viewName.charAt(0).toUpperCase() + viewName.slice(1)} view`);

  switch (viewName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'clients':
      renderClientsView();
      break;
    case 'projects':
      renderProjectsView();
      break;
    case 'payments':
      renderPaymentsView();
      break;
    case 'calendar':
      renderCalendarView();
      break;
    case 'reports':
      renderReportsView();
      break;
    case 'settings':
      renderSettingsView();
      break;
    default:
      renderDashboard();
  }
}

// ============================================
// DASHBOARD VIEW
// ============================================

/**
 * Render dashboard
 */
function renderDashboard() {
  const state = appState.getFullState();
  const metrics = calculateMetrics(state);

  const dashboard = document.createElement('div');
  dashboard.className = 'dashboard';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <h1>Dashboard</h1>
    <p class="text-muted">Overview of your business and projects</p>
  `;
  dashboard.appendChild(header);

  // Quick action buttons
  const quickActions = document.createElement('div');
  quickActions.className = 'quick-actions';
  quickActions.innerHTML = `
    <button class="btn btn-primary" data-action="add-client">
      ${SVG.userPlus} Add Client
    </button>
    <button class="btn btn-primary" data-action="add-project">
      ${SVG.folderPlus} Add Project
    </button>
    <button class="btn btn-secondary" data-action="record-payment">
      ${SVG.creditCard} Record Payment
    </button>
  `;
  dashboard.appendChild(quickActions);

  // Metrics grid
  const metricsGrid = document.createElement('div');
  metricsGrid.className = 'metrics-grid';
  metricsGrid.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total Clients</div>
      <div class="metric-value">${metrics.totalClients}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Active Projects</div>
      <div class="metric-value">${metrics.activeProjects}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Completed Projects</div>
      <div class="metric-value">${metrics.completedProjects}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Project Value</div>
      <div class="metric-value">${formatCurrency(metrics.totalProjectValue)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Deposits Received</div>
      <div class="metric-value">${formatCurrency(metrics.depositsReceived)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Outstanding Balance</div>
      <div class="metric-value">${formatCurrency(metrics.outstandingBalance)}</div>
    </div>
    <div class="metric-card alert">
      <div class="metric-label">Overdue Projects</div>
      <div class="metric-value">${metrics.overDueProjects}</div>
    </div>
    <div class="metric-card warning">
      <div class="metric-label">Due This Week</div>
      <div class="metric-value">${metrics.dueThisWeek}</div>
    </div>
  `;
  dashboard.appendChild(metricsGrid);

  // Two column layout
  const twoCol = document.createElement('div');
  twoCol.className = 'dashboard-grid';

  // Recent projects
  const recentProjects = document.createElement('section');
  recentProjects.className = 'card';
  const recent = getRecentProjects(state.projects, 5);

  recentProjects.innerHTML = `
    <div class="card-header">
      <h2>Recent Projects</h2>
    </div>
    <div class="card-body">
      ${recent.length === 0 ? '<p class="text-muted">No projects yet</p>' : `
        <div class="projects-list">
          ${recent.map(project => {
            const client = appState.getClient(project.clientId);
            return `
              <div class="project-item" data-project-id="${project.id}">
                <div class="project-info">
                  <h3>${escapeHtml(project.projectName)}</h3>
                  <p class="text-muted">${client ? escapeHtml(client.fullName) : 'Unknown Client'}</p>
                </div>
                <div class="project-status">
                  <span class="status-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}">${project.status}</span>
                  <span class="progress-text">${project.progress}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
  twoCol.appendChild(recentProjects);

  // Payment overview
  const paymentOverview = document.createElement('section');
  paymentOverview.className = 'card';
  const paymentSummary = getPaymentOverview(state.projects);

  paymentOverview.innerHTML = `
    <div class="card-header">
      <h2>Payment Status</h2>
    </div>
    <div class="card-body">
      <div class="payment-overview">
        <div class="payment-item">
          <span>Not Paid</span>
          <strong>${paymentSummary.notPaid}</strong>
        </div>
        <div class="payment-item">
          <span>Deposit Paid</span>
          <strong>${paymentSummary.depositPaid}</strong>
        </div>
        <div class="payment-item">
          <span>Partially Paid</span>
          <strong>${paymentSummary.partiallyPaid}</strong>
        </div>
        <div class="payment-item success">
          <span>Paid in Full</span>
          <strong>${paymentSummary.paidInFull}</strong>
        </div>
        <div class="payment-item">
          <span>Overpaid</span>
          <strong>${paymentSummary.overpaid}</strong>
        </div>
      </div>
    </div>
  `;
  twoCol.appendChild(paymentOverview);

  // Upcoming deadlines
  const upcomingSection = document.createElement('section');
  upcomingSection.className = 'card';
  const upcomingProjects = getProjectsDueSoon(state.projects);

  upcomingSection.innerHTML = `
    <div class="card-header">
      <h2>Upcoming Deadlines</h2>
    </div>
    <div class="card-body">
      ${upcomingProjects.length === 0 ? '<p class="text-muted">No projects due in the next 30 days</p>' : `
        <div class="deadlines-list">
          ${upcomingProjects.slice(0, 5).map(project => {
            const daysLeft = daysUntil(project.dueDate);
            const isOverdue = daysLeft < 0;
            const className = isOverdue ? 'danger' : (daysLeft <= 3 ? 'warning' : '');
            
            return `
              <div class="deadline-item ${className}" data-project-id="${project.id}">
                <div class="deadline-info">
                  <h4>${escapeHtml(project.projectName)}</h4>
                  <p class="text-muted">${formatDate(project.dueDate)}</p>
                </div>
                <div class="deadline-status">
                  ${isOverdue 
                    ? `<span class="badge badge-danger">Overdue</span>` 
                    : `<span class="badge">${daysLeft === 0 ? 'Today' : (daysLeft === 1 ? 'Tomorrow' : daysLeft + ' days')}</span>`
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
  twoCol.appendChild(upcomingSection);

  // Revenue metrics
  const revenueSection = document.createElement('section');
  revenueSection.className = 'card';
  const revenue = getRevenueMetrics(state.projects, state.payments);

  revenueSection.innerHTML = `
    <div class="card-header">
      <h2>Revenue Overview</h2>
    </div>
    <div class="card-body">
      <div class="revenue-chart">
        <div class="revenue-item">
          <span class="label">Total Value</span>
          <span class="amount">${formatCurrency(revenue.totalValue)}</span>
        </div>
        <div class="revenue-item success">
          <span class="label">Received</span>
          <span class="amount">${formatCurrency(revenue.totalReceived)}</span>
        </div>
        <div class="revenue-item alert">
          <span class="label">Outstanding</span>
          <span class="amount">${formatCurrency(revenue.totalOutstanding)}</span>
        </div>
        <div class="revenue-progress">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${revenue.percentageReceived}%"></div>
          </div>
          <p class="text-muted">${revenue.percentageReceived.toFixed(1)}% collected</p>
        </div>
      </div>
    </div>
  `;
  twoCol.appendChild(revenueSection);

  dashboard.appendChild(twoCol);

  // Add event listeners
  dashboard.querySelectorAll('[data-action="add-client"]').forEach(btn => {
    btn.addEventListener('click', () => openClientModal());
  });

  dashboard.querySelectorAll('[data-action="add-project"]').forEach(btn => {
    btn.addEventListener('click', () => openProjectModal());
  });

  dashboard.querySelectorAll('[data-action="record-payment"]').forEach(btn => {
    btn.addEventListener('click', () => openPaymentModal());
  });

  // Click on project items to view details
  dashboard.querySelectorAll('[data-project-id]').forEach(item => {
    item.addEventListener('click', () => {
      const projectId = item.getAttribute('data-project-id');
      currentEditingId = projectId;
      openProjectModal(projectId);
    });
  });

  document.querySelector('main').appendChild(dashboard);
}

// ============================================
// CLIENTS VIEW
// ============================================

/**
 * Render clients view
 */
function renderClientsView() {
  const state = appState.getFullState();
  let clients = [...state.clients];

  const clientsView = document.createElement('div');
  clientsView.className = 'clients-view';

  // Header with actions
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <div>
      <h1>Clients</h1>
      <p class="text-muted">Manage your clients and their information</p>
    </div>
    <button class="btn btn-primary" data-action="add-client">${SVG.userPlus} Add Client</button>
  `;
  clientsView.appendChild(header);

  // Search and filter
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <div class="search-box">
      <span class="search-icon">${SVG.search}</span>
      <input type="text" class="search-input" placeholder="Search clients by name, email, or phone..." aria-label="Search clients">
    </div>
    <div class="filter-controls">
      <select class="filter-select" data-filter="sort" aria-label="Sort clients">
        <option value="name">Sort by Name</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
      <button class="btn btn-outline btn-sm" data-action="clear-filters">Clear Filters</button>
    </div>
  `;
  clientsView.appendChild(toolbar);

  // Clients list/table
  const clientsContainer = document.createElement('div');
  clientsContainer.className = 'clients-container';

  if (clients.length === 0) {
    clientsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-content">
          <h2>No clients yet</h2>
          <p>Start by adding your first client to track their projects and payments.</p>
          <button class="btn btn-primary" data-action="add-client">Add First Client</button>
        </div>
      </div>
    `;
  } else {
    const table = document.createElement('div');
    table.className = 'clients-table';
    table.innerHTML = `
      <div class="table-header">
        <div class="th">Name</div>
        <div class="th">Business</div>
        <div class="th">Contact</div>
        <div class="th">Projects</div>
        <div class="th">Actions</div>
      </div>
      <div class="table-body">
        ${clients.map(client => {
          const projectCount = state.projects.filter(p => p.clientId === client.id).length;
          return `
            <div class="table-row" data-client-id="${client.id}">
              <div class="td" data-label="Name">${escapeHtml(client.fullName)}</div>
              <div class="td" data-label="Business">${escapeHtml(client.businessName || '-')}</div>
              <div class="td" data-label="Contact">
                ${client.preferredContact ? `<span class="text-muted">${client.preferredContact}</span>` : '-'}
              </div>
              <div class="td" data-label="Projects">
                <span class="badge">${projectCount}</span>
              </div>
              <div class="td actions">
                <button class="btn btn-ghost btn-icon" data-action="view-client" aria-label="View client" title="View">${SVG.eye}</button>
                <button class="btn btn-ghost btn-icon" data-action="edit-client" aria-label="Edit client" title="Edit">${SVG.edit}</button>
                <button class="btn btn-ghost btn-icon btn-icon-danger" data-action="delete-client" aria-label="Delete client" title="Delete">${SVG.trash}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    table.addEventListener('click', (e) => handleClientTableActions(e, state));
    clientsContainer.appendChild(table);
  }

  clientsView.appendChild(clientsContainer);

  // Add event listeners
  clientsView.querySelector('[data-action="add-client"]')?.addEventListener('click', () => {
    currentClientEditingId = null;
    openClientModal();
  });

  const searchInput = clientsView.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const results = searchClients(state.clients, query);
      updateClientsTable(clientsView, results, state);
    });
  }

  const sortSelect = clientsView.querySelector('[data-filter="sort"]');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentClientSort.by = e.target.value;
      const sorted = sortClients(clients, e.target.value, currentClientSort.order);
      updateClientsTable(clientsView, sorted, state);
    });
  }

  clientsView.querySelector('[data-action="clear-filters"]')?.addEventListener('click', () => {
    searchInput.value = '';
    sortSelect.value = 'name';
    updateClientsTable(clientsView, state.clients, state);
  });

  document.querySelector('main').appendChild(clientsView);
}

/**
 * Handle actions on client table rows
 * @param {Event} e - Click event
 * @param {Object} state - App state
 */
function handleClientTableActions(e, state) {
  const row = e.target.closest('.table-row');
  if (!row) return;

  const clientId = row.getAttribute('data-client-id');
  const action = e.target.closest('[data-action]')?.getAttribute('data-action');

  if (action === 'view-client') {
    openClientDetails(clientId);
  } else if (action === 'edit-client') {
    currentClientEditingId = clientId;
    openClientModal(clientId);
  } else if (action === 'delete-client') {
    const client = appState.getClient(clientId);
    const projectCount = state.projects.filter(p => p.clientId === clientId).length;
    
    if (confirm(
      `Delete client "${client.fullName}"?\n\n` +
      `This client has ${projectCount} project(s).\n` +
      `If you proceed, associated projects and their payments will be deleted.`
    )) {
      const result = appState.deleteClient(clientId);
      if (result.success) {
        success(`Client "${client.fullName}" deleted`);
      }
    }
  }
}

/**
 * Update clients table with new data
 * @param {HTMLElement} container - Container to update
 * @param {Array} clients - Clients to display
 * @param {Object} state - App state
 */
function updateClientsTable(container, clients, state) {
  const table = container.querySelector('.table-body');
  if (!table) return;

  if (clients.length === 0) {
    table.innerHTML = '<div class="empty-state"><p>No clients match your search</p></div>';
    return;
  }

  table.innerHTML = clients.map(client => {
    const projectCount = state.projects.filter(p => p.clientId === client.id).length;
    return `
      <div class="table-row" data-client-id="${client.id}">
        <div class="td" data-label="Name">${escapeHtml(client.fullName)}</div>
        <div class="td" data-label="Business">${escapeHtml(client.businessName || '-')}</div>
        <div class="td" data-label="Contact">
          ${client.preferredContact ? `<span class="text-muted">${client.preferredContact}</span>` : '-'}
        </div>
        <div class="td" data-label="Projects">
          <span class="badge">${projectCount}</span>
        </div>
        <div class="td actions">
          <button class="btn btn-ghost btn-icon" data-action="view-client" aria-label="View client" title="View">${SVG.eye}</button>
          <button class="btn btn-ghost btn-icon" data-action="edit-client" aria-label="Edit client" title="Edit">${SVG.edit}</button>
          <button class="btn btn-ghost btn-icon btn-icon-danger" data-action="delete-client" aria-label="Delete client" title="Delete">${SVG.trash}</button>
        </div>
      </div>
    `;
  }).join('');

  // Re-attach event listeners
  table.parentElement.addEventListener('click', (e) => handleClientTableActions(e, state));
}

// ============================================
// PROJECTS VIEW
// ============================================

/**
 * Render projects view
 */
function renderProjectsView() {
  const state = appState.getFullState();
  let projects = [...state.projects];

  const projectsView = document.createElement('div');
  projectsView.className = 'projects-view';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <div>
      <h1>Projects</h1>
      <p class="text-muted">Manage projects, deadlines, and progress</p>
    </div>
    <button class="btn btn-primary" data-action="add-project">${SVG.folderPlus} Add Project</button>
  `;
  projectsView.appendChild(header);

  // Search and filters
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  const filterOptions = getFilterOptions(state);

  toolbar.innerHTML = `
    <div class="search-box">
      <span class="search-icon">${SVG.search}</span>
      <input type="text" class="search-input" placeholder="Search projects..." aria-label="Search projects">
    </div>
    <div class="filter-controls">
      <select class="filter-select" data-filter="status" aria-label="Filter by status">
        <option value="">All Statuses</option>
        ${filterOptions.statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>
      <select class="filter-select" data-filter="priority" aria-label="Filter by priority">
        <option value="">All Priorities</option>
        ${filterOptions.priorities.map(p => `<option value="${p}">${p}</option>`).join('')}
      </select>
      <select class="filter-select" data-filter="sort" aria-label="Sort projects">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="dueDate">Due Date</option>
        <option value="value">Highest Value</option>
        <option value="progress">Progress</option>
      </select>
      <button class="btn btn-outline btn-sm" data-action="clear-filters">Clear Filters</button>
    </div>
  `;
  projectsView.appendChild(toolbar);

  // Projects container
  const projectsContainer = document.createElement('div');
  projectsContainer.className = 'projects-container';

  if (projects.length === 0) {
    projectsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-content">
          <h2>No projects yet</h2>
          <p>Create your first project to start tracking work.</p>
          <button class="btn btn-primary" data-action="add-project">Add First Project</button>
        </div>
      </div>
    `;
  } else {
    renderProjectsCards(projectsContainer, projects, state);
  }

  projectsView.appendChild(projectsContainer);

  // Add event listeners
  projectsView.querySelector('[data-action="add-project"]')?.addEventListener('click', () => {
    currentEditingId = null;
    openProjectModal();
  });

  const searchInput = projectsView.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => updateProjectsDisplay(projectsView, state));
  }

  projectsView.querySelectorAll('[data-filter]').forEach(select => {
    select.addEventListener('change', () => updateProjectsDisplay(projectsView, state));
  });

  projectsView.querySelector('[data-action="clear-filters"]')?.addEventListener('click', () => {
    projectsView.querySelectorAll('[data-filter]').forEach(s => s.value = '');
    projectsView.querySelector('.search-input').value = '';
    updateProjectsDisplay(projectsView, state);
  });

  document.querySelector('main').appendChild(projectsView);
}

/**
 * Render project cards
 * @param {HTMLElement} container - Container to render into
 * @param {Array} projects - Projects to display
 * @param {Object} state - App state
 */
function renderProjectsCards(container, projects, state) {
  container.innerHTML = projects.map(project => {
    const client = appState.getClient(project.clientId);
    const daysLeft = daysUntil(project.dueDate);
    const isOverdue = daysLeft < 0;
    
    return `
      <div class="project-card" data-project-id="${project.id}">
        <div class="card-header">
          <h3>${escapeHtml(project.projectName)}</h3>
          <span class="status-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}">${project.status}</span>
        </div>
        <div class="card-body">
          <div class="project-detail">
            <span class="label">Client:</span>
            <span>${client ? escapeHtml(client.fullName) : 'Unknown'}</span>
          </div>
          <div class="project-detail">
            <span class="label">Type:</span>
            <span>${project.type}</span>
          </div>
          <div class="project-detail">
            <span class="label">Due:</span>
            <span class="${isOverdue ? 'danger' : daysLeft <= 3 ? 'warning' : ''}">
              ${formatDate(project.dueDate)}
              ${daysLeft <= 7 ? `<span class="text-muted">(${isOverdue ? 'Overdue by ' + Math.abs(daysLeft) : daysLeft} days)</span>` : ''}
            </span>
          </div>
          <div class="project-detail">
            <span class="label">Value:</span>
            <span>${formatCurrency(project.totalPrice)}</span>
          </div>
          <div class="project-detail">
            <span class="label">Payment:</span>
            <span class="${project.paymentStatus.includes('Paid') ? 'success' : 'warning'}">${project.paymentStatus}</span>
          </div>
          <div class="progress-section">
            <div class="progress-header">
              <span class="label">Progress:</span>
              <span>${project.progress}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${project.progress}%"></div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-ghost" data-action="view-project">Details</button>
          <button class="btn btn-ghost" data-action="edit-project">${SVG.edit} Edit</button>
          <button class="btn btn-ghost btn-icon-danger" data-action="delete-project">${SVG.trash}</button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  container.querySelectorAll('.project-card').forEach(card => {
    const projectId = card.getAttribute('data-project-id');

    card.querySelector('[data-action="view-project"]')?.addEventListener('click', () => {
      openProjectDetails(projectId);
    });

    card.querySelector('[data-action="edit-project"]')?.addEventListener('click', () => {
      currentEditingId = projectId;
      openProjectModal(projectId);
    });

    card.querySelector('[data-action="delete-project"]')?.addEventListener('click', () => {
      const project = appState.getProject(projectId);
      if (confirm(`Delete project "${project.projectName}"? This will also delete all associated payments.`)) {
        appState.deleteProject(projectId);
        success(`Project "${project.projectName}" deleted`);
      }
    });
  });
}

/**
 * Update projects display with filters
 * @param {HTMLElement} container - Container element
 * @param {Object} state - App state
 */
function updateProjectsDisplay(container, state) {
  let projects = [...state.projects];
  const searchQuery = container.querySelector('.search-input').value;
  const statusFilter = container.querySelector('[data-filter="status"]').value;
  const priorityFilter = container.querySelector('[data-filter="priority"]').value;
  const sortBy = container.querySelector('[data-filter="sort"]').value;

  // Apply search
  if (searchQuery) {
    projects = searchProjects(projects, searchQuery);
  }

  // Apply filters
  const filters = {};
  if (statusFilter) filters.status = [statusFilter];
  if (priorityFilter) filters.priority = [priorityFilter];

  projects = filterProjects(projects, filters);

  // Apply sorting
  if (sortBy) {
    projects = sortProjects(projects, sortBy);
  }

  // Update display
  const projectsContainer = container.querySelector('.projects-container');
  if (projects.length === 0) {
    projectsContainer.innerHTML = '<div class="empty-state"><p>No projects match your filters</p></div>';
  } else {
    projectsContainer.innerHTML = '';
    renderProjectsCards(projectsContainer, projects, state);
  }
}

// ============================================
// PAYMENTS VIEW
// ============================================

/**
 * Render payments view
 */
function renderPaymentsView() {
  const state = appState.getFullState();
  const payments = [...state.payments];

  const paymentsView = document.createElement('div');
  paymentsView.className = 'payments-view';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <div>
      <h1>Payments</h1>
      <p class="text-muted">Track all deposits and payments</p>
    </div>
    <button class="btn btn-primary" data-action="record-payment">${SVG.creditCard} Record Payment</button>
  `;
  paymentsView.appendChild(header);

  // Summary
  const summary = document.createElement('div');
  summary.className = 'metrics-grid';
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  summary.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total Received</div>
      <div class="metric-value">${formatCurrency(totalReceived)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Payments</div>
      <div class="metric-value">${payments.length}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Average Payment</div>
      <div class="metric-value">${payments.length > 0 ? formatCurrency(totalReceived / payments.length) : 'R0.00'}</div>
    </div>
  `;
  paymentsView.appendChild(summary);

  // Payments table
  const paymentsContainer = document.createElement('div');
  paymentsContainer.className = 'payments-container';

  if (payments.length === 0) {
    paymentsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-content">
          <h2>No payments recorded</h2>
          <p>Start recording payments to track your cash flow.</p>
          <button class="btn btn-primary" data-action="record-payment">Record First Payment</button>
        </div>
      </div>
    `;
  } else {
    const paymentsTable = document.createElement('div');
    paymentsTable.className = 'payments-table';
    paymentsTable.innerHTML = `
      <div class="table-header">
        <div class="th">Date</div>
        <div class="th">Project</div>
        <div class="th">Client</div>
        <div class="th">Amount</div>
        <div class="th">Method</div>
        <div class="th">Reference</div>
        <div class="th">Actions</div>
      </div>
      <div class="table-body">
        ${payments.map(payment => {
          const project = appState.getProject(payment.projectId);
          const client = project ? appState.getClient(project.clientId) : null;

          return `
            <div class="table-row" data-payment-id="${payment.id}">
              <div class="td" data-label="Date">${formatDate(payment.date)}</div>
              <div class="td" data-label="Project">${project ? escapeHtml(project.projectName) : 'Unknown Project'}</div>
              <div class="td" data-label="Client">${client ? escapeHtml(client.fullName) : '-'}</div>
              <div class="td" data-label="Amount"><strong>${formatCurrency(payment.amount)}</strong></div>
              <div class="td" data-label="Method">${payment.method}</div>
              <div class="td" data-label="Reference">${escapeHtml(payment.reference || '-')}</div>
              <div class="td actions">
                <button class="btn btn-ghost btn-icon" data-action="edit-payment" aria-label="Edit payment" title="Edit">${SVG.edit}</button>
                <button class="btn btn-ghost btn-icon btn-icon-danger" data-action="delete-payment" aria-label="Delete payment" title="Delete">${SVG.trash}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    paymentsTable.addEventListener('click', (e) => {
      const row = e.target.closest('.table-row');
      if (!row) return;

      const paymentId = row.getAttribute('data-payment-id');
      const action = e.target.closest('[data-action]')?.getAttribute('data-action');

      if (action === 'delete-payment') {
        if (confirm('Delete this payment?')) {
          appState.deletePayment(paymentId);
          success('Payment deleted');
        }
      }
    });

    paymentsContainer.appendChild(paymentsTable);
  }

  paymentsView.appendChild(paymentsContainer);

  // Add event listener
  paymentsView.querySelector('[data-action="record-payment"]')?.addEventListener('click', () => {
    openPaymentModal();
  });

  document.querySelector('main').appendChild(paymentsView);
}

// ============================================
// CALENDAR VIEW
// ============================================

/**
 * Render calendar/deadlines view
 */
function renderCalendarView() {
  const state = appState.getFullState();
  const projects = state.projects;

  const calendarView = document.createElement('div');
  calendarView.className = 'calendar-view';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <h1>Deadlines & Calendar</h1>
    <p class="text-muted">Track project deadlines and important dates</p>
  `;
  calendarView.appendChild(header);

  // Deadline categories
  const today = new Date();
  const today_str = today.toISOString().split('T')[0];

  const overdue = getOverdueProjects(projects);
  const dueToday = projects.filter(p => 
    !['Completed', 'Cancelled'].includes(p.status) && p.dueDate === today_str
  );
  const dueThisWeek = projects.filter(p => {
    if (['Completed', 'Cancelled'].includes(p.status)) return false;
    if (!p.dueDate) return false;
    const days = daysUntil(p.dueDate);
    return days > 0 && days <= 7;
  });
  const upcoming = getProjectsDueSoon(projects).filter(p => daysUntil(p.dueDate) > 7);

  const sections = document.createElement('div');
  sections.className = 'deadline-sections';

  // Overdue section
  if (overdue.length > 0) {
    const overdueSection = createDeadlineSection('Overdue', overdue, 'danger', projects);
    sections.appendChild(overdueSection);
  }

  // Due today
  if (dueToday.length > 0) {
    const todaySection = createDeadlineSection('Due Today', dueToday, 'warning', projects);
    sections.appendChild(todaySection);
  }

  // Due this week
  if (dueThisWeek.length > 0) {
    const weekSection = createDeadlineSection('Due This Week', dueThisWeek, 'info', projects);
    sections.appendChild(weekSection);
  }

  // Upcoming
  if (upcoming.length > 0) {
    const upcomingSection = createDeadlineSection('Upcoming — Next 30 Days', upcoming, '', projects);
    sections.appendChild(upcomingSection);
  }

  if (overdue.length === 0 && dueToday.length === 0 && dueThisWeek.length === 0 && upcoming.length === 0) {
    sections.innerHTML = `
      <div class="empty-state">
        <p>No deadlines coming up. Great work!</p>
      </div>
    `;
  }

  calendarView.appendChild(sections);

  document.querySelector('main').appendChild(calendarView);
}

/**
 * Create a deadline section
 * @param {string} title - Section title
 * @param {Array} projects - Projects for section
 * @param {string} className - CSS class for styling
 * @param {Array} allProjects - All projects reference
 * @returns {HTMLElement}
 */
function createDeadlineSection(title, projects, className, allProjects) {
  const section = document.createElement('section');
  section.className = `card deadline-section ${className}`;

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `<h2>${title} (${projects.length})</h2>`;
  section.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-body';

  const list = document.createElement('div');
  list.className = 'deadline-list';
  list.innerHTML = projects.map(project => {
    const daysLeft = daysUntil(project.dueDate);
    const client = appState.getClient(project.clientId);

    return `
      <div class="deadline-item" data-project-id="${project.id}">
        <div class="deadline-info">
          <h3>${escapeHtml(project.projectName)}</h3>
          <p class="text-muted">${client ? escapeHtml(client.fullName) : 'Unknown Client'}</p>
          <p class="text-muted">${formatDate(project.dueDate)}</p>
        </div>
        <div class="deadline-meta">
          <span class="status-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}">${project.status}</span>
          <span class="priority-badge priority-${project.priority.toLowerCase()}">${project.priority}</span>
          <button class="btn btn-sm btn-outline" data-action="view-project" aria-label="View project">View</button>
        </div>
      </div>
    `;
  }).join('');

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="view-project"]');
    if (btn) {
      const projectId = btn.closest('.deadline-item').getAttribute('data-project-id');
      openProjectDetails(projectId);
    }
  });

  body.appendChild(list);
  section.appendChild(body);

  return section;
}

// ============================================
// REPORTS VIEW
// ============================================

/**
 * Render reports view
 */
function renderReportsView() {
  const state = appState.getFullState();
  const metrics = calculateMetrics(state);

  const reportsView = document.createElement('div');
  reportsView.className = 'reports-view';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <h1>Reports & Analytics</h1>
    <p class="text-muted">Business metrics and insights</p>
  `;
  reportsView.appendChild(header);

  // Key metrics
  const metricsSection = document.createElement('section');
  metricsSection.className = 'card';
  metricsSection.innerHTML = `
    <div class="card-header">
      <h2>Key Performance Indicators</h2>
    </div>
    <div class="card-body">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Client Retention Rate</div>
          <div class="metric-value">${calculateClientRetention(state)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Project Completion Rate</div>
          <div class="metric-value">${calculateCompletionRate(state)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average Project Value</div>
          <div class="metric-value">${calculateAverageProjectValue(state)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Payment Collection Rate</div>
          <div class="metric-value">${calculatePaymentCollectionRate(state)}%</div>
        </div>
      </div>
    </div>
  `;
  reportsView.appendChild(metricsSection);

  // Status breakdown
  const statusSection = document.createElement('section');
  statusSection.className = 'card';
  const statusBreakdown = getStatusBreakdown(state.projects);
  const statusHtml = Object.entries(statusBreakdown)
    .map(([status, count]) => `
      <div class="report-item">
        <span>${status}</span>
        <span class="badge">${count}</span>
      </div>
    `).join('');

  statusSection.innerHTML = `
    <div class="card-header">
      <h2>Projects by Status</h2>
    </div>
    <div class="card-body">
      <div class="report-list">
        ${statusHtml}
      </div>
    </div>
  `;
  reportsView.appendChild(statusSection);

  // Export report button
  const exportSection = document.createElement('section');
  exportSection.className = 'card';
  exportSection.innerHTML = `
    <div class="card-header">
      <h2>Export Report</h2>
    </div>
    <div class="card-body">
      <p>Generate and download a detailed data report:</p>
      <button class="btn btn-secondary" data-action="download-report">${SVG.download} Download Report</button>
    </div>
  `;
  reportsView.appendChild(exportSection);

  // Add event listener
  reportsView.querySelector('[data-action="download-report"]')?.addEventListener('click', () => {
    const report = generateDataReport(state);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lz-clientflow-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Report downloaded');
  });

  document.querySelector('main').appendChild(reportsView);
}

/**
 * Calculate client retention rate
 * @param {Object} state - App state
 * @returns {number} Percentage
 */
function calculateClientRetention(state) {
  if (state.clients.length === 0) return 0;
  const clientsWithMultipleProjects = state.clients.filter(c => 
    state.projects.filter(p => p.clientId === c.id).length > 1
  ).length;
  return Math.round((clientsWithMultipleProjects / state.clients.length) * 100);
}

/**
 * Calculate project completion rate
 * @param {Object} state - App state
 * @returns {number} Percentage
 */
function calculateCompletionRate(state) {
  if (state.projects.length === 0) return 0;
  const completed = state.projects.filter(p => p.status === 'Completed').length;
  return Math.round((completed / state.projects.length) * 100);
}

/**
 * Calculate average project value
 * @param {Object} state - App state
 * @returns {string} Formatted currency
 */
function calculateAverageProjectValue(state) {
  if (state.projects.length === 0) return 'R0.00';
  const total = state.projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  return formatCurrency(total / state.projects.length);
}

/**
 * Calculate payment collection rate
 * @param {Object} state - App state
 * @returns {number} Percentage
 */
function calculatePaymentCollectionRate(state) {
  const totalValue = state.projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalReceived = state.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  if (totalValue === 0) return 0;
  return Math.round((totalReceived / totalValue) * 100);
}

// ============================================
// SETTINGS VIEW
// ============================================

/**
 * Render settings view
 */
function renderSettingsView() {
  const settingsView = document.createElement('div');
  settingsView.className = 'settings-view';

  // Header
  const header = document.createElement('div');
  header.className = 'view-header';
  header.innerHTML = `
    <h1>Settings</h1>
    <p class="text-muted">Manage application preferences and data</p>
  `;
  settingsView.appendChild(header);

  // Appearance settings
  const appearanceSection = document.createElement('section');
  appearanceSection.className = 'card';
  const settings = appState.getSettings();

  appearanceSection.innerHTML = `
    <div class="card-header">
      <h2>Appearance</h2>
    </div>
    <div class="card-body">
      <div class="settings-group">
        <label>
          <span>Dark Mode</span>
          <input type="checkbox" class="setting-toggle" id="dark-mode-setting" ${settings.darkMode ? 'checked' : ''}>
        </label>
      </div>
    </div>
  `;
  settingsView.appendChild(appearanceSection);

  // Data management
  const dataSection = document.createElement('section');
  dataSection.className = 'card';
  dataSection.innerHTML = `
    <div class="card-header">
      <h2>Data Management</h2>
    </div>
    <div class="card-body">
      <div class="settings-group">
        <h3>Privacy</h3>
        <p class="text-muted">
          All your data is stored locally in your browser's storage (localStorage). 
          No data is sent to external servers or databases. You have complete control 
          over your information.
        </p>
      </div>
      
      <div class="settings-group">
        <h3>Export & Import</h3>
        <p class="text-muted">Back up your data or migrate to another browser/device.</p>
        <div class="settings-buttons">
          <button class="btn btn-secondary" data-action="export-json">${SVG.download} Export as JSON</button>
          <button class="btn btn-secondary" data-action="export-csv">${SVG.download} Export as CSV</button>
          <button class="btn btn-secondary" data-action="import-json">${SVG.upload} Import from JSON</button>
        </div>
      </div>
      
      <div class="settings-group">
        <h3>Demo Data</h3>
        <p class="text-muted">Load sample data to explore the application features.</p>
        <button class="btn btn-secondary" data-action="load-demo">${SVG.refresh} Load Demo Data</button>
      </div>
      
      <div class="settings-group danger">
        <h3>Reset Application</h3>
        <p class="text-muted">Permanently delete all data and start fresh.</p>
        <button class="btn btn-danger" data-action="reset-data">${SVG.trash} Reset All Data</button>
      </div>
    </div>
  `;
  settingsView.appendChild(dataSection);

  // Application info
  const infoSection = document.createElement('section');
  infoSection.className = 'card';
  infoSection.innerHTML = `
    <div class="card-header">
      <h2>About</h2>
    </div>
    <div class="card-body">
      <div class="app-info">
        <h3>LZ ClientFlow</h3>
        <p>Client and Project Management System</p>
        <p class="text-muted">Version 1.0.0</p>
        <p class="text-muted">
          Built with HTML, CSS, and JavaScript<br>
          For LZ Solutions
        </p>
      </div>
    </div>
  `;
  settingsView.appendChild(infoSection);

  // Add event listeners
  settingsView.querySelector('#dark-mode-setting')?.addEventListener('change', (e) => {
    appState.setDarkMode(e.target.checked);
    applyTheme(e.target.checked);
    updateThemeToggle(e.target.checked);
  });

  settingsView.querySelector('[data-action="export-json"]')?.addEventListener('click', handleExportJSON);
  settingsView.querySelector('[data-action="export-csv"]')?.addEventListener('click', handleExportCSV);
  settingsView.querySelector('[data-action="import-json"]')?.addEventListener('click', () => {
    document.querySelector('#import-file-input')?.click();
  });
  settingsView.querySelector('[data-action="load-demo"]')?.addEventListener('click', loadDemoData);
  settingsView.querySelector('[data-action="reset-data"]')?.addEventListener('click', handleResetData);

  document.querySelector('main').appendChild(settingsView);
}

// ============================================
// DETAIL VIEWS
// ============================================

/**
 * Open client details view in modal
 * @param {string} clientId - Client ID
 */
function openClientDetails(clientId) {
  const client = appState.getClient(clientId);
  if (!client) {
    error('Client not found');
    return;
  }

  const modal = createModal('Client Details');
  const projects = appState.getProjectsByClient(clientId);

  const content = document.createElement('div');
  content.className = 'detail-content';
  content.innerHTML = `
    <div class="detail-section">
      <h2>${escapeHtml(client.fullName)}</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">Business:</span>
          <span>${escapeHtml(client.businessName || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="label">Email:</span>
          <span>${escapeHtml(client.email || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="label">Phone:</span>
          <span>${escapeHtml(client.phone || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="label">WhatsApp:</span>
          <span>${escapeHtml(client.whatsapp || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="label">Location:</span>
          <span>${escapeHtml(client.location || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="label">Preferred Contact:</span>
          <span>${escapeHtml(client.preferredContact || '-')}</span>
        </div>
        <div class="detail-item">
          <span class="label">Added:</span>
          <span>${formatDate(client.dateAdded)}</span>
        </div>
      </div>
      ${client.notes ? `
        <div class="detail-notes">
          <h3>Notes</h3>
          <p>${escapeHtml(client.notes)}</p>
        </div>
      ` : ''}
      <div class="detail-projects">
        <h3>Projects (${projects.length})</h3>
        ${projects.length === 0 ? '<p class="text-muted">No projects</p>' : `
          <div class="projects-list">
            ${projects.map(p => `
              <div class="project-item">
                <h4>${escapeHtml(p.projectName)}</h4>
                <p class="text-muted">${formatDate(p.createdDate)}</p>
                <span class="status-badge status-${p.status.toLowerCase().replace(/\s+/g, '-')}">${p.status}</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  modal.querySelector('.modal-body').appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="btn btn-secondary" data-action="close-modal">Close</button>
    <button class="btn btn-primary" data-action="edit-modal">Edit Client</button>
  `;
  modal.querySelector('.modal-content').appendChild(footer);

  footer.querySelector('[data-action="close-modal"]').addEventListener('click', () => closeModal(modal));
  footer.querySelector('[data-action="edit-modal"]').addEventListener('click', () => {
    closeModal(modal);
    currentClientEditingId = clientId;
    openClientModal(clientId);
  });

  showModal(modal);
}

/**
 * Open project details view in modal
 * @param {string} projectId - Project ID
 */
function openProjectDetails(projectId) {
  const project = appState.getProject(projectId);
  if (!project) {
    error('Project not found');
    return;
  }

  const client = appState.getClient(project.clientId);
  const payments = appState.getPaymentsByProject(projectId);

  const modal = createModal('Project Details');

  const content = document.createElement('div');
  content.className = 'detail-content';
  content.innerHTML = `
    <div class="detail-section">
      <div class="detail-header">
        <h2>${escapeHtml(project.projectName)}</h2>
        <span class="status-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}">${project.status}</span>
      </div>
      
      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">Client:</span>
          <span>${client ? escapeHtml(client.fullName) : 'Unknown'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Type:</span>
          <span>${project.type}</span>
        </div>
        <div class="detail-item">
          <span class="label">Package:</span>
          <span>${project.package || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Priority:</span>
          <span class="priority-badge priority-${project.priority.toLowerCase()}">${project.priority}</span>
        </div>
        <div class="detail-item">
          <span class="label">Start Date:</span>
          <span>${formatDate(project.startDate)}</span>
        </div>
        <div class="detail-item">
          <span class="label">Due Date:</span>
          <span>${formatDate(project.dueDate)}</span>
        </div>
      </div>

      <div class="detail-progress">
        <h3>Progress</h3>
        <div class="progress-section">
          <div class="progress-header">
            <span>${project.progress}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${project.progress}%"></div>
          </div>
        </div>
      </div>

      <div class="detail-finances">
        <h3>Finances</h3>
        <div class="finance-grid">
          <div class="finance-item">
            <span class="label">Total Price:</span>
            <span class="amount">${formatCurrency(project.totalPrice)}</span>
          </div>
          <div class="finance-item">
            <span class="label">Deposit Required:</span>
            <span class="amount">${formatCurrency(project.depositRequired)}</span>
          </div>
          <div class="finance-item">
            <span class="label">Deposit Received:</span>
            <span class="amount success">${formatCurrency(project.depositReceived)}</span>
          </div>
          <div class="finance-item">
            <span class="label">Outstanding Balance:</span>
            <span class="amount alert">${formatCurrency(project.outstandingBalance)}</span>
          </div>
          <div class="finance-item">
            <span class="label">Payment Status:</span>
            <span class="status-badge">${project.paymentStatus}</span>
          </div>
        </div>
      </div>

      ${project.milestones && project.milestones.length > 0 ? `
        <div class="detail-milestones">
          <h3>Milestones</h3>
          <div class="milestones-list">
            ${project.milestones.map(m => `
              <div class="milestone-item ${m.completed ? 'completed' : ''}">
                <span class="milestone-check">${m.completed ? '✓' : '○'}</span>
                <span class="milestone-name">${escapeHtml(m.name)}</span>
                <span class="text-muted">${formatDate(m.date)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${payments.length > 0 ? `
        <div class="detail-payments">
          <h3>Payments (${payments.length})</h3>
          <div class="payments-list">
            ${payments.map(p => `
              <div class="payment-item">
                <div class="payment-info">
                  <span class="amount">${formatCurrency(p.amount)}</span>
                  <span class="text-muted">${formatDate(p.date)}</span>
                  <span class="text-muted">${p.method}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${project.notes ? `
        <div class="detail-notes">
          <h3>Notes</h3>
          <p>${escapeHtml(project.notes)}</p>
        </div>
      ` : ''}
    </div>
  `;

  modal.querySelector('.modal-body').appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="btn btn-secondary" data-action="close-modal">Close</button>
    <button class="btn btn-primary" data-action="edit-modal">Edit Project</button>
  `;
  modal.querySelector('.modal-content').appendChild(footer);

  footer.querySelector('[data-action="close-modal"]').addEventListener('click', () => closeModal(modal));
  footer.querySelector('[data-action="edit-modal"]').addEventListener('click', () => {
    closeModal(modal);
    currentEditingId = projectId;
    openProjectModal(projectId);
  });

  showModal(modal);
}

// ============================================
// MODALS - CLIENT
// ============================================

/**
 * Open client form modal
 * @param {string} clientId - Client ID to edit (optional)
 */
function openClientModal(clientId = null) {
  const isEdit = !!clientId;
  const client = isEdit ? appState.getClient(clientId) : null;

  if (isEdit && !client) {
    error('Client not found');
    return;
  }

  const modal = createModal(isEdit ? 'Edit Client' : 'Add New Client');
  const form = document.createElement('form');
  form.className = 'client-form';
  form.noValidate = true;

  const formData = client ? deepClone(client) : {
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    preferredContact: 'Email',
    notes: ''
  };

  form.innerHTML = `
    <div class="form-group">
      <label for="client-fullName">Full Name *</label>
      <input 
        type="text" 
        id="client-fullName" 
        name="fullName" 
        value="${escapeHtml(formData.fullName)}" 
        placeholder="e.g., John Smith"
        required
      >
    </div>

    <div class="form-group">
      <label for="client-businessName">Business Name</label>
      <input 
        type="text" 
        id="client-businessName" 
        name="businessName" 
        value="${escapeHtml(formData.businessName || '')}" 
        placeholder="e.g., Smith's Legal Services"
      >
    </div>

    <div class="form-group">
      <label for="client-email">Email</label>
      <input 
        type="email" 
        id="client-email" 
        name="email" 
        value="${escapeHtml(formData.email || '')}" 
        placeholder="john@example.com"
      >
    </div>

    <div class="form-group">
      <label for="client-phone">Phone</label>
      <input 
        type="tel" 
        id="client-phone" 
        name="phone" 
        value="${escapeHtml(formData.phone || '')}" 
        placeholder="+27 11 234 5678"
      >
    </div>

    <div class="form-group">
      <label for="client-whatsapp">WhatsApp</label>
      <input 
        type="tel" 
        id="client-whatsapp" 
        name="whatsapp" 
        value="${escapeHtml(formData.whatsapp || '')}" 
        placeholder="+27 82 123 4567"
      >
    </div>

    <div class="form-group">
      <label for="client-location">Location</label>
      <input 
        type="text" 
        id="client-location" 
        name="location" 
        value="${escapeHtml(formData.location || '')}" 
        placeholder="e.g., Johannesburg"
      >
    </div>

    <div class="form-group">
      <label for="client-preferredContact">Preferred Contact Method</label>
      <select id="client-preferredContact" name="preferredContact">
        <option value="Email" ${formData.preferredContact === 'Email' ? 'selected' : ''}>Email</option>
        <option value="Phone" ${formData.preferredContact === 'Phone' ? 'selected' : ''}>Phone</option>
        <option value="WhatsApp" ${formData.preferredContact === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
      </select>
    </div>

    <div class="form-group">
      <label for="client-notes">Notes</label>
      <textarea 
        id="client-notes" 
        name="notes" 
        placeholder="Add any notes about this client..."
        rows="4"
      >${escapeHtml(formData.notes || '')}</textarea>
    </div>
  `;

  modal.querySelector('.modal-body').appendChild(form);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const formId = `client-form-${Date.now()}`;
  form.id = formId;
  footer.innerHTML = `
    <button class="btn btn-secondary" data-action="cancel-modal">Cancel</button>
    <button class="btn btn-primary" type="submit" form="${formId}" data-action="submit-client-form">
      ${isEdit ? 'Update Client' : 'Save Client'}
    </button>
  `;
  modal.querySelector('.modal-content').appendChild(footer);

  // Event listeners
  form.addEventListener('submit', (event) => handleClientFormSubmit(
    event,
    { form, modal, footer, isEdit, clientId }
  ));

  footer.querySelector('[data-action="cancel-modal"]').addEventListener('click', () => {
    closeModal(modal);
  });

  showModal(modal);
}

/**
 * Validate, persist, and automate a client/lead form submission.
 * @param {SubmitEvent} event - Form submit event
 * @param {Object} context - Form submission context
 */
async function handleClientFormSubmit(event, { form, modal, footer, isEdit, clientId }) {
  event.preventDefault();
  const submitButton = footer.querySelector('[data-action="submit-client-form"]');

  try {
    const formInputs = Object.fromEntries(new FormData(form).entries());
    const validation = validateClient(formInputs);
    clearFormErrors(form);

    if (!validation.valid) {
      displayFormErrors(form, validation.errors);
      error('Please correct the highlighted fields');
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner" aria-hidden="true"></span> Submitting...';

    let result;
    if (isEdit) {
      result = appState.updateClient(clientId, formInputs);
    } else {
      result = appState.addClient(formInputs);
    }

    if (!result.success) {
      if (result.isDuplicate) {
        warning(result.error);
      } else {
        error(result.error || 'Unable to save client');
      }
      return;
    }

    try {
      await dispatchClientWebhook({
        event: isEdit ? 'client.updated' : 'client.created',
        client: result.client,
        submittedAt: new Date().toISOString()
      });
      success(isEdit ? `${formInputs.fullName} updated and sent to automation` : `${formInputs.fullName} added and sent to automation`);
    } catch (webhookError) {
      console.error('Client webhook dispatch failed:', webhookError);
      warning(`${formInputs.fullName} was saved locally, but automation could not be reached`);
    }

    closeModal(modal);
  } catch (submissionError) {
    console.error('Client form submission failed:', submissionError);
    error('Unable to submit client form. Please try again.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = isEdit ? 'Update Client' : 'Save Client';
  }
}

// ============================================
// MODALS - PROJECT
// ============================================

/**
 * Open project form modal
 * @param {string} projectId - Project ID to edit (optional)
 */
function openProjectModal(projectId = null) {
  const isEdit = !!projectId;
  const project = isEdit ? appState.getProject(projectId) : null;

  if (isEdit && !project) {
    error('Project not found');
    return;
  }

  const state = appState.getFullState();
  const modal = createModal(isEdit ? 'Edit Project' : 'Add New Project');
  const form = document.createElement('form');
  form.className = 'project-form';

  const formData = project ? deepClone(project) : {
    clientId: '',
    projectName: '',
    type: '',
    package: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Lead',
    progress: 0,
    totalPrice: '',
    depositRequired: '',
    priority: 'Medium',
    notes: ''
  };

  const projectTypes = ['Business Website', 'Landing Page', 'E-commerce Website', 'Booking System', 'Website Redesign', 'Automation', 'Maintenance', 'Custom Project'];
  const packages = ['Starter Website — R3 500', 'Advanced Business Website — R4 500', 'Premium Digital Solutions — Starting from R6 000', 'Custom Quotation'];
  const statuses = ['Lead', 'Consultation Scheduled', 'Awaiting Deposit', 'Planning', 'Design', 'Development', 'Client Review', 'Awaiting Final Payment', 'Ready for Launch', 'Completed', 'On Hold', 'Cancelled'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  form.innerHTML = `
    <div class="form-group">
      <label for="project-clientId">Client *</label>
      <select id="project-clientId" name="clientId" required>
        <option value="">Select a client</option>
        ${state.clients.map(c => `
          <option value="${c.id}" ${formData.clientId === c.id ? 'selected' : ''}>
            ${escapeHtml(c.fullName)}
          </option>
        `).join('')}
      </select>
    </div>

    <div class="form-group">
      <label for="project-projectName">Project Name *</label>
      <input 
        type="text" 
        id="project-projectName" 
        name="projectName" 
        value="${escapeHtml(formData.projectName)}" 
        placeholder="e.g., Company Website Redesign"
        required
      >
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="project-type">Type *</label>
        <select id="project-type" name="type" required>
          <option value="">Select type</option>
          ${projectTypes.map(t => `
            <option value="${t}" ${formData.type === t ? 'selected' : ''}>${t}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="project-package">Package</label>
        <select id="project-package" name="package">
          <option value="">Select package</option>
          ${packages.map(p => `
            <option value="${p}" ${formData.package === p ? 'selected' : ''}>${p}</option>
          `).join('')}
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="project-description">Description</label>
      <textarea 
        id="project-description" 
        name="description" 
        placeholder="Project details..."
        rows="3"
      >${escapeHtml(formData.description || '')}</textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="project-startDate">Start Date</label>
        <input 
          type="date" 
          id="project-startDate" 
          name="startDate" 
          value="${formData.startDate || ''}"
        >
      </div>

      <div class="form-group">
        <label for="project-dueDate">Due Date</label>
        <input 
          type="date" 
          id="project-dueDate" 
          name="dueDate" 
          value="${formData.dueDate || ''}"
        >
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="project-status">Status</label>
        <select id="project-status" name="status">
          ${statuses.map(s => `
            <option value="${s}" ${formData.status === s ? 'selected' : ''}>${s}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="project-priority">Priority</label>
        <select id="project-priority" name="priority">
          ${priorities.map(p => `
            <option value="${p}" ${formData.priority === p ? 'selected' : ''}>${p}</option>
          `).join('')}
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="project-progress">Progress (%)</label>
      <input 
        type="number" 
        id="project-progress" 
        name="progress" 
        min="0" 
        max="100" 
        value="${formData.progress}"
      >
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="project-totalPrice">Total Price (R) *</label>
        <input 
          type="number" 
          id="project-totalPrice" 
          name="totalPrice" 
          min="0" 
          step="100" 
          value="${formData.totalPrice || ''}" 
          placeholder="0.00"
          required
        >
      </div>

      <div class="form-group">
        <label for="project-depositRequired">Deposit Required (R)</label>
        <input 
          type="number" 
          id="project-depositRequired" 
          name="depositRequired" 
          min="0" 
          step="100" 
          value="${formData.depositRequired || ''}" 
          placeholder="50% of total"
        >
      </div>
    </div>

    <div class="form-group">
      <label for="project-notes">Notes</label>
      <textarea 
        id="project-notes" 
        name="notes" 
        placeholder="Project notes..."
        rows="3"
      >${escapeHtml(formData.notes || '')}</textarea>
    </div>

    <p class="form-help">
      ${isEdit ? '' : 'Deposit is automatically calculated as 50% of total price unless changed.'}
    </p>
  `;

  modal.querySelector('.modal-body').appendChild(form);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="btn btn-secondary" data-action="cancel-modal">Cancel</button>
    <button class="btn btn-primary" data-action="submit-project-form">
      ${isEdit ? 'Update Project' : 'Create Project'}
    </button>
  `;
  modal.querySelector('.modal-content').appendChild(footer);

  // Event listeners
  footer.querySelector('[data-action="submit-project-form"]').addEventListener('click', () => {
    const formInputs = {
      clientId: form.querySelector('[name="clientId"]').value,
      projectName: form.querySelector('[name="projectName"]').value,
      type: form.querySelector('[name="type"]').value,
      package: form.querySelector('[name="package"]').value || '',
      description: form.querySelector('[name="description"]').value,
      startDate: form.querySelector('[name="startDate"]').value,
      dueDate: form.querySelector('[name="dueDate"]').value,
      status: form.querySelector('[name="status"]').value,
      priority: form.querySelector('[name="priority"]').value,
      progress: parseInt(form.querySelector('[name="progress"]').value) || 0,
      totalPrice: parseFloat(form.querySelector('[name="totalPrice"]').value) || 0,
      depositRequired: form.querySelector('[name="depositRequired"]').value,
      notes: form.querySelector('[name="notes"]').value
    };

    const validation = validateProject(formInputs);
    if (!validation.valid) {
      displayFormErrors(form, validation.errors);
      return;
    }

    let result;
    if (isEdit) {
      result = appState.updateProject(projectId, formInputs);
    } else {
      result = appState.addProject(formInputs);
    }

    if (result.success) {
      closeModal(modal);
      success(isEdit ? `${formInputs.projectName} updated` : `${formInputs.projectName} added`);
    } else {
      error(result.error);
      if (result.errors) {
        displayFormErrors(form, result.errors);
      }
    }
  });

  footer.querySelector('[data-action="cancel-modal"]').addEventListener('click', () => {
    closeModal(modal);
  });

  showModal(modal);
}

// ============================================
// MODALS - PAYMENT
// ============================================

/**
 * Open payment recording modal
 * @param {string} projectId - Project ID (optional)
 */
function openPaymentModal(projectId = null) {
  const state = appState.getFullState();
  const modal = createModal('Record Payment');
  const form = document.createElement('form');
  form.className = 'payment-form';

  const projects = state.projects.filter(p => !['Completed', 'Cancelled'].includes(p.status));

  form.innerHTML = `
    <div class="form-group">
      <label for="payment-projectId">Project *</label>
      <select id="payment-projectId" name="projectId" required>
        <option value="">Select a project</option>
        ${projects.map(p => {
          const client = appState.getClient(p.clientId);
          return `
            <option value="${p.id}" ${projectId === p.id ? 'selected' : ''}>
              ${escapeHtml(p.projectName)} - ${client ? escapeHtml(client.fullName) : 'Unknown'} (${formatCurrency(p.outstandingBalance)} outstanding)
            </option>
          `;
        }).join('')}
      </select>
    </div>

    <div class="form-group">
      <label for="payment-amount">Amount (R) *</label>
      <input 
        type="number" 
        id="payment-amount" 
        name="amount" 
        min="0" 
        step="0.01" 
        placeholder="0.00"
        required
      >
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="payment-date">Date *</label>
        <input 
          type="date" 
          id="payment-date" 
          name="date" 
          value="${new Date().toISOString().split('T')[0]}"
          required
        >
      </div>

      <div class="form-group">
        <label for="payment-method">Method *</label>
        <select id="payment-method" name="method" required>
          <option value="">Select method</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label for="payment-reference">Reference (e.g., transaction ID)</label>
      <input 
        type="text" 
        id="payment-reference" 
        name="reference" 
        placeholder="Bank reference, cheque number, etc."
      >
    </div>

    <div class="form-group">
      <label for="payment-note">Note</label>
      <input 
        type="text" 
        id="payment-note" 
        name="note" 
        placeholder="Optional note about this payment"
      >
    </div>
  `;

  modal.querySelector('.modal-body').appendChild(form);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="btn btn-secondary" data-action="cancel-modal">Cancel</button>
    <button class="btn btn-primary" data-action="submit-payment-form">Record Payment</button>
  `;
  modal.querySelector('.modal-content').appendChild(footer);

  // Event listeners
  footer.querySelector('[data-action="submit-payment-form"]').addEventListener('click', () => {
    const formInputs = {
      projectId: form.querySelector('[name="projectId"]').value,
      amount: parseFloat(form.querySelector('[name="amount"]').value) || 0,
      date: form.querySelector('[name="date"]').value,
      method: form.querySelector('[name="method"]').value,
      reference: form.querySelector('[name="reference"]').value,
      note: form.querySelector('[name="note"]').value
    };

    const validation = validatePayment(formInputs);
    if (!validation.valid) {
      displayFormErrors(form, validation.errors);
      return;
    }

    const project = appState.getProject(formInputs.projectId);
    if (project.outstandingBalance < formInputs.amount) {
      const shouldOverpay = confirm(
        `This payment (R${formInputs.amount.toFixed(2)}) exceeds the outstanding balance (R${project.outstandingBalance.toFixed(2)}) by R${(formInputs.amount - project.outstandingBalance).toFixed(2)}.\n\nContinue?`
      );
      if (!shouldOverpay) return;
    }

    const result = appState.recordPayment(formInputs);

    if (result.success) {
      closeModal(modal);
      success(`Payment of R${formInputs.amount.toFixed(2)} recorded`);
    } else if (result.wouldOverpay) {
      warning(result.error);
    } else {
      error(result.error);
      if (result.errors) {
        displayFormErrors(form, result.errors);
      }
    }
  });

  footer.querySelector('[data-action="cancel-modal"]').addEventListener('click', () => {
    closeModal(modal);
  });

  showModal(modal);
}

// ============================================
// MODAL UTILITIES
// ============================================

/**
 * Create a modal element
 * @param {string} title - Modal title
 * @returns {HTMLElement}
 */
function createModal(title) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.addEventListener('click', () => closeModal(modal));
  modal.appendChild(backdrop);

  const content = document.createElement('div');
  content.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2 id="modal-title">${title}</h2>
    <button class="modal-close" data-action="close-modal" aria-label="Close modal">&times;</button>
  `;
  header.querySelector('[data-action="close-modal"]').addEventListener('click', () => closeModal(modal));
  content.appendChild(header);

  const body = document.createElement('div');
  body.className = 'modal-body';
  content.appendChild(body);

  modal.appendChild(content);

  // Handle Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal(modal);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  return modal;
}

/**
 * Show a modal
 * @param {HTMLElement} modal
 */
function showModal(modal) {
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Close a modal
 * @param {HTMLElement} modal
 */
function closeModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => modal.remove(), 300);
}

/**
 * Close all modals
 */
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => closeModal(m));
}

// ============================================
// HANDLERS - EXPORT/IMPORT
// ============================================

/**
 * Handle JSON export
 */
function handleExportJSON() {
  const state = appState.getFullState();
  exportDataAsJSON(state);
}

/**
 * Handle CSV export
 */
function handleExportCSV() {
  const state = appState.getFullState();
  exportProjectsAsCSV(state.projects, state.clients);
}

/**
 * Handle JSON import
 */
async function handleImportJSON(e) {
  try {
    const file = e.target.files[0];
    if (!file) return;

    const result = await importFromFile(file);
    if (!result.success) return;

    const validation = validateImportData(result.data);
    if (!validation.valid) {
      validation.errors.forEach(err => error(err));
      return;
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warn => warning(warn));
    }

    const shouldImport = confirm(
      `Import ${result.data.clients.length} clients and ${result.data.projects.length} projects?\n\nThis will replace your current data.`
    );

    if (shouldImport) {
      appState.importState(result.data);
      success('Data imported successfully');
    }
  } catch (importError) {
    console.error('Import error:', importError);
    error('Failed to import data. Please try again.');
  } finally {
    e.target.value = '';
  }
}

/**
 * Load demo data
 */
async function loadDemoData() {
  const shouldLoad = confirm(
    'Load demo data? This will add sample clients and projects to help you explore the application.\n\nYour existing data will not be deleted.'
  );

  if (!shouldLoad) return;

  try {
    const response = await fetch('./data/demo-data.json');
    if (!response.ok) throw new Error('Failed to load demo data');
    const demoData = await response.json();
    const currentState = appState.getFullState();

    appState.importState({
      ...currentState,
      clients: [...currentState.clients, ...demoData.clients],
      projects: [...currentState.projects, ...demoData.projects],
      payments: [...currentState.payments, ...demoData.payments]
    });
    success(`Demo data loaded: ${demoData.clients.length} clients, ${demoData.projects.length} projects`);
  } catch (demoError) {
    error('Failed to load demo data: ' + demoError.message);
    console.error('Demo data error:', demoError);
  }
}

/**
 * Handle reset data
 */
function handleResetData() {
  const shouldReset = confirm(
    'Are you sure? This will permanently delete all data and cannot be undone.\n\nMake sure you have a backup.'
  );

  if (!shouldReset) return;

  appState.resetData();
  success('All data has been reset');
  navigateTo('dashboard');
}

// ============================================
// EXPORT
// ============================================

export { closeAllModals };
