/**
 * Turnos Module
 * Handles automatic form submission when date filter changes
 */

(function() {
  'use strict';

  /**
   * Initializes the turnos date filter functionality
   */
  function initTurnosDateFilter() {
    const fechaInput = document.querySelector('form[action="/turnos"] input[name="fecha"]');

    if (!fechaInput) {
      return;
    }

    fechaInput.addEventListener('change', () => {
      const form = fechaInput.form;
      if (!form) {
        return;
      }

      // Use requestSubmit if available (modern browsers), fallback to submit
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form.submit();
      }
    });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', initTurnosDateFilter);
})();
