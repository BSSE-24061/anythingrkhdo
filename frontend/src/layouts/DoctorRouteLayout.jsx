import { useMemo } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { clearSession, getStoredUser } from "../utils/session";

const DOCTOR_NAV = [
  ["Dashboard", "/doctor/dashboard"],
  ["Appointments", "/doctor/appointments"],
  ["Vitals", "/doctor/vitals"],
  ["Patients", "/doctor/patients"],
  ["Prescriptions", "/doctor/prescriptions"],
  ["Medication Logs", "/doctor/medication-logs"],
  ["Medical History", "/doctor/history"],
  ["Availability", "/doctor/availability"],
  ["Chat", "/doctor/chat"],
  ["Blogs", "/doctor/blogs"],
  ["Forum", "/doctor/forum"],
];

const DoctorRouteLayout = () => {
  const user = useMemo(() => getStoredUser(), []);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div
      className="patient-theme"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
      }}
    >
      <aside
        style={{
          width: 248,
          background: "#ffffff",
          borderRight: "1px solid #e6edf5",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#2563eb",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 16,
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
            }}
          >
            ✓
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 14 }}>
              MediCare
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "#64748b",
                fontWeight: 800,
              }}
            >
              DOCTOR
            </div>
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 8,
          }}
        >
          {DOCTOR_NAV.map(([label, path]) => {
            const active =
              location.pathname === path ||
              (path !== "/doctor/dashboard" &&
                location.pathname.startsWith(path));
            return (
              <Link
                key={path + label}
                to={path}
                style={{
                  padding: "12px 12px",
                  borderRadius: 12,
                  color: active ? "#1d4ed8" : "#334155",
                  fontWeight: 800,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: active ? "rgba(37, 99, 235, 0.08)" : "transparent",
                  border: active
                    ? "1px solid rgba(37, 99, 235, 0.25)"
                    : "1px solid transparent",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: active ? "#2563eb" : "#cbd5e1",
                  }}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            border: "1px solid #e6edf5",
            borderRadius: 16,
            padding: 12,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Doctor
          </div>
          <div
            style={{
              fontWeight: 900,
              color: "#0f172a",
              marginTop: 6,
              fontSize: 14,
            }}
          >
            {user.name || "Doctor"}
          </div>

          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px",
              borderRadius: 12,
              border: "1px solid #fee2e2",
              background: "#fef2f2",
              color: "#dc2626",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorRouteLayout;
