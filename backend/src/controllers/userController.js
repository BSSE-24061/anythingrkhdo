const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Password validation function
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one special character (!@#$%^&* etc.)",
    };
  }

  return { valid: true, message: "Password is strong" };
};

const buildAuthResponse = (user) => {
  const token = jwt.sign(
    { id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return {
    token,
    user: {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
    },
  };
};

const verifyGoogleCredential = async (credential) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google login is not configured");
    error.status = 500;
    throw error;
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );

  if (!response.ok) {
    const error = new Error("Invalid Google credential");
    error.status = 401;
    throw error;
  }

  const profile = await response.json();

  if (profile.aud !== process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google credential was issued for another app");
    error.status = 401;
    throw error;
  }

  if (profile.email_verified !== "true" && profile.email_verified !== true) {
    const error = new Error("Google email is not verified");
    error.status = 401;
    throw error;
  }

  return profile;
};

const buildGoogleOnboardingResponse = (profile) => {
  const onboardingToken = jwt.sign(
    {
      type: "google_onboarding",
      email: profile.email,
      full_name: profile.name || profile.email.split("@")[0],
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  return {
    requiresOnboarding: true,
    onboardingToken,
    googleProfile: {
      name: profile.name || profile.email.split("@")[0],
      email: profile.email,
    },
  };
};

const getSignupMissingFields = (
  {
    full_name,
    email,
    password,
    role,
    gender,
    phone,
    date_of_birth,
    blood_group,
    address,
    emergency_contact,
    specialization,
    license_number,
    hospital_name,
    experience_years,
  },
  { requirePassword = false } = {},
) => {
  const normalizedRole = role?.toLowerCase();
  const missingFields = [];

  if (!full_name) missingFields.push("full_name");
  if (!email) missingFields.push("email");
  if (requirePassword && !password) missingFields.push("password");
  if (!role) missingFields.push("role");
  if (!phone) missingFields.push("phone");
  if (!gender) missingFields.push("gender");

  if (normalizedRole === "patient") {
    if (!date_of_birth) missingFields.push("date_of_birth");
    if (!blood_group) missingFields.push("blood_group");
    if (!address) missingFields.push("address");
    if (!emergency_contact) missingFields.push("emergency_contact");
  }

  if (normalizedRole === "doctor") {
    if (!specialization) missingFields.push("specialization");
    if (!license_number) missingFields.push("license_number");
    if (!hospital_name) missingFields.push("hospital_name");
    if (
      experience_years === undefined ||
      experience_years === null ||
      experience_years === ""
    ) {
      missingFields.push("experience_years");
    }
  }

  return missingFields;
};

// ── AUTH ─────────────────────────────────────────────

const signup = async (req, res) => {
  const {
    full_name,
    email,
    password,
    role,
    gender,
    phone,
    date_of_birth,
    blood_group,
    address,
    emergency_contact,
    specialization,
    license_number,
    hospital_name,
    experience_years,
    access_level,
  } = req.body;

  const normalizedRole = role?.toLowerCase();
  const missingFields = getSignupMissingFields(req.body, {
    requirePassword: true,
  });

  if (!["patient", "doctor"].includes(normalizedRole)) {
    return res
      .status(400)
      .json({ error: "Role must be either patient or doctor" });
  }

  if (missingFields.length > 0) {
    return res
      .status(400)
      .json({ error: `Missing required fields: ${missingFields.join(", ")}` });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }

  try {
    const existing = await User.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const newUser = await User.createUser({
      full_name,
      email,
      password_hash,
      role: normalizedRole,
      gender: gender || null,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      blood_group: blood_group || null,
      address: address || null,
      emergency_contact: emergency_contact || null,
      specialization: specialization || null,
      license_number: license_number || null,
      hospital_name: hospital_name || null,
      experience_years: experience_years || null,
      access_level: access_level || null,
    });

    const auth = buildAuthResponse(newUser);

    res.status(201).json({
      message: "Account created successfully",
      ...auth,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, password and role are required" });
  }

  try {
    const user = await User.getUserByEmailAndRole(email, role);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid credentials or wrong role selected" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (
      (user.role === "doctor" || user.role === "consultant") &&
      !user.is_verified
    ) {
      return res.status(403).json({
        error:
          "Your account is pending verification. Please wait for admin approval before logging in.",
      });
    }

    const auth = buildAuthResponse(user);

    res.json({
      message: "Login successful",
      ...auth,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ── CRUD ─────────────────────────────────────────────

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Google credential is required" });
  }

  try {
    const profile = await verifyGoogleCredential(credential);
    const user = await User.getUserByEmail(profile.email);

    if (!user) {
      return res.status(200).json(buildGoogleOnboardingResponse(profile));
    }

    if (
      (user.role === "doctor" || user.role === "consultant") &&
      !user.is_verified
    ) {
      return res.status(403).json({
        error:
          "Your account is pending verification. Please wait for admin approval before logging in.",
      });
    }

    const auth = buildAuthResponse(user);
    res.json({
      message: "Google login successful",
      ...auth,
    });
  } catch (err) {
    console.error("Google login error:", err.message);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : "Server error" });
  }
};

const googleOnboarding = async (req, res) => {
  const {
    onboardingToken,
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
  } = req.body;
  const normalizedRole = role?.toLowerCase();

  if (!onboardingToken) {
    return res
      .status(400)
      .json({ error: "Google onboarding token is required" });
  }

  if (!["patient", "doctor"].includes(normalizedRole)) {
    return res.status(400).json({
      error:
        "Choose patient or doctor. Consultant and admin accounts cannot be created with Google onboarding.",
    });
  }

  try {
    const decoded = jwt.verify(onboardingToken, process.env.JWT_SECRET);

    if (decoded.type !== "google_onboarding" || !decoded.email) {
      return res.status(401).json({ error: "Invalid Google onboarding token" });
    }

    const full_name = decoded.full_name;
    const email = decoded.email;
    const missingFields = getSignupMissingFields({
      full_name,
      email,
      role: normalizedRole,
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
    });

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
    }

    const existing = await User.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(crypto.randomUUID(), 12);
    const is_verified = normalizedRole === "patient";

    const newUser = await User.createUser({
      full_name,
      email,
      password_hash,
      role: normalizedRole,
      gender: gender || null,
      phone: phone || null,
      date_of_birth:
        normalizedRole === "patient" ? date_of_birth || null : null,
      blood_group: normalizedRole === "patient" ? blood_group || null : null,
      address: normalizedRole === "patient" ? address || null : null,
      emergency_contact:
        normalizedRole === "patient" ? emergency_contact || null : null,
      specialization:
        normalizedRole === "doctor" ? specialization || null : null,
      license_number:
        normalizedRole === "doctor" ? license_number || null : null,
      hospital_name: normalizedRole === "doctor" ? hospital_name || null : null,
      experience_years:
        normalizedRole === "doctor" ? experience_years || null : null,
      is_verified,
      access_level: null,
    });

    if (normalizedRole === "doctor") {
      return res.status(201).json({
        message:
          "Account created successfully. Please wait for admin approval before logging in.",
        pendingVerification: true,
        user: {
          id: newUser.user_id,
          name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }

    const auth = buildAuthResponse(newUser);

    res.status(201).json({
      message: "Google account created successfully",
      ...auth,
    });
  } catch (err) {
    console.error("Google onboarding error:", err.message);
    const isTokenError =
      err.name === "JsonWebTokenError" || err.name === "TokenExpiredError";

    res.status(isTokenError ? 401 : 500).json({
      error: isTokenError
        ? "Invalid or expired Google onboarding token"
        : "Server error",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { full_name, email, password_hash, role, phone, gender } = req.body;

    // Basic Validation
    if (!full_name || !email || !password_hash || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- NEW BCRYPT SECURITY LOGIC ---
    // 10 is the "salt rounds". It is the industry standard balance between security and speed.
    const salt = await bcrypt.genSalt(10);

    // This takes "hashed123" and turns it into an unreadable string
    const encryptedPassword = await bcrypt.hash(password_hash, salt);

    // Replace the plain password with the encrypted one
    const secureUserData = {
      ...req.body,
      password_hash: encryptedPassword,
    };
    // ---------------------------------

    // Send the SECURE data to the model
    const newUser = await User.createUser(secureUserData);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error.message);

    // Handle duplicate email gracefully
    if (error.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.updateUser(req.params.id, req.body);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateVerification = async (req, res) => {
  try {
    const { is_verified } = req.body;

    if (typeof is_verified !== "boolean") {
      return res
        .status(400)
        .json({ error: "is_verified must be true or false" });
    }

    const updatedUser = await User.updateUserVerification(
      req.params.id,
      is_verified,
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Verification status updated", user: updatedUser });
  } catch (error) {
    console.error("Error updating verification:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.deleteUser(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const doctors = await User.getDoctorsBySpecialization(specialization);
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllSpecializations = async (req, res) => {
  try {
    const specializations = await User.getAllSpecializations();
    res.status(200).json(specializations);
  } catch (error) {
    console.error("Error fetching specializations:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getConsultants = async (req, res) => {
  try {
    const consultant = await User.getConsultant();
    res.status(200).json(consultant);
  } catch (error) {
    console.error("Error fetching consultant:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  googleOnboarding,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateVerification,
  deleteUser,
  getDoctorsBySpecialization,
  getAllSpecializations,
  getConsultants,
};
