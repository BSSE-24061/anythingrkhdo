import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, userApi } from "../../utils/apiHelper";
import AuthLayout from "../../layouts/AuthLayout";
import { setSession } from "../../utils/session";

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

  const handleGoogleResponse = async (response) => {
    setError("");
    setLoading(true);
    try {
      const res = await userApi.googleLogin({ credential: response.credential });
      if (res.data.requiresOnboarding) {
        // Save to sessionStorage as backup
        sessionStorage.setItem("googleOnboarding", JSON.stringify(res.data));
        navigate("/google-onboarding", { state: res.data });
      } else {
        setSession({ token: res.data.token, user: res.data.user });
        navigate("/dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Google sign-in failed."));
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
        document.getElementById("google-button"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, []);

  return (
    <AuthLayout
      heroTitle="Connected care for patients, doctors, and admin teams."
      heroText="Log in to manage appointments, respond to messages, moderate content, and track clinical activity."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0f172a" }}>Welcome Back</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14, fontWeight: 600 }}>Sign in to your account.</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "1px solid #fee2e2" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: "#475569", marginLeft: 4 }}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: "14px 16px", borderRadius: 12, border: "2px solid #e6edf5", background: "#f8fafc", fontSize: 15, outline: "none", color: "#0f172a", fontWeight: 600 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: "#475569", marginLeft: 4 }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "14px 16px", borderRadius: 12, border: "2px solid #e6edf5", background: "#f8fafc", fontSize: 15, outline: "none", color: "#0f172a", fontWeight: 600 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: "#475569", marginLeft: 4 }}>Account Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 12, border: "2px solid #e6edf5", background: "#f8fafc", fontSize: 15, outline: "none", color: "#0f172a", fontWeight: 800, appearance: "none" }}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="consultant">Consultant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: 8, padding: "16px", borderRadius: 12, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }}
          >
            {loading ? "Signing In..." : "Log In"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "8px 0" }}>
          <div style={{ height: 1, background: "#e6edf5", flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Or continue with</span>
          <div style={{ height: 1, background: "#e6edf5", flex: 1 }} />
        </div>

        <div id="google-button" style={{ width: "100%", display: "flex", justifyContent: "center" }}></div>

        <p style={{ textAlign: "center", margin: 0, fontSize: 14, color: "#64748b", fontWeight: 600 }}>
          Don't have an account? <Link to="/signup" style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}>Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
