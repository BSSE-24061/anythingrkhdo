import { useEffect, useState, useMemo } from "react";
import { appointmentApi, notificationApi, vitalApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";
import { formatIslamabadDateTime } from "../../utils/dateTime";

const STATUS_PILL_STYLES = {
  confirmed: {
    background: "rgba(59, 130, 246, 0.12)",
    color: "#1d4ed8",
  },
  pending: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#b45309",
  },
  completed: {
    background: "rgba(34, 197, 94, 0.14)",
    color: "#15803d",
  },
  cancelled: {
    background: "rgba(239, 68, 68, 0.14)",
    color: "#b91c1c",
  },
};

const DoctorDashboard = () => {
  const user = useMemo(() => getStoredUser(), []);
  const userId = user?.id;
  const [stats, setStats] = useState({ appointments: [], patients: [], alerts: [], notifications: [] });

  const load = async () => {
    if (!userId) return;
    try {
      const [appointmentsRes, alertsRes, notificationsRes] = await Promise.all([
        appointmentApi.byDoctor(userId),
        vitalApi.alerts(userId),
        notificationApi.list(userId),
      ]);

      const appointments = appointmentsRes.data || [];
      setStats({
        appointments,
        patients: patientsFromAppointments(appointments),
        alerts: alertsRes.data || [],
        notifications: notificationsRes.data || [],
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const upcoming = stats.appointments.filter((item) => item.status !== "completed").slice(0, 5);
  const unreadNotifications = stats.notifications.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Good morning, Dr. {user.name || "Doctor"}!
        </h1>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontWeight: 600, fontSize: 18 }}>
          Track appointments, patient activity, and important alerts
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Appointments</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{stats.appointments.length}</div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>📅</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Patients</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{stats.patients.length}</div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>👥</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Alerts</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{stats.alerts.length}</div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>⚠️</div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Notifications</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{unreadNotifications}</div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>🔔</div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Left Column */}
        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18 }}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Upcoming Appointments</h3>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {upcoming.length > 0 ? (
                upcoming.map((appointment) => (
                  <div key={appointment.appointment_id} style={{ border: "1px solid #e6edf5", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.22)", display: "grid", placeItems: "center", color: "#2563eb", fontWeight: 900 }}>👤</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{appointment.patient_name || "Patient"}</div>
                        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>{appointment.reason || "No reason provided"}</div>
                        <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11, marginTop: 6 }}>{formatIslamabadDateTime(appointment.scheduled_at)}</div>
                      </div>
                    </div>
                    <span style={{ padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 11, ...(STATUS_PILL_STYLES[appointment.status] || STATUS_PILL_STYLES.pending) }}>{appointment.status || "pending"}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No upcoming appointments</div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: "grid", gap: 16 }}>
          <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18, height: "fit-content", position: "sticky", top: 20 }}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Recent Alerts</h3>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {stats.alerts.length > 0 ? (
                stats.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.alert_id} style={{ border: "1px solid #e6edf5", borderRadius: 14, padding: 12, background: "#fff", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 18, lineHeight: 1 }}>⚠️</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{alert.alert_type}</div>
                      <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, marginTop: 4 }}>{alert.message}</div>
                      <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11, marginTop: 6 }}>{alert.severity}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No recent alerts</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
