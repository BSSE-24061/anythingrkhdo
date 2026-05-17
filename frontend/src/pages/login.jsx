import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, userApi } from "../utils/apiHelper";
import AuthLayout from "../layouts/AuthLayout";
import { setSession } from "../utils/session";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await userApi.login({
        email,
        password,
        role: role.toLowerCase(),
      });

      setSession({ token: response.data.token, user: response.data.user });
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heroTitle="Connected care for patients, doctors, and admin teams."
      heroText="Log in to manage appointments, respond to messages, moderate content, and track clinical activity."
    >
      <section className="auth-card">
        <h2>Welcome Back</h2>
        <p className="card-subtitle">Select your role and sign in.</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleLogin} className="form-grid">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="consultant">Consultant</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" className="btn-main" disabled={loading}>
            {loading ? "Signing In..." : "Log In"}
          </button>
        </form>

        <p className="auth-footnote">
          Need a patient or doctor account? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </AuthLayout>
  );
};

export default Login;
