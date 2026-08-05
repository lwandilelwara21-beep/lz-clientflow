/**
 * Search and filtering module for LZ ClientFlow
 * Handles search queries and filter combinations
 */

import { search, sortByProperty } from './utils.js';

/**
 * Apply multiple filters to projects
 * @param {Array} projects - Projects to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered projects
 */
export function filterProjects(projects, filters = {}) {
  let result = [...projects];

  // Status filter
  if (filters.status && filters.status.length > 0) {
    result = result.filter(p => filters.status.includes(p.status));
  }

  // Priority filter
  if (filters.priority && filters.priority.length > 0) {
    result = result.filter(p => filters.priority.includes(p.priority));
  }

  // Package filter
  if (filters.package && filters.package.length > 0) {
    result = result.filter(p => filters.package.includes(p.package));
  }

  // Payment status filter
  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    result = result.filter(p => filters.paymentStatus.includes(p.paymentStatus));
  }

  // Type filter
  if (filters.type && filters.type.length > 0) {
    result = result.filter(p => filters.type.includes(p.type));
  }

  // Deadline range filter
  if (filters.dateFrom) {
    result = result.filter(p => !p.dueDate || p.dueDate >= filters.dateFrom);
  }

  if (filters.dateTo) {
    result = result.filter(p => !p.dueDate || p.dueDate <= filters.dateTo);
  }

  // Client filter
  if (filters.clientId) {
    result = result.filter(p => p.clientId === filters.clientId);
  }

  return result;
}

/**
 * Apply multiple filters to clients
 * @param {Array} clients - Clients to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered clients
 */
export function filterClients(clients, filters = {}) {
  let result = [...clients];

  // Preferred contact filter
  if (filters.preferredContact && filters.preferredContact.length > 0) {
    result = result.filter(c => filters.preferredContact.includes(c.preferredContact));
  }

  return result;
}

/**
 * Sort projects by various criteria
 * @param {Array} projects - Projects to sort
 * @param {string} sortBy - Sort key
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted projects
 */
export function sortProjects(projects, sortBy = 'newest', order = 'desc') {
  const sortMap = {
    newest: 'createdDate',
    oldest: 'createdDate',
    dueDate: 'dueDate',
    value: 'totalPrice',
    progress: 'progress',
    client: 'clientId',
    updated: 'updatedDate'
  };

  const sortKey = sortMap[sortBy] || sortBy;
  const sortOrder = (sortBy === 'oldest' || order === 'asc') ? 'asc' : 'desc';

  return sortByProperty([...projects], sortKey, sortOrder);
}

/**
 * Sort clients by various criteria
 * @param {Array} clients - Clients to sort
 * @param {string} sortBy - Sort key
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted clients
 */
export function sortClients(clients, sortBy = 'name', order = 'asc') {
  const sortMap = {
    name: 'fullName',
    newest: 'dateAdded',
    oldest: 'dateAdded'
  };

  const sortKey = sortMap[sortBy] || sortBy;
  const sortOrder = (sortBy === 'newest') ? 'desc' : order;

  return sortByProperty([...clients], sortKey, sortOrder);
}

/**
 * Search clients
 * @param {Array} clients - Clients to search
 * @param {string} query - Search query
 * @returns {Array} Matching clients
 */
export function searchClients(clients, query) {
  return search(clients, query, [
    'fullName',
    'businessName',
    'email',
    'phone',
    'whatsapp'
  ]);
}

/**
 * Search projects
 * @param {Array} projects - Projects to search
 * @param {string} query - Search query
 * @returns {Array} Matching projects
 */
export function searchProjects(projects, query) {
  return search(projects, query, [
    'projectName',
    'description',
    'type',
    'package'
  ]);
}

/**
 * Get available filter options
 * @param {Object} state - Application state
 * @returns {Object} Available filter options
 */
export function getFilterOptions(state) {
  const projects = state.projects || [];
  const clients = state.clients || [];

  return {
    statuses: [...new Set(projects.map(p => p.status))].sort(),
    priorities: ['Low', 'Medium', 'High', 'Urgent'],
    packages: [...new Set(projects.map(p => p.package).filter(Boolean))].sort(),
    types: [...new Set(projects.map(p => p.type))].sort(),
    paymentStatuses: [...new Set(projects.map(p => p.paymentStatus))].sort(),
    preferredContacts: [...new Set(clients.map(c => c.preferredContact).filter(Boolean))].sort(),
    clients: clients.map(c => ({ id: c.id, name: c.fullName }))
  };
}

/**
 * Build filter summary string
 * @param {Object} filters - Current filters
 * @param {Array} clients - All clients
 * @returns {string} Filter description
 */
export function getFilterSummary(filters, clients = []) {
  const parts = [];

  if (filters.status && filters.status.length > 0) {
    parts.push(`Status: ${filters.status.join(', ')}`);
  }

  if (filters.priority && filters.priority.length > 0) {
    parts.push(`Priority: ${filters.priority.join(', ')}`);
  }

  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    parts.push(`Payment: ${filters.paymentStatus.join(', ')}`);
  }

  if (filters.clientId) {
    const client = clients.find(c => c.id === filters.clientId);
    if (client) {
      parts.push(`Client: ${client.fullName}`);
    }
  }

  return parts.length > 0 ? parts.join(' • ') : 'No filters applied';
}
