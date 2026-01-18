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
import SystemConfig from '../src/models/SystemConfig.js';
import { hashPassword } from '../src/utils/passwordUtils.js';

const log = (...messages) => {
  console.log('[seed:demo]', ...messages);
};

/*
pnpm run seed:demo -- --db "mongodb://USER:PASS@HOST:PORT/NOMBREDB"
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

const buildBirthDate = (index) => {
  const year = 1975 + (index % 30);
  const month = ((index + 3) % 12) + 1;
  const day = ((index + 7) % 28) + 1;
  return [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0')
  ].join('-');
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
  { label: 'demorequests', model: DemoRequest },
  { label: 'systemconfigs', model: SystemConfig }
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

const PROFESSIONALS = [
  {
    userId: 'prof-camila',
    username: 'camila.sosa',
    nombre: 'Camila',
    apellido: 'Sosa',
    especialidad: 'Clinica General',
    email: 'camila.sosa@example.com',
    telefono: '11-5555-1234'
  },
  {
    userId: 'prof-marcos',
    username: 'marcos.diaz',
    nombre: 'Marcos',
    apellido: 'Diaz',
    especialidad: 'Odontologia',
    email: 'marcos.diaz@example.com',
    telefono: '11-5555-5678'
  },
  {
    userId: 'prof-lucia',
    username: 'lucia.torres',
    nombre: 'Lucia',
    apellido: 'Torres',
    especialidad: 'Kinesiologia',
    email: 'lucia.torres@example.com',
    telefono: '11-5555-9012'
  }
];

const OBRAS_SOCIALES = [
  {
    nombre: 'OSDE',
    telefono: '0800-555-6733',
    direccion: 'Av. Libertador 100'
  },
  {
    nombre: 'Swiss Medical',
    telefono: '0800-222-7947',
    direccion: 'Av. Callao 200'
  },
  {
    nombre: 'IOMA',
    telefono: '0800-999-4662',
    direccion: 'Calle 7 300'
  },
  {
    nombre: 'PAMI',
    telefono: '138',
    direccion: 'Av. Corrientes 400',
    padron: 'Categorizado'
  },
  {
    nombre: 'Galeno',
    telefono: '0800-555-6253',
    direccion: 'Av. Cordoba 500'
  },
  {
    nombre: 'Sancor Salud',
    telefono: '0800-444-7262',
    direccion: 'Av. Santa Fe 600'
  }
];

const FIRST_NAMES = [
  'Juan', 'Maria', 'Lucia', 'Carlos', 'Sofia', 'Pedro',
  'Valentina', 'Martin', 'Camila', 'Diego', 'Julieta', 'Nicolas',
  'Florencia', 'Ignacio', 'Paula', 'Gonzalo', 'Carla', 'Tomas',
  'Julian', 'Rocio', 'Bruno', 'Micaela', 'Franco', 'Agustina'
];

const LAST_NAMES = [
  'Gomez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Diaz',
  'Romero', 'Alvarez', 'Torres', 'Acosta', 'Suarez', 'Molina',
  'Castro', 'Navarro', 'Ruiz', 'Gutierrez'
];

const ensureProfessional = async (payload, password) => {
  let professional = await Professional.findOne({
    $or: [{ userId: payload.userId }, { username: payload.username }]
  }).select('+passwordHash');

  if (!professional) {
    const passwordHash = await hashPassword(password);
    professional = await Professional.create({
      ...payload,
      passwordHash,
      passwordUpdatedAt: new Date()
    });
    log('Profesional creado:', payload.userId);
  } else if (!professional.passwordHash) {
    const passwordHash = await hashPassword(password);
    professional = await Professional.findByIdAndUpdate(
      professional._id,
      { passwordHash, passwordUpdatedAt: new Date() },
      { new: true }
    ).select('+passwordHash');
    log('Profesional existente actualizado (password):', payload.userId);
  } else {
    log('Profesional existente:', payload.userId);
  }

  return professional;
};

const ensureActiveSubscription = async (professionalId, plan = 'mensual') => {
  const activeSubscription = await Subscription.findOne({
    professional: professionalId,
    status: 'activa',
    $or: [{ fin: null }, { fin: { $gte: new Date() } }]
  });

  if (!activeSubscription) {
    await Subscription.create({
      professional: professionalId,
      plan,
      status: 'activa',
      monto: 0,
      moneda: 'ARS',
      inicio: new Date(),
      fin: buildFutureDate(plan === 'anual' ? 365 : 45),
      autoRenovar: true,
      notas: 'Seed demo'
    });
    log('Suscripcion activa creada:', professionalId.toString());
  }
};

const ensureObraSocial = async (payload) => {
  const existing = await ObraSocial.findOne({ nombre: payload.nombre });
  if (existing) {
    return existing;
  }
  return ObraSocial.create(payload);
};

const ensurePaciente = async ({ payload, assignedProfessionalIds, primaryProfessionalId, obraSocialId }) => {
  let paciente = await Paciente.findOne({ dni: payload.dni });

  if (!paciente) {
    paciente = await Paciente.create({
      ...payload,
      obraSocial: obraSocialId || null,
      professional: primaryProfessionalId,
      professionals: assignedProfessionalIds,
      coberturas: assignedProfessionalIds.map((professionalId) => ({
        professional: professionalId,
        tipo: obraSocialId ? 'obraSocial' : 'particular',
        obraSocial: obraSocialId || null
      }))
    });
  } else {
    const update = {};
    const setPayload = {};
    const addToSet = {};

    if (!paciente.professional && primaryProfessionalId) {
      setPayload.professional = primaryProfessionalId;
    }
    if (!paciente.obraSocial && obraSocialId) {
      setPayload.obraSocial = obraSocialId;
    }
    if (assignedProfessionalIds?.length) {
      addToSet.professionals = { $each: assignedProfessionalIds };
    }

    if (Object.keys(setPayload).length) {
      update.$set = setPayload;
    }
    if (Object.keys(addToSet).length) {
      update.$addToSet = addToSet;
    }

    if (Object.keys(update).length) {
      paciente = await Paciente.findByIdAndUpdate(paciente._id, update, { new: true });
    }
  }

  for (const professionalId of assignedProfessionalIds) {
    await upsertPacienteCobertura(paciente._id, professionalId, obraSocialId);
  }

  return paciente;
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

  const demoPassword = process.env.SEED_DEMO_PASSWORD || 'demo1234';
  const professionals = [];
  for (const payload of PROFESSIONALS) {
    const professional = await ensureProfessional(payload, demoPassword);
    professionals.push(professional);
  }
  log(`Password para profesionales demo: ${demoPassword}`);

  for (const [index, professional] of professionals.entries()) {
    const plan = index % 2 === 0 ? 'mensual' : 'anual';
    await ensureActiveSubscription(professional._id, plan);
  }

  const obraSociales = [];
  for (const payload of OBRAS_SOCIALES) {
    const obraSocial = await ensureObraSocial(payload);
    obraSociales.push(obraSocial);
  }

  for (const professional of professionals) {
    for (const obraSocial of obraSociales) {
      await upsertProfessionalObraSocial(professional._id, obraSocial._id, 'activa');
    }
  }

  const patientsByProfessional = new Map();
  const addPatientToMap = (patientDoc, professionalIds) => {
    const patientId = patientDoc._id?.toString() || patientDoc.id;
    if (!patientId) return;
    professionalIds.forEach((id) => {
      const key = id.toString();
      if (!patientsByProfessional.has(key)) {
        patientsByProfessional.set(key, []);
      }
      const list = patientsByProfessional.get(key);
      if (!list.some((item) => item._id?.toString?.() === patientId || item.id === patientId)) {
        list.push(patientDoc);
      }
    });
  };

  const buildPacientePayload = (index) => {
    const nombre = FIRST_NAMES[index % FIRST_NAMES.length];
    const apellido = LAST_NAMES[index % LAST_NAMES.length];
    const dni = String(30000000 + index);
    const telefono = `11-4000-${String(1000 + index).padStart(4, '0')}`;
    const fechaNacimiento = buildBirthDate(index);
    return {
      nombre,
      apellido,
      dni,
      telefono,
      fechaNacimiento,
      edad: calculateAge(fechaNacimiento)
    };
  };

  let patientIndex = 0;
  const sharedPatients = [];
  const sharedCount = 3;
  for (let i = 0; i < sharedCount; i += 1) {
    sharedPatients.push(buildPacientePayload(patientIndex));
    patientIndex += 1;
  }

  for (const payload of sharedPatients) {
    const obraSocial = obraSociales[patientIndex % obraSociales.length] || null;
    const obraSocialId = patientIndex % 4 === 0 ? null : obraSocial?._id || null;
    const assignedIds = professionals.map((prof) => prof._id);
    const paciente = await ensurePaciente({
      payload,
      assignedProfessionalIds: assignedIds,
      primaryProfessionalId: professionals[0]._id,
      obraSocialId
    });
    addPatientToMap(paciente, assignedIds);
    patientIndex += 1;
  }

  const uniquePerProfessional = 7;
  for (const professional of professionals) {
    for (let i = 0; i < uniquePerProfessional; i += 1) {
      const payload = buildPacientePayload(patientIndex);
      const obraSocial = obraSociales[patientIndex % obraSociales.length] || null;
      const obraSocialId = patientIndex % 4 === 0 ? null : obraSocial?._id || null;
      const paciente = await ensurePaciente({
        payload,
        assignedProfessionalIds: [professional._id],
        primaryProfessionalId: professional._id,
        obraSocialId
      });
      addPatientToMap(paciente, [professional._id]);
      patientIndex += 1;
    }
  }

  log('Pacientes por profesional:');
  professionals.forEach((professional) => {
    const count = patientsByProfessional.get(professional._id.toString())?.length || 0;
    log(`${professional.userId}: ${count}`);
  });

  const horasTurno = [
    '09:00', '09:45', '10:30', '11:15', '12:00',
    '14:00', '14:45', '15:30', '16:15', '17:00'
  ];

  for (let i = 0; i < 10; i += 1) {
    const professional = professionals[i % professionals.length];
    const key = professional._id.toString();
    const patients = patientsByProfessional.get(key) || [];
    const paciente = patients[i % patients.length];
    const fecha = buildTurnoDate(i + 1);
    const hora = horasTurno[i];
    const turnoFilter = { professional: professional._id, fecha, hora };

    let turno = await Turno.findOne(turnoFilter);
    if (!turno) {
      turno = await Turno.create({
        ...turnoFilter,
        paciente: paciente?._id || null,
        estado: i % 3 === 0 ? 'confirmado' : i % 3 === 1 ? 'pendiente' : 'completado',
        observacionesTurno: 'Seed demo - control programado',
        diagnostico: i % 2 === 0 ? 'Control general' : ''
      });
      log('Turno creado:', turno._id.toString());
    }
  }

  const noteTemplates = [
    { titulo: 'Seguimiento inicial', tipo: 'clinica' },
    { titulo: 'Control administrativo', tipo: 'administrativa' },
    { titulo: 'Nota general', tipo: 'general' }
  ];

  for (const professional of professionals) {
    const key = professional._id.toString();
    const patients = patientsByProfessional.get(key) || [];
    for (let i = 0; i < 3; i += 1) {
      const template = noteTemplates[i % noteTemplates.length];
      const titulo = `${template.titulo} - ${professional.apellido}`;
      const existing = await NotaPaciente.findOne({ professional: professional._id, titulo });
      if (existing) {
        continue;
      }
      await NotaPaciente.create({
        professional: professional._id,
        paciente: i < 2 ? patients[i % patients.length]?._id || null : null,
        titulo,
        contenido: `Registro ${i + 1} para ${professional.nombre}.`,
        tipo: template.tipo,
        tags: ['seed', template.tipo],
        pinned: i === 0,
        createdBy: professional.userId
      });
    }
  }

  const avisoCanales = ['whatsapp', 'llamada', 'email', 'sms', 'otro'];
  const avisoTipos = ['seguimiento', 'reprogramacion', 'general', 'licencia', 'otro'];

  for (const professional of professionals) {
    const key = professional._id.toString();
    const patients = patientsByProfessional.get(key) || [];
    for (let i = 0; i < 5; i += 1) {
      const titulo = `Aviso ${i + 1} - ${professional.apellido}`;
      const existing = await AvisoPaciente.findOne({ professional: professional._id, titulo });
      if (existing) {
        continue;
      }
      const paciente = patients[i % patients.length];
      await AvisoPaciente.create({
        professional: professional._id,
        paciente: paciente?._id || null,
        pacienteNombre: paciente ? `${paciente.apellido}, ${paciente.nombre}` : null,
        telefono: paciente?.telefono || null,
        titulo,
        motivo: 'Recordatorio de seguimiento',
        tipo: avisoTipos[i % avisoTipos.length],
        canal: avisoCanales[i % avisoCanales.length],
        prioridad: i % 2 === 0 ? 'media' : 'alta',
        fechaProgramada: buildFutureDate(i + 2),
        estado: i % 2 === 0 ? 'programado' : 'pendiente',
        notas: 'Seed demo'
      });
    }
  }
};

seed()
  .catch((error) => {
    console.error('[seed:demo] Error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
