import {
  ADMIN_PROFESSIONAL_NAME_SESSION_KEY,
  ADMIN_PROFESSIONAL_SESSION_KEY
} from '../constants/contextKeys.js';
import { getProfessionalByIdOrFail } from '../services/professionalService.js';

export const isAdmin = (req) => req.context?.isAdmin || req.session?.user?.role === 'admin';

export const requireProfessionalId = (req) => {
  const professionalId = req.context?.professionalId || req.session?.user?.professionalId;
  if (!professionalId) {
    throw new Error('El usuario no tiene un profesional asociado');
  }
  return professionalId;
};

export const getScopedProfessionalId = (req) => {
  if (isAdmin(req)) {
    return req.query?.professionalId || req.session?.[ADMIN_PROFESSIONAL_SESSION_KEY] || null;
  }
  return req.context?.professionalId || req.session?.user?.professionalId || null;
};

export const persistAdminProfessionalSelection = (req, professionalId, professionalName) => {
  if (!isAdmin(req) || !professionalId) return;
  if (!req.session) {
    req.session = {};
  }
  req.session[ADMIN_PROFESSIONAL_SESSION_KEY] = professionalId;
  if (professionalName) {
    req.session[ADMIN_PROFESSIONAL_NAME_SESSION_KEY] = professionalName;
  }
};

const formatProfessionalName = (professional) => {
  if (!professional) return '';
  const parts = [professional.apellido, professional.nombre].filter(Boolean);
  if (parts.length) {
    return parts.join(', ');
  }
  return professional.userId || '';
};

export const resolveProfessionalScope = async (req) => {
  const scopedProfessionalId = getScopedProfessionalId(req);

  if (!scopedProfessionalId) {
    return {
      professionalId: null,
      professionalName: null,
      professionalFilter: null,
      requiresSelection: isAdmin(req),
      invalidProfessional: false
    };
  }

  if (!isAdmin(req)) {
    return {
      professionalId: scopedProfessionalId,
      professionalName: req.context?.professionalName || '',
      professionalFilter: { professional: scopedProfessionalId },
      requiresSelection: false,
      invalidProfessional: false
    };
  }

  const professional = await getProfessionalByIdOrFail(scopedProfessionalId);
  if (!professional) {
    return {
      professionalId: null,
      professionalName: null,
      professionalFilter: null,
      requiresSelection: false,
      invalidProfessional: true
    };
  }

  const professionalName = formatProfessionalName(professional);
  persistAdminProfessionalSelection(req, scopedProfessionalId, professionalName);

  return {
    professionalId: scopedProfessionalId,
    professionalName,
    professionalFilter: { professional: scopedProfessionalId },
    requiresSelection: false,
    invalidProfessional: false
  };
};
