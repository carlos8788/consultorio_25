import { listDoctors, getDoctorByIdOrFail } from '../services/doctorService.js';
import {
  ADMIN_DOCTOR_SESSION_KEY,
  ADMIN_DOCTOR_NAME_SESSION_KEY
} from '../constants/contextKeys.js';

const formatDoctorLabel = (doctor) => {
  if (!doctor) return '';
  const nombre = [doctor.apellido, doctor.nombre].filter(Boolean).join(', ');
  const especialidad = doctor.especialidad ? ` · ${doctor.especialidad}` : '';
  return `${nombre}${especialidad}`;
};

export const getDoctorsForContext = async (req, res) => {
  try {
    const doctors = await listDoctors();
    res.json({
      doctors: doctors.map((doctor) => ({
        id: doctor._id.toString(),
        label: formatDoctorLabel(doctor)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener profesionales', details: error.message });
  }
};

export const setDoctorContext = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Debes seleccionar un médico' });
    }

    const doctor = await getDoctorByIdOrFail(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const doctorName = formatDoctorLabel(doctor);

    req.session[ADMIN_DOCTOR_SESSION_KEY] = doctorId;
    req.session[ADMIN_DOCTOR_NAME_SESSION_KEY] = doctorName;

    res.json({
      success: true,
      doctorId,
      doctorName
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo guardar la selección', details: error.message });
  }
};
