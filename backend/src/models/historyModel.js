const db = require('../config/db');

// 1. Get the complete timeline for a specific patient
const getPatientHistory = async (patientId) => {
    const query = `
        SELECT mh.*, u.full_name AS added_by_name 
        FROM medical_history mh
        LEFT JOIN users u ON mh.added_by = u.user_id
        WHERE mh.patient_user_id = $1
        ORDER BY mh.event_date DESC, mh.created_at DESC;
    `;
    const result = await db.query(query, [patientId]);
    return result.rows;
};

// 2. Add a new event to the timeline (Used internally when other things happen)
const addHistoryEvent = async (eventData) => {
    const { patient_user_id, event_type, title, description, related_prescription_id, related_appointment_id, event_date, added_by } = eventData;
    
    const query = `
        INSERT INTO medical_history 
        (patient_user_id, event_type, title, description, related_prescription_id, related_appointment_id, event_date, added_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    
    // Use ISO string format to preserve full timestamp including time
    const timestamp = event_date ? new Date(event_date).toISOString() : new Date().toISOString();
    const values = [patient_user_id, event_type, title, description, related_prescription_id, related_appointment_id, timestamp, added_by];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    getPatientHistory,
    addHistoryEvent
};