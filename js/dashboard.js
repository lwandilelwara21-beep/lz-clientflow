/**
 * Dashboard calculations and data aggregation for LZ ClientFlow
 * Calculates metrics and statistics from application state
 */

import { daysUntil, isPast } from './utils.js';

/**
 * Calculate dashboard metrics
 * @param {Object} state - Application state
 * @returns {Object} Dashboard metrics
 */
export function calculateMetrics(state) {
  const clients = state.clients || [];
  const projects = state.projects || [];
  const payments = state.payments || [];

  // Total clients
  const totalClients = clients.length;

  // Project counts
  const activeProjects = projects.filter(p => 
    !['Completed', 'Cancelled', 'On Hold'].includes(p.status)
  ).length;

  const completedProjects = projects.filter(p => p.status === 'Completed').length;

  // Financial metrics
  const totalProjectValue = projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

  const depositsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const outstandingBalance = projects.reduce((sum, p) => 
    sum + (p.outstandingBalance || 0), 0
  );

  // Deadline metrics
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overDueProjects = projects.filter(p => 
    p.dueDate && 
    !['Completed', 'Cancelled'].includes(p.status) &&
    p.dueDate < todayStr
  ).length;

  const dueThisWeek = projects.filter(p => {
    if (!p.dueDate || ['Completed', 'Cancelled'].includes(p.status)) return false;
    const days = daysUntil(p.dueDate);
    return days >= 0 && days <= 7;
  }).length;

  return {
    totalClients,
    activeProjects,
    completedProjects,
    totalProjectValue,
    depositsReceived,
    outstandingBalance,
    overDueProjects,
    dueThisWeek
  };
}

/**
 * Get projects due soon (next 30 days)
 * @param {Array} projects - All projects
 * @returns {Array} Sorted projects
 */
export function getProjectsDueSoon(projects) {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return projects
    .filter(p => {
      if (!p.dueDate || ['Completed', 'Cancelled'].includes(p.status)) return false;
      const dueDate = new Date(p.dueDate);
      return dueDate >= today && dueDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/**
 * Get overdue projects
 * @param {Array} projects - All projects
 * @returns {Array} Overdue projects
 */
export function getOverdueProjects(projects) {
  return projects
    .filter(p => {
      if (['Completed', 'Cancelled'].includes(p.status)) return false;
      return p.dueDate && isPast(p.dueDate);
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

/**
 * Get recent projects
 * @param {Array} projects - All projects
 * @param {number} limit - Number of recent projects to return
 * @returns {Array} Recent projects
 */
export function getRecentProjects(projects, limit = 5) {
  return [...projects]
    .sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate))
    .slice(0, limit);
}

/**
 * Get payment overview
 * @param {Array} projects - All projects
 * @returns {Object} Payment summary
 */
export function getPaymentOverview(projects) {
  const summary = {
    notPaid: 0,
    depositPaid: 0,
    partiallyPaid: 0,
    paidInFull: 0,
    overpaid: 0
  };

  projects.forEach(project => {
    switch (project.paymentStatus) {
      case 'Not Paid':
        summary.notPaid++;
        break;
      case 'Deposit Paid':
      case 'Deposit Partially Paid':
        summary.depositPaid++;
        break;
      case 'Partially Paid':
        summary.partiallyPaid++;
        break;
      case 'Paid in Full':
        summary.paidInFull++;
        break;
      case 'Overpaid':
        summary.overpaid++;
        break;
    }
  });

  return summary;
}

/**
 * Get project status breakdown
 * @param {Array} projects - All projects
 * @returns {Object} Status counts
 */
export function getStatusBreakdown(projects) {
  const statuses = {};

  projects.forEach(project => {
    statuses[project.status] = (statuses[project.status] || 0) + 1;
  });

  return statuses;
}

/**
 * Get projects by priority
 * @param {Array} projects - All projects
 * @returns {Object} Projects grouped by priority
 */
export function getProjectsByPriority(projects) {
  return {
    urgent: projects.filter(p => p.priority === 'Urgent').length,
    high: projects.filter(p => p.priority === 'High').length,
    medium: projects.filter(p => p.priority === 'Medium').length,
    low: projects.filter(p => p.priority === 'Low').length
  };
}

/**
 * Get revenue metrics
 * @param {Array} projects - All projects
 * @param {Array} payments - All payments
 * @returns {Object} Revenue breakdown
 */
export function getRevenueMetrics(projects, payments) {
  const totalValue = projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstanding = projects.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0);

  return {
    totalValue,
    totalReceived,
    totalOutstanding,
    percentageReceived: totalValue > 0 ? (totalReceived / totalValue) * 100 : 0
  };
}
