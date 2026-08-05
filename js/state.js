/**
 * Central state management for LZ ClientFlow
 * Handles all application state and mutations
 */

import { generateId } from './utils.js';
import { loadFromStorage, saveToStorage } from './storage.js';
import { validateClient, validateProject, validatePayment } from './validation.js';

/**
 * Application state object
 * Manages all clients, projects, payments, and settings
 */
class AppState {
  constructor() {
    this.state = loadFromStorage();
    this.listeners = [];
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    saveToStorage(this.state);
    this.listeners.forEach(listener => listener(this.state));
  }

  // ============================================
  // CLIENT OPERATIONS
  // ============================================

  /**
   * Get all clients
   * @returns {Array}
   */
  getClients() {
    return this.state.clients;
  }

  /**
   * Get client by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getClient(id) {
    return this.state.clients.find(c => c.id === id) || null;
  }

  /**
   * Add a new client
   * @param {Object} clientData
   * @returns {Object} Result
   */
  addClient(clientData) {
    const validation = validateClient(clientData);
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Check for duplicates
    const exists = this.state.clients.some(c => 
      c.fullName.toLowerCase() === clientData.fullName.toLowerCase()
    );

    if (exists) {
      return { 
        success: false, 
        error: 'A client with this name already exists',
        isDuplicate: true 
      };
    }

    const client = {
      id: generateId(),
      ...clientData,
      dateAdded: new Date().toISOString(),
      notes: clientData.notes || ''
    };

    this.state.clients.push(client);
    this.notify();

    return { success: true, client };
  }

  /**
   * Update a client
   * @param {string} id
   * @param {Object} updates
   * @returns {Object} Result
   */
  updateClient(id, updates) {
    const validation = validateClient(updates);
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const client = this.getClient(id);
    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    Object.assign(client, updates);
    this.notify();

    return { success: true, client };
  }

  /**
   * Delete a client
   * @param {string} id
   * @returns {Object} Result
   */
  deleteClient(id) {
    const client = this.getClient(id);
    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    // Get associated projects
    const associatedProjects = this.state.projects.filter(p => p.clientId === id);

    // Remove client
    this.state.clients = this.state.clients.filter(c => c.id !== id);
    
    // Optionally remove associated projects
    if (associatedProjects.length > 0) {
      this.state.projects = this.state.projects.filter(p => p.clientId !== id);
      
      // Remove payments for those projects
      const projectIds = associatedProjects.map(p => p.id);
      this.state.payments = this.state.payments.filter(p => !projectIds.includes(p.projectId));
    }

    this.notify();

    return { success: true, associatedProjects };
  }

  // ============================================
  // PROJECT OPERATIONS
  // ============================================

  /**
   * Get all projects
   * @returns {Array}
   */
  getProjects() {
    return this.state.projects;
  }

  /**
   * Get project by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getProject(id) {
    return this.state.projects.find(p => p.id === id) || null;
  }

  /**
   * Get projects by client ID
   * @param {string} clientId
   * @returns {Array}
   */
  getProjectsByClient(clientId) {
    return this.state.projects.filter(p => p.clientId === clientId);
  }

  /**
   * Add a new project
   * @param {Object} projectData
   * @returns {Object} Result
   */
  addProject(projectData) {
    const validation = validateProject(projectData);
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Verify client exists
    if (!this.getClient(projectData.clientId)) {
      return { success: false, error: 'Selected client not found' };
    }

    const depositRequired = parseFloat(projectData.depositRequired) || 
                           (parseFloat(projectData.totalPrice) * 0.5) || 0;

    const project = {
      id: generateId(),
      ...projectData,
      totalPrice: parseFloat(projectData.totalPrice) || 0,
      depositRequired: depositRequired,
      depositReceived: 0,
      outstandingBalance: parseFloat(projectData.totalPrice) || 0,
      paymentStatus: 'Not Paid',
      progress: parseInt(projectData.progress) || 0,
      status: projectData.status || 'Lead',
      priority: projectData.priority || 'Medium',
      milestones: [],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };

    this.state.projects.push(project);
    this.notify();

    return { success: true, project };
  }

  /**
   * Update a project
   * @param {string} id
   * @param {Object} updates
   * @returns {Object} Result
   */
  updateProject(id, updates) {
    const project = this.getProject(id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Validate if client is being changed
    if (updates.clientId && !this.getClient(updates.clientId)) {
      return { success: false, error: 'Selected client not found' };
    }

    Object.assign(project, updates, { updatedDate: new Date().toISOString() });
    this.notify();

    return { success: true, project };
  }

  /**
   * Delete a project
   * @param {string} id
   * @returns {Object} Result
   */
  deleteProject(id) {
    const project = this.getProject(id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Remove project
    this.state.projects = this.state.projects.filter(p => p.id !== id);

    // Remove associated payments
    this.state.payments = this.state.payments.filter(p => p.projectId !== id);

    this.notify();

    return { success: true };
  }

  /**
   * Update project status
   * @param {string} id
   * @param {string} status
   * @returns {Object} Result
   */
  updateProjectStatus(id, status) {
    const project = this.getProject(id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    project.status = status;
    project.updatedDate = new Date().toISOString();
    
    if (status === 'Completed') {
      project.progress = 100;
    }

    this.notify();
    return { success: true, project };
  }

  /**
   * Update project progress
   * @param {string} id
   * @param {number} progress
   * @returns {Object} Result
   */
  updateProjectProgress(id, progress) {
    const project = this.getProject(id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const safeProgress = Math.min(Math.max(parseInt(progress) || 0, 0), 100);
    project.progress = safeProgress;
    project.updatedDate = new Date().toISOString();

    this.notify();
    return { success: true, project };
  }

  // ============================================
  // PAYMENT OPERATIONS
  // ============================================

  /**
   * Get all payments
   * @returns {Array}
   */
  getPayments() {
    return this.state.payments;
  }

  /**
   * Get payments for a project
   * @param {string} projectId
   * @returns {Array}
   */
  getPaymentsByProject(projectId) {
    return this.state.payments.filter(p => p.projectId === projectId);
  }

  /**
   * Record a payment
   * @param {Object} paymentData
   * @returns {Object} Result
   */
  recordPayment(paymentData) {
    const validation = validatePayment(paymentData);
    
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const project = this.getProject(paymentData.projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const amount = parseFloat(paymentData.amount);

    // Check if payment exceeds project total
    const totalPaid = project.depositReceived + amount;
    if (totalPaid > project.totalPrice && amount !== 0) {
      return {
        success: false,
        error: `Payment would exceed project total of R${project.totalPrice.toFixed(2)}`,
        wouldOverpay: true,
        excessAmount: totalPaid - project.totalPrice
      };
    }

    const payment = {
      id: generateId(),
      ...paymentData,
      amount: amount,
      date: paymentData.date || new Date().toISOString(),
      createdDate: new Date().toISOString()
    };

    this.state.payments.push(payment);

    // Update project payment info
    this.updateProjectPayment(paymentData.projectId);

    return { success: true, payment };
  }

  /**
   * Delete a payment
   * @param {string} id
   * @returns {Object} Result
   */
  deletePayment(id) {
    const payment = this.state.payments.find(p => p.id === id);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    this.state.payments = this.state.payments.filter(p => p.id !== id);
    
    // Recalculate project payment status
    this.updateProjectPayment(payment.projectId);

    return { success: true };
  }

  /**
   * Recalculate and update project payment status
   * @param {string} projectId
   */
  updateProjectPayment(projectId) {
    const project = this.getProject(projectId);
    if (!project) return;

    const projectPayments = this.getPaymentsByProject(projectId);
    const totalReceived = projectPayments.reduce((sum, p) => sum + p.amount, 0);

    project.depositReceived = Math.min(totalReceived, project.depositRequired);
    project.outstandingBalance = Math.max(project.totalPrice - totalReceived, 0);

    // Determine payment status
    if (totalReceived === 0) {
      project.paymentStatus = 'Not Paid';
    } else if (totalReceived < project.depositRequired) {
      project.paymentStatus = 'Deposit Partially Paid';
    } else if (totalReceived === project.depositRequired) {
      project.paymentStatus = 'Deposit Paid';
    } else if (totalReceived < project.totalPrice) {
      project.paymentStatus = 'Partially Paid';
    } else if (totalReceived === project.totalPrice) {
      project.paymentStatus = 'Paid in Full';
    } else {
      project.paymentStatus = 'Overpaid';
    }

    project.updatedDate = new Date().toISOString();
    this.notify();
  }

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  /**
   * Get settings
   * @returns {Object}
   */
  getSettings() {
    return this.state.settings;
  }

  /**
   * Update settings
   * @param {Object} updates
   */
  updateSettings(updates) {
    Object.assign(this.state.settings, updates);
    this.notify();
  }

  /**
   * Set dark mode
   * @param {boolean} enabled
   */
  setDarkMode(enabled) {
    this.state.settings.darkMode = enabled;
    this.state.settings.theme = enabled ? 'dark' : 'light';
    this.notify();
  }

  // ============================================
  // DATA OPERATIONS
  // ============================================

  /**
   * Reset all data
   */
  resetData() {
    this.state = {
      version: '1.0.0',
      clients: [],
      projects: [],
      payments: [],
      settings: this.state.settings
    };
    this.notify();
  }

  /**
   * Import state
   * @param {Object} importedState
   */
  importState(importedState) {
    this.state = {
      ...importedState,
      settings: this.state.settings // Preserve user settings
    };
    this.notify();
  }

  /**
   * Get full state (for export)
   * @returns {Object}
   */
  getFullState() {
    return this.state;
  }
}

// Export singleton instance
export const appState = new AppState();
