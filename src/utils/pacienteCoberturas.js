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

const normalizeObraSocial = (obraSocial) => {
  if (!obraSocial) return null;
  if (typeof obraSocial === 'object') {
    if (obraSocial._id || obraSocial.id) return obraSocial;
    return { _id: obraSocial };
  }
  return { _id: obraSocial };
};

const resolveCoberturaEntry = (paciente, professionalId) => {
  if (!paciente || !professionalId) return null;
  const target = toIdString(professionalId);
  const list = Array.isArray(paciente.coberturas) ? paciente.coberturas : [];
  return list.find((entry) => toIdString(entry?.professional) === target) || null;
};

export const resolvePacienteCobertura = (paciente, professionalId) => {
  if (!paciente) {
    return { tipo: 'particular', obraSocial: null };
  }

  const entry = resolveCoberturaEntry(paciente, professionalId);
  if (entry) {
    const obraSocial = normalizeObraSocial(entry.obraSocial);
    const tipo = entry.tipo || (obraSocial ? 'obraSocial' : 'particular');
    return { tipo, obraSocial };
  }

  const legacyObraSocial = normalizeObraSocial(paciente.obraSocial);
  return {
    tipo: legacyObraSocial ? 'obraSocial' : 'particular',
    obraSocial: legacyObraSocial
  };
};

export const normalizePacienteCobertura = (paciente, professionalId) => {
  if (!paciente) return paciente;
  const { obraSocial } = resolvePacienteCobertura(paciente, professionalId);
  return {
    ...paciente,
    obraSocial: obraSocial || null
  };
};
