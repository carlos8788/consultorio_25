(() => {
  const TABLE_ID = '#tabla-pacientes';
  const FILTER_SELECTOR = '[data-pacientes-filter]';
  const CLEAR_SELECTOR = '[data-pacientes-clear]';
  const DELETE_ACTION_SELECTOR = '[data-action="delete-paciente"]';
  const DELETE_MODAL_ID = '#deletePacienteModal';
  const NUEVO_PACIENTE_FORM_SELECTOR = '[data-nuevo-paciente-form]';
  const NUEVO_PACIENTE_MODAL_ID = '#nuevoPacienteModal';
  const FEEDBACK_MODAL_ID = '#pacienteFeedbackModal';

  const getContainer = () => document.querySelector(TABLE_ID);
  const getDeleteModalElement = () => document.querySelector(DELETE_MODAL_ID);
  const getNuevoPacienteModalElement = () => document.querySelector(NUEVO_PACIENTE_MODAL_ID);
  const getFeedbackModalElement = () => document.querySelector(FEEDBACK_MODAL_ID);

  const setLoading = (el, isLoading) => {
    if (!el) return;
    el.classList.toggle('opacity-50', isLoading);
    el.classList.toggle('pointer-events-none', isLoading);
  };

  const scrollToContainer = (el) => {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchAndSwap = async (url) => {
    const container = getContainer();
    setLoading(container, true);
    try {
      const res = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin'
      });
      if (!res.ok) {
        window.location.href = url;
        return;
      }
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nextContainer = doc.querySelector(TABLE_ID);
      if (!nextContainer) {
        window.location.href = url;
        return;
      }
      container.replaceWith(nextContainer);
      window.history.pushState({}, '', url);
      attachHandlers();
      scrollToContainer(getContainer());
    } catch (err) {
      console.error('No se pudo actualizar el listado por AJAX', err);
      window.location.href = url;
    } finally {
      setLoading(getContainer(), false);
    }
  };

  const attachPaginationHandlers = () => {
    document.querySelectorAll(`${TABLE_ID} .pagination a`).forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const url = link.getAttribute('href');
        if (url) fetchAndSwap(url);
      });
    });
  };

  const attachRowToggleHandlers = () => {
    document.querySelectorAll('.js-row-toggle').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const row = btn.closest('tr');
        if (!row) return;
        const details = row.nextElementSibling;
        if (details && details.classList.contains('row-details')) {
          details.classList.toggle('d-none');
          btn.classList.toggle('btn-outline-secondary');
          btn.classList.toggle('btn-secondary');
          const icon = btn.querySelector('i');
          if (icon) {
            icon.classList.toggle('bi-chevron-down');
            icon.classList.toggle('bi-chevron-up');
          }
        }
      });
    });
  };

  const attachFilterHandler = () => {
    const form = document.querySelector(FILTER_SELECTOR);
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const params = new URLSearchParams();
      formData.forEach((value, key) => {
        if (value) params.append(key, value);
      });
      const action = form.getAttribute('action') || window.location.pathname;
      const url = params.toString() ? `${action}?${params.toString()}` : action;
      fetchAndSwap(url);
    });
  };

  const attachClearHandler = () => {
    const clearBtn = document.querySelector(CLEAR_SELECTOR);
    if (!clearBtn) return;
    clearBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const url = clearBtn.getAttribute('href') || window.location.pathname;
      fetchAndSwap(url);
    });
  };

  const deleteState = {
    id: null,
    doctorId: null
  };

  const setDeleteModalContent = ({ nombre, dni }) => {
    const modalEl = getDeleteModalElement();
    if (!modalEl) return;
    const nombreEl = modalEl.querySelector('[data-delete-paciente-nombre]');
    const dniEl = modalEl.querySelector('[data-delete-paciente-dni]');
    if (nombreEl) {
      nombreEl.textContent = nombre || 'este paciente';
    }
    if (dniEl) {
      dniEl.textContent = dni ? `DNI ${dni}` : '';
      dniEl.classList.toggle('d-none', !dni);
    }
    const errorEl = modalEl.querySelector('[data-delete-error]');
    if (errorEl) {
      errorEl.classList.add('d-none');
      errorEl.textContent = '';
    }
  };

  const setDeleteConfirmLoading = (isLoading) => {
    const modalEl = getDeleteModalElement();
    if (!modalEl) return;
    const confirmBtn = modalEl.querySelector('[data-confirm-delete]');
    if (!confirmBtn) return;
    confirmBtn.disabled = isLoading;
    if (isLoading) {
      confirmBtn.dataset.originalText = confirmBtn.textContent;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Eliminando';
    } else if (confirmBtn.dataset.originalText) {
      confirmBtn.textContent = confirmBtn.dataset.originalText;
      delete confirmBtn.dataset.originalText;
    }
  };

  const setFormSubmitLoading = (form, isLoading) => {
    if (!form) return;
    const submitBtn = form.querySelector('[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (isLoading) {
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando';
    } else if (submitBtn.dataset.originalText) {
      submitBtn.textContent = submitBtn.dataset.originalText;
      delete submitBtn.dataset.originalText;
    }
  };

  const setFeedbackModalState = ({ type, title, message }) => {
    const modalEl = getFeedbackModalElement();
    if (!modalEl) return;
    const titleEl = modalEl.querySelector('[data-feedback-title]');
    const messageEl = modalEl.querySelector('[data-feedback-message]');
    const iconEl = modalEl.querySelector('[data-feedback-icon]');

    if (titleEl) titleEl.textContent = title || '';
    if (messageEl) messageEl.textContent = message || '';

    if (iconEl) {
      iconEl.classList.remove('text-success', 'text-danger', 'bi-check-circle', 'bi-x-circle');
      if (type === 'success') {
        iconEl.classList.add('text-success', 'bi-check-circle');
      } else {
        iconEl.classList.add('text-danger', 'bi-x-circle');
      }
    }
  };

  const showFeedbackModal = ({ type = 'success', title, message }) => {
    const modalEl = getFeedbackModalElement();
    if (!modalEl || !window.bootstrap) return;
    setFeedbackModalState({
      type,
      title: title || (type === 'success' ? 'Paciente guardado' : 'No se pudo guardar el paciente'),
      message: message || (type === 'success'
        ? 'El paciente se registró correctamente.'
        : 'Revisá los datos e intentá nuevamente.')
    });
    const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  };

  const closeNuevoPacienteModal = () => {
    const modalEl = getNuevoPacienteModalElement();
    if (!modalEl || !window.bootstrap) return;
    const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.hide();
  };

  const attachNuevoPacienteFormHandler = () => {
    const form = document.querySelector(NUEVO_PACIENTE_FORM_SELECTOR);
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setFormSubmitLoading(form, true);

      try {
        const formData = new FormData(form);
        const urlParams = new URLSearchParams();
        formData.forEach((value, key) => {
          urlParams.append(key, value);
        });
        const res = await fetch(form.getAttribute('action') || '/pacientes', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: urlParams.toString(),
          credentials: 'same-origin'
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload?.success === false) {
          const message =
            payload?.errors?.[0]?.msg ||
            payload?.error ||
            payload?.message ||
            'No se pudo guardar el paciente.';
          showFeedbackModal({ type: 'error', message });
          return;
        }

        form.reset();
        closeNuevoPacienteModal();
        showFeedbackModal({ type: 'success', message: 'El paciente se guardó correctamente.' });

        if (getContainer()) {
          fetchAndSwap(window.location.href);
        }
      } catch (err) {
        showFeedbackModal({ type: 'error', message: err?.message || 'No se pudo guardar el paciente.' });
      } finally {
        setFormSubmitLoading(form, false);
      }
    });
  };

  const showDeleteError = (message) => {
    const modalEl = getDeleteModalElement();
    if (!modalEl) return;
    const errorEl = modalEl.querySelector('[data-delete-error]');
    if (!errorEl) return;
    errorEl.textContent = message || 'No se pudo eliminar el paciente.';
    errorEl.classList.remove('d-none');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteState.id) return;
    const modalEl = getDeleteModalElement();
    const modalInstance = modalEl && window.bootstrap
      ? window.bootstrap.Modal.getOrCreateInstance(modalEl)
      : null;

    const params = new URLSearchParams();
    if (deleteState.doctorId) {
      params.append('doctorId', deleteState.doctorId);
    }
    const url = params.toString()
      ? `/pacientes/${deleteState.id}?${params.toString()}`
      : `/pacientes/${deleteState.id}`;

    setDeleteConfirmLoading(true);
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json'
        },
        credentials: 'same-origin'
      });

      if (!res.ok) {
        let errorMessage = 'No se pudo eliminar el paciente.';
        try {
          const payload = await res.json();
          if (payload?.error) {
            errorMessage = payload.error;
          }
        } catch {
          // noop
        }
        showDeleteError(errorMessage);
        return;
      }

      if (modalInstance) {
        modalInstance.hide();
      }
      await fetchAndSwap(window.location.href);
    } catch (err) {
      console.error('Error eliminando paciente', err);
      showDeleteError(err?.message || 'No se pudo eliminar el paciente.');
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const attachDeleteHandlers = () => {
    const modalEl = getDeleteModalElement();
    const modalInstance = modalEl && window.bootstrap
      ? window.bootstrap.Modal.getOrCreateInstance(modalEl)
      : null;

    if (modalEl) {
      const confirmBtn = modalEl.querySelector('[data-confirm-delete]');
      if (confirmBtn && !confirmBtn.dataset.bound) {
        confirmBtn.dataset.bound = 'true';
        confirmBtn.addEventListener('click', handleDeleteConfirm);
      }
    }

    document.querySelectorAll(DELETE_ACTION_SELECTOR).forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        deleteState.id = btn.dataset.pacienteId || null;
        deleteState.doctorId = btn.dataset.doctorId || null;
        setDeleteModalContent({
          nombre: btn.dataset.pacienteNombre,
          dni: btn.dataset.pacienteDni
        });
        if (modalInstance) {
          modalInstance.show();
        }
      });
    });
  };

  const attachHandlers = () => {
    attachPaginationHandlers();
    attachRowToggleHandlers();
    attachFilterHandler();
    attachClearHandler();
    attachDeleteHandlers();
  };

  document.addEventListener('DOMContentLoaded', () => {
    attachNuevoPacienteFormHandler();
    if (getContainer()) {
      attachHandlers();
    }
  });
})();
