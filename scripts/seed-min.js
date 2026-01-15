import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.js';
import Professional from '../src/models/Professional.js';
import ObraSocial from '../src/models/ObraSocial.js';
import Paciente from '../src/models/Paciente.js';
import Turno from '../src/models/Turno.js';
import Subscription from '../src/models/Subscription.js';
import { hashPassword } from '../src/utils/passwordUtils.js';

dotenv.config();

const log = (...messages) => {
  console.log('[seed:min]', ...messages);
};

const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateAge = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const dob = new Date(fechaNacimiento);
  if (Number.isNaN(dob.getTime())) return '';
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
};

const buildTurnoDate = (daysAhead) => {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + daysAhead);
  const isoDate = base.toISOString().split('T')[0];
  return new Date(isoDate);
};

const buildFutureDate = (daysAhead) => {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + daysAhead);
  return base;
};

const seed = async () => {
  await connectDB();

  const professionalUser = process.env.SEED_PROFESSIONAL_USER || 'prof-demo';
  const professionalPassword = process.env.SEED_PROFESSIONAL_PASSWORD || 'demo1234';

  const professionalPayload = {
    userId: professionalUser,
    username: professionalUser,
    nombre: process.env.SEED_PROFESSIONAL_NOMBRE || 'Camila',
    apellido: process.env.SEED_PROFESSIONAL_APELLIDO || 'Sosa',
    especialidad: process.env.SEED_PROFESSIONAL_ESPECIALIDAD || 'Clinica General',
    email: process.env.SEED_PROFESSIONAL_EMAIL || 'camila.sosa@example.com',
    telefono: process.env.SEED_PROFESSIONAL_TELEFONO || '11-5555-1234'
  };

  let professional = await Professional.findOne({
    $or: [{ userId: professionalPayload.userId }, { username: professionalPayload.username }]
  }).select('+passwordHash');

  if (!professional) {
    const passwordHash = await hashPassword(professionalPassword);
    professional = await Professional.create({
      ...professionalPayload,
      passwordHash
    });
    log('Profesional creado:', professional._id.toString());
  } else if (!professional.passwordHash) {
    const passwordHash = await hashPassword(professionalPassword);
    professional = await Professional.findByIdAndUpdate(
      professional._id,
      { passwordHash, passwordUpdatedAt: new Date() },
      { new: true }
    ).select('+passwordHash');
    log('Profesional existente actualizado (password).');
  } else {
    log('Profesional existente:', professional._id.toString());
  }

  const subscriptionDays = Math.max(1, toSafeInt(process.env.SEED_SUBSCRIPTION_DAYS, 30));
  const activeSubscription = await Subscription.findOne({
    professional: professional._id,
    status: 'activa',
    $or: [{ fin: null }, { fin: { $gte: new Date() } }]
  });

  if (!activeSubscription) {
    await Subscription.create({
      professional: professional._id,
      plan: process.env.SEED_SUBSCRIPTION_PLAN || 'mensual',
      status: 'activa',
      monto: toSafeInt(process.env.SEED_SUBSCRIPTION_MONTO, 0),
      moneda: process.env.SEED_SUBSCRIPTION_MONEDA || 'ARS',
      inicio: new Date(),
      fin: buildFutureDate(subscriptionDays),
      autoRenovar: true,
      notas: 'Seed minimo'
    });
    log('Suscripcion activa creada para el profesional.');
  } else {
    log('Suscripcion activa existente.');
  }

  const obraSocialNombre = process.env.SEED_OBRA_SOCIAL_NOMBRE || 'OSDE Demo';
  let obraSocial = await ObraSocial.findOne({ nombre: obraSocialNombre });

  if (!obraSocial) {
    obraSocial = await ObraSocial.create({
      nombre: obraSocialNombre,
      telefono: process.env.SEED_OBRA_SOCIAL_TELEFONO || '0800-000-0000',
      direccion: process.env.SEED_OBRA_SOCIAL_DIRECCION || 'Av. Siempre Viva 123'
    });
    log('Obra social creada:', obraSocial._id.toString());
  } else {
    log('Obra social existente:', obraSocial._id.toString());
  }

  const pacienteDni = process.env.SEED_PACIENTE_DNI || '12345678';
  const pacienteFechaNacimiento = process.env.SEED_PACIENTE_FECHA_NACIMIENTO || '1990-01-15';
  let paciente = await Paciente.findOne({ dni: pacienteDni });

  if (!paciente) {
    paciente = await Paciente.create({
      nombre: process.env.SEED_PACIENTE_NOMBRE || 'Juan',
      apellido: process.env.SEED_PACIENTE_APELLIDO || 'Perez',
      dni: pacienteDni,
      telefono: process.env.SEED_PACIENTE_TELEFONO || '11-5555-6789',
      fechaNacimiento: pacienteFechaNacimiento,
      edad: calculateAge(pacienteFechaNacimiento),
      obraSocial: obraSocial?._id || undefined,
      professional: professional._id,
      professionals: [professional._id]
    });
    log('Paciente creado:', paciente._id.toString());
  } else {
    const update = {};
    const setPayload = {};
    const addToSet = {};

    if (!paciente.professional) {
      setPayload.professional = professional._id;
    }
    if (!paciente.obraSocial && obraSocial?._id) {
      setPayload.obraSocial = obraSocial._id;
    }
    const hasProfessional = Array.isArray(paciente.professionals)
      && paciente.professionals.some((id) => id.toString() === professional._id.toString());
    if (!hasProfessional) {
      addToSet.professionals = professional._id;
    }

    if (Object.keys(setPayload).length) {
      update.$set = setPayload;
    }
    if (Object.keys(addToSet).length) {
      update.$addToSet = addToSet;
    }

    if (Object.keys(update).length) {
      paciente = await Paciente.findByIdAndUpdate(paciente._id, update, { new: true });
      log('Paciente existente actualizado:', paciente._id.toString());
    } else {
      log('Paciente existente:', paciente._id.toString());
    }
  }

  const turnoHora = process.env.SEED_TURNO_HORA || '10:00';
  const daysAhead = Math.max(0, toSafeInt(process.env.SEED_TURNO_DIAS, 1));
  const turnoFecha = buildTurnoDate(daysAhead);

  const turnoFilter = {
    professional: professional._id,
    fecha: turnoFecha,
    hora: turnoHora
  };

  let turno = await Turno.findOne(turnoFilter);

  if (!turno) {
    turno = await Turno.create({
      ...turnoFilter,
      paciente: paciente._id,
      estado: 'confirmado',
      observacionesTurno: 'Consulta inicial'
    });
    log('Turno creado:', turno._id.toString());
  } else {
    log('Turno existente:', turno._id.toString());
  }
};

seed()
  .catch((error) => {
    console.error('[seed:min] Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
