/**
 * Doctor Gate Module
 * Manages doctor selection modal functionality for admin users
 */

(function() {
  'use strict';

  /**
   * Initializes the doctor gate functionality
   */
  function initDoctorGate() {
    const links = document.querySelectorAll('.js-doctor-gate');
    if (!links.length) {
      return;
    }

    const modalElement = document.querySelector('#selectDoctorModal');
    if (!modalElement || !window.bootstrap?.Modal) {
      return;
    }

    const fetchUrl = modalElement.dataset.fetchUrl;
    const modal = new window.bootstrap.Modal(modalElement);
    const form = modalElement.querySelector('form');
    const doctorSelectWrapper = modalElement.querySelector('.js-doctor-select');
    const doctorSelect = modalElement.querySelector('#doctorGateSelect');
    const noDoctorsAlert = modalElement.querySelector('.js-no-doctors');
    const errorAlert = modalElement.querySelector('.js-doctor-error');
    const submitButton = modalElement.querySelector('.js-doctor-submit');
    const modalLabel = modalElement.querySelector('#selectDoctorModalLabel');

    let targetUrl = null;
    let cachedDoctors = null;
    let loadingPromise = null;

    /**
     * Sets or clears error message
     * @param {string|null} message - Error message to display
     */
    const setError = (message) => {
      if (!errorAlert) return;

      if (message) {
        errorAlert.textContent = message;
        errorAlert.classList.remove('d-none');
      } else {
        errorAlert.classList.add('d-none');
        errorAlert.textContent = '';
      }
    };

    /**
     * Populates the doctor select dropdown
     * @param {Array} doctors - Array of doctor objects
     */
    const populateDoctorSelect = (doctors = []) => {
      if (!doctorSelect) return;

      doctorSelect.textContent = '';
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Seleccioná un profesional';
      doctorSelect.appendChild(defaultOption);

      doctors.forEach((doctor) => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = doctor.label;
        doctorSelect.appendChild(option);
      });
    };

    /**
     * Toggles UI state based on doctors availability
     * @param {boolean} hasDoctors - Whether doctors are available
     */
    const toggleState = (hasDoctors) => {
      if (!doctorSelectWrapper || !noDoctorsAlert || !submitButton || !doctorSelect) {
        return;
      }

      if (hasDoctors) {
        doctorSelectWrapper.classList.remove('d-none');
        doctorSelect.disabled = false;
        noDoctorsAlert.classList.add('d-none');
        submitButton.disabled = false;
      } else {
        doctorSelectWrapper.classList.add('d-none');
        doctorSelect.disabled = true;
        noDoctorsAlert.classList.remove('d-none');
        submitButton.disabled = true;
      }
    };

    /**
     * Fetches doctors list from API
     * @returns {Promise<Array>} Array of doctors
     */
    const fetchDoctors = async () => {
      if (cachedDoctors) {
        return cachedDoctors;
      }

      if (!loadingPromise) {
        loadingPromise = fetch(fetchUrl, { headers: { 'Accept': 'application/json' } })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error('No se pudo cargar la lista de médicos');
            }
            const data = await response.json();
            cachedDoctors = data.doctors || [];
            return cachedDoctors;
          })
          .catch((error) => {
            setError(error.message || 'Ocurrió un error inesperado');
            return [];
          });
      }

      return loadingPromise;
    };

    /**
     * Prepares modal for display
     */
    const prepareModal = async () => {
      setError('');

      if (submitButton) {
        submitButton.disabled = true;
      }

      if (doctorSelect) {
        doctorSelect.value = '';
      }

      const doctors = await fetchDoctors();
      populateDoctorSelect(doctors);
      toggleState(doctors.length > 0);

      if (submitButton && doctors.length > 0) {
        submitButton.disabled = false;
      }
    };

    /**
     * Handles click on doctor gate links
     */
    links.forEach((link) => {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        targetUrl = link.dataset.targetUrl || link.getAttribute('href') || window.location.pathname;
        const label = link.dataset.moduleLabel || 'continuar';

        if (modalLabel) {
          modalLabel.textContent = `Elegí un médico para ${label}`;
        }

        await prepareModal();
        modal.show();
      });
    });

    if (!form) {
      return;
    }

    /**
     * Handles form submission
     */
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!submitButton || submitButton.disabled) {
        return;
      }

      if (!doctorSelect || !doctorSelect.value) {
        doctorSelect?.focus();
        return;
      }

      const doctorId = doctorSelect.value;
      submitButton.disabled = true;
      setError('');

      try {
        const response = await fetch('/api/context/doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ doctorId })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'No se pudo guardar la selección');
        }

        const url = new URL(targetUrl || window.location.pathname, window.location.origin);
        url.searchParams.set('doctorId', doctorId);
        window.location.href = url.toString();
      } catch (error) {
        setError(error.message);
        submitButton.disabled = false;
      }
    });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', initDoctorGate);
})();
