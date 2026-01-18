import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import mongoose from 'mongoose';
import Professional from '../src/models/Professional.js';
import ObraSocial from '../src/models/ObraSocial.js';
import Paciente from '../src/models/Paciente.js';
import Turno from '../src/models/Turno.js';
import Subscription from '../src/models/Subscription.js';
import NotaPaciente from '../src/models/NotaPaciente.js';
import AvisoPaciente from '../src/models/AvisoPaciente.js';
import InteresadoNotificacion from '../src/models/InteresadoNotificacion.js';
import IdeaRequest from '../src/models/IdeaRequest.js';
import DemoRequest from '../src/models/DemoRequest.js';
import UserAccount from '../src/models/UserAccount.js';
import { hashPassword } from '../src/utils/passwordUtils.js';

const log = (...messages) => {
  console.log('[seed:min]', ...messages);
};

/*
pnpm run seed:min -- --db "mongodb://USER:PASS@HOST:PORT/NOMBREDB"

  Con npm:

  cd backend
  npm run seed:min -- --db "mongodb://USER:PASS@HOST:PORT/NOMBREDB"
*/

const parseSeedDbUri = () => {
  const args = process.argv.slice(2);
  const findValueForFlag = (flag) => {
    const direct = `${flag}=`;
    const directMatch = args.find((arg) => arg.startsWith(direct));
    if (directMatch) {
      const value = directMatch.slice(direct.length);
      return value || null;
    }

    const index = args.indexOf(flag);
    if (index === -1) return null;
    const next = args[index + 1];
    if (!next || next.startsWith('-')) return null;
    return next;
  };

  return (
    findValueForFlag('--db')
    || findValueForFlag('--mongodb-uri')
    || findValueForFlag('--uri')
    || findValueForFlag('-d')
  );
};

const assertDbNameInUri = (uri) => {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch (error) {
    throw new Error('La URI de MongoDB no es valida. Usa un formato como mongodb://host/db.');
  }

  const pathname = parsed.pathname || '';
  const dbName = pathname.replace(/^\/+/, '').split('/')[0];
  if (!dbName) {
    throw new Error('La URI de MongoDB debe incluir el nombre de la base (ej: mongodb://host/mi-db).');
  }
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

const COLLECTIONS = [
  { label: 'professionals', model: Professional },
  { label: 'useraccounts', model: UserAccount },
  { label: 'subscriptions', model: Subscription },
  { label: 'obrasocials', model: ObraSocial },
  { label: 'pacientes', model: Paciente },
  { label: 'turnos', model: Turno },
  { label: 'notapacientes', model: NotaPaciente },
  { label: 'avisopacientes', model: AvisoPaciente },
  { label: 'interesadonotificacions', model: InteresadoNotificacion },
  { label: 'idearequests', model: IdeaRequest },
  { label: 'demorequests', model: DemoRequest }
];

const createPrompt = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) =>
    new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });

  return {
    ask,
    close: () => rl.close()
  };
};

const promptYesNo = async (ask, question) => {
  const answer = String(await ask(question)).trim().toLowerCase();
  return answer === 's' || answer === 'si' || answer === 'y' || answer === 'yes';
};

const buildBackupDir = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), 'scripts', 'seed-backups', stamp);
};

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

const backupCollections = async (collections, backupDir) => {
  await fs.mkdir(backupDir, { recursive: true });

  for (const { label, model } of collections) {
    const docs = await model.find({}).lean();
    if (!docs.length) {
      continue;
    }

    const rows = ['_id,data'];
    docs.forEach((doc) => {
      const id = doc?._id?.toString?.() || '';
      const payload = JSON.stringify(doc);
      rows.push([escapeCsv(id), escapeCsv(payload)].join(','));
    });

    const filePath = path.join(backupDir, `${label}.csv`);
    await fs.writeFile(filePath, rows.join('\n'), 'utf8');
  }
};

const getCollectionStats = async (collections) => {
  const stats = [];
  for (const { label, model } of collections) {
    const count = await model.countDocuments();
    stats.push({ label, count });
  }
  return stats;
};

const purgeCollections = async (collections) => {
  for (const { model } of collections) {
    await model.deleteMany({});
  }
};

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

const upsertPacienteCobertura = async (pacienteId, professionalId, obraSocialId) => {
  const tipo = obraSocialId ? 'obraSocial' : 'particular';
  const updateResult = await Paciente.updateOne(
    { _id: pacienteId, 'coberturas.professional': professionalId },
    {
      $set: {
        'coberturas.$.tipo': tipo,
        'coberturas.$.obraSocial': obraSocialId || null
      }
    }
  );

  if (updateResult.matchedCount === 0) {
    await Paciente.updateOne(
      { _id: pacienteId },
      {
        $push: {
          coberturas: {
            professional: professionalId,
            tipo,
            obraSocial: obraSocialId || null
          }
        }
      }
    );
  }
};

const seed = async () => {
  const seedDbUri = parseSeedDbUri();
  if (!seedDbUri) {
    throw new Error('Falta el parametro --db con la URI de MongoDB.');
  }

  assertDbNameInUri(seedDbUri);
  log('Usando MONGODB_URI provisto por parametro.');
  await mongoose.connect(seedDbUri);

  const stats = await getCollectionStats(COLLECTIONS);
  log('Conteo actual de colecciones:');
  stats.forEach(({ label, count }) => {
    log(`${label}: ${count}`);
  });

  const prompt = createPrompt();
  try {
    const shouldBackup = await promptYesNo(
      prompt.ask,
      'Deseas generar backup CSV de los datos existentes? (s/N): '
    );
    if (shouldBackup) {
      const backupDir = buildBackupDir();
      await backupCollections(COLLECTIONS, backupDir);
      log(`Backup CSV generado en: ${backupDir}`);
    }

    const shouldPurge = await promptYesNo(
      prompt.ask,
      'Deseas borrar TODOS los datos existentes antes de seed? (s/N): '
    );
    if (shouldPurge) {
      await purgeCollections(COLLECTIONS);
      log('Datos existentes eliminados.');
    }
  } finally {
    prompt.close();
  }

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

  if (obraSocial?._id) {
    await upsertProfessionalObraSocial(professional._id, obraSocial._id, 'activa');
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
      obraSocial: obraSocial?._id || null,
      professional: professional._id,
      professionals: [professional._id],
      coberturas: [{
        professional: professional._id,
        tipo: obraSocial?._id ? 'obraSocial' : 'particular',
        obraSocial: obraSocial?._id || null
      }]
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

  if (paciente?._id) {
    await upsertPacienteCobertura(paciente._id, professional._id, obraSocial?._id || null);
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
