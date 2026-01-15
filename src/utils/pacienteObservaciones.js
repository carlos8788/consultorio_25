const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id?.toString) return value._id.toString();
    if (value.id?.toString) return value.id.toString();
  }
  if (value.toString) return value.toString();
  return null;
};

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  const professional = toIdString(entry.professional);
  if (!professional) return null;
  const observacion = normalizeText(entry.observacion ?? entry.texto ?? entry.contenido ?? '');
  if (!observacion) return null;
  return { professional, observacion };
};

export const buildObservacionesArray = (input, professionalId) => {
  if (Array.isArray(input)) {
    return input.map(normalizeEntry).filter(Boolean);
  }

  if (typeof input !== 'string') return [];
  const observacion = normalizeText(input);
  const professional = toIdString(professionalId);
  if (!observacion || !professional) return [];
  return [{ professional, observacion }];
};

export const mergeObservacionesForProfessional = (existing, input, professionalId) => {
  if (input === undefined) return undefined;

  if (Array.isArray(input)) {
    return buildObservacionesArray(input, professionalId);
  }

  if (typeof input !== 'string') return undefined;

  const professional = toIdString(professionalId);
  if (!professional) return undefined;

  const observacion = normalizeText(input);
  const list = Array.isArray(existing)
    ? existing
        .map((entry) => ({
          professional: toIdString(entry?.professional),
          observacion: normalizeText(entry?.observacion ?? entry?.texto ?? entry?.contenido ?? '')
        }))
        .filter((entry) => entry.professional && entry.observacion !== '')
    : [];

  const withoutCurrent = list.filter((entry) => entry.professional !== professional);
  if (!observacion) return withoutCurrent;

  return [...withoutCurrent, { professional, observacion }];
};

export const getObservacionForProfessional = (paciente, professionalId) => {
  if (!paciente) return '';
  const target = toIdString(professionalId);
  const observaciones = paciente.observaciones;

  if (Array.isArray(observaciones)) {
    if (!target) return '';
    const match = observaciones.find(
      (entry) => toIdString(entry?.professional) === target
    );
    return normalizeText(match?.observacion ?? match?.texto ?? match?.contenido ?? '');
  }

  if (typeof observaciones === 'string') {
    const legacy = normalizeText(observaciones);
    if (!legacy) return '';
    if (!target) return legacy;

    const primary = toIdString(paciente.professional);
    const extras = Array.isArray(paciente.professionals)
      ? paciente.professionals.map(toIdString).filter(Boolean)
      : [];
    const uniqueIds = new Set([primary, ...extras].filter(Boolean));

    if (uniqueIds.size <= 1 && uniqueIds.has(target)) {
      return legacy;
    }

    return '';
  }

  return '';
};

export const normalizePacienteObservaciones = (paciente, professionalId) => {
  if (!paciente) return paciente;
  return {
    ...paciente,
    observaciones: getObservacionForProfessional(paciente, professionalId)
  };
};
