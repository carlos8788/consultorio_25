import ObraSocial from '../models/ObraSocial.js';
import Professional from '../models/Professional.js';
import { isAdminRole } from '../constants/roles.js';
import { logger } from '../logger/index.js';

const ESTADOS = new Set(['activa', 'suspendida']);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeScope = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || 'active';
};

const normalizeEstado = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return ESTADOS.has(normalized) ? normalized : null;
};

const extractRole = (req) =>
  req.auth?.user?.role || req.context?.user?.role || req.session?.user?.role || null;

const resolveProfessionalContext = (req) => {
  const role = extractRole(req);
  const isAdmin = isAdminRole(role);
  const professionalId = isAdmin
    ? (req.query?.professionalId || req.body?.professionalId || req.auth?.user?.professionalId || null)
    : (req.auth?.user?.professionalId || req.context?.professionalId || req.session?.user?.professionalId || null);

  return { professionalId, isAdmin };
};

const formatObraSocial = (obra, estado) => ({
  _id: obra._id?.toString(),
  id: obra._id?.toString(),
  nombre: obra.nombre,
  padron: obra.padron || null,
  telefono: obra.telefono || '',
  direccion: obra.direccion || '',
  ...(estado ? { estado } : {})
});

const upsertProfessionalObraSocial = async (professionalId, obraSocialId, estado) => {
  const updateResult = await Professional.updateOne(
    { _id: professionalId, 'obrasSociales.obraSocial': obraSocialId },
    { $set: { 'obrasSociales.$.estado': estado } }
  );

  if (updateResult.matchedCount === 0) {
    await Professional.updateOne(
      { _id: professionalId },
      {
        $push: {
          obrasSociales: {
            obraSocial: obraSocialId,
            estado
          }
        }
      }
    );
  }
};

export const listObrasSocialesApi = async (req, res) => {
  try {
    const scope = normalizeScope(req.query?.scope);

    if (scope === 'global') {
      const obras = await ObraSocial.find({})
        .sort({ nombre: 1 })
        .select('nombre padron telefono direccion _id')
        .lean();

      return res.json({
        obrasSociales: obras.map((obra) => formatObraSocial(obra))
      });
    }

    const { professionalId } = resolveProfessionalContext(req);
    if (!professionalId) {
      return res.status(400).json({ error: 'Debes indicar un professionalId valido' });
    }

    const [obras, professional] = await Promise.all([
      ObraSocial.find({})
        .sort({ nombre: 1 })
        .select('nombre padron telefono direccion _id')
        .lean(),
      Professional.findById(professionalId).select('obrasSociales').lean()
    ]);

    const estadoMap = new Map();
    (professional?.obrasSociales || []).forEach((entry) => {
      if (!entry?.obraSocial) return;
      const key = entry.obraSocial.toString();
      const estado = normalizeEstado(entry.estado) || 'activa';
      estadoMap.set(key, estado);
    });

    const mapped = obras.map((obra) => {
      const estado = estadoMap.get(obra._id.toString()) || 'suspendida';
      return formatObraSocial(obra, estado);
    });

    const obrasSociales = scope === 'active'
      ? mapped.filter((obra) => obra.estado === 'activa')
      : mapped;

    return res.json({
      obrasSociales
    });
  } catch (error) {
    logger.error('Error al listar obras sociales (API):', error);
    return res.status(500).json({ error: 'No se pudieron obtener las obras sociales' });
  }
};

export const createObraSocialApi = async (req, res) => {
  try {
    const { nombre, telefono, direccion, padron } = req.body || {};
    const attachToProfessional = req.body?.attachToProfessional !== false;
    const requestedEstado = normalizeEstado(req.body?.estado) || 'activa';

    const trimmedNombre = String(nombre || '').trim();
    if (!trimmedNombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const existing = await ObraSocial.findOne({
      nombre: new RegExp(`^${escapeRegex(trimmedNombre)}$`, 'i')
    });

    const obraSocial = existing || await ObraSocial.create({
      nombre: trimmedNombre,
      telefono,
      direccion,
      padron
    });

    let attached = false;
    if (attachToProfessional) {
      const { professionalId } = resolveProfessionalContext(req);
      if (!professionalId) {
        return res.status(400).json({ error: 'Debes indicar un professionalId valido' });
      }
      await upsertProfessionalObraSocial(professionalId, obraSocial._id, requestedEstado);
      attached = true;
    }

    return res.status(existing ? 200 : 201).json({
      obraSocial: formatObraSocial(obraSocial, attached ? requestedEstado : null),
      attached,
      created: !existing
    });
  } catch (error) {
    logger.error('Error al crear obra social (API):', error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'La obra social ya existe' });
    }
    return res.status(500).json({ error: 'No se pudo crear la obra social' });
  }
};

export const updateObraSocialEstadoApi = async (req, res) => {
  try {
    const { id } = req.params;
    const estado = normalizeEstado(req.body?.estado);

    if (!estado) {
      return res.status(400).json({ error: 'Estado invalido' });
    }

    const { professionalId } = resolveProfessionalContext(req);
    if (!professionalId) {
      return res.status(400).json({ error: 'Debes indicar un professionalId valido' });
    }

    const obraSocial = await ObraSocial.findById(id).lean();
    if (!obraSocial) {
      return res.status(404).json({ error: 'Obra social no encontrada' });
    }

    await upsertProfessionalObraSocial(professionalId, obraSocial._id, estado);

    return res.json({
      obraSocial: formatObraSocial(obraSocial, estado)
    });
  } catch (error) {
    logger.error('Error al actualizar obra social (API):', error);
    return res.status(500).json({ error: 'No se pudo actualizar la obra social' });
  }
};
