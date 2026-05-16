export const patientsFromAppointments = (appointments = []) => {
  const patientsById = new Map();

  appointments.forEach((appointment) => {
    if (!appointment.patient_user_id || patientsById.has(appointment.patient_user_id)) {
      return;
    }

    patientsById.set(appointment.patient_user_id, {
      user_id: appointment.patient_user_id,
      full_name: appointment.patient_name || "Patient",
      email: appointment.patient_email || "",
      phone: appointment.patient_phone || "",
      gender: appointment.gender || "",
      blood_group: appointment.blood_group || "",
    });
  });

  return Array.from(patientsById.values()).sort((first, second) =>
    first.full_name.localeCompare(second.full_name),
  );
};
