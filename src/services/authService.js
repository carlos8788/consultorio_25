import { resolveUsersFromEnv } from '../config/users.js';
import {
  ensureDoctorForUser,
  assignLegacyRecordsToDoctor
} from './doctorService.js';

export const authenticateUser = async ({ username, password }) => {
  const users = resolveUsersFromEnv();
  const validUser = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!validUser) {
    return null;
  }

  const doctor = await ensureDoctorForUser(validUser);

  if (doctor && validUser.assignLegacyRecords) {
    await assignLegacyRecordsToDoctor(doctor._id);
  }

  return {
    user: validUser,
    doctor,
    sessionPayload: {
      id: validUser.id,
      username: validUser.username,
      role: validUser.role,
      doctorId: doctor ? doctor._id.toString() : null,
      doctorName: doctor ? `${doctor.nombre} ${doctor.apellido}`.trim() : null
    }
  };
};
