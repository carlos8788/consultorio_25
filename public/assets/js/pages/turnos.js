/**
 * Turnos Module
 * Gestiona filtro por fecha, creacion masiva y operaciones sin recargar la pagina
 */

(function() {
  'use strict';

  const api = window.apiClient;

  const SELECTORS = {
    table: '[data-turnos-table]',
    row: '[data-turno-row]',
    libresCount: '[data-turnos-libres-count]',
    fechaCell: '[data-turno-cell="fecha"]',
    horaCell: '[data-turno-cell="hora"]',
    pacienteLink: '[data-turno-paciente-link]',
    pacienteFlags: '.turno-flags',
    obraSocial: '[data-turno-obra-social]',
    estadoBadge: '[data-turno-estado-badge]',
    estadoText: '[data-turno-estado-text]',
    diagnostico: '[data-turno-diagnostico]',
    pagination: '[data-turnos-pagination]',
    feedback: '#turnosFeedback'
  };

  const tableElement = document.querySelector(SELECTORS.table);
  const fechaSelect = document.querySelector('#selectFecha');
  const feedbackEl = document.querySelector(SELECTORS.feedback);

  const state = {
    professionalId: (tableElement?.dataset.professionalId || document.querySelector('input[name="professionalId"]')?.value || '').trim() || null,
    fecha: fechaSelect?.value || '',
    page: Number(new URLSearchParams(window.location.search).get('page')) || 1
  };
  const pacienteState = {
    selected: null,
    turnoId: null
  };
  const cachedData = {
    obrasSociales: []
  };
  const dom = {
    fechaSelect,
    turnosTable: tableElement
  };
  const shouldRefreshOnLoad = tableElement?.dataset?.autorefresh === 'true';
  const logFechas = (label, payload) => {
    if (!payload || typeof console === 'undefined') {
      return;
    }
    const {
      fechasDisponibles,
      fechasPasadas,
      fechasFuturas,
      fechasTodas
    } = payload;
    const hasData = [fechasDisponibles, fechasPasadas, fechasFuturas, fechasTodas]
      .some((arr) => Array.isArray(arr) && arr.length);
    if (!hasData) {
      return;
    }
    console.log(`[turnos][${label}]`, {
      fechasDisponibles,
      fechasPasadas,
      fechasFuturas,
      fechasTodas
    });
  };
  logFechas('datos-iniciales', window.__turnosFechas__);

  const setFeedback = (type, message) => {
    if (!feedbackEl) {
      return;
    }
    if (!message) {
      feedbackEl.className = 'alert d-none';
      feedbackEl.textContent = '';
      return;
    }
    feedbackEl.className = `alert alert-${type || 'info'} position-absolute z-index-3 w-100`;
    feedbackEl.textContent = message;
  };

  const debounce = (fn, delay = 250) => {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  };

  const toIsoDate = (value) => {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.valueOf())) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      const isoPart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
      return /^\d{4}-\d{2}-\d{2}$/.test(isoPart) ? isoPart : '';
    }
    return '';
  };

  const formatFechaCorta = (fecha) => {
    const iso = toIsoDate(fecha);
    if (!iso) {
      return fecha || '';
    }
    const [anio, mes, dia] = iso.split('-');
    if (!anio || !mes || !dia) {
      return fecha || '';
    }
    return `${dia}/${mes}/${anio.slice(-2)}`;
  };

  const diagnosticoResaltaFila = (diagnostico) => {
    if (!diagnostico) {
      return false;
    }
    const normalizado = diagnostico
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return normalizado.includes('practica') || normalizado.includes('limpieza');
  };

  const getEstadoBadgeClass = (estado) => {
    switch ((estado || '').toLowerCase()) {
      case 'confirmado':
        return 'bg-success';
      case 'cancelado':
        return 'bg-danger';
      case 'completado':
        return 'bg-info';
      default:
        return 'bg-warning';
    }
  };

  const normalizeFechaInputValue = (value) => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const isoLike = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
    return /^\d{4}-\d{2}-\d{2}$/.test(isoLike) ? isoLike : '';
  };

  const normalizeFechaNacimiento = (value) => {
    if (!value) return '';
    const str = value.toString().trim();
    if (!str) return '';

    // Soporta "dd/mm/yyyy"
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        if (iso === '2024-01-01') return '';
        return iso;
      }
    }

    const iso = normalizeFechaInputValue(str);
    if (iso === '2024-01-01') return '';
    return iso;
  };

  const normalizeTurnoData = (turno) => {
    if (!turno || typeof turno !== 'object') {
      return null;
    }

    const id = turno._id || turno.id || turno.turnoId;
    if (!id) {
      return null;
    }

    const fecha = toIsoDate(turno.fecha) || '';
    const hora = typeof turno.hora === 'string' ? turno.hora : '';
    const diagnostico = typeof turno.diagnostico === 'string' ? turno.diagnostico : (turno.diagnostico || '');
    const estadoRaw = typeof turno.estado === 'string' && turno.estado.trim()
      ? turno.estado.trim()
      : 'pendiente';

    const pacienteData = turno.paciente && typeof turno.paciente === 'object'
      ? turno.paciente
      : {};

    const paciente = {
      id: pacienteData._id || pacienteData.id || '',
      nombre: pacienteData.nombre || '',
      apellido: pacienteData.apellido || '',
      dni: pacienteData.dni || '',
      telefono: pacienteData.telefono || '',
      fechaNacimiento: normalizeFechaNacimiento(pacienteData.fechaNacimiento || pacienteData.fecha_nacimiento || ''),
      observaciones: pacienteData.observaciones || ''
    };

    const obraSocialData = pacienteData.obraSocial || turno.obraSocial || {};
    const obraSocialId = (obraSocialData && (obraSocialData._id || obraSocialData.id)) || '';
    const obraSocialNombre = (obraSocialData && obraSocialData.nombre) || '';
    if (obraSocialId) {
      paciente.obraSocialId = obraSocialId;
    }

    const fechaDisplay = turno.fechaFormateada || formatFechaCorta(fecha);
    const pacienteDisplay = paciente.apellido
      ? `${paciente.apellido}, ${paciente.nombre || ''}`.trim()
      : 'Sin asignar';
    const diagnosticoDisplay = diagnostico ? diagnostico : '-';
    const obraSocialDisplay = obraSocialNombre || '-';

    const turnoLibre = !paciente.apellido;
    const rowClasses = [];
    if (diagnosticoResaltaFila(diagnostico)) {
      rowClasses.push('bg-practica');
    }
    if (turnoLibre) {
      rowClasses.push('bg-turno-libre');
    }

    return {
      id: id.toString(),
      fechaISO: fecha,
      fechaDisplay,
      hora,
      diagnostico,
      diagnosticoDisplay,
      estado: estadoRaw,
      estadoDisplay: estadoRaw || 'pendiente',
      estadoBadgeClass: getEstadoBadgeClass(estadoRaw),
      paciente,
      pacienteDisplay,
      pacienteObraSocialId: obraSocialId,
      obraSocialNombre,
      obraSocialDisplay,
      turnoLibre,
      rowClasses
    };
  };

  const setTurnosLibresCount = (value) => {
    const counter = document.querySelector(SELECTORS.libresCount);
    if (!counter) {
      return;
    }
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
    counter.textContent = String(safeValue);
  };

  const updateTurnosLibresCount = (diff) => {
    if (!diff) {
      return;
    }
    const counter = document.querySelector(SELECTORS.libresCount);
    if (!counter) {
      return;
    }
    const current = parseInt(counter.textContent, 10);
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + diff);
    counter.textContent = String(next);
  };

  const applyRowClasses = (row, dynamicClasses = []) => {
    const baseClass = row.dataset.baseClass || row.dataset.baseclass || row.className || '';
    const baseList = baseClass.split(' ').map((cls) => cls.trim()).filter(Boolean);
    const merged = [...baseList, ...dynamicClasses.filter(Boolean)];
    const unique = Array.from(new Set(merged));
    row.className = unique.join(' ');
  };

  const clearFlags = (row) => {
    row.querySelectorAll('.turno-flag').forEach((el) => el.remove());
  };

  const addFlag = (target, text, variant, icon) => {
    if (!target) return;
    const wrapper = document.createElement('button');
    wrapper.type = 'button';
    wrapper.className = ['turno-flag', variant ? `turno-flag-${variant}` : ''].filter(Boolean).join(' ');
    wrapper.setAttribute('data-turno-flag', variant || 'flag');
    if (icon) {
      const i = document.createElement('i');
      i.className = `bi ${icon}`;
      wrapper.appendChild(i);
    }
    const label = document.createElement('span');
    label.textContent = text;
    wrapper.appendChild(label);
    target.appendChild(wrapper);
    return wrapper;
  };

  const renderFlags = (row, normalized) => {
    if (!row) return;
    clearFlags(row);
    const flagsContainer = row.querySelector(SELECTORS.pacienteFlags) || row.querySelector('[data-turno-cell="paciente"]');
    const diagnosticoText = normalized?.diagnostico || row.querySelector(SELECTORS.diagnostico)?.textContent || '';
    const isPractica = normalized?.rowClasses?.includes('bg-practica')
      || row.classList.contains('bg-practica')
      || /practica|limpieza/i.test(diagnosticoText);
    const isLibre = typeof normalized?.turnoLibre === 'boolean'
      ? normalized.turnoLibre
      : row.dataset.turnoLibre === 'true';

    if (flagsContainer) {
      const createFlag = (variant, label, icon) => {
        const flag = addFlag(flagsContainer, label, variant, icon);
        if (flag) {
          flag.dataset.bsToggle = 'modal';
          flag.dataset.bsTarget = '#pacienteModal';
          const source = row.querySelector(SELECTORS.pacienteLink);
          if (source) {
            Array.from(source.attributes).forEach((attr) => {
              if (attr.name.startsWith('data-')) {
                flag.setAttribute(attr.name, attr.value);
              }
            });
          }
        }
      };
      if (isPractica) {
        createFlag('practica', 'Práctica', 'bi-magic');
      }
      if (isLibre) {
        createFlag('libre', 'Asignar', 'bi-plus-lg');
      }
    }
  };

  const updateTurnoRow = (turno) => {
    const normalized = normalizeTurnoData(turno);
    if (!normalized) {
      return null;
    }

    const row = document.querySelector(`[data-turno-row][data-turno-id="${normalized.id}"]`);
    if (!row) {
      return null;
    }

    const previousLibre = row.dataset.turnoLibre === 'true';

    const fechaCell = row.querySelector(SELECTORS.fechaCell);
    if (fechaCell) {
      fechaCell.dataset.fecha = normalized.fechaISO || '';
      fechaCell.textContent = normalized.fechaDisplay || normalized.fechaISO || '';
    }

    const horaCell = row.querySelector(SELECTORS.horaCell);
    if (horaCell) {
      horaCell.textContent = normalized.hora || '';
    }

    const pacienteLink = row.querySelector(SELECTORS.pacienteLink);
    if (pacienteLink) {
      pacienteLink.textContent = normalized.turnoLibre ? '' : normalized.pacienteDisplay;
      pacienteLink.dataset.pacienteApellido = normalized.paciente.apellido || '';
      pacienteLink.dataset.pacienteNombre = normalized.paciente.nombre || '';
      if (normalized.paciente.dni) {
        pacienteLink.dataset.pacienteDni = normalized.paciente.dni;
      } else {
        delete pacienteLink.dataset.pacienteDni;
      }
      if (normalized.paciente.telefono) {
        pacienteLink.dataset.pacienteTelefono = normalized.paciente.telefono;
      } else {
        delete pacienteLink.dataset.pacienteTelefono;
      }
      if (normalized.paciente.fechaNacimiento) {
        pacienteLink.dataset.pacienteFechaNacimiento = normalized.paciente.fechaNacimiento;
      } else {
        delete pacienteLink.dataset.pacienteFechaNacimiento;
      }
      if (normalized.paciente.observaciones) {
        pacienteLink.dataset.pacienteObservaciones = normalized.paciente.observaciones;
      } else {
        delete pacienteLink.dataset.pacienteObservaciones;
      }
      if (normalized.paciente.obraSocialId || normalized.pacienteObraSocialId) {
        pacienteLink.dataset.pacienteObraSocialId = normalized.paciente.obraSocialId || normalized.pacienteObraSocialId;
      } else {
        delete pacienteLink.dataset.pacienteObraSocialId;
      }
      if (normalized.paciente.id) {
        pacienteLink.dataset.pacienteId = normalized.paciente.id;
      } else {
        delete pacienteLink.dataset.pacienteId;
      }
    }

    const obraSocialSpan = row.querySelector(SELECTORS.obraSocial);
    if (obraSocialSpan) {
      obraSocialSpan.textContent = normalized.obraSocialDisplay;
    }

    const estadoBadge = row.querySelector(SELECTORS.estadoBadge);
    if (estadoBadge) {
      estadoBadge.className = ['badge', normalized.estadoBadgeClass].filter(Boolean).join(' ');
      estadoBadge.dataset.estado = normalized.estadoDisplay;
      const estadoText = estadoBadge.querySelector(SELECTORS.estadoText);
      if (estadoText) {
        estadoText.textContent = normalized.estadoDisplay;
      }
    }

    const diagnosticoSpan = row.querySelector(SELECTORS.diagnostico);
    if (diagnosticoSpan) {
      diagnosticoSpan.textContent = normalized.diagnosticoDisplay;
    }

    applyRowClasses(row, normalized.rowClasses);
    renderFlags(row, normalized);

    const newLibre = normalized.turnoLibre;
    if (newLibre !== previousLibre) {
      const delta = (newLibre ? 1 : 0) - (previousLibre ? 1 : 0);
      updateTurnosLibresCount(delta);
    }
    row.dataset.turnoLibre = newLibre ? 'true' : 'false';

    return normalized;
  };

  const createTurnoRow = (turno, professionalIdForUrl) => {
    const normalized = normalizeTurnoData(turno);
    if (!normalized) {
      return null;
    }

    const row = document.createElement('tr');
    row.dataset.turnoRow = 'true';
    row.dataset.turnoId = normalized.id;
    row.dataset.baseClass = 'turno-row';
    row.dataset.turnoLibre = normalized.turnoLibre ? 'true' : 'false';
    row.className = 'turno-row';
    applyRowClasses(row, normalized.rowClasses);

    const fechaCell = document.createElement('td');
    fechaCell.dataset.turnoCell = 'fecha';
    fechaCell.dataset.fecha = normalized.fechaISO || '';
    fechaCell.textContent = normalized.fechaDisplay || normalized.fechaISO || '';
    row.appendChild(fechaCell);

    const horaCell = document.createElement('td');
    horaCell.dataset.turnoCell = 'hora';
    horaCell.textContent = normalized.hora || '';
    row.appendChild(horaCell);

    const pacienteCell = document.createElement('td');
    pacienteCell.dataset.turnoCell = 'paciente';
    const pacienteWrap = document.createElement('div');
    pacienteWrap.className = 'd-flex align-items-center gap-2 flex-wrap';
    const pacienteLink = document.createElement('a');
    pacienteLink.href = '#';
    pacienteLink.className = 'turno-paciente-link text-decoration-none';
    pacienteLink.dataset.turnoPacienteLink = 'true';
    pacienteLink.dataset.bsToggle = 'modal';
    pacienteLink.dataset.bsTarget = '#pacienteModal';
    pacienteLink.dataset.turnoId = normalized.id;
    if (normalized.paciente.id) {
      pacienteLink.dataset.pacienteId = normalized.paciente.id;
    }
    if (normalized.paciente.apellido) pacienteLink.dataset.pacienteApellido = normalized.paciente.apellido;
    if (normalized.paciente.nombre) pacienteLink.dataset.pacienteNombre = normalized.paciente.nombre;
    if (normalized.paciente.dni) pacienteLink.dataset.pacienteDni = normalized.paciente.dni;
    if (normalized.paciente.telefono) pacienteLink.dataset.pacienteTelefono = normalized.paciente.telefono;
    if (normalized.paciente.obraSocialId || normalized.pacienteObraSocialId) {
      pacienteLink.dataset.pacienteObraSocialId = normalized.paciente.obraSocialId || normalized.pacienteObraSocialId;
    }
    if (normalized.paciente.fechaNacimiento) pacienteLink.dataset.pacienteFechaNacimiento = normalized.paciente.fechaNacimiento;
    if (normalized.paciente.observaciones) pacienteLink.dataset.pacienteObservaciones = normalized.paciente.observaciones;
    pacienteLink.textContent = normalized.turnoLibre ? '' : normalized.pacienteDisplay;
    pacienteWrap.appendChild(pacienteLink);
    const flagsHolder = document.createElement('div');
    flagsHolder.className = 'turno-flags d-flex align-items-center gap-1';
    pacienteWrap.appendChild(flagsHolder);
    pacienteCell.appendChild(pacienteWrap);
    row.appendChild(pacienteCell);

    const obraSocialCell = document.createElement('td');
    obraSocialCell.dataset.turnoCell = 'obraSocial';
    const obraSpan = document.createElement('span');
    obraSpan.dataset.turnoObraSocial = 'true';
    obraSpan.textContent = normalized.obraSocialDisplay;
    obraSocialCell.appendChild(obraSpan);
    row.appendChild(obraSocialCell);

    const estadoCell = document.createElement('td');
    estadoCell.dataset.turnoCell = 'estado';
    const estadoBadge = document.createElement('span');
    estadoBadge.className = ['badge', normalized.estadoBadgeClass].filter(Boolean).join(' ');
    estadoBadge.dataset.turnoEstadoBadge = 'true';
    estadoBadge.dataset.estado = normalized.estadoDisplay;
    const estadoText = document.createElement('span');
    estadoText.className = 'text-dark';
    estadoText.dataset.turnoEstadoText = 'true';
    estadoText.textContent = normalized.estadoDisplay;
    estadoBadge.appendChild(estadoText);
    estadoCell.appendChild(estadoBadge);
    row.appendChild(estadoCell);

    const diagnosticoCell = document.createElement('td');
    diagnosticoCell.dataset.turnoCell = 'diagnostico';
    const diagSpan = document.createElement('span');
    diagSpan.dataset.turnoDiagnostico = 'true';
    diagSpan.textContent = normalized.diagnosticoDisplay;
    diagnosticoCell.appendChild(diagSpan);
    row.appendChild(diagnosticoCell);

    const accionesCell = document.createElement('td');
    const viewLink = document.createElement('a');
    viewLink.className = 'btn btn-sm btn-info';
    viewLink.href = professionalIdForUrl
      ? `/turnos/${normalized.id}?professionalId=${professionalIdForUrl}`
      : `/turnos/${normalized.id}`;
    viewLink.innerHTML = '<i class="bi bi-eye"></i>';
    accionesCell.appendChild(viewLink);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-sm btn-danger ms-1';
    deleteBtn.dataset.action = 'delete-turno';
    deleteBtn.dataset.turnoId = normalized.id;
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    accionesCell.appendChild(deleteBtn);

    row.appendChild(accionesCell);
    renderFlags(row, normalized);

    return row;
  };

  const renderTurnosTable = (turnos, professionalIdForUrl) => {
    const table = document.querySelector(SELECTORS.table);
    if (!table) {
      return;
    }
    const tbody = table.querySelector('tbody');
    if (!tbody) {
      return;
    }

    tbody.innerHTML = '';

    if (!turnos || !turnos.length) {
      const emptyRow = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.className = 'text-center text-muted';
      td.textContent = 'No hay turnos registrados';
      emptyRow.appendChild(td);
      tbody.appendChild(emptyRow);
      return;
    }

    turnos.forEach((turno) => {
      const row = createTurnoRow(turno, professionalIdForUrl || state.professionalId);
      if (row) {
        tbody.appendChild(row);
      }
    });

    initDeleteButtons();
  };

  const buildHref = (page, paginationQuery) => {
    const params = new URLSearchParams(paginationQuery || '');
    params.set('page', page);
    if (state.fecha) {
      params.set('fecha', state.fecha);
    }
    if (state.professionalId) {
      params.set('professionalId', state.professionalId);
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : window.location.pathname;
  };

  function attachPaginationHandlers(root) {
    const container = root || document.querySelector(SELECTORS.pagination);
    if (!container) return;
    if (container.dataset.paginationBound === 'true') return;
    container.dataset.paginationBound = 'true';

    container.addEventListener('click', async (event) => {
      const link = event.target.closest('a');
      if (!link || !link.closest('.pagination')) return;
      event.preventDefault();

      const href = link.getAttribute('href') || '';
      const pageFromHref = (() => {
        try {
          return Number(new URL(href, window.location.origin).searchParams.get('page')) || null;
        } catch (e) {
          return null;
        }
      })();
      const page = Number(link.dataset.page) || pageFromHref || 1;
      state.page = page;

      if (!api) {
        window.location.href = link.href;
        return;
      }
      await refreshTurnos({ page });
    }, { once: false });
  }

  const renderPagination = (paginationData) => {
    const container = document.querySelector(SELECTORS.pagination);
    if (!container) {
      return;
    }

    const { pagination, paginationQuery } = paginationData || {};
    if (!pagination || !pagination.pages) {
      container.innerHTML = '';
      return;
    }

    const renderer = window.PaginationRenderer;
    if (!renderer || typeof renderer.build !== 'function') {
      // Fallback minimal render
      container.innerHTML = '';
      container.textContent = `Página ${pagination.page} de ${pagination.pages}`;
      return;
    }

    const node = renderer.build({
      page: pagination.page,
      pages: pagination.pages,
      total: pagination.total,
      paginationQuery,
      itemsLabel: 'turnos',
      ariaLabel: 'Paginación de turnos'
    });

    container.innerHTML = '';
    container.appendChild(node);
    attachPaginationHandlers(container);
  };

  const fetchTurnos = async (params = {}) => {
    if (!api) {
      return null;
    }
    const query = { ...params };
    if (state.professionalId) {
      query.professionalId = state.professionalId;
    }
    if (state.fecha) {
      query.fecha = state.fecha;
    }
    return api.get('/api/turnos', { query });
  };

  const renderFechasDisponibles = (fechas = [], selected) => {
    const select = dom.fechaSelect;
    if (!select || !Array.isArray(fechas)) return;

    const current = select.value;
    select.innerHTML = '<option value="">Todas las fechas</option>';
    fechas.forEach((fecha) => {
      const option = document.createElement('option');
      option.value = fecha;
      option.textContent = typeof formatFechaSelect === 'function'
        ? formatFechaSelect(fecha)
        : fecha;
      if (selected && selected === fecha) {
        option.selected = true;
      } else if (!selected && current && current === fecha) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  };

  const refreshTurnos = async (params = {}) => {
    if (!api) {
      return null;
    }

    setFeedback('info', 'Cargando turnos...');
    try {
      const data = await fetchTurnos({ ...params });
      if (!data) {
        return null;
      }

      state.fecha = data.fechaActual || params.fecha || state.fecha || '';
      state.page = data.pagination?.page || params.page || 1;
      state.professionalId = data.professionalId || state.professionalId;

      if (fechaSelect) {
        fechaSelect.value = state.fecha;
      }

      renderTurnosTable(data.turnos || [], state.professionalId);
      setTurnosLibresCount(data.turnosLibres);
      renderFechasDisponibles(data.fechasDisponibles || [], state.fecha);
      renderPagination({
        pagination: data.pagination,
        paginationDisplay: data.paginationDisplay,
        paginationQuery: data.paginationQuery
      });
      logFechas('api', data);
      setFeedback('', '');

      const paramsForUrl = new URLSearchParams(data.paginationQuery || '');
      paramsForUrl.set('page', state.page || 1);
      if (state.fecha) {
        paramsForUrl.set('fecha', state.fecha);
      }
      if (state.professionalId) {
        paramsForUrl.set('professionalId', state.professionalId);
      }
      const newSearch = paramsForUrl.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      return data;
    } catch (error) {
      setFeedback('danger', error.message || 'No se pudo cargar los turnos');
      return null;
    }
  };

  const handleDeleteClick = async (event) => {
    const button = event.currentTarget;
    const turnoId = button.dataset.turnoId;
    if (!turnoId) {
      return;
    }

    if (!api) {
      return;
    }

    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
    setFeedback('', '');

    try {
      await api.delete(`/api/turnos/${turnoId}`, {
        query: state.professionalId ? { professionalId: state.professionalId } : undefined
      });

      const row = button.closest('[data-turno-row]');
      const wasLibre = row?.dataset.turnoLibre === 'true';
      if (row && row.parentElement) {
        row.remove();
      }
      if (wasLibre) {
        updateTurnosLibresCount(-1);
      }

      const remainingRows = document.querySelectorAll(`${SELECTORS.table} ${SELECTORS.row}`).length;
      if (remainingRows === 0) {
        await refreshTurnos({ page: Math.max(1, state.page - 1) });
      } else {
        setFeedback('success', 'Turno eliminado');
      }
    } catch (error) {
      setFeedback('danger', error.message || 'No se pudo eliminar el turno');
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  };

  const initDeleteButtons = () => {
    document.querySelectorAll('[data-action="delete-turno"]').forEach((button) => {
      if (button.dataset.deleteBound === 'true') {
        return;
      }
      button.dataset.deleteBound = 'true';
      button.addEventListener('click', handleDeleteClick);
    });
  };

  const crearRango = (inicio, fin, intervalo) => {
    const turnos = [];
    const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
    const [horaFin, minutoFin] = fin.split(':').map(Number);

    let tiempoActual = horaInicio * 60 + minutoInicio;
    const tiempoFin = horaFin * 60 + minutoFin;

    if (!Number.isFinite(tiempoActual) || !Number.isFinite(tiempoFin) || tiempoActual >= tiempoFin) {
      return turnos;
    }

    const paso = Math.max(1, Number(intervalo) || 0);

    while (tiempoActual < tiempoFin) {
      const horaFormateada = Math.floor(tiempoActual / 60).toString().padStart(2, '0');
      const minutosFormateados = (tiempoActual % 60).toString().padStart(2, '0');
      turnos.push(`${horaFormateada}:${minutosFormateados}`);
      tiempoActual += paso;
    }

    turnos.push(fin);
    return turnos;
  };

  function initTurnosDateFilter() {
    const fechaInput = fechaSelect || document.querySelector('form[action="/turnos"] input[name="fecha"]');

    if (!fechaInput) {
      return;
    }

    fechaInput.addEventListener('change', async (event) => {
      event.preventDefault();

      const form = fechaInput.form;
      state.fecha = fechaInput.value || '';
      state.page = 1;

      if (!api) {
        if (form) {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.submit();
          }
        }
        return;
      }

      await refreshTurnos({ fecha: state.fecha, page: 1 });
    });
  }

  function initRangoTurnos() {
    const form = document.querySelector('#crearRangoTurnos');
    if (!form || !api) {
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const modalElement = form.closest('.modal');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(form));
      const professionalId = data.professionalId || state.professionalId;
      if (!professionalId) {
        setFeedback('danger', 'Selecciona un profesional antes de crear turnos');
        return;
      }

      const slots = crearRango(data.start, data.end, data.intervalo);
      if (!slots.length) {
        setFeedback('danger', 'Revisa el rango horario ingresado');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creando';
      setFeedback('', '');

      try {
        const payload = await api.post('/api/turnos/bulk', {
          professionalId,
          turnos: slots.map((hora) => ({ fecha: data.fecha, hora }))
        });

        setFeedback('success', `Se crearon ${payload.created || slots.length} turnos`);

        await refreshTurnos({ fecha: data.fecha, page: 1 });

        if (modalElement && window.bootstrap?.Modal) {
          const instance = window.bootstrap.Modal.getInstance(modalElement);
          instance?.hide();
        }
        form.reset();
      } catch (error) {
        setFeedback('danger', error.message || 'No se pudieron crear los turnos');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Crear';
      }
    });
  }

  function initTurnosTable() {
    const table = document.querySelector(SELECTORS.table);
    if (!table) {
      return;
    }

    table.querySelectorAll(SELECTORS.row).forEach((row) => {
      if (!row.dataset.baseClass) {
        row.dataset.baseClass = row.dataset.baseclass || row.className || '';
      }
      if (!row.dataset.turnoLibre) {
        row.dataset.turnoLibre = row.classList.contains('bg-turno-libre') ? 'true' : 'false';
      }
      renderFlags(row);
    });

    const handleTurnoEvent = (event) => {
      if (!event || !event.detail) {
        return;
      }
      const turnoData = event.detail.turno || event.detail;
      updateTurnoRow(turnoData);
    };

    ['turno:actualizado', 'turno:pacienteActualizado'].forEach((eventName) => {
      document.addEventListener(eventName, handleTurnoEvent);
    });

    if (typeof window !== 'undefined') {
      window.turnosUI = window.turnosUI || {};
      window.turnosUI.updateTurnoRow = updateTurnoRow;
      window.turnosUI.normalizeTurnoData = normalizeTurnoData;
      window.turnosUI.updateTurnosLibresCount = updateTurnosLibresCount;
      window.turnosUI.refreshTurnos = refreshTurnos;
    }

    initDeleteButtons();
  }

  function initPacienteModal() {
    const modalElement = document.getElementById('pacienteModal');
    if (!modalElement || !api) {
      return;
    }

    const turnoLabel = modalElement.querySelector('[data-turno-modal]');
    const form = modalElement.querySelector('#pacienteModalForm');
    const turnoHidden = form?.querySelector('input[name="turnoId"]');
    const apellidoInput = form?.querySelector('input[name="apellido"]');
    const nombreInput = form?.querySelector('input[name="nombre"]');
    const dniInput = form?.querySelector('input[name="dni"]');
    const telefonoInput = form?.querySelector('input[name="telefono"]');
    const obraSocialSelect = form?.querySelector('select[name="obraSocial"]');
    const fechaNacInput = form?.querySelector('input[name="fechaNacimiento"]');
    const observacionesInput = form?.querySelector('textarea[name="observaciones"]');
    const suggestionsEl = modalElement.querySelector('[data-paciente-suggestions]');
    const statusEl = modalElement.querySelector('[data-paciente-status]');
    const saveBtn = modalElement.querySelector('[data-action="guardarPaciente"]');

    const setStatus = (message, tone = 'muted') => {
      if (!statusEl) return;
      statusEl.className = `mt-3 small text-${tone}`;
      statusEl.textContent = message || '';
    };
    let pendingObraSocialId = '';

    const renderObrasSociales = (selectedId) => {
      if (!obraSocialSelect) return;
      const target = selectedId || pendingObraSocialId || '';
      obraSocialSelect.innerHTML = '<option value="">Selecciona una obra social</option>';
      cachedData.obrasSociales.forEach((obra) => {
        const value = obra.id || obra._id;
        if (!value) return;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = obra.nombre;
        if (target && option.value === target) {
          option.selected = true;
        }
        obraSocialSelect.appendChild(option);
      });
    };

    const loadObrasSociales = async (selectedId) => {
      if (!obraSocialSelect) return;
      if (cachedData.obrasSociales.length) {
        renderObrasSociales(selectedId);
        return;
      }
      try {
        const data = await api.get('/api/obras-sociales');
        cachedData.obrasSociales = data?.obrasSociales || [];
        renderObrasSociales(selectedId);
      } catch (error) {
        setStatus(error.message || 'No se pudieron cargar obras sociales', 'danger');
      }
    };

    const clearForm = () => {
      pacienteState.selected = null;
      pacienteState.turnoId = null;
      if (turnoHidden) turnoHidden.value = '';
      if (apellidoInput) apellidoInput.value = '';
      if (nombreInput) nombreInput.value = '';
      if (dniInput) dniInput.value = '';
      if (telefonoInput) telefonoInput.value = '';
      if (obraSocialSelect) obraSocialSelect.value = '';
      if (fechaNacInput) fechaNacInput.value = '';
      if (observacionesInput) observacionesInput.value = '';
      pendingObraSocialId = '';
      if (suggestionsEl) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.add('d-none');
      }
      setStatus('');
    };

    document.addEventListener('click', (event) => {
      const link = event.target.closest('.turno-paciente-link');
      if (!link) {
        return;
      }
      event.preventDefault();
    });

    const renderSuggestions = (items = []) => {
      if (!suggestionsEl) return;
      suggestionsEl.innerHTML = '';

      if (!items.length) {
        suggestionsEl.classList.add('d-none');
        return;
      }

      items.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-group-item list-group-item-action';
        button.dataset.pacienteId = item.id;
        const obraLabel = item.obraSocial?.nombre ? ` | ${item.obraSocial.nombre}` : '';
        button.textContent = `${item.apellido}, ${item.nombre} - DNI ${item.dni || 's/d'}${obraLabel}`;
        button.addEventListener('click', () => {
          pacienteState.selected = item;
          if (apellidoInput) apellidoInput.value = item.apellido || '';
          if (nombreInput) nombreInput.value = item.nombre || '';
          if (dniInput) dniInput.value = item.dni || '';
          if (telefonoInput) telefonoInput.value = item.telefono || '';
          if (obraSocialSelect && item.obraSocial?.id) {
            obraSocialSelect.value = item.obraSocial.id;
          }
          if (fechaNacInput) {
            fechaNacInput.value = normalizeFechaNacimiento(item.fechaNacimiento || '');
          }
          setStatus('Paciente seleccionado', 'success');
          suggestionsEl.classList.add('d-none');
        });
        suggestionsEl.appendChild(button);
      });

      suggestionsEl.classList.remove('d-none');
    };

    const searchPacientes = async ({ term, dni }) => {
      if ((!term || term.length < 3) && (!dni || dni.length < 3)) {
        renderSuggestions([]);
        return;
      }

      try {
        setStatus('Buscando coincidencias...', 'muted');
        const data = await api.get('/api/pacientes/search', {
          query: {
            term: term || undefined,
            dni: dni || undefined,
            professionalId: state.professionalId || undefined
          }
        });

        const pacientes = data?.pacientes || [];
        renderSuggestions(pacientes);

        if (!pacientes.length) {
          setStatus('Sin coincidencias, se creará un paciente nuevo al guardar', 'warning');
        } else {
          setStatus(`${pacientes.length} coincidencia(s) encontrada(s)`, 'muted');
        }
      } catch (error) {
        setStatus(error.message || 'No se pudo buscar pacientes', 'danger');
      }
    };

    const debouncedSearchApellido = debounce(() => {
      searchPacientes({ term: apellidoInput?.value?.trim() || '' });
    }, 300);

    const debouncedSearchDni = debounce(() => {
      searchPacientes({ dni: dniInput?.value?.trim() || '' });
    }, 300);

    const getTurnoMetadata = (turnoId) => {
      const row = document.querySelector(`${SELECTORS.row}[data-turno-id="${turnoId}"]`);
      const fechaCell = row?.querySelector('[data-turno-cell="fecha"]');
      const horaCell = row?.querySelector('[data-turno-cell="hora"]');
      return {
        fecha: fechaCell?.dataset?.fecha || fechaCell?.textContent?.trim() || state.fecha || '',
        hora: horaCell?.textContent?.trim() || ''
      };
    };

    modalElement.addEventListener('show.bs.modal', (event) => {
      const trigger = event.relatedTarget;
      if (!trigger) {
        return;
      }

      const turnoId = trigger.getAttribute('data-turno-id') || '';
      const dataset = trigger.dataset || {};
      const pacienteId = dataset.pacienteId || '';
      const prefill = {
        apellido: dataset.pacienteApellido || '',
        nombre: dataset.pacienteNombre || '',
        dni: dataset.pacienteDni || '',
        telefono: dataset.pacienteTelefono || '',
        obraSocial: dataset.pacienteObraSocialId || '',
        fechaNacimiento: normalizeFechaNacimiento(dataset.pacienteFechaNacimiento || ''),
        observaciones: dataset.pacienteObservaciones || ''
      };

      if (turnoLabel) {
        turnoLabel.textContent = turnoId ? `ID: ${turnoId}` : '';
      }

      pendingObraSocialId = prefill.obraSocial || '';
      loadObrasSociales(pendingObraSocialId);

      pacienteState.turnoId = turnoId;
      if (turnoHidden) {
        turnoHidden.value = turnoId;
      }

      if (apellidoInput) apellidoInput.value = prefill.apellido;
      if (nombreInput) nombreInput.value = prefill.nombre;
      if (dniInput) dniInput.value = prefill.dni;
      if (telefonoInput) telefonoInput.value = prefill.telefono;
      if (fechaNacInput) fechaNacInput.value = prefill.fechaNacimiento;
      if (observacionesInput) observacionesInput.value = prefill.observaciones;
      if (obraSocialSelect && pendingObraSocialId && cachedData.obrasSociales.length) {
        obraSocialSelect.value = pendingObraSocialId;
      }

      if (pacienteId || prefill.apellido || prefill.nombre || prefill.dni || prefill.telefono) {
        pacienteState.selected = {
          id: pacienteId,
          nombre: prefill.nombre,
          apellido: prefill.apellido,
          dni: prefill.dni,
          telefono: prefill.telefono,
          obraSocial: pendingObraSocialId ? { id: pendingObraSocialId } : undefined
        };
        setStatus('Edita los datos y guarda para actualizar el paciente del turno', 'muted');
      } else {
        pacienteState.selected = null;
        setStatus('Completá apellido o DNI para buscar el paciente', 'muted');
      }
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
      if (turnoLabel) turnoLabel.textContent = '';
      clearForm();
    });

    apellidoInput?.addEventListener('input', () => {
      pacienteState.selected = null;
      renderSuggestions([]);
      debouncedSearchApellido();
    });

    dniInput?.addEventListener('input', () => {
      pacienteState.selected = null;
      renderSuggestions([]);
      debouncedSearchDni();
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!state.professionalId) {
        setStatus('Selecciona un profesional antes de asignar un paciente', 'danger');
        return;
      }

      const turnoId = pacienteState.turnoId || turnoHidden?.value || '';
      if (!turnoId) {
        setStatus('No se encontró el turno seleccionado', 'danger');
        return;
      }

      const apellido = apellidoInput?.value?.trim();
      const nombre = nombreInput?.value?.trim();
      const dni = dniInput?.value?.trim();
      const telefono = telefonoInput?.value?.trim();
      const observaciones = observacionesInput?.value?.trim();
      const obraSocial = obraSocialSelect?.value || '';
      const fechaNacimiento = normalizeFechaNacimiento(fechaNacInput?.value || '');

      if (!apellido || !nombre || !dni || !telefono || !obraSocial) {
        setStatus('Completá apellido, nombre, DNI, teléfono y obra social', 'danger');
        return;
      }

      const restoreLabel = saveBtn?.innerHTML;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando';
      }

      try {
        let pacienteId = pacienteState.selected?.id || null;

        if (!pacienteId) {
          const created = await api.post('/api/pacientes', {
            apellido,
            nombre,
            dni,
            telefono,
            obraSocial,
            fechaNacimiento: fechaNacimiento || undefined,
            observaciones,
            professional: state.professionalId
          });
          pacienteId = created?.paciente?.id || created?.paciente?._id || null;
        }

        if (!pacienteId) {
          throw new Error('No se pudo resolver el paciente');
        }

        const { fecha, hora } = getTurnoMetadata(turnoId);
        if (!fecha || !hora) {
          throw new Error('No se pudo determinar la fecha/hora del turno');
        }
        const updated = await api.put(`/api/turnos/${turnoId}`, {
          paciente: pacienteId,
          fecha,
          hora
        }, {
          query: state.professionalId ? { professionalId: state.professionalId } : undefined
        });

        if (updated?.turno) {
          updateTurnoRow(updated.turno);
          setFeedback('success', 'Paciente asignado al turno');
        }

        setStatus('Paciente asociado correctamente', 'success');

        if (window.bootstrap?.Modal) {
          const instance = window.bootstrap.Modal.getInstance(modalElement);
          instance?.hide();
        }
      } catch (error) {
        setStatus(error.message || 'No se pudo asignar el paciente', 'danger');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = restoreLabel || '<i class="bi bi-save"></i> Guardar y asociar';
        }
      }
    });
  }

  function initNuevoTurnoModal() {
    const modalElement = document.getElementById('nuevoTurnoModal');
    if (!modalElement || !api) return;

    const form = modalElement.querySelector('#nuevoTurnoForm');
    const fechaInput = form?.querySelector('input[name="fecha"]');
    const horaInput = form?.querySelector('input[name="hora"]');
    const estadoSelect = form?.querySelector('select[name="estado"]');
    const diagInput = form?.querySelector('textarea[name="diagnostico"]');
    const statusEl = modalElement.querySelector('[data-nuevo-turno-status]');
    const saveBtn = form?.querySelector('[data-action="crearTurno"]');

    const setStatus = (msg, tone = 'muted') => {
      if (!statusEl) return;
      statusEl.className = `mt-3 small text-${tone}`;
      statusEl.textContent = msg || '';
    };

    modalElement.addEventListener('show.bs.modal', () => {
      if (fechaInput) fechaInput.value = state.fecha || '';
      if (horaInput) horaInput.value = '';
      if (estadoSelect) estadoSelect.value = 'pendiente';
      if (diagInput) diagInput.value = '';
      setStatus('');
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!state.professionalId) {
        setStatus('Selecciona un profesional antes de crear turnos', 'danger');
        return;
      }

      const fecha = fechaInput?.value?.trim();
      const hora = horaInput?.value?.trim();
      const estado = estadoSelect?.value || 'pendiente';
      const diagnostico = diagInput?.value?.trim() || '';

      if (!fecha || !hora) {
        setStatus('Completá fecha y hora', 'danger');
        return;
      }

      const restore = saveBtn?.innerHTML;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creando';
      }

      try {
        await api.post('/api/turnos', {
          fecha,
          hora,
          estado,
          diagnostico,
          professional: state.professionalId
        });

        setStatus('Turno creado correctamente', 'success');
        await refreshTurnos({ fecha, page: 1 });

        if (window.bootstrap?.Modal) {
          const instance = window.bootstrap.Modal.getInstance(modalElement);
          instance?.hide();
        }
      } catch (error) {
        setStatus(error.message || 'No se pudo crear el turno', 'danger');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = restore || '<i class="bi bi-save"></i> Crear';
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initTurnosDateFilter();
    initRangoTurnos();
    initTurnosTable();
    initPacienteModal();
    initNuevoTurnoModal();
    attachPaginationHandlers();

    // Solo rehidrata si se solicita explícitamente
    if (api && shouldRefreshOnLoad) {
      await refreshTurnos({ fecha: state.fecha || undefined, page: state.page || 1 });
    }
  });
})();
