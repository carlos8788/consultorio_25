import { listDoctors, resetDoctorPasswordService } from '../services/doctorService.js';

const buildDoctorViewModel = (doctor) => ({
  id: doctor._id.toString(),
  userId: doctor.userId,
  nombre: doctor.nombre || '',
  apellido: doctor.apellido || '',
  nombreCompleto: [doctor.nombre, doctor.apellido].filter(Boolean).join(' ') || doctor.userId,
  especialidad: doctor.especialidad || 'Clínica General',
  matricula: doctor.matricula || '',
  email: doctor.email || '',
  telefono: doctor.telefono || '',
  passwordUpdatedAt: doctor.passwordUpdatedAt || null
});

export const showDoctorAdminPanel = async (req, res) => {
  try {
    const doctors = await listDoctors();
    res.render('pages/doctores', {
      title: 'Profesionales',
      doctors: doctors.map(buildDoctorViewModel)
    });
  } catch (error) {
    res.status(500).render('error', {
      title: 'Error',
      error: 'No se pudo cargar el listado de profesionales'
    });
  }
};

export const resetDoctorPasswordController = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { doctor, password } = await resetDoctorPasswordService(doctorId);

    res.json({
      success: true,
      newPassword: password,
      doctor: buildDoctorViewModel(doctor)
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'No se pudo restablecer la contraseña'
    });
  }
};
