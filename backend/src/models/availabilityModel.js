const db = require('../config/db');

// Get all availability slots for a specific doctor
const getDoctorAvailability = async (doctorId) => {
    const query = `
        SELECT * FROM doctor_availability 
        WHERE doctor_user_id = $1 
        ORDER BY 
            CASE day_of_week
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                WHEN 'Sunday' THEN 7
            END,
            start_time;
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows;
};

// Add availability slot for a doctor
const addAvailabilitySlot = async (doctorId, dayOfWeek, startTime, endTime) => {
    const query = `
        INSERT INTO doctor_availability (doctor_user_id, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const result = await db.query(query, [doctorId, dayOfWeek, startTime, endTime]);
    return result.rows[0];
};

const getOverlappingAvailabilitySlot = async (doctorId, dayOfWeek, startTime, endTime) => {
    const query = `
        SELECT *
        FROM doctor_availability
        WHERE doctor_user_id = $1
        AND day_of_week = $2
        AND start_time < $4::time
        AND end_time > $3::time
        LIMIT 1;
    `;
    const result = await db.query(query, [doctorId, dayOfWeek, startTime, endTime]);
    return result.rows[0];
};

const getTotalDutyMinutesForDay = async (doctorId, dayOfWeek) => {
    const query = `
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60), 0) AS total_minutes
        FROM doctor_availability
        WHERE doctor_user_id = $1
        AND day_of_week = $2;
    `;
    const result = await db.query(query, [doctorId, dayOfWeek]);
    return Number(result.rows[0]?.total_minutes || 0);
};

// Remove availability slot
const removeAvailabilitySlot = async (availabilityId) => {
    const query = `
        DELETE FROM doctor_availability 
        WHERE availability_id = $1
        RETURNING *;
    `;
    const result = await db.query(query, [availabilityId]);
    return result.rows[0];
};

// Clear all availability for a doctor
const clearDoctorAvailability = async (doctorId) => {
    const query = `
        DELETE FROM doctor_availability 
        WHERE doctor_user_id = $1;
    `;
    await db.query(query, [doctorId]);
};

// Set multiple availability slots at once (replaces existing)
const setDoctorAvailability = async (doctorId, slots) => {
    // Clear existing slots first
    await clearDoctorAvailability(doctorId);
    
    // Add new slots
    const results = [];
    for (const slot of slots) {
        const result = await addAvailabilitySlot(doctorId, slot.day_of_week, slot.start_time, slot.end_time);
        results.push(result);
    }
    return results;
};

// Check if a doctor is available at a specific time
const checkDoctorAvailable = async (doctorId, dayOfWeek, time) => {
    const query = `
        SELECT * FROM doctor_availability 
        WHERE doctor_user_id = $1 
        AND day_of_week = $2
        AND start_time <= $3 
        AND end_time > $3;
    `;
    const result = await db.query(query, [doctorId, dayOfWeek, time]);
    return result.rows.length > 0;
};

// Find a duty window that can contain the requested appointment duration.
const findMatchingAvailabilitySlot = async (doctorId, dayOfWeek, startTime, durationMinutes = 30) => {
    const query = `
        SELECT *
        FROM doctor_availability
        WHERE doctor_user_id = $1
        AND day_of_week = $2
        AND start_time <= $3::time
        AND ($3::time + ($4::int * interval '1 minute')) <= end_time
        LIMIT 1;
    `;
    const result = await db.query(query, [
        doctorId,
        dayOfWeek,
        startTime,
        durationMinutes,
    ]);
    return result.rows[0];
};

module.exports = {
    getDoctorAvailability,
    addAvailabilitySlot,
    removeAvailabilitySlot,
    clearDoctorAvailability,
    setDoctorAvailability,
    checkDoctorAvailable,
    findMatchingAvailabilitySlot,
    getOverlappingAvailabilitySlot,
    getTotalDutyMinutesForDay,
};
