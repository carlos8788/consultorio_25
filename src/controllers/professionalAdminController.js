import { listProfessionals, resetProfessionalPasswordService } from '../services/professionalService.js';

const buildProfessionalViewModel = (professional) => ({
  id: professional._id.toString(),
  userId: professional.userId,
  nombre: professional.nombre || '',
  apellido: professional.apellido || '',
  nombreCompleto: [professional.nombre, professional.apellido].filter(Boolean).join(' ') || professional.userId,
  especialidad: professional.especialidad || 'Clínica General',
  matricula: professional.matricula || '',
  email: professional.email || '',
  telefono: professional.telefono || '',
  passwordUpdatedAt: professional.passwordUpdatedAt || null
});

export const getProfessionalsAdminApi = async (req, res) => {
  try {
    const professionals = await listProfessionals();
    res.json(professionals.map(buildProfessionalViewModel));
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo cargar el listado de profesionales',
      details: error.message
    });
  }
};

export const resetProfessionalPasswordController = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { professional, password } = await resetProfessionalPasswordService(professionalId);

    res.json({
      success: true,
      newPassword: password,
      professional: buildProfessionalViewModel(professional)
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'No se pudo restablecer la contraseña'
    });
  }
};
