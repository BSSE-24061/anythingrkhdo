const db = require('../config/db');

// 1. Create a new Master Prescription
const createPrescription = async (prescriptionData) => {
    const { patient_user_id, doctor_user_id, appointment_id, diagnosis, diagnosis_notes, symptoms_notes, follow_up_date } = prescriptionData;
    
    const query = `
        INSERT INTO prescriptions (patient_user_id, doctor_user_id, appointment_id, diagnosis, diagnosis_notes, symptoms_notes, follow_up_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    
    const values = [patient_user_id, doctor_user_id, appointment_id, diagnosis, diagnosis_notes, symptoms_notes, follow_up_date];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 2. Add a specific medication to that prescription
const addPatientMedication = async (medicationData) => {
    const { prescription_id, patient_user_id, medication_id, dosage, frequency, start_date, end_date, dosage_schedule } = medicationData;
    
    const query = `
        INSERT INTO patient_medications (prescription_id, patient_user_id, medication_id, dosage, frequency, start_date, end_date, dosage_schedule)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        RETURNING *;
    `;
    
    const values = [
        prescription_id,
        patient_user_id,
        medication_id,
        dosage,
        frequency,
        start_date,
        end_date,
        dosage_schedule ? JSON.stringify(dosage_schedule) : null,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 3. Get all prescriptions for a patient (including the doctor's name)
const getPatientPrescriptions = async (patientId) => {
    const query = `
        SELECT p.*, u.full_name AS doctor_name, u.specialization 
        FROM prescriptions p
        JOIN users u ON p.doctor_user_id = u.user_id
        WHERE p.patient_user_id = $1
        ORDER BY p.prescribed_at DESC;
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
};

// 4. Get the specific medications attached to a single prescription
const getMedicationsByPrescription = async (prescriptionId) => {
    const query = `
        SELECT pm.*, m.name AS medication_name, m.type, m.description
        FROM patient_medications pm
        JOIN medications m ON pm.medication_id = m.medication_id
        WHERE pm.prescription_id = $1;
    `;
    const result = await db.query(query, [prescriptionId]);
    return result.rows;
};

const getPrescriptionWithAppointment = async (prescriptionId) => {
    const query = `
        SELECT
            p.*,
            a.status AS appointment_status,
            a.scheduled_at AS appointment_scheduled_at
        FROM prescriptions p
        JOIN appointments a ON p.appointment_id = a.appointment_id
        WHERE p.prescription_id = $1;
    `;
    const result = await db.query(query, [prescriptionId]);
    return result.rows[0];
};

module.exports = {
    createPrescription,
    addPatientMedication,
    getPatientPrescriptions,
    getMedicationsByPrescription,
    getPrescriptionWithAppointment
};
