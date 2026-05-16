const db = require("../config/db");

const getRoomById = async (roomId) => {
  const result = await db.query(`SELECT * FROM chat_rooms WHERE room_id = $1`, [
    roomId,
  ]);
  return result.rows[0];
};

const hasActiveDoctorAppointment = async (patientUserId, doctorUserId) => {
  const result = await db.query(
    `
    SELECT 1 FROM appointments
    WHERE patient_user_id = $1
      AND doctor_user_id = $2
      AND LOWER(status::TEXT) IN ('pending', 'confirmed')
    LIMIT 1
    `,
    [patientUserId, doctorUserId],
  );
  return result.rows.length > 0;
};

const findOrCreateRoom = async (roomData) => {
  const {
    patient_user_id,
    doctor_user_id,
    consultant_user_id,
    room_type = "consultation",
  } = roomData;

  let query;
  let values;

  if (consultant_user_id) {
    query = `SELECT * FROM chat_rooms WHERE patient_user_id = $1 AND consultant_user_id = $2 AND room_type = $3;`;
    values = [patient_user_id, consultant_user_id, room_type];
  } else {
    query = `SELECT * FROM chat_rooms WHERE patient_user_id = $1 AND doctor_user_id = $2 AND room_type = $3;`;
    values = [patient_user_id, doctor_user_id, room_type];
  }

  const result = await db.query(query, values);
  if (result.rows.length > 0) {
    return result.rows[0];
  }

  query = `
        INSERT INTO chat_rooms (patient_user_id, doctor_user_id, consultant_user_id, room_type)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
  const insertValues = [
    patient_user_id,
    doctor_user_id || null,
    consultant_user_id || null,
    room_type,
  ];
  const inserted = await db.query(query, insertValues);
  return inserted.rows[0];
};

const saveMessage = async (messageData) => {
  const { room_id, sender_id, message_text } = messageData;
  const query = `
        INSERT INTO chat_messages (room_id, sender_id, message_text)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
  const result = await db.query(query, [room_id, sender_id, message_text]);
  await db.query(
    `UPDATE chat_rooms SET last_message_at = NOW() WHERE room_id = $1`,
    [room_id],
  );
  return result.rows[0];
};

const getRoomMessages = async (roomId) => {
  const query = `
        SELECT m.*, u.full_name AS sender_name, u.role::TEXT AS sender_role
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.room_id = $1
        ORDER BY m.sent_at ASC;
    `;
  const result = await db.query(query, [roomId]);
  return result.rows;
};

const getUserRooms = async (userId) => {
  const query = `
    WITH user_role_query AS (
      SELECT role::TEXT AS current_user_role FROM users WHERE user_id = $1
    ),
    all_potential_providers AS (
      -- If user is a patient, get doctors from active appointments
      SELECT 
        d.user_id AS other_user_id,
        d.full_name AS other_user_name,
        d.role::TEXT AS other_user_role
      FROM appointments a
      JOIN users d ON a.doctor_user_id = d.user_id
      CROSS JOIN user_role_query urq
      WHERE a.patient_user_id = $1
        AND urq.current_user_role = 'patient'
        AND LOWER(a.status::TEXT) IN ('pending', 'confirmed')
      
      UNION

      -- If user is a patient, get verified consultants
      SELECT 
        c.user_id AS other_user_id,
        c.full_name AS other_user_name,
        c.role::TEXT AS other_user_role
      FROM users c
      CROSS JOIN user_role_query urq
      WHERE c.role::TEXT = 'consultant'
        AND c.is_verified = TRUE
        AND urq.current_user_role = 'patient'
      
      UNION

      -- All existing chat rooms involving the current user
      SELECT 
        CASE 
          WHEN cr.patient_user_id = $1 THEN COALESCE(cr.doctor_user_id, cr.consultant_user_id)
          ELSE cr.patient_user_id
        END AS other_user_id,
        u.full_name AS other_user_name,
        u.role::TEXT AS other_user_role
      FROM chat_rooms cr
      JOIN users u ON u.user_id = CASE 
        WHEN cr.patient_user_id = $1 THEN COALESCE(cr.doctor_user_id, cr.consultant_user_id)
        ELSE cr.patient_user_id
      END
      WHERE cr.patient_user_id = $1 OR cr.doctor_user_id = $1 OR cr.consultant_user_id = $1
    ),
    distinct_others AS (
      SELECT DISTINCT other_user_id, other_user_name, other_user_role
      FROM all_potential_providers
      WHERE other_user_id IS NOT NULL
    ),
    joined_data AS (
      SELECT 
        do.other_user_id,
        do.other_user_name,
        do.other_user_role,
        cr.room_id,
        cr.patient_user_id,
        cr.doctor_user_id,
        cr.consultant_user_id,
        cr.last_message_at,
        cr.created_at,
        cr.room_type,
        -- fallback room_type if room doesn't exist
        (CASE WHEN do.other_user_role = 'doctor' THEN 'appointment' ELSE 'consultation' END) AS fallback_room_type
      FROM distinct_others do
      LEFT JOIN chat_rooms cr ON (
        (cr.patient_user_id = $1 AND (cr.doctor_user_id = do.other_user_id OR cr.consultant_user_id = do.other_user_id)) OR
        (cr.patient_user_id = do.other_user_id AND (cr.doctor_user_id = $1 OR cr.consultant_user_id = $1))
      )
    )
    SELECT DISTINCT ON (other_user_id)
      room_id,
      COALESCE(patient_user_id, CASE WHEN urq.current_user_role = 'patient' THEN $1 ELSE other_user_id END) AS patient_user_id,
      COALESCE(doctor_user_id, CASE WHEN urq.current_user_role = 'doctor' THEN $1 WHEN other_user_role = 'doctor' THEN other_user_id ELSE NULL END) AS doctor_user_id,
      COALESCE(consultant_user_id, CASE WHEN urq.current_user_role = 'consultant' THEN $1 WHEN other_user_role = 'consultant' THEN other_user_id ELSE NULL END) AS consultant_user_id,
      COALESCE(room_type, fallback_room_type) AS room_type,
      created_at,
      last_message_at,
      
      -- Instead of hardcoding $1, we select the correct names:
      (SELECT full_name FROM users WHERE user_id = COALESCE(patient_user_id, CASE WHEN urq.current_user_role = 'patient' THEN $1 ELSE other_user_id END)) AS patient_name,
      (SELECT full_name FROM users WHERE user_id = COALESCE(doctor_user_id, CASE WHEN urq.current_user_role = 'doctor' THEN $1 WHEN other_user_role = 'doctor' THEN other_user_id ELSE NULL END)) AS doctor_name,
      (SELECT full_name FROM users WHERE user_id = COALESCE(consultant_user_id, CASE WHEN urq.current_user_role = 'consultant' THEN $1 WHEN other_user_role = 'consultant' THEN other_user_id ELSE NULL END)) AS consultant_name,
      
      (
        CASE
          WHEN other_user_role = 'doctor' AND urq.current_user_role = 'patient' THEN EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.patient_user_id = $1
              AND a.doctor_user_id = other_user_id
              AND LOWER(a.status::TEXT) IN ('pending', 'confirmed')
          )
          WHEN other_user_role = 'patient' AND urq.current_user_role = 'doctor' THEN EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.patient_user_id = other_user_id
              AND a.doctor_user_id = $1
              AND LOWER(a.status::TEXT) IN ('pending', 'confirmed')
          )
          ELSE TRUE
        END
      ) AS chat_active,
      COALESCE((
        SELECT COUNT(*)::int
        FROM chat_messages m
        WHERE m.room_id = joined_data.room_id
          AND m.is_read = FALSE
          AND m.sender_id <> $1
      ), 0) AS unread_count,
      
      -- To make it easy for frontend:
      other_user_id,
      other_user_name,
      other_user_role
      
    FROM joined_data
    CROSS JOIN user_role_query urq
    ORDER BY other_user_id, last_message_at DESC NULLS LAST;
  `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const markRoomAsRead = async (roomId, userId) => {
  const query = `
        UPDATE chat_messages
        SET is_read = TRUE
        WHERE room_id = $1 AND sender_id <> $2
        RETURNING *;
    `;
  const result = await db.query(query, [roomId, userId]);
  return result.rows;
};

const markMessageAsRead = async (messageId) => {
  const result = await db.query(
    `UPDATE chat_messages SET is_read = TRUE WHERE message_id = $1 RETURNING *;`,
    [messageId],
  );
  return result.rows[0];
};

module.exports = {
  getRoomById,
  hasActiveDoctorAppointment,
  findOrCreateRoom,
  saveMessage,
  getRoomMessages,
  getUserRooms,
  markRoomAsRead,
  markMessageAsRead,
};
