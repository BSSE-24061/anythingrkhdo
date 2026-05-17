const db = require('../config/db');

// 1. Book a new appointment
const createAppointment = async (appointmentData) => {
    const { patient_user_id, doctor_user_id, scheduled_at, duration_minutes, reason } = appointmentData;
    
    const query = `
        INSERT INTO appointments (patient_user_id, doctor_user_id, scheduled_at, duration_minutes, reason)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    
    // We default duration to 30 minutes if the frontend doesn't provide one
    const values = [patient_user_id, doctor_user_id, scheduled_at, duration_minutes || 30, reason];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 2. Get all appointments for a specific Patient
const getPatientAppointments = async (patientId) => {
    // We use a JOIN to get the Doctor's name so the frontend doesn't just show a random UUID
    const query = `
        SELECT a.*, u.full_name AS doctor_name, u.specialization 
        FROM appointments a
        JOIN users u ON a.doctor_user_id = u.user_id
        WHERE a.patient_user_id = $1
        ORDER BY a.scheduled_at DESC;
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
};

// 3. Get all appointments for a specific Doctor
const getDoctorAppointments = async (doctorId) => {
    // We use a JOIN to get the Patient's name and details
    const query = `
        SELECT
            a.*,
            u.full_name AS patient_name,
            u.email AS patient_email,
            u.phone AS patient_phone,
            u.gender,
            u.blood_group
        FROM appointments a
        JOIN users u ON a.patient_user_id = u.user_id
        WHERE a.doctor_user_id = $1
        ORDER BY a.scheduled_at ASC;
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows;
};

const getAppointmentById = async (appointmentId) => {
    const query = `
        SELECT *
        FROM appointments
        WHERE appointment_id = $1;
    `;
    const result = await db.query(query, [appointmentId]);
    return result.rows[0];
};

// 4. Update Status (e.g., Doctor confirms the appointment)
const updateStatus = async (appointmentId, status) => {
    const query = `
        UPDATE appointments 
        SET status = $1::appointment_status 
        WHERE appointment_id = $2 
        RETURNING *;
    `;
    const result = await db.query(query, [status, appointmentId]);
    return result.rows[0];
};

const hasOverlappingBooking = async (doctorId, patientId, scheduledAt, durationMinutes = 30) => {
    const query = `
        SELECT 1
        FROM appointments
        WHERE (doctor_user_id = $1 OR patient_user_id = $2)
        AND status <> 'cancelled'
        AND scheduled_at < ($3::timestamp + ($4::int * interval '1 minute'))
        AND (scheduled_at + (COALESCE(duration_minutes, 30) * interval '1 minute')) > $3::timestamp
        LIMIT 1;
    `;
    const result = await db.query(query, [doctorId, patientId, scheduledAt, durationMinutes]);
    return result.rows.length > 0;
};

module.exports = {
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getAppointmentById,
    updateStatus,
    hasOverlappingBooking
};
