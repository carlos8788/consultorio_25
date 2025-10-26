import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import Doctor from '../src/models/Doctor.js';
import Paciente from '../src/models/Paciente.js';
import Turno from '../src/models/Turno.js';

const doctorsSeed = [
  {
    userId: 'ana.gutierrez',
    nombre: 'Ana Melisa',
    apellido: 'Gutierrez',
    especialidad: 'Dermatóloga - Tricología',
    matricula: 'MP-0001',
    telefono: '+54 9 11 5555-1111',
    email: 'ana.gutierrez@example.com'
  },
  {
    userId: 'gabriela.gamen',
    nombre: 'Gabriela',
    apellido: 'Gamen',
    especialidad: 'Clínica Médica',
    matricula: 'MP-0002',
    telefono: '+54 9 11 5555-2222',
    email: 'gabriela.gamen@example.com'
  }
];

const seedDoctors = async () => {
  await connectDB();

  const upsertedDoctors = [];

  for (const doctorData of doctorsSeed) {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: doctorData.userId },
      { $set: doctorData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    upsertedDoctors.push(doctor);
  }

  const anaDoctor = upsertedDoctors.find((doctor) =>
    doctor.userId === 'ana.gutierrez'
  ) || await Doctor.findOne({ userId: 'ana.gutierrez' });

  if (anaDoctor) {
    await Promise.all([
      Paciente.updateMany(
        {},
        {
          $set: { doctor: anaDoctor._id },
          $addToSet: { doctores: anaDoctor._id }
        }
      ),
      Turno.updateMany({}, { doctor: anaDoctor._id })
    ]);
  }

  console.log('Doctores sincronizados:');
  upsertedDoctors.forEach((doctor) => {
    console.log(`- ${doctor.nombre} ${doctor.apellido} (${doctor.especialidad})`);
  });

  if (anaDoctor) {
    console.log('Todos los pacientes y turnos se asociaron a la Dra. Ana Melisa Gutierrez.');
  } else {
    console.warn('No se pudo encontrar a la Dra. Ana Melisa Gutierrez para asociar los registros existentes.');
  }

  await mongoose.connection.close();
};

seedDoctors()
  .then(() => {
    console.log('Seed finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    mongoose.connection.close().finally(() => process.exit(1));
  });
