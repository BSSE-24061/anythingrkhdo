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
        WITH all_potential_providers AS (
          -- Part 1: Doctors from active appointments
          SELECT 
            d.user_id AS provider_id,
            d.full_name AS provider_name,
            d.role::TEXT AS role
          FROM appointments a
          JOIN users d ON a.doctor_user_id = d.user_id
          WHERE a.patient_user_id = $1
            AND LOWER(a.status::TEXT) IN ('pending', 'confirmed')
          
          UNION

          -- Part 2: Verified consultants
          SELECT 
            c.user_id AS provider_id,
            c.full_name AS provider_name,
            c.role::TEXT AS role
          FROM users c
          WHERE c.role::TEXT = 'consultant'
            AND c.is_verified = TRUE
            AND EXISTS (SELECT 1 FROM users u WHERE u.user_id = $1 AND u.role::TEXT = 'patient')
          
          UNION

          -- Part 3: Providers from existing chat rooms
          SELECT 
            COALESCE(cr.doctor_user_id, cr.consultant_user_id) AS provider_id,
            COALESCE(d.full_name, c.full_name) AS provider_name,
            COALESCE(d.role::TEXT, c.role::TEXT) AS role
          FROM chat_rooms cr
          LEFT JOIN users d ON cr.doctor_user_id = d.user_id
          LEFT JOIN users c ON cr.consultant_user_id = c.user_id
          WHERE cr.patient_user_id = $1 OR cr.doctor_user_id = $1 OR cr.consultant_user_id = $1
        ),
        distinct_providers AS (
          SELECT DISTINCT provider_id, provider_name, role
          FROM all_potential_providers
          WHERE provider_id IS NOT NULL
        ),
        joined_data AS (
          SELECT 
            dp.provider_id,
            dp.provider_name,
            dp.role,
            cr.room_id,
            cr.last_message_at,
            cr.created_at,
            (CASE WHEN dp.role = 'doctor' THEN 'appointment' ELSE 'consultation' END) AS room_type
          FROM distinct_providers dp
          LEFT JOIN chat_rooms cr ON (
            (cr.patient_user_id = $1 AND (cr.doctor_user_id = dp.provider_id OR cr.consultant_user_id = dp.provider_id)) OR
            (cr.patient_user_id = dp.provider_id AND (cr.doctor_user_id = $1 OR cr.consultant_user_id = $1))
          )
        )
        SELECT DISTINCT ON (provider_id)
          room_id,
          $1 AS patient_user_id,
          (CASE WHEN role = 'doctor' THEN provider_id ELSE NULL END) AS doctor_user_id,
          (CASE WHEN role = 'consultant' THEN provider_id ELSE NULL END) AS consultant_user_id,
          room_type,
          created_at,
          last_message_at,
          (SELECT full_name FROM users WHERE user_id = $1) AS patient_name,
          (CASE WHEN role = 'doctor' THEN provider_name ELSE NULL END) AS doctor_name,
          (CASE WHEN role = 'consultant' THEN provider_name ELSE NULL END) AS consultant_name,
          (
            CASE
              WHEN role = 'doctor' THEN EXISTS (
                SELECT 1 FROM appointments a
                WHERE a.patient_user_id = $1
                  AND a.doctor_user_id = provider_id
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
          ), 0) AS unread_count
        FROM joined_data
        ORDER BY provider_id, last_message_at DESC NULLS LAST;
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
