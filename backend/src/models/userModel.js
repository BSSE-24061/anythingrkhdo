const db = require("../config/db");
const crypto = require("crypto");
const SPECIALIZATIONS = require("../constants/specializations");

// 1. Get All Users
const getAllUsers = async () => {
  const result = await db.query("SELECT * FROM users");
  return result.rows;
};

// 2. Create User (Updated for new UUID/ENUM schema)
const createUser = async (userData) => {
  // We grab the secure password and the rest of the details
  const {
    full_name,
    email,
    password_hash,
    role,
    phone,
    gender,
    date_of_birth,
    blood_group,
    address,
    emergency_contact,
    specialization,
    license_number,
    hospital_name,
    experience_years,
    is_verified,
    access_level,
  } = userData;

  const normalizedExperienceYears =
    experience_years === "" ||
      experience_years === undefined ||
      experience_years === null
      ? null
      : Number.parseInt(experience_years, 10);

  const normalizedExperienceValue = Number.isNaN(normalizedExperienceYears)
    ? null
    : normalizedExperienceYears;

  const normalizedIsVerified = is_verified ?? false;

  // Notice we don't need crypto.randomUUID() anymore; the database handles it!
  // We use ::user_role and ::gender_type to cast the text into your strict ENUMs
  const query = `
        INSERT INTO users (
          full_name,
          email,
          password_hash,
          role,
          phone,
          gender,
          date_of_birth,
          blood_group,
          address,
          emergency_contact,
          specialization,
          license_number,
          hospital_name,
          experience_years,
          is_verified,
          access_level
        ) 
        VALUES (
          $1,
          $2,
          $3,
          $4::user_role,
          $5,
          $6::gender_type,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16
        ) 
        RETURNING user_id, full_name, email, role, is_active, created_at; 
    `;

  const values = [
    full_name,
    email,
    password_hash,
    role,
    phone,
    gender,
    date_of_birth || null,
    blood_group || null,
    address || null,
    emergency_contact || null,
    specialization || null,
    license_number || null,
    hospital_name || null,
    normalizedExperienceValue,
    normalizedIsVerified,
    access_level || null,
  ];
  const result = await db.query(query, values);

  return result.rows[0];
};

// 3. Get User By ID
const getUserById = async (id) => {
  const query = "SELECT * FROM users WHERE user_id = $1";
  const result = await db.query(query, [id]);
  return result.rows[0];
};

// 4. Update User
const updateUser = async (id, userData) => {
  const { full_name, role, gender, phone } = userData;

  const query = `
        UPDATE users 
        SET full_name = $1, role = $2, gender = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 
        RETURNING *;
    `;

  const values = [full_name, role, gender, phone, id];
  const result = await db.query(query, values);
  return result.rows[0];
};

const updateUserVerification = async (id, isVerified) => {
  const query = `
      UPDATE users
      SET is_verified = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *;
  `;
  const result = await db.query(query, [isVerified, id]);
  return result.rows[0];
};

const deleteUser = async (id) => {
  const query = "DELETE FROM users WHERE user_id = $1 RETURNING *";
  const result = await db.query(query, [id]);

  // Returning the deleted user confirms it actually existed
  return result.rows[0];
};

const getUserByEmail = async (email) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

const getUserByEmailAndRole = async (email, role) => {
  const result = await db.query(
    "SELECT * FROM users WHERE email = $1 AND role = $2::user_role",
    [email, role],
  );
  return result.rows[0];
};

const getDoctorsBySpecialization = async (specialization) => {
  const result = await db.query(
    "SELECT user_id, full_name, email, specialization, hospital_name, experience_years FROM users WHERE role = 'doctor' AND specialization ILIKE $1 AND is_verified = true",
    [specialization]
  );
  return result.rows;
};

const getAllSpecializations = async () => {
  try {
    const result = await db.query(
      `
        SELECT
          ms.name,
          ms.description,
          COUNT(u.user_id)::int AS doctor_count
        FROM medical_specializations ms
        LEFT JOIN users u
          ON LOWER(u.specialization) = LOWER(ms.name)
         AND u.role = 'doctor'
         AND u.is_verified = true
        WHERE ms.is_active = true
        GROUP BY ms.name, ms.description
        ORDER BY ms.name;
      `
    );
    return result.rows;
  } catch (error) {
    if (error.code !== "42P01") {
      throw error;
    }

    const existingDoctors = await db.query(
      `
        SELECT specialization, COUNT(*)::int AS doctor_count
        FROM users
        WHERE role = 'doctor'
          AND is_verified = true
          AND specialization IS NOT NULL
        GROUP BY specialization;
      `
    );

    const countsByName = new Map(
      existingDoctors.rows.map((row) => [
        String(row.specialization).toLowerCase(),
        row.doctor_count,
      ])
    );

    return SPECIALIZATIONS.map((item) => ({
      ...item,
      doctor_count: countsByName.get(item.name.toLowerCase()) || 0,
    }));
  }
};

const getConsultant = async () => {
  const result = await db.query(
    "SELECT user_id, full_name, email FROM users WHERE role = 'consultant' AND is_verified = true LIMIT 1"
  );
  return result.rows[0] || null;
};

// 5. Exports - ALWAYS AT THE VERY BOTTOM
module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  getUserByEmail, // ← was missing
  getUserByEmailAndRole, // ← was missing
  updateUser,
  updateUserVerification,
  deleteUser,
  getDoctorsBySpecialization,
  getAllSpecializations,
  getConsultant,
};
