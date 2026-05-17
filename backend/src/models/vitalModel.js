const db = require('../config/db');

// 1. Log new vitals
const createVitalLog = async (vitalData) => {
    const { patient_user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, glucose_level, oxygen_saturation, temperature, weight } = vitalData;
    
    const query = `
        INSERT INTO vitals (patient_user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, glucose_level, oxygen_saturation, temperature, weight)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    
    const values = [patient_user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, glucose_level, oxygen_saturation, temperature, weight];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 2. Get vitals history for a patient
const getPatientVitals = async (patientId) => {
    const query = `
        SELECT * FROM vitals 
        WHERE patient_user_id = $1 
        ORDER BY logged_at DESC;
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
};

// 3. Create an automatic alert
const createAlert = async (alertData) => {
    const { patient_user_id, vital_id, alert_type, message, severity } = alertData;
    
    // severity must match your ENUM: 'low', 'medium', 'high', 'critical'
    const query = `
        INSERT INTO alerts (patient_user_id, vital_id, alert_type, message, severity)
        VALUES ($1, $2, $3, $4, $5::alert_severity)
        RETURNING *;
    `;
    
    const values = [patient_user_id, vital_id, alert_type, message, severity];
    const result = await db.query(query, values);
    return result.rows[0];
};

// 4. Get active alerts for a patient
const getPatientAlerts = async (patientId) => {
    const query = `
        SELECT * FROM alerts 
        WHERE patient_user_id = $1 
        ORDER BY triggered_at DESC;
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
};

// 5. Mark all alerts as read for a patient
const markAlertsAsRead = async (patientId) => {
    const query = `
        UPDATE alerts 
        SET is_read = TRUE 
        WHERE patient_user_id = $1 AND is_read = FALSE
        RETURNING *;
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
};

module.exports = {
    createVitalLog,
    getPatientVitals,
    createAlert,
    getPatientAlerts,
    markAlertsAsRead
};