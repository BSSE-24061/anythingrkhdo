const db = require("../config/db");

const getAllMedications = async () => {
  const result = await db.query("SELECT * FROM medications ORDER BY name ASC");
  return result.rows;
};

const createMedication = async (medicationData) => {
  const { name, type, description } = medicationData;
  const query = `
        INSERT INTO medications (name, type, description)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
  const result = await db.query(query, [
    name,
    type || null,
    description || null,
  ]);
  return result.rows[0];
};

const getMedicationById = async (medicationId) => {
  const result = await db.query(
    "SELECT * FROM medications WHERE medication_id = $1",
    [medicationId],
  );
  return result.rows[0];
};

const updateMedication = async (medicationId, medicationData) => {
  const { name, type, description } = medicationData;
  const query = `
        UPDATE medications
        SET name = $1, type = $2, description = $3
        WHERE medication_id = $4
        RETURNING *;
    `;
  const result = await db.query(query, [
    name,
    type || null,
    description || null,
    medicationId,
  ]);
  return result.rows[0];
};

const deleteMedication = async (medicationId) => {
  const result = await db.query(
    "DELETE FROM medications WHERE medication_id = $1 RETURNING *",
    [medicationId],
  );
  return result.rows[0];
};

const createMedicationLog = async (logData) => {
  const {
    patient_medication_id,
    patient_user_id,
    scheduled_time,
    taken_at,
    status,
  } = logData;
  const query = `
        INSERT INTO medication_logs (patient_medication_id, patient_user_id, scheduled_time, taken_at, status)
        VALUES ($1, $2, $3, $4, COALESCE($5::medication_status, 'pending'))
        RETURNING *;
    `;
  const result = await db.query(query, [
    patient_medication_id || null,
    patient_user_id,
    scheduled_time || null,
    taken_at || null,
    status || null,
  ]);
  return result.rows[0];
};

const getPatientMedicationLogs = async (patientId) => {
  const query = `
        SELECT ml.*, pm.dosage, pm.frequency, pm.start_date, pm.end_date, m.name AS medication_name, m.type AS medication_type
        FROM medication_logs ml
        LEFT JOIN patient_medications pm ON ml.patient_medication_id = pm.patient_medication_id
        LEFT JOIN medications m ON pm.medication_id = m.medication_id
        WHERE ml.patient_user_id = $1
        ORDER BY ml.scheduled_time DESC NULLS LAST, ml.taken_at DESC NULLS LAST;
    `;
  const result = await db.query(query, [patientId]);
  return result.rows;
};

const updateMedicationLogStatus = async (logId, status, takenAt) => {
  const query = `
        UPDATE medication_logs
        SET status = $1::medication_status,
            taken_at = CASE
              WHEN $1::medication_status = 'taken' THEN COALESCE($2::timestamptz, NOW())
              WHEN $1::medication_status = 'missed' THEN NULL
              ELSE taken_at
            END
        WHERE log_id = $3
        RETURNING *;
    `;
  const result = await db.query(query, [status, takenAt || null, logId]);
  return result.rows[0];
};

module.exports = {
  getAllMedications,
  createMedication,
  getMedicationById,
  updateMedication,
  deleteMedication,
  createMedicationLog,
  getPatientMedicationLogs,
  updateMedicationLogStatus,
};
