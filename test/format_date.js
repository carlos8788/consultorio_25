import mongoose from 'mongoose'
import Turno from '../src/models/Turno.js'
import connectDB from '../src/config/database.js'
import dotenv from 'dotenv';

dotenv.config();

const turnos = [
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa8b'),
        diagnostico: '1C\nmanchas en la piel',
        hora: '17:50',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65b01926e85b31e048bb6f05',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa93'),
        diagnostico: 'Primera consulta acné en rostro',
        hora: '18:20',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65ba0d67b7172522ebee2382',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa97'),
        diagnostico: '1C\nPsoriasis\n$9.000',
        hora: '18:40',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65c4e990dca8d159e0008821',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa83'),
        diagnostico: 'cremas dermatologicas para el rostro',
        hora: '17:00',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65b8269dd0c4c54d4ef13dbd',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa89'),
        diagnostico: '1C\nAcantosis',
        hora: '17:30',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65c0fb06ce93f26d6eb4a9d1',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa8d'),
        diagnostico: 'Alopecía',
        hora: '17:40',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65a17707e08537493982e0be',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa87'),
        diagnostico: '1C\nPigmentos melanicos',
        hora: '17:20',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65c0fab5ce93f26d6eb4a9b2',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa95'),
        diagnostico: 'Control tratamiento de rostro y de uñas de pie',
        hora: '18:30',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65ba0d32b7172522ebee237a',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa85'),
        diagnostico: 'Consulta',
        hora: '17:10',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65a17707e08537493982e0b7',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    },
    {
        // _id: ObjectId('65d39c421c9adc70ee1bfa91'),
        diagnostico: 'control de tratamiento de rostro por manchas',
        hora: '18:10',
        fecha: '2024-02-22',
        __v: 0,
        paciente: '65c36937c1b4af79684c153b',
        // doctor: ObjectId('68fe05112aae6b49fcd8a548'),
        // updatedAt: ISODate('2025-10-26T12:36:36.258Z'),
        // professional: ObjectId('68fe05112aae6b49fcd8a548')
    }
];


(async () => {
  try {
    await connectDB();
    console.log('mongo conectado');

    // Traemos solo los turnos donde fecha es string
    // const turnos = await Turno.find({ fecha: { $type: 'string' } });
    const turnos = await Turno.find({ fecha: { $type: 'string' } });

    console.log(`Turnos encontrados: ${turnos.length}`);
    console.log(`Turnos encontrados: ${turnos}`);

    // for (const t of turnos) {
    //   if (!t.fecha) continue;

    //   // t.fecha = '2024-02-22'
    //   const [y, m, d] = t.fecha.split('-').map(Number);
    //   const dd = new Date(y, m - 1, d); // crea la fecha en hora LOCAL

    //   t.fecha = dd; // asignamos Date en vez de string

    //   await t.save();
    //   console.log(`Actualizado turno ${t._id} -> ${dd.toISOString()}`);
    // }

    console.log('Migración completada ✅');

  } catch (error) {
    console.error('Error en la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('mongo desconectado');
  }
})();
