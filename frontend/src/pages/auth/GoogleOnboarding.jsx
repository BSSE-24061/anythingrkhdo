import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { getErrorMessage, userApi } from "../../utils/apiHelper";
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
  role: "patient",
  phone: "",
  gender: "male",
  ...emptyPatientData,
  ...emptyDoctorData,
};

const GoogleOnboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const savedOnboarding = useMemo(() => {
    if (location.state?.onboardingToken) return location.state;

    try {
      return JSON.parse(sessionStorage.getItem("googleOnboarding") || "null");
    } catch {
      return null;
    }
  }, [location.state]);

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState(() =>
    normalizeSpecializations([])
  );

  const googleProfile = savedOnboarding?.googleProfile;
  const onboardingToken = savedOnboarding?.onboardingToken;

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

  const redirectForUser = (authUser) => {
    const dashboardRoutes = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      admin: "/admin/dashboard",
      consultant: "/consultant/dashboard",
    };

    navigate(dashboardRoutes[authUser.role?.toLowerCase()] || "/dashboard", {
      replace: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!onboardingToken) {
      setError("Your Google onboarding session expired. Please sign in with Google again.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        onboardingToken,
        role: formData.role.toLowerCase(),
        phone: normalize(formData.phone),
        gender: normalize(formData.gender),
        date_of_birth:
          formData.role === "patient" ? normalize(formData.dateOfBirth) : null,
        blood_group:
          formData.role === "patient" ? normalize(formData.bloodGroup) : null,
        address: formData.role === "patient" ? normalize(formData.address) : null,
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

      const response = await userApi.googleOnboarding(payload);
      sessionStorage.removeItem("googleOnboarding");

      if (response.data.pendingVerification) {
        setSuccess(response.data.message);
        return;
      }

      setSession({ token: response.data.token, user: response.data.user });
      redirectForUser(response.data.user);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to complete Google onboarding."));
    } finally {
      setLoading(false);
    }
  };

  if (!onboardingToken) {
    return (
      <AuthLayout
        heroTone="signup"
        heroTitle="Complete your Google sign-up."
        heroText="Google confirmed your email. Start again if the onboarding session has expired."
      >
        <section className="auth-card">
          <h2>Session Expired</h2>
          <p className="card-subtitle">
            Please return to login and continue with Google again.
          </p>
          <Link className="btn-main" to="/login">
            Back to Login
          </Link>
        </section>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heroTone="signup"
      heroTitle="Choose how you want to use HealthLog."
      heroText="Your Google email is verified. Add the role-specific details needed to create your account."
    >
      <section className="auth-card auth-card-wide">
        <h2>Complete Google Sign-up</h2>
        <p className="card-subtitle">
          {googleProfile?.name} · {googleProfile?.email}
        </p>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="form-grid">
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

            <div className="form-columns">
              <label>
                Phone Number
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Phone Number"
                  required
                />
              </label>
              <label>
                Gender
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            {formData.role === "patient" && (
              <>
                <div className="form-columns">
                  <label>
                    Date of Birth
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleChange("dateOfBirth", e.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    Blood Group
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) =>
                        handleChange("bloodGroup", e.target.value)
                      }
                      required
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </label>
                </div>

                <label>
                  Address
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Address"
                    required
                  />
                </label>

                <label>
                  Emergency Contact
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      handleChange("emergencyContact", e.target.value)
                    }
                    placeholder="Emergency Contact"
                    required
                  />
                </label>
              </>
            )}

            {formData.role === "doctor" && (
              <>
                <div className="form-columns">
                  <label>
                    Specialization
                    <input
                      type="search"
                      list="google-doctor-specialization-options"
                      value={formData.specialization}
                      onChange={(e) =>
                        handleChange("specialization", e.target.value)
                      }
                      placeholder="Search and choose a specialization"
                      required
                    />
                    <datalist id="google-doctor-specialization-options">
                      {specializations.map((spec) => (
                        <option key={spec.name} value={spec.name}>
                          {spec.description}
                        </option>
                      ))}
                    </datalist>
                  </label>
                  <label>
                    License Number
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        handleChange("licenseNumber", e.target.value)
                      }
                      placeholder="License Number"
                      required
                    />
                  </label>
                </div>

                <div className="form-columns">
                  <label>
                    Hospital Name
                    <input
                      type="text"
                      value={formData.hospitalName}
                      onChange={(e) =>
                        handleChange("hospitalName", e.target.value)
                      }
                      placeholder="Hospital Name"
                      required
                    />
                  </label>
                  <label>
                    Experience Years
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
                  </label>
                </div>
              </>
            )}

            <button type="submit" className="btn-main" disabled={loading}>
              {loading ? "Creating Account..." : "Complete Sign-up"}
            </button>
          </form>
        )}

        {success && (
          <p className="auth-footnote">
            <Link to="/login">Back to login</Link>
          </p>
        )}
      </section>
    </AuthLayout>
  );
};

export default GoogleOnboarding;
