import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, userApi } from "../../utils/apiHelper";
import AuthLayout from "../../layouts/AuthLayout";
import { setSession } from "../../utils/session";
import { normalizeSpecializations } from "../../utils/specializations";

const emptyPatientData = {
  dateOfBirth: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
};

const emptyDoctorData = {
  specialization: "",
  licenseNumber: "",
  hospitalName: "",
  experienceYears: "",
};

const initialFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "patient",
  phone: "",
  gender: "male",
  ...emptyPatientData,
  ...emptyDoctorData,
};

const Signup = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState(() =>
    normalizeSpecializations([]),
  );
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => {
      if (field === "role") {
        return {
          ...prev,
          role: value,
          ...(value === "patient" ? emptyDoctorData : emptyPatientData),
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const normalize = (value) => {
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  };

  // Password validation function
  const validatePassword = (pwd) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };

    const isValid = Object.values(requirements).every((req) => req);
    return { isValid, requirements };
  };

  const getPasswordStrengthColor = () => {
    const { requirements } = validatePassword(formData.password);
    const metRequirements = Object.values(requirements).filter(
      (req) => req,
    ).length;

    if (metRequirements <= 1) return "#ef4444";
    if (metRequirements <= 2) return "#f97316";
    if (metRequirements <= 3) return "#eab308";
    if (metRequirements <= 4) return "#84cc16";
    return "#22c55e";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        full_name: normalize(formData.fullName),
        email: normalize(formData.email),
        password: formData.password,
        role: formData.role.toLowerCase(),
        phone: normalize(formData.phone),
        gender: normalize(formData.gender),
        date_of_birth:
          formData.role === "patient" ? normalize(formData.dateOfBirth) : null,
        blood_group:
          formData.role === "patient" ? normalize(formData.bloodGroup) : null,
        address:
          formData.role === "patient" ? normalize(formData.address) : null,
        emergency_contact:
          formData.role === "patient"
            ? normalize(formData.emergencyContact)
            : null,
        specialization:
          formData.role === "doctor"
            ? normalize(formData.specialization)
            : null,
        license_number:
          formData.role === "doctor" ? normalize(formData.licenseNumber) : null,
        hospital_name:
          formData.role === "doctor" ? normalize(formData.hospitalName) : null,
        experience_years:
          formData.role === "doctor"
            ? normalize(formData.experienceYears)
            : null,
      };

      await userApi.signup(payload);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to create account. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    setError("");
    setLoading(true);
    try {
      const res = await userApi.googleLogin({
        credential: response.credential,
      });
      if (res.data.requiresOnboarding) {
        sessionStorage.setItem("googleOnboarding", JSON.stringify(res.data));
        navigate("/google-onboarding", { state: res.data });
      } else {
        setSession({ token: res.data.token, user: res.data.user });
        navigate("/dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Google sign-up failed."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        const response = await userApi.getAllSpecializations();
        setSpecializations(normalizeSpecializations(response.data));
      } catch (err) {
        console.error(err);
        setSpecializations(normalizeSpecializations([]));
      }
    };

    loadSpecializations();
  }, []);

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-button"),
        { theme: "outline", size: "large", width: "100%" },
      );
    }
  }, []);

  return (
    <AuthLayout
      heroTone="signup"
      heroTitle="Create your account and start managing care."
      heroText="Join as a patient or doctor to schedule appointments, coordinate messages, and access the community space."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            Create Account
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Sign up as a patient or doctor.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              border: "1px solid #fee2e2",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  marginLeft: 4,
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="John Doe"
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "2px solid #e6edf5",
                  background: "#f8fafc",
                  fontSize: 15,
                  outline: "none",
                  color: "#0f172a",
                  fontWeight: 600,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  marginLeft: 4,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "2px solid #e6edf5",
                  background: "#f8fafc",
                  fontSize: 15,
                  outline: "none",
                  color: "#0f172a",
                  fontWeight: 600,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  marginLeft: 4,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: `2px solid ${
                    formData.password ? getPasswordStrengthColor() : "#e6edf5"
                  }`,
                  background: "#f8fafc",
                  fontSize: 15,
                  outline: "none",
                  color: "#0f172a",
                  fontWeight: 600,
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />

              {/* Password strength indicator */}
              {formData.password && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div
                    style={{
                      height: 4,
                      background: "#e6edf5",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${
                          (Object.values(
                            validatePassword(formData.password).requirements,
                          ).filter((r) => r).length /
                            5) *
                          100
                        }%`,
                        background: getPasswordStrengthColor(),
                        transition: "width 0.2s",
                      }}
                    />
                  </div>

                  {/* Requirements checklist */}
                  <div
                    style={{
                      fontSize: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {(() => {
                      const { requirements } = validatePassword(
                        formData.password,
                      );
                      return [
                        {
                          key: "length",
                          label: "At least 8 characters",
                          met: requirements.length,
                        },
                        {
                          key: "uppercase",
                          label: "Uppercase letter (A-Z)",
                          met: requirements.uppercase,
                        },
                        {
                          key: "lowercase",
                          label: "Lowercase letter (a-z)",
                          met: requirements.lowercase,
                        },
                        {
                          key: "number",
                          label: "Number (0-9)",
                          met: requirements.number,
                        },
                        {
                          key: "special",
                          label: "Special character (!@#$%^&* etc)",
                          met: requirements.special,
                        },
                      ].map((req) => (
                        <div
                          key={req.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: req.met ? "#16a34a" : "#94a3b8",
                            fontWeight: req.met ? 600 : 500,
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: req.met ? "#16a34a" : "#e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          >
                            {req.met ? "✓" : ""}
                          </span>
                          {req.label}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  marginLeft: 4,
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 234 567 890"
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "2px solid #e6edf5",
                  background: "#f8fafc",
                  fontSize: 15,
                  outline: "none",
                  color: "#0f172a",
                  fontWeight: 600,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => handleChange("role", "patient")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                background:
                  formData.role === "patient"
                    ? "rgba(37,99,235,0.1)"
                    : "#f8fafc",
                color: formData.role === "patient" ? "#2563eb" : "#64748b",
                border:
                  formData.role === "patient"
                    ? "2px solid #2563eb"
                    : "2px solid #e6edf5",
              }}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleChange("role", "doctor")}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                background:
                  formData.role === "doctor"
                    ? "rgba(37,99,235,0.1)"
                    : "#f8fafc",
                color: formData.role === "doctor" ? "#2563eb" : "#64748b",
                border:
                  formData.role === "doctor"
                    ? "2px solid #2563eb"
                    : "2px solid #e6edf5",
              }}
            >
              Doctor
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#475569",
                marginLeft: 4,
              }}
            >
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              required
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "2px solid #e6edf5",
                background: "#f8fafc",
                fontSize: 15,
                outline: "none",
                color: "#0f172a",
                fontWeight: 600,
                width: "100%",
                boxSizing: "border-box",
                appearance: "none",
              }}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.role === "patient" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#475569",
                      marginLeft: 4,
                    }}
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "2px solid #e6edf5",
                      background: "#f8fafc",
                      fontSize: 15,
                      outline: "none",
                      color: "#0f172a",
                      fontWeight: 600,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#475569",
                      marginLeft: 4,
                    }}
                  >
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleChange("bloodGroup", e.target.value)}
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "2px solid #e6edf5",
                      background: "#f8fafc",
                      fontSize: 15,
                      outline: "none",
                      color: "#0f172a",
                      fontWeight: 600,
                      width: "100%",
                      boxSizing: "border-box",
                      appearance: "none",
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#475569",
                    marginLeft: 4,
                  }}
                >
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Your address"
                  required
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "2px solid #e6edf5",
                    background: "#f8fafc",
                    fontSize: 15,
                    outline: "none",
                    color: "#0f172a",
                    fontWeight: 600,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#475569",
                    marginLeft: 4,
                  }}
                >
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    handleChange("emergencyContact", e.target.value)
                  }
                  placeholder="Emergency phone number"
                  required
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "2px solid #e6edf5",
                    background: "#f8fafc",
                    fontSize: 15,
                    outline: "none",
                    color: "#0f172a",
                    fontWeight: 600,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </>
          )}

          {formData.role === "doctor" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#475569",
                      marginLeft: 4,
                    }}
                  >
                    Specialization
                  </label>
                  <input
                    type="search"
                    list="doctor-specialization-options"
                    value={formData.specialization}
                    onChange={(e) =>
                      handleChange("specialization", e.target.value)
                    }
                    placeholder="Search and choose a specialization"
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "2px solid #e6edf5",
                      background: "#f8fafc",
                      fontSize: 15,
                      outline: "none",
                      color: "#0f172a",
                      fontWeight: 600,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  <datalist id="doctor-specialization-options">
                    {specializations.map((spec) => (
                      <option key={spec.name} value={spec.name}>
                        {spec.description}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#475569",
                      marginLeft: 4,
                    }}
                  >
                    License Number
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleChange("licenseNumber", e.target.value)
                    }
                    placeholder="Licence #"
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "2px solid #e6edf5",
                      background: "#f8fafc",
                      fontSize: 15,
                      outline: "none",
                      color: "#0f172a",
                      fontWeight: 600,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#475569",
                      marginLeft: 4,
                    }}
                  >
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={formData.hospitalName}
                    onChange={(e) =>
                      handleChange("hospitalName", e.target.value)
                    }
                    placeholder="Primary hospital"
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "2px solid #e6edf5",
                      background: "#f8fafc",
                      fontSize: 15,
                      outline: "none",
                      color: "#0f172a",
                      fontWeight: 600,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#475569",
                      marginLeft: 4,
                    }}
                  >
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      handleChange("experienceYears", e.target.value)
                    }
                    placeholder="Years"
                    required
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "2px solid #e6edf5",
                      background: "#f8fafc",
                      fontSize: 15,
                      outline: "none",
                      color: "#0f172a",
                      fontWeight: 600,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || !validatePassword(formData.password).isValid}
            style={{
              marginTop: 8,
              padding: "16px",
              borderRadius: 12,
              background: !validatePassword(formData.password).isValid
                ? "#cbd5e1"
                : "#2563eb",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              border: "none",
              cursor:
                loading || !validatePassword(formData.password).isValid
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading || !validatePassword(formData.password).isValid
                  ? 0.7
                  : 1,
              boxShadow:
                loading || !validatePassword(formData.password).isValid
                  ? "none"
                  : "0 4px 12px rgba(37,99,235,0.2)",
            }}
            title={
              !validatePassword(formData.password).isValid
                ? "Password must meet all requirements"
                : ""
            }
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "8px 0",
          }}
        >
          <div style={{ height: 1, background: "#e6edf5", flex: 1 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Or sign up with
          </span>
          <div style={{ height: 1, background: "#e6edf5", flex: 1 }} />
        </div>

        <div
          id="google-signup-button"
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        ></div>

        <p
          style={{
            textAlign: "center",
            margin: 0,
            fontSize: 14,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#2563eb",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Log in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Signup;
