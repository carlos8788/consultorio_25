import { resolveUsersFromEnv } from '../config/users.js';
import { authenticateDoctorCredentials } from './doctorService.js';

const buildDoctorSessionPayload = (doctor) => ({
  id: doctor.userId,
  username: doctor.userId,
  role: 'user',
  doctorId: doctor._id.toString(),
  doctorName: `${doctor.nombre || ''} ${doctor.apellido || ''}`.trim()
});

export const authenticateUser = async ({ username, password }) => {
  const users = resolveUsersFromEnv().filter((user) => user.role === 'admin');
  const validAdmin = users.find(
    (user) => user.username === username && user.password === password
  );

  if (validAdmin) {
    return {
      user: validAdmin,
      doctor: null,
      sessionPayload: {
        id: validAdmin.id,
        username: validAdmin.username,
        role: validAdmin.role,
        doctorId: null,
        doctorName: null
      }
    };
  }

  const doctor = await authenticateDoctorCredentials(username, password);
  if (!doctor) {
    return null;
  }

  if (doctor.passwordHash) {
    doctor.passwordHash = undefined;
  }

  return {
    user: {
      id: doctor.userId,
      username: doctor.userId,
      role: 'user'
    },
    doctor,
    sessionPayload: buildDoctorSessionPayload(doctor)
  };
};
