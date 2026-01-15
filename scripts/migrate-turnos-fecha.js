import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Turno from '../src/models/Turno.js';
import connectDB from '../src/config/database.js';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

const FETCH_LIMIT = 10;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const main = async () => {
  await connectDB();

  const filter = { fecha: { $type: 'string' } };
  const totalStrings = await Turno.collection.countDocuments(filter);
  console.log(`Turnos con fecha como string: ${totalStrings}`);

  if (totalStrings === 0) {
    await mongoose.disconnect();
    return;
  }

  const sample = await Turno.collection
    .find(filter, { projection: { fecha: 1 } })
    .limit(FETCH_LIMIT)
    .toArray();
  console.log('Muestras almacenadas (raw):', sample);

  const convertibleFilter = {
    $and: [
      { fecha: { $type: 'string' } },
      { fecha: { $regex: DATE_REGEX } }
    ]
  };

  const convertible = await Turno.collection.countDocuments(convertibleFilter);
  console.log(`Fechas con formato YYYY-MM-DD convertibles: ${convertible}`);

  if (!DRY_RUN) {
    // Actualizamos solo las que cumplen regex YYYY-MM-DD
    const res = await Turno.collection.updateMany(
      convertibleFilter,
      [
        {
          $set: {
            fecha: { $toDate: { $concat: ['$fecha', 'T00:00:00.000Z'] } }
          }
        }
      ]
    );
    console.log(`Actualizados (Mongo updateMany): ${res.modifiedCount}`);
  } else {
    console.log('DRY RUN: no se modificaron documentos. Ejecuta sin --dry-run para aplicar.');
  }

  const remaining = await Turno.collection.countDocuments(filter);
  console.log(`Pendientes con fecha string despues de la corrida: ${remaining}`);

  const remainingSample = await Turno.collection
    .find(filter, { projection: { fecha: 1 } })
    .limit(FETCH_LIMIT)
    .toArray();
  if (remainingSample.length) {
    console.log('Ejemplos pendientes:', remainingSample);
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Error en la migracion de fechas:', err);
  mongoose.disconnect();
  process.exit(1);
});
