import { useEffect, useMemo, useState } from "react";
import api from "../../utils/apiHelper";
import { formatIslamabadDateTime } from "../../utils/dateTime";


const Overview = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id) return;

      try {
        const [apptRes, alertRes, notifRes] = await Promise.all([
          api.get(`/appointments/patient/${user.id}`),
          api.get(`/vitals/alerts/${user.id}`),
          api.get(`/notifications/user/${user.id}`),
        ]);

        setAppointments(apptRes.data || []);
        setAlerts(alertRes.data || []);
        setNotifications(notifRes.data || []);
      } catch (err) {
        console.log("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id]);

  if (loading) {
    return (
      <div style={{ color: "#64748b", fontWeight: 800 }}>Loading Dashboard...</div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e6edf5",
          borderRadius: 16,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 950 }}>
            Welcome back, {user?.name || "Patient"}
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 950,
              letterSpacing: "0.14em",
              color: "#2563eb",
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.25)",
              padding: "8px 12px",
              borderRadius: 999,
            }}
          >
            PATIENT
          </span>
        </div>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontWeight: 700 }}>
          Here is your health overview
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          {[
            { title: "Appointments", value: appointments.length },
            { title: "Alerts", value: alerts.length },
            { title: "Notifications", value: notifications.length },
          ].map((c) => (
            <div
              key={c.title}
              style={{
                background: "#ffffff",
                border: "1px solid #e6edf5",
                borderRadius: 14,
                padding: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: "#475569", fontWeight: 900, fontSize: 12 }}>{c.title}</div>
                <div style={{ color: "#0f172a", fontWeight: 1000, fontSize: 18, marginTop: 6 }}>
                  {c.value}
                </div>
              </div>
              <div style={{ color: "#2563eb", fontWeight: 1000 }}>＋</div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e6edf5",
          borderRadius: 16,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: 14, fontWeight: 950 }}>
            Upcoming Appointments
          </h3>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {appointments.length === 0 ? (
            <div style={{ color: "#64748b", fontWeight: 800, fontSize: 13 }}>No appointments found</div>
          ) : (
            appointments.map((appt) => (
              <div
                key={appt.appointment_id}
                style={{
                  border: "1px solid #e6edf5",
                  borderRadius: 14,
                  padding: 14,
                  background: "#fff",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ color: "#0f172a", fontWeight: 950, fontSize: 13 }}>
                  Doctor ID: {appt.doctor_user_id}
                </div>
                <div style={{ color: "#475569", fontWeight: 850, fontSize: 12 }}>
                  Date: {formatIslamabadDateTime(appt.scheduled_at)}
                </div>
                <div style={{ color: "#475569", fontWeight: 850, fontSize: 12 }}>
                  Status: {appt.status}
                </div>
                {appt.reason && (
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                    Reason: {appt.reason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Overview;
