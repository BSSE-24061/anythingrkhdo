import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, userApi } from "../../utils/apiHelper";
import AuthLayout from "../../layouts/AuthLayout";
import { setSession } from "../../utils/session";

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
      const res = await userApi.googleLogin({ credential: response.credential });
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
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-button"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, []);

  return (
    <AuthLayout
      heroTone="signup"
      heroTitle="Create your account and start managing care."
      heroText="Join as a patient or doctor to schedule appointments, coordinate messages, and access the community space."
    >
      <section className="auth-card auth-card-wide">
        <h2>Create Account</h2>
        <p className="card-subtitle">Sign up as patient or doctor.</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSignup} className="form-grid">
          <div className="form-columns">
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Full Name"
              required
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email Address"
              required
            />
          </div>

          <div className="form-columns">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Password"
              required
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Phone Number"
              required
            />
          </div>

          <div className="role-grid">
            <button
              type="button"
              onClick={() => handleChange("role", "patient")}
              className={
                formData.role === "patient"
                  ? "role-option selected"
                  : "role-option"
              }
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleChange("role", "doctor")}
              className={
                formData.role === "doctor"
                  ? "role-option selected"
                  : "role-option"
              }
            >
              Doctor
            </button>
          </div>

          <select
            value={formData.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {formData.role === "patient" && (
            <>
              <div className="form-columns">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  required
                />
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => handleChange("bloodGroup", e.target.value)}
                  required
                >
                  <option value="">Blood Group</option>
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

              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Address"
                required
              />

              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) =>
                  handleChange("emergencyContact", e.target.value)
                }
                placeholder="Emergency Contact"
                required
              />
            </>
          )}

          {formData.role === "doctor" && (
            <>
              <div className="form-columns">
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    handleChange("specialization", e.target.value)
                  }
                  placeholder="Specialization"
                  required
                />
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    handleChange("licenseNumber", e.target.value)
                  }
                  placeholder="License Number"
                  required
                />
              </div>

              <div className="form-columns">
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => handleChange("hospitalName", e.target.value)}
                  placeholder="Hospital Name"
                  required
                />
                <input
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) =>
                    handleChange("experienceYears", e.target.value)
                  }
                  placeholder="Experience Years"
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-main" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="google-auth-section">
          <div id="google-signup-button" style={{ width: "100%" }}></div>
        </div>

        <p className="auth-footnote">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </section>
    </AuthLayout>
  );
};

export default Signup;
