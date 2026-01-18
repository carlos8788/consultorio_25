import { getSystemConfig, saveSystemConfig } from '../services/systemConfigService.js';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const sanitizeClinic = (clinic = {}) =>
  ['nombre', 'telefono', 'email', 'direccion', 'ciudad', 'provincia']
    .reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(clinic, key)) {
        acc[key] = normalizeString(clinic[key]);
      }
      return acc;
    }, {});

const sanitizeNotifications = (notifications = {}) =>
  ['email', 'whatsapp']
    .reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(notifications, key) && typeof notifications[key] === 'boolean') {
        acc[key] = notifications[key];
      }
      return acc;
    }, {});

const buildUpdates = (body = {}) => {
  const updates = {};

  if (body.clinic) {
    const clinic = sanitizeClinic(body.clinic);
    if (Object.keys(clinic).length) {
      updates.clinic = clinic;
    }
  }

  if (body.notifications) {
    const notifications = sanitizeNotifications(body.notifications);
    if (Object.keys(notifications).length) {
      updates.notifications = notifications;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'timezone')) {
    updates.timezone = normalizeString(body.timezone);
  }

  return updates;
};

export const getSystemConfigApi = async (_req, res) => {
  try {
    const config = await getSystemConfig();
    return res.json({ config });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo cargar la configuracion' });
  }
};

export const updateSystemConfigApi = async (req, res) => {
  try {
    const updates = buildUpdates(req.body || {});
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No hay cambios para actualizar' });
    }

    const config = await saveSystemConfig(updates);
    return res.json({ config });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar la configuracion' });
  }
};
