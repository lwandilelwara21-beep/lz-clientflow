/**
 * Notifications module for LZ ClientFlow
 * Handles toast notifications
 */

/**
 * Types of notifications
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const NOTIFICATION_TIMEOUT = 4000; // 4 seconds

/**
 * Create and display a notification
 * @param {string} message - Notification message
 * @param {string} type - Type of notification
 * @param {number} timeout - Auto-dismiss timeout in ms
 */
export function notify(message, type = NOTIFICATION_TYPES.INFO, timeout = NOTIFICATION_TIMEOUT) {
  const container = getNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  
  const content = document.createElement('div');
  content.className = 'notification-content';
  content.textContent = message;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'notification-close';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => removeNotification(notification));
  
  notification.appendChild(content);
  notification.appendChild(closeBtn);
  container.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Auto-dismiss
  if (timeout > 0) {
    setTimeout(() => removeNotification(notification), timeout);
  }
  
  return notification;
}

/**
 * Show success notification
 * @param {string} message
 * @param {number} timeout
 */
export function success(message, timeout = NOTIFICATION_TIMEOUT) {
  return notify(message, NOTIFICATION_TYPES.SUCCESS, timeout);
}

/**
 * Show error notification
 * @param {string} message
 * @param {number} timeout
 */
export function error(message, timeout = NOTIFICATION_TIMEOUT) {
  return notify(message, NOTIFICATION_TYPES.ERROR, timeout);
}

/**
 * Show warning notification
 * @param {string} message
 * @param {number} timeout
 */
export function warning(message, timeout = NOTIFICATION_TIMEOUT) {
  return notify(message, NOTIFICATION_TYPES.WARNING, timeout);
}

/**
 * Show info notification
 * @param {string} message
 * @param {number} timeout
 */
export function info(message, timeout = NOTIFICATION_TIMEOUT) {
  return notify(message, NOTIFICATION_TYPES.INFO, timeout);
}

/**
 * Get or create notification container
 * @returns {HTMLElement}
 */
function getNotificationContainer() {
  let container = document.querySelector('.notification-container');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Remove a notification
 * @param {HTMLElement} notification
 */
function removeNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => notification.remove(), 300);
}

/**
 * Clear all notifications
 */
export function clearAll() {
  const container = document.querySelector('.notification-container');
  if (container) {
    container.querySelectorAll('.notification').forEach(n => {
      removeNotification(n);
    });
  }
}
