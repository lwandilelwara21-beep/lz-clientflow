/**
 * Form validation module for LZ ClientFlow
 * Handles validation rules and error display
 */

import { isValidEmail, isValidPhone } from './utils.js';

/**
 * Validation error result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {Object} errors - Field-level errors
 */

/**
 * Validate a client form
 * @param {Object} data - Client data to validate
 * @returns {ValidationResult}
 */
export function validateClient(data) {
  const errors = {};

  // Name is required
  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Phone number must be at least 10 digits';
  }

  // WhatsApp validation
  if (data.whatsapp && !isValidPhone(data.whatsapp)) {
    errors.whatsapp = 'WhatsApp number must be at least 10 digits';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate a project form
 * @param {Object} data - Project data to validate
 * @returns {ValidationResult}
 */
export function validateProject(data) {
  const errors = {};

  // Project name is required
  if (!data.projectName || !data.projectName.trim()) {
    errors.projectName = 'Project name is required';
  }

  // Client ID is required
  if (!data.clientId) {
    errors.clientId = 'Please select a client';
  }

  // Type is required
  if (!data.type) {
    errors.type = 'Project type is required';
  }

  // Due date validation
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.dueDate = 'Please enter a valid date';
    }
  }

  // Price validation
  if (data.totalPrice) {
    const price = parseFloat(data.totalPrice);
    if (isNaN(price) || price < 0) {
      errors.totalPrice = 'Price must be a positive number';
    }
  }

  // Deposit validation
  if (data.depositRequired) {
    const deposit = parseFloat(data.depositRequired);
    const total = parseFloat(data.totalPrice);
    if (isNaN(deposit) || deposit < 0) {
      errors.depositRequired = 'Deposit must be a positive number';
    }
    if (total && deposit > total) {
      errors.depositRequired = 'Deposit cannot exceed total price';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate a payment form
 * @param {Object} data - Payment data to validate
 * @returns {ValidationResult}
 */
export function validatePayment(data) {
  const errors = {};

  // Amount is required
  if (!data.amount) {
    errors.amount = 'Amount is required';
  } else {
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
  }

  // Date validation
  if (data.date) {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.date = 'Please enter a valid date';
    }
  }

  // Method is required
  if (!data.method) {
    errors.method = 'Please select a payment method';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Display validation errors in a form
 * @param {HTMLElement} form - Form element
 * @param {Object} errors - Errors object from validation
 */
export function displayFormErrors(form, errors) {
  // Clear previous errors
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  form.querySelectorAll('[aria-invalid="true"]').forEach(el => {
    el.removeAttribute('aria-invalid');
  });

  let firstInvalidField = null;

  // Display new errors
  Object.entries(errors).forEach(([fieldName, message]) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      
      if (!firstInvalidField) {
        firstInvalidField = field;
      }

      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
      
      field.parentElement.appendChild(errorEl);
    }
  });

  // Focus first invalid field
  if (firstInvalidField) {
    firstInvalidField.focus();
  }
}

/**
 * Clear validation errors from a form
 * @param {HTMLElement} form - Form element
 */
export function clearFormErrors(form) {
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  form.querySelectorAll('[aria-invalid]').forEach(el => {
    el.removeAttribute('aria-invalid');
  });
}

/**
 * Validate a form hasn't changed (used for cancellation)
 * @param {Object} original - Original data
 * @param {Object} current - Current form data
 * @returns {boolean} True if data has changed
 */
export function hasFormChanged(original, current) {
  return JSON.stringify(original) !== JSON.stringify(current);
}
