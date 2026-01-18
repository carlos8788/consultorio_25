import { Types } from 'mongoose';
import Turno from '../models/Turno.js';

const withNotDeleted = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) {
    return { deletedAt: null };
  }
  if (filter.$and) {
    return { ...filter, $and: [...filter.$and, { deletedAt: null }] };
  }
  return { $and: [filter, { deletedAt: null }] };
};

export const paginateTurnos = (query, options) =>
  Turno.paginate(withNotDeleted(query), options);

export const findTurno = (filter) =>
  Turno.findOne(withNotDeleted(filter))
    .populate({
      path: 'paciente',
      populate: [
        { path: 'obraSocial' },
        { path: 'coberturas.obraSocial' }
      ]
    })
    .populate('professional')
    .lean();

export const findTurnoLean = (filter, sort = { fecha: 1, hora: 1 }) =>
  Turno.findOne(withNotDeleted(filter)).sort(sort).lean();

export const createTurno = (data) => new Turno(data).save();

export const updateTurno = (filter, data) =>
  Turno.findOneAndUpdate(withNotDeleted(filter), data, { new: true, runValidators: true });

export const deleteTurno = (filter, { force = false, deletedBy = null } = {}) => {
  if (force) {
    return Turno.findOneAndDelete(filter);
  }
  return Turno.findOneAndUpdate(
    withNotDeleted(filter),
    { deletedAt: new Date(), deletedBy },
    { new: true }
  );
};

export const legacyTurnoFilter = { $or: [{ professional: { $exists: false } }, { professional: null }] };

export const assignProfessionalToLegacyTurnos = (professionalId) =>
  Turno.updateMany(withNotDeleted(legacyTurnoFilter), { professional: professionalId });

export const createManyTurnos = (data) => {
  return Turno.insertMany(data);
};

export const findTurnosByProfessionalFechaHora = (professionalId, turnosData) => {
  const conditions = turnosData.map(turno => ({
    professional: professionalId,
    fecha: turno.fecha,
    hora: turno.hora
  }));

  return Turno.find(withNotDeleted({ $or: conditions })).lean();
};

const castFechaCondicion = (fechaCondicion = {}) => {
  const toDate = (value) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const iso = value.split('T')[0];
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? value : d;
    }
    return value;
  };

  if (!fechaCondicion || typeof fechaCondicion !== 'object') {
    return fechaCondicion;
  }

  return Object.entries(fechaCondicion).reduce((acc, [key, val]) => {
    acc[key] = toDate(val);
    return acc;
  }, {});
};

const aggregateFechas = ({ professionalFilter = {}, fechaCondicion = {}, sortDirection = 1, limit }) => {
  const normalizedFilter = withNotDeleted({ ...(professionalFilter || {}) });

  if (normalizedFilter.professional && typeof normalizedFilter.professional === 'string') {
    normalizedFilter.professional = new Types.ObjectId(normalizedFilter.professional);
  }

  const match = {
    ...normalizedFilter,
    ...(Object.keys(fechaCondicion).length ? { fecha: castFechaCondicion(fechaCondicion) } : {})
  };

  const pipeline = [
    { $match: match },
    { $group: { _id: '$fecha' } },
    { $sort: { _id: sortDirection } }
  ];

  if (typeof limit === 'number') {
    pipeline.push({ $limit: limit });
  }

  pipeline.push({ $project: { _id: 0, fecha: '$_id' } });

  return Turno.aggregate(pipeline).then((result) =>
    result.map(({ fecha }) => {
      if (fecha instanceof Date) {
        return fecha.toISOString().split('T')[0];
      }
      if (typeof fecha === 'string') {
        return fecha.split('T')[0];
      }
      return '';
    }).filter(Boolean)
  );
};

export const getFechasDesdeHoy = (professionalFilter, fechaBase, fechaMax) => {
  const fechaCondicion = fechaMax
    ? { $gte: fechaBase, $lte: fechaMax }
    : { $gte: fechaBase };

  return aggregateFechas({
    professionalFilter,
    fechaCondicion,
    sortDirection: 1
  });
};

export const getUltimasFechasAntesDe = (professionalFilter, fechaBase, limit = 2) => {
  return aggregateFechas({
    professionalFilter,
    fechaCondicion: { $lt: fechaBase },
    sortDirection: -1,
    limit
  });
};

export const getTodasLasFechas = (professionalFilter) => {
  const match = withNotDeleted(professionalFilter || {});
  if (match.professional && typeof match.professional === 'string') {
    match.professional = new Types.ObjectId(match.professional);
  }

  return Turno.distinct('fecha', match).then((result) =>
    result
      .map((fecha) => {
        if (fecha instanceof Date) {
          return fecha.toISOString().split('T')[0];
        }
        if (typeof fecha === 'string') {
          return fecha.split('T')[0];
        }
        return '';
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  );
};
