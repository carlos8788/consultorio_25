import { createSubscription, getSubscriptionsByProfessional } from '../services/subscriptionService.js';
import { getProfessionalByIdOrFail } from '../services/professionalService.js';

export const createSubscriptionApi = async (req, res) => {
  try {
    const { professionalId, plan, status, monto, moneda, fin, autoRenovar } = req.body;
    if (!professionalId || !plan) {
      return res.status(400).json({ error: 'professionalId y plan son obligatorios' });
    }
    const professional = await getProfessionalByIdOrFail(professionalId);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    const sub = await createSubscription({
      professional: professionalId,
      plan,
      status: status || 'activa',
      monto: monto ? Number(monto) : 0,
      moneda: moneda || 'ARS',
      fin: fin ? new Date(fin) : undefined,
      autoRenovar: typeof autoRenovar === 'boolean' ? autoRenovar : true,
      createdBy: req.auth?.user?.id || req.context?.user?.id || null
    });
    return res.status(201).json({ subscription: sub });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo crear la suscripción' });
  }
};

export const listSubscriptionsByProfessionalApi = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const professional = await getProfessionalByIdOrFail(professionalId);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }
    const subs = await getSubscriptionsByProfessional(professionalId);
    return res.json({ subscriptions: subs });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron listar suscripciones' });
  }
};
